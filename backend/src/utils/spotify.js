let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Extracts a Spotify playlist ID from any URL, URI, or shortlink.
 * Supports:
 * - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc
 * - https://open.spotify.com/intl-de/playlist/37i9dQZF1DXcBWIGoYBM5M
 * - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 * - https://spotify.link/... (shortlink redirects)
 * - Plain 22-character alphanumeric ID
 */
async function extractPlaylistId(input) {
  if (!input) return null;
  let str = input.trim();

  // Handle spotify.link shortlinks by resolving HTTP redirect
  if (str.includes('spotify.link') || str.includes('spoti.fi')) {
    try {
      const res = await fetch(str, { method: 'HEAD', redirect: 'follow' });
      str = res.url || str;
    } catch (e) {
      console.warn('Failed to resolve Spotify shortlink redirect:', e.message);
    }
  }

  // International & standard open.spotify.com playlist URL
  const urlMatch = str.match(/(?:playlist|album)[\/:]([a-zA-Z0-9]{15,30})/);
  if (urlMatch) return urlMatch[1];

  // Spotify URI format (spotify:playlist:xxxx)
  const uriMatch = str.match(/spotify:playlist:([a-zA-Z0-9]{15,30})/);
  if (uriMatch) return uriMatch[1];

  // Raw alphanumeric ID (e.g. 22 chars)
  const rawMatch = str.match(/^[a-zA-Z0-9]{15,30}$/);
  if (rawMatch) return str;

  return null;
}

/**
 * Retrieves a Spotify Client Credentials bearer token (if keys are set).
 */
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null; // Signals fallback to public zero-key scraper
  }

  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  try {
    const credentials = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      console.warn('Spotify Client Credentials rejected, falling back to public scraper.');
      return null;
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);
    return cachedToken;
  } catch (err) {
    console.warn('Spotify token fetch error, falling back to public scraper:', err.message);
    return null;
  }
}

/**
 * Zero-Key Fallback Engine: Parses public Spotify playlist metadata and tracks
 * directly from Spotify's web embed, requiring zero developer credentials.
 */
async function fetchViaPublicScraper(playlistId) {
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
  const res = await fetch(embedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!res.ok) {
    throw new Error('Spotify playlist not found or is private. Ensure the playlist is set to Public.');
  }

  const html = await res.text();
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(marker);

  if (start === -1) {
    throw new Error('Could not parse Spotify playlist structure. Ensure the URL is a public playlist.');
  }

  const jsonStart = start + marker.length;
  const jsonEnd = html.indexOf('</script>', jsonStart);
  const data = JSON.parse(html.slice(jsonStart, jsonEnd));
  const entity = data.props?.pageProps?.state?.data?.entity;

  if (!entity) {
    throw new Error('Spotify playlist data unavailable or private.');
  }

  const tracks = (entity.trackList || []).map((t, idx) => ({
    spotify_id: t.uri ? t.uri.split(':').pop() : `sp_track_${idx}`,
    title: t.title || 'Untitled Track',
    artist: t.subtitle || 'Unknown Artist',
    album: '',
    duration_ms: t.duration || 0,
    cover_url: entity.coverArt?.sources?.[0]?.url || ''
  }));

  return {
    id: entity.id || playlistId,
    name: entity.name || 'Imported Spotify Playlist',
    description: entity.subtitle || '',
    cover_url: entity.coverArt?.sources?.[0]?.url || '',
    total_tracks: tracks.length,
    tracks
  };
}

/**
 * Official Spotify Web API Engine with offset pagination for >100 tracks.
 */
async function fetchViaOfficialApi(playlistId, token) {
  const playlistRes = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=id,name,description,images,tracks(total)`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!playlistRes.ok) {
    throw new Error(`Spotify API error: ${playlistRes.statusText}`);
  }

  const playlistData = await playlistRes.json();
  const totalExpected = playlistData.tracks?.total || 100;
  const tracks = [];
  let offset = 0;
  let hasMore = true;

  // Paginate in 100-track batches up to 1000 tracks
  while (hasMore && tracks.length < 1000) {
    const pageUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&offset=${offset}&fields=items(track(id,name,duration_ms,preview_url,artists(name),album(name,images))),next,total`;
    const tracksRes = await fetch(pageUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!tracksRes.ok) break;

    const pageData = await tracksRes.json();
    if (Array.isArray(pageData.items)) {
      for (const item of pageData.items) {
        if (item.track && item.track.name) {
          tracks.push({
            spotify_id: item.track.id,
            title: item.track.name,
            artist: item.track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
            album: item.track.album?.name || '',
            duration_ms: item.track.duration_ms,
            preview_url: item.track.preview_url || '',
            cover_url: item.track.album?.images?.[0]?.url || ''
          });
        }
      }
    }

    if (!pageData.next || pageData.items.length === 0) {
      hasMore = false;
    } else {
      offset += 100;
    }
  }

  return {
    id: playlistData.id,
    name: playlistData.name,
    description: playlistData.description || '',
    cover_url: playlistData.images?.[0]?.url || '',
    total_tracks: totalExpected,
    tracks
  };
}

/**
 * Main Hybrid Fetcher:
 * Tries official API with pagination if keys are set; falls back to zero-key scraper.
 */
async function fetchSpotifyPlaylist(playlistId) {
  const token = await getSpotifyAccessToken();

  if (token) {
    try {
      console.log(`📡 Fetching playlist ${playlistId} via Spotify Web API (with pagination)...`);
      return await fetchViaOfficialApi(playlistId, token);
    } catch (err) {
      console.warn('Official API failed, trying zero-key public fallback:', err.message);
    }
  }

  // Fallback: Zero-key public scraper
  console.log(`🌐 Fetching playlist ${playlistId} via zero-key public scraper...`);
  return await fetchViaPublicScraper(playlistId);
}

module.exports = {
  extractPlaylistId,
  getSpotifyAccessToken,
  fetchSpotifyPlaylist
};
