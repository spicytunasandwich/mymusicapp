import React, { useEffect, useState, useRef } from 'react';
import {
  Heart, Folder, Music2, Plus, Sparkles, Search,
  HardDrive, UploadCloud, Trash2, Play, Pause, FileAudio, Check
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { CardSkeleton } from '../components/Common/SkeletonLoader';
import {
  saveLocalAudioFile,
  getAllLocalAudioTracks,
  deleteLocalAudioTrack,
  prepareTrackForPlayback
} from '../utils/offlineAudioDb';

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function LibraryView({ onSelectPlaylist, onSelectLiked, defaultTab = 'all' }) {
  const { isAuthenticated, openAuth } = useAuth();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const [library, setLibrary] = useState({
    liked_songs_count: 0,
    folders: [],
    playlists: [],
    followed_artists: [],
    liked_albums: []
  });
  const [activeTab, setActiveTab] = useState(defaultTab || 'all'); // all, playlists, folders, artists, local
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Local Offline Audio state
  const [localTracks, setLocalTracks] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch server library if authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    api.get('/library')
      .then(res => setLibrary(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Load local offline tracks from IndexedDB
  const refreshLocalTracks = async () => {
    try {
      const tracks = await getAllLocalAudioTracks();
      setLocalTracks(tracks);
    } catch (err) {
      console.warn('Failed to load local tracks:', err);
    }
  };

  useEffect(() => {
    refreshLocalTracks();
  }, []);

  // Update tab if defaultTab changes
  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  // Handle uploading files into IndexedDB
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsImporting(true);

    try {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|ogg|aac|opus)$/i.test(file.name)) {
          await saveLocalAudioFile(file);
        }
      }
      await refreshLocalTracks();
    } catch (err) {
      console.error('Failed to import local tracks:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteLocal = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Remove this track from your offline storage?')) {
      await deleteLocalAudioTrack(id);
      await refreshLocalTracks();
    }
  };

  const handlePlayLocal = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    const playable = prepareTrackForPlayback(track);
    playTrack(playable, localTracks.map(t => prepareTrackForPlayback(t)));
  };

  // If unauthenticated and NOT on local tab, show login screen
  if (!isAuthenticated && activeTab !== 'local') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mb-4">
          <Heart size={28} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Enjoy Your Library</h2>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          Log in to see your Liked Songs, custom playlists, folders, and followed artists, or browse your local offline files below.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuth('login')}
            className="px-6 py-2.5 rounded-full font-bold text-xs bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-xl shadow-purple-900/40 hover:opacity-95 transition"
          >
            Log In Free
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className="px-5 py-2.5 rounded-full font-bold text-xs bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-2"
          >
            <HardDrive size={14} className="text-[#1DB954]" />
            <span>Local Offline Files</span>
          </button>
        </div>
      </div>
    );
  }

  // Filter playlists by title
  const filteredPlaylists = library.playlists.filter(pl =>
    pl.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Hidden File Input for Local Files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg,.opus,.aac"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Header & Sub-search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Your Library</h1>
          <p className="text-xs text-slate-400 mt-1">
            {localTracks.length > 0 && `${localTracks.length} local offline tracks • `}
            {library.playlists?.length || 0} playlists
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search in your library..."
            className="w-full bg-[#1e1f22] border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB954] transition"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All' },
          { id: 'playlists', label: 'Playlists' },
          { id: 'local', label: `Local Files (${localTracks.length})` },
          { id: 'folders', label: 'Folders' },
          { id: 'artists', label: 'Artists' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-black shadow-md'
                : 'bg-[#181818] text-slate-400 hover:text-white hover:bg-[#282828]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: LOCAL FILES (OFFLINE ENGINE) */}
      {activeTab === 'local' ? (
        <div className="space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
              isDragging
                ? 'border-[#1DB954] bg-[#1DB954]/10 scale-[1.01]'
                : 'border-white/15 bg-[#121212] hover:border-white/30 hover:bg-[#181818]'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center mb-3 text-[#1DB954]">
              <UploadCloud size={28} />
            </div>
            <h3 className="text-base font-bold text-white">
              {isImporting ? 'Saving to Offline Storage...' : 'Drop audio files here or click to browse'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Supports MP3, WAV, FLAC, M4A, OGG. Stored securely in your browser's IndexedDB for complete offline playback without an internet connection.
            </p>
            <button
              type="button"
              className="mt-4 px-5 py-2 rounded-full bg-[#1DB954] hover:scale-105 active:scale-95 text-black font-bold text-xs transition shadow"
            >
              Add Audio Files
            </button>
          </div>

          {/* Local Tracks Table */}
          {localTracks.length > 0 ? (
            <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <div className="flex items-center gap-3">
                  <span>#</span>
                  <span>Title</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="hidden sm:inline">Size</span>
                  <span>Duration</span>
                  <span className="w-6"></span>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {localTracks.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handlePlayLocal(track)}
                      className={`px-5 py-3 flex items-center justify-between hover:bg-white/5 cursor-pointer group transition ${
                        isCurrent ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-5 text-center text-xs text-slate-500 group-hover:hidden">
                          {isCurrent && isPlaying ? (
                            <span className="text-[#1DB954] font-bold">▶</span>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePlayLocal(track); }}
                          className="w-5 text-center hidden group-hover:flex items-center justify-center text-white"
                        >
                          {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
                        </button>

                        <div className="w-10 h-10 rounded-lg bg-purple-900/40 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <FileAudio size={18} className="text-purple-400" />
                        </div>

                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-xs text-slate-400">
                        <span className="hidden sm:inline font-mono">{formatBytes(track.size)}</span>
                        <span className="font-mono">{formatDuration(track.duration)}</span>
                        <button
                          onClick={(e) => handleDeleteLocal(e, track.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
                          title="Delete from offline storage"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <HardDrive size={32} className="mx-auto mb-2 text-slate-600" />
              <p className="text-xs">No local audio tracks stored yet.</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Drag and drop audio files above to listen offline anytime.</p>
            </div>
          )}
        </div>
      ) : (
        /* GRID COLLECTIONS (ALL, PLAYLISTS, FOLDERS, ARTISTS) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Liked Songs Hero Box */}
          {(activeTab === 'all' || activeTab === 'playlists') && !searchFilter && (
            <div
              onClick={onSelectLiked}
              className="col-span-2 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 p-6 rounded-2xl flex flex-col justify-between cursor-pointer shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all group"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Collection</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Liked Songs</h3>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/90">
                  {library.liked_songs_count} songs saved
                </span>
                <div className="w-12 h-12 rounded-full bg-white text-purple-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Heart size={22} className="fill-purple-700" />
                </div>
              </div>
            </div>
          )}

          {/* Local Files Card Preview in 'All' Tab */}
          {activeTab === 'all' && !searchFilter && (
            <div
              onClick={() => setActiveTab('local')}
              className="col-span-1 bg-[#181818] hover:bg-[#282828] p-5 rounded-2xl border border-white/5 transition flex flex-col justify-between cursor-pointer group shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] group-hover:scale-105 transition-transform">
                <HardDrive size={24} />
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-bold text-white truncate">Local Files</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {localTracks.length} tracks • Offline
                </p>
              </div>
            </div>
          )}

          {/* User Playlists */}
          {(activeTab === 'all' || activeTab === 'playlists') && filteredPlaylists.map(playlist => (
            <div
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist.id)}
              className="spotify-card p-3.5 rounded-2xl cursor-pointer flex flex-col group"
            >
              <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#0D0E15] shadow-md">
                <img
                  src={playlist.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500'}
                  alt={playlist.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h4 className="text-xs font-bold text-white truncate">{playlist.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1">Playlist • {playlist.track_count || 0} songs</p>
            </div>
          ))}

          {/* Folders */}
          {(activeTab === 'all' || activeTab === 'folders') && library.folders.map(folder => (
            <div
              key={folder.id}
              className="bg-audira-card/50 hover:bg-audira-card-hover p-5 rounded-2xl border border-white/5 transition flex flex-col justify-between aspect-square cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Folder size={24} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white truncate">{folder.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Playlist Folder</p>
              </div>
            </div>
          ))}

          {/* Followed Artists */}
          {(activeTab === 'all' || activeTab === 'artists') && library.followed_artists.map(artist => (
            <div
              key={artist.id}
              className="group flex flex-col items-center text-center p-3 rounded-2xl hover:bg-audira-card transition cursor-pointer"
            >
              <img
                src={artist.avatar_url}
                alt={artist.name}
                className="w-24 h-24 rounded-full object-cover mb-2 border border-purple-500/20 group-hover:border-purple-500 transition-all"
              />
              <p className="text-xs font-bold text-white truncate max-w-full">{artist.name}</p>
              <p className="text-[10px] text-slate-400">Artist</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
