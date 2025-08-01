const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventTitle: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String },
  duration: { type: String },
  time: { type: String },
  date: { type: Date, required: true }, // This will be the specific date for each instance
  address: { type: String },
  organizer: { type: String },
  coOrganizer: { type: String },
  status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },

  isRecurring: { type: Boolean, default: false },// recurrenceType: 'daily', 'weekly', 'monthly_date', 'monthly_day'
  recurrenceType: { type: String, enum: ['daily', 'weekly', 'monthly_date', 'monthly_day', null], default: null },
  recurrenceEndDate: { type: Date, default: null }, // recurrenceDetails for 'monthly_day' (e.g., 'first monday', 'last friday')
  recurrenceDetails: {
    dayOfWeek: { type: String, enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', null], default: null },
    ordinal: { type: String, enum: ['first', 'second', 'third', 'fourth', 'last', null], default: null }
  },
  // If an event is part of a series, this points to the original event (optional, but good for management)
  parentEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);

