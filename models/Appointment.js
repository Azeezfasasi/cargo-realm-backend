const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please fill a valid email address']
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String, // Store as a string, e.g., "10:00 AM"
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'rescheduled', 'completed'],
    default: 'pending'
  },
  rescheduledFrom: { 
    date: { type: Date },
    time: { type: String }
  },
  bookedBy: { // If booked by a logged-in user
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cancelledBy: { // If cancelled by admin/pastor
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('Appointment', appointmentSchema);
