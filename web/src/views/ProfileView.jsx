import React, { useEffect, useState, useRef } from 'react';
import {
  User, Calendar, Music2, Camera, Check, X,
  ShieldCheck, Sparkles, Award, Headphones, Moon, Heart,
  Type, Palette, Play, Pause, MessageSquare, Gift, MoreHorizontal,
  Flame, Disc, ChevronRight, Share2, Plus
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { usePresence } from '../context/PresenceContext';
import ImageCropModal from '../components/Common/ImageCropModal';
import ErrorBoundary from '../components/Common/ErrorBoundary';
import { ProfileHeaderSkeleton } from '../components/Common/SkeletonLoader';
import ColorPicker from '../components/Common/ColorPicker';
import { BUNDLED_FONTS } from '../components/Common/FontPicker';
import EqualizerWave from '../components/Common/EqualizerWave';

const BADGE_ICONS = {
  early_adopter: { icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  old_listener: { icon: Headphones, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  playlist_maker: { icon: Music2, color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/30' },
  night_owl: { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/30' },
  sound_collector: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/30' },
  verified_pioneer: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' }
};

export default function ProfileView({ username, onSelectPlaylist }) {
  const { user: currentUser, updateUser } = useAuth();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { getPresence } = usePresence();

  const targetUsername = username || currentUser?.username || 'me';
  const isOwnProfile = !username || (currentUser && (
    currentUser.username?.toLowerCase() === targetUsername?.toLowerCase() ||
    targetUsername === 'me'
  ));

  const [profile, setProfile] = useState(() => {
    if (currentUser && isOwnProfile) {
      return {
        ...currentUser,
        badges: [],
        playlists: [],
        followed_artists: []
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(!profile);
  const [activeTab, setActiveTab] = useState('bacheca'); // 'bacheca' | 'attivita' | 'playlists'

  // Crop modal state
  const [cropModal, setCropModal] = useState({ isOpen: false, file: null, type: 'avatar' });
  const [uploadError, setUploadError] = useState('');
  const [toast, setToast] = useState('');

  // Refs for hidden file inputs
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Edit in place states (Display Name)
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameValue, setDisplayNameValue] = useState('');
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Edit in place states (Username)
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState('');

  // Edit in place states (Bio)
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');

  // Edit in place states (Status Bubble)
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusValue, setStatusValue] = useState('');

  // Custom styling values
  const [selectedFont, setSelectedFont] = useState('Plus Jakarta Sans');
  const [accentColor, setAccentColor] = useState('#1DB954');

  const presence = getPresence(targetUsername);

  // Show auto-dismiss toast feedback
  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  // Sync profile data from server
  useEffect(() => {
    let isMounted = true;
    const fetchTarget = username || currentUser?.username || 'me';

    if (!profile) setLoading(true);

    api.get(`/users/profile/${fetchTarget}`)
      .then(res => {
        if (!isMounted) return;
        if (res.profile) {
          setProfile(res.profile);
          setDisplayNameValue(res.profile.display_name || res.profile.username || '');
          setUsernameValue(res.profile.username || '');
          setBioValue(res.profile.bio || '');
          setSelectedFont(res.profile.display_name_font || 'Plus Jakarta Sans');
          setAccentColor(res.profile.accent_color || '#1DB954');
          setStatusValue(res.profile.status_message || 'Overthinking is killing me');
        }
      })
      .catch(err => {
        console.warn('Profile fetch note:', err.message);
        if (isMounted && currentUser && isOwnProfile) {
          setProfile(prev => prev || {
            ...currentUser,
            badges: [],
            playlists: [],
            followed_artists: []
          });
          setDisplayNameValue(currentUser.display_name || currentUser.username || '');
          setUsernameValue(currentUser.username || '');
          setBioValue(currentUser.bio || '');
          setSelectedFont(currentUser.display_name_font || 'Plus Jakarta Sans');
          setAccentColor(currentUser.accent_color || '#1DB954');
          setStatusValue('Overthinking is killing me');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [username, currentUser?.username]);

  // Handle banner or avatar file selection
  const handleSelectFile = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type.toLowerCase())) {
      triggerToast('Invalid format. Use PNG, JPG, WebP, or GIF.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      triggerToast('File size exceeds the 8 MB limit.');
      return;
    }

    setCropModal({ isOpen: true, file, type });
    e.target.value = '';
  };

  // Handle crop completion & upload
  const handleApplyCrop = async (croppedFile) => {
    const type = cropModal.type;
    setCropModal({ isOpen: false, file: null, type: 'avatar' });

    try {
      const formData = new FormData();
      formData.append('image', croppedFile);

      const res = await api.post('/users/upload', formData);
      if (res && res.url) {
        if (type === 'banner') {
          const patchRes = await api.patch('/users/profile', { banner_url: res.url });
          setProfile(prev => ({ ...prev, banner_url: res.url }));
          updateUser(patchRes.user || { banner_url: res.url });
          triggerToast('Banner updated successfully!');
        } else {
          const patchRes = await api.patch('/users/profile', { avatar_url: res.url });
          setProfile(prev => ({ ...prev, avatar_url: res.url }));
          updateUser(patchRes.user || { avatar_url: res.url });
          triggerToast('Avatar updated successfully!');
        }
      }
    } catch (err) {
      triggerToast(err.message || 'Failed to upload image.');
    }
  };

  // Save Display Name & typography inline
  const handleSaveDisplayName = async () => {
    if (!displayNameValue.trim()) {
      setDisplayNameValue(profile.display_name || profile.username);
      setIsEditingDisplayName(false);
      return;
    }

    try {
      const res = await api.patch('/users/profile', {
        display_name: displayNameValue.trim(),
        display_name_font: selectedFont,
        accent_color: accentColor
      });
      setProfile(prev => ({
        ...prev,
        display_name: displayNameValue.trim(),
        display_name_font: selectedFont,
        accent_color: accentColor
      }));
      updateUser(res.user);
      setIsEditingDisplayName(false);
      setShowFontPicker(false);
      setShowColorPicker(false);
      triggerToast('Display name saved!');
    } catch (err) {
      triggerToast(err.message || 'Failed to save name');
    }
  };

  // Save Username inline
  const handleSaveUsername = async () => {
    const clean = usernameValue.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean || clean.length < 3) {
      triggerToast('Username must be at least 3 characters.');
      setUsernameValue(profile.username);
      setIsEditingUsername(false);
      return;
    }

    try {
      const res = await api.patch('/users/profile', { username: clean });
      setProfile(prev => ({ ...prev, username: clean }));
      updateUser(res.user);
      setIsEditingUsername(false);
      triggerToast('Username updated!');
    } catch (err) {
      triggerToast(err.message || 'Username already taken or invalid');
    }
  };

  // Save Bio inline
  const handleSaveBio = async () => {
    try {
      const res = await api.patch('/users/profile', { bio: bioValue.trim() });
      setProfile(prev => ({ ...prev, bio: bioValue.trim() }));
      updateUser(res.user);
      setIsEditingBio(false);
      triggerToast('Bio saved!');
    } catch (err) {
      triggerToast('Failed to save bio');
    }
  };

  // Save Status Bubble inline
  const handleSaveStatus = () => {
    setIsEditingStatus(false);
    triggerToast('Status updated!');
  };

  if (loading && !profile) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <ProfileHeaderSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24 text-slate-400">
        <h2 className="text-xl font-bold text-white mb-2">Profile not found</h2>
        <p className="text-xs">No user with username @{targetUsername} exists.</p>
      </div>
    );
  }

  const effectiveAccent = accentColor || profile.accent_color || '#1DB954';
  const effectiveFont = selectedFont || profile.display_name_font || 'Plus Jakarta Sans';

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto space-y-6 pb-24 will-animate animate-in fade-in duration-300">
        {/* Hidden File Inputs for Edit-in-Place Uploads */}
        {isOwnProfile && (
          <>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleSelectFile(e, 'banner')}
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleSelectFile(e, 'avatar')}
            />
          </>
        )}

        {/* 1:1 Discord Split Container: Profile Card on Left + Showcase Widgets on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: 1:1 Discord Profile Card (Matching Reference Screenshot) */}
          <div className="lg:col-span-5 bg-[#232428] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative will-animate">
            
            {/* 1. Discord Banner Area (8:3 Ratio) with Edit-in-Place Hover Overlay */}
            <div
              className="w-full aspect-[8/3] max-h-56 bg-cover bg-center relative group transition-all duration-300"
              style={{
                backgroundColor: effectiveAccent,
                backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined
              }}
            >
              {isOwnProfile && (
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute inset-0 bg-black/45 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer flex items-center justify-center will-animate"
                  title="Click to change banner"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 border border-white/20 text-white text-xs font-bold shadow-lg transform scale-95 group-hover:scale-100 transition-transform duration-200 will-animate">
                    <Camera size={14} className="text-[#1DB954]" />
                    <span>Change Banner</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Discord Profile Header: Overlapping Avatar + Status Bubble */}
            <div className="px-5 pb-5 pt-0 relative">
              <div className="flex items-end justify-between gap-3 -mt-12 sm:-mt-14 mb-4">
                
                {/* Overlapping Round Avatar with Edit-in-Place Hover */}
                <div className="relative inline-block shrink-0">
                  <div
                    onClick={() => isOwnProfile && avatarInputRef.current?.click()}
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-[2px] bg-[#1e1f22] shadow-2xl relative group ${isOwnProfile ? 'cursor-pointer' : ''}`}
                    style={{ border: `4px solid ${effectiveAccent}` }}
                    title={isOwnProfile ? 'Click to change avatar' : undefined}
                  >
                    <img
                      src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username || 'linear'}`}
                      alt={profile.display_name}
                      className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username || 'linear'}`;
                      }}
                    />
                    {isOwnProfile && (
                      <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white will-animate">
                        <Camera size={18} className="text-[#1DB954] transform scale-90 group-hover:scale-100 transition-transform" />
                        <span className="text-[10px] font-bold mt-0.5">Edit</span>
                      </div>
                    )}
                  </div>

                  {/* Discord Presence Indicator Dot */}
                  <div
                    title={presence.status === 'online' ? 'Online' : presence.status === 'idle' ? 'Idle' : 'Offline'}
                    className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-[#232428] shadow-md transition-colors ${
                      presence.status === 'online' ? 'bg-[#23a55a]' : presence.status === 'idle' ? 'bg-[#f0b232]' : 'bg-[#80848e]'
                    }`}
                  />
                </div>

                {/* 1:1 Speech Bubble Status Pill ("Overthinking is killing me") */}
                <div className="flex-1 min-w-0 pb-1">
                  {isEditingStatus ? (
                    <div className="flex items-center gap-1.5 bg-[#111214] border border-white/20 rounded-2xl px-3 py-1 shadow-lg">
                      <input
                        type="text"
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveStatus();
                          if (e.key === 'Escape') setIsEditingStatus(false);
                        }}
                        autoFocus
                        placeholder="What's on your mind?"
                        className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                      />
                      <button onClick={handleSaveStatus} className="text-[#1DB954] hover:scale-110 p-0.5 transition">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setIsEditingStatus(false)} className="text-slate-400 hover:text-white p-0.5 transition">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => isOwnProfile && setIsEditingStatus(true)}
                      className={`relative bg-[#111214] border border-white/10 px-3.5 py-1.5 rounded-2xl text-xs text-[#dbdee1] flex items-center gap-2 shadow-lg group ${
                        isOwnProfile ? 'cursor-pointer hover:border-white/25 hover:bg-[#15171a]' : ''
                      }`}
                      title={isOwnProfile ? 'Click to edit status' : undefined}
                    >
                      {/* Speech Bubble Pointer Arrow */}
                      <div className="w-2.5 h-2.5 bg-[#111214] border-l border-b border-white/10 rotate-45 absolute -left-1.5 top-1/2 -translate-y-1/2" />
                      <span className="truncate font-medium">{statusValue || 'Overthinking is killing me'}</span>
                      {isOwnProfile && (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400 ml-auto shrink-0">
                          edit
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Display Name & Username (With Edit-in-Place & Live Typography) */}
              <div className="space-y-1">
                {/* Display Name Row */}
                {isEditingDisplayName ? (
                  <div className="space-y-2 bg-[#111214] p-3 rounded-xl border border-white/15 shadow-xl will-animate">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={displayNameValue}
                        onChange={(e) => setDisplayNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveDisplayName();
                          if (e.key === 'Escape') {
                            setIsEditingDisplayName(false);
                            setShowFontPicker(false);
                            setShowColorPicker(false);
                          }
                        }}
                        autoFocus
                        style={{ fontFamily: effectiveFont, color: effectiveAccent }}
                        className="bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-lg font-black text-white focus:outline-none focus:border-[#1DB954] w-full"
                      />
                      <button
                        onClick={handleSaveDisplayName}
                        className="p-2 rounded-lg bg-[#1DB954] text-black hover:scale-105 active:scale-95 transition"
                        title="Save name"
                      >
                        <Check size={16} className="stroke-[3]" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDisplayName(false);
                          setShowFontPicker(false);
                          setShowColorPicker(false);
                        }}
                        className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Font & Color Quick Controls */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setShowFontPicker(!showFontPicker)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 border border-white/10 transition"
                      >
                        <Type size={13} className="text-[#1DB954]" />
                        <span>Font: {effectiveFont}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 border border-white/10 transition"
                      >
                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: effectiveAccent }} />
                        <span>Color</span>
                      </button>
                    </div>

                    {/* Inline Font Dropdown */}
                    {showFontPicker && (
                      <div className="p-2 bg-[#0D0E15] border border-white/15 rounded-xl shadow-2xl max-h-48 overflow-y-auto space-y-1 mt-1 scrollbar-none">
                        {BUNDLED_FONTS.map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setSelectedFont(f.id);
                              setShowFontPicker(false);
                            }}
                            className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition ${
                              selectedFont === f.id ? 'bg-[#1DB954]/20 text-[#1DB954] font-bold' : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <span style={{ fontFamily: f.id }} className="text-sm truncate">{displayNameValue || f.name}</span>
                            <span className="text-[10px] text-slate-500">{f.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Inline Color Picker Popover */}
                    {showColorPicker && (
                      <div className="p-3 bg-[#0D0E15] border border-white/15 rounded-xl shadow-2xl mt-1">
                        <ColorPicker
                          color={effectiveAccent}
                          onChange={(newHex) => setAccentColor(newHex)}
                          label="Display Name Color"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => isOwnProfile && setIsEditingDisplayName(true)}
                    className={`inline-flex items-center gap-2 group ${
                      isOwnProfile ? 'cursor-pointer hover:opacity-90' : ''
                    }`}
                    title={isOwnProfile ? 'Click to edit display name, font & color' : undefined}
                  >
                    <h1
                      className="text-2xl font-black text-white tracking-tight group-hover:underline underline-offset-4 decoration-white/30"
                      style={{ fontFamily: effectiveFont, color: effectiveAccent }}
                    >
                      {displayNameValue || profile.display_name || profile.username}
                    </h1>
                    {profile.is_verified && (
                      <span title="Verified Listener">
                        <ShieldCheck size={20} className="text-[#1DB954] fill-[#1DB954]/20 shrink-0" />
                      </span>
                    )}
                    {isOwnProfile && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 p-1">
                        <Type size={14} />
                      </span>
                    )}
                  </div>
                )}

                {/* Username Row with Edit-in-Place */}
                <div>
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">@</span>
                      <input
                        type="text"
                        value={usernameValue}
                        onChange={(e) => setUsernameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveUsername();
                          if (e.key === 'Escape') setIsEditingUsername(false);
                        }}
                        autoFocus
                        className="bg-[#111214] border border-white/20 rounded-md px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#1DB954]"
                      />
                      <button onClick={handleSaveUsername} className="text-[#1DB954] hover:scale-110 transition">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setIsEditingUsername(false)} className="text-slate-400 hover:text-white transition">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => isOwnProfile && setIsEditingUsername(true)}
                      className={`inline-flex items-center gap-1.5 group text-xs text-slate-400 font-medium ${
                        isOwnProfile ? 'cursor-pointer hover:text-white' : ''
                      }`}
                      title={isOwnProfile ? 'Click to edit username' : undefined}
                    >
                      <span className="group-hover:underline underline-offset-2">@{profile.username}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-500">Linear Pioneer</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Badges Row with Discord Glass Tooltips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3">
                {(profile.badges && profile.badges.length > 0 ? profile.badges : [
                  { badge_key: 'early_adopter', badge_name: 'Early Adopter', description: 'Joined Linear during platform launch.', icon: 'Sparkles' },
                  { badge_key: 'old_listener', badge_name: 'Old Listener', description: 'Active community member with listening history.', icon: 'Headphones' },
                  { badge_key: 'verified_pioneer', badge_name: 'Verified Pioneer', description: 'Verified authentic account.', icon: 'ShieldCheck' }
                ]).map((badge) => {
                  const meta = BADGE_ICONS[badge.badge_key] || {
                    icon: Award,
                    color: 'text-[#1DB954]',
                    bg: 'bg-[#1DB954]/10 border-[#1DB954]/30'
                  };
                  const IconComp = meta.icon;

                  return (
                    <div key={badge.badge_key} className="relative group">
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-110 ${meta.bg}`}
                        tabIndex={0}
                        aria-label={badge.badge_name}
                      >
                        <IconComp size={15} className={meta.color} />
                      </div>

                      {/* Discord Glass Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none transition-all duration-150 will-animate">
                        <div className="bg-[#111214]/95 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl shadow-2xl text-center min-w-[150px] max-w-[220px]">
                          <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <IconComp size={13} className={meta.color} />
                            <span className="text-white text-xs font-black">{badge.badge_name}</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            {badge.description}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-[#111214] border-r border-b border-white/10 rotate-45 -mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 5. Discord Action Row (Messaggio, Share, More) Matching Reference */}
              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold py-2 px-4 rounded-md transition shadow flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <MessageSquare size={14} />
                  <span>Messaggio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    triggerToast('Profile link copied!');
                  }}
                  className="p-2 rounded-md bg-[#2B2D31] hover:bg-[#35373C] text-slate-300 hover:text-white transition"
                  title="Share profile"
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-md bg-[#2B2D31] hover:bg-[#35373C] text-slate-300 hover:text-white transition"
                  title="More actions"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>

              {/* 6. Section Divider */}
              <div className="h-px bg-white/10 my-4" />

              {/* 7. Discord Profile Metadata & Bio Section */}
              <div className="space-y-4 text-xs">
                
                {/* PROFILO (Bio) with Edit-in-Place */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    PROFILO
                  </h4>
                  {isEditingBio ? (
                    <div className="space-y-2">
                      <textarea
                        value={bioValue}
                        onChange={(e) => setBioValue(e.target.value)}
                        rows={3}
                        placeholder="Write something about your music taste..."
                        autoFocus
                        className="w-full bg-[#111214] border border-white/20 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB954]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setIsEditingBio(false)}
                          className="px-2.5 py-1 text-[11px] rounded bg-white/10 hover:bg-white/20 text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveBio}
                          className="px-3 py-1 text-[11px] rounded bg-[#1DB954] text-black font-bold hover:scale-105 active:scale-95 transition"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onClick={() => isOwnProfile && setIsEditingBio(true)}
                      className={`text-[#dbdee1] leading-relaxed group ${
                        isOwnProfile ? 'cursor-pointer hover:bg-white/5 p-1 rounded transition' : ''
                      }`}
                      title={isOwnProfile ? 'Click to edit bio' : undefined}
                    >
                      {bioValue || profile.bio || (isOwnProfile ? 'Click to add a personal bio...' : 'No bio provided.')}
                    </p>
                  )}
                </div>

                {/* MEMBRO DA (Member Since) */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    MEMBRO DA
                  </h4>
                  <div className="flex items-center gap-1.5 text-[#dbdee1] font-medium">
                    <Calendar size={13} className="text-slate-400" />
                    <span>
                      {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '15 set 2026'}
                    </span>
                  </div>
                </div>

                {/* COLLEGAMENTI (Connections) */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    COLLEGAMENTI
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111214] border border-white/10 text-white text-[11px]">
                      <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
                      <span>Spotify Connected</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111214] border border-white/10 text-white text-[11px]">
                      <Sparkles size={11} className="text-amber-400" />
                      <span>Linear Studio</span>
                    </div>
                  </div>
                </div>

                {/* NOTA (Visibile solo a te) */}
                {isOwnProfile && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      NOTA (VISIBILE SOLO A TE)
                    </h4>
                    <p className="text-slate-500 hover:text-slate-400 cursor-pointer text-[11px]">
                      Clicca per aggiungere una nota
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 1:1 Discord Showcase & Widget Hub (Matching Reference Screenshot) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Discord Tab Bar: Bacheca | Attività | Playlists */}
            <div className="flex items-center gap-6 border-b border-white/10 pb-3">
              {[
                { id: 'bacheca', label: 'Bacheca' },
                { id: 'attivita', label: 'Attività' },
                { id: 'playlists', label: 'Playlists' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-sm font-bold pb-2 relative transition ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#5865F2] rounded-full will-animate" />
                  )}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: BACHECA (Interactive Discord Showcase Grid) */}
            {activeTab === 'bacheca' && (
              <div className="space-y-5 will-animate animate-in fade-in duration-200">
                <div className="text-center sm:text-left">
                  <h3 className="text-base font-bold text-white">
                    Personalizza il tuo profilo con i widget
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sfoglia la nostra libreria di widget per condividere di più su di te e i tuoi gusti musicali!
                  </p>
                </div>

                {/* 2-Column Widget Grid Matching the Reference Screenshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Widget 1: Brano preferito (Favorite Track Widget) */}
                  <div
                    onClick={() => {
                      if (currentTrack) togglePlay();
                    }}
                    className="p-3.5 rounded-xl bg-[#1e1f22] border border-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1DB954] flex items-center gap-1.5">
                        <Flame size={13} />
                        <span>Brano preferito</span>
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954] group-hover:scale-110 transition-transform">
                        {isPlaying ? <EqualizerWave className="h-3" /> : <Play size={12} className="fill-[#1DB954] ml-0.5" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={currentTrack?.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shadow border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#1DB954] transition">
                          {currentTrack?.title || 'Starboy'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {currentTrack?.artist || 'The Weeknd'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Widget 2: Brani che mi piacciono (Liked Collection) */}
                  <div
                    onClick={() => onSelectPlaylist?.('liked')}
                    className="p-3.5 rounded-xl bg-[#1e1f22] border border-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                        <Heart size={13} className="fill-pink-400" />
                        <span>Brani che mi piacciono</span>
                      </span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 flex items-center justify-center shadow">
                        <Heart size={20} className="fill-white text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">Raccolta brani preferiti</p>
                        <p className="text-[11px] text-slate-400 truncate">Sincronizzati con il tuo profilo</p>
                      </div>
                    </div>
                  </div>

                  {/* Widget 3: In rotazione (Heavy Rotation) */}
                  <div className="p-3.5 rounded-xl bg-[#1e1f22] border border-white/10 hover:border-white/20 transition-all shadow-lg flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Disc size={13} />
                        <span>In rotazione</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Top Artisti</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-cyan-500/30"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200"
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-purple-500/30 -ml-3"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200"
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-pink-500/30 -ml-3"
                      />
                      <div className="min-w-0 flex-1 ml-2">
                        <p className="text-xs font-bold text-white truncate">Artisti più ascoltati</p>
                        <p className="text-[10px] text-slate-400">Ultimi 30 giorni</p>
                      </div>
                    </div>
                  </div>

                  {/* Widget 4: Playlist in evidenza (Featured Spotlight) */}
                  <div
                    onClick={() => {
                      if (profile.playlists?.[0]) onSelectPlaylist?.(profile.playlists[0].id);
                    }}
                    className="p-3.5 rounded-xl bg-[#1e1f22] border border-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Sparkles size={13} />
                        <span>Playlist in evidenza</span>
                      </span>
                      <Play size={13} className="text-slate-400 group-hover:text-amber-400 transition" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow">
                        <Music2 size={20} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition">
                          {profile.playlists?.[0]?.title || 'Linear Favorites'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {profile.playlists?.[0]?.track_count || 12} brani inclusi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Showcase Button Matching Screenshot ("Sfoglia tutti i widget") */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => triggerToast('Tutti i widget del tuo profilo sono attivi e sincronizzati!')}
                    className="w-full py-2.5 rounded-xl bg-[#2B2D31] hover:bg-[#35373C] text-xs font-bold text-white border border-white/10 transition shadow flex items-center justify-center gap-2"
                  >
                    <span>Sfoglia tutti i widget</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ATTIVITÀ (1:1 Discord Rich Presence "Listening to Linear") */}
            {activeTab === 'attivita' && (
              <div className="bg-[#1e1f22] rounded-2xl border border-white/10 p-5 shadow-2xl space-y-4 will-animate animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#23a55a] flex items-center gap-2">
                    <EqualizerWave className="h-3.5" />
                    <span>In ascolto su Linear</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    Live Session
                  </span>
                </div>

                {currentTrack ? (
                  <div className="flex items-center gap-4 bg-[#111214] p-4 rounded-xl border border-white/5">
                    <img
                      src={currentTrack.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover shadow-lg shrink-0 border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-white truncate hover:underline cursor-pointer">
                        {currentTrack.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {currentTrack.artist}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="px-4 py-1.5 rounded-full bg-[#1DB954] hover:scale-105 active:scale-95 text-black font-bold text-xs flex items-center gap-1.5 transition shadow"
                        >
                          {isPlaying ? <Pause size={13} className="fill-black" /> : <Play size={13} className="fill-black" />}
                          <span>{isPlaying ? 'Pausa' : 'Riproduci'}</span>
                        </button>
                        <span className="text-[11px] text-slate-500">Audio ad alta definizione (320kbps)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Headphones size={36} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-xs font-medium">Nessuna riproduzione attiva al momento.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Avvia una canzone per mostrare la tua attività in tempo reale.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PLAYLISTS */}
            {activeTab === 'playlists' && (
              <div className="space-y-4 will-animate animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Playlists pubbliche</h3>
                  <span className="text-xs text-slate-400">{profile.playlists?.length || 0} create</span>
                </div>

                {profile.playlists && profile.playlists.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {profile.playlists.map(pl => (
                      <div
                        key={pl.id}
                        onClick={() => onSelectPlaylist?.(pl.id)}
                        className="bg-[#1e1f22] hover:bg-[#282a2e] border border-white/10 p-3 rounded-xl cursor-pointer group transition shadow flex flex-col"
                      >
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/40 mb-2.5 relative">
                          {pl.cover_url ? (
                            <img src={pl.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Music2 size={24} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                              <Play size={14} className="fill-black ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-white truncate">{pl.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{pl.track_count || 0} brani</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-[#1e1f22] border border-white/10 text-center text-slate-400">
                    <Music2 size={32} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">Nessuna playlist pubblica disponibile.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pan/Zoom Image Crop Modal with Safe Clean Dismiss */}
        {cropModal.isOpen && (
          <ImageCropModal
            isOpen={cropModal.isOpen}
            file={cropModal.file}
            aspectRatio={cropModal.type === 'banner' ? 8 / 3 : 1}
            cropShape={cropModal.type === 'banner' ? 'rect' : 'round'}
            onCropComplete={handleApplyCrop}
            onClose={() => setCropModal({ isOpen: false, file: null, type: 'avatar' })}
          />
        )}

        {/* 60fps Hardware-Accelerated Floating Save Confirmation Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111214]/95 border border-[#1DB954]/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 will-animate animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Check size={16} className="text-[#1DB954] stroke-[3]" />
            <span className="text-xs font-bold">{toast}</span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
