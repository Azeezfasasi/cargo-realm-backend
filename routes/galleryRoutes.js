const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { authenticate, authorize } = require('../middleware/auth');
const cloudinaryUpload = require('../middleware/uploadMiddleware');

router.post('/', authenticate, authorize('admin','pastor'), cloudinaryUpload, galleryController.addImage);
router.get('/', galleryController.getAllImages);
router.put('/:id', authenticate, authorize('admin','pastor'), cloudinaryUpload, galleryController.editImage);
router.delete('/:id', authenticate, authorize('admin','pastor'), galleryController.deleteImage);
router.patch('/:id/status', authenticate, authorize('admin','pastor'), galleryController.changeImageStatus);

module.exports = router;
