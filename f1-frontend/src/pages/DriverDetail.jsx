import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import api from '../api/axios';
import { imgSrc, flagSrc } from '../utils/images';
import { findCarImage } from '../utils/cars';
import { useCursor } from '../context/CursorContext';
import DriverCountryMap from '../components/DriverCountryMap';
import CareerTimeline from '../components/CareerTimeline';   // ✅ NOUVEAU

/* ============================================================ */
/* ======================= HOOKS =============================== */
/* ============================================================ */

function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useMouseParallax(strength = 12) {
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

function useTilt(max = 8) {
  const ref = useRef(null);
  const [t, setT] = useState({ rx: 0, ry: 0 });
  const onMove = useCallback(e => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * max, ry: px * max });
  }, [max]);
  const onLeave = useCallback(() => setT({ rx: 0, ry: 0 }), []);
  return [ref, t, { onMouseMove: onMove, onMouseLeave: onLeave }];
}

/* ============================================================ */
/* ==================== REVEAL WRAPPER ========================= */
/* ============================================================ */

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
/* ==================== HERO SIGNATURE ========================= */
/* ============================================================ */

function HeroSignature({ driver, teamColor }) {
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [sparks, setSparks] = useState([]);

  useEffect(() => {
    if (!driver.signatureImage) return;
    const t1 = setTimeout(() => setPlaying(true), 400);
    const t2 = setTimeout(() => {
      setSparks(
        Array.from({ length: 14 }).map((_, i) => ({
          id: i,
          x: 5 + Math.random() * 90,
          y: 20 + Math.random() * 60,
          size: 2 + Math.random() * 4,
          delay: 0.2 + Math.random() * 1.0,
          drift: -10 - Math.random() * 40,
          side: Math.random() > 0.5 ? 1 : -1,
        }))
      );
    }, 400);
    const t3 = setTimeout(() => setDone(true), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [driver.signatureImage]);

  if (!driver.signatureImage) return null;

  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      height: 90,
      paddingLeft: 20,
      marginLeft: 4,
      borderLeft: `1px solid ${teamColor}44`,
    }}>
      <div style={{
        position: 'absolute',
        inset: -30,
        background: `radial-gradient(ellipse, ${teamColor}55 0%, ${teamColor}22 40%, transparent 75%)`,
        filter: 'blur(28px)',
        pointerEvents: 'none',
        opacity: playing ? 1 : 0,
        transition: 'opacity 0.8s',
      }} />

      <div style={{
        position: 'relative',
        animation: playing ? 'sigWobble 1.4s ease-in-out' : 'none',
      }}>
        <div style={{
          position: 'relative',
          clipPath: playing
            ? 'inset(-15% -15% -15% -15%)'
            : 'inset(-15% 100% -15% -15%)',
          transition: 'clip-path 1.3s cubic-bezier(0.65, 0, 0.35, 1)',
        }}>
          <img
            src={imgSrc(driver.signatureImage)}
            alt={`Signature ${driver.lastName}`}
            style={{
              display: 'block',
              height: 70,
              width: 'auto',
              maxWidth: 220,
              objectFit: 'contain',
              filter: `invert(1) drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 14px ${teamColor}aa)`,
              transform: 'rotate(-4deg)',
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>

        <div style={{
          position: 'absolute',
          top: '50%',
          left: playing ? '100%' : '0%',
          transform: 'translate(-50%, -50%)',
          opacity: playing && !done ? 1 : 0,
          transition: playing
            ? 'left 1.3s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.3s'
            : 'opacity 0.2s',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 9, height: 9,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 10px #fff, 0 0 20px ${teamColor}, 0 0 40px ${teamColor}`,
          }} />
        </div>

        {sparks.map(s => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: s.id % 3 === 0 ? '#fff' : teamColor,
              boxShadow: `0 0 6px ${s.id % 3 === 0 ? '#fff' : teamColor}`,
              opacity: 0,
              animation: `sparkPop 0.8s ease-out ${s.delay}s forwards`,
              '--drift-x': `${s.drift * s.side}px`,
              '--drift-y': `${s.drift}px`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {done && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 80, height: 80,
            borderRadius: '50%',
            border: `2px solid ${teamColor}`,
            animation: 'finalFlash 0.9s ease-out forwards',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      <div style={{
        position: 'absolute',
        top: -14, right: -12,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        background: 'rgba(0,0,0,0.9)',
        border: `1.5px solid ${teamColor}`,
        borderRadius: 4,
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: '0.18em',
        color: '#fff',
        opacity: done ? 1 : 0,
        transform: done
          ? 'scale(1) rotate(-10deg) translateY(0)'
          : 'scale(0.4) rotate(-30deg) translateY(6px)',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: `0 4px 14px rgba(0,0,0,0.7), 0 0 24px ${teamColor}88`,
        pointerEvents: 'none',
      }}>
        <span style={{ color: teamColor, fontSize: 11, lineHeight: 1 }}>✓</span>
        SIGNED
      </div>
    </div>
  );
}

/* ============================================================ */
/* ==================== RADAR CHART ============================ */
/* ============================================================ */

const RADAR_STATS = [
  { key: 'gpEntered',          label: 'GP',       max: 400  },
  { key: 'careerPoints',       label: 'POINTS',   max: 5000 },
  { key: 'podiums',            label: 'PODIUMS',  max: 200  },
  { key: 'polePositions',      label: 'POLES',    max: 105  },
  { key: 'worldChampionships', label: 'TITRES',   max: 7    },
  { key: 'dnfs',               label: 'DNF',      max: 60, invert: true },
];

function RadarChart({ driver, teamColor, sectionVisible, size = 480 }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const n = RADAR_STATS.length;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!sectionVisible) return;
    let raf;
    const t0 = performance.now();
    const dur = 1400;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sectionVisible]);

  const values = RADAR_STATS.map(s => {
    const raw = Number(driver[s.key]) || 0;
    let ratio = s.max > 0 ? raw / s.max : 0;
    if (s.invert) ratio = 1 - ratio;
    return {
      ...s,
      raw,
      normalized: Math.max(0.05, Math.min(ratio, 1)) * progress,
    };
  });

  const angleAt = i => (Math.PI * 2 * i) / n - Math.PI / 2;

  const dataPoints = values.map((v, i) => {
    const a = angleAt(i);
    const r = radius * v.normalized;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const levels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {levels.map((lvl, i) => (
        <polygon
          key={i}
          points={values.map((_, idx) => {
            const a = angleAt(idx);
            const r = radius * lvl;
            return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      {values.map((_, i) => {
        const a = angleAt(i);
        const x = cx + Math.cos(a) * radius;
        const y = cy + Math.sin(a) * radius;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={x} y2={y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={dataPolygon}
        fill={teamColor}
        fillOpacity="0.35"
        stroke={teamColor}
        strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 20px ${teamColor}88)` }}
      />

      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y} r="4"
          fill={teamColor}
          stroke="#fff"
          strokeWidth="1.5"
        />
      ))}

      {values.map((v, i) => {
        const a = angleAt(i);
        const labelR = radius + 44;
        const x = cx + Math.cos(a) * labelR;
        const y = cy + Math.sin(a) * labelR;
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle'
                     : Math.cos(a) > 0 ? 'start' : 'end';
        return (
          <g key={i}>
            <text
              x={x} y={y - 8}
              textAnchor={anchor}
              fill="#fff"
              fontSize="11"
              fontFamily="Orbitron, sans-serif"
              fontWeight="700"
              letterSpacing="0.2em"
            >
              {v.label}
            </text>
            <text
              x={x} y={y + 8}
              textAnchor={anchor}
              fill={teamColor}
              fontSize="14"
              fontFamily="Orbitron, sans-serif"
              fontWeight="900"
            >
              {v.raw}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="3" fill={teamColor} />
    </svg>
  );
}

/* ============================================================ */
/* ==================== MAIN COMPONENT ========================= */
/* ============================================================ */

export default function DriverDetail() {
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  const [seasonStats, setSeasonStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [aboutHovered, setAboutHovered] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [closingBook, setClosingBook] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const bookRef = useRef(null);

  const parallax = useMouseParallax(14);
  const [tiltRef, tilt, tiltHandlers] = useTilt(8);

  const { setCursorColor, resetCursorColor } = useCursor();
  const driverColor = driver?.teamColor || null;

  useEffect(() => {
    if (driverColor) setCursorColor(driverColor);
    return () => resetCursorColor();
  }, [driverColor, setCursorColor, resetCursorColor]);

  useEffect(() => {
    api.get(`/drivers/${id}`)
      .then(r => setDriver(r.data))
      .finally(() => setLoading(false));
    api.get(`/drivers/${id}/season-stats`)
      .then(r => setSeasonStats(r.data))
      .catch(() => setSeasonStats([]));
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = bookOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [bookOpen]);

  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, [driver]);

  const closeBook = () => {
    setClosingBook(true);
    setTimeout(() => {
      setBookOpen(false);
      setClosingBook(false);
      setCurrentPage(0);
    }, 700);
  };

  if (loading) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <div className="mono" style={{ color: 'var(--f1-red)', letterSpacing: '0.3em' }}>CHARGEMENT...</div>
    </div>
  );

  if (!driver) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-dim)' }}>Pilote introuvable</h2>
      <Link to="/drivers" style={{ color: 'var(--f1-red)' }}>← Retour aux pilotes</Link>
    </div>
  );

  const teamColor = driver.teamColor || '#e10600';
  const age = driver.birthYear ? new Date().getFullYear() - driver.birthYear : null;
  const heroPhoto = driver.actionPhotoUrl || driver.photoUrl;
  const carImage = findCarImage(driver.teamName);

  const stats = [
    { label: 'GP disputés',        value: driver.gpEntered,          icon: '🏁' },
    { label: 'Points carrière',    value: driver.careerPoints,       icon: '⭐' },
    { label: 'Meilleure position', value: driver.highestFinish,      icon: '🥇' },
    { label: 'Podiums',            value: driver.podiums,            icon: '🏆' },
    { label: 'Meilleure grille',   value: driver.highestGrid,        icon: '📊' },
    { label: 'Pole positions',     value: driver.polePositions,      icon: '🎯' },
    { label: 'Championnats',       value: driver.worldChampionships, icon: '👑' },
    { label: 'Abandons (DNF)',     value: driver.dnfs,               icon: '💥' },
  ];

  let galleryUrls = [];
  try { galleryUrls = JSON.parse(driver.gallery || '[]'); } catch { galleryUrls = []; }
  if (!Array.isArray(galleryUrls)) galleryUrls = [];

  const paragraphs = driver.biography
    ? driver.biography.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0)
    : [];

  const pages = [];
  paragraphs.forEach((p, idx) => {
    const photo = galleryUrls[idx];
    const isEven = idx % 2 === 0;
    if (isEven) {
      pages.push({ type: 'paragraph', paragraph: p, chapter: idx + 1 });
      pages.push({ type: 'photo',     photo,     chapter: idx + 1 });
    } else {
      pages.push({ type: 'photo',     photo,     chapter: idx + 1 });
      pages.push({ type: 'paragraph', paragraph: p, chapter: idx + 1 });
    }
  });

  const goNext = () => { if (bookRef.current) bookRef.current.pageFlip().flipNext(); };
  const goPrev = () => { if (bookRef.current) bookRef.current.pageFlip().flipPrev(); };
  const onFlip  = e => { setCurrentPage(e.data); };

  const isLast  = currentPage >= pages.length - 1;
  const isFirst = currentPage <= 0;

  return (
    <div style={{ position: 'relative' }}>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes emberRise {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.9; }
          100% { transform: translateY(-820px) translateX(30px) scale(0.4); opacity: 0; }
        }
        @keyframes slowRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes heroGridShift {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes sigWobble {
          0%   { transform: translateY(0) rotate(0deg); }
          15%  { transform: translateY(-1px) rotate(-0.4deg); }
          30%  { transform: translateY(1px) rotate(0.3deg); }
          50%  { transform: translateY(-0.5px) rotate(-0.2deg); }
          70%  { transform: translateY(0.8px) rotate(0.15deg); }
          85%  { transform: translateY(-0.4px) rotate(-0.1deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes sparkPop {
          0%   { opacity: 0; transform: translate(0, 0) scale(0); }
          25%  { opacity: 1; transform: translate(calc(var(--drift-x) * 0.4), calc(var(--drift-y) * 0.4)) scale(1.3); }
          100% { opacity: 0; transform: translate(var(--drift-x), var(--drift-y)) scale(0.2); }
        }
        @keyframes finalFlash {
          0%   { width: 40px;  height: 40px;  opacity: 0.9; border-width: 3px; }
          100% { width: 240px; height: 240px; opacity: 0;   border-width: 1px; }
        }

        .book-wrapper { display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%; padding: 40px 20px; }
        .book-page-inner { width: 100%; height: 100%; padding: 40px 36px; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; position: relative; }
        .book-flip-page { background: #faf8f4; color: #1a1a1a; box-shadow: inset 0 0 40px rgba(0,0,0,0.04); }
        .book-nav-btn { width: 60px; height: 60px; border-radius: 50%; background: #1a1a1a; color: #faf8f4; border: none; font-size: 24px; cursor: pointer; display: grid; place-items: center; transition: all 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.3); flex-shrink: 0; font-weight: 700; }
        .book-nav-btn:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 15px 40px rgba(0,0,0,0.4); }
        .book-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
      `}</style>

      {/* HERO */}
      <section style={{
        position: 'relative',
        minHeight: 780,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${teamColor}44 0%, #000 65%)`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${teamColor}11 1px, transparent 1px), linear-gradient(90deg, ${teamColor}11 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          zIndex: 0, opacity: 0.4,
          animation: 'heroGridShift 12s linear infinite',
        }} />

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 1400, height: 1400,
          transform: 'translate(-50%, -50%)',
          background: `conic-gradient(from 0deg, transparent 0%, ${teamColor}22 25%, transparent 50%, ${teamColor}11 75%, transparent 100%)`,
          filter: 'blur(60px)',
          opacity: 0.4,
          animation: 'slowRotate 40s linear infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {heroPhoto && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${imgSrc(heroPhoto)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            opacity: 0.15,
            filter: 'grayscale(0.5) contrast(1.2) blur(6px)',
            zIndex: 0,
            transform: `translate(${parallax.x * 0.6}px, ${parallax.y * 0.6}px) scale(1.05)`,
            transition: 'transform 0.2s ease-out',
          }} />
        )}

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.75) 50%, rgba(10,10,10,0.98) 100%)',
          zIndex: 1,
        }} />

        <div style={{ position: 'absolute', inset: 0, opacity: 0.35, zIndex: 2, pointerEvents: 'none' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${8 + i * 11}%`,
              left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${i % 2 ? `${teamColor}cc` : 'rgba(255,255,255,0.2)'}, transparent)`,
              animation: `speedLine ${3 + i * 0.25}s linear infinite`,
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>

        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(28)].map((_, i) => {
            const size = 2 + Math.random() * 3;
            const left = Math.random() * 100;
            const delay = Math.random() * 8;
            const duration = 7 + Math.random() * 7;
            const useTeamColor = i % 3 === 0;
            return (
              <span key={i} style={{
                position: 'absolute',
                left: `${left}%`, bottom: -20,
                width: size, height: size,
                borderRadius: '50%',
                background: useTeamColor ? teamColor : '#fff',
                boxShadow: `0 0 8px ${useTeamColor ? teamColor : '#fff'}`,
                opacity: 0.7,
                animation: `emberRise ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
              }} />
            );
          })}
        </div>

        {carImage && (
          <>
            <div style={{
              position: 'absolute', right: '-80px', bottom: '40px',
              width: '70%', maxWidth: 1000,
              zIndex: 2, pointerEvents: 'none', opacity: 0.9,
              filter: `drop-shadow(0 40px 80px rgba(0,0,0,0.95)) drop-shadow(0 0 120px ${teamColor}66)`,
              transform: `rotate(-3deg) translate(${-parallax.x * 1.5}px, ${-parallax.y * 1.2}px)`,
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <img src={carImage} alt={`${driver.teamName} F1 Car`}
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', transform: 'scaleX(-1)' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 50%, rgba(10,10,10,0.5) 80%, rgba(10,10,10,0.98) 100%)',
              zIndex: 2, pointerEvents: 'none',
            }} />
          </>
        )}

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, transparent 0%, ${teamColor} 30%, ${teamColor} 70%, transparent 100%)`,
          boxShadow: `0 0 30px ${teamColor}`,
          zIndex: 4,
        }} />

        <div className="container" style={{
          position: 'relative', zIndex: 3,
          padding: '80px 32px 80px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 70, alignItems: 'center',
          minHeight: 780,
        }}>
          <div ref={tiltRef} {...tiltHandlers} style={{ position: 'relative', perspective: 1000, transformStyle: 'preserve-3d' }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 500, height: 500, borderRadius: '50%',
              background: `radial-gradient(circle, ${teamColor}55 0%, transparent 70%)`,
              filter: 'blur(60px)',
              zIndex: 0, pointerEvents: 'none',
            }} />

            <div style={{
              transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(0)`,
              transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
              transformStyle: 'preserve-3d',
              position: 'relative', zIndex: 1,
            }}>
              {heroPhoto ? (
                <img src={imgSrc(heroPhoto)} alt={`${driver.firstName} ${driver.lastName}`}
                  style={{
                    width: 420, height: 540,
                    objectFit: 'contain', objectPosition: 'center bottom',
                    filter: `drop-shadow(0 30px 60px rgba(0,0,0,0.95)) drop-shadow(0 0 80px ${teamColor}88)`,
                    animation: 'float 6s ease-in-out infinite',
                    transform: 'translateZ(40px)',
                  }} />
              ) : (
                <div style={{
                  width: 420, height: 540,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 200, fontWeight: 900, color: teamColor,
                  textShadow: `0 0 80px ${teamColor}88`,
                }}>
                  {driver.firstName?.[0]}{driver.lastName?.[0]}
                </div>
              )}
            </div>
          </div>

          <div>
            <Link to="/drivers" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--text-dim)', fontSize: 13, marginBottom: 20,
              fontFamily: 'var(--font-heading)', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>← Retour aux pilotes</Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 110, fontWeight: 900, fontStyle: 'italic',
                color: teamColor, lineHeight: 0.9,
                textShadow: `0 0 60px ${teamColor}cc, 0 8px 30px rgba(0,0,0,0.9)`,
              }}>
                {driver.number || '—'}
              </span>

              {driver.countryCode && (
                <img src={flagSrc(driver.countryCode)} alt={driver.countryCode}
                  style={{
                    height: 60, width: 'auto', borderRadius: 5,
                    boxShadow: `0 8px 24px rgba(0,0,0,0.7), 0 0 30px ${teamColor}66`,
                  }} />
              )}

              {driver.helmetImage && (
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 180, height: 180, borderRadius: '50%',
                    background: `radial-gradient(circle, ${teamColor}44 0%, transparent 70%)`,
                    filter: 'blur(30px)',
                    pointerEvents: 'none',
                  }} />
                  <img
                    src={imgSrc(driver.helmetImage)}
                    alt="Casque du pilote"
                    style={{
                      position: 'relative',
                      height: 110,
                      width: 'auto',
                      objectFit: 'contain',
                      filter: `drop-shadow(0 10px 30px rgba(0,0,0,0.9)) drop-shadow(0 0 40px ${teamColor}88)`,
                      animation: 'float 5s ease-in-out infinite',
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {driver.signatureImage && (
                <HeroSignature driver={driver} teamColor={teamColor} />
              )}
            </div>

            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.25em',
              color: 'var(--text-dim)', marginBottom: 8,
            }}>
              {driver.firstName}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 32, flexWrap: 'wrap' }}>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 96, fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '-0.04em',
                color: 'var(--f1-white)', lineHeight: 0.9, margin: 0,
                textShadow: `0 0 60px ${teamColor}66, 0 10px 40px rgba(0,0,0,0.9)`,
              }}>
                {driver.lastName}
              </h1>
              {driver.teamLogoUrl && (
                <Link to={`/teams/${driver.teamId}`} title={driver.teamName}
                  style={{ display: 'inline-flex', alignItems: 'center', padding: 12, transition: 'transform 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                  <img src={imgSrc(driver.teamLogoUrl)} alt={driver.teamName}
                    style={{ height: 90, width: 'auto', objectFit: 'contain', filter: `drop-shadow(0 8px 30px ${teamColor}dd)` }} />
                </Link>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {driver.teamName && (
                <Link to={`/teams/${driver.teamId}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '12px 20px',
                  background: `${teamColor}22`,
                  border: `1.5px solid ${teamColor}`,
                  borderRadius: 8, textDecoration: 'none', color: 'inherit',
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  boxShadow: `0 0 30px ${teamColor}44`,
                }}>
                  {driver.teamLogoUrl && (
                    <img src={imgSrc(driver.teamLogoUrl)} alt={driver.teamName}
                      style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
                  )}
                  {driver.teamName}
                </Link>
              )}

              {driver.birthYear && (
                <span style={{
                  padding: '12px 20px', background: 'rgba(0,0,0,0.7)',
                  border: '1.5px solid var(--border)', borderRadius: 8,
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>🎂 {driver.birthYear}{age ? ` · ${age} ans` : ''}</span>
              )}

              {driver.debutYear && (
                <span style={{
                  padding: '12px 20px', background: 'rgba(0,0,0,0.7)',
                  border: '1.5px solid var(--border)', borderRadius: 8,
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>🏁 F1 depuis {driver.debutYear}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CARRIÈRE RADAR */}
      <section className="container" style={{ padding: '80px 32px 40px' }}>
        <Reveal direction="up">
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12,
            }}>
              <div style={{ width: 40, height: 2, background: teamColor, boxShadow: `0 0 10px ${teamColor}` }} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 11,
                letterSpacing: '0.4em', color: teamColor, fontWeight: 700,
              }}>
                PROFIL DE CARRIÈRE
              </span>
              <div style={{ width: 40, height: 2, background: teamColor, boxShadow: `0 0 10px ${teamColor}` }} />
            </div>
            <h2 style={{ fontSize: 48, marginBottom: 12 }}>
              Carrière en <span style={{ color: teamColor }}>Formule 1</span>
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
              Vue d'ensemble des performances du pilote
            </p>
          </div>
        </Reveal>

        <div ref={statsRef}>
          <Reveal direction="scale">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '20px 0 40px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 500, height: 500, borderRadius: '50%',
                background: `radial-gradient(circle, ${teamColor}22 0%, transparent 70%)`,
                filter: 'blur(60px)',
                pointerEvents: 'none',
              }} />
              <RadarChart
                driver={driver}
                teamColor={teamColor}
                sectionVisible={statsVisible}
                size={520}
              />
            </div>
          </Reveal>

          <div className="grid-4" style={{ gap: 16, marginTop: 40 }}>
            {stats.map((s, idx) => (
              <Reveal key={s.label} delay={idx * 0.05} direction="up">
                <div
                  style={{
                    padding: '20px 22px',
                    background: 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
                    border: `1px solid ${teamColor}22`,
                    borderTop: `3px solid ${teamColor}`,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    transition: 'border-color 0.3s, transform 0.3s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${teamColor}66`;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${teamColor}22`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 26 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      fontWeight: 900,
                      color: teamColor,
                      lineHeight: 1,
                      marginBottom: 4,
                      textShadow: `0 0 20px ${teamColor}66`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {s.value != null && s.value !== '' ? s.value : '—'}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--text-dim)',
                    }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STATS PAR SAISON */}
      {seasonStats.length > 0 && (
        <section className="container" style={{ padding: '40px 32px 60px' }}>
          <Reveal direction="up">
            <div style={{ marginBottom: 50 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 2, background: teamColor, boxShadow: `0 0 10px ${teamColor}` }} />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 11,
                  letterSpacing: '0.4em', color: teamColor, fontWeight: 700,
                }}>
                  SAISON PAR SAISON
                </span>
              </div>
              <h2 style={{ fontSize: 48, marginBottom: 12 }}>
                Performance en <span style={{ color: teamColor }}>pourcentage</span>
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
                Taux de réussite du pilote sur chaque saison
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {seasonStats.map((s, idx) => (
              <Reveal key={s.season} delay={idx * 0.06} direction="up">
                <div
                  className="season-card"
                  style={{
                    background: 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
                    border: `1px solid ${teamColor}33`,
                    borderLeft: `4px solid ${teamColor}`,
                    borderRadius: 8,
                    padding: '28px 32px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    right: 20, top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 140,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    color: teamColor,
                    opacity: 0.04,
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}>
                    {s.season}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(140px, 200px) 1fr',
                    gap: 32,
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 48,
                        fontWeight: 900,
                        color: teamColor,
                        lineHeight: 1,
                        textShadow: `0 0 30px ${teamColor}66`,
                      }}>
                        {s.season}
                      </div>
                      <div style={{
                        marginTop: 12,
                        fontFamily: 'var(--font-heading)',
                        fontSize: 12,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--text-dim)',
                      }}>
                        {s.races} course{s.races > 1 ? 's' : ''}
                      </div>
                      <div style={{
                        marginTop: 6,
                        fontFamily: 'var(--font-display)',
                        fontSize: 18,
                        fontWeight: 900,
                        color: 'var(--f1-white)',
                      }}>
                        {s.points} <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>pts</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { label: 'Victoires',       pct: s.winRate,    count: s.wins,           color: teamColor },
                        { label: 'Podiums',         pct: s.podiumRate, count: s.podiums,        color: '#FFD700' },
                        { label: 'Dans les points', pct: s.pointsRate, count: s.pointsFinishes, color: '#00d26a' },
                        { label: 'Abandons (DNF)',  pct: s.dnfRate,    count: s.dnfs,           color: '#ff5555' },
                      ].map(bar => (
                        <div key={bar.label}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginBottom: 6,
                          }}>
                            <span style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              color: 'var(--text-mid)',
                            }}>
                              {bar.label}
                              <span style={{
                                marginLeft: 8,
                                color: 'var(--text-dim)',
                                fontWeight: 500,
                                fontSize: 11,
                              }}>
                                ({bar.count})
                              </span>
                            </span>
                            <span style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 16,
                              fontWeight: 900,
                              color: bar.color,
                            }}>
                              {bar.pct.toFixed(1)}%
                            </span>
                          </div>
                          <div style={{
                            height: 6,
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 3,
                            overflow: 'hidden',
                            position: 'relative',
                          }}>
                            <div style={{
                              width: `${bar.pct}%`,
                              height: '100%',
                              background: bar.color,
                              borderRadius: 3,
                              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* ============ TIMELINE DE CARRIÈRE — NOUVEAU ================ */}
      {/* ============================================================ */}
      <section className="container" style={{ padding: '40px 32px 60px' }}>
        <Reveal direction="up">
          <div style={{ marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12,
            }}>
              <div style={{ width: 40, height: 2, background: teamColor, boxShadow: `0 0 10px ${teamColor}` }} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 11,
                letterSpacing: '0.4em', color: teamColor, fontWeight: 700,
              }}>
                TIMELINE
              </span>
              <div style={{ width: 40, height: 2, background: teamColor, boxShadow: `0 0 10px ${teamColor}` }} />
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: 12 }}>
              La carrière en <span style={{ color: teamColor }}>un coup d'œil</span>
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
              Chaque saison, son écurie et ses résultats
            </p>
          </div>
        </Reveal>

        <Reveal direction="scale">
          <CareerTimeline driverId={driver.id} teamColor={teamColor} />
        </Reveal>
      </section>

      {/* LOCALISATION — CARTE */}
      {(driver.latitude != null && driver.longitude != null) && (
        <section className="container" style={{ padding: '40px 32px 60px' }}>
          <Reveal direction="up">
            <div style={{ marginBottom: 40, textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12,
              }}>
                <div style={{ width: 40, height: 2, background: teamColor, boxShadow: `0 0 10px ${teamColor}` }} />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 11,
                  letterSpacing: '0.4em', color: teamColor, fontWeight: 700,
                }}>
                  LOCALISATION
                </span>
                <div style={{ width: 40, height: 2, background: teamColor, boxShadow: `0 0 10px ${teamColor}` }} />
              </div>
              <h2 style={{ fontSize: 48, marginBottom: 12 }}>
                Né à <span style={{ color: teamColor }}>{driver.birthCity || '...'}</span>
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
                {driver.firstName} {driver.lastName} est né
                {driver.birthYear ? ` en ${driver.birthYear}` : ''}
                {driver.birthCity ? ` à ${driver.birthCity}` : ''}
              </p>
            </div>
          </Reveal>

          <Reveal direction="scale">
            <DriverCountryMap driver={driver} teamColor={teamColor} />
          </Reveal>

          <Reveal direction="up" delay={0.15}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              marginTop: 32,
              flexWrap: 'wrap',
            }}>
              {driver.birthCity && (
                <div style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
                  border: `1px solid ${teamColor}33`,
                  borderTop: `3px solid ${teamColor}`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>🏙️</span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      color: 'var(--text-dim)',
                      marginBottom: 2,
                      fontWeight: 700,
                    }}>
                      VILLE
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#fff',
                    }}>
                      {driver.birthCity}
                    </div>
                  </div>
                </div>
              )}

              {driver.nationality && (
                <div style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
                  border: `1px solid ${teamColor}33`,
                  borderTop: `3px solid ${teamColor}`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>🌍</span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      color: 'var(--text-dim)',
                      marginBottom: 2,
                      fontWeight: 700,
                    }}>
                      NATIONALITÉ
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#fff',
                    }}>
                      {driver.nationality}
                    </div>
                  </div>
                </div>
              )}

              {driver.birthYear && (
                <div style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
                  border: `1px solid ${teamColor}33`,
                  borderTop: `3px solid ${teamColor}`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>🎂</span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      color: 'var(--text-dim)',
                      marginBottom: 2,
                      fontWeight: 700,
                    }}>
                      NAISSANCE
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#fff',
                    }}>
                      {driver.birthYear}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {/* ALL ABOUT */}
      {paragraphs.length > 0 && (
        <section className="container" style={{ padding: '80px 32px 60px' }}>
          <Reveal direction="scale">
            <div
              onMouseEnter={() => setAboutHovered(true)}
              onMouseLeave={() => setAboutHovered(false)}
              onClick={() => setBookOpen(true)}
              style={{
                position: 'relative', maxWidth: 900, margin: '0 auto', height: 500,
                borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                border: `2px solid ${teamColor}66`,
                boxShadow: `0 40px 80px -20px ${teamColor}88, 0 0 100px ${teamColor}33`,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: aboutHovered ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {driver.aboutPhotoUrl ? (
                <img src={imgSrc(driver.aboutPhotoUrl)} alt={`${driver.firstName} ${driver.lastName}`}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center 25%',
                    transition: 'all 0.6s',
                    transform: aboutHovered ? 'scale(1.08)' : 'scale(1)',
                    filter: aboutHovered ? 'brightness(0.4) blur(4px)' : 'brightness(0.7)',
                  }} />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(135deg, ${teamColor}, #000)`,
                }} />
              )}

              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)`,
                transition: 'opacity 0.5s', opacity: aboutHovered ? 1 : 0.6,
              }} />

              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'flex-end', padding: 40, textAlign: 'center',
                opacity: aboutHovered ? 0 : 1,
                transform: aboutHovered ? 'translateY(20px)' : 'translateY(0)',
                transition: 'all 0.4s', pointerEvents: 'none',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 12,
                  letterSpacing: '0.5em', color: teamColor,
                  fontWeight: 700, marginBottom: 12,
                }}>■ BIOGRAPHIE</div>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff',
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}>Survolez la photo</div>
              </div>

              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: 40, textAlign: 'center',
                opacity: aboutHovered ? 1 : 0,
                transform: aboutHovered ? 'scale(1)' : 'scale(0.9)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: aboutHovered ? 'auto' : 'none',
              }}>
                <div style={{
                  position: 'absolute', inset: 30,
                  border: `2px solid ${teamColor}`, borderRadius: 12,
                  boxShadow: `0 0 60px ${teamColor}88, inset 0 0 60px ${teamColor}22`,
                  pointerEvents: 'none',
                }} />
                <span style={{ position: 'absolute', top: 44, left: 44, width: 24, height: 24, borderTop: `3px solid ${teamColor}`, borderLeft: `3px solid ${teamColor}` }} />
                <span style={{ position: 'absolute', top: 44, right: 44, width: 24, height: 24, borderTop: `3px solid ${teamColor}`, borderRight: `3px solid ${teamColor}` }} />
                <span style={{ position: 'absolute', bottom: 44, left: 44, width: 24, height: 24, borderBottom: `3px solid ${teamColor}`, borderLeft: `3px solid ${teamColor}` }} />
                <span style={{ position: 'absolute', bottom: 44, right: 44, width: 24, height: 24, borderBottom: `3px solid ${teamColor}`, borderRight: `3px solid ${teamColor}` }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.5em', color: teamColor, fontWeight: 700, marginBottom: 20, textShadow: `0 0 20px ${teamColor}88` }}>
                    ◆ ALL ABOUT ◆
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                    {driver.firstName}
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 72, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', color: '#fff', lineHeight: 0.95, marginBottom: 32, textShadow: `0 0 50px ${teamColor}, 0 10px 40px rgba(0,0,0,0.9)` }}>
                    {driver.lastName}
                  </div>
                  <div style={{ width: 80, height: 2, background: teamColor, boxShadow: `0 0 20px ${teamColor}`, margin: '0 auto 32px' }} />
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
                    {paragraphs.length} chapitre{paragraphs.length > 1 ? 's' : ''} à découvrir
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 12,
                    padding: '14px 32px', background: teamColor,
                    borderRadius: 30, color: '#fff',
                    fontFamily: 'var(--font-display)', fontSize: 11,
                    letterSpacing: '0.3em', fontWeight: 700,
                    boxShadow: `0 0 40px ${teamColor}`,
                  }}>📖 OUVRIR LE LIVRE</div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* CITATION */}
      {driver.quote && (
        <Reveal direction="up">
          <section className="container" style={{ padding: '40px 32px 100px', textAlign: 'center' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', padding: '60px 40px' }}>
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 220, lineHeight: 0.7, color: teamColor, opacity: 0.08,
                pointerEvents: 'none', userSelect: 'none',
              }}>"</div>
              <div style={{ width: 80, height: 2, background: teamColor, boxShadow: `0 0 20px ${teamColor}`, margin: '0 auto 40px' }} />
              <blockquote style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: 'clamp(28px, 4vw, 52px)',
                fontWeight: 400, lineHeight: 1.25,
                color: 'var(--f1-white)', margin: 0,
                position: 'relative', zIndex: 1,
                textShadow: `0 0 60px ${teamColor}44, 0 4px 30px rgba(0,0,0,0.6)`,
              }}>« {driver.quote} »</blockquote>
              <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, transparent, ${teamColor})` }} />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 14,
                  fontWeight: 700, letterSpacing: '0.4em',
                  color: teamColor, textTransform: 'uppercase',
                  textShadow: `0 0 20px ${teamColor}66`,
                }}>
                  — {driver.quoteAuthor || `${driver.firstName} ${driver.lastName}`}
                </span>
                <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${teamColor}, transparent)` }} />
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* FAVORITE TRACK */}
      {driver.favoriteTrack && (
        <Reveal direction="up">
          <section className="container" style={{ padding: '40px 32px 100px' }}>
            <div style={{
              position: 'relative', maxWidth: 1100, margin: '0 auto',
              height: driver.favoriteTrackDescription ? 560 : 480,
              borderRadius: 16, overflow: 'hidden',
              border: `2px solid ${teamColor}66`,
              boxShadow: `0 40px 80px -20px ${teamColor}88, 0 0 80px ${teamColor}22`,
            }}>
              {driver.favoriteTrackImage ? (
                <img src={imgSrc(driver.favoriteTrackImage)} alt={driver.favoriteTrack}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${teamColor}, #000)` }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: teamColor, opacity: 0.55, mixBlendMode: 'multiply' }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(180deg, ${teamColor}22 0%, ${teamColor}77 45%, ${teamColor}ee 100%)`,
                mixBlendMode: 'multiply',
              }} />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                background: `linear-gradient(90deg, transparent 0%, ${teamColor} 30%, ${teamColor} 70%, transparent 100%)`,
                boxShadow: `0 0 30px ${teamColor}`,
              }} />

              <div style={{
                position: 'relative', zIndex: 1, height: '100%',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-end', padding: '48px 56px',
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ width: 40, height: 2, background: '#fff', boxShadow: '0 0 10px #fff' }} />
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 12,
                    letterSpacing: '0.4em', color: '#fff', fontWeight: 700,
                    textShadow: `0 0 20px ${teamColor}88, 0 2px 10px rgba(0,0,0,0.9)`,
                  }}>◆ FAVORITE TRACK</span>
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(36px, 5vw, 72px)',
                  fontWeight: 900, textTransform: 'uppercase',
                  letterSpacing: '-0.02em', lineHeight: 0.95,
                  color: '#fff', margin: 0,
                  textShadow: `0 0 40px ${teamColor}66, 0 8px 30px rgba(0,0,0,0.9)`,
                }}>{driver.favoriteTrack}</h3>
                {driver.favoriteTrackDescription && (
                  <p style={{
                    maxWidth: 820,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 'clamp(15px, 1.3vw, 18px)',
                    lineHeight: 1.65, color: 'rgba(255,255,255,0.9)',
                    fontStyle: 'italic', margin: '24px 0 0 0',
                    textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                  }}>{driver.favoriteTrackDescription}</p>
                )}
                <div style={{
                  marginTop: 24,
                  fontFamily: 'var(--font-heading)', fontSize: 13,
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.75)',
                  textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                }}>
                  Le circuit préféré de {driver.firstName} {driver.lastName}
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* CTA RETOUR */}
      <section className="container" style={{ padding: '60px 32px 80px', textAlign: 'center' }}>
        <Link to="/drivers" style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          padding: '16px 32px', background: 'transparent',
          border: `2px solid ${teamColor}`, borderRadius: 8,
          color: 'var(--f1-white)',
          fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
          textTransform: 'uppercase', letterSpacing: '0.15em',
          textDecoration: 'none', transition: 'all 0.3s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = teamColor;
          e.currentTarget.style.boxShadow = `0 0 40px ${teamColor}`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.boxShadow = 'none';
        }}>
          ← Voir tous les pilotes
        </Link>
      </section>

      <div style={{ height: 60 }} />

      {/* ===== BOOK OVERLAY ===== */}
      {bookOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 99999, backgroundColor: '#f5f2ec', color: '#1a1a1a',
          overflowY: 'auto', overflowX: 'hidden',
        }}>
          <button onClick={closeBook} style={{
            position: 'fixed', top: 30, right: 30, zIndex: 100000,
            width: 52, height: 52, borderRadius: '50%',
            backgroundColor: '#1a1a1a', color: '#faf8f4',
            border: 'none', fontSize: 24, cursor: 'pointer', fontWeight: 700,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            display: 'grid', placeItems: 'center',
            transition: 'all 0.3s', lineHeight: 1, padding: 0,
          }}>×</button>

          <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '80px 20px 40px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 11,
                letterSpacing: '0.5em', color: teamColor,
                fontWeight: 700, marginBottom: 8,
                textShadow: `0 0 20px ${teamColor}66`,
              }}>◆ ALL ABOUT ◆</div>
              <div style={{
                fontFamily: 'var(--font-heading)', fontSize: 22,
                fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: '#1a1a1a',
              }}>{driver.firstName} {driver.lastName}</div>
            </div>

            <div className="book-wrapper" style={{
              transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s',
              transform: closingBook
                ? 'perspective(2000px) rotateY(-90deg) scale(0.9)'
                : 'perspective(2000px) rotateY(0) scale(1)',
              transformOrigin: 'left center',
              opacity: closingBook ? 0 : 1,
            }}>
              <button className="book-nav-btn" onClick={goPrev}
                disabled={isFirst || closingBook}
                style={{ color: teamColor }} title="Page précédente">‹</button>

              <HTMLFlipBook
                width={480} height={640} size="stretch"
                minWidth={300} maxWidth={540}
                minHeight={400} maxHeight={720}
                maxShadowOpacity={0.5}
                showCover={false}
                mobileScrollSupport={true}
                onFlip={onFlip}
                ref={bookRef}
                className="book-flip"
                style={{ margin: '0 auto' }}
                usePortrait={false}
                startPage={0}
                drawShadow={true}
                flippingTime={800}
                useMouseEvents={true}
                clickEventForward={true}
              >
                {pages.map((page, i) => {
                  if (page.type === 'paragraph') {
                    return (
                      <div key={i} className="book-flip-page">
                        <div className="book-page-inner">
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            marginBottom: 24, paddingBottom: 16,
                            borderBottom: '1px solid rgba(0,0,0,0.08)',
                          }}>
                            <span style={{
                              fontFamily: 'var(--font-display)', fontSize: 10,
                              letterSpacing: '0.3em', color: teamColor, fontWeight: 700,
                            }}>CHAPITRE {String(page.chapter).padStart(2, '0')}</span>
                            <div style={{ flex: 1 }} />
                            <span style={{
                              fontFamily: 'var(--font-display)', fontSize: 9,
                              letterSpacing: '0.2em', color: 'rgba(0,0,0,0.3)',
                            }}>{driver.lastName?.toUpperCase()}</span>
                          </div>
                          <div style={{
                            position: 'absolute', top: '45%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontFamily: 'var(--font-display)',
                            fontSize: 260, fontWeight: 900, fontStyle: 'italic',
                            color: teamColor, opacity: 0.04, lineHeight: 1,
                            pointerEvents: 'none', userSelect: 'none',
                          }}>{String(page.chapter).padStart(2, '0')}</div>
                          <div style={{
                            flex: 1, display: 'flex', alignItems: 'center',
                            position: 'relative', zIndex: 1,
                          }}>
                            <p style={{
                              fontFamily: 'Georgia, "Times New Roman", serif',
                              fontSize: 15, lineHeight: 1.85,
                              color: '#2a2a2a', textAlign: 'justify', margin: 0,
                            }}>{page.paragraph}</p>
                          </div>
                          <div style={{
                            display: 'flex', justifyContent: 'center',
                            alignItems: 'center', gap: 8, paddingTop: 16,
                            borderTop: '1px solid rgba(0,0,0,0.08)',
                            fontFamily: 'var(--font-display)', fontSize: 9,
                            letterSpacing: '0.3em', color: 'rgba(0,0,0,0.3)',
                          }}>
                            <span style={{ width: 20, height: 1, backgroundColor: 'rgba(0,0,0,0.15)' }} />
                            {i + 1}
                            <span style={{ width: 20, height: 1, backgroundColor: 'rgba(0,0,0,0.15)' }} />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (page.type === 'photo') {
                    return (
                      <div key={i} className="book-flip-page" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, position: 'relative', height: '100%',
                        backgroundColor: '#faf8f4',
                      }}>
                        {page.photo ? (
                          <>
                            <img src={imgSrc(page.photo)} alt={`Chapitre ${page.chapter}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              onError={e => { e.target.style.display = 'none'; }} />
                            <div style={{
                              position: 'absolute', bottom: 0, left: 0, right: 0,
                              padding: '20px 24px',
                              background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.85))',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                              <span style={{
                                fontFamily: 'var(--font-display)', fontSize: 10,
                                letterSpacing: '0.3em', color: teamColor, fontWeight: 700,
                              }}>● CHAPITRE {String(page.chapter).padStart(2, '0')}</span>
                              <span style={{
                                fontFamily: 'var(--font-display)', fontSize: 9,
                                color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em',
                              }}>{driver.lastName?.toUpperCase()}</span>
                            </div>
                          </>
                        ) : (
                          <div style={{
                            display: 'grid', placeItems: 'center',
                            height: '100%', width: '100%',
                            fontFamily: 'var(--font-display)', fontSize: 80,
                            color: 'rgba(0,0,0,0.08)',
                          }}>📷</div>
                        )}
                      </div>
                    );
                  }

                  return <div key={i} />;
                })}
              </HTMLFlipBook>

              <button className="book-nav-btn" onClick={goNext}
                disabled={isLast || closingBook}
                style={{ color: teamColor }} title="Page suivante">›</button>
            </div>

            <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 16,
                padding: '10px 24px', background: 'rgba(0,0,0,0.05)',
                borderRadius: 30, fontFamily: 'var(--font-display)',
                fontSize: 11, letterSpacing: '0.25em',
                color: '#1a1a1a', fontWeight: 700,
              }}>
                <span style={{ color: teamColor }}>PAGE</span>
                <span>{currentPage + 1}</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#1a1a1a', opacity: 0.3 }} />
                <span>{pages.length}</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-heading)', fontSize: 11,
                letterSpacing: '0.15em', color: 'rgba(0,0,0,0.4)',
                textTransform: 'uppercase', textAlign: 'center',
              }}>💡 Cliquez sur les flèches ou faites glisser les pages</div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== LIGHTBOX ===== */}
      {lightbox && createPortal(
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 100001, backgroundColor: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(10px)',
          display: 'grid', placeItems: 'center',
          padding: 40, cursor: 'zoom-out',
        }}>
          <img src={lightbox} alt="Agrandissement" style={{
            maxWidth: '90vw', maxHeight: '90vh',
            objectFit: 'contain', borderRadius: 12,
            border: `2px solid ${teamColor}`,
            boxShadow: `0 0 80px ${teamColor}88`,
          }} />
          <button onClick={e => { e.stopPropagation(); setLightbox(null); }}
            style={{
              position: 'absolute', top: 30, right: 30,
              width: 48, height: 48, borderRadius: '50%',
              backgroundColor: teamColor, color: '#fff',
              border: 'none', fontSize: 24, cursor: 'pointer',
              fontWeight: 700, boxShadow: `0 0 30px ${teamColor}`,
            }}>×</button>
        </div>,
        document.body
      )}
    </div>
  );
}