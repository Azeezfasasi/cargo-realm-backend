const mongoose = require('mongoose');

const smsSettingsSchema = new mongoose.Schema({
  // Enable/Disable SMS notifications globally
  enabled: { type: Boolean, default: true },

  // Enable for specific events
  sendOnCreation: { type: Boolean, default: true },
  sendOnStatusUpdate: { type: Boolean, default: true },
  sendOnDelivery: { type: Boolean, default: true },
  sendOnCancellation: { type: Boolean, default: true },
  sendOnException: { type: Boolean, default: true },

  // SMS Sender Configuration
  senderName: { type: String, default: 'CargoRealm' },
  apiToken: { type: String, default: null }, // BulkSMS API token
  apiBaseUrl: { type: String, default: 'https://www.bulksmsngeria.com/api/v2' },

  // Notification Recipients
  notifyBothPartiesOnCreation: { type: Boolean, default: true },
  notifyRecipientOnStatusChange: { type: Boolean, default: true },
  notifySenderOnStatusChange: { type: Boolean, default: true },
  adminPhoneNumbers: [String], // Admin phone numbers to notify on exceptions

  // Rate limiting
  maxSMSPerDay: { type: Number, default: 10000 },
  maxSMSPerMonth: { type: Number, default: 100000 },

  // Logging
  logAllSMS: { type: Boolean, default: true },

  // Created/Updated timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('SMSSettings', smsSettingsSchema);
