const express = require('express');
const router = express.Router();
const musicController = require('../controllers/music.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const { uploadSingleAudio } = require('../middleware/upload.middleware');

// Home Feed & Search
router.get('/home', optionalAuth, musicController.getHomeFeed);
router.get('/search', optionalAuth, musicController.search);
router.get('/recommendations', optionalAuth, musicController.getRecommendations);

// Tracks, Audio Streaming, Upload & Lyrics
router.get('/tracks/:id', optionalAuth, musicController.getTrackById);
router.get('/tracks/:id/stream', optionalAuth, musicController.streamTrack);
router.post('/tracks/upload', optionalAuth, uploadSingleAudio('audio'), musicController.uploadTrack);
router.get('/tracks/:id/lyrics', musicController.getTrackLyrics);

// Artists & Albums
router.get('/artists/:id', optionalAuth, musicController.getArtistById);
router.get('/albums/:id', optionalAuth, musicController.getAlbumById);

module.exports = router;
