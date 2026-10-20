import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { PresenceProvider } from './context/PresenceContext';
import Layout from './components/Layout/Layout';

import HomeView from './views/HomeView';
import SearchView from './views/SearchView';
import LibraryView from './views/LibraryView';
import LikedSongsView from './views/LikedSongsView';
import PlaylistView from './views/PlaylistView';
import ArtistView from './views/ArtistView';
import NowPlayingView from './views/NowPlayingView';
import ProfileView from './views/ProfileView';
import SettingsView from './views/SettingsView';
import SpotifyImportView from './views/SpotifyImportView';
import { PageTransition } from './components/Common/Motion';
import ErrorBoundary from './components/Common/ErrorBoundary';

function AppContent({
  activeView,
  setActiveView,
  selectedPlaylistId,
  handleSelectPlaylist,
  selectedArtistId,
  handleSelectArtist,
  selectedUsername,
  handleOpenProfile
}) {
  const { currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    const handleArtistEvent = (e) => {
      if (e.detail) {
        handleSelectArtist(e.detail);
      }
    };
    window.addEventListener('linear:open-artist', handleArtistEvent);
    return () => window.removeEventListener('linear:open-artist', handleArtistEvent);
  }, [handleSelectArtist]);

  return (
    <PresenceProvider currentTrack={currentTrack} isPlaying={isPlaying}>
      <Layout
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenImport={() => setActiveView('import')}
        onSelectPlaylist={handleSelectPlaylist}
        onOpenProfile={handleOpenProfile}
        onOpenSettings={() => setActiveView('settings')}
      >
        <PageTransition viewKey={activeView}>
          {activeView === 'home' && (
            <HomeView
              onSelectPlaylist={handleSelectPlaylist}
              onSelectArtist={handleSelectArtist}
              onSelectAlbum={() => setActiveView('search')}
            />
          )}

          {activeView === 'search' && (
            <SearchView
              onSelectPlaylist={handleSelectPlaylist}
              onSelectArtist={handleSelectArtist}
            />
          )}

          {activeView === 'artist' && (
            <ArtistView
              artistId={selectedArtistId}
              onBack={() => setActiveView('home')}
              onSelectAlbum={() => setActiveView('search')}
            />
          )}

          {(activeView === 'library' || activeView === 'local') && (
            <LibraryView
              defaultTab={activeView === 'local' ? 'local' : 'all'}
              onSelectPlaylist={handleSelectPlaylist}
              onSelectLiked={() => setActiveView('liked')}
            />
          )}

          {activeView === 'liked' && (
            <LikedSongsView onBack={() => setActiveView('library')} />
          )}

          {activeView === 'playlist' && (
            <PlaylistView
              playlistId={selectedPlaylistId}
              onBack={() => setActiveView('library')}
            />
          )}

          {activeView === 'profile' && (
            <ProfileView
              username={selectedUsername}
              onSelectPlaylist={handleSelectPlaylist}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView />
          )}

          {activeView === 'import' && (
            <SpotifyImportView
              onSelectPlaylist={handleSelectPlaylist}
            />
          )}
        </PageTransition>
      </Layout>

      {/* Full-Screen Synced Lyrics & Now Playing Overlay */}
      <NowPlayingView />
    </PresenceProvider>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [selectedArtistId, setSelectedArtistId] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(null);

  const handleSelectPlaylist = (id) => {
    setSelectedPlaylistId(id);
    setActiveView('playlist');
  };

  const handleSelectArtist = (id) => {
    setSelectedArtistId(id);
    setActiveView('artist');
  };

  const handleOpenProfile = (username) => {
    setSelectedUsername(username);
    setActiveView('profile');
  };

  return (
    <ErrorBoundary title="Linear encountered an unexpected error">
      <AuthProvider>
        <PlayerProvider>
          <AppContent
            activeView={activeView}
            setActiveView={setActiveView}
            selectedPlaylistId={selectedPlaylistId}
            handleSelectPlaylist={handleSelectPlaylist}
            selectedArtistId={selectedArtistId}
            handleSelectArtist={handleSelectArtist}
            selectedUsername={selectedUsername}
            handleOpenProfile={handleOpenProfile}
          />
        </PlayerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
