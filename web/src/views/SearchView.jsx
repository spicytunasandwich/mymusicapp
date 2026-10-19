import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Play, Heart } from 'lucide-react';
import { api } from '../api/client';
import { usePlayer } from '../context/PlayerContext';

const GENRES = [
  { name: 'Electronic', color: 'from-indigo-600 to-purple-600' },
  { name: 'Lo-Fi Chill', color: 'from-pink-600 to-rose-500' },
  { name: 'Pop & Modern', color: 'from-amber-500 to-orange-600' },
  { name: 'Rock & Alt', color: 'from-red-600 to-rose-700' },
  { name: 'Hip-Hop & R&B', color: 'from-purple-600 to-indigo-800' },
  { name: 'Ambient & Focus', color: 'from-emerald-600 to-teal-700' },
  { name: 'Synthwave', color: 'from-fuchsia-600 to-cyan-600' },
  { name: 'Gaming', color: 'from-blue-600 to-violet-700' },
];

export default function SearchView({ onSelectPlaylist, onSelectArtist }) {
  const { playTrack, currentTrack, toggleLike, isLiked } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/music/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Search Bar Input */}
      <div className="relative max-w-xl">
        <SearchIcon size={20} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to play? (Song, artist, album, playlist)"
          className="w-full bg-audira-card border border-audira-border rounded-full pl-12 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-xl transition"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No Query: Browse All Genres */}
      {!query && (
        <section>
          <h2 className="text-xl font-black text-white mb-5">Browse All Genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {GENRES.map((genre, i) => (
              <div
                key={i}
                onClick={() => setQuery(genre.name)}
                className={`h-36 rounded-2xl p-5 bg-gradient-to-br ${genre.color} flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition shadow-lg relative overflow-hidden`}
              >
                <span className="font-extrabold text-lg text-white tracking-wide">{genre.name}</span>
                <div className="self-end text-3xl opacity-30 select-none">♫</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search Results Display */}
      {results && !loading && (
        <div className="space-y-8">
          {/* Top Result + Songs */}
          {results.tracks?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Result Card */}
              <div className="bg-audira-card/40 border border-audira-border p-6 rounded-2xl flex flex-col justify-between relative group hover:bg-audira-card transition">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Top Result</p>
                  <img
                    src={results.tracks[0].cover_url}
                    alt={results.tracks[0].title}
                    className="w-24 h-24 rounded-xl object-cover shadow-xl mb-4"
                  />
                  <h3 className="text-xl font-black text-white truncate">{results.tracks[0].title}</h3>
                  <p className="text-sm text-purple-300 font-semibold mt-0.5">{results.tracks[0].artist_name}</p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/30">
                    Track
                  </span>
                  <button
                    onClick={() => playTrack(results.tracks[0], results.tracks)}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition"
                  >
                    <Play size={20} className="fill-white ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Tracks List */}
              <div className="lg:col-span-2 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Songs</p>
                {results.tracks.slice(0, 5).map(track => (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, results.tracks)}
                    className="group flex items-center justify-between p-2 rounded-xl hover:bg-audira-card/80 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={track.cover_url} alt={track.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className={`text-xs font-bold truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{track.artist_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                        className="p-1 hover:text-white"
                      >
                        <Heart size={16} className={isLiked(track.id) ? 'fill-purple-500 text-purple-500' : ''} />
                      </button>
                      <span className="text-[11px] font-mono w-9 text-right">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artists Matches */}
          {results.artists?.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Artists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {results.artists.map(artist => (
                  <div
                    key={artist.id}
                    onClick={() => onSelectArtist?.(artist.id)}
                    className="group flex flex-col items-center text-center p-3 rounded-2xl hover:bg-audira-card/50 transition cursor-pointer"
                  >
                    <img src={artist.avatar_url} alt={artist.name} className="w-24 h-24 rounded-full object-cover mb-2 border border-purple-500/20 group-hover:border-purple-500" />
                    <p className="text-xs font-bold text-white truncate max-w-full">{artist.name}</p>
                    <p className="text-[10px] text-slate-400">Artist</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Playlists Matches */}
          {results.playlists?.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Playlists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {results.playlists.map(playlist => (
                  <div
                    key={playlist.id}
                    onClick={() => onSelectPlaylist(playlist.id)}
                    className="bg-audira-card/40 hover:bg-audira-card p-3 rounded-2xl border border-audira-border transition cursor-pointer"
                  >
                    <img src={playlist.cover_url} alt={playlist.title} className="w-full aspect-square rounded-xl object-cover mb-2" />
                    <p className="text-xs font-bold text-white truncate">{playlist.title}</p>
                    <p className="text-[10px] text-slate-400">By @{playlist.owner_username}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.tracks?.length === 0 && results.artists?.length === 0 && results.playlists?.length === 0 && (
            <div className="text-center py-20 text-slate-500 text-sm">
              No results found for "{query}". Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
