import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pipette, Check, RotateCcw } from 'lucide-react';

// Math helpers for HSV <-> RGB <-> Hex
function hsvToRgb(h, s, v) {
  const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return {
    r: Math.round(f(5) * 255),
    g: Math.round(f(3) * 255),
    b: Math.round(f(1) * 255)
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function hexToRgb(hex) {
  if (!hex) return null;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h *= 60;
  }
  return { h, s, v };
}

function parseHexToHsv(hex, fallback = { h: 260, s: 0.65, v: 0.95 }) {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

const DEFAULT_PRESETS = [
  '#1DB954', '#1ED760', '#8B5CF6', '#7C3AED',
  '#3B82F6', '#06B6D4', '#10B981', '#F59E0B',
  '#EC4899', '#F43F5E', '#6366F1', '#EAB308'
];

export default function ColorPicker({
  color = '#1DB954',
  onChange,
  showAlpha = false,
  alpha = 1,
  onChangeAlpha,
  className = '',
  label = 'Color'
}) {
  const [hsv, setHsv] = useState(() => parseHexToHsv(color));
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const [recentColors, setRecentColors] = useState(() => {
    try {
      const saved = localStorage.getItem('audira_recent_colors');
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS.slice(0, 8);
    } catch {
      return DEFAULT_PRESETS.slice(0, 8);
    }
  });

  const plateRef = useRef(null);
  const hueRef = useRef(null);
  const alphaRef = useRef(null);
  const isDraggingPlate = useRef(false);
  const isDraggingHue = useRef(false);
  const isDraggingAlpha = useRef(false);

  // Sync HSV when external color prop changes meaningfully
  useEffect(() => {
    const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
    if (color && color.toUpperCase() !== currentHex.toUpperCase()) {
      const parsed = parseHexToHsv(color, hsv);
      setHsv(parsed);
      setHexInput(color.toUpperCase());
    }
  }, [color]);

  const saveRecentColor = useCallback((hex) => {
    setRecentColors(prev => {
      const cleanHex = hex.toUpperCase();
      const filtered = prev.filter(c => c.toUpperCase() !== cleanHex);
      const updated = [cleanHex, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('audira_recent_colors', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const triggerChange = useCallback((newHsv) => {
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexInput(hex);
    if (onChange) onChange(hex);
  }, [onChange]);

  // Update Saturation & Brightness on Plate drag
  const handlePlatePointer = useCallback((e) => {
    if (!plateRef.current) return;
    const rect = plateRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = x / rect.width;
    // Top is bright (1), bottom is dark (0)
    const v = 1 - (y / rect.height);

    const newHsv = { ...hsv, s, v };
    setHsv(newHsv);
    triggerChange(newHsv);
  }, [hsv, triggerChange]);

  const onPlateStart = (e) => {
    isDraggingPlate.current = true;
    handlePlatePointer(e);
  };

  // Update Hue on slider drag
  const handleHuePointer = useCallback((e, sliderEl) => {
    if (!sliderEl) return;
    const rect = sliderEl.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const h = (x / rect.width) * 360;

    const newHsv = { ...hsv, h: Math.min(360, Math.max(0, h)) };
    setHsv(newHsv);
    triggerChange(newHsv);
  }, [hsv, triggerChange]);

  // Update Alpha on slider drag
  const handleAlphaPointer = useCallback((e, sliderEl) => {
    if (!sliderEl || !onChangeAlpha) return;
    const rect = sliderEl.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const a = Math.round((x / rect.width) * 100) / 100;
    onChangeAlpha(Math.min(1, Math.max(0, a)));
  }, [onChangeAlpha]);

  // Global mouse/touch move and up listeners for fluid dragging
  useEffect(() => {
    const handleMove = (e) => {
      if (isDraggingPlate.current) {
        if (e.cancelable && e.type === 'touchmove') e.preventDefault();
        handlePlatePointer(e);
      } else if (isDraggingHue.current && hueRef.current) {
        if (e.cancelable && e.type === 'touchmove') e.preventDefault();
        handleHuePointer(e, hueRef.current);
      } else if (isDraggingAlpha.current && alphaRef.current) {
        if (e.cancelable && e.type === 'touchmove') e.preventDefault();
        handleAlphaPointer(e, alphaRef.current);
      }
    };

    const handleUp = () => {
      if (isDraggingPlate.current || isDraggingHue.current) {
        const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
        saveRecentColor(rgbToHex(rgb.r, rgb.g, rgb.b));
      }
      isDraggingPlate.current = false;
      isDraggingHue.current = false;
      isDraggingAlpha.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [handlePlatePointer, handleHuePointer, handleAlphaPointer, hsv, saveRecentColor]);

  // Hex input manual editing
  const handleHexInputChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (!val.startsWith('#')) val = '#' + val;
    setHexInput(val);

    const rgb = hexToRgb(val);
    if (rgb) {
      const parsedHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(parsedHsv);
      if (onChange) onChange(val);
      saveRecentColor(val);
    }
  };

  const handleEyedropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          const rgb = hexToRgb(hex);
          if (rgb) {
            const parsedHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            setHsv(parsedHsv);
            setHexInput(hex);
            if (onChange) onChange(hex);
            saveRecentColor(hex);
          }
        }
      } catch (err) {
        // User canceled eyedropper
      }
    }
  };

  // Pure Hue RGB background for the 2D plate
  const pureHueRgb = hsvToRgb(hsv.h, 1, 1);
  const pureHueHex = rgbToHex(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b);

  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);

  // Ball cursor positions (0 to 100%)
  const ballLeft = Math.max(0, Math.min(100, hsv.s * 100));
  const ballTop = Math.max(0, Math.min(100, (1 - hsv.v) * 100));
  const hueThumbLeft = Math.max(0, Math.min(100, (hsv.h / 360) * 100));

  return (
    <div className={`p-4 bg-[#11121C] border border-white/10 rounded-2xl shadow-2xl select-none w-full max-w-xs space-y-3.5 ${className}`}>
      {/* Header with live swatch and Eyedropper */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          {typeof window !== 'undefined' && 'EyeDropper' in window && (
            <button
              type="button"
              onClick={handleEyedropper}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Pick color from screen"
            >
              <Pipette size={14} />
            </button>
          )}
          <div
            className="w-6 h-6 rounded-lg border border-white/20 shadow-inner"
            style={{ backgroundColor: currentHex }}
          />
        </div>
      </div>

      {/* 2D Color Plate: Saturation (X) & Brightness (Y) */}
      <div
        ref={plateRef}
        onMouseDown={onPlateStart}
        onTouchStart={onPlateStart}
        className="relative w-full h-36 rounded-xl cursor-crosshair overflow-hidden shadow-inner"
        style={{ backgroundColor: pureHueHex }}
      >
        {/* White gradient from left to right (Saturation) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #FFFFFF, transparent)' }}
        />
        {/* Black gradient from top to bottom (Brightness) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #000000, transparent)' }}
        />

        {/* Draggable Ball Cursor */}
        <div
          className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white shadow-[0_0_6px_rgba(0,0,0,0.8)] pointer-events-none transition-transform active:scale-125 flex items-center justify-center"
          style={{
            left: `${ballLeft}%`,
            top: `${ballTop}%`,
            backgroundColor: currentHex
          }}
        >
          {/* Floating live hex preview badge */}
          <div
            className={`absolute px-1.5 py-0.5 rounded bg-black/90 border border-white/30 text-[9px] font-mono font-bold text-white whitespace-nowrap shadow-lg pointer-events-none ${
              ballTop < 20 ? 'top-6' : '-top-6'
            }`}
          >
            {currentHex}
          </div>
        </div>
      </div>

      {/* Hue Slider Bar */}
      <div className="space-y-1.5">
        <div
          ref={hueRef}
          onMouseDown={(e) => {
            isDraggingHue.current = true;
            handleHuePointer(e, hueRef.current);
          }}
          onTouchStart={(e) => {
            isDraggingHue.current = true;
            handleHuePointer(e, hueRef.current);
          }}
          className="relative h-3.5 w-full rounded-full cursor-pointer overflow-hidden shadow-inner"
          style={{
            background: 'linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)'
          }}
        >
          <div
            className="absolute top-0 bottom-0 w-3.5 -ml-1.5 rounded-full bg-white border border-black/40 shadow-md pointer-events-none"
            style={{ left: `${hueThumbLeft}%` }}
          />
        </div>
      </div>

      {/* Optional Opacity / Alpha Slider Bar */}
      {showAlpha && (
        <div className="space-y-1.5">
          <div
            ref={alphaRef}
            onMouseDown={(e) => {
              isDraggingAlpha.current = true;
              handleAlphaPointer(e, alphaRef.current);
            }}
            onTouchStart={(e) => {
              isDraggingAlpha.current = true;
              handleAlphaPointer(e, alphaRef.current);
            }}
            className="relative h-3.5 w-full rounded-full cursor-pointer overflow-hidden shadow-inner"
            style={{
              background: `linear-gradient(to right, transparent, ${currentHex})`,
              backgroundColor: '#1E202E'
            }}
          >
            <div
              className="absolute top-0 bottom-0 w-3.5 -ml-1.5 rounded-full bg-white border border-black/40 shadow-md pointer-events-none"
              style={{ left: `${alpha * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Live Swatch Preview with Hex Code displayed directly below it */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>Selected Color Swatch</span>
          <span className="font-mono text-xs font-bold text-purple-400">{currentHex}</span>
        </div>

        {/* Live Swatch */}
        <div
          className="w-full h-10 rounded-xl border border-white/20 shadow-md relative overflow-hidden flex items-center justify-center transition-colors"
          style={{ backgroundColor: currentHex }}
        >
          {showAlpha && (
            <div
              className="absolute inset-0 -z-10 opacity-30"
              style={{
                backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                backgroundSize: '10px 10px',
                backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
              }}
            />
          )}
          <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-[10px] font-mono font-bold text-white shadow-sm border border-white/10">
            Live Preview
          </span>
        </div>

        {/* Hex Code Field Displayed Directly Below Swatch */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={hexInput}
              maxLength={7}
              onChange={handleHexInputChange}
              placeholder="#RRGGBB"
              className="w-full bg-[#090A10] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-purple-400 transition tracking-widest shadow-inner"
            />
          </div>
          <button
            type="button"
            onClick={() => saveRecentColor(currentHex)}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition shrink-0"
            title="Save this color to recents"
          >
            Save
          </button>
        </div>
      </div>

      {/* Recent & Saved Colors Row */}
      <div className="space-y-1 pt-1 border-t border-white/5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Presets & Recents</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {recentColors.map((hex, i) => {
            const isSelected = hex.toUpperCase() === currentHex.toUpperCase();
            return (
              <button
                key={`${hex}-${i}`}
                type="button"
                onClick={() => {
                  const rgb = hexToRgb(hex);
                  if (rgb) {
                    const parsed = rgbToHsv(rgb.r, rgb.g, rgb.b);
                    setHsv(parsed);
                    setHexInput(hex.toUpperCase());
                    if (onChange) onChange(hex);
                  }
                }}
                className={`w-6 h-6 rounded-full border transition-transform hover:scale-115 flex items-center justify-center ${
                  isSelected ? 'border-white scale-110 shadow-md' : 'border-black/30'
                }`}
                style={{ backgroundColor: hex }}
                title={hex}
              >
                {isSelected && <Check size={12} className="text-white drop-shadow-md" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
