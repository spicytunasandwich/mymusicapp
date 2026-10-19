import React, { useEffect, useState } from 'react';
import { Heart, Folder, Music2, Plus, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

export default function LibraryView({ onSelectPlaylist, onSelectLiked }) {
  const { isAuthenticated, openAuth } = useAuth();
  const { playTrack } = usePlayer();
  const [library, setLibrary] = useState({
    liked_songs_count: 0,
    folders: [],
    playlists: [],
    followed_artists: [],
    liked_albums: []
  });
  const [activeTab, setActiveTab] = useState('all'); // all, playlists, folders, artists
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    api.get('/library')
      .then(res => setLibrary(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mb-4">
          <Heart size={28} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Enjoy Your Library</h2>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          Log in to see your Liked Songs, custom playlists, folders, and followed artists.
        </p>
        <button
          onClick={() => openAuth('login')}
          className="px-6 py-2.5 rounded-full font-bold text-xs bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-xl shadow-purple-900/40 hover:opacity-95 transition"
        >
          Log in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Your Library</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'playlists', 'folders', 'artists'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${
              activeTab === tab
                ? 'bg-white text-black shadow-md'
                : 'bg-audira-card text-slate-400 hover:text-white hover:bg-audira-hover'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid Collections */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {/* Liked Songs Hero Box */}
        {(activeTab === 'all' || activeTab === 'playlists') && (
          <div
            onClick={onSelectLiked}
            className="col-span-2 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 p-6 rounded-2xl flex flex-col justify-between cursor-pointer shadow-xl hover:scale-[1.01] transition"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Collection</span>
              <h3 className="text-3xl font-black text-white">Liked Songs</h3>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/90">
                {library.liked_songs_count} songs saved
              </span>
              <div className="w-12 h-12 rounded-full bg-white text-purple-700 flex items-center justify-center shadow-lg">
                <Heart size={22} className="fill-purple-700" />
              </div>
            </div>
          </div>
        )}

        {/* User Playlists */}
        {(activeTab === 'all' || activeTab === 'playlists') && library.playlists.map(playlist => (
          <div
            key={playlist.id}
            onClick={() => onSelectPlaylist(playlist.id)}
            className="group bg-audira-card/40 hover:bg-audira-card p-4 rounded-2xl border border-audira-border transition cursor-pointer flex flex-col"
          >
            <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#0D0E15]">
              <img
                src={playlist.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500'}
                alt={playlist.title}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            </div>
            <h4 className="text-xs font-bold text-white truncate">{playlist.title}</h4>
            <p className="text-[11px] text-slate-400 mt-1">Playlist • {playlist.track_count} songs</p>
          </div>
        ))}

        {/* Folders */}
        {(activeTab === 'all' || activeTab === 'folders') && library.folders.map(folder => (
          <div
            key={folder.id}
            className="bg-audira-card/40 hover:bg-audira-card p-5 rounded-2xl border border-audira-border transition flex flex-col justify-between aspect-square"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Folder size={24} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white truncate">{folder.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Playlist Folder</p>
            </div>
          </div>
        ))}

        {/* Followed Artists */}
        {(activeTab === 'all' || activeTab === 'artists') && library.followed_artists.map(artist => (
          <div
            key={artist.id}
            className="group flex flex-col items-center text-center p-3 rounded-2xl hover:bg-audira-card/50 transition cursor-pointer"
          >
            <img src={artist.avatar_url} alt={artist.name} className="w-24 h-24 rounded-full object-cover mb-2 border border-purple-500/20 group-hover:border-purple-500" />
            <p className="text-xs font-bold text-white truncate max-w-full">{artist.name}</p>
            <p className="text-[10px] text-slate-400">Artist</p>
          </div>
        ))}
      </div>
    </div>
  );
}
