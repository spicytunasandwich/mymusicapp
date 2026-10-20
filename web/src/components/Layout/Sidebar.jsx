import React, { useState, useEffect } from 'react';
import {
  Home, Search, Library, PlusSquare, DownloadCloud,
  Music2, ChevronLeft, ChevronRight, Heart, X, Sparkles, Folder
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export default function Sidebar({
  activeView,
  setActiveView,
  onOpenImport,
  onSelectPlaylist,
  isCollapsed = false,
  toggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) {
  const { user, isAuthenticated, openAuth } = useAuth();
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
      if (isMobileOpen && onCloseMobile) onCloseMobile();
    } catch (err) {
      alert('Failed to create playlist');
    }
  };

  const handleNavClick = (view) => {
    setActiveView(view);
    if (isMobileOpen && onCloseMobile) onCloseMobile();
  };

  const handlePlaylistClick = (playlistId) => {
    onSelectPlaylist?.(playlistId);
    if (isMobileOpen && onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          w-72 bg-black/40 backdrop-blur-2xl flex flex-col border-r border-white/5 h-full select-none
          transition-all duration-300 ease-in-out shrink-0
        `}
      >
        {/* Brand Header */}
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-white/[0.04]">
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl p-1 bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <img src="/brand/logo.svg" alt="Linear" className="w-full h-full object-contain" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div>
                <h1 className="font-black tracking-tight text-xl text-white leading-tight">
                  Linear
                </h1>
                <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Stream Music</p>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Mobile Close Button */}
          <div className="flex items-center">
            {isMobileOpen ? (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 md:hidden"
              >
                <X size={20} />
              </button>
            ) : (
              <button
                onClick={toggleCollapse}
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-audira-hover transition"
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 space-y-1">
          <button
            onClick={() => handleNavClick('home')}
            title="Home"
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeView === 'home'
                ? 'bg-audira-card text-white shadow-sm border border-white/5'
                : 'text-slate-400 hover:text-white hover:bg-audira-hover/60'
            }`}
          >
            <Home size={20} className={activeView === 'home' ? 'text-purple-400 shrink-0' : 'shrink-0'} />
            {(!isCollapsed || isMobileOpen) && <span>Home</span>}
          </button>

          <button
            onClick={() => handleNavClick('search')}
            title="Search"
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeView === 'search'
                ? 'bg-audira-card text-white shadow-sm border border-white/5'
                : 'text-slate-400 hover:text-white hover:bg-audira-hover/60'
            }`}
          >
            <Search size={20} className={activeView === 'search' ? 'text-cyan-400 shrink-0' : 'shrink-0'} />
            {(!isCollapsed || isMobileOpen) && <span>Search</span>}
          </button>

          <button
            onClick={() => handleNavClick('library')}
            title="Your Library"
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeView === 'library'
                ? 'bg-audira-card text-white shadow-sm border border-white/5'
                : 'text-slate-400 hover:text-white hover:bg-audira-hover/60'
            }`}
          >
            <Library size={20} className={activeView === 'library' ? 'text-pink-400 shrink-0' : 'shrink-0'} />
            {(!isCollapsed || isMobileOpen) && <span>Your Library</span>}
          </button>
        </nav>

        {/* Quick Actions (Create Playlist & Spotify Import) */}
        <div className="px-3 pt-3 pb-2 border-t border-white/[0.04] space-y-1">
          <button
            onClick={handleCreatePlaylist}
            title="Create Playlist"
            className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-audira-hover/60 transition group"
          >
            <div className="w-6 h-6 rounded-lg bg-audira-card flex items-center justify-center shrink-0 border border-white/5 group-hover:border-purple-500/40">
              <PlusSquare size={16} className="text-purple-400" />
            </div>
            {(!isCollapsed || isMobileOpen) && <span>Create Playlist</span>}
          </button>

          <button
            onClick={() => {
              onOpenImport?.();
              if (isMobileOpen && onCloseMobile) onCloseMobile();
            }}
            title="Import from Spotify"
            className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-audira-hover/60 transition group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:border-emerald-500/50">
              <DownloadCloud size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className="flex items-center gap-1.5">
                Import from Spotify
                <Sparkles size={12} className="text-emerald-400" />
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Collections / Playlists */}
        <div className="flex-1 overflow-y-auto px-3 mt-2 space-y-1">
          {(!isCollapsed || isMobileOpen) && (
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
              Collections
            </p>
          )}

          {/* Liked Songs Entry */}
          <button
            onClick={() => handleNavClick('liked')}
            title="Liked Songs"
            className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-xs font-semibold transition text-left ${
              activeView === 'liked'
                ? 'bg-audira-card text-white border border-white/5'
                : 'text-slate-400 hover:text-white hover:bg-audira-hover/40'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shrink-0 shadow-sm shadow-purple-900/30">
              <Heart size={14} className="fill-white text-white" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <>
                <span className="truncate">Liked Songs</span>
                {libraryData.liked_songs_count > 0 && (
                  <span className="ml-auto text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {libraryData.liked_songs_count}
                  </span>
                )}
              </>
            )}
          </button>

          {/* User Playlists */}
          {libraryData.playlists.map(pl => (
            <button
              key={pl.id}
              onClick={() => handlePlaylistClick(pl.id)}
              title={pl.title}
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-audira-hover/40 transition text-left truncate"
            >
              <Music2 size={15} className="text-slate-500 shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span className="truncate">{pl.title}</span>}
            </button>
          ))}
        </div>

        {/* Discord-style User Profile Dock at bottom */}
        {isAuthenticated && user ? (
          <div className="p-3 border-t border-white/[0.04] bg-black/40 backdrop-blur-md">
            <button
              onClick={() => handleNavClick('profile')}
              title={`View ${user.display_name}'s Profile`}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-audira-hover transition text-left group"
            >
              <div className="relative shrink-0">
                <div
                  className="w-9 h-9 rounded-full overflow-hidden p-[2px] bg-[#11121C] shadow-md transition-transform group-hover:scale-105"
                  style={{ border: `2px solid ${user.accent_color || '#8B5CF6'}` }}
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
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B0C14]" />
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition"
                    style={{ fontFamily: user.display_name_font || 'inherit' }}
                  >
                    {user.display_name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">@{user.username}</p>
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-white/[0.04] bg-black/40">
            <button
              onClick={() => openAuth('login')}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition text-center"
            >
              {(!isCollapsed || isMobileOpen) ? 'Log In / Sign Up' : '🔑'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
