import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { imgSrc } from '../utils/images';
import { useCursor } from '../context/CursorContext';

const GAMES = [
  { id: 'predictions',     title: 'Pronostics',     subtitle: 'Prédit le podium',      icon: '🎯', link: '/fan/predictions', playable: true, badge: 'POPULAIRE', description: "Choisis ton top 3 pour chaque GP et gagne jusqu'à 38 points par course." },
  { id: 'quiz',            title: 'Quiz F1',        subtitle: 'Teste tes connaissances',icon: '🧠', link: '/fan/quiz',        playable: true, description: '10 questions générées depuis la base F1. 15 secondes par question.' },
  { id: 'reaction',        title: 'Réflexes',       subtitle: 'Défie les pilotes F1',   icon: '⚡', link: '/fan/reaction',    playable: true, description: "5 feux F1 s'allument puis s'éteignent. Clique le plus vite possible." },
  { id: 'pitstop',         title: 'Pit Stop',       subtitle: 'Timing parfait',        icon: '🔧', link: '/fan/pitstop',     playable: true, badge: 'NOUVEAU', description: 'Clique quand le pneu est dans la zone verte. 5 rounds, timing parfait = 150 pts.' },
  { id: 'driver-guesser',  title: 'Driver Guesser', subtitle: 'Devine le pilote',      icon: '🏎️', link: '/fan/driver-guesser', playable: true, badge: 'NOUVEAU', description: '5 indices progressifs (pays, écurie, numéro…). Devine en moins de 3 essais.' },
  { id: 'circuit-guesser', title: 'Circuit Guesser',subtitle: 'Devine le circuit',     icon: '🏁', link: '/fan/circuit-guesser', playable: true, badge: 'NOUVEAU', description: 'Indices pays / longueur / virages / architecte. Identifie le circuit mystère.' },
  { id: 'wordle',          title: 'F1 Wordle',      subtitle: 'Mot du jour',            icon: '🔤', link: '/fan/wordle',      playable: true, badge: 'NOUVEAU', description: 'Devine le mot F1 de 5 lettres en 6 essais. Change chaque jour.' },
  { id: 'memory',          title: 'Memory',         subtitle: 'Paires de pilotes',     icon: '🃏', link: '/fan/memory',      playable: true, badge: 'NOUVEAU', description: 'Retourne les cartes et associe les paires de pilotes. Filtre par écurie !' },
];

export default function Games() {
  const navigate = useNavigate();
  const { setCursorColor, resetCursorColor } = useCursor();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const themeColor = '#e10600';

  useEffect(() => {
    setCursorColor(themeColor);
    return () => resetCursorColor();
  }, [themeColor, setCursorColor, resetCursorColor]);



  const fallbackImages = [
    'linear-gradient(135deg, #7a0300, #e10600)',
    'linear-gradient(135deg, #e10600, #ff1e00)',
    'linear-gradient(135deg, #5a0300, #e10600)',
    'linear-gradient(135deg, #1e41ff, #00d26a)',
  ];

  const gameBackdrops = {
    predictions: 'linear-gradient(135deg, #1e41ff 0%, #001a66 100%)',
    quiz: 'linear-gradient(135deg, #c084fc 0%, #5a1a8a 100%)',
    reaction: 'linear-gradient(135deg, #ff8700 0%, #7a3a00 100%)',
    pitstop: 'linear-gradient(135deg, #00d26a 0%, #007a3d 100%)',
    'driver-guesser': 'linear-gradient(135deg, #e10600 0%, #4a0200 100%)',
    'circuit-guesser': 'linear-gradient(135deg, #00d4ff 0%, #003a55 100%)',
    wordle: 'linear-gradient(135deg, #ffd700 0%, #7a5500 100%)',
    memory: 'linear-gradient(135deg, #ff2e88 0%, #7a0035 100%)',
   
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: 100, textAlign: 'center' }}>
        <div className="mono" style={{ color: themeColor, letterSpacing: '0.3em' }}>CHARGEMENT...</div>
      </div>
    );
  }

  const playableCount = GAMES.filter(g => g.playable).length;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60, position: 'relative' }}>
      <style>{`
        @keyframes gamesPulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes gamesGridShift { from { background-position: 0 0; } to { background-position: 60px 60px; } }
        @keyframes gamesFadeIn { from { opacity: 0; transform: translateY(30px) scale(0.96); filter: blur(6px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes gamesBadgePop { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 60% { transform: scale(1.2) rotate(8deg); opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes gamesScan { 0% { top: -60px; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
      `}</style>

      {/* HEADER */}
      <section style={{ position: 'relative', padding: '80px 32px 30px', overflow: 'hidden', background: `radial-gradient(ellipse at top, ${themeColor}22 0%, transparent 60%)` }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${themeColor}08 1px, transparent 1px), linear-gradient(90deg, ${themeColor}08 1px, transparent 1px)`, backgroundSize: '60px 60px', opacity: 0.6, animation: 'gamesGridShift 15s linear infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)`, boxShadow: `0 0 25px ${themeColor}` }} />

        <div className="container" style={{ position: 'relative', maxWidth: 1400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.4em', color: themeColor, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d26a', boxShadow: '0 0 8px #00d26a', animation: 'gamesPulse 2s infinite' }} />
                CENTRE DE JEUX
              </div>

              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', marginBottom: 16, color: '#fff', textTransform: 'uppercase' }}>
                Joue avec tes <span style={{ color: themeColor, fontStyle: 'italic', textShadow: `0 0 40px ${themeColor}88` }}>pilotes</span>
              </h1>

              <p style={{ color: 'var(--text-mid)', fontSize: 15, fontFamily: 'var(--font-heading)', maxWidth: 560, lineHeight: 1.6 }}>
                9 mini-jeux F1 pour tester tes connaissances, tes réflexes et ton intuition.
              </p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 20, padding: '8px 16px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${themeColor}55`, borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#fff' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d26a', boxShadow: '0 0 8px #00d26a', animation: 'gamesPulse 1.4s infinite' }} />
                {playableCount} JEU{playableCount > 1 ? 'X' : ''} DISPONIBLE{playableCount > 1 ? 'S' : ''}
              </div>
            </div>

            <Link to="/fan" style={{ padding: '12px 22px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${themeColor}66`, borderRadius: 8, color: themeColor, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: `0 0 20px ${themeColor}33`, transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = themeColor; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = `0 0 30px ${themeColor}`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.color = themeColor; e.currentTarget.style.boxShadow = `0 0 20px ${themeColor}33`; }}
            >← Mon espace</Link>
          </div>
        </div>
      </section>

      {/* GRILLE DE JEUX */}
      <section className="container" style={{ maxWidth: 1400, padding: '40px 32px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {GAMES.map((game, idx) => {
            const disabled = !game.playable;
            const bgImage = images[idx] ? imgSrc(images[idx].url) : null;
            const bgFallback = fallbackImages[idx % fallbackImages.length];
            const decorativeBg = gameBackdrops[game.id] || bgFallback;

            const Card = disabled ? 'div' : Link;
            const cardProps = disabled ? {} : { to: game.link };

            return (
              <Card
                key={game.id}
                {...cardProps}
                style={{
                  position: 'relative', minHeight: 320, borderRadius: 16, overflow: 'hidden',
                  textDecoration: 'none', color: 'inherit',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.55 : 1,
                  border: `1.5px solid ${disabled ? 'rgba(255,255,255,0.08)' : `${themeColor}66`}`,
                  transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  boxShadow: disabled ? 'none' : `0 10px 30px rgba(0,0,0,0.5)`,
                  animation: `gamesFadeIn 0.6s ease ${idx * 0.05}s both`,
                }}
                onMouseEnter={(e) => {
                  if (disabled) return;
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 30px 60px -20px ${themeColor}cc, 0 0 40px ${themeColor}44`;
                  e.currentTarget.style.borderColor = themeColor;
                }}
                onMouseLeave={(e) => {
                  if (disabled) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5)`;
                  e.currentTarget.style.borderColor = `${themeColor}66`;
                }}
              >
                <div style={{ position: 'absolute', inset: 0, backgroundImage: useImageBg ? `url(${bgImage})` : decorativeBg, backgroundSize: 'cover', backgroundPosition: 'center', filter: disabled ? 'grayscale(0.7) brightness(0.5)' : 'brightness(0.7)', transition: 'all 0.5s', zIndex: 0 }} />
                <div style={{ position: 'absolute', inset: 0, background: disabled ? 'linear-gradient(180deg, rgba(5,7,10,0.4) 0%, rgba(5,7,10,0.95) 100%)' : `linear-gradient(180deg, rgba(5,7,10,0.2) 0%, rgba(5,7,10,0.75) 40%, rgba(5,7,10,0.98) 100%)`, zIndex: 1 }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${themeColor}11 1px, transparent 1px), linear-gradient(90deg, ${themeColor}11 1px, transparent 1px)`, backgroundSize: '24px 24px', opacity: 0.4, zIndex: 1, pointerEvents: 'none' }} />

                <div style={{ position: 'absolute', top: 14, left: 14, width: 26, height: 26, borderTop: `2px solid ${disabled ? 'rgba(255,255,255,0.2)' : themeColor}`, borderLeft: `2px solid ${disabled ? 'rgba(255,255,255,0.2)' : themeColor}`, zIndex: 3 }} />
                <div style={{ position: 'absolute', bottom: 14, left: 14, width: 26, height: 26, borderBottom: `2px solid ${disabled ? 'rgba(255,255,255,0.2)' : themeColor}`, borderLeft: `2px solid ${disabled ? 'rgba(255,255,255,0.2)' : themeColor}`, zIndex: 3 }} />
                <div style={{ position: 'absolute', bottom: 14, right: 14, width: 26, height: 26, borderBottom: `2px solid ${disabled ? 'rgba(255,255,255,0.2)' : themeColor}`, borderRight: `2px solid ${disabled ? 'rgba(255,255,255,0.2)' : themeColor}`, zIndex: 3 }} />

                {!disabled && (
                  <div style={{ position: 'absolute', left: 0, right: 0, height: 100, background: `linear-gradient(180deg, transparent, ${themeColor}22, transparent)`, animation: 'gamesScan 3s ease-in-out infinite', pointerEvents: 'none', mixBlendMode: 'screen', zIndex: 2 }} />
                )}

                {game.badge && !disabled && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    padding: '5px 12px',
                    background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                    color: '#fff',
                    fontFamily: 'var(--font-display)',
                    fontSize: 8, letterSpacing: '0.25em',
                    fontWeight: 900,
                    borderRadius: 4,
                    boxShadow: `0 0 20px ${themeColor}aa`,
                    zIndex: 4,
                    animation: 'gamesBadgePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both',
                  }}>★ {game.badge}</div>
                )}

                <div style={{ position: 'relative', zIndex: 2, padding: '28px 24px 24px' }}>
                  <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 14, filter: disabled ? 'grayscale(0.5)' : `drop-shadow(0 0 20px ${themeColor}aa)` }}>{game.icon}</div>

                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, textTransform: 'uppercase', color: '#fff', lineHeight: 1, marginBottom: 6, letterSpacing: '-0.02em', textShadow: disabled ? 'none' : `0 0 30px ${themeColor}88` }}>{game.title}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.25em', color: disabled ? 'var(--text-dim)' : themeColor, fontWeight: 700, marginBottom: 12 }}>{game.subtitle}</div>

                  <p style={{ color: 'var(--text-mid)', fontSize: 12, fontFamily: 'var(--font-heading)', lineHeight: 1.6, margin: 0, marginBottom: 16 }}>{game.description}</p>

                  {!disabled && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 100%)`, borderRadius: 6, fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff', boxShadow: `0 4px 20px ${themeColor}66`, clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
                      Jouer <span style={{ fontSize: 13 }}>→</span>
                    </div>
                  )}

                  {disabled && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>⏳ Bientôt</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}