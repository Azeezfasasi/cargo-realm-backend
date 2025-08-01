const { Newsletter, Subscriber } = require('../models/Newsletter');
const sendMail = require('../utils/mailer');

exports.sendNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;
    const newsletter = new Newsletter({ subject, content, sentBy: req.user._id });
    await newsletter.save();
    // Send to all subscribers
    const subscribers = await Subscriber.find({ isSubscribed: true });
    for (const sub of subscribers) {
      await sendMail(sub.email, subject, content);
    }
    res.status(201).json(newsletter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllNewsletters = async (req, res) => {
  try {
    // Populate the 'sentBy' field with the user's name and email
    const newsletters = await Newsletter.find().populate('sentBy', 'name email');
    res.json(newsletters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!newsletter) return res.status(404).json({ message: 'Newsletter not found' });
    res.json(newsletter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findByIdAndDelete(req.params.id);
    if (!newsletter) return res.status(404).json({ message: 'Newsletter not found' });
    res.json({ message: 'Newsletter deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.subscribe = async (req, res) => {
  try {
    const { email, name } = req.body;
    let subscriber = await Subscriber.findOne({ email });
    if (subscriber) {
      subscriber.isSubscribed = true;
      await subscriber.save();
      return res.json({ message: 'Subscribed again' });
    }
    subscriber = new Subscriber({ email, name });
    await subscriber.save();
    res.status(201).json(subscriber);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    subscriber.isSubscribed = false;
    await subscriber.save();
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find();
    res.json(subscribers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json(subscriber);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json({ message: 'Subscriber deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Function to send email to a single subscriber
exports.sendEmailToSubscriber = async (req, res) => {
  try {
    const { id } = req.params; // Subscriber ID
    const { subject, content } = req.body;

    const subscriber = await Subscriber.findById(id);
    if (!subscriber || !subscriber.isSubscribed) {
      return res.status(404).json({ message: 'Subscriber not found or not subscribed.' });
    }

    await sendMail(subscriber.email, subject, content);
    res.json({ message: `Email sent to ${subscriber.email} successfully!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};