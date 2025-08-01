const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);


// Protected routes (require authentication)
router.get('/admin/all', authenticate, authorize('admin', 'pastor'), blogController.getAllBlogsForAdmin);
router.post('/', authenticate, authorize('admin', 'pastor'), blogController.createBlog);
router.put('/:id', authenticate, authorize('admin', 'pastor'), blogController.editBlog);
router.delete('/:id', authenticate, authorize('admin', 'pastor'), blogController.deleteBlog);
router.patch('/:id/status', authenticate, authorize('admin', 'pastor'), blogController.changeBlogStatus);

module.exports = router;
