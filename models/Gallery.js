const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  caption: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicId: { type: String },
  status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
