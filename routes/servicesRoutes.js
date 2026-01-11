const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', servicesController.getAllServices);
router.get('/:id', servicesController.getServiceById);

// Protected routes - specific routes first (before :id parameter routes)
router.get('/admin/all', authenticate, authorize('admin', 'employee'), servicesController.getAllServicesForAdmin);

// Protected routes - generic :id routes last
router.post('/', authenticate, authorize('admin', 'employee'), servicesController.createService);
router.put('/:id', authenticate, authorize('admin', 'employee'), servicesController.updateService);
router.delete('/:id', authenticate, authorize('admin', 'employee'), servicesController.deleteService);
router.patch('/:id/toggle', authenticate, authorize('admin', 'employee'), servicesController.toggleServiceStatus);

module.exports = router;
