const mongoose = require('mongoose');

const contactFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new' }, // Added 'replied' status
  repliedBy: { // NEW: User who replied
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  repliedAt: { // NEW: Timestamp of reply
    type: Date,
    default: null
  },
}, { timestamps: true });

module.exports = mongoose.model('ContactForm', contactFormSchema);
