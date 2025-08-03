const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional: who sent the reply
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const shipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  recipientName: String,
  recipientPhone: String,
  recipientAddress: String,
  origin: String,
  destination: String,
  status: {
    type: String,
    enum: ['pending', 'in-transit', 'delivered', 'cancelled', 'processing', 'pickup-scheduled', 'out-for-delivery', 'picked-up', 'arrived-at-hub', 'departed-from-hub', 'on-hold', 'customs-clearance', 'Awaiting Pickup', 'failed-delivery-attempt', 'Awaiting Delivery'
    ],
    default: 'pending',
  },
  weight: Number,
  shipmentDate: Date,
  deliveryDate: Date,
  notes: String,
  replies: [replySchema],
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
