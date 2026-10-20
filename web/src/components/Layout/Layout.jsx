import React, { useState } from 'react';
import { Home, Search, Library, User as UserIcon } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import PlayerBar from './PlayerBar';
import AuthModal from '../Auth/AuthModal';
import { useAuth } from '../../context/AuthContext';

export default function Layout({
  children,
  activeView,
  setActiveView,
  onOpenImport,
  onSelectPlaylist,
  onOpenProfile,
  onOpenSettings
}) {
  const { user, isAuthenticated, openAuth } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden text-slate-100 select-none bg-black p-0 md:p-2 gap-2"
    >
      {/* Upper viewport: Spotify Dual-Island Sidebar (left) + Main Content Card (right) */}
      <div className="flex-1 flex gap-2 overflow-hidden min-h-0 relative">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenImport={onOpenImport}
          onSelectPlaylist={onSelectPlaylist}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Main Viewport Card (Spotify 1:1 rounded island with sticky topbar) */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 md:rounded-lg bg-[#121212] relative shadow-2xl">
          <TopBar
            activeView={activeView}
            setActiveView={setActiveView}
            onOpenProfile={onOpenProfile}
            onOpenSettings={onOpenSettings}
            onOpenImport={onOpenImport}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          />

          <main className="flex-1 overflow-y-auto px-4 md:px-8 py-4 relative min-w-0 scrollbar-thin">
            {children}
          </main>
        </div>
      </div>

      {/* Persistent Bottom Music Player */}
      <PlayerBar />

      {/* Mobile Bottom Navigation Bar (Spotify mobile style) */}
      <nav className="md:hidden flex items-center justify-around h-14 bg-black/95 backdrop-blur-lg border-t border-white/[0.08] z-20 shrink-0">
        <button
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeView === 'home' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveView('search')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeView === 'search' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search size={20} />
          <span className="text-[10px] mt-0.5">Search</span>
        </button>

        <button
          onClick={() => setActiveView('library')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeView === 'library' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Library size={20} />
          <span className="text-[10px] mt-0.5">Library</span>
        </button>

        <button
          onClick={() => {
            if (isAuthenticated) {
              setActiveView('profile');
            } else {
              openAuth('login');
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeView === 'profile' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon size={20} />
          <span className="text-[10px] mt-0.5">{isAuthenticated ? 'Profile' : 'Log In'}</span>
        </button>
      </nav>

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
}
