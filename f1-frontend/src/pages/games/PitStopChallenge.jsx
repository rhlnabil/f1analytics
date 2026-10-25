import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useBadges } from '../../context/BadgeContext';

const ACCENT = '#e10600';
const TOTAL_ROUNDS = 5;

export default function PitStopChallenge() {
  const [phase, setPhase] = useState('idle');
  const [position, setPosition] = useState(0);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [time, setTime] = useState(0);
  const [best, setBest] = useState(() => {
    const raw = localStorage.getItem('pitstop_best');
    return raw ? parseInt(raw, 10) : null;
  });

  const { unlock } = useBadges();
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const speedRef = useRef(1);
  const stateRef = useRef({ round: 0, results: [], total: 0, position: 0 });

  const tick = (t) => {
    const elapsed = (t - startRef.current) / 1000;
    const cycle = (elapsed * speedRef.current) % 2;
    const pos = cycle < 1 ? cycle * 100 : (2 - cycle) * 100;
    stateRef.current.position = pos;
    setPosition(pos);
    setTime(elapsed);
    if (elapsed > 6) { stopRound(true); return; }
    rafRef.current = requestAnimationFrame(tick);
  };

  const startRound = (r) => {
    stateRef.current.round = r;
    stateRef.current.position = 0;
    setRound(r);
    setPosition(0);
    setTime(0);
    setPhase('playing');
    speedRef.current = 0.5 + r * 0.15;
    startRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopRound = (timeout = false) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const pos = stateRef.current.position;
    let zone = 'miss', points = 0;
    if (timeout) { zone = 'timeout'; }
    else if (pos >= 40 && pos <= 60) { zone = 'perfect'; points = Math.abs(pos - 50) < 2 ? 150 : 100; }
    else if ((pos >= 25 && pos < 40) || (pos > 60 && pos <= 75)) { zone = 'good'; points = 50; }
    else if ((pos >= 15 && pos < 25) || (pos > 75 && pos <= 85)) { zone = 'ok'; points = 20; }

    const result = { zone, points, pos };
    stateRef.current.results = [...stateRef.current.results, result];
    stateRef.current.total += points;
    setResults(stateRef.current.results);
    setTotal(stateRef.current.total);

    const currentRound = stateRef.current.round;
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setPhase('finished');
      const finalTotal = stateRef.current.total;
      setBest(prev => {
        if (prev === null || finalTotal > prev) {
          localStorage.setItem('pitstop_best', String(finalTotal));
          return finalTotal;
        }
        return prev;
      });
      /* ✅ BADGE */
      if (finalTotal >= 500) unlock('pitstop_500');
    } else {
      setPhase('feedback');
      setTimeout(() => { startRound(currentRound + 1); }, 1300);
    }
  };

  const handleClick = () => {
    if (phase === 'idle' || phase === 'finished') {
      stateRef.current = { round: 0, results: [], total: 0, position: 0 };
      setResults([]);
      setTotal(0);
      startRound(0);
    } else if (phase === 'playing') {
      stopRound(false);
    }
  };

  const handleClickRef = useRef();
  handleClickRef.current = handleClick;

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); handleClickRef.current?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const last = results[results.length - 1];

  return (
    <div onClick={handleClick} style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #050508 70%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      cursor: phase === 'feedback' ? 'default' : 'pointer',
      userSelect: 'none', position: 'relative', overflow: 'hidden',
    }}>
      <Link to="/fan/games" onClick={(e) => e.stopPropagation()} style={{
        position: 'absolute', top: 20, left: 20, color: 'var(--text-dim)',
        fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em',
        fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase',
      }}>← JEUX</Link>
      <div style={{
        position: 'absolute', top: 20, right: 20, fontFamily: 'var(--font-display)',
        fontSize: 11, letterSpacing: '0.35em', color: ACCENT, fontWeight: 700,
      }}>🔧 PIT STOP CHALLENGE</div>

      <div style={{ position: 'relative', textAlign: 'center', zIndex: 2, maxWidth: 620, width: '100%' }}>
        {phase === 'idle' && (
          <>
            <div style={{ fontSize: 100, marginBottom: 24 }}>🔧</div>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 900, textTransform: 'uppercase', color: '#fff',
              marginBottom: 16, letterSpacing: '-0.02em',
            }}>Pit Stop Challenge</h1>
            <p style={{
              fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-mid)',
              maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7,
            }}>Clique <strong style={{ color: ACCENT }}>quand le pneu est dans la zone verte</strong> (centre).<br />5 rounds. Timing parfait = 150 pts.</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '16px 36px', background: `linear-gradient(135deg, ${ACCENT}, #b80500)`,
              borderRadius: 10, color: '#fff', fontFamily: 'var(--font-display)',
              fontSize: 12, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase',
              boxShadow: `0 8px 30px ${ACCENT}66`,
            }}>▶ Commencer</div>
            <div style={{
              marginTop: 20, fontFamily: 'var(--font-display)', fontSize: 10,
              letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', fontWeight: 700,
            }}>ESPACE ou CLIC</div>
            {best !== null && (
              <div style={{
                marginTop: 12, fontFamily: 'var(--font-display)', fontSize: 11,
                letterSpacing: '0.2em', color: '#FFD700', fontWeight: 700,
              }}>🏆 RECORD · {best} PTS</div>
            )}
          </>
        )}

        {(phase === 'playing' || phase === 'feedback') && (
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: 20,
              fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.6)', fontWeight: 700,
            }}>
              <span>ROUND {round + 1}/{TOTAL_ROUNDS}</span>
              <span>SCORE <span style={{ color: ACCENT }}>{total}</span></span>
            </div>
            <div style={{
              position: 'relative', height: 80,
              background: 'linear-gradient(90deg, #7a0300 0%, #ffd700 25%, #00d26a 40%, #00d26a 60%, #ffd700 75%, #7a0300 100%)',
              borderRadius: 40, border: '2px solid rgba(255,255,255,0.1)',
              overflow: 'hidden', marginBottom: 24,
              boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)',
            }}>
              <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2,
                background: 'rgba(255,255,255,0.5)', transform: 'translateX(-50%)',
              }} />
              <div style={{
                position: 'absolute', left: `${position}%`, top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 56, height: 56, borderRadius: '50%',
                background: 'radial-gradient(circle, #2a2a35 0%, #0a0a0f 100%)',
                border: '3px solid #fff',
                boxShadow: `0 0 30px #fff, 0 0 60px ${ACCENT}`,
                display: 'grid', placeItems: 'center', fontSize: 24, willChange: 'left',
              }}>🛞</div>
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900,
              color: '#fff', letterSpacing: '0.1em', textShadow: `0 0 30px ${ACCENT}`,
            }}>{time.toFixed(2)}s</div>
          </>
        )}

        {phase === 'feedback' && last && (
          <div style={{ marginTop: 24, animation: 'pitPop 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ fontSize: 60, marginBottom: 8 }}>
              {last.zone === 'perfect' ? '🏆' : last.zone === 'good' ? '✅' : last.zone === 'ok' ? '⚠️' : last.zone === 'timeout' ? '⏰' : '❌'}
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900,
              textTransform: 'uppercase',
              color: last.zone === 'perfect' ? '#00d26a' : last.zone === 'good' ? '#ffd700' : last.zone === 'ok' ? '#ff8700' : '#ff5555',
            }}>
              {last.zone === 'perfect' ? 'PARFAIT !' : last.zone === 'good' ? 'BIEN' : last.zone === 'ok' ? 'MOYEN' : last.zone === 'timeout' ? 'TROP TARD' : 'RATÉ'}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: ACCENT }}>+{last.points} PTS</div>
          </div>
        )}

        {phase === 'finished' && (
          <>
            <div style={{ fontSize: 100, marginBottom: 20 }}>
              {total >= 500 ? '🏆' : total >= 350 ? '🥇' : total >= 200 ? '🥈' : total >= 100 ? '🥉' : '🏁'}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: 16,
            }}>
              {total >= 500 ? 'MAÎTRE MÉCANO !' : total >= 350 ? 'EXCELLENT !' : total >= 200 ? 'PAS MAL !' : 'À RETRAVAILLER'}
            </h1>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 900,
              color: ACCENT, marginBottom: 20, textShadow: `0 0 40px ${ACCENT}88`,
            }}>{total}<span style={{ fontSize: 20 }}> PTS</span></div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  padding: '6px 12px',
                  background: r.zone === 'perfect' ? 'rgba(0,210,106,0.15)' : r.zone === 'good' ? 'rgba(255,215,0,0.15)' : r.zone === 'ok' ? 'rgba(255,135,0,0.15)' : 'rgba(255,85,85,0.15)',
                  border: `1px solid ${r.zone === 'perfect' ? '#00d26a' : r.zone === 'good' ? '#ffd700' : r.zone === 'ok' ? '#ff8700' : '#ff5555'}`,
                  borderRadius: 6, fontFamily: 'var(--font-display)',
                  fontSize: 11, fontWeight: 900, color: '#fff',
                }}>{r.points}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                padding: '16px 32px', background: `linear-gradient(135deg, ${ACCENT}, #b80500)`,
                borderRadius: 10, color: '#fff', fontFamily: 'var(--font-display)',
                fontSize: 12, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase',
                boxShadow: `0 8px 30px ${ACCENT}88`,
              }}>⟳ Rejouer</div>
              {best !== null && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '16px 24px', background: 'rgba(255,215,0,0.1)',
                  border: '1.5px solid rgba(255,215,0,0.5)', borderRadius: 10,
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900,
                  letterSpacing: '0.2em', color: '#FFD700',
                }}>🏆 {best} PTS</div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pitPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}