import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Play, Pause, Heart, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { usePlayer } from '../context/PlayerContext';
import { TrackRowSkeleton, CardSkeleton } from '../components/Common/SkeletonLoader';
import { StaggerContainer, StaggerItem, AnimatedLikeButton, SpringButton } from '../components/Common/Motion';

const GENRES = [
  { name: 'Electronic & Dance', color: 'from-violet-600 to-indigo-800' },
  { name: 'Lo-Fi Chill & Beats', color: 'from-pink-600 via-rose-600 to-amber-600' },
  { name: 'Pop & Modern Hits', color: 'from-purple-600 to-cyan-600' },
  { name: 'Rock, Punk & Alt', color: 'from-red-600 via-rose-700 to-orange-800' },
  { name: 'Hip-Hop & Trap', color: 'from-amber-500 via-orange-600 to-rose-700' },
  { name: 'Ambient & Deep Focus', color: 'from-emerald-600 via-teal-700 to-cyan-800' },
  { name: 'Synthwave & Retrowave', color: 'from-fuchsia-600 via-pink-600 to-purple-800' },
  { name: 'Gaming Soundtracks', color: 'from-blue-600 to-indigo-800' },
];

export default function SearchView({ onSelectPlaylist, onSelectArtist }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, isLiked } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
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
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Search Bar Input */}
      <div className="relative max-w-xl">
        <SearchIcon size={20} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to play? (Song, artist, album, playlist)"
          className="w-full bg-audira-card/90 border border-audira-border focus:border-purple-500 rounded-full pl-12 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none shadow-xl transition"
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

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <TrackRowSkeleton count={5} />
        </div>
      )}

      {/* Default Browse Screen: Genre & Categories Grid */}
      {!query && !loading && (
        <section>
          <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-400" />
            Browse All Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {GENRES.map((genre, i) => (
              <div
                key={i}
                onClick={() => setQuery(genre.name.split(' ')[0])}
                className={`h-36 rounded-2xl p-5 bg-gradient-to-br ${genre.color} flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all shadow-lg relative overflow-hidden group`}
              >
                <span className="font-extrabold text-base md:text-lg text-white tracking-wide z-10">
                  {genre.name}
                </span>
                <div className="self-end text-4xl opacity-20 group-hover:scale-110 group-hover:opacity-35 transition-all select-none">
                  ♫
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search Results Display */}
      {results && !loading && (
        <div className="space-y-8">
          {/* Top Result + Songs Column */}
          {results.tracks?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Result Card */}
              <div className="bg-audira-card/60 border border-audira-border p-6 rounded-2xl flex flex-col justify-between relative group hover:bg-audira-card transition">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Top Result</p>
                  <img
                    src={results.tracks[0].cover_url}
                    alt={results.tracks[0].title}
                    className="w-24 h-24 rounded-2xl object-cover shadow-xl mb-4 border border-white/10"
                  />
                  <h3 className="text-xl font-black text-white truncate">{results.tracks[0].title}</h3>
                  <p className="text-sm text-slate-300 font-semibold mt-0.5 hover:underline cursor-pointer">{results.tracks[0].artist_name}</p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/60 text-white">
                    Song
                  </span>
                  <button
                    onClick={() => playTrack(results.tracks[0], results.tracks)}
                    className="w-12 h-12 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
                  >
                    {currentTrack?.id === results.tracks[0].id && isPlaying ? (
                      <Pause size={20} className="fill-black text-black" />
                    ) : (
                      <Play size={20} className="fill-black text-black ml-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Songs List */}
              <div className="lg:col-span-2 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Songs</p>
                {results.tracks.slice(0, 5).map(track => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isCurrentPlaying = isCurrent && isPlaying;

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, results.tracks)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer ${
                        isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        <img
                          src={track.cover_url}
                          alt={track.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm"
                        />
                        <div className="overflow-hidden min-w-0">
                          <p className={`text-xs font-bold truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{track.artist_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 shrink-0">
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
                  );
                })}
              </div>
            </div>
          )}

          {/* Artists Matches */}
          {results.artists?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Artists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {results.artists.map(artist => (
                  <div
                    key={artist.id}
                    onClick={() => onSelectArtist?.(artist.id)}
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
            </section>
          )}

          {/* Playlists Matches */}
          {results.playlists?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Playlists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {results.playlists.map(playlist => (
                  <div
                    key={playlist.id}
                    onClick={() => onSelectPlaylist(playlist.id)}
                    className="spotify-card p-3 rounded-2xl cursor-pointer"
                  >
                    <img
                      src={playlist.cover_url}
                      alt={playlist.title}
                      className="w-full aspect-square rounded-xl object-cover mb-2"
                    />
                    <p className="text-xs font-bold text-white truncate">{playlist.title}</p>
                    <p className="text-[10px] text-slate-400">By @{playlist.owner_username}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.tracks?.length === 0 && results.artists?.length === 0 && results.playlists?.length === 0 && (
            <div className="text-center py-20 text-slate-500 text-sm">
              No results found for "{query}". Try a different search term or check spelling.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
