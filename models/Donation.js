const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  name: { type: String },
  amount: { type: Number, required: true },
  email: { type: String },
  receipt: { type: String },
  phoneNumber: { type: String },
  address: { type: String },
  message: { type: String }, 
  company: { type: String },
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
