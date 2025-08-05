const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);


// Protected routes (require authentication)
router.get('/admin/all', authenticate, authorize('admin', 'employee'), blogController.getAllBlogsForAdmin);
router.post('/', authenticate, authorize('admin', 'employee'), blogController.createBlog);
router.put('/:id', authenticate, authorize('admin', 'employee'), blogController.editBlog);
router.delete('/:id', authenticate, authorize('admin', 'employee'), blogController.deleteBlog);
router.patch('/:id/status', authenticate, authorize('admin', 'employee'), blogController.changeBlogStatus);

module.exports = router;
