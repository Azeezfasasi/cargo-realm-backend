const express = require('express');
const router = express.Router();
const heroController = require('../controllers/heroController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', heroController.getAllHeroSlides);
router.get('/:id', heroController.getHeroSlideById);

// Protected routes (require authentication)
router.get('/admin/all', authenticate, authorize('admin', 'employee'), heroController.getAllHeroSlidesForAdmin);
router.post('/', authenticate, authorize('admin', 'employee'), heroController.createHeroSlide);
router.put('/:id', authenticate, authorize('admin', 'employee'), heroController.updateHeroSlide);
router.delete('/:id', authenticate, authorize('admin', 'employee'), heroController.deleteHeroSlide);
router.patch('/:id/toggle', authenticate, authorize('admin', 'employee'), heroController.toggleHeroSlideStatus);
router.patch('/reorder', authenticate, authorize('admin', 'employee'), heroController.reorderSlides);

module.exports = router;
