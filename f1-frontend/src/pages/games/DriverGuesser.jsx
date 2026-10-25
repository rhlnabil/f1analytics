import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { imgSrc, flagSrc } from '../../utils/images';

const ACCENT = '#e10600';

export default function DriverGuesser() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [revealed, setRevealed] = useState(0);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState('playing');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sniper, setSniper] = useState(false);

  const CLUES = ['country', 'team', 'number', 'debutYear', 'initials'];

  const loadNew = (pool) => {
    if (!pool || pool.length === 0) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setTarget(next);
    setRevealed(1);
    setAttempts(0);
    setGuess('');
    setSuggestions([]);
    setPhase('playing');
    setSniper(false);
  };

  useEffect(() => {
    api.get('/drivers')
      .then(r => {
        const pool = (r.data || []).filter(d => d.lastName);
        setDrivers(pool);
        loadNew(pool);
      })
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  const revealNext = () => {
    if (revealed < CLUES.length) setRevealed(revealed + 1);
  };

  const submitGuess = (name) => {
    if (phase !== 'playing' || !target) return;
    const clean = (name || '').trim().toLowerCase();
    if (!clean) return;

    const correct = `${target.lastName}`.toLowerCase() === clean ||
                    `${target.firstName} ${target.lastName}`.toLowerCase() === clean;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (correct) {
      const points = Math.max(10, 100 - (newAttempts - 1) * 25 - (revealed - 1) * 10);
      setScore(s => s + points);

      const isSniper = newAttempts === 1 && revealed === 1;
      setSniper(isSniper);
      setStreak(s => s + 1);

      setPhase('won');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    } else if (newAttempts >= 3) {
      setStreak(0);
      setPhase('lost');
    } else {
      setGuess('');
      setSuggestions([]);
      revealNext();
    }
  };

  const onInputChange = (v) => {
    setGuess(v);
    if (v.trim().length < 1) { setSuggestions([]); return; }
    const q = v.toLowerCase();
    const matches = drivers
      .filter(d =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        (d.lastName || '').toLowerCase().includes(q)
      )
      .slice(0, 5);
    setSuggestions(matches);
  };

  if (loading) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', color: ACCENT, letterSpacing: '0.3em', fontSize: 11, fontWeight: 700 }}>◆ CHARGEMENT...</div>
    </div>
  );

  if (!target) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-dim)' }}>Pas de pilotes en DB</h2>
      <Link to="/fan/games" style={{ color: ACCENT }}>← Jeux</Link>
    </div>
  );

  const cluesDisplay = [
    { key: 'country', icon: '🌍', label: 'PAYS', value: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        {target.countryCode && (
          <img src={flagSrc(target.countryCode)} alt={target.countryCode}
            style={{ height: 22, width: 'auto', borderRadius: 3 }} />
        )}
        <span>{target.nationality || '—'}</span>
      </div>
    )},
    { key: 'team', icon: '🏎️', label: 'ÉCURIE', value: target.teamName || '—' },
    { key: 'number', icon: '🔢', label: 'NUMÉRO', value: target.number || '—' },
    { key: 'debutYear', icon: '📅', label: 'F1 DEPUIS', value: target.debutYear || '—' },
    { key: 'initials', icon: '🔤', label: 'INITIALES', value: `${target.firstName?.[0] || '?'}.${target.lastName?.[0] || '?'}.` },
  ];

  return (
    <div style={{
      minHeight: '100vh', padding: '60px 24px 100px',
      background: 'radial-gradient(ellipse at top, #1a0a0a 0%, #050508 70%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
          {[...Array(40)].map((_, i) => {
            const angle = (i / 40) * 360;
            const dist = 200 + Math.random() * 400;
            const dx = Math.cos((angle * Math.PI) / 180) * dist;
            const dy = Math.sin((angle * Math.PI) / 180) * dist;
            return (
              <div key={i} style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 8, height: 8, borderRadius: 2,
                background: ['#FFD700', '#e10600', '#00d26a', '#00d4ff'][i % 4],
                transform: `translate(-50%, -50%)`,
                animation: `dgConfetti 2s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.02}s both`,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
                boxShadow: '0 0 10px currentColor',
              }} />
            );
          })}
          <style>{`
            @keyframes dgConfetti {
              0% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(1); }
              100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(720deg) scale(0.3); }
            }
          `}</style>
        </div>
      )}

      <Link to="/fan/games" style={{ position: 'absolute', top: 20, left: 20, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase' }}>← JEUX</Link>

      <div style={{
        position: 'absolute', top: 20, right: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11,
          letterSpacing: '0.3em', color: ACCENT, fontWeight: 700,
        }}>🏎️ DRIVER GUESSER</div>
        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            background: 'rgba(255,135,0,0.15)',
            border: '1.5px solid #ff8700',
            borderRadius: 8,
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900,
            color: '#ff8700',
            letterSpacing: '0.1em',
            boxShadow: `0 0 20px #ff870088`,
          }}>
            🔥 {streak} STREAK
          </div>
        )}
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginBottom: 20, fontFamily: 'var(--font-display)',
          fontSize: 11, letterSpacing: '0.2em', fontWeight: 700,
        }}>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>
            SCORE <span style={{ color: ACCENT, marginLeft: 6 }}>{score}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 32,
            fontWeight: 900, textTransform: 'uppercase',
            color: '#fff', marginBottom: 8, letterSpacing: '-0.02em',
          }}>Devine le pilote</h1>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 10,
            letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)',
            fontWeight: 700,
          }}>
            {attempts}/3 tentatives · {revealed}/{CLUES.length} indices
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(160deg, rgba(13,13,20,0.98) 0%, rgba(5,7,10,0.98) 100%)',
          border: `1.5px solid ${ACCENT}55`, borderRadius: 12,
          padding: '24px 28px', marginBottom: 24,
        }}>
          {cluesDisplay.slice(0, revealed).map((clue, i) => (
            <div key={clue.key} style={{
              display: 'grid', gridTemplateColumns: '100px 1fr',
              alignItems: 'center', gap: 16,
              padding: '14px 0',
              borderBottom: i < revealed - 1 ? '1px dashed rgba(255,255,255,0.08)' : 'none',
              animation: `dgClueIn 0.4s ease ${i * 0.1}s both`,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--font-display)',
                fontSize: 9, letterSpacing: '0.25em',
                fontWeight: 700, color: ACCENT,
              }}>
                <span style={{ fontSize: 14 }}>{clue.icon}</span>
                {clue.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20, fontWeight: 900,
                color: '#fff', textTransform: 'uppercase',
              }}>{clue.value}</div>
            </div>
          ))}

          {revealed < CLUES.length && phase === 'playing' && (
            <div style={{
              marginTop: 16, paddingTop: 16,
              borderTop: '1px dashed rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}>
              <button onClick={revealNext} style={{
                all: 'unset', cursor: 'pointer',
                padding: '8px 16px',
                background: 'rgba(225,6,0,0.1)',
                border: `1px solid ${ACCENT}55`,
                borderRadius: 6,
                fontFamily: 'var(--font-display)',
                fontSize: 10, letterSpacing: '0.2em',
                color: ACCENT, fontWeight: 700,
                textTransform: 'uppercase',
              }}>+ Révéler un indice (-10 pts)</button>
            </div>
          )}
        </div>

        {phase === 'playing' && (
          <div style={{ position: 'relative' }}>
            <input
              value={guess}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitGuess(guess)}
              placeholder="Tape le nom du pilote..."
              autoFocus
              style={{
                width: '100%', padding: '16px 20px',
                background: 'rgba(20,20,26,0.9)',
                border: `1.5px solid ${ACCENT}55`,
                borderRadius: 10, color: '#fff',
                fontFamily: 'var(--font-heading)',
                fontSize: 16, outline: 'none',
              }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                marginTop: 4, background: '#0a0a12',
                border: `1px solid ${ACCENT}55`, borderRadius: 8,
                overflow: 'hidden', zIndex: 10,
              }}>
                {suggestions.map(d => (
                  <button
                    key={d.id}
                    onClick={() => submitGuess(`${d.firstName} ${d.lastName}`)}
                    style={{
                      all: 'unset', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', width: '100%',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}22`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 14, fontWeight: 700, color: '#fff',
                    }}>
                      {d.firstName} <strong>{d.lastName}</strong>
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: 'var(--font-display)',
                      fontSize: 10, color: 'rgba(255,255,255,0.5)',
                    }}>
                      {d.teamName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === 'won' && (
          <div style={{
            textAlign: 'center', padding: 32,
            background: sniper
              ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,135,0,0.08))'
              : 'rgba(0,210,106,0.08)',
            border: `1.5px solid ${sniper ? '#FFD700' : '#00d26a'}`,
            borderRadius: 12,
            animation: 'dgClueIn 0.5s ease',
            position: 'relative', overflow: 'hidden',
          }}>
            {sniper && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                padding: '4px 12px',
                background: 'linear-gradient(135deg, #FFD700, #ff8700)',
                borderRadius: 4, color: '#000',
                fontFamily: 'var(--font-display)',
                fontSize: 10, fontWeight: 900,
                letterSpacing: '0.2em',
              }}>🎯 SNIPER</div>
            )}
            <div style={{ fontSize: 60, marginBottom: 12 }}>🎉</div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 24,
              fontWeight: 900, textTransform: 'uppercase',
              color: sniper ? '#FFD700' : '#00d26a', marginBottom: 8,
            }}>
              {sniper ? 'SNIPER !' : 'Bon pilote !'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
              {target.actionPhotoUrl || target.photoUrl ? (
                <img
                  src={imgSrc(target.actionPhotoUrl || target.photoUrl)}
                  alt={target.lastName}
                  style={{
                    width: 60, height: 60, borderRadius: '50%',
                    objectFit: 'cover', objectPosition: 'center 5%',
                    border: `2px solid ${ACCENT}`,
                  }}
                />
              ) : null}
              <div style={{
                fontFamily: 'var(--font-heading)', fontSize: 20,
                fontWeight: 900, color: '#fff', textTransform: 'uppercase',
              }}>
                {target.firstName} {target.lastName}
              </div>
            </div>
            {streak > 0 && (
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12, letterSpacing: '0.2em',
                color: '#ff8700', fontWeight: 900,
                marginBottom: 16,
              }}>
                🔥 STREAK {streak}
              </div>
            )}
            <button
              onClick={() => loadNew(drivers)}
              style={{
                padding: '12px 28px',
                background: `linear-gradient(135deg, ${ACCENT}, #b80500)`,
                border: 'none', borderRadius: 8, color: '#fff',
                fontFamily: 'var(--font-display)', fontSize: 11,
                fontWeight: 900, letterSpacing: '0.25em',
                textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: `0 4px 20px ${ACCENT}66`,
              }}
            >Suivant →</button>
          </div>
        )}

        {phase === 'lost' && (
          <div style={{
            textAlign: 'center', padding: 32,
            background: 'rgba(255,85,85,0.08)',
            border: '1.5px solid #ff5555', borderRadius: 12,
            animation: 'dgClueIn 0.5s ease',
          }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>❌</div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 24,
              fontWeight: 900, textTransform: 'uppercase',
              color: '#ff5555', marginBottom: 8,
            }}>Raté !</h2>
            <p style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 14,
              fontFamily: 'var(--font-heading)', marginBottom: 8,
            }}>
              C'était <strong style={{ color: '#fff' }}>{target.firstName} {target.lastName}</strong>
            </p>
            <button
              onClick={() => loadNew(drivers)}
              style={{
                padding: '12px 28px', marginTop: 8,
                background: `linear-gradient(135deg, ${ACCENT}, #b80500)`,
                border: 'none', borderRadius: 8, color: '#fff',
                fontFamily: 'var(--font-display)', fontSize: 11,
                fontWeight: 900, letterSpacing: '0.25em',
                textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: `0 4px 20px ${ACCENT}66`,
              }}
            >Réessayer →</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes dgClueIn {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}