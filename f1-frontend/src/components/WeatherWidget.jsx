import { useEffect, useState } from 'react';

export default function WeatherWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 12, padding: '5px 16px',
      background: 'linear-gradient(90deg, rgba(225,6,0,0.15) 0%, rgba(0,0,0,0.6) 100%)',
      border: '1px solid rgba(225,6,0,0.5)', borderRadius: 4, direction: 'ltr',
      position: 'relative', overflow: 'hidden',
      clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
      boxShadow: '0 0 20px rgba(225,6,0,0.15), inset 0 0 20px rgba(225,6,0,0.05)',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#00d26a', boxShadow: '0 0 8px #00d26a',
          animation: 'pulseGlow 2s infinite',
        }} />
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.25em', color: '#00d26a',
        }}>LIVE</span>
      </span>

      <span style={{
        width: 1, height: 14,
        background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)',
      }} />

      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, fontFamily: 'var(--font-display)', fontWeight: 900 }}>
        <span style={{ fontSize: 15, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{hh}</span>
        <span style={{ fontSize: 15, color: '#e10600', animation: 'blink 1s infinite step-end' }}>:</span>
        <span style={{ fontSize: 15, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{mm}</span>
        <span style={{ fontSize: 15, color: '#e10600', animation: 'blink 1s infinite step-end' }}>:</span>
        <span style={{
          fontSize: 11, color: '#e10600', fontWeight: 700,
          letterSpacing: '0.1em', opacity: 0.9, minWidth: 20,
          textAlign: 'left', textShadow: '0 0 8px rgba(225,6,0,0.6)',
        }}>{ss}</span>
      </span>

      <span style={{
        position: 'absolute', top: 0, bottom: 0, width: 40,
        background: 'linear-gradient(90deg, transparent, rgba(225,6,0,0.5), transparent)',
        animation: 'scanAcross 6s ease-in-out infinite', pointerEvents: 'none',
      }} />
    </div>
  );
}