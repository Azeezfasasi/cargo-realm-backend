const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/send', authenticate, authorize('admin', 'pastor'), newsletterController.sendNewsletter);
router.get('/', authenticate, authorize('admin', 'pastor'), newsletterController.getAllNewsletters);
router.put('/:id', authenticate, authorize('admin','pastor'), newsletterController.editNewsletter);
router.delete('/:id', authenticate, authorize('admin','pastor'), newsletterController.deleteNewsletter);
router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);
router.get('/subscribers', authenticate, authorize('admin','pastor'), newsletterController.getAllSubscribers);
router.put('/subscriber/:id', authenticate, authorize('admin','pastor'), newsletterController.editSubscriber);
router.delete('/subscriber/:id', authenticate, authorize('admin', 'pastor'), newsletterController.deleteSubscriber);
// Route to send email to a specific subscriber
router.post('/send-to-subscriber/:id', authenticate, authorize('admin', 'pastor'), newsletterController.sendEmailToSubscriber);

module.exports = router;
