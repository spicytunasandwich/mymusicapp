let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Extracts a Spotify playlist ID from any URL or URI format.
 * Examples:
 * - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc
 * - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 * - 37i9dQZF1DXcBWIGoYBM5M
 */
function extractPlaylistId(input) {
  if (!input) return null;
  const str = input.trim();

  // URL format
  const urlMatch = str.match(/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // URI format
  const uriMatch = str.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // Raw alphanumeric ID (typically 22 chars)
  if (/^[a-zA-Z0-9]{15,30}$/.test(str)) {
    return str;
  }

  return null;
}

/**
 * Retrieves a Spotify Client Credentials bearer token.
 */
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify API credentials (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET) are not configured in .env');
  }

  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Spotify access token: ${errorText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);
  return cachedToken;
}

/**
 * Fetches playlist metadata and all tracks from Spotify API.
 */
async function fetchSpotifyPlaylist(playlistId) {
  const token = await getSpotifyAccessToken();

  const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=id,name,description,images,tracks.total`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!playlistRes.ok) {
    if (playlistRes.status === 404) throw new Error('Spotify playlist not found or is private.');
    throw new Error(`Spotify API error: ${playlistRes.statusText}`);
  }

  const playlistData = await playlistRes.json();

  // Fetch tracks (up to 100 tracks per page)
  let tracks = [];
  let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,duration_ms,artists(name),album(name,images))),next`;

  while (nextUrl && tracks.length < 500) {
    const tracksRes = await fetch(nextUrl, {
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
            artist: item.track.artists?.[0]?.name || 'Unknown Artist',
            album: item.track.album?.name || '',
            duration_ms: item.track.duration_ms,
            cover_url: item.track.album?.images?.[0]?.url || ''
          });
        }
      }
    }
    nextUrl = pageData.next;
  }

  return {
    id: playlistData.id,
    name: playlistData.name,
    description: playlistData.description || '',
    cover_url: playlistData.images?.[0]?.url || '',
    total_tracks: playlistData.tracks?.total || tracks.length,
    tracks
  };
}

module.exports = {
  extractPlaylistId,
  getSpotifyAccessToken,
  fetchSpotifyPlaylist
};
