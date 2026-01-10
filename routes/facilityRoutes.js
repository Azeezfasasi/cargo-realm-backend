const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const facilityController = require('../controllers/facilityController');

// Public routes - GET only
router.get('/', facilityController.getAllFacilities);
router.get('/active', facilityController.getActiveFacilities);
router.get('/:id', facilityController.getFacilityById);

// Protected routes - Admin/Employee only
router.post('/', authenticate, authorize('admin', 'employee'), facilityController.createFacility);
router.put('/:id', authenticate, authorize('admin', 'employee'), facilityController.updateFacility);
router.delete('/:id', authenticate, authorize('admin', 'employee'), facilityController.deleteFacility);
router.patch('/:id/toggle-status', authenticate, authorize('admin', 'employee'), facilityController.toggleFacilityStatus);

module.exports = router;
