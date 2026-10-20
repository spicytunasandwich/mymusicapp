import React, { useState, useEffect } from 'react';
import {
  Play, Pause, Heart, Check, Plus, MoreHorizontal,
  ShieldCheck, Disc3, Clock, Sparkles, ChevronLeft
} from 'lucide-react';
import { api } from '../api/client';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import EqualizerWave from '../components/Common/EqualizerWave';
import { SpringButton, AnimatedLikeButton, StaggerContainer, StaggerItem } from '../components/Common/Motion';

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const mins = Math.floor(sec / 60);
  const remainingSecs = Math.floor(sec % 60);
  return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
}

function formatNumber(num) {
  if (!num) return '0';
  return Number(num).toLocaleString();
}

export default function ArtistView({ artistId, onBack, onSelectAlbum }) {
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, isLiked } = usePlayer();
  const { isAuthenticated, openAuth } = useAuth();

  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'album' | 'single'
  const [showAllTracks, setShowAllTracks] = useState(false);

  useEffect(() => {
    if (!artistId) return;
    setLoading(true);

    api.get(`/music/artists/${artistId}`)
      .then(res => {
        setArtist(res.artist);
        setTopTracks(res.top_tracks || []);
        setAlbums(res.albums || []);
        setIsFollowed(Boolean(res.artist?.is_followed));
      })
      .catch(err => {
        console.error('Failed to load artist details:', err);
      })
      .finally(() => setLoading(false));
  }, [artistId]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    const nextState = !isFollowed;
    setIsFollowed(nextState);
    try {
      if (nextState) {
        await api.post(`/library/artists/${artistId}`);
      } else {
        await api.delete(`/library/artists/${artistId}`);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
      setIsFollowed(!nextState);
    }
  };

  const isCurrentArtistPlaying = isPlaying && topTracks.some(t => t.id === currentTrack?.id);

  const handlePlayArtist = () => {
    if (topTracks.length === 0) return;
    if (isCurrentArtistPlaying) {
      togglePlay();
    } else {
      playTrack(topTracks[0], topTracks);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-10 h-10 border-2 border-audira-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Loading artist profile...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-8 text-center text-slate-400">
        <h2 className="text-xl font-bold text-white mb-2">Artist not found</h2>
        <button
          onClick={onBack}
          className="mt-4 px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const heroImage = artist.banner_url || artist.avatar_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600';
  const displayedTracks = showAllTracks ? topTracks : topTracks.slice(0, 5);
  const filteredAlbums = filterType === 'all'
    ? albums
    : albums.filter(a => (a.album_type || 'album').toLowerCase() === filterType);

  return (
    <div className="min-h-full pb-28 relative">
      {/* Hero Header with Parallax Gradient Mask */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden select-none">
        {/* Artist Hero Image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${heroImage})` }}
        />

        {/* 1:1 Spotify Gradient Mask (darkens to bottom into theme surface) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/60 to-[#121212]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-5 left-6 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white transition hover:scale-105 active:scale-95 shadow-md"
            title="Go Back"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Artist Hero Text Content */}
        <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 flex flex-col justify-end text-white z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
            <ShieldCheck size={18} className="fill-cyan-400/20 text-cyan-400" />
            <span>Verified Artist</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-md text-white mb-3">
            {artist.name}
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-slate-300 drop-shadow">
            {formatNumber(artist.monthly_listeners || 128450)} monthly listeners
          </p>
        </div>
      </div>

      {/* Action Controls Bar (1:1 Spotify Play, Follow, Options) */}
      <div className="px-6 sm:px-8 py-5 flex items-center gap-5 border-b border-white/[0.05]">
        {/* Signature Spotify Green Round Play Button */}
        <button
          onClick={handlePlayArtist}
          className="w-14 h-14 rounded-full bg-audira-accent hover:scale-105 active:scale-95 transition text-black flex items-center justify-center shadow-lg"
          title={isCurrentArtistPlaying ? 'Pause' : 'Play Artist'}
        >
          {isCurrentArtistPlaying ? (
            <Pause size={24} className="fill-black" />
          ) : (
            <Play size={24} className="fill-black ml-1" />
          )}
        </button>

        {/* Follow Button */}
        <button
          onClick={handleFollowToggle}
          className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition border ${
            isFollowed
              ? 'border-white/40 text-white hover:border-white bg-white/5'
              : 'border-white/60 text-white hover:border-white hover:scale-105 active:scale-95'
          }`}
        >
          {isFollowed ? 'Following' : 'Follow'}
        </button>

        <button
          className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-white/10"
          title="More options"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* Main Artist Content */}
      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto space-y-10">
        {/* Popular / Trending Songs */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Popular</h2>

          {topTracks.length === 0 ? (
            <p className="text-xs text-slate-400">No popular tracks listed for this artist yet.</p>
          ) : (
            <div className="space-y-1">
              {displayedTracks.map((track, idx) => {
                const isTrackActive = currentTrack?.id === track.id;
                const isTrackPlaying = isTrackActive && isPlaying;
                const liked = isLiked(track.id);

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, topTracks)}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer ${
                      isTrackActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Index / Equalizer / Play Icon */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-5 text-center text-xs font-bold text-slate-400 shrink-0">
                        {isTrackPlaying ? (
                          <EqualizerWave className="mx-auto" />
                        ) : (
                          <>
                            <span className="group-hover:hidden">{idx + 1}</span>
                            <Play size={13} className="hidden group-hover:block mx-auto fill-white text-white" />
                          </>
                        )}
                      </div>

                      {/* Cover Art */}
                      <img
                        src={track.cover_url || artist.avatar_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                        alt={track.title}
                        className="w-10 h-10 rounded-md object-cover shrink-0 shadow"
                      />

                      {/* Track Title */}
                      <div className="min-w-0 pr-3">
                        <p className={`text-sm font-semibold truncate ${isTrackActive ? 'text-audira-accent' : 'text-white'}`}>
                          {track.title}
                        </p>
                        {track.album_title && (
                          <p className="text-[11px] text-slate-400 truncate group-hover:text-slate-300">
                            {track.album_title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stream Count */}
                    <div className="hidden sm:block text-xs text-slate-400 font-medium text-right pr-6">
                      {formatNumber(track.stream_count || 42800 + (10 - idx) * 8920)}
                    </div>

                    {/* Like & Duration */}
                    <div className="flex items-center gap-3 shrink-0">
                      <AnimatedLikeButton
                        isLiked={liked}
                        onToggle={(e) => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                        size={16}
                      />
                      <span className="text-xs text-slate-400 font-mono w-10 text-right">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {topTracks.length > 5 && (
                <button
                  onClick={() => setShowAllTracks(!showAllTracks)}
                  className="mt-3 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition px-3.5 py-1.5"
                >
                  {showAllTracks ? 'Show Less' : 'See More'}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Discography / Albums & Singles */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Discography</h2>

            {/* Spotify Pill Filters */}
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: 'All Releases' },
                { id: 'album', label: 'Albums' },
                { id: 'single', label: 'Singles & EPs' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    filterType === tab.id
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAlbums.length === 0 ? (
            <p className="text-xs text-slate-400">No releases found under this category.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredAlbums.map(album => (
                <div
                  key={album.id}
                  onClick={() => onSelectAlbum?.(album.id)}
                  className="spotify-card group bg-[#181818] hover:bg-[#282828] p-3.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-square mb-3.5 rounded-lg overflow-hidden bg-black/40 shadow-md">
                    <img
                      src={album.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Hover Play Button */}
                    <div className="play-btn absolute right-2.5 bottom-2.5 w-11 h-11 rounded-full bg-audira-accent text-black flex items-center justify-center shadow-lg">
                      <Play size={18} className="fill-black text-black ml-0.5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white truncate">{album.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 capitalize">
                      {album.release_year || '2024'} • {album.album_type || 'Album'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* About Artist Card */}
        {artist.bio && (
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">About</h2>
            <div className="relative rounded-2xl overflow-hidden bg-[#181818] border border-white/5 p-6 sm:p-8 max-w-3xl">
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <div className="text-lg font-bold text-white">
                  {formatNumber(artist.monthly_listeners || 128450)} monthly listeners
                </div>
                <p>{artist.bio}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
