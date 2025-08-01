const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  isSubscribed: { type: Boolean, default: true }
}, { timestamps: true });

const newsletterSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  content: { type: String, required: true },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  Newsletter: mongoose.model('Newsletter', newsletterSchema),
  Subscriber: mongoose.model('Subscriber', subscriberSchema)
};
