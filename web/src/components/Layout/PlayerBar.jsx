import React from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, Heart, Mic2, Sparkles, Disc
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import EqualizerWave from '../Common/EqualizerWave';
import { SpringButton, AnimatedLikeButton } from '../Common/Motion';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isLyricsOpen,
    trackSource,
    spotifyNotice,
    clearSpotifyNotice,
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
  } = usePlayer();
  const { user } = useAuth();

  if (!currentTrack) {
    return (
      <footer className="h-16 md:h-20 bg-black/75 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between px-4 md:px-6 select-none z-30 shrink-0">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
          <span>No track selected. Choose any track to begin listening.</span>
        </div>
      </footer>
    );
  }

  const liked = isLiked(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="relative bg-black/80 backdrop-blur-2xl border-t border-white/10 select-none z-30 shrink-0">
      {/* Spotify Notice Banner */}
      {spotifyNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/30 text-emerald-200 px-4 py-1.5 text-xs flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2 truncate">
            <Sparkles size={14} className="text-emerald-400 shrink-0" />
            <span className="truncate">{spotifyNotice}</span>
          </div>
          <button
            onClick={clearSpotifyNotice}
            className="text-emerald-400 hover:text-white text-[11px] font-bold uppercase ml-3 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Scrubber Line on Mobile */}
      <div className="sm:hidden absolute top-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-audira-accent to-emerald-400 transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="h-20 md:h-24 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 max-w-full">
        {/* Left: Track Details & Like */}
        <div className="flex items-center gap-3 w-auto sm:w-1/4 sm:min-w-[190px] max-w-[50%] sm:max-w-none shrink-0">
          <div className="relative group">
            <motion.div
              layoutId="active-track-art"
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-audira-card border border-white/10 shadow-md shrink-0 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleLyrics}
            >
              <img
                src={currentTrack.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="flex items-center gap-2">
              <p
                onClick={toggleLyrics}
                className="text-xs sm:text-sm font-bold text-white truncate hover:underline cursor-pointer"
              >
                {currentTrack.title}
              </p>
              {isPlaying && <EqualizerWave className="shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p
                onClick={() => {
                  if (currentTrack.artist_id) {
                    window.dispatchEvent(new CustomEvent('linear:open-artist', { detail: currentTrack.artist_id }));
                  }
                }}
                className="text-[11px] sm:text-xs text-slate-400 truncate hover:text-slate-200 cursor-pointer"
              >
                {currentTrack.artist_name || 'Linear Artist'}
              </p>
              {/* Audio Source Badge */}
              {trackSource === 'spotify' && (
                <span className="hidden sm:inline-flex items-center text-[9px] font-bold text-black bg-[#1DB954] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Spotify HD
                </span>
              )}
              {trackSource === 'local' && (
                <span className="hidden sm:inline-flex items-center text-[9px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Local
                </span>
              )}
              {trackSource === 'preview' && (
                <span className="hidden sm:inline-flex items-center text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Preview 30s
                </span>
              )}
              {trackSource === 'stream' && (
                <span className="hidden sm:inline-flex items-center text-[9px] font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Linear Cloud
                </span>
              )}
            </div>
          </div>
          <AnimatedLikeButton
            isLiked={liked}
            onToggle={() => toggleLike(currentTrack.id)}
            size={18}
            className="shrink-0"
          />
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="flex flex-col items-center flex-1 max-w-xl">
          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-5 mb-1 sm:mb-1.5">
            <SpringButton
              onClick={toggleShuffle}
              className={`hidden sm:flex p-1.5 rounded-full transition ${
                isShuffle ? 'text-audira-accent hover:opacity-80' : 'text-slate-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </SpringButton>

            <SpringButton
              onClick={prevTrack}
              className="p-1.5 rounded-full text-slate-300 hover:text-white transition"
              title="Previous"
            >
              <SkipBack size={18} className="sm:w-5 sm:h-5" />
            </SpringButton>

            <SpringButton
              onClick={togglePlay}
              scaleHover={1.08}
              scaleTap={0.92}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black flex items-center justify-center transition shadow-lg shadow-black/40 hover:scale-105"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={18} className="fill-black sm:w-5 sm:h-5" />
              ) : (
                <Play size={18} className="fill-black ml-0.5 sm:w-5 sm:h-5" />
              )}
            </SpringButton>

            <SpringButton
              onClick={nextTrack}
              className="p-1.5 rounded-full text-slate-300 hover:text-white transition"
              title="Next"
            >
              <SkipForward size={18} className="sm:w-5 sm:h-5" />
            </SpringButton>

            <SpringButton
              onClick={cycleRepeat}
              className={`hidden sm:flex p-1.5 rounded-full relative transition ${
                repeatMode !== 'off' ? 'text-audira-accent hover:opacity-80' : 'text-slate-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
              {repeatMode !== 'off' && (
                <span className="w-1.5 h-1.5 bg-audira-accent rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
              )}
            </SpringButton>
          </div>

          {/* Desktop Time Progress Scrubber */}
          <div className="hidden sm:flex w-full items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 w-9 text-right select-none">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime || 0}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-[11px] font-mono text-slate-400 w-9 select-none">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Lyrics, Volume & Presence */}
        <div className="flex items-center justify-end gap-2 sm:gap-4 w-auto sm:w-1/4 sm:min-w-[170px] shrink-0">
          {/* Synced Lyrics Toggle Button */}
          <button
            onClick={toggleLyrics}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              isLyricsOpen
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Line-by-line Synced Lyrics"
          >
            <Mic2 size={16} />
            <span className="hidden md:inline">Lyrics</span>
          </button>

          {/* Volume controls (desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white transition">
              {isMuted || volume === 0 ? (
                <VolumeX size={18} />
              ) : volume < 0.5 ? (
                <Volume1 size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 md:w-20"
            />
          </div>

          {/* User Presence Avatar in PlayerBar */}
          {user && (
            <div
              title={`Streaming as ${user.display_name}`}
              className="hidden lg:flex items-center pl-2.5 border-l border-white/10 shrink-0"
            >
              <div
                className="w-7 h-7 rounded-full overflow-hidden p-[1.5px] bg-audira-card shadow-sm"
                style={{ border: `1.5px solid ${user.accent_color || '#8B5CF6'}` }}
              >
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=audira'}
                  alt={user.display_name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'audira'}`;
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
