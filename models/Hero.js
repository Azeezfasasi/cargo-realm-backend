const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
  headline: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }, // Store as base64 or URL
  alt: { type: String, required: true },
  cta: { type: String, required: true },
  buttonText: { type: String, required: true },
  order: { type: Number, default: 0 }, // For ordering slides
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Hero', heroSchema);
