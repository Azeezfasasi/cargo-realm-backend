const express = require('express');
const router = express.Router();
const prayerRequestController = require('../controllers/prayerRequestController');
const { authenticate, authorize } = require('../middleware/auth');

// Public Routes
router.post('/', authenticate, prayerRequestController.sendPrayerRequest);

// Private Routes
router.get('/', authenticate, authorize('admin', 'pastor', 'member'), prayerRequestController.getAllPrayerRequests);
router.put('/:id', authenticate, authorize('admin', 'pastor',), prayerRequestController.editPrayerRequest);
router.delete('/:id', authenticate, authorize('admin', 'pastor',), prayerRequestController.deletePrayerRequest);
router.patch('/:id/status', authenticate, authorize('admin', 'pastor',), prayerRequestController.changePrayerStatus);
router.post('/:id/like', authenticate, prayerRequestController.likePrayerRequest);
router.post('/:id/pray', authenticate, prayerRequestController.prayForRequest);
router.post('/:id/reply', authenticate, prayerRequestController.replyToPrayerRequest);

module.exports = router;
