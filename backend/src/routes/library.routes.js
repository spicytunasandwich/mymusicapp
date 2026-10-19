const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/library.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

// Overview
router.get('/', requireAuth, libraryController.getLibrary);

// Liked Songs
router.get('/likes', requireAuth, libraryController.getLikedSongs);
router.post('/likes/:trackId', requireAuth, libraryController.toggleLikeSong);

// Folders
router.post('/folders', requireAuth, libraryController.createFolder);
router.patch('/folders/:id', requireAuth, libraryController.updateFolder);
router.delete('/folders/:id', requireAuth, libraryController.deleteFolder);

// Playlists
router.post('/playlists', requireAuth, libraryController.createPlaylist);
router.get('/playlists/:id', optionalAuth, libraryController.getPlaylistById);
router.put('/playlists/:id', requireAuth, libraryController.updatePlaylist);
router.delete('/playlists/:id', requireAuth, libraryController.deletePlaylist);

// Playlist Tracks
router.post('/playlists/:id/tracks', requireAuth, libraryController.addTrackToPlaylist);
router.delete('/playlists/:id/tracks/:trackId', requireAuth, libraryController.removeTrackFromPlaylist);
router.put('/playlists/:id/tracks/reorder', requireAuth, libraryController.reorderPlaylistTracks);

// Artist Follow & Album Like
router.post('/artists/:artistId/follow', requireAuth, libraryController.toggleFollowArtist);
router.post('/albums/:albumId/like', requireAuth, libraryController.toggleLikeAlbum);

module.exports = router;
