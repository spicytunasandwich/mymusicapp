import React, { useEffect, useState } from 'react';
import {
  User, Calendar, Edit3, Music2, Camera, Check, X,
  ShieldCheck, Sparkles, Award, Headphones, Moon, Heart
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ImageCropModal from '../components/Common/ImageCropModal';
import { ProfileHeaderSkeleton } from '../components/Common/SkeletonLoader';
import ColorPicker from '../components/Common/ColorPicker';
import FontPicker from '../components/Common/FontPicker';
import EqualizerWave from '../components/Common/EqualizerWave';
import { usePresence } from '../context/PresenceContext';

const BADGE_ICONS = {
  early_adopter: { icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  old_listener: { icon: Headphones, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  playlist_maker: { icon: Music2, color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/30' },
  night_owl: { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/30' },
  sound_collector: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/30' },
  verified_pioneer: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' }
};

const ACCENTS = [
  '#8B5CF6', '#7C3AED', '#3B82F6', '#06B6D4',
  '#10B981', '#F59E0B', '#EC4899', '#EF4444'
];

export default function ProfileView({ username, onSelectPlaylist }) {
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Crop / Preview state
  const [cropModal, setCropModal] = useState({ isOpen: false, file: null, type: 'avatar' });

  // Edit fields
  const [displayName, setDisplayName] = useState('');
  const [displayNameFont, setDisplayNameFont] = useState('Plus Jakarta Sans');
  const [bio, setBio] = useState('');
  const [accentColor, setAccentColor] = useState('#8B5CF6');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const targetUsername = username || currentUser?.username;
  const isOwnProfile = currentUser && currentUser.username?.toLowerCase() === targetUsername?.toLowerCase();
  const { getPresence, showActivity, toggleActivityPrivacy } = usePresence();
  const presence = getPresence(targetUsername);

  useEffect(() => {
    if (!targetUsername) return;
    setLoading(true);
    api.get(`/users/profile/${targetUsername}`)
      .then(res => {
        setProfile(res.profile);
        setDisplayName(res.profile.display_name || '');
        setDisplayNameFont(res.profile.display_name_font || 'Plus Jakarta Sans');
        setBio(res.profile.bio || '');
        setAccentColor(res.profile.accent_color || '#8B5CF6');
        setAvatarUrl(res.profile.avatar_url || '');
        setBannerUrl(res.profile.banner_url || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetUsername]);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleSelectFile = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setUploadError('Invalid format. Please select a PNG, JPG, WebP, or GIF image.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size exceeds the 8 MB limit. Please select a smaller file.');
      return;
    }

    setCropModal({ isOpen: true, file, type });
    e.target.value = '';
  };

  const handleApplyCrop = async (croppedFile) => {
    const type = cropModal.type;
    setCropModal({ isOpen: false, file: null, type: 'avatar' });

    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append('image', croppedFile);

      const res = await api.post('/users/upload', formData);
      if (type === 'avatar') setAvatarUrl(res.url);
      else setBannerUrl(res.url);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/users/profile', {
        display_name: displayName,
        display_name_font: displayNameFont,
        bio,
        accent_color: accentColor,
        avatar_url: avatarUrl,
        banner_url: bannerUrl
      });
      setProfile(prev => ({ ...prev, ...res.user }));
      updateUser(res.user);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
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

  const effectiveAccent = profile.accent_color || '#8B5CF6';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Discord-Inspired Profile Card Container */}
      <div className="discord-card overflow-hidden shadow-2xl relative">
        {/* Banner Area (8:3 Ratio) */}
        <div
          className="w-full aspect-[8/3] max-h-64 bg-cover bg-center relative transition-all duration-300"
          style={{
            backgroundColor: effectiveAccent,
            backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined
          }}
        >
          {/* Subtle gradient vignette over banner */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#10111B]/80 via-transparent to-transparent pointer-events-none" />

          {isOwnProfile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-xs font-bold text-white border border-white/20 transition shadow-lg hover:scale-105 active:scale-95"
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Profile Card Header with Discord Squircle & Badges */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Avatar with Discord Accent Border + Online Presence Indicator */}
            <div className="relative shrink-0">
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden p-[3px] bg-[#10111B] shadow-2xl transition-transform hover:scale-105"
                style={{ border: `3.5px solid ${effectiveAccent}` }}
              >
                <img
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username || 'audira'}`}
                  alt={profile.display_name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username || 'audira'}`;
                  }}
                />
              </div>
              {/* Real-time Presence status dot (Online / Idle / Offline) */}
              <div
                title={presence.status === 'online' ? 'Online on Linear' : presence.status === 'idle' ? 'Idle' : 'Offline'}
                className={`absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-6 h-6 rounded-full border-4 border-[#10111B] shadow-md flex items-center justify-center transition-colors ${
                  presence.status === 'online' ? 'bg-emerald-500' : presence.status === 'idle' ? 'bg-amber-400' : 'bg-slate-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1
                  className="text-2xl sm:text-3xl font-black text-white transition-all"
                  style={{ fontFamily: profile.display_name_font || 'Plus Jakarta Sans' }}
                >
                  {profile.display_name}
                </h1>
                {profile.is_verified && (
                  <span title="Verified Listener">
                    <ShieldCheck size={22} className="text-cyan-400 fill-cyan-400/20" />
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400">@{profile.username}</p>

              {/* Real-time "Listening to X" Card */}
              {presence.currentTrack && (
                <div className="pt-1">
                  <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-md max-w-full">
                    <img
                      src={presence.currentTrack.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover shadow shrink-0"
                    />
                    <div className="text-left min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-audira-accent tracking-wider">
                        <EqualizerWave className="h-2.5" />
                        <span>Listening to</span>
                      </div>
                      <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                        {presence.currentTrack.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        {presence.currentTrack.artist}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Badges Row (replaces tags with interactive icon badges & tooltips) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
                {(profile.badges && profile.badges.length > 0 ? profile.badges : [
                  { badge_key: 'early_adopter', badge_name: 'Early Adopter', description: 'Joined Audira during platform launch.', icon: 'Sparkles' },
                  { badge_key: 'old_listener', badge_name: 'Old Listener', description: 'Active community member with listening history.', icon: 'Headphones' }
                ]).map((badge) => {
                  const meta = BADGE_ICONS[badge.badge_key] || {
                    icon: Award,
                    color: 'text-purple-400',
                    bg: 'bg-purple-400/10 border-purple-400/30'
                  };
                  const IconComp = meta.icon;

                  return (
                    <div key={badge.badge_key} className="relative group">
                      <div
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-115 hover:shadow-lg ${meta.bg}`}
                        tabIndex={0}
                        aria-label={badge.badge_name}
                      >
                        <IconComp size={15} className={meta.color} />
                      </div>

                      {/* Discord/Steam Style Glass Tooltip on Hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none transition-all duration-150">
                        <div className="bg-[#121320]/95 backdrop-blur-md border border-white/15 px-3 py-2 rounded-xl shadow-2xl text-center min-w-[150px] max-w-[220px]">
                          <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <IconComp size={13} className={meta.color} />
                            <span className="text-white text-xs font-black">{badge.badge_name}</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            {badge.description}
                          </p>
                          <div className="mt-1 pt-1 border-t border-white/10 text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                            Activity Badge
                          </div>
                        </div>
                        {/* Tooltip caret */}
                        <div className="w-2 h-2 bg-[#121320] border-r border-b border-white/15 rotate-45 -mt-1" />
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-2">
                  <Calendar size={13} />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Card Section */}
        {profile.bio && (
          <div className="px-6 sm:px-8 pb-6 pt-3 border-t border-white/5 text-xs text-slate-300 leading-relaxed max-w-2xl">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">About Me</p>
            <div className="p-3.5 rounded-xl bg-audira-card/60 border border-white/5 whitespace-pre-line">
              {profile.bio}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-audira-card border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden animation-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <h3 className="font-black text-white text-base">Edit Public Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 text-xs overflow-y-auto pr-1 flex-1">
              <div>
                <label className="font-bold text-slate-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#0D0E15] border border-audira-border rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-bold"
                  style={{ fontFamily: displayNameFont }}
                />
              </div>

              {/* Locally Bundled Curated Font Picker */}
              <FontPicker
                selectedFont={displayNameFont}
                onSelectFont={setDisplayNameFont}
                previewText={displayName || profile?.display_name}
              />

              <div>
                <label className="font-bold text-slate-400 block mb-1">About Me (Bio)</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell listeners what you are vibing to..."
                  className="w-full bg-[#0D0E15] border border-audira-border rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Listening Activity Privacy Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0E15] border border-audira-border">
                <div>
                  <span className="font-bold text-white text-xs block">Broadcast Listening Activity</span>
                  <span className="text-[10px] text-slate-400">Display "Listening to [Song]" in real-time on your profile</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActivityPrivacy(!showActivity)}
                  className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                    showActivity ? 'bg-audira-accent justify-end' : 'bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div>
                <ColorPicker
                  color={accentColor}
                  onChange={setAccentColor}
                  label="Profile Accent Color"
                />
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-medium">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Avatar (1:1 • 512×512 HD)</label>
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-audira-hover border border-audira-border hover:border-purple-500 transition text-slate-300">
                    <Camera size={14} />
                    <span>{uploadingAvatar ? 'Uploading...' : 'Choose image'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={uploadingAvatar}
                      onChange={(e) => handleSelectFile(e, 'avatar')}
                      className="hidden"
                    />
                  </label>
                  {avatarUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={avatarUrl} alt="Avatar Preview" className="w-8 h-8 rounded-full object-cover border border-purple-500" />
                      <span className="text-[10px] text-emerald-400 font-semibold">Ready (512×512)</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Banner (8:3 • 1920×720 Ultra HD)</label>
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-audira-hover border border-audira-border hover:border-purple-500 transition text-slate-300">
                    <Camera size={14} />
                    <span>{uploadingBanner ? 'Uploading...' : 'Choose image'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={uploadingBanner}
                      onChange={(e) => handleSelectFile(e, 'banner')}
                      className="hidden"
                    />
                  </label>
                  {bannerUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-12 h-5 rounded overflow-hidden border border-purple-500 bg-cover bg-center" style={{ backgroundImage: `url(${bannerUrl})` }} />
                      <span className="text-[10px] text-emerald-400 font-semibold">Ready (1280×480)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-audira-accent hover:opacity-90 text-white font-bold shadow-glow-accent transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Crop & Retina Preview Modal */}
      <ImageCropModal
        isOpen={cropModal.isOpen}
        imageFile={cropModal.file}
        cropType={cropModal.type}
        onClose={() => setCropModal({ isOpen: false, file: null, type: 'avatar' })}
        onApply={handleApplyCrop}
      />

      {/* Public Playlists Showcase */}
      {profile.playlists?.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
            <Music2 size={18} className="text-purple-400" />
            Public Playlists ({profile.playlists.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profile.playlists.map(pl => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist?.(pl.id)}
                className="spotify-card p-3 rounded-2xl cursor-pointer"
              >
                <img
                  src={pl.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500'}
                  alt={pl.title}
                  className="w-full aspect-square rounded-xl object-cover mb-2"
                />
                <h4 className="text-xs font-bold text-white truncate">{pl.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{pl.track_count || 0} tracks</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
