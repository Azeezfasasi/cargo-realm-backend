const PrayerRequest = require('../models/PrayerRequest');
const sendMail = require('../utils/mailer');
const User = require('../models/User');

exports.sendPrayerRequest = async (req, res) => {
  try {
    const { request, category } = req.body;
    const prayer = new PrayerRequest({ request, category, user: req.user._id });
    await prayer.save();
    // Email to admin and user
    const user = await User.findById(req.user._id);
    await sendMail(user.email, 'Prayer Request Received', `<p>Your prayer request has been received (Category: ${category}).</p>`);
    await sendMail(process.env.EMAIL_USER, 'New Prayer Request', `<p>New prayer request from ${user.name} (Category: ${category}): ${request}</p>`);
    res.status(201).json(prayer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPrayerRequests = async (req, res) => {
  try {
    // Populate the main 'user' field for the prayer request
    // AND populate the 'user' field within the 'replies' array
    const prayers = await PrayerRequest.find()
      .populate('user', 'name email') // Populates the user who made the main request
      .populate('replies.user', 'name email'); // <-- NEW: Populates the user who made each reply
    res.json(prayers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editPrayerRequest = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!prayer) return res.status(404).json({ message: 'Prayer request not found' });
    res.json(prayer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePrayerRequest = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndDelete(req.params.id);
    if (!prayer) return res.status(404).json({ message: 'Prayer request not found' });
    res.json({ message: 'Prayer request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePrayerStatus = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!prayer) return res.status(404).json({ message: 'Prayer request not found' });
    res.json(prayer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.likePrayerRequest = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    if (!prayer) return res.status(404).json({ message: 'Prayer request not found' });
    res.json(prayer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.prayForRequest = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndUpdate(req.params.id, { $inc: { prayCounter: 1 } }, { new: true });
    if (!prayer) return res.status(404).json({ message: 'Prayer request not found' });
    // Email to admin and user
    const user = await User.findById(prayer.user);
    await sendMail(user.email, 'Someone Prayed for You', `<p>Someone just prayed for your request.</p>`);
    await sendMail(process.env.EMAIL_USER, 'Prayer Activity', `<p>Someone prayed for a request by ${user.name}.</p>`);
    res.json(prayer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.replyToPrayerRequest = async (req, res) => {
  try {
    const { message } = req.body;
    const prayer = await PrayerRequest.findById(req.params.id);
    if (!prayer) return res.status(404).json({ message: 'Prayer request not found' });
    prayer.replies.push({ user: req.user._id, message });
    await prayer.save();
    res.json(prayer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
