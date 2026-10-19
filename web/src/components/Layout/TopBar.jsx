import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, User as UserIcon, Settings, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({ onOpenProfile, onOpenSettings }) {
  const { user, isAuthenticated, logout, openAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDesktop = typeof window !== 'undefined' && Boolean(window.audiraDesktop);

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-audira-border bg-[#0B0C14]/90 backdrop-blur-md sticky top-0 z-20 select-none app-drag">
      {/* Navigation history arrows */}
      <div className="flex items-center gap-2 no-drag">
        <button
          onClick={() => window.history.back()}
          className="w-8 h-8 rounded-full bg-audira-card/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-audira-hover transition"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => window.history.forward()}
          className="w-8 h-8 rounded-full bg-audira-card/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-audira-hover transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Right User State */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 bg-audira-card hover:bg-audira-hover p-1.5 pr-3 rounded-full border border-audira-border transition"
            >
              <div
                className="w-7 h-7 rounded-full overflow-hidden bg-purple-900/50 border flex items-center justify-center"
                style={{ borderColor: user.accent_color || '#8B5CF6' }}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={14} className="text-purple-300" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                {user.display_name || user.username}
              </span>
            </button>

            {/* User Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-audira-card border border-audira-border rounded-xl shadow-2xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-audira-border/60">
                  <p className="font-bold text-white truncate">{user.display_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                </div>

                <button
                  onClick={() => { setMenuOpen(false); onOpenProfile?.(user.username); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-audira-hover transition text-left"
                >
                  <ExternalLink size={14} />
                  Public Profile
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenSettings?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-audira-hover transition text-left"
                >
                  <Settings size={14} />
                  Appearance & Settings
                </button>

                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-left mt-1 border-t border-audira-border/50"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 no-drag">
            <button
              onClick={() => openAuth('login')}
              className="px-4 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Log In
            </button>
            <button
              onClick={() => openAuth('signup')}
              className="px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-900/40 hover:opacity-95 transition"
            >
              Sign Up Free
            </button>
          </div>
        )}

        {/* Electron Native Frameless Window Controls */}
        {isDesktop && (
          <div className="flex items-center ml-4 pl-3 border-l border-audira-border no-drag">
            <button
              onClick={() => window.audiraDesktop.minimize()}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition"
              title="Minimize"
            >
              ―
            </button>
            <button
              onClick={() => window.audiraDesktop.maximize()}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition"
              title="Maximize / Restore"
            >
              ▢
            </button>
            <button
              onClick={() => window.audiraDesktop.close()}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 rounded transition"
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
