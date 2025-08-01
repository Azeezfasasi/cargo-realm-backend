const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const sendMail = require('../utils/mailer');

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
    const { name, email, password, role, phoneNumber, gender } = req.body;
    
    console.log('--- Incoming Register Request ---');
    console.log('Raw req.body:', req.body);
    console.log('Registering email:', email);

    let user = await User.findOne({ email });
    if (user) {
      console.log('Registration failed: User already exists for email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // --- REMOVE THIS LINE: const hashedPassword = await bcrypt.hash(password, 10); ---
    // The pre('save') hook in the User model will handle hashing automatically.
    
    user = new User({ name, email, password, role, phoneNumber, gender }); // Pass plain text password
    await user.save(); // The pre('save') hook will hash 'password' before saving

    console.log('Registration successful: User saved to DB:', user.email);
    console.log('Registered User (after save, with hashed password):', user.password); // Verify it's hashed
    
    // Optional: Send welcome email
    await sendMail(email, 'Welcome to CAC Lightway', `<p>Hi ${name}, welcome to CAC Lightway Assembly!</p>`);
    
    // If you want to log in the user immediately after registration and send a token:
    const token = generateToken(user._id, user.role);
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
    console.log('--- Incoming Login Request ---');
    console.log('Raw req.body:', req.body);
    
    const { email, password } = req.body;
    
    console.log('Extracted email:', email, 'Type:', typeof email);
    console.log('Extracted password:', password, 'Type:', typeof password);
    
     // Add a quick type check before Mongoose interaction
    if (typeof email !== 'string' || typeof password !== 'string') {
      console.error('Validation Error: Email or password is not a string. Received types:', typeof email, typeof password);
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
    console.log('--- LOGIN CONTROLLER ---');
    console.log('Token generated for user:', user.email, 'Role:', user.role);
    console.log('JWT_SECRET used for signing:', process.env.JWT_SECRET); // DEBUG: Log the secret used for signing
    res.json({ token, user });
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

    console.log('editUser: Request body:', updates); // DEBUG: See what's coming in
    console.log('editUser: User ID from params:', userId); // DEBUG: See param ID
    console.log('editUser: Authenticated user ID:', req.user?.id); // DEBUG: See authenticated user ID
    console.log('editUser: Authenticated user role:', req.user?.role); // DEBUG: See authenticated user role

    if (!req.user || !req.user.id) {
      console.error('editUser: req.user or req.user.id is missing. Authentication likely failed.'); // DEBUG
      return res.status(401).json({ message: 'Not authenticated. Please log in to update profile.' });
    }

    // Ensure user can only edit their own profile unless they are admin
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      console.error(`editUser: User ${req.user.id} attempted to edit profile of ${userId} without admin role.`); // DEBUG
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
      console.error(`editUser: User with ID ${userId} not found for update.`); // DEBUG
      return res.status(404).json({ message: 'User not found for update.' });
    }

    console.log('editUser: Profile updated successfully for user:', user.email); // DEBUG
    const userWithoutSensitiveData = user.toObject();
    delete userWithoutSensitiveData.password;
    delete userWithoutSensitiveData.resetToken;
    delete userWithoutSensitiveData.resetTokenExpiry;

    res.json(userWithoutSensitiveData);
  } catch (err) {
    console.error('Error editing user profile:', err.message, err.stack); // DEBUG: Log stack for more info
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
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Function to change any user's password by admin/pastor
exports.changeUserPasswordByAdmin = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Find the user by email
    const userToUpdate = await User.findOne({ email });
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userToUpdate.password = hashedPassword;
    await userToUpdate.save();

    // Optional: Send a notification email to the user whose password was changed
    await sendMail(userToUpdate.email, 'Your Password Has Been Changed',
      `<p>Dear ${userToUpdate.name},</p>
       <p>Your password for CAC Lightway account has been changed by an administrator/pastor.</p>
       <p>If you did not request this change, please contact support immediately.</p>
       <p>Thank you,</p>
       <p>CAC Lightway Team</p>`
    );

    res.json({ message: 'User password updated successfully.' });

  } catch (err) {
    console.error('Error changing user password by admin:', err.message);
    res.status(500).json({ message: 'Server error changing password.' });
  }
};

