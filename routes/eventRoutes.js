const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', eventController.getAllEvents);

// Private routes
router.get('/admin/all', authenticate, authorize('admin', 'pastor'), eventController.getAllEventsForAdmin);
router.post('/', authenticate, authorize('admin', 'pastor'), eventController.createEvent);
router.put('/:id', authenticate, authorize('admin', 'pastor'), eventController.editEvent);
router.delete('/:id', authenticate, authorize('admin', 'pastor'), eventController.deleteEvent);
router.patch('/:id/status', authenticate, authorize('admin', 'pastor'), eventController.changeEventStatus);

module.exports = router;
