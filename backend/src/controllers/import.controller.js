const { pool } = require('../config/db');
const { extractPlaylistId, fetchSpotifyPlaylist } = require('../utils/spotify');

function sanitizeTitle(str) {
  if (!str) return '';
  return str
    .replace(/\s*\(feat\..*?\)/gi, '')
    .replace(/\s*\[feat\..*?\]/gi, '')
    .replace(/\s*-\s*Remastered.*/gi, '')
    .replace(/\s*-\s*Radio Edit.*/gi, '')
    .replace(/\s*\(Remastered.*?\)/gi, '')
    .trim();
}

// 1. IMPORT SPOTIFY PLAYLIST
exports.importSpotifyPlaylist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { playlistUrl, targetTitle, targetFolderId } = req.body;

    if (!playlistUrl) {
      return res.status(400).json({ error: 'Spotify playlist URL or ID is required.' });
    }

    const playlistId = await extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return res.status(400).json({ error: 'Invalid Spotify playlist URL. Please paste a valid Spotify playlist link.' });
    }

    // Fetch Spotify metadata & tracks
    let spotifyData;
    try {
      spotifyData = await fetchSpotifyPlaylist(playlistId);
    } catch (apiErr) {
      return res.status(400).json({ error: apiErr.message });
    }

    const { name, description, cover_url, tracks } = spotifyData;

    // Match each track against Audira DB catalog
    const matched = [];
    const unmatched = [];

    for (const spTrack of tracks) {
      const cleanTitle = sanitizeTitle(spTrack.title);
      const titlePattern = `%${cleanTitle}%`;
      const artistPattern = `%${spTrack.artist}%`;

      // 1st priority: Match both Title AND Artist
      let matchRes = await pool.query(
        `SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count,
                a.id as artist_id, a.name as artist_name,
                al.id as album_id, al.title as album_title
         FROM tracks t
         JOIN artists a ON a.id = t.artist_id
         LEFT JOIN albums al ON al.id = t.album_id
         WHERE t.title ILIKE $1 AND a.name ILIKE $2
         LIMIT 1`,
        [titlePattern, artistPattern]
      );

      // 2nd priority fallback: Match title
      if (matchRes.rows.length === 0) {
        matchRes = await pool.query(
          `SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count,
                  a.id as artist_id, a.name as artist_name,
                  al.id as album_id, al.title as album_title
           FROM tracks t
           JOIN artists a ON a.id = t.artist_id
           LEFT JOIN albums al ON al.id = t.album_id
           WHERE t.title ILIKE $1
           LIMIT 1`,
          [titlePattern]
        );
      }

      if (matchRes.rows.length > 0) {
        matched.push({
          audira_track: matchRes.rows[0],
          spotify_original: spTrack
        });
      } else {
        unmatched.push(spTrack);
      }
    }

    // Create the imported playlist in Audira
    const playlistTitle = targetTitle?.trim() || `${name} (Spotify Import)`;
    const createPlaylistRes = await pool.query(
      `INSERT INTO playlists (user_id, title, description, cover_url, folder_id, is_public)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, title, description, cover_url, folder_id, is_public, created_at`,
      [
        userId,
        playlistTitle,
        description ? `${description} • Imported from Spotify` : 'Imported from Spotify',
        cover_url,
        targetFolderId || null
      ]
    );

    const newPlaylist = createPlaylistRes.rows[0];

    // Insert matched tracks into new playlist
    for (let i = 0; i < matched.length; i++) {
      await pool.query(
        `INSERT INTO playlist_tracks (playlist_id, track_id, position)
         VALUES ($1, $2, $3)
         ON CONFLICT (playlist_id, track_id) DO NOTHING`,
        [newPlaylist.id, matched[i].audira_track.id, i + 1]
      );
    }

    // Log the import record
    await pool.query(
      `INSERT INTO spotify_imports (
        user_id, spotify_playlist_id, spotify_playlist_name,
        target_playlist_id, total_tracks, matched_count, unmatched_tracks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        playlistId,
        name,
        newPlaylist.id,
        tracks.length,
        matched.length,
        JSON.stringify(unmatched)
      ]
    );

    res.status(201).json({
      message: `Import complete! Matched ${matched.length} of ${tracks.length} tracks.`,
      playlist: newPlaylist,
      total_spotify_tracks: tracks.length,
      matched_count: matched.length,
      unmatched_count: unmatched.length,
      matched_tracks: matched.map(m => m.audira_track),
      unmatched_tracks: unmatched
    });
  } catch (error) {
    console.error('Spotify import error:', error);
    res.status(500).json({ error: error.message || 'Failed to import Spotify playlist.' });
  }
};

// 2. GET USER IMPORT HISTORY
exports.getImportHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT si.*, p.title as audira_playlist_title, p.cover_url as audira_playlist_cover
       FROM spotify_imports si
       LEFT JOIN playlists p ON p.id = si.target_playlist_id
       WHERE si.user_id = $1
       ORDER BY si.created_at DESC`,
      [userId]
    );

    res.json({ imports: result.rows });
  } catch (error) {
    console.error('Import history error:', error);
    res.status(500).json({ error: 'Failed to retrieve import history.' });
  }
};
