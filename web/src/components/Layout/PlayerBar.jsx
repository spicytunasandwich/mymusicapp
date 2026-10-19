import React from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, Heart, Mic2
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

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

  if (!currentTrack) {
    return (
      <footer className="h-20 bg-audira-player border-t border-audira-border flex items-center justify-between px-6 select-none z-30">
        <div className="text-xs text-slate-500">No track selected. Choose a song to begin streaming.</div>
      </footer>
    );
  }

  const liked = isLiked(currentTrack.id);

  return (
    <footer className="h-24 bg-audira-player/95 backdrop-blur-xl border-t border-audira-border flex items-center justify-between px-6 select-none z-30 flex-shrink-0">
      {/* Left: Track Information & Like */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-audira-card border border-audira-border shadow-md flex-shrink-0">
          <img
            src={currentTrack.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
            {currentTrack.title}
          </p>
          <p className="text-xs text-slate-400 truncate hover:text-slate-200 cursor-pointer">
            {currentTrack.artist_name || 'Audira Artist'}
          </p>
        </div>
        <button
          onClick={() => toggleLike(currentTrack.id)}
          className="ml-2 p-1.5 rounded-full hover:bg-audira-hover text-slate-400 transition"
          title={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        >
          <Heart size={18} className={liked ? 'fill-purple-500 text-purple-500' : 'hover:text-white'} />
        </button>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center w-2/4 max-w-xl">
        {/* Buttons */}
        <div className="flex items-center gap-5 mb-1.5">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full transition ${
              isShuffle ? 'text-purple-400 hover:text-purple-300' : 'text-slate-400 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button
            onClick={prevTrack}
            className="p-1.5 rounded-full text-slate-300 hover:text-white transition"
            title="Previous"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center transition shadow-lg shadow-purple-500/20"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} className="fill-black" /> : <Play size={20} className="fill-black ml-0.5" />}
          </button>

          <button
            onClick={nextTrack}
            className="p-1.5 rounded-full text-slate-300 hover:text-white transition"
            title="Next"
          >
            <SkipForward size={20} />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-1.5 rounded-full relative transition ${
              repeatMode !== 'off' ? 'text-purple-400 hover:text-purple-300' : 'text-slate-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
            {repeatMode !== 'off' && (
              <span className="w-1 h-1 bg-purple-400 rounded-full absolute bottom-0.5 left-1/2 -translate-x-1/2" />
            )}
          </button>
        </div>

        {/* Time Progress Scrubber */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 w-9 text-right">
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
          <span className="text-[11px] font-mono text-slate-400 w-9">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Lyrics & Volume */}
      <div className="flex items-center justify-end gap-4 w-1/4 min-w-[180px]">
        {/* Synced Lyrics Toggle Button */}
        <button
          onClick={toggleLyrics}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
            isLyricsOpen
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-900/30'
              : 'text-slate-400 hover:text-white hover:bg-audira-hover'
          }`}
          title="Line-by-line Synced Lyrics"
        >
          <Mic2 size={16} />
          <span>Lyrics</span>
        </button>

        {/* Volume controls */}
        <div className="flex items-center gap-2">
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
            className="w-20"
          />
        </div>
      </div>
    </footer>
  );
}
