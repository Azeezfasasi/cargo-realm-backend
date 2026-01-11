const express = require('express');
const router = express.Router();
const heroController = require('../controllers/heroController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');

// Configure Multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG, GIF) are allowed!'), false);
    }
  }
}).single('image');

// Public routes
router.get('/', heroController.getAllHeroSlides);

// Protected routes - specific routes first (before :id parameter routes)
router.get('/admin/all', authenticate, authorize('admin', 'employee'), heroController.getAllHeroSlidesForAdmin);
router.patch('/reorder', authenticate, authorize('admin', 'employee'), heroController.reorderSlides);

// Protected routes - generic :id routes last
router.get('/:id', heroController.getHeroSlideById);
router.post('/', authenticate, authorize('admin', 'employee'), upload, heroController.createHeroSlide);
router.put('/:id', authenticate, authorize('admin', 'employee'), upload, heroController.updateHeroSlide);
router.delete('/:id', authenticate, authorize('admin', 'employee'), heroController.deleteHeroSlide);
router.patch('/:id/toggle', authenticate, authorize('admin', 'employee'), heroController.toggleHeroSlideStatus);

module.exports = router;
