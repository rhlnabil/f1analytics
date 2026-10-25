import { useState } from 'react';

export default function SoundToggle({ enabled, onToggle }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={enabled ? 'Couper le son' : 'Activer le son'}
      style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `1px solid ${enabled ? 'rgba(225,6,0,0.6)' : 'rgba(255,255,255,0.15)'}`,
        background: enabled ? 'rgba(225,6,0,0.15)' : 'rgba(0,0,0,0.5)',
        color: enabled ? '#e10600' : 'var(--text-dim)',
        cursor: 'pointer',
        display: 'grid', placeItems: 'center',
        transition: 'all 0.25s', padding: 0,
      }}
    >
      {enabled ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      )}
    </button>
  );
}