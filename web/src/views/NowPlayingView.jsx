import React, { useEffect, useState, useRef } from 'react';
import { X, Mic2, Disc3, Clock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedLikeButton, SpringButton } from '../components/Common/Motion';

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
    seek
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

  // Determine active lyric index
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

  // Smoothly center the active lyric in the viewport
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
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col pb-20 select-none overflow-hidden"
        >
          {/* Immersive Blurred Album Art Backdrop */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <img
              src={currentTrack.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600'}
              alt=""
              className="w-full h-full object-cover scale-150 blur-3xl opacity-35 filter brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#08090E]/85 via-[#0B0C14]/90 to-[#08090E]/95" />
          </div>

          {/* Top Header Bar */}
          <header className="h-16 px-6 md:px-10 flex items-center justify-between border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-purple-300 uppercase tracking-widest">
              <Mic2 size={15} className="text-purple-400" />
              <span>Synced Lyrics</span>
            </div>

            <SpringButton
              onClick={toggleLyrics}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Close (Esc)"
            >
              <X size={22} />
            </SpringButton>
          </header>

          {/* Main Content: 2-Column Split */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 md:p-10 gap-8 lg:gap-12 max-w-7xl mx-auto w-full items-center">
            {/* Left Column: Shared-element Artwork Presentation & Metadata */}
            <div className="w-full lg:w-5/12 flex flex-col items-center justify-center text-center shrink-0">
              <div className="relative group">
                {/* Ambient Backlight Glow */}
                <div
                  className="absolute -inset-6 rounded-3xl opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-60"
                  style={{
                    background: 'radial-gradient(circle, var(--audira-accent-glow) 0%, rgba(6,182,212,0.2) 100%)'
                  }}
                />
                <motion.div
                  layoutId="active-track-art"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                >
                  <img
                    src={currentTrack.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600'}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>

              <div className="mt-8 flex items-center justify-between w-full max-w-xs md:max-w-sm">
                <div className="text-left overflow-hidden min-w-0 pr-3">
                  <h2 className="text-xl sm:text-2xl font-black text-white truncate">{currentTrack.title}</h2>
                  <p className="text-sm font-semibold text-purple-300 truncate mt-0.5">
                    {currentTrack.artist_name || 'Audira Artist'}
                  </p>
                  {currentTrack.album_title && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{currentTrack.album_title}</p>
                  )}
                </div>

                <AnimatedLikeButton
                  isLiked={liked}
                  onToggle={() => toggleLike(currentTrack.id)}
                  size={22}
                  className="p-3 bg-white/5 hover:bg-white/10 shrink-0"
                />
              </div>

          {/* Time Scrubber info */}
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Column: Line-by-line Synced Lyrics */}
        <div
          ref={scrollContainerRef}
          className="w-full lg:w-7/12 h-full overflow-y-auto px-4 md:px-8 py-20 space-y-7 text-left lyrics-mask scrollbar-none"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
              <div className="w-9 h-9 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-300">Loading synced lyrics...</p>
            </div>
          ) : !lyricsData.has_lyrics || lyricsData.lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center py-20">
              <Disc3 size={48} className="mb-4 opacity-40 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
              <h3 className="text-xl font-bold text-slate-200">No lyrics available</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                We couldn't find synced lyrics for this song. Enjoy the high-fidelity audio stream!
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
                  className="group flex items-center gap-4 cursor-pointer"
                >
                  {/* Active Neon Indicator Bar */}
                  <div
                    className={`w-1 rounded-full transition-all duration-300 shrink-0 ${
                      isActive
                        ? 'h-8 bg-purple-400 shadow-glow-accent'
                        : 'h-0 bg-transparent'
                    }`}
                  />

                  <p
                    className={`transition-all duration-300 select-none leading-relaxed ${
                      isActive
                        ? 'text-2xl sm:text-3xl md:text-4xl font-black text-white scale-[1.02] origin-left drop-shadow-[0_4px_24px_var(--audira-accent-glow)]'
                        : isPast
                        ? 'text-lg sm:text-xl md:text-2xl font-bold text-white/50 hover:text-white/80'
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
