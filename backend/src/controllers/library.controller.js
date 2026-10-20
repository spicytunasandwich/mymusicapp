const { pool } = require('../config/db');

// 1. GET FULL LIBRARY OVERVIEW
exports.getLibrary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Liked songs count
    const likesCountRes = await pool.query(
      'SELECT COUNT(*)::int as count FROM liked_songs WHERE user_id = $1',
      [userId]
    );

    // Folders
    const foldersRes = await pool.query(
      `SELECT id, name, position, created_at
       FROM playlist_folders
       WHERE user_id = $1
       ORDER BY position ASC, created_at ASC`,
      [userId]
    );

    // User's playlists
    const playlistsRes = await pool.query(
      `SELECT p.id, p.title, p.description, p.cover_url, p.is_public, p.folder_id,
              p.position, p.created_at, COUNT(pt.track_id)::int as track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.position ASC, p.created_at DESC`,
      [userId]
    );

    // Followed artists
    const followedArtistsRes = await pool.query(
      `SELECT a.id, a.name, a.avatar_url, a.monthly_listeners, a.verified
       FROM followed_artists fa
       JOIN artists a ON a.id = fa.artist_id
       WHERE fa.user_id = $1
       ORDER BY fa.created_at DESC`,
      [userId]
    );

    // Saved albums
    const likedAlbumsRes = await pool.query(
      `SELECT al.id, al.title, al.release_year, al.cover_url, a.name as artist_name
       FROM liked_albums la
       JOIN albums al ON al.id = la.album_id
       JOIN artists a ON a.id = al.artist_id
       WHERE la.user_id = $1
       ORDER BY la.created_at DESC`,
      [userId]
    );

    res.json({
      liked_songs_count: likesCountRes.rows[0]?.count || 0,
      folders: foldersRes.rows,
      playlists: playlistsRes.rows,
      followed_artists: followedArtistsRes.rows,
      liked_albums: likedAlbumsRes.rows
    });
  } catch (error) {
    console.error('Library overview error:', error);
    res.status(500).json({ error: 'Failed to retrieve library.' });
  }
};

// 2. LIKED SONGS
exports.getLikedSongs = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count, t.spotify_id, t.preview_url,
              a.id as artist_id, a.name as artist_name,
              al.id as album_id, al.title as album_title,
              ls.created_at as liked_at, true as is_liked
       FROM liked_songs ls
       JOIN tracks t ON t.id = ls.track_id
       JOIN artists a ON a.id = t.artist_id
       LEFT JOIN albums al ON al.id = t.album_id
       WHERE ls.user_id = $1
       ORDER BY ls.created_at DESC`,
      [userId]
    );
    res.json({ tracks: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch liked songs.' });
  }
};

exports.toggleLikeSong = async (req, res) => {
  try {
    const userId = req.user.id;
    const { trackId } = req.params;

    const existing = await pool.query(
      'SELECT 1 FROM liked_songs WHERE user_id = $1 AND track_id = $2',
      [userId, trackId]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM liked_songs WHERE user_id = $1 AND track_id = $2', [userId, trackId]);
      return res.json({ message: 'Song removed from Liked Songs', is_liked: false });
    } else {
      await pool.query(
        'INSERT INTO liked_songs (user_id, track_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, trackId]
      );
      return res.json({ message: 'Song added to Liked Songs', is_liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update song like status.' });
  }
};

// 3. FOLDERS
exports.createFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name is required.' });

    const maxPosRes = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM playlist_folders WHERE user_id = $1',
      [userId]
    );
    const nextPos = maxPosRes.rows[0].next_pos;

    const result = await pool.query(
      `INSERT INTO playlist_folders (user_id, name, position)
       VALUES ($1, $2, $3)
       RETURNING id, name, position, created_at`,
      [userId, name.trim(), nextPos]
    );
    res.status(201).json({ folder: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create folder.' });
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, position } = req.body;

    const result = await pool.query(
      `UPDATE playlist_folders
       SET name = COALESCE($1, name),
           position = COALESCE($2, position),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, position, updated_at`,
      [name?.trim(), position, id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found.' });
    res.json({ folder: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update folder.' });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM playlist_folders WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found.' });
    res.json({ message: 'Folder deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete folder.' });
  }
};

// 4. PLAYLISTS
exports.createPlaylist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, cover_url, folder_id, privacy = 'public', is_public = true } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ error: 'Playlist title is required.' });

    const normalizedPrivacy = ['public', 'link_only', 'private'].includes(privacy) ? privacy : 'public';
    const effectiveIsPublic = normalizedPrivacy !== 'private';

    const result = await pool.query(
      `INSERT INTO playlists (user_id, title, description, cover_url, folder_id, privacy, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, description, cover_url, folder_id, privacy, is_public, created_at`,
      [userId, title.trim(), description?.trim() || '', cover_url || '', folder_id || null, normalizedPrivacy, effectiveIsPublic]
    );

    res.status(201).json({ playlist: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create playlist.' });
  }
};

exports.getPlaylistById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const playlistRes = await pool.query(
      `SELECT p.*, u.username as owner_username, u.display_name as owner_name, u.avatar_url as owner_avatar
       FROM playlists p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND (
         p.privacy = 'public' OR
         p.privacy = 'link_only' OR
         (p.privacy IS NULL AND p.is_public = true) OR
         p.user_id = $2
       )`,
      [id, userId || null]
    );

    if (playlistRes.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found or is private.' });
    }

    const playlist = playlistRes.rows[0];

    // Tracks in playlist
    const tracksRes = await pool.query(
      `SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count, t.spotify_id, t.preview_url,
              a.id as artist_id, a.name as artist_name,
              al.id as album_id, al.title as album_title,
              pt.position, pt.added_at,
              EXISTS(SELECT 1 FROM liked_songs ls WHERE ls.track_id = t.id AND ls.user_id = $2) as is_liked
       FROM playlist_tracks pt
       JOIN tracks t ON t.id = pt.track_id
       JOIN artists a ON a.id = t.artist_id
       LEFT JOIN albums al ON al.id = t.album_id
       WHERE pt.playlist_id = $1
       ORDER BY pt.position ASC`,
      [id, userId || null]
    );

    playlist.tracks = tracksRes.rows;
    playlist.total_duration = tracksRes.rows.reduce((acc, t) => acc + (t.duration || 0), 0);

    res.json({ playlist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load playlist.' });
  }
};

exports.updatePlaylist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, cover_url, folder_id, privacy, is_public } = req.body;

    const normalizedPrivacy = privacy && ['public', 'link_only', 'private'].includes(privacy) ? privacy : null;
    const effectiveIsPublic = normalizedPrivacy ? (normalizedPrivacy !== 'private') : is_public;

    const result = await pool.query(
      `UPDATE playlists
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           cover_url = COALESCE($3, cover_url),
           folder_id = $4,
           privacy = COALESCE($5, privacy),
           is_public = COALESCE($6, is_public),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title?.trim(), description?.trim(), cover_url, folder_id !== undefined ? folder_id : null, normalizedPrivacy, effectiveIsPublic, id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Playlist not found.' });
    res.json({ playlist: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update playlist.' });
  }
};

exports.deletePlaylist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM playlists WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Playlist not found.' });
    res.json({ message: 'Playlist deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete playlist.' });
  }
};

exports.addTrackToPlaylist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: playlistId } = req.params;
    const { trackId } = req.body;

    if (!trackId) return res.status(400).json({ error: 'trackId is required.' });

    // Verify ownership
    const ownerRes = await pool.query('SELECT id FROM playlists WHERE id = $1 AND user_id = $2', [playlistId, userId]);
    if (ownerRes.rows.length === 0) return res.status(403).json({ error: 'Not authorized to edit this playlist.' });

    // Next position
    const posRes = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM playlist_tracks WHERE playlist_id = $1',
      [playlistId]
    );
    const nextPos = posRes.rows[0].next_pos;

    await pool.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id, position)
       VALUES ($1, $2, $3)
       ON CONFLICT (playlist_id, track_id) DO NOTHING`,
      [playlistId, trackId, nextPos]
    );

    res.json({ message: 'Track added to playlist.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add track to playlist.' });
  }
};

exports.removeTrackFromPlaylist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: playlistId, trackId } = req.params;

    const ownerRes = await pool.query('SELECT id FROM playlists WHERE id = $1 AND user_id = $2', [playlistId, userId]);
    if (ownerRes.rows.length === 0) return res.status(403).json({ error: 'Not authorized.' });

    await pool.query(
      'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
      [playlistId, trackId]
    );

    res.json({ message: 'Track removed from playlist.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove track.' });
  }
};

exports.reorderPlaylistTracks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: playlistId } = req.params;
    const { orderedTrackIds } = req.body; // Array of track IDs in order

    if (!Array.isArray(orderedTrackIds)) {
      return res.status(400).json({ error: 'orderedTrackIds array is required.' });
    }

    const ownerRes = await pool.query('SELECT id FROM playlists WHERE id = $1 AND user_id = $2', [playlistId, userId]);
    if (ownerRes.rows.length === 0) return res.status(403).json({ error: 'Not authorized.' });

    // Batch update positions
    for (let i = 0; i < orderedTrackIds.length; i++) {
      await pool.query(
        'UPDATE playlist_tracks SET position = $1 WHERE playlist_id = $2 AND track_id = $3',
        [i + 1, playlistId, orderedTrackIds[i]]
      );
    }

    res.json({ message: 'Playlist tracks reordered successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder playlist tracks.' });
  }
};

// 5. FOLLOW ARTIST / LIKE ALBUM
exports.toggleFollowArtist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { artistId } = req.params;

    const existing = await pool.query(
      'SELECT 1 FROM followed_artists WHERE user_id = $1 AND artist_id = $2',
      [userId, artistId]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM followed_artists WHERE user_id = $1 AND artist_id = $2', [userId, artistId]);
      return res.json({ message: 'Unfollowed artist', is_followed: false });
    } else {
      await pool.query('INSERT INTO followed_artists (user_id, artist_id) VALUES ($1, $2)', [userId, artistId]);
      return res.json({ message: 'Followed artist', is_followed: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle artist follow.' });
  }
};

exports.toggleLikeAlbum = async (req, res) => {
  try {
    const userId = req.user.id;
    const { albumId } = req.params;

    const existing = await pool.query(
      'SELECT 1 FROM liked_albums WHERE user_id = $1 AND album_id = $2',
      [userId, albumId]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM liked_albums WHERE user_id = $1 AND album_id = $2', [userId, albumId]);
      return res.json({ message: 'Album removed from library', is_liked: false });
    } else {
      await pool.query('INSERT INTO liked_albums (user_id, album_id) VALUES ($1, $2)', [userId, albumId]);
      return res.json({ message: 'Album added to library', is_liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle album like.' });
  }
};
