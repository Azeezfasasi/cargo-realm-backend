const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { authenticate, authorize } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

// Get all shipments (Admin/Agent only) GET - /api/shipments
router.get('/', authenticate, authorize('admin', 'agent', 'employee'), shipmentController.getAllShipments);

// Get my shipments (Authenticated users, filtered by sender) GET - /api/shipments/my-shipments
router.get('/my-shipments', authenticate, shipmentController.getMyShipments);

// Track shipment (Public, no auth needed) GET - /api/shipments/track/:trackingNumber
// Rate limited per IP so tracking numbers can't be guessed by brute force
router.get('/track/:trackingNumber', rateLimit({ name: 'track', max: 30, windowMs: 60 * 1000 }), shipmentController.trackShipment);

// Create a new shipment (Admin only, as per your request) POST - /api/shipments
router.post('/', authenticate, authorize('admin', 'employee', 'agent'), shipmentController.createShipment);

// Edit a shipment (Admin or the user who sent it) PUT - /api/shipments/:id
router.put('/:id', authenticate, shipmentController.editShipment);

// Delete a shipment (Admin only) DELETE - /api/shipments/:id
router.delete('/:id', authenticate, authorize('admin'), shipmentController.deleteShipment);

// Change shipment status (Admin/Agent only) PATCH - /api/shipments/:id/status
router.patch('/:id/status', authenticate, authorize('admin', 'employee', 'agent'), shipmentController.changeShipmentStatus);

// Generate QR codes for all shipments missing them (Admin only) POST - /api/shipments/generate-qr-codes
router.post('/generate-qr-codes', authenticate, authorize('admin'), shipmentController.generateMissingQRCodes);

// Record a payment (Admin/Employee/Agent) POST - /api/shipments/:id/payments
router.post('/:id/payments', authenticate, authorize('admin', 'employee', 'agent'), shipmentController.addPayment);

// Remove a payment recorded in error (Admin only) DELETE - /api/shipments/:id/payments/:paymentId
router.delete('/:id/payments/:paymentId', authenticate, authorize('admin'), shipmentController.deletePayment);

// Shipment documents (Admin/Employee/Agent): sign a direct Cloudinary upload, record it, delete it
router.post('/:id/documents/signature', authenticate, authorize('admin', 'employee', 'agent'), shipmentController.getDocumentUploadSignature);
router.post('/:id/documents', authenticate, authorize('admin', 'employee', 'agent'), shipmentController.addDocument);
router.delete('/:id/documents/:documentId', authenticate, authorize('admin', 'employee', 'agent'), shipmentController.deleteDocument);
// Signed download link (staff, or the client who owns the shipment)
router.get('/:id/documents/:documentId/download', authenticate, shipmentController.getDocumentDownloadUrl);

// Reply to a shipment (Authenticated users) POST - /api/shipments/:id/reply
router.post('/:id/reply', authenticate, shipmentController.replyToShipment);

// Print shipment (Admin, Agent, Employee, Client) GET - /api/shipments/print/:id
router.get('/print/:id', authenticate, authorize('admin', 'agent', 'employee', 'client'), shipmentController.printShipment);

// Generate invoice (Admin, Agent, Employee, Client) GET - /api/shipments/invoice/:id
router.get('/invoice/:id', authenticate, authorize('admin', 'agent', 'employee', 'client'), shipmentController.generateInvoice);

// Generate waybill (Admin, Agent, Employee, Client) GET - /api/shipments/waybill/:id
router.get('/waybill/:id', authenticate, authorize('admin', 'agent', 'employee', 'client'), shipmentController.generateWaybill);

module.exports = router;
