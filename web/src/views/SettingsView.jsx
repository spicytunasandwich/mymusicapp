import React, { useEffect, useState } from 'react';
import { Palette, LayoutGrid, Check, ArrowUp, ArrowDown, Sparkles, Volume2, Shield } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ACCENTS = [
  { name: 'Electric Violet', hex: '#8B5CF6' },
  { name: 'Cyber Cyan', hex: '#06B6D4' },
  { name: 'Neon Pink', hex: '#EC4899' },
  { name: 'Emerald Wave', hex: '#10B981' },
  { name: 'Solar Amber', hex: '#F59E0B' },
  { name: 'Royal Indigo', hex: '#6366F1' },
  { name: 'Crimson Rose', hex: '#F43F5E' },
  { name: 'Deep Purple', hex: '#7C3AED' }
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
  const [themeAccent, setThemeAccent] = useState('#8B5CF6');
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

  // Apply theme accent to document CSS variables immediately
  const applyAccentLive = (hex) => {
    setThemeAccent(hex);
    document.documentElement.style.setProperty('--audira-accent', hex);
    document.documentElement.style.setProperty('--primary-accent', hex);
    document.documentElement.style.setProperty('--audira-accent-glow', `${hex}59`);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/users/settings')
      .then(res => {
        if (res.settings) {
          const accent = res.settings.theme_accent || '#8B5CF6';
          applyAccentLive(accent);
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
        theme_mode: themeMode,
        home_widget_order: widgets,
        audio_quality: audioQuality
      });
      applyAccentLive(themeAccent);
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
          <p className="text-xs text-slate-400 mt-1">Customize your theme accents, widget ordering, and streaming fidelity.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs bg-audira-accent hover:opacity-90 text-white shadow-glow-accent transition self-start sm:self-auto"
        >
          {saving ? 'Saving...' : savedSuccess ? '✓ Saved!' : 'Save Preferences'}
        </button>
      </div>

      {/* Theme Accent Color Picker */}
      <section className="discord-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Palette size={18} className="text-purple-400" />
          <span>Primary Accent Color</span>
        </div>
        <p className="text-xs text-slate-400">
          Choose the signature highlight color used across play buttons, range sliders, and active tabs.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {ACCENTS.map(acc => {
            const isSelected = themeAccent === acc.hex;
            return (
              <button
                key={acc.hex}
                type="button"
                onClick={() => applyAccentLive(acc.hex)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-white/10 border-purple-400 text-white shadow-md'
                    : 'border-white/5 text-slate-300 hover:bg-white/5'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full shrink-0 shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: acc.hex }}
                />
                <span className="text-xs font-semibold truncate">{acc.name}</span>
                {isSelected && <Check size={16} className="ml-auto text-purple-400 shrink-0" />}
              </button>
            );
          })}
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
    </div>
  );
}
