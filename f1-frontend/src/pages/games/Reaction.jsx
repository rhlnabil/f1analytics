import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const ACCENT = '#e10600';
const F1_REFERENCES = [
  { name: 'Réflexe moyen humain', ms: 250, color: '#8a8a95', icon: '👤' },
  { name: 'Pilote F1 moyen',      ms: 220, color: '#e10600', icon: '🏎️' },
  { name: 'Départ F1 excellent',  ms: 190, color: '#ff8700', icon: '⚡' },
  { name: 'Record F1 (Bottas)',   ms: 165, color: '#FFD700', icon: '👑' },
];
const PHASE = { IDLE: 'idle', LIGHTS: 'lights', WAITING: 'waiting', GO: 'go', RESULT: 'result', TOO_EARLY: 'too-early' };

export default function Reaction() {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [litCount, setLitCount] = useState(0);
  const [reactionMs, setReactionMs] = useState(null);
  const [best, setBest] = useState(() => {
    const raw = localStorage.getItem('f1reaction_best');
    return raw ? parseInt(raw, 10) : null;
  });
  const [history, setHistory] = useState(() => {
    try { const raw = localStorage.getItem('f1reaction_history'); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  });

  const timeoutsRef = useRef([]);
  const goTimeRef = useRef(null);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const start = useCallback(() => {
    clearAllTimeouts();
    setReactionMs(null);
    setLitCount(0);
    setPhase(PHASE.LIGHTS);
    goTimeRef.current = null;

    for (let i = 0; i < 5; i++) {
      const t = setTimeout(() => {
        setLitCount(i + 1);
        if (i === 4) {
          setPhase(PHASE.WAITING);
          const waitTime = 1200 + Math.random() * 2800;
          const t2 = setTimeout(() => {
            setPhase(PHASE.GO);
            goTimeRef.current = performance.now();
          }, waitTime);
          timeoutsRef.current.push(t2);
        }
      }, i * 600);
      timeoutsRef.current.push(t);
    }
  }, []);

  const handleClick = () => {
    if (phase === PHASE.IDLE || phase === PHASE.RESULT || phase === PHASE.TOO_EARLY) { start(); return; }
    if (phase === PHASE.LIGHTS || phase === PHASE.WAITING) {
      clearAllTimeouts();
      setPhase(PHASE.TOO_EARLY);
      return;
    }
    if (phase === PHASE.GO) {
      const elapsed = Math.round(performance.now() - goTimeRef.current);
      setReactionMs(elapsed);
      setPhase(PHASE.RESULT);

      if (best === null || elapsed < best) {
        localStorage.setItem('f1reaction_best', String(elapsed));
        setBest(elapsed);
      }
      const newHistory = [elapsed, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('f1reaction_history', JSON.stringify(newHistory));
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); handleClick(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, best, history]);

  useEffect(() => () => clearAllTimeouts(), []);

  const getRating = (ms) => {
    if (ms === null) return null;
    if (ms < 170) return { label: 'SUPERHUMAN', color: '#FFD700', icon: '👑' };
    if (ms < 200) return { label: 'EXCELLENT', color: '#ff8700', icon: '🥇' };
    if (ms < 240) return { label: 'TRÈS BIEN', color: '#00d26a', icon: '🥈' };
    if (ms < 300) return { label: 'BIEN', color: '#c084fc', icon: '🥉' };
    return { label: 'À TRAVAILLER', color: '#8a8a95', icon: '🏁' };
  };

  const rating = getRating(reactionMs);
  const isWaiting = phase === PHASE.LIGHTS || phase === PHASE.WAITING;
  const isGo = phase === PHASE.GO;
  const isResult = phase === PHASE.RESULT;
  const isEarly = phase === PHASE.TOO_EARLY;
  const isIdle = phase === PHASE.IDLE;

  return (
    <div onClick={handleClick} style={{
      minHeight: '100vh',
      background: isGo ? 'radial-gradient(circle at center, #0a2a15 0%, #050508 70%)'
        : isEarly ? 'radial-gradient(circle at center, #2a0a0a 0%, #050508 70%)'
        : 'radial-gradient(circle at center, #1a0a0a 0%, #050508 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', cursor: 'pointer', userSelect: 'none',
      transition: 'background 0.4s', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/fan/games" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 8 }}>← JEUX</Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.35em', color: ACCENT, fontWeight: 700 }}>⚡ TEST DE RÉFLEXES</div>
      </div>

      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${ACCENT}08 1px, transparent 1px), linear-gradient(90deg, ${ACCENT}08 1px, transparent 1px)`, backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
        {isIdle && (
          <>
            <div style={{ fontSize: 100, marginBottom: 24 }}>⚡</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: 16, letterSpacing: '-0.03em', textShadow: `0 0 40px ${ACCENT}66` }}>Prêt à réagir ?</h1>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--text-mid)', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.6 }}>
              5 feux s'allument un par un.<br />Quand ils s'éteignent → <strong style={{ color: ACCENT }}>CLIQUE VITE</strong>
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '18px 40px', background: `linear-gradient(135deg, ${ACCENT}, #b80500)`, borderRadius: 10, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', boxShadow: `0 8px 30px ${ACCENT}88`, clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}>▶ Commencer</div>
            <div style={{ marginTop: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--text-dim)', fontWeight: 700 }}>ESPACE ou CLIC</div>
          </>
        )}

        {(isWaiting || isGo) && (
          <>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 48, padding: '40px 60px', background: 'rgba(0,0,0,0.7)', border: `2px solid ${isGo ? '#00d26a' : ACCENT}44`, borderRadius: 20, boxShadow: isGo ? '0 0 80px #00d26a88' : `0 0 40px ${ACCENT}33`, transition: 'all 0.2s' }}>
              {[0, 1, 2, 3, 4].map(i => {
                const lit = isWaiting && i < litCount;
                return (
                  <div key={i} style={{
                    width: 70, height: 70, borderRadius: '50%',
                    background: isGo ? 'radial-gradient(circle, #00d26a 0%, #007a3d 100%)'
                      : lit ? 'radial-gradient(circle, #ff2020 0%, #7a0300 100%)'
                      : 'radial-gradient(circle, #1a1a22 0%, #0a0a0f 100%)',
                    boxShadow: isGo ? '0 0 40px #00d26a, inset 0 4px 12px rgba(255,255,255,0.4)'
                      : lit ? '0 0 40px #ff2020, 0 0 80px #ff202088, inset 0 4px 12px rgba(255,255,255,0.4)'
                      : 'inset 0 4px 12px rgba(0,0,0,0.9), inset 0 -4px 8px rgba(255,255,255,0.05)',
                    border: `3px solid ${isGo ? '#00d26a' : lit ? '#ff2020' : '#2a2a35'}`,
                    transition: 'all 0.15s',
                    transform: lit || isGo ? 'scale(1.05)' : 'scale(1)',
                  }} />
                );
              })}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, textTransform: 'uppercase', color: isGo ? '#00d26a' : '#fff', letterSpacing: '-0.02em', textShadow: isGo ? '0 0 60px #00d26a' : `0 0 30px ${ACCENT}66`, animation: isGo ? 'flash 0.3s ease-in-out infinite alternate' : 'none' }}>{isGo ? '▶ GO !' : 'ATTENDS…'}</div>
            {isWaiting && <p style={{ marginTop: 16, fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--text-dim)', fontWeight: 700 }}>NE CLIQUE PAS AVANT LES FEUX VERTS</p>}
          </>
        )}

        {isEarly && (
          <>
            <div style={{ fontSize: 100, marginBottom: 24 }}>🚫</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, textTransform: 'uppercase', color: '#ff5555', marginBottom: 16, letterSpacing: '-0.03em', textShadow: '0 0 40px #ff555588' }}>Trop tôt !</h1>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--text-mid)', marginBottom: 40 }}>Attends que les feux s'éteignent.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '18px 40px', background: `linear-gradient(135deg, ${ACCENT}, #b80500)`, borderRadius: 10, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', boxShadow: `0 8px 30px ${ACCENT}88`, clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}>⟳ Réessayer</div>
          </>
        )}

        {isResult && rating && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.4em', color: ACCENT, fontWeight: 700, marginBottom: 20 }}>◆ TON TEMPS ◆</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(80px, 15vw, 160px)', fontWeight: 900, fontStyle: 'italic', color: rating.color, lineHeight: 1, letterSpacing: '-0.04em', textShadow: `0 0 60px ${rating.color}aa, 0 0 100px ${rating.color}66`, animation: 'reactionPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>{reactionMs}<span style={{ fontSize: 32, marginLeft: 10, opacity: 0.8 }}>ms</span></div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 32, padding: '10px 20px', background: `${rating.color}22`, border: `1.5px solid ${rating.color}`, borderRadius: 8, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', color: rating.color, textShadow: `0 0 15px ${rating.color}88` }}>{rating.icon} {rating.label}</div>

            <div style={{ maxWidth: 500, margin: '0 auto 32px', padding: 20, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
              {F1_REFERENCES.map(ref => {
                const isBetter = reactionMs <= ref.ms;
                return (
                  <div key={ref.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: 12, fontFamily: 'var(--font-heading)', color: 'rgba(255,255,255,0.85)' }}>
                    <span style={{ width: 20, textAlign: 'center', fontSize: 14 }}>{isBetter ? '✓' : ref.icon}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{ref.name}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: ref.color, minWidth: 50, textAlign: 'right' }}>{ref.ms}ms</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 32px', background: `linear-gradient(135deg, ${ACCENT}, #b80500)`, borderRadius: 10, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', boxShadow: `0 8px 30px ${ACCENT}88`, clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}>⟳ Rejouer</div>
              {best !== null && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 24px', background: 'rgba(255,215,0,0.1)', border: '1.5px solid rgba(255,215,0,0.5)', borderRadius: 10, fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', color: '#FFD700' }}>🏆 RECORD · {best}ms</div>
              )}
            </div>
          </>
        )}
      </div>

      {(isIdle || isResult) && history.length > 0 && (
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, padding: 16, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, maxWidth: 500, margin: '0 auto', zIndex: 3 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.3em', color: 'var(--text-dim)', fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>◆ DERNIERS ESSAIS</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {history.map((t, i) => {
              const r = getRating(t);
              return (
                <div key={i} style={{ padding: '6px 12px', background: `${r.color}15`, border: `1px solid ${r.color}44`, borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900, color: r.color }}>{t}ms</div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes flash { from { opacity: 0.7; } to { opacity: 1; } }
        @keyframes reactionPop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}