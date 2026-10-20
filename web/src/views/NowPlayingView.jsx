import React, { useEffect, useState, useRef } from 'react';
import { X, Mic2, Disc3, Heart, Play, Pause } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function NowPlayingView() {
  const {
    currentTrack,
    currentTime,
    duration,
    currentTimeMs,
    isLyricsOpen,
    toggleLyrics,
    toggleLike,
    isLiked,
    seek,
    isPlaying,
    togglePlay
  } = usePlayer();

  const [lyricsData, setLyricsData] = useState({ synced: false, lines: [], has_lyrics: false });
  const [loading, setLoading] = useState(false);
  const activeLineRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isLyricsOpen) {
        toggleLyrics();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLyricsOpen, toggleLyrics]);

  // Fetch lyrics when track changes or modal opens
  useEffect(() => {
    if (!currentTrack?.id || !isLyricsOpen) return;

    setLoading(true);
    api.get(`/music/tracks/${currentTrack.id}/lyrics`)
      .then(data => setLyricsData(data))
      .catch(err => {
        console.warn('Failed to load lyrics:', err);
        setLyricsData({ synced: false, lines: [], has_lyrics: false });
      })
      .finally(() => setLoading(false));
  }, [currentTrack?.id, isLyricsOpen]);

  // Determine active lyric line index based on currentTimeMs
  let activeIndex = -1;
  if (lyricsData.synced && lyricsData.lines.length > 0) {
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (lyricsData.lines[i].timeMs <= currentTimeMs) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smoothly center the active lyric line in the viewport like Spotify
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  const liked = isLiked(currentTrack?.id);

  return (
    <AnimatePresence>
      {isLyricsOpen && currentTrack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col pb-20 select-none overflow-hidden bg-[#000000]"
        >
          {/* Subtle Ambient Album Tint Backdrop */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <img
              src={currentTrack.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600'}
              alt=""
              className="w-full h-full object-cover scale-150 blur-3xl opacity-20 filter brightness-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-[#000000]/95 to-[#000000]" />
          </div>

          {/* Top Header Bar */}
          <header className="h-16 px-6 md:px-12 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
              <Mic2 size={14} className="text-[var(--audira-accent,#1DB954)]" />
              <span>Synced Lyrics</span>
            </div>

            <button
              onClick={toggleLyrics}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Close Lyrics (Esc)"
            >
              <X size={22} />
            </button>
          </header>

          {/* Main Content: 2-Column Split (Song Art on Left, Synced Lyrics on Right) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 md:p-12 gap-10 max-w-7xl mx-auto w-full items-center">
            
            {/* LEFT COLUMN: Song Art & Track Metadata */}
            <div className="w-full lg:w-5/12 flex flex-col items-center lg:items-start text-center lg:text-left shrink-0">
              <div className="relative group">
                <div className="w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img
                    src={currentTrack.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600'}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between w-full max-w-sm">
                <div className="overflow-hidden min-w-0 pr-3">
                  <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                    {currentTrack.title}
                  </h2>
                  <p className="text-sm font-semibold text-[var(--audira-accent,#1DB954)] truncate mt-0.5">
                    {currentTrack.artist_name || currentTrack.artist || 'Linear Artist'}
                  </p>
                  {currentTrack.album_title && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{currentTrack.album_title}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(currentTrack.id)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition"
                    title={liked ? 'Unlike' : 'Like'}
                  >
                    <Heart size={20} className={liked ? 'fill-[#1DB954] text-[#1DB954]' : 'text-slate-400'} />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="p-2.5 rounded-full bg-[var(--audira-accent,#1DB954)] text-black font-bold hover:scale-105 active:scale-95 transition shadow"
                  >
                    {isPlaying ? <Pause size={18} className="fill-black" /> : <Play size={18} className="fill-black ml-0.5" />}
                  </button>
                </div>
              </div>

              {/* Playback time progress */}
              <div className="mt-3 text-xs font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-1.5">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: 1:1 Spotify Synced Lyrics Reader */}
            <div
              ref={scrollContainerRef}
              className="w-full lg:w-7/12 h-full overflow-y-auto px-4 md:px-8 py-28 space-y-6 text-left scrollbar-none"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                  <div className="w-8 h-8 border-2 border-[var(--audira-accent,#1DB954)] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm font-semibold text-slate-300">Loading synced lyrics...</p>
                </div>
              ) : !lyricsData.has_lyrics || lyricsData.lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center py-20">
                  <Disc3 size={44} className="mb-3 opacity-40 text-slate-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <h3 className="text-lg font-bold text-slate-200">No lyrics available</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Enjoy the music stream! Synced lyrics will appear automatically for supported tracks.
                  </p>
                </div>
              ) : (
                lyricsData.lines.map((line, idx) => {
                  const isActive = idx === activeIndex;
                  const isPast = idx < activeIndex;

                  return (
                    <div
                      key={idx}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => line.timeMs !== null && seek(line.timeMs / 1000)}
                      className="cursor-pointer transition-all duration-300 group py-1"
                    >
                      <p
                        className={`transition-all duration-300 select-none leading-snug ${
                          isActive
                            ? 'text-2xl sm:text-3xl md:text-4xl font-black text-white scale-[1.03] origin-left drop-shadow-[0_2px_16px_rgba(255,255,255,0.4)]'
                            : isPast
                            ? 'text-lg sm:text-xl md:text-2xl font-bold text-white/40 hover:text-white/70'
                            : 'text-lg sm:text-xl md:text-2xl font-bold text-white/20 hover:text-white/50'
                        }`}
                      >
                        {line.text || '♪'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
