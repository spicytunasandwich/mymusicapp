import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const { isAuthenticated, openAuth } = useAuth();
  const audioRef = useRef(new Audio());

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [likedMap, setLikedMap] = useState({}); // { [trackId]: true }

  // Audio source: 'spotify' | 'local' | 'stream' | 'preview'
  const [trackSource, setTrackSource] = useState('stream');
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Spotify Web Playback SDK state
  const [spotifyToken, setSpotifyToken] = useState(() => localStorage.getItem('linear_spotify_token') || '');
  const [spotifyUser, setSpotifyUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('linear_spotify_user') || 'null');
    } catch {
      return null;
    }
  });
  const [spotifyDeviceId, setSpotifyDeviceId] = useState(null);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [isSpotifyPremium, setIsSpotifyPremium] = useState(false);
  const [spotifyNotice, setSpotifyNotice] = useState('');
  const spotifyPlayerRef = useRef(null);
  const isPlayingSpotifyRef = useRef(false);

  // Set audio volume on mount
  useEffect(() => {
    audioRef.current.volume = volume;
  }, []);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!spotifyToken || typeof window === 'undefined') return;

    // Fetch Spotify user profile to check for Premium status
    fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${spotifyToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setSpotifyUser(data);
          localStorage.setItem('linear_spotify_user', JSON.stringify(data));
          const hasPremium = data.product === 'premium';
          setIsSpotifyPremium(hasPremium);
          if (!hasPremium) {
            setSpotifyNotice('Spotify account detected, but it is not Premium. Full playback requires Spotify Premium; using 30s previews and cloud streams.');
          }
        }
      })
      .catch(err => console.warn('Spotify profile check failed:', err));

    const initPlayer = () => {
      if (!window.Spotify || spotifyPlayerRef.current) return;

      const player = new window.Spotify.Player({
        name: 'Linear Web Player',
        getOAuthToken: (cb) => cb(spotifyToken),
        volume: volume
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('✅ Spotify Web Playback SDK ready with Device ID:', device_id);
        setSpotifyDeviceId(device_id);
        setIsSpotifyReady(true);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.warn('Spotify Device ID went offline:', device_id);
        setIsSpotifyReady(false);
      });

      player.addListener('player_state_changed', (state) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        isPlayingSpotifyRef.current = !state.paused;
        setCurrentTime(Math.floor(state.position / 1000));
        setCurrentTimeMs(state.position);
        setDuration(Math.floor(state.duration / 1000));
      });

      player.addListener('account_error', ({ message }) => {
        console.warn('Spotify account error:', message);
        setIsSpotifyPremium(false);
        setSpotifyNotice('Spotify Web Playback requires a Spotify Premium account.');
      });

      player.addListener('authentication_error', ({ message }) => {
        console.warn('Spotify auth error:', message);
        setSpotifyToken('');
        localStorage.removeItem('linear_spotify_token');
        setSpotifyNotice('Spotify session expired. Please reconnect your account.');
      });

      player.connect();
      spotifyPlayerRef.current = player;
    };

    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }

    return () => {
      if (spotifyPlayerRef.current) {
        spotifyPlayerRef.current.disconnect();
        spotifyPlayerRef.current = null;
      }
    };
  }, [spotifyToken]);

  const connectSpotify = async (token) => {
    if (!token) return;
    const cleanToken = token.trim();
    localStorage.setItem('linear_spotify_token', cleanToken);
    setSpotifyToken(cleanToken);
  };

  const disconnectSpotify = () => {
    if (spotifyPlayerRef.current) {
      spotifyPlayerRef.current.disconnect();
      spotifyPlayerRef.current = null;
    }
    localStorage.removeItem('linear_spotify_token');
    localStorage.removeItem('linear_spotify_user');
    setSpotifyToken('');
    setSpotifyUser(null);
    setSpotifyDeviceId(null);
    setIsSpotifyReady(false);
    setIsSpotifyPremium(false);
    setSpotifyNotice('');
  };

  // Audio event listeners for HTML5 Audio
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (!isPlayingSpotifyRef.current) {
        setCurrentTime(audio.currentTime);
        setCurrentTimeMs(Math.floor(audio.currentTime * 1000));
      }
    };

    const onLoadedMetadata = () => {
      if (!isPlayingSpotifyRef.current) {
        setDuration(audio.duration || 0);
      }
    };

    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        nextTrack();
      }
    };

    const onError = (e) => {
      console.warn('Audio playback error:', e);
      if (audioRef.current && !audioRef.current.src.includes('soundhelix')) {
        audioRef.current.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [repeatMode, queue, currentTrack]);

  // Hook Electron Global Media Keys
  useEffect(() => {
    if (typeof window !== 'undefined' && window.audiraDesktop?.onMediaCommand) {
      window.audiraDesktop.onMediaCommand((command) => {
        if (command === 'toggle-play') togglePlay();
        else if (command === 'next-track') nextTrack();
        else if (command === 'prev-track') prevTrack();
      });
    }
  }, [isPlaying, queue, currentTrack]);

  // Sync track with Desktop Tray / Status
  useEffect(() => {
    if (typeof window !== 'undefined' && window.audiraDesktop?.updateTrackStatus && currentTrack) {
      window.audiraDesktop.updateTrackStatus(currentTrack);
    }
  }, [currentTrack]);

  // Play a track and determine source priority
  const playTrack = async (track, newQueue = null) => {
    if (!track) return;

    if (newQueue) {
      setQueue(newQueue);
    } else if (!queue.some(t => t.id === track.id)) {
      setQueue(prev => [...prev, track]);
    }

    if (currentTrack?.id !== track.id) {
      if (currentTrack) {
        setHistory(prev => [currentTrack, ...prev.slice(0, 30)]);
      }
      setCurrentTrack(track);

      // Sync like state if present
      if (typeof track.is_liked === 'boolean') {
        setLikedMap(prev => ({ ...prev, [track.id]: track.is_liked }));
      }
    }

    // 1. Matched Local File Priority
    if (track.source === 'local' || (track.audio_url && track.audio_url.startsWith('file://'))) {
      if (spotifyPlayerRef.current) spotifyPlayerRef.current.pause();
      isPlayingSpotifyRef.current = false;
      setTrackSource('local');
      audioRef.current.src = track.audio_url;
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      return;
    }

    // 2. Spotify Web Playback SDK (if Spotify Premium connected & track has spotify_id)
    const spotifyId = track.spotify_id || (track.spotify_uri ? track.spotify_uri.replace('spotify:track:', '') : null);
    if (spotifyId && isSpotifyReady && isSpotifyPremium && spotifyDeviceId) {
      try {
        audioRef.current.pause();
        const playRes = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: [`spotify:track:${spotifyId}`] })
        });

        if (playRes.ok || playRes.status === 204) {
          setTrackSource('spotify');
          isPlayingSpotifyRef.current = true;
          setIsPlaying(true);
          return;
        }
      } catch (sdkErr) {
        console.warn('Spotify SDK playback call error, falling back to audio stream:', sdkErr);
      }
    }

    // 3. Play via HTML5 Audio (Supports local offline blobs & online streams)
    if (spotifyPlayerRef.current) spotifyPlayerRef.current.pause();
    isPlayingSpotifyRef.current = false;

    let streamUrl = track.audio_url || track.preview_url;
    if (!streamUrl || (!streamUrl.startsWith('http') && !streamUrl.startsWith('blob:'))) {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://audira-backend.onrender.com/api/v1').replace(/\/+$/, '');
      streamUrl = `${baseUrl}/music/tracks/${track.id}/stream`;
    }

    if (track.isLocal || streamUrl.startsWith('blob:')) {
      setTrackSource('local');
      setSpotifyNotice('');
    } else if (track.preview_url || spotifyId) {
      setTrackSource(track.preview_url ? 'preview' : 'stream');
      if (!isSpotifyPremium && spotifyId) {
        setSpotifyNotice('Playing uncompressed stream preview. Connect Spotify in Settings to sync with your devices.');
      }
    } else {
      setTrackSource('stream');
    }

    audioRef.current.src = streamUrl;
    audioRef.current.currentTime = 0;
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(err => {
        console.warn('Autoplay prevented or failed:', err);
        setIsPlaying(false);
      });
  };

  const togglePlay = () => {
    if (!currentTrack) {
      if (queue.length > 0) playTrack(queue[0]);
      return;
    }

    if (isPlayingSpotifyRef.current && spotifyPlayerRef.current) {
      spotifyPlayerRef.current.togglePlay();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const seek = (timeInSeconds) => {
    if (isPlayingSpotifyRef.current && spotifyPlayerRef.current) {
      spotifyPlayerRef.current.seek(Math.floor(timeInSeconds * 1000));
      return;
    }
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeInSeconds;
    setCurrentTime(timeInSeconds);
    setCurrentTimeMs(Math.floor(timeInSeconds * 1000));
  };

  const nextTrack = () => {
    if (queue.length === 0) return;

    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    let nextIndex;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          // Fetch autoplay recommendations
          if (currentTrack?.id) {
            api.get(`/music/recommendations?trackId=${currentTrack.id}`)
              .then(res => {
                if (res.queue?.length > 0) {
                  setQueue(prev => [...prev, ...res.queue]);
                  playTrack(res.queue[0]);
                } else {
                  setIsPlaying(false);
                }
              })
              .catch(() => setIsPlaying(false));
          }
          return;
        }
      }
    }

    playTrack(queue[nextIndex]);
  };

  const prevTrack = () => {
    if (currentTime > 3) {
      seek(0);
      return;
    }
    if (history.length > 0) {
      const prev = history[0];
      setHistory(h => h.slice(1));
      playTrack(prev);
    } else {
      const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
      if (currentIndex > 0) {
        playTrack(queue[currentIndex - 1]);
      } else {
        seek(0);
      }
    }
  };

  const setVolume = (val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    audioRef.current.volume = clamped;
    if (spotifyPlayerRef.current) {
      spotifyPlayerRef.current.setVolume(clamped);
    }
    if (clamped > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      if (spotifyPlayerRef.current) spotifyPlayerRef.current.setVolume(volume || 0.5);
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      if (spotifyPlayerRef.current) spotifyPlayerRef.current.setVolume(0);
      setIsMuted(true);
    }
  };

  const toggleShuffle = () => setIsShuffle(s => !s);

  const cycleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleLyrics = () => setIsLyricsOpen(o => !o);

  const stopPlayback = () => {
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch (_) {}
    if (spotifyPlayerRef.current) {
      spotifyPlayerRef.current.pause().catch(() => {});
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentTime(0);
    setCurrentTimeMs(0);
  };

  const toggleLike = async (trackId) => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    try {
      const res = await api.post(`/library/likes/${trackId}`);
      setLikedMap(prev => ({ ...prev, [trackId]: res.is_liked }));
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const isLiked = (trackId) => Boolean(likedMap[trackId]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        history,
        isPlaying,
        currentTime,
        currentTimeMs,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        isLyricsOpen,
        trackSource,
        isOnline,
        spotifyToken,
        spotifyUser,
        isSpotifyReady,
        isSpotifyPremium,
        spotifyNotice,
        clearSpotifyNotice: () => setSpotifyNotice(''),
        connectSpotify,
        disconnectSpotify,
        playTrack,
        togglePlay,
        seek,
        nextTrack,
        prevTrack,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        toggleLyrics,
        stopPlayback,
        toggleLike,
        isLiked,
        setQueue
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
