import React from 'react';

/**
 * Animated 4-bar equalizer wave that indicates active track playback
 */
export default function EqualizerWave({ className = '', height = 'h-4' }) {
  return (
    <div className={`equalizer-wave ${height} ${className}`} aria-label="Playing audio">
      <div className="equalizer-bar" />
      <div className="equalizer-bar" />
      <div className="equalizer-bar" />
      <div className="equalizer-bar" />
    </div>
  );
}
