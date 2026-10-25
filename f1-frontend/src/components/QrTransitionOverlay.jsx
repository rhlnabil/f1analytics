import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function QrTransitionOverlay({
  active, label = 'ACCÈS AUTORISÉ', subtitle = 'Ouverture du portail…',
  duration = 2000, onComplete,
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    if (!active) return;
    setProgress(0);
    setPhase('in');
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const tOut = setTimeout(() => setPhase('out'), duration - 300);
    const tDone = setTimeout(() => { if (onComplete) onComplete(); }, duration);
    return () => { cancelAnimationFrame(raf); clearTimeout(tOut); clearTimeout(tDone); };
  }, [active, duration, onComplete]);

  if (!active) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2147483647,
      background: '#0a0a0a', overflow: 'hidden',
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.3s ease' : 'none',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at center, #3a0000 0%, #0a0a0a 70%)',
        animation: 'qt-bgPulse 2s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(225,6,0,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(225,6,0,0.10) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse at center, black 15%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 15%, transparent 75%)',
      }} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[...Array(24)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${i * 4.2}%`, left: 0, right: 0,
            height: i % 4 === 0 ? 2 : 1,
            background: `linear-gradient(90deg, transparent, ${i % 3 === 0 ? '#e10600' : 'rgba(255,255,255,0.30)'}, transparent)`,
            animation: `qt-speedLine ${0.5 + (i % 5) * 0.12}s linear infinite`,
            animationDelay: `${i * 0.025}s`,
          }} />
        ))}
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(225,6,0,0.65) 0%, transparent 70%)',
        filter: 'blur(70px)',
        animation: 'qt-haloPulse 1.6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', zIndex: 10, width: '100%', padding: '0 24px',
      }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 40 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 260, height: 260, borderRadius: '50%',
            border: '2px dashed rgba(225,6,0,0.7)',
            animation: 'qt-spin 3s linear infinite',
            pointerEvents: 'none',
          }} />
          <img src="/Logo.png" alt="F1 Apex" style={{
            position: 'relative', height: 130, width: 'auto',
            filter: 'drop-shadow(0 0 40px #e10600) drop-shadow(0 0 80px rgba(225,6,0,0.7))',
            animation: 'qt-logoZoom 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ width: 50, height: 2, background: 'linear-gradient(90deg, transparent, #e10600)' }} />
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.5em',
            color: '#e10600', fontWeight: 700, textShadow: '0 0 20px #e10600',
          }}>◆ {label} ◆</span>
          <span style={{ width: 50, height: 2, background: 'linear-gradient(90deg, #e10600, transparent)' }} />
        </div>
        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 900,
          textTransform: 'uppercase', color: '#fff', letterSpacing: '-0.02em',
          textShadow: '0 0 40px rgba(225,6,0,0.8), 0 4px 20px rgba(0,0,0,0.9)',
          marginBottom: 30,
        }}>{subtitle}</div>
        <div style={{
          width: 340, maxWidth: '90%', height: 8, margin: '0 auto',
          background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #7a0300, #e10600, #ff1e00)',
            boxShadow: '0 0 20px #e10600, 0 0 40px rgba(225,6,0,0.6)',
            transition: 'width 0.05s linear',
          }} />
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 900,
          letterSpacing: '0.2em', color: '#fff', marginTop: 16,
          textShadow: '0 0 15px rgba(225,6,0,0.9)',
        }}>{progress}%</div>
      </div>

      <style>{`
        @keyframes qt-bgPulse { 0%,100%{opacity:.85} 50%{opacity:1} }
        @keyframes qt-speedLine { 0%{transform:translateX(-100%);opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{transform:translateX(100%);opacity:0} }
        @keyframes qt-haloPulse { 0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.12)} }
        @keyframes qt-logoZoom {
          0% { transform: scale(0.3) rotate(-20deg); opacity: 0; filter: blur(20px); }
          60% { transform: scale(1.15) rotate(5deg); opacity: 1; filter: blur(0); }
          100% { transform: scale(1) rotate(0); opacity: 1; filter: blur(0); }
        }
        @keyframes qt-spin { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
      `}</style>
    </div>,
    document.body
  );
}