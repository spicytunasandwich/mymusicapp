import React, { useEffect, useState } from 'react';
import { Palette, LayoutGrid, Check, ArrowUp, ArrowDown, Sparkles, Volume2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ACCENTS = [
  { name: 'Electric Violet', hex: '#8B5CF6' },
  { name: 'Cyber Cyan', hex: '#06B6D4' },
  { name: 'Neon Pink', hex: '#EC4899' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Solar Amber', hex: '#F59E0B' },
  { name: 'Deep Indigo', hex: '#6366F1' },
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

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/users/settings')
      .then(res => {
        if (res.settings) {
          setThemeAccent(res.settings.theme_accent || '#8B5CF6');
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
      document.documentElement.style.setProperty('--primary-accent', themeAccent);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-audira-border">
        <div>
          <h1 className="text-2xl font-black text-white">Appearance & Settings</h1>
          <p className="text-xs text-slate-400 mt-1">Customize themes, widget arrangement, and playback fidelity.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-900/40 hover:opacity-95 transition"
        >
          {saving ? 'Saving...' : savedSuccess ? '✓ Saved!' : 'Save Preferences'}
        </button>
      </div>

      {/* Theme Accent Color */}
      <section className="bg-audira-card/50 border border-audira-border p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Palette size={18} className="text-purple-400" />
          <span>Primary Accent Color</span>
        </div>
        <p className="text-xs text-slate-400">Choose the signature hue for controls, highlights, and active states.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {ACCENTS.map(acc => (
            <button
              key={acc.hex}
              onClick={() => setThemeAccent(acc.hex)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                themeAccent === acc.hex
                  ? 'bg-audira-hover border-purple-500 text-white shadow-md'
                  : 'border-audira-border text-slate-300 hover:bg-audira-hover/50'
              }`}
            >
              <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: acc.hex }} />
              <span className="text-xs font-semibold truncate">{acc.name}</span>
              {themeAccent === acc.hex && <Check size={16} className="ml-auto text-purple-400" />}
            </button>
          ))}
        </div>
      </section>

      {/* Theme Background Mode */}
      <section className="bg-audira-card/50 border border-audira-border p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Sparkles size={18} className="text-cyan-400" />
          <span>Display Mode</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'dark', label: 'Dark (Default)', desc: '#0B0C14 Deep Midnight' },
            { id: 'amoled', label: 'AMOLED Black', desc: '#000000 OLED True Black' },
            { id: 'light', label: 'Light Mode', desc: 'Clean high contrast' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setThemeMode(mode.id)}
              className={`p-4 rounded-xl border text-left transition ${
                themeMode === mode.id
                  ? 'border-cyan-400 bg-cyan-950/20 text-white'
                  : 'border-audira-border text-slate-400 hover:bg-audira-hover/40'
              }`}
            >
              <p className="text-xs font-bold text-white">{mode.label}</p>
              <p className="text-[10px] text-slate-400 mt-1">{mode.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Reorder Home Feed Widgets */}
      <section className="bg-audira-card/50 border border-audira-border p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <LayoutGrid size={18} className="text-pink-400" />
          <span>Reorder Home Screen Widgets</span>
        </div>
        <p className="text-xs text-slate-400">Use the arrows to rearrange the layout order of your home feed.</p>

        <div className="space-y-2 pt-2">
          {widgets.map((widgetKey, idx) => (
            <div
              key={widgetKey}
              className="flex items-center justify-between p-3.5 bg-[#0D0E15] border border-audira-border rounded-xl"
            >
              <span className="text-xs font-bold text-slate-200">
                {idx + 1}. {WIDGET_LABELS[widgetKey] || widgetKey}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => moveWidget(idx, -1)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-audira-hover disabled:opacity-30 transition"
                  title="Move Up"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  disabled={idx === widgets.length - 1}
                  onClick={() => moveWidget(idx, 1)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-audira-hover disabled:opacity-30 transition"
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
      <section className="bg-audira-card/50 border border-audira-border p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Volume2 size={18} className="text-emerald-400" />
          <span>Audio Streaming Quality</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'standard', label: 'Standard', desc: '160 kbps (Data saver)' },
            { id: 'high', label: 'High', desc: '320 kbps (Rich detail)' },
            { id: 'lossless', label: 'Lossless Hi-Fi', desc: 'FLAC original master' }
          ].map(q => (
            <button
              key={q.id}
              onClick={() => setAudioQuality(q.id)}
              className={`p-4 rounded-xl border text-left transition ${
                audioQuality === q.id
                  ? 'border-emerald-400 bg-emerald-950/20 text-white'
                  : 'border-audira-border text-slate-400 hover:bg-audira-hover/40'
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
