const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate, authorize } = require('../middleware/auth');
const cloudinaryUpload = require('../middleware/uploadMiddleware');

// Public routes (no authentication needed)
router.post('/register', profileController.register);
router.post('/login', profileController.login);
router.post('/forgot-password', profileController.forgotPassword);

// Protected routes (require authentication)
router.get('/me', authenticate, profileController.getMe);
router.put('/edit/:id', authenticate, cloudinaryUpload, profileController.editUser);

// Admin-only routes (require authentication and 'admin' role)
router.delete('/delete/:id', authenticate, authorize('admin', 'pastor'), profileController.deleteUser);
router.put('/disable/:id', authenticate, authorize('admin', 'pastor'), profileController.disableUser);
router.put('/suspend/:id', authenticate, authorize('admin', 'pastor'), profileController.suspendUser);
router.get('/all', authenticate, authorize('admin', 'pastor'), profileController.getAllUsers);
router.patch('/admin/change-password', authenticate, authorize('admin', 'pastor'), profileController.changeUserPasswordByAdmin);


module.exports = router;
