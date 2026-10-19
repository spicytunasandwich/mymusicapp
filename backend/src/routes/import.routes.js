const express = require('express');
const router = express.Router();
const importController = require('../controllers/import.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Spotify playlist import & history
router.post('/spotify', requireAuth, importController.importSpotifyPlaylist);
router.get('/history', requireAuth, importController.getImportHistory);

module.exports = router;
