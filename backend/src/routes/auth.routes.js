const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public endpoints
router.post('/signup', authController.signup);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected endpoints
router.post('/resend-verification', authController.resendVerification);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
