const mongoose = require('mongoose');

// Define a new schema for the tracking history entries
const trackingHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  location: { type: String, required: false }, // Optional
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // staff member who set this status
});

const replySchema = new mongoose.Schema({
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional: who sent the reply
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: ['cash', 'bank-transfer', 'card', 'pos', 'other'], default: 'cash' },
  reference: { type: String, trim: true }, // e.g. bank transfer reference
  note: { type: String, trim: true },
  paidAt: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: true, timestamps: true });

const proofOfDeliverySchema = new mongoose.Schema({
  receivedBy: { type: String, trim: true }, // name of the person who received the shipment
  notes: { type: String, trim: true },
  photoUrl: String, // Cloudinary URL (signed waybill / package at delivery)
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedAt: { type: Date, default: Date.now },
}, { _id: false });

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
  deliveryDate: Date, // estimated delivery date
  deliveredAt: Date, // set automatically when status becomes "delivered"
  proofOfDelivery: proofOfDeliverySchema,
  // Payments: amountPaid and paymentStatus are derived from `payments` and `cost`
  payments: [paymentSchema],
  amountPaid: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  notes: String,
  shipmentPieces: String,
  shipmentType: String,
  shipmentPurpose: String,
  shipmentFacility: String,
  trackingHistory: [trackingHistorySchema],
  replies: [replySchema],
  qrCodeUrl: { type: String, default: null }, // Stores the QR code URL
}, { timestamps: true });

// Recompute amountPaid/paymentStatus from the payments list and the shipment cost
shipmentSchema.methods.recalculatePayments = function () {
  const paid = (this.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  this.amountPaid = Math.round(paid * 100) / 100;
  const cost = Number(this.cost) || 0;
  if (this.amountPaid <= 0) this.paymentStatus = 'unpaid';
  else if (cost <= 0 || this.amountPaid >= cost) this.paymentStatus = 'paid';
  else this.paymentStatus = 'partial';
  return this;
};

module.exports = mongoose.model('Shipment', shipmentSchema);
