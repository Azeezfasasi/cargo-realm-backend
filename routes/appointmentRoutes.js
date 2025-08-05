const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth'); 

// Public route for visitors to book an appointment
router.post('/', appointmentController.createAppointment);

// Protected route for authenticated users to book an appointment
// This route will ensure req.user is populated if a token is sent.
router.post('/authenticated', authenticate, appointmentController.createAppointment);

// Admin/Pastor routes for managing appointments - GET /api/appointments
router.get('/', authenticate, authorize('admin', 'employee'), appointmentController.getAllAppointments);

// Route for logged-in users to get their own appointments
router.get('/my-appointments', authenticate, appointmentController.getMyAppointments);

// GET /api/appointments/:id - Get a single appointment (Admin/Pastor or bookedBy user)
router.get('/:id', authenticate, authorize('admin', 'employee', 'client', 'agent'), appointmentController.getAppointmentById); // Member can view their own

// PUT /api/appointments/:id - Update appointment details (Admin/Pastor only)
router.put('/:id', authenticate, authorize('admin', 'employee'), appointmentController.updateAppointment);

// DELETE /api/appointments/:id - Delete an appointment (Admin/Pastor only)
router.delete('/:id', authenticate, authorize('admin', 'employee'), appointmentController.deleteAppointment);

// PATCH /api/appointments/:id/reschedule - Reschedule an appointment
// Accessible by authenticated users (admin/pastor/member)
router.patch('/:id/reschedule', authenticate, authorize('admin', 'employee', 'agent', 'client'), appointmentController.rescheduleAppointment);

// PATCH /api/appointments/:id/cancel - Cancel an appointment
// Accessible by authenticated users (admin/pastor/member)
router.patch('/:id/cancel', authenticate, authorize('admin', 'employee', 'client', 'agent'), appointmentController.cancelAppointment);

// PATCH /api/appointments/:id/status - Change appointment status (Admin/Pastor only)
router.patch('/:id/status', authenticate, authorize('admin', 'employee', 'agent', 'client'), appointmentController.changeAppointmentStatus);

module.exports = router;
