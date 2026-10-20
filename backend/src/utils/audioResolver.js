/**
 * Audio Stream & Metadata Resolver
 * Replicates Riff's dynamic music resolution engine.
 * Searches millions of songs and returns crystal-clear audio streams & artwork.
 */

async function searchOnlineTracks(query, limit = 15) {
  if (!query || typeof query !== 'string') return [];
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(cleanQ)}&limit=${limit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.map(item => ({
      title: item.title,
      artist: item.artist?.name || 'Unknown Artist',
      artist_avatar: item.artist?.picture_medium || item.artist?.picture || '',
      album: item.album?.title || '',
      cover_url: item.album?.cover_xl || item.album?.cover_big || item.album?.cover_medium || item.album?.cover || '',
      duration: item.duration || 180,
      audio_url: item.preview || '',
      preview_url: item.preview || '',
      is_explicit: Boolean(item.explicit_lyrics),
      source: 'online_stream'
    }));
  } catch (err) {
    console.warn('[AudioResolver search error]:', err.message);
    return [];
  }
}

async function resolveTrackAudio(title, artist = '') {
  const query = `${artist} ${title}`.trim() || title;
  const tracks = await searchOnlineTracks(query, 5);
  if (tracks.length > 0) {
    return tracks[0];
  }
  return null;
}

module.exports = {
  searchOnlineTracks,
  resolveTrackAudio
};
