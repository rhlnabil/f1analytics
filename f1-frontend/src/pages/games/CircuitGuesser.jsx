import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { flagSrc } from '../../utils/images';

const ACCENT = '#e10600';

export default function CircuitGuesser() {
  const [circuits, setCircuits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [revealed, setRevealed] = useState(1);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState('playing');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  const loadNew = (pool) => {
    if (!pool || pool.length === 0) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setTarget(next);
    setRevealed(1);
    setAttempts(0);
    setGuess('');
    setSuggestions([]);
    setPhase('playing');
  };

  useEffect(() => {
    api.get('/circuits')
      .then(r => {
        const pool = (r.data || []).filter(c => c.name);
        setCircuits(pool);
        loadNew(pool);
      })
      .catch(() => setCircuits([]))
      .finally(() => setLoading(false));
  }, []);

  const submitGuess = (name) => {
    if (phase !== 'playing' || !target) return;
    const clean = (name || '').trim().toLowerCase();
    if (!clean) return;

    const correct = (target.name || '').toLowerCase() === clean ||
                    ((target.name || '').toLowerCase().includes(clean) && clean.length > 4);

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (correct) {
      const points = Math.max(10, 100 - (newAttempts - 1) * 25 - (revealed - 1) * 10);
      setScore(s => s + points);
      setStreak(s => s + 1);
      setPhase('won');
    } else if (newAttempts >= 3) {
      setStreak(0);
      setPhase('lost');
    } else {
      setGuess('');
      setSuggestions([]);
      if (revealed < 5) setRevealed(revealed + 1);
    }
  };

  const onInputChange = (v) => {
    setGuess(v);
    if (v.trim().length < 1) { setSuggestions([]); return; }
    const q = v.toLowerCase();
    const matches = circuits
      .filter(c => (c.name || '').toLowerCase().includes(q) ||
                   (c.country || '').toLowerCase().includes(q))
      .slice(0, 5);
    setSuggestions(matches);
  };

  if (loading) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', color: ACCENT, letterSpacing: '0.3em', fontSize: 11, fontWeight: 700 }}>
        ◆ CHARGEMENT...
      </div>
    </div>
  );

  if (!target) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-dim)' }}>Pas de circuits en DB</h2>
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
        <span>{target.country || '—'}</span>
      </div>
    )},
    { key: 'length', icon: '📏', label: 'LONGUEUR', value: target.lengthKm ? `${target.lengthKm} km` : '—' },
    { key: 'turns', icon: '🔄', label: 'VIRAGES', value: target.numberOfTurns ?? '—' },
    { key: 'firstGP', icon: '📅', label: '1er GP', value: target.firstGrandPrix || '—' },
    { key: 'architect', icon: '📐', label: 'ARCHITECTE', value: target.architect || '—' },
  ];

  const flagBlur = Math.max(0, 20 - revealed * 4);

  return (
    <div style={{
      minHeight: '100vh', padding: '60px 24px 100px',
      background: 'radial-gradient(ellipse at top, #1a0a0a 0%, #050508 70%)',
      position: 'relative',
    }}>
      <Link to="/fan/games" style={{
        position: 'absolute', top: 20, left: 20,
        color: 'var(--text-dim)', fontFamily: 'var(--font-display)',
        fontSize: 11, letterSpacing: '0.3em', fontWeight: 700,
        textDecoration: 'none', textTransform: 'uppercase',
      }}>← JEUX</Link>

      <div style={{
        position: 'absolute', top: 20, right: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11,
          letterSpacing: '0.3em', color: ACCENT, fontWeight: 700,
        }}>🏁 CIRCUIT GUESSER</div>
        {streak > 0 && (
          <div style={{
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

      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginBottom: 20, fontFamily: 'var(--font-display)',
          fontSize: 11, letterSpacing: '0.2em', fontWeight: 700,
        }}>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>
            SCORE <span style={{ color: ACCENT, marginLeft: 6 }}>{score}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 32,
            fontWeight: 900, textTransform: 'uppercase',
            color: '#fff', marginBottom: 8, letterSpacing: '-0.02em',
          }}>Devine le circuit</h1>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 10,
            letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)',
            fontWeight: 700,
          }}>
            {attempts}/3 tentatives · {revealed}/5 indices
          </p>
        </div>

        {target.countryCode && (
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 20,
          }}>
            <div style={{
              width: 120, height: 80,
              borderRadius: 8, overflow: 'hidden',
              border: `2px solid ${ACCENT}`,
              boxShadow: `0 0 30px ${ACCENT}88`,
              position: 'relative',
            }}>
              <img
                src={flagSrc(target.countryCode)}
                alt="Mystery flag"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: `blur(${flagBlur}px) saturate(${0.5 + revealed * 0.1})`,
                  transition: 'filter 0.6s ease',
                }}
              />
              {flagBlur > 0 && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'grid', placeItems: 'center',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff', fontSize: 20,
                  fontWeight: 900,
                  textShadow: '0 0 10px rgba(0,0,0,0.9)',
                }}>?</div>
              )}
            </div>
          </div>
        )}

        <div style={{
          background: 'linear-gradient(160deg, rgba(13,13,20,0.98) 0%, rgba(5,7,10,0.98) 100%)',
          border: `1.5px solid ${ACCENT}55`, borderRadius: 12,
          padding: '24px 28px', marginBottom: 24,
        }}>
          {cluesDisplay.slice(0, revealed).map((clue, i) => (
            <div key={clue.key} style={{
              display: 'grid', gridTemplateColumns: '110px 1fr',
              alignItems: 'center', gap: 16,
              padding: '14px 0',
              borderBottom: i < revealed - 1 ? '1px dashed rgba(255,255,255,0.08)' : 'none',
              animation: `cgClueIn 0.4s ease ${i * 0.1}s both`,
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
        </div>

        {phase === 'playing' && (
          <div style={{ position: 'relative' }}>
            <input
              value={guess}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitGuess(guess)}
              placeholder="Tape le nom du circuit..."
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
                {suggestions.map(c => (
                  <button
                    key={c.id}
                    onClick={() => submitGuess(c.name)}
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
                    }}>{c.name}</span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: 'var(--font-display)',
                      fontSize: 10, color: 'rgba(255,255,255,0.5)',
                    }}>{c.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === 'won' && (
          <div style={{
            textAlign: 'center', padding: 32,
            background: 'rgba(0,210,106,0.08)',
            border: '1.5px solid #00d26a', borderRadius: 12,
            animation: 'cgClueIn 0.5s ease',
          }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🎉</div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 24,
              fontWeight: 900, textTransform: 'uppercase',
              color: '#00d26a', marginBottom: 8,
            }}>Bien joué !</h2>
            <p style={{
              color: '#fff', fontFamily: 'var(--font-heading)',
              fontSize: 18, fontWeight: 900, marginBottom: 16,
            }}>{target.name}</p>
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
              onClick={() => loadNew(circuits)}
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
            animation: 'cgClueIn 0.5s ease',
          }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>❌</div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 24,
              fontWeight: 900, textTransform: 'uppercase',
              color: '#ff5555', marginBottom: 8,
            }}>Raté !</h2>
            <p style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 14,
              fontFamily: 'var(--font-heading)', marginBottom: 20,
            }}>
              C'était <strong style={{ color: '#fff' }}>{target.name}</strong>
            </p>
            <button
              onClick={() => loadNew(circuits)}
              style={{
                padding: '12px 28px',
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
        @keyframes cgClueIn {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}