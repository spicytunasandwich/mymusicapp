import React, { useEffect, useState } from 'react';
import { Play, Pause, Clock, Heart, Trash2, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { TrackRowSkeleton } from '../components/Common/SkeletonLoader';
import EqualizerWave from '../components/Common/EqualizerWave';

export default function PlaylistView({ playlistId, onBack }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, isLiked } = usePlayer();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playlistId) return;
    setLoading(true);
    api.get(`/library/playlists/${playlistId}`)
      .then(res => setPlaylist(res.playlist))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [playlistId]);

  const handleRemoveTrack = async (trackId) => {
    if (!confirm('Remove track from playlist?')) return;
    try {
      await api.delete(`/library/playlists/${playlistId}/tracks/${trackId}`);
      setPlaylist(prev => ({
        ...prev,
        tracks: prev.tracks.filter(t => t.id !== trackId)
      }));
    } catch (err) {
      alert('Failed to remove track');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="h-48 rounded-3xl bg-audira-card/50 shimmer-bg" />
        <TrackRowSkeleton count={6} />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Playlist not found.</p>
        <button onClick={onBack} className="mt-4 text-purple-400 hover:underline">Go back</button>
      </div>
    );
  }

  const isCurrentPlaylistPlaying = playlist.tracks?.some(t => t.id === currentTrack?.id) && isPlaying;
  const isOwner = user?.id === playlist.user_id;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Playlist Hero Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 bg-gradient-to-b from-purple-950/40 to-transparent p-6 rounded-3xl border border-purple-500/10">
        <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-audira-card shadow-2xl shrink-0 border border-white/10">
          <img
            src={playlist.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600'}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 overflow-hidden text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            {isOwner ? (
              <select
                value={playlist.privacy || (playlist.is_public ? 'public' : 'private')}
                onChange={async (e) => {
                  const newPrivacy = e.target.value;
                  try {
                    await api.put(`/library/playlists/${playlist.id}`, { privacy: newPrivacy });
                    setPlaylist(prev => ({
                      ...prev,
                      privacy: newPrivacy,
                      is_public: newPrivacy !== 'private'
                    }));
                  } catch (err) {
                    console.error('Failed to update privacy:', err);
                  }
                }}
                className="bg-black/60 border border-white/20 text-audira-accent hover:border-audira-accent rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider cursor-pointer outline-none transition"
              >
                <option value="public" className="bg-[#181818] text-white">🌐 Public Playlist</option>
                <option value="link_only" className="bg-[#181818] text-white">🔗 Link-Only Playlist</option>
                <option value="private" className="bg-[#181818] text-white">🔒 Private Playlist</option>
              </select>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider text-audira-accent">
                {playlist.privacy === 'private' ? '🔒 Private Playlist' : playlist.privacy === 'link_only' ? '🔗 Link-Only' : '🌐 Public Playlist'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mt-1 mb-3 truncate">{playlist.title}</h1>
          <p className="text-xs text-slate-400 line-clamp-2 max-w-2xl">{playlist.description}</p>

          <div className="flex items-center justify-center md:justify-start gap-3 mt-4 text-xs font-semibold text-slate-300">
            <span>By <b>@{playlist.owner_username}</b></span>
            <span>•</span>
            <span>{playlist.tracks?.length || 0} songs</span>
            <span>•</span>
            <span className="text-slate-400">
              {Math.floor((playlist.total_duration || 0) / 60)} min
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-4 py-2">
        <button
          onClick={() => {
            if (playlist.tracks?.length > 0) {
              playTrack(playlist.tracks[0], playlist.tracks);
            }
          }}
          className="w-14 h-14 rounded-full bg-audira-accent text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
          title={isCurrentPlaylistPlaying ? 'Pause' : 'Play Playlist'}
        >
          {isCurrentPlaylistPlaying ? (
            <Pause size={24} className="fill-black" />
          ) : (
            <Play size={24} className="fill-black ml-1" />
          )}
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Playlist link copied to clipboard!');
          }}
          className="px-4 py-2 rounded-full border border-white/20 hover:border-white text-xs font-bold text-white transition hover:scale-105 active:scale-95"
        >
          Share
        </button>
      </div>

      {/* Tracks Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-audira-border text-slate-400 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4 hidden md:table-cell">Album</th>
              <th className="py-3 px-4 text-right"><Clock size={15} className="inline" /></th>
              {isOwner && <th className="py-3 px-2 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-audira-border/30">
            {playlist.tracks?.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <tr
                  key={track.id}
                  onClick={() => playTrack(track, playlist.tracks)}
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
                      className="p-1 mr-3 opacity-0 group-hover:opacity-100 hover:text-white transition"
                    >
                      <Heart size={14} className={isLiked(track.id) ? 'fill-purple-500 text-purple-500 opacity-100' : ''} />
                    </button>
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </td>
                  {isOwner && (
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveTrack(track.id); }}
                        className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
