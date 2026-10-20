import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, User as UserIcon, Settings,
  LogOut, ExternalLink, Menu, Sparkles, DownloadCloud
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({
  activeView,
  setActiveView,
  onOpenProfile,
  onOpenSettings,
  onOpenImport,
  onToggleMobileSidebar
}) {
  const { user, isAuthenticated, logout, openAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isDesktop = typeof window !== 'undefined' && Boolean(window.audiraDesktop);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between bg-[#121212]/90 backdrop-blur-md sticky top-0 z-30 select-none app-drag transition-colors">
      {/* Left controls: Mobile Menu + History Navigation */}
      <div className="flex items-center gap-3 no-drag">
        {/* Mobile Hamburger Menu */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* 1:1 Spotify Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full bg-black/70 hover:bg-black flex items-center justify-center text-white transition hover:scale-105 active:scale-95 shadow"
            title="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => window.history.forward()}
            className="w-8 h-8 rounded-full bg-black/70 hover:bg-black flex items-center justify-center text-white transition hover:scale-105 active:scale-95 shadow"
            title="Go forward"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Right Controls: Spotify Import + Profile Pill or Sign up / Log in */}
      <div className="flex items-center gap-3 no-drag" ref={dropdownRef}>
        {/* Spotify Import Pill */}
        <button
          onClick={onOpenImport}
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1DB954]/15 hover:bg-[#1DB954]/25 text-[#1DB954] border border-[#1DB954]/30 transition hover:scale-105 active:scale-95 shadow"
          title="Import playlists from Spotify"
        >
          <DownloadCloud size={14} className="text-[#1DB954]" />
          <span>Import Spotify</span>
        </button>

        {isAuthenticated && user ? (
          <div className="relative">
            {/* User Pill Button (Spotify + Discord status dot) */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-black/60 hover:bg-black/90 p-1 pr-3 rounded-full border border-white/10 transition group shadow"
            >
              <div className="relative shrink-0">
                <div
                  className="w-7 h-7 rounded-full overflow-hidden bg-[#181818] flex items-center justify-center"
                  style={{ border: `2px solid ${user.accent_color || '#1DB954'}` }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'linear'}`;
                      }}
                    />
                  ) : (
                    <UserIcon size={14} className="text-[#1DB954]" />
                  )}
                </div>
                {/* Discord Online Indicator Dot */}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#23a55a] border border-[#121212]" />
              </div>
              <span
                className="text-xs font-bold text-white max-w-[120px] truncate"
                style={{ fontFamily: user.display_name_font || 'inherit' }}
              >
                {user.display_name || user.username}
              </span>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#282828] border border-white/10 rounded-xl py-1.5 z-50 text-xs shadow-2xl animate-in fade-in duration-100">
                <div className="px-3.5 py-2.5 border-b border-white/10 flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden shrink-0 border"
                    style={{ borderColor: user.accent_color || '#1DB954' }}
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'linear'}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{user.display_name || user.username}</p>
                    <p className="text-[10px] text-slate-400 truncate">@{user.username}</p>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => { setMenuOpen(false); onOpenProfile?.(user.username); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition text-left"
                  >
                    <span>Profile</span>
                    <ExternalLink size={14} />
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); onOpenSettings?.(); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition text-left"
                  >
                    <span>Settings</span>
                    <Settings size={14} />
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); onOpenImport?.(); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[#1DB954] hover:bg-white/10 rounded-lg transition text-left font-semibold"
                  >
                    <span>Spotify Import</span>
                    <DownloadCloud size={14} />
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition text-left"
                  >
                    <span>Log out</span>
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 1:1 Spotify Guest Header (Sign up + Log in) */
          <div className="flex items-center gap-4">
            <button
              onClick={() => openAuth('signup')}
              className="text-slate-300 hover:text-white font-bold text-xs hover:scale-105 transition"
            >
              Sign up
            </button>
            <button
              onClick={() => openAuth('login')}
              className="bg-white hover:bg-slate-100 text-black font-bold text-xs px-6 py-2.5 rounded-full hover:scale-104 active:scale-98 transition shadow"
            >
              Log in
            </button>
          </div>
        )}

        {/* Electron Native Frameless Controls */}
        {isDesktop && (
          <div className="flex items-center ml-2 pl-3 border-l border-white/10">
            <button
              onClick={() => window.audiraDesktop.minimize()}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Minimize"
            >
              ―
            </button>
            <button
              onClick={() => window.audiraDesktop.maximize()}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Maximize / Restore"
            >
              ▢
            </button>
            <button
              onClick={() => window.audiraDesktop.close()}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition"
              title="Close"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
