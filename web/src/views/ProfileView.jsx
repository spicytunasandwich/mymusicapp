import React, { useEffect, useState } from 'react';
import { User, Calendar, Edit3, Music2, Camera, Check, X, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ACCENTS = ['#7C3AED', '#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'];

export default function ProfileView({ username, onSelectPlaylist }) {
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [accentColor, setAccentColor] = useState('#7C3AED');
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
        setAccentColor(res.profile.accent_color || '#7C3AED');
        setAvatarUrl(res.profile.avatar_url || '');
        setBannerUrl(res.profile.banner_url || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetUsername]);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setUploadError('Invalid format. Please upload a PNG, JPG, WebP, or GIF image.');
      return;
    }

    // 8 MB max size check
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size exceeds the 8 MB limit. Please select a smaller file.');
      return;
    }

    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingBanner(true);

    try {
      // For GIFs, we send the original untouched binary stream to preserve all animated frames
      const formData = new FormData();
      formData.append('image', file);

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
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Discord-Style Profile Banner & Avatar */}
      <div className="relative rounded-3xl overflow-hidden border border-audira-border bg-audira-card shadow-2xl">
        {/* Banner Area */}
        <div
          className="h-52 w-full bg-cover bg-center relative transition-colors duration-300"
          style={{
            backgroundColor: profile.accent_color || '#7C3AED',
            backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined
          }}
        >
          {isOwnProfile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-xs font-bold text-white border border-white/20 transition shadow-lg"
            >
              <Edit3 size={14} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Card Overlay */}
        <div className="px-8 pb-8 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            {/* Avatar with Custom Discord Accent Ring */}
            <div
              className="w-32 h-32 rounded-3xl overflow-hidden p-1 bg-[#0B0C14] shadow-2xl flex-shrink-0"
              style={{ border: `3px solid ${profile.accent_color || '#7C3AED'}` }}
            >
              <img
                src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=audira'}
                alt={profile.display_name}
                className="w-full h-full object-cover rounded-[20px]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-white">{profile.display_name}</h1>
                {profile.is_verified && (
                  <span title="Verified Listener"><ShieldCheck size={20} className="text-cyan-400 fill-cyan-400/20" /></span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400">@{profile.username}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-[11px] text-slate-500 pt-1">
                <Calendar size={13} />
                <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="px-8 pb-6 pt-2 border-t border-audira-border/50 text-xs text-slate-300 leading-relaxed max-w-2xl">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">About Me</p>
            {profile.bio}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-audira-card border border-audira-border rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-audira-border">
              <h3 className="font-black text-white text-base">Edit Public Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-bold text-slate-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#0D0E15] border border-audira-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 block mb-1">About Me (Bio)</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell listeners what you are vibing to..."
                  className="w-full bg-[#0D0E15] border border-audira-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 block mb-1.5">Profile Accent Color</label>
                <div className="flex items-center gap-2">
                  {ACCENTS.map(hex => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setAccentColor(hex)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition shadow-md"
                      style={{ backgroundColor: hex }}
                    >
                      {accentColor === hex && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-medium">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Upload Avatar (GIF, PNG, JPG, WebP)</label>
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-audira-hover border border-audira-border hover:border-purple-500 transition text-slate-300">
                    <Camera size={14} />
                    <span>{uploadingAvatar ? 'Uploading...' : 'Choose file'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={uploadingAvatar}
                      onChange={(e) => handleImageUpload(e, 'avatar')}
                      className="hidden"
                    />
                  </label>
                  {avatarUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={avatarUrl} alt="Avatar Preview" className="w-8 h-8 rounded-full object-cover border border-purple-500" />
                      <span className="text-[10px] text-emerald-400 font-semibold">Avatar Ready</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Upload Banner (GIF, PNG, JPG, WebP)</label>
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-audira-hover border border-audira-border hover:border-purple-500 transition text-slate-300">
                    <Camera size={14} />
                    <span>{uploadingBanner ? 'Uploading...' : 'Choose file'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={uploadingBanner}
                      onChange={(e) => handleImageUpload(e, 'banner')}
                      className="hidden"
                    />
                  </label>
                  {bannerUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-12 h-5 rounded overflow-hidden border border-purple-500 bg-cover bg-center" style={{ backgroundImage: `url(${bannerUrl})` }} />
                      <span className="text-[10px] text-emerald-400 font-semibold">Banner Ready</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-audira-border mt-4">
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
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold shadow-lg shadow-purple-900/40 hover:opacity-95 transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                className="bg-audira-card/40 hover:bg-audira-card p-3 rounded-2xl border border-audira-border transition cursor-pointer"
              >
                <img src={pl.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500'} alt={pl.title} className="w-full aspect-square rounded-xl object-cover mb-2" />
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
