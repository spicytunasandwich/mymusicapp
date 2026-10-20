/**
 * Offline & Local Media Engine (IndexedDB)
 * Replicates Riff's offline playback & local media architecture.
 * Supports MP3, FLAC, WAV, M4A, OGG files stored locally in the browser.
 */

const DB_NAME = 'linear_offline_db';
const DB_VERSION = 1;

let dbPromise = null;

export function openOfflineDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Local offline tracks store
      if (!db.objectStoreNames.contains('local_tracks')) {
        const trackStore = db.createObjectStore('local_tracks', { keyPath: 'id' });
        trackStore.createIndex('title', 'title', { unique: false });
        trackStore.createIndex('artist', 'artist', { unique: false });
        trackStore.createIndex('addedAt', 'addedAt', { unique: false });
      }

      // Cached playlists store for offline browsing
      if (!db.objectStoreNames.contains('cached_playlists')) {
        db.createObjectStore('cached_playlists', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Extracts Title and Artist from common audio file naming schemes:
 * - "Artist - Title.mp3"
 * - "Artist - Track - Title.mp3"
 * - "Title.mp3"
 */
export function parseAudioFilename(filename) {
  const clean = filename.replace(/\.[a-zA-Z0-9]+$/, '').trim();
  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    return { title: title || clean, artist: artist || 'Local Artist' };
  }
  return { title: clean, artist: 'Local Artist' };
}

/**
 * Reads an audio File, extracts duration using an audio element,
 * and saves into IndexedDB.
 */
export async function saveLocalAudioFile(file) {
  const db = await openOfflineDb();
  const { title, artist } = parseAudioFilename(file.name);
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Measure approximate duration using temporary Object URL
  const tempUrl = URL.createObjectURL(file);
  let duration = 0;
  try {
    const audio = new Audio();
    duration = await new Promise((resolve) => {
      audio.src = tempUrl;
      audio.onloadedmetadata = () => resolve(Math.round(audio.duration || 0));
      audio.onerror = () => resolve(0);
      setTimeout(() => resolve(0), 1500); // 1.5s timeout safety
    });
  } catch (_) {
    duration = 0;
  } finally {
    URL.revokeObjectURL(tempUrl);
  }

  const trackRecord = {
    id,
    title,
    artist,
    album: 'Local Library',
    duration: duration || 180,
    size: file.size,
    type: file.type || 'audio/mpeg',
    fileName: file.name,
    addedAt: Date.now(),
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    blob: file,
    isLocal: true,
    isOffline: true
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('local_tracks', 'readwrite');
    const store = tx.objectStore('local_tracks');
    const req = store.put(trackRecord);

    req.onsuccess = () => {
      // Return with live object URL for immediate playback
      const liveBlobUrl = URL.createObjectURL(file);
      resolve({
        ...trackRecord,
        audio_url: liveBlobUrl,
        blobUrl: liveBlobUrl
      });
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all stored offline local tracks with freshly generated blob URLs.
 */
export async function getAllLocalAudioTracks() {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('local_tracks', 'readonly');
      const store = tx.objectStore('local_tracks');
      const req = store.getAll();

      req.onsuccess = () => {
        const items = req.result || [];
        const mapped = items.map(item => {
          const blobUrl = item.blob ? URL.createObjectURL(item.blob) : '';
          return {
            ...item,
            audio_url: blobUrl,
            blobUrl: blobUrl
          };
        });
        // Sort newest first
        mapped.sort((a, b) => b.addedAt - a.addedAt);
        resolve(mapped);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load local tracks from IndexedDB:', err);
    return [];
  }
}

/**
 * Deletes a local track from IndexedDB by id.
 */
export async function deleteLocalAudioTrack(id) {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('local_tracks', 'readwrite');
    const store = tx.objectStore('local_tracks');
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Caches an online playlist for offline viewing and playback.
 */
export async function cachePlaylistForOffline(playlist) {
  if (!playlist || !playlist.id) return;
  try {
    const db = await openOfflineDb();
    const tx = db.transaction('cached_playlists', 'readwrite');
    const store = tx.objectStore('cached_playlists');
    store.put({
      id: String(playlist.id),
      title: playlist.title,
      description: playlist.description || '',
      cover_url: playlist.cover_url,
      tracks: playlist.tracks || [],
      cachedAt: Date.now()
    });
  } catch (err) {
    console.warn('Failed to cache playlist offline:', err);
  }
}

/**
 * Retrieves all cached offline playlists.
 */
export async function getCachedOfflinePlaylists() {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_playlists', 'readonly');
      const store = tx.objectStore('cached_playlists');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (_) {
    return [];
  }
}
