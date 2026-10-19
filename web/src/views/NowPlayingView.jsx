import React, { useEffect, useState, useRef } from 'react';
import { X, Mic2, Heart, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../api/client';

export default function NowPlayingView() {
  const { currentTrack, currentTimeMs, isLyricsOpen, toggleLyrics, toggleLike, isLiked, seek } = usePlayer();
  const [lyricsData, setLyricsData] = useState({ synced: false, lines: [], has_lyrics: false });
  const [loading, setLoading] = useState(false);
  const activeLineRef = useRef(null);
  const scrollContainerRef = useRef(null);

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

  // Find active synced lyric index
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

  // Auto-scroll active line to vertical center of container
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  if (!isLyricsOpen || !currentTrack) return null;

  const liked = isLiked(currentTrack.id);

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-[#1E112A] via-[#0B0C14] to-[#06070B] flex flex-col animate-in fade-in duration-300 pb-24">
      {/* Header bar */}
      <div className="h-16 px-8 flex items-center justify-between border-b border-purple-900/30">
        <div className="flex items-center gap-2 text-purple-300 text-xs font-bold tracking-wider uppercase">
          <Mic2 size={16} />
          <span>Now Playing & Synced Lyrics</span>
        </div>
        <button
          onClick={toggleLyrics}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          title="Close Lyrics View"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Split: Left Cover Art + Right Synced Lyrics */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-8 gap-8 max-w-7xl mx-auto w-full items-center">
        {/* Left Side: Cover Art + Track Details */}
        <div className="w-full md:w-5/12 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative group">
            <div
              className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl transition duration-500 group-hover:opacity-60"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(6,182,212,0.3) 100%)'
              }}
            />
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20">
              <img
                src={currentTrack.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600'}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between w-full max-w-xs">
            <div className="text-left overflow-hidden">
              <h2 className="text-2xl font-black text-white truncate">{currentTrack.title}</h2>
              <p className="text-sm font-semibold text-purple-300 truncate">{currentTrack.artist_name || 'Audira Artist'}</p>
              {currentTrack.album_title && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{currentTrack.album_title}</p>
              )}
            </div>
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition flex-shrink-0"
            >
              <Heart size={22} className={liked ? 'fill-purple-500 text-purple-500' : 'text-slate-400 hover:text-white'} />
            </button>
          </div>
        </div>

        {/* Right Side: Line-by-line Synced Lyrics */}
        <div
          ref={scrollContainerRef}
          className="w-full md:w-7/12 h-full overflow-y-auto px-4 md:px-8 py-16 space-y-6 text-left mask-fade"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold">Loading synced lyrics...</p>
            </div>
          ) : !lyricsData.has_lyrics || lyricsData.lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center py-20">
              <Music size={40} className="mb-4 opacity-40 text-purple-400" />
              <h3 className="text-lg font-bold text-slate-300">No lyrics available</h3>
              <p className="text-xs text-slate-500 mt-1">Enjoy the music flow!</p>
            </div>
          ) : (
            lyricsData.lines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <p
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => line.timeMs !== null && seek(line.timeMs / 1000)}
                  className={`text-xl md:text-2xl font-extrabold cursor-pointer transition-all duration-300 select-none ${
                    isActive
                      ? 'text-white scale-105 origin-left text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-cyan-200 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]'
                      : isPast
                      ? 'text-slate-400/80 hover:text-white'
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {line.text || '♪'}
                </p>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
