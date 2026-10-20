import React, { useEffect, useState } from 'react';
import { Play, Pause, Flame, Sparkles, Music } from 'lucide-react';
import { api } from '../api/client';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton, QuickPlaySkeleton } from '../components/Common/SkeletonLoader';
import EqualizerWave from '../components/Common/EqualizerWave';
import { StaggerContainer, StaggerItem, SpringButton } from '../components/Common/Motion';

export default function HomeView({ onSelectPlaylist, onSelectArtist, onSelectAlbum }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { user } = useAuth();
  const [data, setData] = useState({
    featured_playlists: [],
    top_tracks: [],
    popular_artists: [],
    new_releases: [],
    recently_played: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/music/home')
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Quick play items (either recently played tracks or top featured playlists)
  const quickItems = data.recently_played.length > 0
    ? data.recently_played.slice(0, 6)
    : data.featured_playlists.slice(0, 6);

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      {/* Spotify Top Greeting & Quick Play Grid */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-5">
          {getGreeting()}{user?.display_name ? `, ${user.display_name.split(' ')[0]}` : ''}
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickPlaySkeleton count={6} />
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickItems.map((item) => {
              const isTrack = Boolean(item.artist_name || item.duration);
              const isItemPlaying = isTrack && currentTrack?.id === item.id && isPlaying;

              return (
                <StaggerItem key={item.id}>
                  <div
                    onClick={() => {
                      if (isTrack) {
                        playTrack(item, data.recently_played.length ? data.recently_played : data.top_tracks);
                      } else {
                        onSelectPlaylist?.(item.id);
                      }
                    }}
                    className="quick-play-card group h-16"
                  >
                    <img
                      src={item.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300'}
                      alt={item.title}
                      className="w-16 h-16 object-cover shrink-0 shadow-md"
                    />
                    <div className="flex-1 px-3.5 min-w-0">
                      <p className={`text-xs font-bold truncate ${isItemPlaying ? 'text-purple-400' : 'text-white'}`}>
                        {item.title}
                      </p>
                      {isTrack && (
                        <p className="text-[10px] text-slate-400 truncate">{item.artist_name}</p>
                      )}
                    </div>
                    <div className="pr-3">
                      <div className="quick-play-btn w-9 h-9 rounded-full bg-audira-accent text-black flex items-center justify-center shadow-md">
                        {isItemPlaying ? (
                          <Pause size={15} className="fill-black text-black" />
                        ) : (
                          <Play size={15} className="fill-black text-black ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>

      {/* Featured Playlists Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            Featured Playlists
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <CardSkeleton count={5} />
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.featured_playlists.map((playlist) => (
              <StaggerItem key={playlist.id}>
                <div
                  onClick={() => onSelectPlaylist(playlist.id)}
                  className="spotify-card p-3.5 rounded-2xl cursor-pointer flex flex-col group h-full"
                >
                  {/* Artwork with floating play button */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#0D0E15] shadow-lg">
                    <img
                      src={playlist.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500'}
                      alt={playlist.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="play-btn absolute right-2.5 bottom-2.5 w-11 h-11 rounded-full bg-audira-accent text-black flex items-center justify-center shadow-lg">
                      <Play size={18} className="fill-black text-black ml-0.5" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-white truncate">{playlist.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {playlist.description || `By @${playlist.owner_username}`}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* Top Tracks */}
      <section>
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
          <Flame size={20} className="text-orange-400" />
          Top Songs Today
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <QuickPlaySkeleton count={3} />
            </div>
            <div className="space-y-2">
              <QuickPlaySkeleton count={3} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.top_tracks.map((track, i) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, data.top_tracks)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                    isCurrent
                      ? 'bg-purple-950/30 border-purple-500/50'
                      : 'bg-audira-card/50 hover:bg-audira-card-hover border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <span className="text-xs font-bold text-slate-500 w-5 text-center shrink-0 flex items-center justify-center">
                      {isCurrentPlaying ? (
                        <EqualizerWave className="mx-auto" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <img
                      src={track.cover_url}
                      alt={track.title}
                      className="w-11 h-11 rounded-lg object-cover shrink-0 shadow-sm"
                    />
                    <div className="overflow-hidden min-w-0">
                      <p className={`text-xs font-bold truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{track.artist_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-xs shrink-0 pr-1">
                    <span className="text-[11px] font-mono">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                    <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md">
                      {isCurrentPlaying ? (
                        <Pause size={13} className="fill-black" />
                      ) : (
                        <Play size={13} className="fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Popular Artists */}
      {data.popular_artists.length > 0 && (
        <section>
          <h2 className="text-xl font-black text-white mb-4">Popular Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {data.popular_artists.map(artist => (
              <div
                key={artist.id}
                onClick={() => onSelectArtist?.(artist.id)}
                className="group flex flex-col items-center text-center cursor-pointer p-3 rounded-2xl hover:bg-audira-card transition"
              >
                <div className="relative aspect-square w-full rounded-full overflow-hidden mb-3 bg-[#11121C] shadow-lg border border-purple-500/20 group-hover:border-purple-500 transition-all">
                  <img
                    src={artist.avatar_url}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="text-xs font-bold text-white truncate max-w-full">{artist.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Artist</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
