import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, User as UserIcon, Settings,
  LogOut, ExternalLink, Menu, Sparkles, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({ onOpenProfile, onOpenSettings, onToggleMobileSidebar }) {
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
    <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/5 bg-black/25 backdrop-blur-xl sticky top-0 z-30 select-none app-drag transition-colors">
      {/* Left controls: Mobile Menu + History Navigation */}
      <div className="flex items-center gap-2 no-drag">
        {/* Mobile Hamburger Menu */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* History Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full bg-audira-card/70 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-audira-card transition"
            title="Go back"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => window.history.forward()}
            className="w-8 h-8 rounded-full bg-audira-card/70 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-audira-card transition"
            title="Go forward"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Right Controls: User State & Window Controls */}
      <div className="flex items-center gap-3 no-drag" ref={dropdownRef}>
        {isAuthenticated && user ? (
          <div className="relative">
            {/* User Pill Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 bg-audira-card/80 hover:bg-audira-card p-1.5 pr-3 rounded-full border border-white/10 transition shadow-sm group"
            >
              <div className="relative shrink-0">
                <div
                  className="w-7 h-7 rounded-full overflow-hidden bg-audira-surface border flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ borderColor: user.accent_color || '#8B5CF6' }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'audira'}`;
                      }}
                    />
                  ) : (
                    <UserIcon size={14} className="text-purple-300" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#0B0C14]" />
              </div>
              <span
                className="text-xs font-semibold text-slate-200 max-w-[120px] truncate"
                style={{ fontFamily: user.display_name_font || 'inherit' }}
              >
                {user.display_name || user.username}
              </span>
            </button>

            {/* Glassmorphic User Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-dropdown rounded-2xl py-2 z-50 text-xs animation-scale-up">
                {/* Header with Discord vibe */}
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden border shrink-0"
                    style={{ borderColor: user.accent_color || '#8B5CF6' }}
                  >
                    <img
                      src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=audira'}
                      alt={user.display_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'audira'}`;
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-bold text-white truncate"
                      style={{ fontFamily: user.display_name_font || 'inherit' }}
                    >
                      {user.display_name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => { setMenuOpen(false); onOpenProfile?.(user.username); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition text-left"
                  >
                    <ExternalLink size={15} className="text-purple-400" />
                    <span>Public Profile</span>
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); onOpenSettings?.(); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition text-left"
                  >
                    <Settings size={15} className="text-cyan-400" />
                    <span>Appearance & Settings</span>
                  </button>

                  <div className="my-1 border-t border-white/5" />

                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition text-left"
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuth('login')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Log In
            </button>
            <button
              onClick={() => openAuth('signup')}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Sign Up Free
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
