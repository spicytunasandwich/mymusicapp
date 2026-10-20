import React, { useState, useEffect } from 'react';
import {
  DownloadCloud, CheckCircle2, AlertCircle, ArrowRight, ExternalLink,
  History, Music, Search, Link2, Plus, Sparkles, Check, Loader2, X
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function formatDuration(ms) {
  if (!ms) return '0:00';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function SpotifyImportView({ onSelectPlaylist }) {
  const { isAuthenticated, openAuth } = useAuth();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importPhase, setImportPhase] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'history'
  const [resultSubTab, setResultSubTab] = useState('unmatched'); // 'unmatched' | 'matched'

  // Manual Matching Modal State
  const [matchingTrack, setMatchingTrack] = useState(null); // The Spotify track being matched
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [linkingId, setLinkingId] = useState(null);
  const [manualMatchSuccess, setManualMatchSuccess] = useState('');

  useEffect(() => {
    if (isAuthenticated && activeTab === 'history') {
      api.get('/import/history')
        .then(res => setHistory(res.imports || []))
        .catch(console.error);
    }
  }, [isAuthenticated, activeTab]);

  // Simulated phased progress animation during import
  useEffect(() => {
    if (!loading) {
      setImportProgress(0);
      setImportPhase('');
      return;
    }

    setImportProgress(15);
    setImportPhase('Connecting to Spotify & resolving playlist link...');

    const t1 = setTimeout(() => {
      setImportProgress(45);
      setImportPhase('Extracting playlist tracks and album metadata...');
    }, 900);

    const t2 = setTimeout(() => {
      setImportProgress(78);
      setImportPhase('Cross-referencing songs with Linear music catalog...');
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

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
      setImportProgress(100);
      setImportPhase('Complete!');
      setImportResult(res);
      setResultSubTab(res.unmatched_tracks?.length > 0 ? 'unmatched' : 'matched');
      setPlaylistUrl('');
    } catch (err) {
      setError(err.message || 'Import failed. Check the Spotify link and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open manual matching dialog for an unmatched track
  const openManualMatch = (spotifyTrack) => {
    setMatchingTrack(spotifyTrack);
    const initialQuery = `${spotifyTrack.title} ${spotifyTrack.artist}`.trim();
    setSearchQuery(initialQuery);
    setSearchResults([]);
    setManualMatchSuccess('');
    performSearch(initialQuery);
  };

  const performSearch = async (query) => {
    if (!query || query.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await api.get(`/music/search?q=${encodeURIComponent(query.trim())}`);
      setSearchResults(res.tracks || []);
    } catch (err) {
      console.warn('Search error in manual matching:', err);
    } finally {
      setSearching(false);
    }
  };

  // Link selected Audira track to the created playlist
  const handleLinkTrack = async (audiraTrack) => {
    if (!importResult?.playlist?.id || !matchingTrack) return;
    setLinkingId(audiraTrack.id);

    try {
      await api.post(`/library/playlists/${importResult.playlist.id}/tracks`, {
        trackId: audiraTrack.id
      });

      // Update state: move track from unmatched to matched
      setImportResult(prev => {
        if (!prev) return prev;
        const newUnmatched = prev.unmatched_tracks.filter(
          t => t.spotify_id !== matchingTrack.spotify_id && t.title !== matchingTrack.title
        );
        const newMatched = [
          ...prev.matched_tracks,
          {
            id: audiraTrack.id,
            title: audiraTrack.title,
            artist_name: audiraTrack.artist_name,
            duration: audiraTrack.duration,
            cover_url: audiraTrack.cover_url
          }
        ];

        return {
          ...prev,
          matched_count: prev.matched_count + 1,
          unmatched_count: Math.max(0, prev.unmatched_count - 1),
          unmatched_tracks: newUnmatched,
          matched_tracks: newMatched
        };
      });

      setManualMatchSuccess(`Successfully matched "${audiraTrack.title}"!`);
      setTimeout(() => {
        setMatchingTrack(null);
        setManualMatchSuccess('');
      }, 700);
    } catch (err) {
      alert('Failed to link track: ' + err.message);
    } finally {
      setLinkingId(null);
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
            Zero-key public sync • Automatic track matching • Manual matching resolver.
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
              Paste Spotify Playlist Link, URI, or Shortlink
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                disabled={loading}
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
                className="flex-1 bg-[#0D0E15] border border-audira-border rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !playlistUrl.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>Import Playlist</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>

            {/* Phased Live Progress Bar */}
            {loading && (
              <div className="pt-2 space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Sparkles size={13} className="animate-pulse" />
                    {importPhase}
                  </span>
                  <span className="text-slate-400 font-mono font-bold">{importProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-emerald-900/40">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full shadow-lg shadow-emerald-500/50"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              Supports any public Spotify playlist. Over 100 tracks handled with pagination. Unmatched songs can be resolved manually below.
            </p>
          </form>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-300 text-xs">
              <AlertCircle size={18} className="flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Import Result Screen */}
          {importResult && (
            <div className="bg-audira-card border border-audira-border rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Result Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-audira-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
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

              {/* Matched vs Unmatched Toggle */}
              <div className="flex items-center gap-2 border-b border-audira-border pb-3">
                <button
                  onClick={() => setResultSubTab('unmatched')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    resultSubTab === 'unmatched'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertCircle size={14} />
                  <span>Unmatched Songs ({importResult.unmatched_tracks?.length || 0})</span>
                </button>

                <button
                  onClick={() => setResultSubTab('matched')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    resultSubTab === 'matched'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>Matched Songs ({importResult.matched_tracks?.length || 0})</span>
                </button>
              </div>

              {/* 1. UNMATCHED SONGS LIST WITH MANUAL MATCH BUTTON */}
              {resultSubTab === 'unmatched' && (
                <div className="space-y-3">
                  {importResult.unmatched_tracks?.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-950/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
                      🎉 All songs from this Spotify playlist were successfully matched into your Linear library!
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto border border-audira-border rounded-xl divide-y divide-audira-border/30 bg-[#0D0E15]">
                      {importResult.unmatched_tracks.map((track, i) => (
                        <div key={i} className="flex items-center justify-between p-3 px-4 text-xs hover:bg-white/[0.02] transition">
                          <div className="truncate pr-4">
                            <p className="font-bold text-slate-200 truncate">{track.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                          </div>

                          <button
                            onClick={() => openManualMatch(track)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition shrink-0"
                          >
                            <Link2 size={13} />
                            <span>Match Song</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. MATCHED SONGS LIST */}
              {resultSubTab === 'matched' && (
                <div className="max-h-80 overflow-y-auto border border-audira-border rounded-xl divide-y divide-audira-border/30 bg-[#0D0E15]">
                  {importResult.matched_tracks?.map((track, i) => (
                    <div key={i} className="flex items-center justify-between p-3 px-4 text-xs">
                      <div className="flex items-center gap-3 truncate pr-4">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                          {track.cover_url ? (
                            <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500"><Music size={14} /></div>
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-200 truncate">{track.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{track.artist_name || 'Linear Catalog'}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 shrink-0 font-semibold">
                        <Check size={13} />
                        Matched
                      </span>
                    </div>
                  ))}
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

      {/* MANUAL MATCHING MODAL */}
      {matchingTrack && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#11121C] border border-[#23263B] rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#23263B]">
              <div>
                <h3 className="font-bold text-white text-sm">Manually Match Spotify Song</h3>
                <p className="text-[11px] text-slate-400">
                  Target: <b className="text-slate-200">{matchingTrack.title}</b> by <span className="text-purple-300">{matchingTrack.artist}</span>
                </p>
              </div>
              <button
                onClick={() => setMatchingTrack(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            {manualMatchSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{manualMatchSuccess}</span>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  performSearch(e.target.value);
                }}
                placeholder="Search Linear catalog for title or artist..."
                className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* Search Results */}
            <div className="max-h-64 overflow-y-auto divide-y divide-[#23263B]/60 border border-[#23263B] rounded-xl bg-[#090A10]">
              {searching ? (
                <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-purple-400" />
                  <span>Searching Linear catalog...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No matching tracks found in Linear catalog for "{searchQuery}".
                </div>
              ) : (
                searchResults.map(track => (
                  <div key={track.id} className="flex items-center justify-between p-3 hover:bg-white/[0.03] transition text-xs">
                    <div className="flex items-center gap-3 truncate pr-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                        {track.cover_url ? (
                          <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500"><Music size={13} /></div>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-white truncate">{track.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{track.artist_name}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLinkTrack(track)}
                      disabled={linkingId === track.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shrink-0 flex items-center gap-1 disabled:opacity-50"
                    >
                      {linkingId === track.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Link2 size={13} />
                      )}
                      <span>Link Track</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
