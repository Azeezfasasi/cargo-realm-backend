const express = require('express');
const router = express.Router();
const { auth, adminOrEmployee } = require('../middleware/auth');
const facilityController = require('../controllers/facilityController');

// Public routes - GET only
router.get('/', facilityController.getAllFacilities);
router.get('/active', facilityController.getActiveFacilities);
router.get('/:id', facilityController.getFacilityById);

// Protected routes - Admin/Employee only
router.post('/', auth, adminOrEmployee, facilityController.createFacility);
router.put('/:id', auth, adminOrEmployee, facilityController.updateFacility);
router.delete('/:id', auth, adminOrEmployee, facilityController.deleteFacility);
router.patch('/:id/toggle-status', auth, adminOrEmployee, facilityController.toggleFacilityStatus);

module.exports = router;
