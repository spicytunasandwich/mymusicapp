import React, { useEffect, useState } from 'react';
import { Play, Pause, Clock, Heart, ArrowLeft, Music } from 'lucide-react';
import { api } from '../api/client';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { TrackRowSkeleton } from '../components/Common/SkeletonLoader';
import EqualizerWave from '../components/Common/EqualizerWave';

export default function LikedSongsView({ onBack }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, isLiked } = usePlayer();
  const { user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/library/likes')
      .then(res => setTracks(res.tracks || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isLikedPlaying = tracks.some(t => t.id === currentTrack?.id) && isPlaying;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 bg-gradient-to-b from-purple-900/40 via-purple-950/20 to-transparent p-6 rounded-3xl border border-purple-500/20">
        <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 flex items-center justify-center shadow-2xl shrink-0">
          <Heart size={64} className="fill-white text-white drop-shadow-md" />
        </div>
        <div className="flex-1 overflow-hidden text-center md:text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Playlist</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-1 mb-3">Liked Songs</h1>
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-slate-300">
            <span>@{user?.username || 'user'}</span>
            <span>•</span>
            <span>{tracks.length} songs</span>
          </div>
        </div>
      </div>

      {tracks.length > 0 && (
        <div className="py-2">
          <button
            onClick={() => playTrack(tracks[0], tracks)}
            className="w-14 h-14 rounded-full bg-audira-accent text-white flex items-center justify-center shadow-glow-accent hover:scale-105 active:scale-95 transition"
            title={isLikedPlaying ? 'Pause' : 'Play Liked Songs'}
          >
            {isLikedPlaying ? (
              <Pause size={24} className="fill-white" />
            ) : (
              <Play size={24} className="fill-white ml-1" />
            )}
          </button>
        </div>
      )}

      {/* Tracks Table */}
      {loading ? (
        <TrackRowSkeleton count={8} />
      ) : tracks.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          No liked songs yet. Click the heart icon on any song to save it here!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-audira-border text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden md:table-cell">Album</th>
                <th className="py-3 px-4 text-right"><Clock size={15} className="inline" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-audira-border/30">
              {tracks.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                const isCurrentPlaying = isCurrent && isPlaying;

                return (
                  <tr
                    key={track.id}
                    onClick={() => playTrack(track, tracks)}
                    className={`group hover:bg-audira-card/60 transition cursor-pointer ${isCurrent ? 'bg-purple-950/20' : ''}`}
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-bold">
                      <span className="group-hover:hidden flex items-center justify-center">
                        {isCurrentPlaying ? (
                          <EqualizerWave className="mx-auto" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <Play size={13} className="hidden group-hover:inline fill-white text-white mx-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={track.cover_url} alt={track.title} className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm" />
                        <div>
                          <p className={`font-bold truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>{track.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{track.artist_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 hidden md:table-cell truncate max-w-xs">{track.album_title || 'Single'}</td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                        className="p-1 mr-3 hover:text-white transition"
                      >
                        <Heart size={14} className={isLiked(track.id) ? 'fill-purple-500 text-purple-500' : ''} />
                      </button>
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
