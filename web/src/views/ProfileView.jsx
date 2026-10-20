import React, { useEffect, useState } from 'react';
import {
  User, Calendar, Edit3, Music2, Camera, Check, X,
  ShieldCheck, Sparkles, Award, Headphones
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ImageCropModal from '../components/Common/ImageCropModal';
import { ProfileHeaderSkeleton } from '../components/Common/SkeletonLoader';
import ColorPicker from '../components/Common/ColorPicker';

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
  const [bio, setBio] = useState('');
  const [accentColor, setAccentColor] = useState('#8B5CF6');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const targetUsername = username || currentUser?.username;
  const isOwnProfile = currentUser && currentUser.username?.toLowerCase() === targetUsername?.toLowerCase();

  useEffect(() => {
    if (!targetUsername) return;
    setLoading(true);
    api.get(`/users/profile/${targetUsername}`)
      .then(res => {
        setProfile(res.profile);
        setDisplayName(res.profile.display_name || '');
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
                  src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=audira'}
                  alt={profile.display_name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {/* Discord-style Online status dot */}
              <div
                title="Active on Audira"
                className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#10111B] shadow-md flex items-center justify-center"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{profile.display_name}</h1>
                {profile.is_verified && (
                  <span title="Verified Listener">
                    <ShieldCheck size={22} className="text-cyan-400 fill-cyan-400/20" />
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400">@{profile.username}</p>

              {/* Discord-Style Role Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                <span className="discord-badge">
                  <Headphones size={13} className="text-purple-400" />
                  <span>Listener</span>
                </span>
                <span className="discord-badge">
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Early Adopter</span>
                </span>
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
          <div className="w-full max-w-lg bg-audira-card border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden animation-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="font-black text-white text-base">Edit Public Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-bold text-slate-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#0D0E15] border border-audira-border rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

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
                  <label className="font-bold text-slate-400 block mb-1">Banner (8:3 • 1280×480 HD)</label>
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
