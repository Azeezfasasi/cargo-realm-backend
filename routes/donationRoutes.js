const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', donationController.createDonation);
router.get('/', authenticate, authorize('admin', 'pastor'), donationController.getAllDonations);
router.put('/:id', authenticate, authorize('admin', 'pastor'), donationController.editDonation);
router.delete('/:id', authenticate, authorize('admin', 'pastor'), donationController.deleteDonation);
router.patch('/:id/status', authenticate, authorize('admin', 'pastor'), donationController.changeDonationStatus);
router.post('/send-email/:id', authenticate, authorize('admin', 'pastor'), donationController.sendEmailToDonor);

module.exports = router;
