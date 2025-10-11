const mongoose = require('mongoose');

// Define a new schema for the tracking history entries
const trackingHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  location: { type: String, required: false }, // Optional
  timestamp: { type: Date, default: Date.now },
});

const replySchema = new mongoose.Schema({
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional: who sent the reply
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const shipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  senderName: String,
  senderPhone: String,
  senderEmail: String,
  senderAddress: String,
  recipientName: String,
  receiverEmail: String,
  recipientPhone: String,
  recipientAddress: String,
  origin: String,
  destination: String,
  status: {
    type: String,
    enum: ['pending', 'in-transit', 'delivered', 'cancelled', 'processing', 'pickup-scheduled', 'out-for-delivery', 'picked-up', 'arrived-at-hub', 'departed-from-hub', 'on-hold', 'customs-clearance', 'Awaiting Pickup', 'failed-delivery-attempt', 'Awaiting Delivery', 'Arrived Carrier Connecting facility', 'Departed CARGO realm facility (Nig)', 'Arrived nearest airport', 'Shipment is Delayed', 'Delivery date not available', 'Available for pick up,check phone for instructions', 'Processed in Lagos Nigeria', 'Pending Carrier lift', 'Scheduled to depart on the next movement', 'Received from flight', 'Package is received and accepted by airline', 'Customs clearance completed', 'Delivery is booked', 'Arrived at an international sorting facility and will be ready for delivery soon'
    ],
    default: 'pending',
  },
  items: [String],
  weight: Number,
  length: String,
  width: String,
  height: String,
  breadth: String,
  volume: Number,
  cost: Number,
  shipmentDate: Date,
  deliveryDate: Date,
  notes: String,
  shipmentPieces: String,
  shipmentType: String,
  shipmentPurpose: String,
  shipmentFacility: String,
  trackingHistory: [trackingHistorySchema],
  replies: [replySchema],
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
