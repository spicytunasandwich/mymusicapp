const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { uploadSingleImage } = require('../middleware/upload.middleware');

// Public Profile
router.get('/profile/:username', userController.getPublicProfile);

// Authenticated Profile Updates
router.patch('/profile', requireAuth, userController.updateProfile);

// Customization & Settings
router.get('/settings', requireAuth, userController.getSettings);
router.patch('/settings', requireAuth, userController.updateSettings);

// Presence & Real-time Listening Activity
router.get('/presence/:username', userController.getUserPresence);
router.put('/presence', requireAuth, userController.updateUserPresence);

// Image Uploads (Avatar, Banner, Playlist Cover)
router.post('/upload', requireAuth, uploadSingleImage('image'), userController.uploadMedia);

module.exports = router;
