import React, { useState, useEffect } from 'react';
import {
  Home, Search, Library, Plus, DownloadCloud,
  Music2, ChevronLeft, ChevronRight, Heart, X, Sparkles, HardDrive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export default function Sidebar({
  activeView,
  setActiveView,
  onOpenImport,
  onSelectPlaylist,
  onOpenProfile,
  isCollapsed = false,
  toggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) {
  const { user, isAuthenticated, openAuth } = useAuth();
  const [libraryData, setLibraryData] = useState({ folders: [], playlists: [], liked_songs_count: 0 });
  const [filterType, setFilterType] = useState('all'); // 'all' | 'playlists' | 'artists'

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
      const res = await api.post('/library/playlists', { title: title.trim() });
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* 1:1 Spotify Dual-Container Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-72 lg:w-80'}
          w-72 flex flex-col gap-2 h-full select-none
          transition-all duration-200 ease-in-out shrink-0
        `}
      >
        {/* Spotify Island 1: Brand & Top Navigation */}
        <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4 shadow-md shrink-0">
          {/* Brand Header */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg p-1 bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img src="/brand/logo.svg" alt="Linear" className="w-full h-full object-contain" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <span className="font-bold text-lg text-white tracking-tight">Linear</span>
              )}
            </div>

            {/* Mobile close button */}
            {isMobileOpen && (
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-full text-slate-400 hover:text-white md:hidden"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Primary Nav Links */}
          <nav className="space-y-1">
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full flex items-center gap-4 py-2 px-2 rounded-md font-bold text-sm transition ${
                activeView === 'home'
                  ? 'text-white'
                  : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              <Home size={24} className={activeView === 'home' ? 'text-white' : 'text-[#b3b3b3]'} />
              {(!isCollapsed || isMobileOpen) && <span>Home</span>}
            </button>

            <button
              onClick={() => handleNavClick('search')}
              className={`w-full flex items-center gap-4 py-2 px-2 rounded-md font-bold text-sm transition ${
                activeView === 'search'
                  ? 'text-white'
                  : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              <Search size={24} className={activeView === 'search' ? 'text-white' : 'text-[#b3b3b3]'} />
              {(!isCollapsed || isMobileOpen) && <span>Search</span>}
            </button>
          </nav>
        </div>

        {/* Spotify Island 2: Your Library & Custom Playlists */}
        <div className="bg-[#121212] rounded-lg p-3 flex-1 flex flex-col overflow-hidden min-h-0 shadow-md">
          {/* Library Header */}
          <div className="flex items-center justify-between px-2 py-2 shrink-0">
            <button
              onClick={() => handleNavClick('library')}
              className="flex items-center gap-3 text-[#b3b3b3] hover:text-white font-bold text-sm transition group"
            >
              <Library size={24} className="group-hover:text-white" />
              {(!isCollapsed || isMobileOpen) && <span>Your Library</span>}
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCreatePlaylist}
                className="p-1.5 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition"
                title="Create playlist"
              >
                <Plus size={20} />
              </button>

              <button
                onClick={toggleCollapse}
                title={isCollapsed ? 'Expand Your Library' : 'Collapse Your Library'}
                className="hidden md:flex p-1.5 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition"
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
          </div>

          {/* Filter Pills (Playlists, Artists) */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex items-center gap-2 px-2 py-2 shrink-0">
              <button
                onClick={() => setFilterType(prev => prev === 'playlists' ? 'all' : 'playlists')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  filterType === 'playlists'
                    ? 'bg-white text-black'
                    : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Playlists
              </button>
              <button
                onClick={() => setFilterType(prev => prev === 'artists' ? 'all' : 'artists')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  filterType === 'artists'
                    ? 'bg-white text-black'
                    : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Artists
              </button>
            </div>
          )}

          {/* Scrollable Library List */}
          <div className="flex-1 overflow-y-auto px-1 space-y-1 mt-1 scrollbar-none">
            {/* Pinned Liked Songs */}
            <button
              onClick={() => handleNavClick('liked')}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition text-left group ${
                activeView === 'liked' ? 'bg-[#282828]' : 'hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 flex items-center justify-center shrink-0 shadow">
                <Heart size={20} className="fill-white text-white" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">Liked Songs</p>
                  <p className="text-xs text-[#b3b3b3] truncate">
                    Playlist • {libraryData.liked_songs_count || 0} songs
                  </p>
                </div>
              )}
            </button>

            {/* Local Files (Offline Storage - Riff Engine) */}
            <button
              onClick={() => handleNavClick('local')}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition text-left group ${
                activeView === 'local' ? 'bg-[#282828]' : 'hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="w-12 h-12 rounded-md bg-[#242424] border border-white/5 flex items-center justify-center shrink-0 shadow text-[#1DB954] group-hover:scale-105 transition-transform">
                <HardDrive size={20} />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">Local Files</p>
                  <p className="text-xs text-[#b3b3b3] truncate">Offline storage</p>
                </div>
              )}
            </button>

            {/* Spotify Import Quick Link */}
            <button
              onClick={() => {
                onOpenImport?.();
                if (isMobileOpen && onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition text-left group ${
                activeView === 'import' ? 'bg-[#282828]' : 'hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="w-12 h-12 rounded-md bg-[#1DB954]/20 border border-[#1DB954]/30 flex items-center justify-center shrink-0 shadow">
                <DownloadCloud size={20} className="text-[#1DB954]" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                    Import from Spotify
                    <Sparkles size={13} className="text-[#1DB954]" />
                  </p>
                  <p className="text-xs text-[#b3b3b3] truncate">Sync Spotify playlists</p>
                </div>
              )}
            </button>

            {/* Custom Playlists */}
            {libraryData.playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => handlePlaylistClick(pl.id)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] transition text-left group"
              >
                <div className="w-12 h-12 rounded-md bg-[#282828] overflow-hidden flex items-center justify-center shrink-0 shadow">
                  {pl.cover_url ? (
                    <img src={pl.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music2 size={20} className="text-[#b3b3b3]" />
                  )}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-[#1DB954] transition">
                      {pl.title}
                    </p>
                    <p className="text-xs text-[#b3b3b3] truncate">
                      Playlist • {pl.privacy === 'private' ? 'Private' : 'Public'}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Discord User Profile Dock at bottom */}
          {isAuthenticated && user ? (
            <div className="pt-2 mt-auto border-t border-white/5 shrink-0">
              <button
                onClick={() => {
                  if (onOpenProfile && user.username) {
                    onOpenProfile(user.username);
                  } else {
                    handleNavClick('profile');
                  }
                  if (isMobileOpen) onCloseMobile?.();
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition text-left group"
              >
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden p-[2px] bg-[#111214]"
                    style={{ border: `2px solid ${user.accent_color || '#1DB954'}` }}
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'linear'}`}
                      alt={user.display_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  {/* Discord Presence Indicator Dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#23a55a] border-2 border-[#121212]" />
                </div>

                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold text-white truncate group-hover:underline"
                      style={{ fontFamily: user.display_name_font || 'inherit' }}
                    >
                      {user.display_name || user.username}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">@{user.username}</p>
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="pt-2 mt-auto border-t border-white/5 shrink-0">
              <button
                onClick={() => openAuth('login')}
                className="w-full py-2.5 px-3 rounded-full text-xs font-bold text-black bg-[#1DB954] hover:scale-102 active:scale-98 transition text-center shadow"
              >
                {(!isCollapsed || isMobileOpen) ? 'Log In / Sign Up' : '🔑'}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
