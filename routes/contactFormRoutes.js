const express = require('express');
const router = express.Router();
const contactFormController = require('../controllers/contactFormController');
const { authenticate, authorize } = require('../middleware/auth');

// Route to submit a contact form POST - /api/contact
router.post('/', contactFormController.submitContactForm);

// Route to get all contact forms GET - /api/contact
router.get('/', authenticate, authorize('admin', 'employee'), contactFormController.getAllContactForms);

// Route to edit a contact form PUT - /api/contact/:id
router.put('/:id', authenticate, authorize('admin', 'employee'), contactFormController.editContactForm);

// Route to delete a contact form DELETE - /api/contact/:id
router.delete('/:id', authenticate, authorize('admin'), contactFormController.deleteContactForm);

// Route to reply to a contact form POST - /api/contact/:id/reply
router.post('/:id/reply', authenticate, authorize('admin', 'employee'), contactFormController.replyToContactForm);

module.exports = router;
