import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { API_BASE } from '../api/axios';
import { flagSrc } from '../utils/images';

/* ============================================================ */
/* ======================= HOOKS =============================== */
/* ============================================================ */

function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCountUp(target, duration = 1200, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target == null) return;
    const numeric = Number(target);
    if (isNaN(numeric)) return;
    let raf;
    const t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(numeric * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function useMouseParallax(strength = 10) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setPos({ x: x * strength, y: y * strength });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [strength]);
  return pos;
}

function Reveal({ children, delay = 0, direction = 'up', style = {} }) {
  const [ref, visible] = useScrollReveal();
  const transforms = {
    up: 'translateY(50px)',
    left: 'translateX(-50px)',
    right: 'translateX(50px)',
    scale: 'scale(0.92)',
  };
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity 0.9s cubic-bezier(0.4,0,0.2,1) ${delay}s, transform 0.9s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================ */
/* ============ CIRCUIT CARD — DRAPEAU HÉROS ================== */
/* ============================================================ */

function CircuitCard({ circuit, index }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const imgSrc = url => !url ? null
    : url.startsWith('http') ? url : API_BASE + url;

  const onMove = useCallback(e => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }, []);

  const roundNumber = String(index + 1).padStart(2, '0');
  const cc = circuit.countryCode?.toUpperCase() || '';

  return (
    <Reveal delay={index * 0.06} direction="up">
      <Link
        to={`/circuits/${circuit.id}`}
        ref={cardRef}
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          display: 'block',
          textDecoration: 'none',
          color: 'inherit',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
          border: `2px solid ${hovered ? '#e10600' : 'rgba(255,255,255,0.08)'}`,
          transition: 'border-color 0.4s, box-shadow 0.4s, transform 0.4s cubic-bezier(0.4,0,0.2,1)',
          transform: hovered ? 'translateY(-10px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 40px 80px -20px rgba(225,6,0,0.8), 0 0 60px rgba(225,6,0,0.4)'
            : '0 10px 30px rgba(0,0,0,0.5)',
          cursor: 'pointer',
        }}
      >
        {/* ============ DRAPEAU EN BANNIÈRE ============ */}
        <div style={{
          position: 'relative',
          height: 120,
          overflow: 'hidden',
          background: `linear-gradient(135deg, #1a0505, #0a0a0a)`,
        }}>
          {/* Drapeau waving en grand */}
          {circuit.countryCode && (
            <img
              src={flagSrc(circuit.countryCode)}
              alt={circuit.countryCode}
              className="card-flag-wave"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.85,
                filter: hovered
                  ? 'brightness(1) saturate(1.3) contrast(1.1)'
                  : 'brightness(0.75) saturate(1.1)',
                transformOrigin: 'left center',
                transition: 'filter 0.5s',
              }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}

          {/* Overlay sombre */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(5,7,10,0.2) 0%, rgba(5,7,10,0.8) 70%, #05070a 100%)`,
          }} />

          {/* Diagonale déco */}
          <div style={{
            position: 'absolute',
            top: -40, right: -40,
            width: 200, height: 200,
            background: `linear-gradient(135deg, transparent 45%, rgba(225,6,0,0.25) 45%, rgba(225,6,0,0.25) 55%, transparent 55%)`,
            transform: 'rotate(15deg)',
            opacity: hovered ? 1 : 0.5,
            transition: 'opacity 0.4s',
            pointerEvents: 'none',
          }} />

          {/* Shine radial qui suit la souris */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(255,255,255,0.3) 0%, transparent 40%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.4s',
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }} />

          {/* Scan line */}
          {hovered && (
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              height: 60,
              background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent)`,
              animation: 'cc-scan 1.6s ease-in-out infinite',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }} />
          )}

          {/* Numéro watermark */}
          <div style={{
            position: 'absolute',
            top: 8, right: 12,
            fontFamily: 'var(--font-display)',
            fontSize: 80,
            fontWeight: 900,
            fontStyle: 'italic',
            color: 'transparent',
            WebkitTextStroke: `1.5px rgba(255,255,255,0.25)`,
            lineHeight: 1,
            letterSpacing: '-0.06em',
            pointerEvents: 'none',
            userSelect: 'none',
            opacity: hovered ? 0.9 : 0.5,
            transition: 'opacity 0.4s',
          }}>
            {roundNumber}
          </div>

          {/* Badge CC géant dans le coin */}
          {cc && (
            <div style={{
              position: 'absolute',
              top: 14, left: 14,
              padding: '8px 16px',
              background: 'rgba(0,0,0,0.85)',
              border: `2px solid #e10600`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: `0 0 25px rgba(225,6,0,0.6)`,
              zIndex: 3,
            }}>
              <span style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: '#e10600',
                boxShadow: '0 0 10px #e10600',
                animation: hovered ? 'pulseDot 1s ease-in-out infinite' : 'none',
              }} />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: '0.25em',
                color: '#fff',
                textShadow: '0 0 12px rgba(225,6,0,0.8)',
              }}>
                {cc}
              </span>
            </div>
          )}

          {/* Drapeau rond waving en haut droite (petit badge) */}
          {circuit.countryCode && (
            <div style={{
              position: 'absolute',
              top: 14, right: 14,
              width: 46, height: 46,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid #e10600`,
              boxShadow: `0 0 25px rgba(225,6,0,0.8), 0 4px 12px rgba(0,0,0,0.9)`,
              background: '#0a0a0a',
              zIndex: 3,
            }}>
              <img
                src={flagSrc(circuit.countryCode)}
                alt={circuit.countryCode}
                className="flag-badge-wave"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        {/* ============ CONTENU ============ */}
        <div style={{ padding: '24px 26px 26px', position: 'relative' }}>

          {/* Pays */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}>
            <span style={{
              width: 6, height: 6,
              background: '#e10600',
              boxShadow: '0 0 8px #e10600',
              transform: 'rotate(45deg)',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              letterSpacing: '0.35em',
              color: 'var(--text-dim)',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              {circuit.country || '—'}
            </span>
          </div>

          {/* Nom */}
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 26,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: '#fff',
            margin: 0,
            marginBottom: 20,
            transition: 'color 0.3s',
            textShadow: hovered ? '0 0 30px rgba(225,6,0,0.8)' : 'none',
          }}>
            {circuit.name}
          </h3>

          {/* Barre animée */}
          <div style={{
            width: hovered ? '100%' : '30%',
            height: 2,
            background: 'linear-gradient(90deg, #e10600, transparent)',
            boxShadow: hovered ? '0 0 15px #e10600' : 'none',
            marginBottom: 20,
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s',
          }} />

          {/* Mini grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
          }}>
            {/* Longueur */}
            <div style={{
              padding: '10px 10px',
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${hovered ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 6,
              transition: 'border-color 0.4s',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 7,
                letterSpacing: '0.25em',
                color: 'var(--text-dim)',
                fontWeight: 700,
                marginBottom: 5,
              }}>LONG</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 900,
                color: '#e10600',
                textShadow: '0 0 10px rgba(225,6,0,0.5)',
              }}>
                {circuit.lengthKm != null ? `${circuit.lengthKm}` : '—'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 7,
                color: 'var(--text-dim)',
                marginTop: 2,
              }}>km</div>
            </div>

            {/* Virages */}
            <div style={{
              padding: '10px 10px',
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${hovered ? 'rgba(255,135,0,0.5)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 6,
              transition: 'border-color 0.4s',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 7,
                letterSpacing: '0.25em',
                color: 'var(--text-dim)',
                fontWeight: 700,
                marginBottom: 5,
              }}>VIR</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 900,
                color: '#ff8700',
                textShadow: '0 0 10px rgba(255,135,0,0.5)',
              }}>
                {circuit.numberOfTurns ?? '—'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 7,
                color: 'var(--text-dim)',
                marginTop: 2,
              }}>turns</div>
            </div>

            {/* Depuis */}
            <div style={{
              padding: '10px 10px',
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${hovered ? 'rgba(30,65,255,0.5)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 6,
              transition: 'border-color 0.4s',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 7,
                letterSpacing: '0.25em',
                color: 'var(--text-dim)',
                fontWeight: 700,
                marginBottom: 5,
              }}>DEPUIS</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 900,
                color: '#1e41ff',
                textShadow: '0 0 10px rgba(30,65,255,0.5)',
              }}>
                {circuit.firstGrandPrix || '—'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 7,
                color: 'var(--text-dim)',
                marginTop: 2,
              }}>GP</div>
            </div>
          </div>

          {/* CTA en bas */}
          <div style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px dashed rgba(255,255,255,0.1)',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9,
              letterSpacing: '0.35em',
              color: hovered ? '#e10600' : 'var(--text-dim)',
              fontWeight: 700,
              transition: 'color 0.3s',
            }}>
              {hovered ? '◆ VOIR LE DÉTAIL' : '◆ DÉTAIL'}
            </span>
            <span style={{
              fontSize: 20,
              color: '#e10600',
              transform: hovered ? 'translateX(8px)' : 'translateX(0)',
              transition: 'transform 0.4s',
              textShadow: hovered ? '0 0 15px #e10600' : 'none',
            }}>
              →
            </span>
          </div>
        </div>
      </Link>

      <style>{`
        @keyframes cc-scan {
          0%   { top: -60px; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes cardFlagWave {
          0%   { transform: perspective(1200px) rotateY(0deg) skewY(0deg); }
          20%  { transform: perspective(1200px) rotateY(3deg) skewY(-1deg); }
          40%  { transform: perspective(1200px) rotateY(-2deg) skewY(0.6deg); }
          60%  { transform: perspective(1200px) rotateY(4deg) skewY(-1.2deg); }
          80%  { transform: perspective(1200px) rotateY(-2.5deg) skewY(0.8deg); }
          100% { transform: perspective(1200px) rotateY(0deg) skewY(0deg); }
        }
        @keyframes flagBadgeWave {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25%      { transform: scale(1.05) rotate(-2deg); }
          75%      { transform: scale(1.03) rotate(2deg); }
        }
        .card-flag-wave {
          animation: cardFlagWave 5s ease-in-out infinite;
        }
        .flag-badge-wave {
          animation: flagBadgeWave 3s ease-in-out infinite;
        }
      `}</style>
    </Reveal>
  );
}

/* ============================================================ */
/* ==================== MAIN COMPONENT ========================= */
/* ============================================================ */

export default function Circuits() {
  const { t } = useTranslation();
  const [circuits, setCircuits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [heroVisible, setHeroVisible] = useState(false);

  const parallax = useMouseParallax(12);

  useEffect(() => {
    api.get('/circuits')
      .then(r => setCircuits(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => setHeroVisible(true), 200);
  }, [loading]);

  const circuitCount = useCountUp(circuits.length, 1200, heroVisible);

  const filtered = useMemo(() => {
    if (!search.trim()) return circuits;
    const q = search.toLowerCase();
    return circuits.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.country || '').toLowerCase().includes(q) ||
      (c.firstGrandPrix || '').toLowerCase().includes(q)
    );
  }, [circuits, search]);

  if (loading) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <div className="mono" style={{ color: 'var(--f1-red)', letterSpacing: '0.3em' }}>
        CHARGEMENT...
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes heroGridShift {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
        }
        @keyframes checkeredSlide {
          from { background-position: 0 0; }
          to   { background-position: 40px 0; }
        }
        @keyframes heroFlagWave {
          0%   { transform: perspective(1000px) rotateY(0deg) skewY(0deg); }
          25%  { transform: perspective(1000px) rotateY(4deg) skewY(-1.5deg); }
          50%  { transform: perspective(1000px) rotateY(-3deg) skewY(1deg); }
          75%  { transform: perspective(1000px) rotateY(5deg) skewY(-1.8deg); }
          100% { transform: perspective(1000px) rotateY(0deg) skewY(0deg); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(225,6,0,0.6), 0 0 60px rgba(225,6,0,0.3); }
          50%      { box-shadow: 0 0 50px rgba(225,6,0,0.9), 0 0 100px rgba(225,6,0,0.5); }
        }
      `}</style>

      {/* ============================================================ */}
      {/* ============ HERO AVEC DRAPEAUX FLOTTANTS ================= */}
      {/* ============================================================ */}
      <section style={{
        position: 'relative',
        padding: '80px 32px 60px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at top left, rgba(225,6,0,0.15), transparent 60%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(225,6,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(225,6,0,0.06) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.6,
          animation: 'heroGridShift 15s linear infinite',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 8,
          backgroundImage: `
            linear-gradient(45deg, rgba(225,6,0,0.2) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(225,6,0,0.2) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(225,6,0,0.2) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(225,6,0,0.2) 75%)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          animation: 'checkeredSlide 3s linear infinite',
          opacity: 0.9,
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          pointerEvents: 'none', opacity: 0.4,
        }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${15 + i * 14}%`,
              left: 0, right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${i % 2 ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.15)'}, transparent)`,
              animation: `speedLine ${4 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
            }} />
          ))}
        </div>

        {/* Drapeaux flottants décoratifs en background */}
        {circuits.slice(0, 8).map((c, i) => c.countryCode && (
          <div key={c.id} style={{
            position: 'absolute',
            top: `${10 + (i % 4) * 22}%`,
            left: i % 2 === 0 ? `${5 + i * 8}%` : 'auto',
            right: i % 2 === 1 ? `${5 + i * 5}%` : 'auto',
            opacity: 0.08,
            animation: `floatBadge ${4 + i * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            pointerEvents: 'none',
            zIndex: 1,
          }}>
            <img
              src={flagSrc(c.countryCode)}
              alt=""
              style={{
                height: 90,
                width: 'auto',
                borderRadius: 6,
                animation: 'heroFlagWave 5s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          </div>
        ))}

        <div className="container" style={{
          position: 'relative', maxWidth: 1400,
          transform: `translate(${parallax.x * 0.4}px, ${parallax.y * 0.4}px)`,
          transition: 'transform 0.3s ease-out',
          zIndex: 2,
        }}>
          <div className="fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 2, background: 'var(--f1-red)' }} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 11,
                letterSpacing: '0.4em', color: 'var(--f1-red)', fontWeight: 700,
              }}>
                LES LÉGENDES DE L'ASPHALTE
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 900,
              lineHeight: 0.9,
              marginBottom: 20,
              letterSpacing: '-0.03em',
            }}>
              LES{' '}
              <span style={{
                color: 'var(--f1-red)',
                fontStyle: 'italic',
                textShadow: '0 0 40px rgba(225,6,0,0.5)',
              }}>
                CIRCUITS
              </span>
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', marginTop: 24 }}>
              <p style={{
                color: 'var(--text-mid)', fontSize: 17,
                margin: 0, fontFamily: 'var(--font-heading)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28, fontWeight: 900,
                  color: 'var(--f1-red)',
                  marginRight: 10,
                }}>
                  {circuitCount}
                </span>
                circuit{circuits.length > 1 ? 's' : ''} dans le championnat
              </p>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px',
                background: 'rgba(225,6,0,0.15)',
                border: '1px solid rgba(225,6,0,0.3)',
                borderRadius: 4,
                fontFamily: 'var(--font-display)', fontSize: 11,
                fontWeight: 700, letterSpacing: '0.15em',
                color: 'var(--f1-red)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--f1-red)',
                  animation: 'pulseDot 2s infinite',
                }} />
                CALENDRIER ACTIF
              </div>
            </div>

            <div style={{ marginTop: 40, maxWidth: 520 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un circuit, un pays, une année..."
                  style={{
                    width: '100%',
                    padding: '16px 52px 16px 20px',
                    background: 'rgba(15,15,22,0.9)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--f1-white)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    outline: 'none',
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--f1-red)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                />
                <span style={{
                  position: 'absolute', right: 20, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18, color: 'var(--f1-red)',
                  pointerEvents: 'none',
                }}>🔍</span>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 16, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 24, height: 24,
                      background: 'var(--f1-red)',
                      border: 'none', borderRadius: '50%',
                      color: '#fff', cursor: 'pointer',
                      padding: 0, fontSize: 14,
                      display: 'grid', placeItems: 'center',
                    }}>×</button>
                )}
              </div>
              {search && (
                <p style={{
                  marginTop: 12, fontSize: 13,
                  color: 'var(--text-dim)', fontStyle: 'italic',
                }}>
                  {filtered.length} résultat{filtered.length > 1 ? 's' : ''} pour « {search} »
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* GRILLE */}
      <section className="container" style={{ padding: '40px 32px 100px', maxWidth: 1400 }}>
        {circuits.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🛣️</div>
            <h3 style={{ color: 'var(--text-dim)', marginBottom: 8 }}>Aucun circuit</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🔍</div>
            <h3 style={{ color: 'var(--text-dim)', marginBottom: 8 }}>Aucun résultat</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              Essaie avec un autre nom, un autre pays ou une autre année.
            </p>
          </div>
        ) : (
          <div className="grid-3" style={{ gap: 28 }}>
            {filtered.map((c, idx) => (
              <CircuitCard key={c.id} circuit={c} index={idx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}