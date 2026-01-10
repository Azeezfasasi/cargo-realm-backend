const mongoose = require('mongoose');

const shipmentStatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  color: {
    type: String,
    default: '#6B7280', // default gray
    trim: true
  },
  category: {
    type: String,
    enum: ['pending', 'processing', 'in-transit', 'delivered', 'failed', 'other'],
    default: 'other'
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ShipmentStatus', shipmentStatusSchema);
