const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const shipmentStatusController = require('../controllers/shipmentStatusController');

// Public routes - GET only
router.get('/', shipmentStatusController.getAllStatuses);
router.get('/active', shipmentStatusController.getActiveStatuses);
router.get('/:id', shipmentStatusController.getStatusById);

// Protected routes - Admin/Employee only
router.post('/', authenticate, authorize('admin', 'employee'), shipmentStatusController.createStatus);
router.put('/:id', authenticate, authorize('admin', 'employee'), shipmentStatusController.updateStatus);
router.delete('/:id', authenticate, authorize('admin', 'employee'), shipmentStatusController.deleteStatus);
router.patch('/:id/toggle-active', authenticate, authorize('admin', 'employee'), shipmentStatusController.toggleStatusActive);

module.exports = router;
