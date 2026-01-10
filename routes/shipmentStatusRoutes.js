const express = require('express');
const router = express.Router();
const { auth, adminOrEmployee } = require('../middleware/auth');
const shipmentStatusController = require('../controllers/shipmentStatusController');

// Public routes - GET only
router.get('/', shipmentStatusController.getAllStatuses);
router.get('/active', shipmentStatusController.getActiveStatuses);
router.get('/:id', shipmentStatusController.getStatusById);

// Protected routes - Admin/Employee only
router.post('/', auth, adminOrEmployee, shipmentStatusController.createStatus);
router.put('/:id', auth, adminOrEmployee, shipmentStatusController.updateStatus);
router.delete('/:id', auth, adminOrEmployee, shipmentStatusController.deleteStatus);
router.patch('/:id/toggle-active', auth, adminOrEmployee, shipmentStatusController.toggleStatusActive);

module.exports = router;
