const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

// Shipment & revenue report (Admin/Employee) GET - /api/reports/shipments?from&to&facility
router.get('/shipments', authenticate, authorize('admin', 'employee'), reportController.getShipmentReport);

module.exports = router;
