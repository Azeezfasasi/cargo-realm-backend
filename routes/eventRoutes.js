const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', eventController.getAllEvents);

// Private routes
router.get('/admin/all', authenticate, authorize('admin', 'employee'), eventController.getAllEventsForAdmin);
router.post('/', authenticate, authorize('admin', 'employee'), eventController.createEvent);
router.put('/:id', authenticate, authorize('admin', 'employee'), eventController.editEvent);
router.delete('/:id', authenticate, authorize('admin', 'employee'), eventController.deleteEvent);
router.patch('/:id/status', authenticate, authorize('admin', 'employee'), eventController.changeEventStatus);

module.exports = router;
