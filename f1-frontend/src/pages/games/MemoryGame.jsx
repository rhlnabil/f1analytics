import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { imgSrc } from '../../utils/images';

const ACCENT = '#e10600';
const TEAM_FILTER_KEY = 'f1memory_team_filter';

export default function MemoryGame() {
  const [cards, setCards] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamFilter, setTeamFilter] = useState(() => {
    try { return localStorage.getItem(TEAM_FILTER_KEY) || 'all'; } catch { return 'all'; }
  });
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [wrongMoves, setWrongMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [best, setBest] = useState(() => {
    const raw = localStorage.getItem('f1_memory_best');
    return raw ? parseInt(raw, 10) : null;
  });

  useEffect(() => {
    Promise.all([
      api.get('/drivers').catch(() => ({ data: [] })),
      api.get('/teams').catch(() => ({ data: [] })),
    ]).then(([dRes, tRes]) => {
      setAllDrivers((dRes.data || []).filter(d => d.lastName));
      setTeams(tRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const buildCards = (pool) => {
    const built = [];
    pool.forEach(d => {
      for (let k = 0; k < 2; k++) {
        built.push({
          id: `${d.id}-${k}`,
          driverId: d.id,
          name: d.lastName,
          photo: d.actionPhotoUrl || d.transitionPhotoUrl,
          teamColor: d.teamColor || '#e10600',
        });
      }
    });
    return built.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    if (loading) return;
    let pool = allDrivers;
    if (teamFilter !== 'all') {
      pool = allDrivers.filter(d => String(d.teamId) === String(teamFilter));
    }
    if (pool.length > 10) pool = pool.slice(0, 10);
    setCards(buildCards(pool));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setWrongMoves(0);
    setSeconds(0);
    setPhase('idle');
  }, [loading, allDrivers, teamFilter]);

  const totalPairs = cards.length / 2;

  useEffect(() => {
    if (phase !== 'playing') return;
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, [phase]);

  useEffect(() => {
    if (flipped.length === 2) {
      const [a, b] = flipped;
      const cardA = cards.find(c => c.id === a);
      const cardB = cards.find(c => c.id === b);
      setMoves(m => m + 1);
      if (cardA && cardB && cardA.driverId === cardB.driverId) {
        setTimeout(() => {
          setMatched(prev => [...prev, cardA.driverId]);
          setFlipped([]);
        }, 500);
      } else {
        setWrongMoves(w => w + 1);
        setTimeout(() => setFlipped([]), 800);
      }
    }
  }, [flipped, cards]);

  useEffect(() => {
    if (totalPairs > 0 && matched.length === totalPairs && phase === 'playing') {
      setPhase('won');
      setBest(prev => {
        if (prev === null || moves < prev) {
          localStorage.setItem('f1_memory_best', String(moves));
          return moves;
        }
        return prev;
      });
    }
  }, [matched, moves, phase, totalPairs]);

  const flip = (card) => {
    if (phase === 'idle') setPhase('playing');
    if (flipped.length >= 2) return;
    if (flipped.includes(card.id)) return;
    if (matched.includes(card.driverId)) return;
    setFlipped(prev => [...prev, card.id]);
  };

  const reset = () => {
    setCards(cards.slice().sort(() => Math.random() - 0.5));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setWrongMoves(0);
    setSeconds(0);
    setPhase('idle');
  };

  const changeFilter = (val) => {
    setTeamFilter(val);
    try { localStorage.setItem(TEAM_FILTER_KEY, val); } catch {}
  };

  if (loading) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', color: ACCENT, letterSpacing: '0.3em', fontSize: 11, fontWeight: 700 }}>◆ CHARGEMENT...</div>
    </div>
  );

  if (cards.length === 0) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-dim)' }}>Pas de pilotes pour ce filtre</h2>
      <button onClick={() => changeFilter('all')} style={{ marginTop: 16, padding: '12px 24px', background: ACCENT, border: 'none', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', cursor: 'pointer' }}>Tous les pilotes</button>
      <Link to="/fan/games" style={{ color: ACCENT, marginLeft: 16 }}>← Jeux</Link>
    </div>
  );

  const isPerfect = phase === 'won' && wrongMoves === 0;
  const speedRank =
    seconds < 30 ? { label: '⚡ SPEEDRUN', color: '#FFD700' } :
    seconds < 60 ? { label: '🔥 RAPIDE', color: '#ff8700' } :
    seconds < 120 ? { label: '✅ BIEN', color: '#00d26a' } :
                   { label: '⏱ CHILL', color: '#8a8a95' };

  return (
    <div style={{ minHeight: '100vh', padding: '60px 24px 100px', background: 'radial-gradient(ellipse at top, #1a0a0a 0%, #050508 70%)', position: 'relative' }}>
      <Link to="/fan/games" style={{ position: 'absolute', top: 20, left: 20, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase' }}>← JEUX</Link>
      <div style={{ position: 'absolute', top: 20, right: 20, fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', color: ACCENT, fontWeight: 700 }}>🃏 MEMORY · {totalPairs} PAIRES</div>

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 30, fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>Memory · Pilotes F1</h1>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{totalPairs} paires · {cards.length} cartes</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => changeFilter('all')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', background: teamFilter === 'all' ? ACCENT : 'rgba(0,0,0,0.5)', border: `1px solid ${teamFilter === 'all' ? ACCENT : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: '#fff' }}>TOUS</button>
          {teams.map(t => (
            <button key={t.id} onClick={() => changeFilter(String(t.id))} style={{
              all: 'unset', cursor: 'pointer', padding: '6px 12px',
              background: teamFilter === String(t.id) ? t.color : 'rgba(0,0,0,0.5)',
              border: `1px solid ${teamFilter === String(t.id) ? t.color : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 900,
              letterSpacing: '0.15em', color: '#fff',
            }}>{t.name?.slice(0, 8).toUpperCase()}</button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 20px', background: 'rgba(10,10,15,0.7)', border: `1px solid ${ACCENT}44`, borderRadius: 10, marginBottom: 20, fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.15em', fontWeight: 700, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>⏱ <span style={{ color: '#fff', marginLeft: 4 }}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span></div>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>🎯 <span style={{ color: '#fff', marginLeft: 4 }}>{moves}</span></div>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>❌ <span style={{ color: '#ff5555', marginLeft: 4 }}>{wrongMoves}</span></div>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>✅ <span style={{ color: '#00d26a', marginLeft: 4 }}>{matched.length}/{totalPairs}</span></div>
          {best !== null && <div style={{ color: 'rgba(255,255,255,0.6)' }}>🏆 <span style={{ color: '#FFD700', marginLeft: 4 }}>{best}</span></div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8, marginBottom: 20 }}>
          {cards.map(card => {
            const isFlipped = flipped.includes(card.id) || matched.includes(card.driverId);
            const isMatched = matched.includes(card.driverId);
            return (
              <div key={card.id} onClick={() => flip(card)} style={{ position: 'relative', aspectRatio: '3 / 4', perspective: 1000, cursor: isFlipped ? 'default' : 'pointer' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)', transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: `linear-gradient(135deg, ${ACCENT}44 0%, #0a0a12 100%)`, border: `1.5px solid ${ACCENT}66`, borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 22, color: 'rgba(255,255,255,0.35)' }}>🏁</div>
                  <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: isMatched ? `linear-gradient(135deg, ${card.teamColor}44 0%, #0a0a12 100%)` : 'linear-gradient(135deg, #0a0a12 0%, #050508 100%)',
                    border: `1.5px solid ${isMatched ? '#00d26a' : card.teamColor}`,
                    borderRadius: 6, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: isMatched ? '0 0 15px rgba(0,210,106,0.5)' : 'none',
                  }}>
                    {card.photo ? (
                      <img src={imgSrc(card.photo)} alt={card.name} style={{ flex: 1, width: '100%', objectFit: 'cover', objectPosition: 'center 5%', minHeight: 0 }} />
                    ) : (
                      <div style={{ flex: 1, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, color: card.teamColor }}>{card.name?.slice(0, 2).toUpperCase()}</div>
                    )}
                    <div style={{ padding: '4px 2px', fontFamily: 'var(--font-heading)', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#fff', textAlign: 'center', background: 'rgba(0,0,0,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {phase === 'won' && (
          <div style={{
            textAlign: 'center', padding: 24,
            background: isPerfect ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,135,0,0.08))' : 'rgba(0,210,106,0.08)',
            border: `1.5px solid ${isPerfect ? '#FFD700' : '#00d26a'}`,
            borderRadius: 12, marginBottom: 16,
            animation: 'memPop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ fontSize: 44, marginBottom: 6 }}>{isPerfect ? '⭐' : '🎉'}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: isPerfect ? '#FFD700' : '#00d26a', textTransform: 'uppercase', marginBottom: 8 }}>
              {isPerfect ? 'PERFECT RUN !' : 'GAGNÉ !'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <div style={{ padding: '4px 12px', background: `${speedRank.color}22`, border: `1px solid ${speedRank.color}`, borderRadius: 4, fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', color: speedRank.color }}>{speedRank.label}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{moves} coups · {wrongMoves} erreurs · {seconds}s · {totalPairs} paires</div>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button onClick={reset} style={{ padding: '14px 28px', background: `linear-gradient(135deg, ${ACCENT}, #b80500)`, border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `0 4px 20px ${ACCENT}66` }}>⟳ Rejouer</button>
        </div>
      </div>

      <style>{`
        @keyframes memPop { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}