const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { parseLrc } = require('../utils/lrcParser');

// 1. HOME FEED
exports.getHomeFeed = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Fetch featured playlists
    const featuredPlaylistsRes = await pool.query(
      `SELECT p.id, p.title, p.description, p.cover_url, u.username as owner_username,
              COUNT(pt.track_id) as track_count
       FROM playlists p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
       WHERE p.is_public = true
       GROUP BY p.id, u.username
       ORDER BY p.created_at DESC
       LIMIT 10`
    );

    // Fetch top tracks
    const topTracksRes = await pool.query(
      `SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count,
              a.id as artist_id, a.name as artist_name,
              al.id as album_id, al.title as album_title,
              EXISTS(SELECT 1 FROM liked_songs ls WHERE ls.track_id = t.id AND ls.user_id = $1) as is_liked
       FROM tracks t
       JOIN artists a ON a.id = t.artist_id
       LEFT JOIN albums al ON al.id = t.album_id
       ORDER BY t.stream_count DESC
       LIMIT 10`,
      [userId || null]
    );

    // Fetch popular artists
    const popularArtistsRes = await pool.query(
      `SELECT id, name, bio, avatar_url, monthly_listeners, verified
       FROM artists
       ORDER BY monthly_listeners DESC
       LIMIT 8`
    );

    // Fetch new release albums
    const newReleasesRes = await pool.query(
      `SELECT al.id, al.title, al.release_year, al.cover_url, al.album_type,
              a.id as artist_id, a.name as artist_name
       FROM albums al
       JOIN artists a ON a.id = al.artist_id
       ORDER BY al.release_year DESC, al.created_at DESC
       LIMIT 8`
    );

    // Recently played (if authenticated)
    let recentlyPlayed = [];
    if (userId) {
      const recentRes = await pool.query(
        `SELECT DISTINCT ON (t.id)
                t.id, t.title, t.duration, t.audio_url, t.cover_url,
                a.name as artist_name, ph.played_at
         FROM play_history ph
         JOIN tracks t ON t.id = ph.track_id
         JOIN artists a ON a.id = t.artist_id
         WHERE ph.user_id = $1
         ORDER BY t.id, ph.played_at DESC
         LIMIT 6`,
        [userId]
      );
      recentlyPlayed = recentRes.rows;
    }

    res.json({
      featured_playlists: featuredPlaylistsRes.rows,
      top_tracks: topTracksRes.rows,
      popular_artists: popularArtistsRes.rows,
      new_releases: newReleasesRes.rows,
      recently_played: recentlyPlayed
    });
  } catch (error) {
    console.error('Home feed error:', error);
    res.status(500).json({ error: 'Failed to load home feed.' });
  }
};

// 2. SEARCH
exports.search = async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    const userId = req.user?.id;

    if (!q) {
      return res.json({ tracks: [], artists: [], albums: [], playlists: [] });
    }

    const searchPattern = `%${q}%`;

    const [tracksRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
      pool.query(
        `SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count, t.spotify_id, t.preview_url,
                a.id as artist_id, a.name as artist_name,
                al.id as album_id, al.title as album_title,
                EXISTS(SELECT 1 FROM liked_songs ls WHERE ls.track_id = t.id AND ls.user_id = $2) as is_liked
         FROM tracks t
         JOIN artists a ON a.id = t.artist_id
         LEFT JOIN albums al ON al.id = t.album_id
         WHERE t.title ILIKE $1 OR a.name ILIKE $1
         ORDER BY t.stream_count DESC
         LIMIT 20`,
        [searchPattern, userId || null]
      ),
      pool.query(
        `SELECT id, name, avatar_url, monthly_listeners, verified
         FROM artists
         WHERE name ILIKE $1
         ORDER BY monthly_listeners DESC
         LIMIT 10`,
        [searchPattern]
      ),
      pool.query(
        `SELECT al.id, al.title, al.release_year, al.cover_url, al.album_type,
                a.id as artist_id, a.name as artist_name
         FROM albums al
         JOIN artists a ON a.id = al.artist_id
         WHERE al.title ILIKE $1 OR a.name ILIKE $1
         LIMIT 10`,
        [searchPattern]
      ),
      pool.query(
        `SELECT p.id, p.title, p.description, p.cover_url, u.username as owner_username
         FROM playlists p
         JOIN users u ON u.id = p.user_id
         WHERE p.is_public = true AND p.title ILIKE $1
         LIMIT 10`,
        [searchPattern]
      )
    ]);

    res.json({
      tracks: tracksRes.rows,
      artists: artistsRes.rows,
      albums: albumsRes.rows,
      playlists: playlistsRes.rows
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed.' });
  }
};

// 3. GET TRACK BY ID
exports.getTrackById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count, t.spotify_id, t.preview_url,
              t.is_explicit, t.release_date,
              a.id as artist_id, a.name as artist_name, a.avatar_url as artist_avatar,
              al.id as album_id, al.title as album_title,
              EXISTS(SELECT 1 FROM liked_songs ls WHERE ls.track_id = t.id AND ls.user_id = $2) as is_liked
       FROM tracks t
       JOIN artists a ON a.id = t.artist_id
       LEFT JOIN albums al ON al.id = t.album_id
       WHERE t.id = $1`,
      [id, userId || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    res.json({ track: result.rows[0] });
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: 'Failed to retrieve track.' });
  }
};

// 4. STREAM TRACK (Supports HTTP 206 Partial Content / Seeking)
exports.streamTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await pool.query(
      'SELECT id, audio_url, stream_count FROM tracks WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    const track = result.rows[0];

    // Async record play count & history without blocking stream start
    pool.query('UPDATE tracks SET stream_count = stream_count + 1 WHERE id = $1', [id]).catch(console.error);
    if (userId) {
      pool.query('INSERT INTO play_history (user_id, track_id) VALUES ($1, $2)', [userId, id]).catch(console.error);
    }

    const audioUrl = track.audio_url;

    // Remote audio streaming (direct URL or external CDN)
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      return res.redirect(302, audioUrl);
    }

    // Local audio file streaming with HTTP 206 Partial Content support
    const filePath = path.resolve(audioUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found on server.' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes'
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to stream audio.' });
  }
};

// 5. GET TRACK LYRICS (Synced LRC Line-By-Line)
exports.getTrackLyrics = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, title, lyrics_lrc FROM tracks WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    const { lyrics_lrc } = result.rows[0];
    const parsed = parseLrc(lyrics_lrc);

    res.json({
      track_id: id,
      has_lyrics: Boolean(lyrics_lrc && lyrics_lrc.trim().length > 0),
      raw_lrc: lyrics_lrc || '',
      synced: parsed.synced,
      lines: parsed.lines
    });
  } catch (error) {
    console.error('Lyrics error:', error);
    res.status(500).json({ error: 'Failed to retrieve lyrics.' });
  }
};

// 6. GET ARTIST DETAILS & TOP TRACKS
exports.getArtistById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const artistRes = await pool.query(
      `SELECT a.*,
              EXISTS(SELECT 1 FROM followed_artists fa WHERE fa.artist_id = a.id AND fa.user_id = $2) as is_followed
       FROM artists a WHERE a.id = $1`,
      [id, userId || null]
    );

    if (artistRes.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found.' });
    }

    const artist = artistRes.rows[0];

    // Top tracks
    const tracksRes = await pool.query(
      `SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count, t.spotify_id, t.preview_url,
              al.id as album_id, al.title as album_title,
              EXISTS(SELECT 1 FROM liked_songs ls WHERE ls.track_id = t.id AND ls.user_id = $2) as is_liked
       FROM tracks t
       LEFT JOIN albums al ON al.id = t.album_id
       WHERE t.artist_id = $1
       ORDER BY t.stream_count DESC
       LIMIT 10`,
      [id, userId || null]
    );

    // Albums
    const albumsRes = await pool.query(
      `SELECT id, title, release_year, cover_url, album_type, total_tracks
       FROM albums
       WHERE artist_id = $1
       ORDER BY release_year DESC`,
      [id]
    );

    res.json({
      artist,
      top_tracks: tracksRes.rows,
      albums: albumsRes.rows
    });
  } catch (error) {
    console.error('Artist details error:', error);
    res.status(500).json({ error: 'Failed to retrieve artist details.' });
  }
};

// 7. GET ALBUM DETAILS & TRACKLIST
exports.getAlbumById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const albumRes = await pool.query(
      `SELECT al.*, a.name as artist_name, a.avatar_url as artist_avatar,
              EXISTS(SELECT 1 FROM liked_albums la WHERE la.album_id = al.id AND la.user_id = $2) as is_liked
       FROM albums al
       JOIN artists a ON a.id = al.artist_id
       WHERE al.id = $1`,
      [id, userId || null]
    );

    if (albumRes.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found.' });
    }

    const album = albumRes.rows[0];

    // Tracks in album
    const tracksRes = await pool.query(
      `SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count,
              a.id as artist_id, a.name as artist_name,
              EXISTS(SELECT 1 FROM liked_songs ls WHERE ls.track_id = t.id AND ls.user_id = $2) as is_liked
       FROM tracks t
       JOIN artists a ON a.id = t.artist_id
       WHERE t.album_id = $1
       ORDER BY t.created_at ASC`,
      [id, userId || null]
    );

    res.json({
      album,
      tracks: tracksRes.rows
    });
  } catch (error) {
    console.error('Album details error:', error);
    res.status(500).json({ error: 'Failed to retrieve album.' });
  }
};

// 8. AUTOPLAY & RECOMMENDATIONS QUEUE
exports.getRecommendations = async (req, res) => {
  try {
    const { trackId } = req.query;
    const userId = req.user?.id;

    let query;
    let params;

    if (trackId) {
      // Find tracks with shared genres or same artist, excluding current track
      query = `
        SELECT DISTINCT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count,
               a.id as artist_id, a.name as artist_name,
               EXISTS(SELECT 1 FROM liked_songs ls WHERE ls.track_id = t.id AND ls.user_id = $2) as is_liked
        FROM tracks t
        JOIN artists a ON a.id = t.artist_id
        LEFT JOIN track_genres tg ON tg.track_id = t.id
        WHERE t.id != $1 AND (
          t.artist_id = (SELECT artist_id FROM tracks WHERE id = $1)
          OR tg.genre_id IN (SELECT genre_id FROM track_genres WHERE track_id = $1)
        )
        ORDER BY t.stream_count DESC
        LIMIT 15
      `;
      params = [trackId, userId || null];
    } else {
      // Fallback top tracks
      query = `
        SELECT t.id, t.title, t.duration, t.audio_url, t.cover_url, t.stream_count,
               a.id as artist_id, a.name as artist_name,
               EXISTS(SELECT 1 FROM liked_songs ls WHERE ls.track_id = t.id AND ls.user_id = $1) as is_liked
        FROM tracks t
        JOIN artists a ON a.id = t.artist_id
        ORDER BY t.stream_count DESC
        LIMIT 15
      `;
      params = [userId || null];
    }

    const result = await pool.query(query, params);
    res.json({ queue: result.rows });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations.' });
  }
};
