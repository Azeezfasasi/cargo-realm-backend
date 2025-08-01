const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  date: { type: Date, default: Date.now }
});

const prayerRequestSchema = new mongoose.Schema({
  request: { type: String, required: true },
  category: {
    type: String,
    enum: ['General', 'Job Opportunity', 'Finances', 'Protection', 'Favour', 'Healing', 'Guidance', 'Family', 'Thanksgiving', 'Traveling'],
    default: 'General'
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: { type: Number, default: 0 },
  prayCounter: { type: Number, default: 0 },
  replies: [replySchema],
  status: { type: String, enum: ['pending', 'answered', 'archived'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('PrayerRequest', prayerRequestSchema);
