const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/send', authenticate, authorize('admin', 'employee'), newsletterController.sendNewsletter);
router.get('/', authenticate, authorize('admin', 'employee'), newsletterController.getAllNewsletters);
router.put('/:id', authenticate, authorize('admin','employee'), newsletterController.editNewsletter);
router.delete('/:id', authenticate, authorize('admin','employee'), newsletterController.deleteNewsletter);
router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);
router.get('/subscribers', authenticate, authorize('admin','employee'), newsletterController.getAllSubscribers);
router.put('/subscriber/:id', authenticate, authorize('admin','employee'), newsletterController.editSubscriber);
router.delete('/subscriber/:id', authenticate, authorize('admin', 'employee'), newsletterController.deleteSubscriber);
// Route to send email to a specific subscriber
router.post('/send-to-subscriber/:id', authenticate, authorize('admin', 'employee'), newsletterController.sendEmailToSubscriber);

module.exports = router;
