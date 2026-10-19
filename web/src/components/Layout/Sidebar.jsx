import React, { useState, useEffect } from 'react';
import { Home, Search, Library, PlusSquare, FolderPlus, DownloadCloud, Music2, Folder } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export default function Sidebar({ activeView, setActiveView, onOpenImport, onSelectPlaylist }) {
  const { isAuthenticated, openAuth } = useAuth();
  const [libraryData, setLibraryData] = useState({ folders: [], playlists: [], liked_songs_count: 0 });

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/library')
        .then(data => setLibraryData(data))
        .catch(console.error);
    }
  }, [isAuthenticated]);

  const handleCreatePlaylist = async () => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    const title = prompt('Enter playlist name:');
    if (!title || !title.trim()) return;
    try {
      const res = await api.post('/library/playlists', { title });
      setLibraryData(prev => ({
        ...prev,
        playlists: [res.playlist, ...prev.playlists]
      }));
      onSelectPlaylist?.(res.playlist.id);
    } catch (err) {
      alert('Failed to create playlist');
    }
  };

  return (
    <aside className="w-64 bg-audira-sidebar flex flex-col border-r border-audira-border h-full flex-shrink-0 select-none">
      {/* Brand Logo & Name */}
      <div className="p-6 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[2px] flex items-center justify-center shadow-lg shadow-purple-900/30">
          <div className="w-full h-full bg-[#0D0E15] rounded-[10px] flex items-center justify-center">
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-cyan-300 text-lg">A</span>
          </div>
        </div>
        <div>
          <h1 className="font-black tracking-wider text-lg bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            AUDIRA
          </h1>
          <p className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase -mt-1">Music Free</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 space-y-1 mt-2">
        <button
          onClick={() => setActiveView('home')}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeView === 'home'
              ? 'bg-audira-hover text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-audira-hover/50'
          }`}
        >
          <Home size={20} className={activeView === 'home' ? 'text-purple-400' : ''} />
          Home
        </button>

        <button
          onClick={() => setActiveView('search')}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeView === 'search'
              ? 'bg-audira-hover text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-audira-hover/50'
          }`}
        >
          <Search size={20} className={activeView === 'search' ? 'text-cyan-400' : ''} />
          Search
        </button>

        <button
          onClick={() => setActiveView('library')}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeView === 'library'
              ? 'bg-audira-hover text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-audira-hover/50'
          }`}
        >
          <Library size={20} className={activeView === 'library' ? 'text-pink-400' : ''} />
          Your Library
        </button>
      </nav>

      {/* Quick Actions */}
      <div className="px-3 mt-6 pt-4 border-t border-audira-border/60 space-y-1">
        <button
          onClick={handleCreatePlaylist}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-audira-hover/50 transition"
        >
          <PlusSquare size={18} className="text-purple-400" />
          Create Playlist
        </button>

        <button
          onClick={onOpenImport}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-audira-hover/50 transition group"
        >
          <DownloadCloud size={18} className="text-emerald-400 group-hover:animate-bounce" />
          Import from Spotify
        </button>
      </div>

      {/* User Playlists & Folders scrollable container */}
      <div className="flex-1 overflow-y-auto px-3 mt-4 space-y-1">
        <p className="px-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">Collections</p>

        {/* Liked Songs Entry */}
        <button
          onClick={() => setActiveView('liked')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition text-left ${
            activeView === 'liked' ? 'bg-audira-hover text-white' : 'text-slate-400 hover:text-white hover:bg-audira-hover/40'
          }`}
        >
          <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center">
            <span className="text-[10px]">💜</span>
          </div>
          <span className="truncate">Liked Songs</span>
          {libraryData.liked_songs_count > 0 && (
            <span className="ml-auto text-[10px] text-slate-500">{libraryData.liked_songs_count}</span>
          )}
        </button>

        {/* User Playlists */}
        {libraryData.playlists.map(pl => (
          <button
            key={pl.id}
            onClick={() => onSelectPlaylist?.(pl.id)}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-audira-hover/40 transition text-left truncate"
          >
            <Music2 size={14} className="text-slate-500 flex-shrink-0" />
            <span className="truncate">{pl.title}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
