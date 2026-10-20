import React, { useEffect, useState } from 'react';
import { Palette, LayoutGrid, Check, ArrowUp, ArrowDown, Sparkles, Volume2, Shield, Sliders, Music, Radio, Key, LogOut } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import ColorPicker from '../components/Common/ColorPicker';

export const ACCENTS = [
  { name: 'Spotify Green', hex: '#1DB954', gradient: 'rgba(29, 185, 84, 0.20)' },
  { name: 'Electric Purple', hex: '#8B5CF6', gradient: 'rgba(139, 92, 246, 0.22)' },
  { name: 'Cobalt Blue', hex: '#3B82F6', gradient: 'rgba(59, 130, 246, 0.20)' },
  { name: 'Vivid Red', hex: '#EF4444', gradient: 'rgba(239, 68, 68, 0.20)' },
  { name: 'Amber Yellow', hex: '#F59E0B', gradient: 'rgba(245, 158, 11, 0.20)' }
];

const WIDGET_LABELS = {
  recently_played: 'Recently Played History',
  featured_playlists: 'Featured Playlists Carousel',
  top_mixes: 'Top Songs of the Day',
  recommended_artists: 'Popular & Recommended Artists',
  new_releases: 'New Release Albums'
};

export default function SettingsView() {
  const { isAuthenticated, openAuth } = useAuth();
  const {
    spotifyToken,
    spotifyUser,
    isSpotifyReady,
    isSpotifyPremium,
    connectSpotify,
    disconnectSpotify
  } = usePlayer();
  const [inputToken, setInputToken] = useState(spotifyToken || '');
  const [themeAccent, setThemeAccent] = useState('#1DB954');
  const [gradientTop, setGradientTop] = useState('#1A2E22');
  const [gradientBottom, setGradientBottom] = useState('#121212');
  const [activeStop, setActiveStop] = useState('accent'); // 'accent' | 'top' | 'bottom'
  const [themeMode, setThemeMode] = useState('dark');
  const [audioQuality, setAudioQuality] = useState('high');
  const [widgets, setWidgets] = useState([
    'recently_played',
    'featured_playlists',
    'top_mixes',
    'recommended_artists',
    'new_releases'
  ]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Apply theme accent & gradient stops to document CSS variables immediately
  const applyAccentLive = (hex, grad) => {
    setThemeAccent(hex);
    const topGrad = grad || `${hex}33`;
    document.documentElement.style.setProperty('--audira-accent', hex);
    document.documentElement.style.setProperty('--primary-accent', hex);
    document.documentElement.style.setProperty('--audira-accent-glow', `${hex}59`);
    document.documentElement.style.setProperty('--audira-gradient-top', topGrad);
    localStorage.setItem('audira_theme_accent', hex);
    localStorage.setItem('audira_gradient_top', topGrad);
  };

  const applyGradientLive = (top, bottom) => {
    setGradientTop(top);
    setGradientBottom(bottom);
    document.documentElement.style.setProperty('--audira-gradient-top', top);
    document.documentElement.style.setProperty('--audira-gradient-bottom', bottom);
    document.documentElement.style.setProperty(
      '--audira-bg-gradient',
      `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`
    );
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/users/settings')
      .then(res => {
        if (res.settings) {
          const accent = res.settings.theme_accent || '#8B5CF6';
          applyAccentLive(accent);
          const top = res.settings.gradient_top || '#1A102E';
          const bottom = res.settings.gradient_bottom || '#08090E';
          applyGradientLive(top, bottom);
          setThemeMode(res.settings.theme_mode || 'dark');
          setAudioQuality(res.settings.audio_quality || 'high');
          if (Array.isArray(res.settings.home_widget_order)) {
            setWidgets(res.settings.home_widget_order);
          }
        }
      })
      .catch(console.error);
  }, [isAuthenticated]);

  const moveWidget = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= widgets.length) return;
    const updated = [...widgets];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);
    setWidgets(updated);
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.patch('/users/settings', {
        theme_accent: themeAccent,
        gradient_top: gradientTop,
        gradient_bottom: gradientBottom,
        theme_mode: themeMode,
        home_widget_order: widgets,
        audio_quality: audioQuality
      });
      applyAccentLive(themeAccent);
      applyGradientLive(gradientTop, gradientBottom);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Settings Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Appearance & Settings</h1>
          <p className="text-xs text-slate-400 mt-1">Customize your themes, gradient stops, and streaming fidelity.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs bg-audira-accent hover:opacity-90 text-white shadow-glow-accent transition self-start sm:self-auto"
        >
          {saving ? 'Saving...' : savedSuccess ? '✓ Saved!' : 'Save Preferences'}
        </button>
      </div>

      {/* Theme Accent & Vertical Gradient Designer */}
      <section className="discord-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Palette size={18} className="text-purple-400" />
            <span>Theme Colors & Vertical Gradient</span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveStop('accent')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeStop === 'accent' ? 'bg-audira-accent text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Accent
            </button>
            <button
              type="button"
              onClick={() => setActiveStop('top')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeStop === 'top' ? 'bg-audira-accent text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gradient Top
            </button>
            <button
              type="button"
              onClick={() => setActiveStop('bottom')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeStop === 'bottom' ? 'bg-audira-accent text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gradient Bottom
            </button>
          </div>
        </div>

        {/* 5 Signature Theme Presets */}
        <div>
          <p className="text-xs font-bold text-slate-400 mb-2">Signature Color Accents</p>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENTS.map((item) => (
              <button
                key={item.hex}
                type="button"
                onClick={() => applyAccentLive(item.hex, item.gradient)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                  themeAccent.toLowerCase() === item.hex.toLowerCase()
                    ? 'border-white text-white shadow-lg scale-105'
                    : 'border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                }`}
                style={{
                  backgroundColor: themeAccent.toLowerCase() === item.hex.toLowerCase() ? item.gradient : '#121212'
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.hex }} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Discord-style Dual Stop Preview Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: 2D Drag Ball Color Picker */}
          <div>
            {activeStop === 'accent' && (
              <ColorPicker
                color={themeAccent}
                onChange={applyAccentLive}
                label="Primary Accent (Play buttons, Sliders, Badges)"
              />
            )}
            {activeStop === 'top' && (
              <ColorPicker
                color={gradientTop}
                onChange={(hex) => applyGradientLive(hex, gradientBottom)}
                label="Gradient Top Stop Color"
              />
            )}
            {activeStop === 'bottom' && (
              <ColorPicker
                color={gradientBottom}
                onChange={(hex) => applyGradientLive(gradientTop, hex)}
                label="Gradient Bottom Stop Color"
              />
            )}
          </div>

          {/* Right: Live Gradient Preview Container */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400">Live Vertical Gradient Preview</p>
            <div
              className="w-full h-44 rounded-2xl border border-white/10 relative p-4 flex flex-col justify-between shadow-2xl transition-all duration-300"
              style={{
                background: `linear-gradient(180deg, ${gradientTop} 0%, ${gradientBottom} 100%)`
              }}
            >
              {/* Top Handle */}
              <button
                type="button"
                onClick={() => setActiveStop('top')}
                className={`self-center px-3 py-1 rounded-full text-[11px] font-bold border transition shadow-lg ${
                  activeStop === 'top'
                    ? 'border-white text-white ring-2 ring-white/50 scale-105'
                    : 'border-white/30 text-white/80 hover:border-white'
                }`}
                style={{ backgroundColor: gradientTop }}
              >
                Top Stop: {gradientTop}
              </button>

              {/* Accent Button Preview */}
              <div className="self-center flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStop('accent')}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg transition hover:scale-105"
                  style={{ backgroundColor: themeAccent }}
                >
                  Accent Color: {themeAccent}
                </button>
              </div>

              {/* Bottom Handle */}
              <button
                type="button"
                onClick={() => setActiveStop('bottom')}
                className={`self-center px-3 py-1 rounded-full text-[11px] font-bold border transition shadow-lg ${
                  activeStop === 'bottom'
                    ? 'border-white text-white ring-2 ring-white/50 scale-105'
                    : 'border-white/30 text-white/80 hover:border-white'
                }`}
                style={{ backgroundColor: gradientBottom }}
              >
                Bottom Stop: {gradientBottom}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Dragging the ball or pasting a hex code recolors the entire platform background in real time.
            </p>
          </div>
        </div>
      </section>

      {/* Theme Background Mode */}
      <section className="discord-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Sparkles size={18} className="text-cyan-400" />
          <span>Display Mode</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'dark', label: 'Dark Midnight', desc: '#08090E Audira Charcoal' },
            { id: 'amoled', label: 'AMOLED Black', desc: '#000000 True OLED Black' },
            { id: 'glass', label: 'Frosted Glass', desc: 'Backdrop blur & glass panels' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setThemeMode(mode.id)}
              className={`p-4 rounded-xl border text-left transition ${
                themeMode === mode.id
                  ? 'border-cyan-400 bg-cyan-950/20 text-white'
                  : 'border-white/5 text-slate-400 hover:bg-white/5'
              }`}
            >
              <p className="text-xs font-bold text-white">{mode.label}</p>
              <p className="text-[10px] text-slate-400 mt-1">{mode.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Reorder Home Feed Widgets */}
      <section className="discord-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <LayoutGrid size={18} className="text-pink-400" />
          <span>Reorder Home Screen Sections</span>
        </div>
        <p className="text-xs text-slate-400">Use the arrows to adjust the layout arrangement of your home feed.</p>

        <div className="space-y-2 pt-2">
          {widgets.map((widgetKey, idx) => (
            <div
              key={widgetKey}
              className="flex items-center justify-between p-3.5 bg-audira-card/50 border border-white/5 rounded-xl"
            >
              <span className="text-xs font-bold text-slate-200">
                {idx + 1}. {WIDGET_LABELS[widgetKey] || widgetKey}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => moveWidget(idx, -1)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
                  title="Move Up"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  disabled={idx === widgets.length - 1}
                  onClick={() => moveWidget(idx, 1)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
                  title="Move Down"
                >
                  <ArrowDown size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Audio Streaming Quality */}
      <section className="discord-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Volume2 size={18} className="text-emerald-400" />
          <span>Audio Streaming Quality</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'standard', label: 'Standard', desc: '160 kbps (Data saver)' },
            { id: 'high', label: 'High Quality', desc: '320 kbps (Rich detail)' },
            { id: 'lossless', label: 'Lossless Hi-Fi', desc: 'FLAC original master' }
          ].map(q => (
            <button
              key={q.id}
              onClick={() => setAudioQuality(q.id)}
              className={`p-4 rounded-xl border text-left transition ${
                audioQuality === q.id
                  ? 'border-emerald-400 bg-emerald-950/20 text-white'
                  : 'border-white/5 text-slate-400 hover:bg-white/5'
              }`}
            >
              <p className="text-xs font-bold text-white">{q.label}</p>
              <p className="text-[10px] text-slate-400 mt-1">{q.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Spotify Web Playback SDK Integration */}
      <section className="discord-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Radio size={18} className="text-[#1DB954]" />
            <span>Spotify Web Playback SDK (Direct HD Streaming)</span>
          </div>
          {spotifyToken && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              isSpotifyPremium ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isSpotifyPremium ? 'Spotify Premium ✅' : 'Free Account (30s Previews)'}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Connect your Spotify Premium listener account to stream full tracks at 320kbps CD quality directly inside Linear through the official Spotify Web Playback SDK. Uploaded/matched local songs take priority, while imported Spotify tracks play seamlessly with album art.
        </p>

        {spotifyToken ? (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {spotifyUser?.images?.[0]?.url ? (
                <img src={spotifyUser.images[0].url} alt="" className="w-10 h-10 rounded-full object-cover border border-[#1DB954]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954] font-bold text-sm">
                  SP
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-white">
                  Connected as <span className="text-[#1DB954]">{spotifyUser?.display_name || 'Spotify Listener'}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  {isSpotifyPremium ? 'Full 320kbps Web Playback Active' : 'Premium required for full playback (playing previews)'}
                </p>
              </div>
            </div>

            <button
              onClick={disconnectSpotify}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold transition w-full sm:w-auto justify-center"
            >
              <LogOut size={14} />
              <span>Disconnect</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Paste your Spotify OAuth User Access Token..."
                className="w-full bg-[#0D0E15] border border-audira-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#1DB954]"
              />
              <button
                onClick={() => connectSpotify(inputToken)}
                disabled={!inputToken.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-40 text-black font-bold text-xs uppercase tracking-wider shrink-0 transition"
              >
                Connect
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Need a token? Generate an OAuth token with <code>streaming user-read-email user-read-private</code> permissions via Spotify Developer Dashboard.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
