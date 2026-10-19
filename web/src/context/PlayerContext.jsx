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

  // Set audio volume on mount
  useEffect(() => {
    audioRef.current.volume = volume;
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setCurrentTimeMs(Math.floor(audio.currentTime * 1000));
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
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
      setIsPlaying(false);
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

  // Play a track and optionally set queue
  const playTrack = (track, newQueue = null) => {
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

      // Determine stream URL
      const streamUrl = track.audio_url?.startsWith('http')
        ? track.audio_url
        : `/api/v1/music/tracks/${track.id}/stream`;

      audioRef.current.src = streamUrl;
      audioRef.current.currentTime = 0;

      // Sync like state if present
      if (typeof track.is_liked === 'boolean') {
        setLikedMap(prev => ({ ...prev, [track.id]: track.is_liked }));
      }
    }

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
    if (clamped > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
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
    <PlayerContext.Provider value={{
      currentTrack,
      queue,
      isPlaying,
      currentTime,
      currentTimeMs,
      duration,
      volume,
      isMuted,
      isShuffle,
      repeatMode,
      isLyricsOpen,
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
      toggleLike,
      isLiked
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
