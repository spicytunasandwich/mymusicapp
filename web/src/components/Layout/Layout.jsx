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
    <div className="h-screen w-screen flex flex-col bg-audira-bg overflow-hidden text-slate-100 select-none">
      {/* Upper viewport: Sidebar + Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
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

        <div className="flex-1 flex flex-col overflow-hidden bg-audira-bg min-w-0">
          <TopBar
            onOpenProfile={onOpenProfile}
            onOpenSettings={onOpenSettings}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          />

          <main className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 relative min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Persistent Bottom Music Player */}
      <PlayerBar />

      {/* Mobile Bottom Navigation Bar (Spotify mobile style) */}
      <nav className="md:hidden flex items-center justify-around h-14 bg-audira-sidebar/95 backdrop-blur-lg border-t border-white/[0.06] z-20 shrink-0">
        <button
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeView === 'home' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveView('search')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeView === 'search' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search size={20} />
          <span className="text-[10px] mt-0.5">Search</span>
        </button>

        <button
          onClick={() => setActiveView('library')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeView === 'library' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'
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
            activeView === 'profile' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
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
