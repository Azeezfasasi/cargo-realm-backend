const express = require('express');
const router = express.Router();
const contactFormController = require('../controllers/contactFormController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', contactFormController.submitContactForm);
router.get('/', authenticate, authorize('admin','pastor'), contactFormController.getAllContactForms);
router.put('/:id', authenticate, authorize('admin','pastor'), contactFormController.editContactForm);
router.delete('/:id', authenticate, authorize('admin','pastor'), contactFormController.deleteContactForm);

// Route to reply to a contact form submission
router.post('/:id/reply', authenticate, authorize('admin', 'pastor'), contactFormController.replyToContactForm);

module.exports = router;
