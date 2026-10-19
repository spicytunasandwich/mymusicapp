import React, { useEffect, useState } from 'react';
import { Play, Flame, Disc, Radio, Clock, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { usePlayer } from '../context/PlayerContext';

export default function HomeView({ onSelectPlaylist, onSelectArtist, onSelectAlbum }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [data, setData] = useState({
    featured_playlists: [],
    top_tracks: [],
    popular_artists: [],
    new_releases: [],
    recently_played: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/music/home')
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-200">
      {/* Hero Greeting & Quick Access */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-6">
          {getGreeting()}
        </h1>

        {data.recently_played.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.recently_played.map(track => (
              <div
                key={track.id}
                onClick={() => playTrack(track, data.recently_played)}
                className="group flex items-center bg-audira-card/60 hover:bg-audira-card border border-audira-border/50 hover:border-purple-500/40 rounded-xl overflow-hidden cursor-pointer transition shadow-md"
              >
                <img src={track.cover_url} alt={track.title} className="w-16 h-16 object-cover flex-shrink-0" />
                <div className="flex-1 px-4 overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{track.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{track.artist_name}</p>
                </div>
                <button className="mr-3 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg shadow-purple-900/50 transition">
                  <Play size={16} className="fill-white ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Playlists */}
      {data.featured_playlists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles size={20} className="text-purple-400" />
              Featured Playlists
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {data.featured_playlists.map(playlist => (
              <div
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                className="group bg-audira-card/40 hover:bg-audira-card p-4 rounded-2xl border border-audira-border/40 hover:border-audira-border transition duration-200 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#0D0E15]">
                  <img
                    src={playlist.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500'}
                    alt={playlist.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute right-3 bottom-3 w-11 h-11 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition shadow-xl shadow-purple-900/60">
                    <Play size={18} className="fill-white ml-0.5" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white truncate">{playlist.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {playlist.description || `By @${playlist.owner_username}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Tracks */}
      {data.top_tracks.length > 0 && (
        <section>
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
            <Flame size={20} className="text-orange-400" />
            Top Songs Today
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.top_tracks.map((track, i) => (
              <div
                key={track.id}
                onClick={() => playTrack(track, data.top_tracks)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                  currentTrack?.id === track.id
                    ? 'bg-purple-950/20 border-purple-500/50'
                    : 'bg-audira-card/40 hover:bg-audira-card border-audira-border/40 hover:border-audira-border'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xs font-bold text-slate-500 w-4 text-center">{i + 1}</span>
                  <img src={track.cover_url} alt={track.title} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className={`text-xs font-bold truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{track.artist_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 text-xs mr-2">
                  <span className="text-[11px] font-mono">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                  <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md">
                    <Play size={14} className="fill-black ml-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Artists */}
      {data.popular_artists.length > 0 && (
        <section>
          <h2 className="text-xl font-black text-white mb-4">Popular Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {data.popular_artists.map(artist => (
              <div
                key={artist.id}
                onClick={() => onSelectArtist?.(artist.id)}
                className="group flex flex-col items-center text-center cursor-pointer p-3 rounded-2xl hover:bg-audira-card/50 transition"
              >
                <div className="relative aspect-square w-full rounded-full overflow-hidden mb-3 bg-[#11121C] shadow-lg border border-purple-500/20 group-hover:border-purple-500 transition">
                  <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <h4 className="text-xs font-bold text-white truncate max-w-full">{artist.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Artist</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
