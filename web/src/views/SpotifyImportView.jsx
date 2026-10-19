import React, { useState, useEffect } from 'react';
import { DownloadCloud, CheckCircle2, AlertCircle, ArrowRight, ExternalLink, History, Music } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SpotifyImportView({ onSelectPlaylist }) {
  const { isAuthenticated, openAuth } = useAuth();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'history'

  useEffect(() => {
    if (isAuthenticated && activeTab === 'history') {
      api.get('/import/history')
        .then(res => setHistory(res.imports || []))
        .catch(console.error);
    }
  }, [isAuthenticated, activeTab]);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }

    if (!playlistUrl.trim()) return;

    setLoading(true);
    setError('');
    setImportResult(null);

    try {
      const res = await api.post('/import/spotify', { playlistUrl: playlistUrl.trim() });
      setImportResult(res);
      setPlaylistUrl('');
    } catch (err) {
      setError(err.message || 'Import failed. Check the Spotify link and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-audira-border">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <DownloadCloud size={26} className="text-emerald-400" />
            Spotify Playlist Importer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Seamlessly migrate playlists into your free Audira library.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-audira-card p-1 rounded-xl border border-audira-border text-xs">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'import' ? 'bg-audira-hover text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Import
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'history' ? 'bg-audira-hover text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Input Form */}
          <form onSubmit={handleImport} className="bg-audira-card/50 border border-audira-border p-6 rounded-2xl space-y-4 shadow-xl">
            <label className="block text-xs font-bold text-slate-300">
              Paste Spotify Playlist Link or URI
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
                className="flex-1 bg-[#0D0E15] border border-audira-border rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2 flex-shrink-0"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Matching Songs...</span>
                  </>
                ) : (
                  <>
                    <span>Import Playlist</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Matches tracks to the Audira catalog by title and artist. Unmatched songs will be itemized below.
            </p>
          </form>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-300 text-xs">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Import Result Screen */}
          {importResult && (
            <div className="bg-audira-card border border-audira-border rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-audira-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{importResult.playlist.title}</h3>
                    <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                      Matched {importResult.matched_count} of {importResult.total_spotify_tracks} tracks (
                      {Math.round((importResult.matched_count / (importResult.total_spotify_tracks || 1)) * 100)}%)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectPlaylist?.(importResult.playlist.id)}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Open In Library</span>
                  <ExternalLink size={14} />
                </button>
              </div>

              {/* Unmatched Tracks Table */}
              {importResult.unmatched_tracks?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-orange-400 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle size={15} />
                    <span>Songs Not Found in Catalog ({importResult.unmatched_count})</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-audira-border rounded-xl divide-y divide-audira-border/30 bg-[#0D0E15]">
                    {importResult.unmatched_tracks.map((track, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                        <div className="truncate pr-4">
                          <p className="font-bold text-slate-200 truncate">{track.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest flex-shrink-0">Not in catalog</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs">
              No previous Spotify playlist imports found.
            </div>
          ) : (
            history.map(item => (
              <div
                key={item.id}
                onClick={() => item.target_playlist_id && onSelectPlaylist?.(item.target_playlist_id)}
                className="flex items-center justify-between p-4 bg-audira-card/60 hover:bg-audira-card border border-audira-border rounded-2xl cursor-pointer transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Music size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.spotify_playlist_name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.matched_count} of {item.total_tracks} songs matched • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
