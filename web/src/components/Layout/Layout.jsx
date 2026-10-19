import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import PlayerBar from './PlayerBar';
import AuthModal from '../Auth/AuthModal';

export default function Layout({
  children,
  activeView,
  setActiveView,
  onOpenImport,
  onSelectPlaylist,
  onOpenProfile,
  onOpenSettings
}) {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B0C14] overflow-hidden text-slate-100">
      {/* Upper viewport: Sidebar + Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenImport={onOpenImport}
          onSelectPlaylist={onSelectPlaylist}
        />

        <div className="flex-1 flex flex-col overflow-hidden bg-audira-dark">
          <TopBar
            onOpenProfile={onOpenProfile}
            onOpenSettings={onOpenSettings}
          />
          <main className="flex-1 overflow-y-auto px-8 py-6 relative">
            {children}
          </main>
        </div>
      </div>

      {/* Persistent Bottom Music Player */}
      <PlayerBar />

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
}
