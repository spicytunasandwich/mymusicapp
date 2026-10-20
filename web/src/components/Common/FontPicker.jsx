import React, { useState } from 'react';
import { Type, Check, ChevronDown } from 'lucide-react';

export const BUNDLED_FONTS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta', category: 'Modern Clean' },
  { id: 'Orbitron', name: 'Orbitron', category: 'Cyberpunk Sci-Fi' },
  { id: 'Cinzel', name: 'Cinzel', category: 'Cinematic Serif' },
  { id: 'Syne', name: 'Syne', category: 'Avant-Garde Display' },
  { id: 'Bungee', name: 'Bungee', category: 'Arcade Punch' },
  { id: 'Righteous', name: 'Righteous', category: '80s Synthwave' },
  { id: 'Press Start 2P', name: 'Press Start 2P', category: '8-bit Pixel Retro' },
  { id: 'Pacifico', name: 'Pacifico', category: 'Flowing Script' },
  { id: 'Lobster', name: 'Lobster', category: 'Vintage Script' },
  { id: 'Monoton', name: 'Monoton', category: 'Retro Neon Tubes' },
  { id: 'Audiowide', name: 'Audiowide', category: 'Techno Space' },
  { id: 'Russo One', name: 'Russo One', category: 'Bold Impact Poster' },
  { id: 'Anton', name: 'Anton', category: 'Ultra Condensed' },
  { id: 'VT323', name: 'VT323', category: 'Terminal CRT' },
  { id: 'Creepster', name: 'Creepster', category: 'Edgy Rock' },
];

export default function FontPicker({
  selectedFont = 'Plus Jakarta Sans',
  onSelectFont,
  previewText = 'Audira Sound'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeFont = BUNDLED_FONTS.find(f => f.id === selectedFont) || BUNDLED_FONTS[0];

  return (
    <div className="space-y-1.5">
      <label className="font-bold text-slate-400 block mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Type size={14} className="text-purple-400" />
          <span>Display Name Font</span>
        </span>
        <span className="text-[10px] text-purple-400 font-normal">Bundled locally</span>
      </label>

      {/* Selected Font Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0D0E15] border border-audira-border hover:border-purple-500/60 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between transition group shadow-sm"
      >
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-purple-300" style={{ fontFamily: activeFont.id }}>Ag</span>
          </div>
          <div className="truncate">
            <span className="text-white text-sm font-bold block truncate" style={{ fontFamily: activeFont.id }}>
              {previewText || activeFont.name}
            </span>
            <span className="text-[10px] text-slate-400">{activeFont.name} • {activeFont.category}</span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <div className="p-2 bg-[#0A0B12] border border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto space-y-1.5 mt-1">
          {BUNDLED_FONTS.map(font => {
            const isSelected = (selectedFont || 'Plus Jakarta Sans') === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => {
                  onSelectFont(font.id);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition ${
                  isSelected
                    ? 'bg-purple-600/20 border border-purple-500/50 text-white'
                    : 'hover:bg-white/5 border border-transparent text-slate-300'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div
                    className="text-sm font-bold text-white truncate"
                    style={{ fontFamily: font.id }}
                  >
                    {previewText || font.name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium text-slate-300">{font.name}</span>
                    <span>•</span>
                    <span>{font.category}</span>
                  </div>
                </div>
                {isSelected && <Check size={14} className="text-purple-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
