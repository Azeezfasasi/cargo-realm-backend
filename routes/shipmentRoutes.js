const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all shipments (Admin/Agent only) GET - /api/shipments
router.get('/', authenticate, authorize('admin', 'agent', 'employee'), shipmentController.getAllShipments);

// Get my shipments (Authenticated users, filtered by sender) GET - /api/shipments/my-shipments
router.get('/my-shipments', authenticate, shipmentController.getMyShipments);

// Track shipment (Public, no auth needed) GET - /api/shipments/track/:trackingNumber
router.get('/track/:trackingNumber', shipmentController.trackShipment);

// Create a new shipment (Admin only, as per your request) POST - /api/shipments
router.post('/', authenticate, authorize('admin', 'employee', 'agent'), shipmentController.createShipment);

// Edit a shipment (Admin or the user who sent it) PUT - /api/shipments/:id
router.put('/:id', authenticate, shipmentController.editShipment);

// Delete a shipment (Admin only) DELETE - /api/shipments/:id
router.delete('/:id', authenticate, authorize('admin'), shipmentController.deleteShipment);

// Change shipment status (Admin/Agent only) PATCH - /api/shipments/:id/status
router.patch('/:id/status', authenticate, authorize('admin', 'employee', 'agent'), shipmentController.changeShipmentStatus);

// Reply to a shipment (Authenticated users) POST - /api/shipments/:id/reply
router.post('/:id/reply', authenticate, shipmentController.replyToShipment);

// Print shipment (Admin, Agent, Employee, Client) GET - /api/shipments/print/:id
router.get('/print/:id', authenticate, authorize('admin', 'agent', 'employee', 'client'), shipmentController.printShipment);

// Generate invoice (Admin, Agent, Employee, Client) GET - /api/shipments/invoice/:id
router.get('/invoice/:id', authenticate, authorize('admin', 'agent', 'employee', 'client'), shipmentController.generateInvoice);

// Generate waybill (Admin, Agent, Employee, Client) GET - /api/shipments/waybill/:id
router.get('/waybill/:id', authenticate, authorize('admin', 'agent', 'employee', 'client'), shipmentController.generateWaybill);

module.exports = router;
