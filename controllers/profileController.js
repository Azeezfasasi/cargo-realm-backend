const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const sendMail = require('../utils/mailer');

const STAFF_ROLES = ['admin', 'employee'];
const ALL_ROLES = ['admin', 'employee', 'client', 'agent'];
const SENSITIVE_FIELDS = '-password -resetToken -resetTokenExpiry';

const publicUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.resetToken;
  delete obj.resetTokenExpiry;
  return obj;
};

const escapeHtml = (str = '') => String(str)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// The /register route is public. If the request carries a valid staff token, the caller is
// creating an account for someone else and may choose its role (employees can't create staff).
const getRequester = async (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    return await User.findById(decoded.id).select('role');
  } catch {
    return null;
  }
};

// Helper function to generate JWT token
const generateToken = (id, role) => {
  // Ensure process.env.JWT_SECRET is correctly loaded and used here
  // The secret used here MUST match the one in your .env file
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE, // e.g., '7d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, gender, homeAddress, country, state } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Public sign-ups are always clients. Staff creating an account may pick the role;
    // only admins may create admins or employees.
    const requester = await getRequester(req);
    let finalRole = 'client';
    if (requester && STAFF_ROLES.includes(requester.role) && ALL_ROLES.includes(role)) {
      if (requester.role === 'admin' || !STAFF_ROLES.includes(role)) finalRole = role;
      else return res.status(403).json({ message: 'Only an admin can create admin or employee accounts.' });
    }

    user = new User({ name, email, password, role: finalRole, phoneNumber, gender, homeAddress, country, state });
    await user.save(); // The pre('save') hook hashes the password

    // Optional: Send welcome email
    await sendMail(email, 'Welcome to Cargo Realm and Logistics', `<p>Hi ${escapeHtml(name)}, welcome to Cargo Realm and Logistics!</p>`);
    
    // Self sign-ups are logged in straight away; staff creating an account get no token for it
    const createdByStaff = requester && STAFF_ROLES.includes(requester.role);
    const token = createdByStaff ? undefined : generateToken(user._id, user.role);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { 
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        gender: user.gender
      }
    });

  } catch (err) {
    console.error('Registration Error:', err.message, err.stack); 
    res.status(500).json({ message: 'Server error during registration: ' + err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Never log the request body here: it contains the plain-text password
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input: Email and password must be strings.' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (user.isDisabled || user.isSuspended) {
      console.log('Login failed: Account disabled or suspended for user:', email);
      return res.status(403).json({ message: 'Account disabled or suspended' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();
    const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;
    await sendMail(email, 'Password Reset', `<p>Reset your password: <a href='${resetLink}'>Click here</a></p>`);
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('getMe: req.user or req.user.id is missing. Authentication failed.'); // DEBUG
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }
    const user = await User.findById(req.user.id).select('-password -resetToken -resetTokenExpiry');
    if (!user) {
      console.error(`getMe: User with ID ${req.user.id} not found in DB.`); // DEBUG
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Error fetching user profile:', err.message); // DEBUG
    res.status(500).json({ message: 'Server error fetching profile: ' + err.message });
  }
};

exports.editUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    const userId = req.params.id;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authenticated. Please log in to update profile.' });
    }

    // Fields never set through this endpoint
    ['_id', 'resetToken', 'resetTokenExpiry', 'createdAt', 'updatedAt'].forEach((f) => delete updates[f]);

    const isSelf = String(userId) === String(req.user.id);
    const actorRole = req.user.role;
    if (isSelf) {
      // Nobody changes their own role or account status (prevents self-promotion to admin)
      ['role', 'isDisabled', 'isSuspended'].forEach((f) => delete updates[f]);
    } else if (actorRole === 'employee') {
      // Employees manage clients and agents only, and can't promote anyone to staff
      const target = await User.findById(userId).select('role');
      if (!target) return res.status(404).json({ message: 'User not found for update.' });
      if (STAFF_ROLES.includes(target.role)) {
        return res.status(403).json({ message: 'Only an admin can edit admin or employee accounts.' });
      }
      if (updates.role !== undefined && !['client', 'agent'].includes(updates.role)) {
        return res.status(403).json({ message: 'Only an admin can give a user the admin or employee role.' });
      }
      delete updates.password; // use the change-password tool instead
    } else if (actorRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this user profile.' });
    }

    // Handle password change if provided (ensure it's not empty string if not intended)
    if (updates.password) {
        if (updates.password.trim() === '') {
            delete updates.password; // Don't try to hash an empty password
        } else {
            updates.password = await bcrypt.hash(updates.password, 10);
        }
    }

    // Handle profileImageUrl clearing: if frontend sends empty string, set to null
    if (updates.profileImageUrl === '') {
      updates.profileImageUrl = null;
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found for update.' });
    }

    res.json(publicUser(user));
  } catch (err) {
    console.error('Error editing user profile:', err.message);
    if (err.code === 11000) return res.status(400).json({ message: 'That email address is already in use.' });
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error updating profile: ' + err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.disableUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isDisabled: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User disabled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User suspended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Never send password hashes or reset tokens to the browser
    const users = await User.find().select(SENSITIVE_FIELDS).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Function to change any user's password by admin/pastor
exports.changeUserPasswordByAdmin = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (typeof email !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'A valid email and a new password of at least 6 characters are required.' });
    }

    // Find the user by email
    const userToUpdate = await User.findOne({ email: email.trim() });
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Employees can't take over staff accounts by resetting their passwords
    if (req.user.role !== 'admin' && STAFF_ROLES.includes(userToUpdate.role)) {
      return res.status(403).json({ message: 'Only an admin can change the password of an admin or employee.' });
    }

    // Set the plain password; the pre('save') hook hashes it (hashing here too made it unusable)
    userToUpdate.password = newPassword;
    await userToUpdate.save();

    // Optional: Send a notification email to the user whose password was changed
    await sendMail(userToUpdate.email, 'Your Password Has Been Changed',
      `<p>Hi ${escapeHtml(userToUpdate.name)},</p>
       <p>Your password for Cargo Realm and Logistics account has been changed by an administrator.</p>
       <p>If you did not request this change, please contact support immediately.</p>
       <p>Thank you,</p>
       <p>Cargo Realm and Logistics Team</p>`
    );

    res.json({ message: 'User password updated successfully.' });

  } catch (err) {
    console.error('Error changing user password by admin:', err.message);
    res.status(500).json({ message: 'Server error changing password.' });
  }
};

