import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import Layout from './components/Layout/Layout';

import HomeView from './views/HomeView';
import SearchView from './views/SearchView';
import LibraryView from './views/LibraryView';
import LikedSongsView from './views/LikedSongsView';
import PlaylistView from './views/PlaylistView';
import NowPlayingView from './views/NowPlayingView';
import ProfileView from './views/ProfileView';
import SettingsView from './views/SettingsView';
import SpotifyImportView from './views/SpotifyImportView';

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(null);

  const handleSelectPlaylist = (id) => {
    setSelectedPlaylistId(id);
    setActiveView('playlist');
  };

  const handleOpenProfile = (username) => {
    setSelectedUsername(username);
    setActiveView('profile');
  };

  return (
    <AuthProvider>
      <PlayerProvider>
        <Layout
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenImport={() => setActiveView('import')}
          onSelectPlaylist={handleSelectPlaylist}
          onOpenProfile={handleOpenProfile}
          onOpenSettings={() => setActiveView('settings')}
        >
          {activeView === 'home' && (
            <HomeView
              onSelectPlaylist={handleSelectPlaylist}
              onSelectArtist={() => setActiveView('search')}
              onSelectAlbum={() => setActiveView('search')}
            />
          )}

          {activeView === 'search' && (
            <SearchView
              onSelectPlaylist={handleSelectPlaylist}
              onSelectArtist={() => {}}
            />
          )}

          {activeView === 'library' && (
            <LibraryView
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
        </Layout>

        {/* Full-Screen Synced Lyrics & Now Playing Overlay */}
        <NowPlayingView />
      </PlayerProvider>
    </AuthProvider>
  );
}
