const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
  // SMS Details
  messageId: String, // BulkSMS message ID
  phoneNumber: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed', 'pending', 'delivered'], default: 'pending' },

  // Related Entity
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: false },
  trackingNumber: String,

  // Event Type
  eventType: {
    type: String,
    enum: [
      'SHIPMENT_CREATED_SENDER',
      'SHIPMENT_CREATED_RECIPIENT',
      'SHIPMENT_STATUS_UPDATED',
      'SHIPMENT_OUT_FOR_DELIVERY',
      'SHIPMENT_DELIVERED',
      'SHIPMENT_DELAYED',
      'SHIPMENT_CANCELLED',
      'SHIPMENT_EXCEPTION',
      'CUSTOM',
    ],
    required: true,
  },

  // Recipient Type
  recipientType: { type: String, enum: ['sender', 'receiver', 'admin', 'other'], required: true },

  // Response from API
  apiResponse: mongoose.Schema.Types.Mixed, // Store complete API response

  // Error details (if any)
  error: String,

  // Cost information
  creditsCost: Number,
  currency: { type: String, default: 'NGN' },

  // Timestamps
  sentAt: { type: Date, default: Date.now },
  deliveredAt: Date,

  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// Index for faster queries
smsLogSchema.index({ phoneNumber: 1 });
smsLogSchema.index({ shipmentId: 1 });
smsLogSchema.index({ trackingNumber: 1 });
smsLogSchema.index({ status: 1 });
smsLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model('SMSLog', smsLogSchema);
