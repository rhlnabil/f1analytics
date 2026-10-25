import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { imgSrc, flagSrc } from '../utils/images';
import { findCarImage } from '../utils/cars';

/* ============================================================ */
/* ============ CINEMA MODE — PRÉSENTATION AUTO =============== */
/* ============================================================ */

const SLIDE_DURATION = 6000;
const INTRO_DURATION = 3000;

/* ============================================================ */
/* ============ ANIMATED COUNTER ============================== */
/* ============================================================ */
function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null || isNaN(target)) { setValue(target); return; }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ============================================================ */
/* ============ STAT BLOCK ==================================== */
/* ============================================================ */
function StatBlock({ label, value, color, delay, crowns = 0 }) {
  const display = useCountUp(value, 1400);
  return (
    <div style={{
      position: 'relative',
      paddingLeft: 14,
      animation: `cm-slideInLeft 0.7s ease ${delay}ms both`,
    }}>
      <div style={{
        position: 'absolute',
        left: 0, top: 4, bottom: 4,
        width: 2,
        background: color,
        boxShadow: `0 0 10px ${color}`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 38, fontWeight: 900,
          color: '#fff', lineHeight: 1,
          letterSpacing: '-0.02em',
          textShadow: `0 0 24px ${color}cc, 0 4px 16px rgba(0,0,0,0.9)`,
        }}>
          {value != null ? display : '—'}
        </div>
        {crowns > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: -2 }}>
            {[...Array(Math.min(crowns, 7))].map((_, i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                style={{
                  filter: `drop-shadow(0 0 6px #FFD700)`,
                  animation: `cm-crownPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay + 500 + i * 80}ms both`,
                }}>
                <path d="M3 18l1.5-9 4.5 4 3-6 3 6 4.5-4 1.5 9z"
                  fill="#FFD700" stroke="#B8860B" strokeWidth="1" strokeLinejoin="round"/>
                <circle cx="4.5" cy="8" r="1.5" fill="#FFD700"/>
                <circle cx="12" cy="6" r="1.5" fill="#FFD700"/>
                <circle cx="19.5" cy="8" r="1.5" fill="#FFD700"/>
              </svg>
            ))}
            {crowns > 7 && (
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10, fontWeight: 900,
                color: '#FFD700', marginLeft: 2,
                textShadow: '0 0 8px #FFD700',
              }}>+{crowns - 7}</span>
            )}
          </div>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 9, letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.55)',
        fontWeight: 700, marginTop: 6,
      }}>{label}</div>
    </div>
  );
}

/* ============================================================ */
/* ============ LIVE TIMECODE ================================= */
/* ============================================================ */
function LiveTimecode({ color, paused }) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      if (!paused) setMs(t - t0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  const f = String(Math.floor((ms % 1000) / 40)).padStart(2, '0');

  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontSize: 11, letterSpacing: '0.15em',
      color: '#fff', fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
      textShadow: `0 0 10px ${color}aa`,
    }}>
      {h}:{m}:{s}<span style={{ color, marginLeft: 2 }}>:{f}</span>
    </span>
  );
}

/* ============================================================ */
/* ============ SECTOR TIMING PANEL =========================== */
/* ============================================================ */
function SectorPanel({ driver, color }) {
  const seed = (driver?.gpEntered || 50) + (driver?.number || 7) * 3;
  const s1 = (23 + (seed % 5) * 0.4).toFixed(1);
  const s2 = (30 + (seed % 7) * 0.3).toFixed(1);
  const s3 = (21 + (seed % 6) * 0.35).toFixed(1);

  const sectors = [
    { label: 'S1', time: s1, best: seed % 3 === 0 },
    { label: 'S2', time: s2, best: seed % 2 === 0 },
    { label: 'S3', time: s3, best: seed % 5 === 0 },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 9, letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 700,
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
      }}>SECTEURS</div>

      <div style={{ display: 'flex', gap: 6 }}>
        {sectors.map((s, i) => (
          <div key={s.label} style={{
            position: 'relative',
            width: 54,
            padding: '6px 8px',
            background: 'rgba(0,0,0,0.55)',
            border: `1px solid ${s.best ? '#c084fc' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 5,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: s.best ? `0 0 14px #c084fc88` : 'none',
            animation: `cm-hudFade 0.5s ease ${0.9 + i * 0.15}s both`,
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 8, letterSpacing: '0.2em',
              fontWeight: 800,
              color: s.best ? '#c084fc' : 'rgba(255,255,255,0.55)',
              marginBottom: 2,
            }}>{s.label}</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14, fontWeight: 900,
              color: s.best ? '#c084fc' : '#fff',
              letterSpacing: '-0.02em',
              textShadow: s.best ? '0 0 12px #c084fc' : `0 0 8px ${color}66`,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}>{s.time}</div>
            <div style={{
              marginTop: 4, height: 2,
              background: s.best ? '#c084fc' : color,
              boxShadow: `0 0 8px ${s.best ? '#c084fc' : color}`,
              opacity: 0.85,
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ ⚡ G-FORCE METER ============================== */
/* ============================================================ */
function GForceMeter({ color, active, driverId = 1 }) {
  const [gForce, setGForce] = useState(0);

  useEffect(() => {
    if (!active) { setGForce(0); return; }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const elapsed = (t - t0) / 1000;
      const wave = Math.sin(elapsed * 2.8 + driverId) * Math.cos(elapsed * 1.9);
      setGForce(wave * 4.8);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, driverId]);

  const ratio = Math.min(1, Math.abs(gForce) / 5);
  const isLeft = gForce < 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      animation: 'cm-hudFade 0.6s ease 1.5s both',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 8,
        letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 700,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>L</span>
        <span style={{ color: '#fff' }}>G-FORCE</span>
        <span>R</span>
      </div>

      <div style={{
        position: 'relative',
        width: 130,
        height: 6,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0, bottom: 0,
          width: 1,
          background: 'rgba(255,255,255,0.4)',
          transform: 'translateX(-50%)',
          zIndex: 2,
        }} />

        <div style={{
          position: 'absolute',
          left: isLeft ? `${50 - ratio * 50}%` : '50%',
          right: isLeft ? '50%' : `${50 - ratio * 50}%`,
          top: 0, bottom: 0,
          background: isLeft
            ? `linear-gradient(90deg, ${color}, #fff)`
            : `linear-gradient(90deg, #fff, ${color})`,
          boxShadow: `0 0 10px ${color}`,
          transition: 'left 0.05s linear, right 0.05s linear',
        }} />
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 12,
        fontWeight: 900,
        color: '#fff',
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 10px ${color}cc`,
        letterSpacing: '0.05em',
      }}>
        {gForce >= 0 ? '+' : ''}{gForce.toFixed(2)}
        <span style={{ fontSize: 8, marginLeft: 3, opacity: 0.6 }}>G</span>
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ 🟪 DRS INDICATOR ============================== */
/* ============================================================ */
function DRSIndicator({ color, active }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!active) { setOpen(false); return; }
    const i = setInterval(() => setOpen(o => !o), 3800);
    setOpen(true);
    const t = setTimeout(() => setOpen(false), 1200);
    return () => { clearInterval(i); clearTimeout(t); };
  }, [active]);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 10px',
      background: open ? `${color}22` : 'rgba(0,0,0,0.55)',
      border: `1px solid ${open ? color : 'rgba(255,255,255,0.15)'}`,
      borderRadius: 5,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      boxShadow: open ? `0 0 18px ${color}66` : 'none',
      transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      animation: 'cm-hudFade 0.5s ease 1.1s both',
    }}>
      <div style={{
        position: 'relative',
        width: 8, height: 8,
        borderRadius: 2,
        background: open ? color : 'rgba(255,255,255,0.25)',
        boxShadow: open ? `0 0 10px ${color}` : 'none',
        transition: 'all 0.3s',
      }}>
        {open && (
          <div style={{
            position: 'absolute',
            inset: -3,
            borderRadius: 4,
            border: `1px solid ${color}`,
            animation: 'cm-drsPing 1s ease-out infinite',
          }} />
        )}
      </div>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 8,
        letterSpacing: '0.25em',
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 800,
      }}>DRS</span>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.15em',
        color: open ? color : 'rgba(255,255,255,0.4)',
        textShadow: open ? `0 0 10px ${color}` : 'none',
        transition: 'all 0.3s',
      }}>{open ? 'OPEN' : 'CLOSED'}</span>
    </div>
  );
}

/* ============================================================ */
/* ============ ✨ DATA RAIN (colonne hex) ==================== */
/* ============================================================ */
function DataRain({ color, side = 'left', delay = 0 }) {
  const CHARS = '0123456789ABCDEF';
  const cols = 3;
  const rows = 18;

  return (
    <div style={{
      position: 'absolute',
      top: 62,
      bottom: 62,
      [side]: 8,
      width: 40,
      display: 'flex',
      flexDirection: 'row',
      gap: 4,
      opacity: 0.42,
      pointerEvents: 'none',
      maskImage: 'linear-gradient(180deg, transparent 0%, black 25%, black 75%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 25%, black 75%, transparent 100%)',
      zIndex: 3,
      animation: `cm-hudFade 0.8s ease ${delay}s both`,
    }}>
      {[...Array(cols)].map((_, ci) => (
        <div key={ci} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          fontFamily: 'var(--font-display)',
          fontSize: 8,
          fontWeight: 900,
          color: color,
          lineHeight: 1,
          textShadow: `0 0 6px ${color}`,
          writingMode: 'horizontal-tb',
        }}>
          {[...Array(rows)].map((_, ri) => {
            const c = CHARS[(ci * 7 + ri * 5) % CHARS.length];
            const opacity = 0.2 + ((ci + ri) % 6) * 0.13;
            return (
              <span key={ri} style={{
                opacity,
                animation: `cm-dataBlink ${1.6 + ((ci + ri) % 4) * 0.35}s ease-in-out ${((ci * 3 + ri) % 9) * 0.18}s infinite`,
              }}>{c}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ============================================================ */
/* ============ ⚡ ENERGY ARCS (autour du numéro) ============= */
/* ============================================================ */
function EnergyArcs({ color }) {
  return (
    <div style={{
      position: 'absolute',
      right: '2%',
      top: '2%',
      width: 'clamp(280px, 40vw, 620px)',
      height: 'clamp(280px, 40vw, 620px)',
      pointerEvents: 'none',
      zIndex: 1,
      opacity: 0.85,
    }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id={`arcGrad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Arc 1 — top-right */}
        <path
          d="M 110,20 A 90,90 0 0,1 180,90"
          fill="none"
          stroke={`url(#arcGrad-${color.replace('#', '')})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 8"
          style={{ animation: 'cm-arcDash 3s linear infinite' }}
        />

        {/* Arc 2 — bottom-left */}
        <path
          d="M 90,180 A 90,90 0 0,1 20,110"
          fill="none"
          stroke={`url(#arcGrad-${color.replace('#', '')})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="6 10"
          style={{ animation: 'cm-arcDash 3.6s linear infinite reverse' }}
        />

        {/* Arc 3 — full orbit outer (dashed) */}
        <circle
          cx="100" cy="100" r="92"
          fill="none"
          stroke={color}
          strokeWidth="0.6"
          strokeDasharray="2 14"
          opacity="0.55"
          style={{
            transformOrigin: 'center',
            animation: 'cm-arcRotate 24s linear infinite',
          }}
        />

        {/* Arc 4 — tick marks rotating */}
        <g style={{ transformOrigin: 'center', animation: 'cm-arcRotate 16s linear infinite reverse' }}>
          {[...Array(24)].map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const x1 = 100 + Math.cos(angle) * 86;
            const y1 = 100 + Math.sin(angle) * 86;
            const x2 = 100 + Math.cos(angle) * 92;
            const y2 = 100 + Math.sin(angle) * 92;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth="0.8"
                opacity={i % 3 === 0 ? 0.9 : 0.4}
              />
            );
          })}
        </g>

        {/* Pulsing core ring */}
        <circle
          cx="100" cy="100" r="72"
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          opacity="0.35"
          style={{ animation: 'cm-arcPulse 2.4s ease-in-out infinite' }}
        />
      </svg>
    </div>
  );
}

/* ============================================================ */
/* ============ ✨ KINETIC NAME (lettre par lettre) =========== */
/* ============================================================ */
function KineticName({ text, baseDelay = 400 }) {
  const letters = (text || '').split('');
  return (
    <span style={{ display: 'inline-block' }}>
      {letters.map((char, i) => (
        <span key={i} style={{
          display: 'inline-block',
          animation: `cm-letterIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) ${baseDelay + i * 55}ms both`,
          whiteSpace: char === ' ' ? 'pre' : 'normal',
        }}>{char}</span>
      ))}
    </span>
  );
}

/* ============================================================ */
/* ============ 🎞️ GLITCH BANDS (transition) ================= */
/* ============================================================ */
function GlitchBands({ color }) {
  // Positions déterministes pour éviter les sauts
  const bands = [
    { top: '12%', h: 8,  left: '0%',  w: '100%', d: 0.00 },
    { top: '22%', h: 14, left: '8%',  w: '80%',  d: 0.06 },
    { top: '38%', h: 6,  left: '20%', w: '60%',  d: 0.02 },
    { top: '52%', h: 10, left: '0%',  w: '90%',  d: 0.10 },
    { top: '68%', h: 5,  left: '14%', w: '70%',  d: 0.04 },
    { top: '80%', h: 12, left: '6%',  w: '85%',  d: 0.08 },
    { top: '90%', h: 4,  left: '0%',  w: '100%', d: 0.01 },
  ];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 96,
      mixBlendMode: 'screen',
      overflow: 'hidden',
    }}>
      {bands.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: b.top,
            left: b.left,
            width: b.w,
            height: b.h,
            background: i % 2 === 0
              ? `linear-gradient(90deg, transparent 0%, ${color}aa 40%, #ffffff 50%, ${color}aa 60%, transparent 100%)`
              : `linear-gradient(90deg, transparent 0%, rgba(255,60,60,0.6) 30%, rgba(60,120,255,0.6) 70%, transparent 100%)`,
            transform: 'translateX(-110%)',
            filter: 'blur(1px)',
            animation: `cm-glitchBand 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${b.d}s both`,
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================ */
/* ============ 💥 SPEED BURST (lignes radiales) ============= */
/* ============================================================ */
function SpeedBurst({ color }) {
  const rays = 18;
  return (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      width: 1, height: 1,
      pointerEvents: 'none',
      zIndex: 4,
      opacity: 0.9,
    }}>
      {[...Array(rays)].map((_, i) => {
        const angle = (i / rays) * 360;
        const long = i % 2 === 0;
        return (
          <div key={i} style={{
            position: 'absolute',
            top: 0, left: 0,
            width: long ? 3 : 2,
            height: long ? '62vh' : '44vh',
            background: `linear-gradient(180deg, ${color}00 0%, ${color}ee 40%, ${color}00 100%)`,
            transformOrigin: 'top center',
            transform: `rotate(${angle}deg) translateY(-1px)`,
            opacity: 0,
            animation: `cm-burstRay 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.015}s both`,
            filter: 'blur(0.5px)',
            boxShadow: `0 0 12px ${color}`,
          }} />
        );
      })}
    </div>
  );
}

/* ============================================================ */
/* ============ 🌊 RIPPLE WAVE (ondes on entry) ============== */
/* ============================================================ */
function RippleWave({ color }) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      pointerEvents: 'none',
      zIndex: 5,
    }}>
      {[0, 0.25, 0.5].map((delay, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 200, height: 200,
            marginLeft: -100,
            marginTop: -100,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            opacity: 0,
            animation: `cm-ripple 1.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
            boxShadow: `0 0 30px ${color}88, inset 0 0 30px ${color}44`,
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================ */
/* ============ MAIN COMPONENT ================================ */
/* ============================================================ */
export default function CinemaMode() {
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState(false);

  const rafRef = useRef(null);
  const startRef = useRef(0);

  /* ============ FETCH ============ */
  useEffect(() => {
    api.get('/drivers')
      .then(r => {
        const withPhoto = r.data.filter(d => d.photoUrl || d.actionPhotoUrl);
        setDrivers(withPhoto);
      })
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  /* ============ INTRO → PLAYING ============ */
  useEffect(() => {
    if (phase !== 'intro') return;
    const t = setTimeout(() => setPhase('playing'), INTRO_DURATION);
    return () => clearTimeout(t);
  }, [phase]);

  /* ============ PROGRESS TICKER ============ */
  useEffect(() => {
    if (phase !== 'playing' || paused || drivers.length === 0) return;

    startRef.current = performance.now() - (progress / 100) * SLIDE_DURATION;

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const p = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(p);

      if (p >= 100) {
        if (currentIndex >= drivers.length - 1) {
          setPhase('outro');
        } else {
          triggerFlash();
          setCurrentIndex(i => i + 1);
          setProgress(0);
        }
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line
  }, [phase, paused, currentIndex, drivers.length]);

  /* ============ OUTRO → REDIRECT ============ */
  useEffect(() => {
    if (phase !== 'outro') return;
    const t = setTimeout(() => navigate('/drivers'), 2600);
    return () => clearTimeout(t);
  }, [phase, navigate]);

  /* ============ HELPERS ============ */
  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
  };

  const next = useCallback(() => {
    setProgress(0);
    if (currentIndex < drivers.length - 1) {
      triggerFlash();
      setCurrentIndex(i => i + 1);
    } else {
      setPhase('outro');
    }
  }, [currentIndex, drivers.length]);

  const prev = useCallback(() => {
    setProgress(0);
    if (currentIndex > 0) {
      triggerFlash();
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  /* ============ KEYBOARD ============ */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') navigate('/');
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'p' || e.key === 'P') setPaused(p => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, next, prev]);

  /* ============ LOCK SCROLL ============ */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ============ LOADING ============ */
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'grid', placeItems: 'center',
        color: 'var(--f1-red)', fontFamily: 'var(--font-display)',
        letterSpacing: '0.3em',
      }}>◆ CHARGEMENT…</div>
    );
  }

  /* ============ EMPTY ============ */
  if (drivers.length === 0) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'grid', placeItems: 'center', color: '#fff', textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🎬</div>
          <h3 style={{ color: 'var(--text-dim)', marginBottom: 20 }}>
            Aucun pilote pour le mode cinéma
          </h3>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              background: 'var(--f1-red)', border: 'none', borderRadius: 6,
              color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--font-heading)', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
            }}
          >Retour</button>
        </div>
      </div>
    );
  }

  const driver = drivers[currentIndex];
  const color = driver?.teamColor || '#e10600';
  const photo = driver?.actionPhotoUrl || driver?.photoUrl;
  const carImage = findCarImage(driver?.teamName);
  const hasMap = driver?.latitude != null && driver?.longitude != null;
  const driverCode = (driver?.lastName || '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase();

  const barcodeBars = Array.from({ length: 26 }, (_, i) => {
    const seed = ((driver?.id || 1) * 17 + i * 31) % 100;
    return seed % 3 === 0 ? 3 : seed % 2 === 0 ? 1 : 2;
  });

  const positionsGained = ((driver?.id || 1) * 3) % 5 + 1;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000', overflow: 'hidden', userSelect: 'none',
    }}>

      {/* ============================================================ */}
      {/* ============ GLOBAL STYLES ================================= */}
      {/* ============================================================ */}
      <style>{`
        @keyframes cm-fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes cm-slideEnter {
          0%   { opacity: 0; transform: scale(1.08); filter: blur(14px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes cm-slideInRight {
          0%   { opacity: 0; transform: translateX(90px) scale(0.94); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes cm-slideInLeft {
          0%   { opacity: 0; transform: translateX(-60px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes cm-slideUp {
          0%   { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes cm-carSlideUp {
          0%   { opacity: 0; transform: translateX(-50%) translateY(120px) scale(0.92); }
          60%  { opacity: 0.7; }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes cm-zoomLogo {
          0%   { transform: scale(0.25) rotate(-18deg); opacity: 0; filter: blur(30px); }
          60%  { transform: scale(1.12) rotate(5deg); opacity: 1; filter: blur(0); }
          100% { transform: scale(1) rotate(0); opacity: 1; filter: blur(0); }
        }
        @keyframes cm-pulseGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes cm-scanLine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes cm-pinPulse {
          0%, 100% { transform: scale(1);   opacity: 0.8; }
          50%      { transform: scale(1.4); opacity: 1; }
        }
        @keyframes cm-letterboxTop {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }
        @keyframes cm-letterboxBot {
          0%   { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes cm-recBlink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0.15; }
        }
        @keyframes cm-grainShift {
          0%   { background-position: 0 0; }
          100% { background-position: 220px 140px; }
        }
        @keyframes cm-streak {
          0%   { transform: translateX(-100%) scaleX(0.4); opacity: 0; }
          20%  { opacity: 0.9; }
          80%  { opacity: 0.9; }
          100% { transform: translateX(120%) scaleX(1); opacity: 0; }
        }
        @keyframes cm-flashFade {
          0%   { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes cm-ringOut {
          0%   { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes cm-hudFade {
          0%   { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes cm-waveform {
          0%, 100% { transform: scaleY(0.3); }
          50%      { transform: scaleY(1); }
        }
        @keyframes cm-drift {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-160px); }
        }
        @keyframes cm-crownPop {
          0%   { transform: scale(0) rotate(-180deg); opacity: 0; }
          60%  { transform: scale(1.25) rotate(8deg);  opacity: 1; }
          100% { transform: scale(1) rotate(0);        opacity: 1; }
        }
        @keyframes cm-scanTravel {
          0%   { top: 0%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes cm-bracketPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes cm-dotBlink {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50%      { opacity: 1; transform: scale(1.1); }
        }
        @keyframes cm-carShine {
          0%   { transform: translateX(-100%); opacity: 0; }
          30%  { opacity: 0.7; }
          70%  { opacity: 0.7; }
          100% { transform: translateX(500%); opacity: 0; }
        }
        @keyframes cm-drsPing {
          0%   { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        /* ============ NEW: effects & transitions ============ */
        @keyframes cm-dataBlink {
          0%, 100% { opacity: 0.15; }
          50%      { opacity: 1; }
        }
        @keyframes cm-letterIn {
          0%   { opacity: 0; transform: translateY(60px) rotate(-18deg) scale(0.4); filter: blur(10px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); filter: blur(0); }
        }
        @keyframes cm-arcDash {
          to { stroke-dashoffset: -80; }
        }
        @keyframes cm-arcRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cm-arcPulse {
          0%, 100% { r: 72; opacity: 0.35; }
          50%      { r: 78; opacity: 0.8; }
        }
        @keyframes cm-glitchBand {
          0%   { transform: translateX(-110%); opacity: 0; }
          20%  { opacity: 1; }
          60%  { opacity: 0.9; }
          100% { transform: translateX(110%); opacity: 0; }
        }
        @keyframes cm-burstRay {
          0%   { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-1px) scaleY(0.1); }
          30%  { opacity: 1; }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-1px) scaleY(1); }
        }
        @keyframes cm-ripple {
          0%   { transform: scale(0.2); opacity: 0.9; }
          100% { transform: scale(5);   opacity: 0; }
        }
      `}</style>

      {/* ============================================================ */}
      {/* ============ FLASH CUT OVERLAY ============================= */}
      {/* ============================================================ */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 50%, #ffffff 0%, ${color}aa 40%, transparent 75%)`,
          pointerEvents: 'none',
          zIndex: 100,
          animation: 'cm-flashFade 0.2s ease-out',
          mixBlendMode: 'screen',
        }} />
      )}

      {/* ============================================================ */}
      {/* ============ FILM GRAIN ==================================== */}
      {/* ============================================================ */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',
        zIndex: 90,
        opacity: 0.08,
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        backgroundSize: '200px 200px',
        animation: 'cm-grainShift 0.6s steps(6) infinite',
      }} />

      {/* ============================================================ */}
      {/* ============ PHASE 1 — INTRO =============================== */}
      {/* ============================================================ */}
      {phase === 'intro' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at center, #240000 0%, #000 72%)',
          display: 'grid', placeItems: 'center',
          animation: 'cm-fadeIn 0.5s ease',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '55%',
            backgroundImage: `
              linear-gradient(rgba(225,6,0,0.35) 1px, transparent 1px),
              linear-gradient(90deg, rgba(225,6,0,0.35) 1px, transparent 1px)
            `,
            backgroundSize: '80px 40px',
            transform: 'perspective(400px) rotateX(70deg)',
            transformOrigin: 'bottom center',
            maskImage: 'linear-gradient(180deg, transparent 0%, black 60%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 60%)',
            animation: 'cm-drift 2.4s linear infinite',
            opacity: 0.7,
          }} />

          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {[...Array(16)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute', top: `${i * 6.2}%`,
                left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, ${
                  i % 3 === 0 ? '#e10600' : 'rgba(255,255,255,0.15)'
                }, transparent)`,
                animation: `cm-scanLine ${1.5 + (i % 4) * 0.3}s linear infinite`,
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>

          <div style={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 500, height: 500,
              background: 'radial-gradient(circle, rgba(225,6,0,0.55) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'cm-pulseGlow 2s ease-in-out infinite',
            }} />

            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 400, height: 400,
              marginLeft: -200, marginTop: -200,
              border: '2px solid rgba(225,6,0,0.7)',
              borderRadius: '50%',
              animation: 'cm-ringOut 1.8s ease-out infinite',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 400, height: 400,
              marginLeft: -200, marginTop: -200,
              border: '2px solid rgba(225,6,0,0.5)',
              borderRadius: '50%',
              animation: 'cm-ringOut 1.8s ease-out 0.9s infinite',
              pointerEvents: 'none',
            }} />

            <img src="/Logo.png" alt="F1 Apex" style={{
              position: 'relative', height: 170, width: 'auto',
              filter: 'drop-shadow(0 0 60px rgba(225,6,0,1)) drop-shadow(0 0 120px rgba(225,6,0,0.6))',
              animation: 'cm-zoomLogo 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }} />

            <div style={{
              marginTop: 44,
              fontFamily: 'var(--font-display)',
              fontSize: 11, letterSpacing: '0.5em',
              color: '#e10600', fontWeight: 700,
              textShadow: '0 0 20px #e10600',
              animation: 'cm-slideUp 0.7s ease 0.3s both',
            }}>◆ MODE CINÉMA ◆</div>

            <div style={{
              marginTop: 14,
              fontFamily: 'var(--font-heading)',
              fontSize: 40, fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              color: '#fff',
              textShadow: '0 0 50px rgba(225,6,0,0.85), 0 6px 30px rgba(0,0,0,0.9)',
              animation: 'cm-slideUp 0.7s ease 0.5s both',
            }}>LA GRILLE 2026</div>

            <div style={{
              marginTop: 12,
              fontFamily: 'var(--font-display)',
              fontSize: 10, letterSpacing: '0.5em',
              color: 'rgba(255,255,255,0.45)',
              animation: 'cm-slideUp 0.7s ease 0.7s both',
            }}>
              {String(drivers.length).padStart(2, '0')} PILOTES · SÉQUENCE AUTO
            </div>

            <div style={{
              width: 340, height: 3,
              margin: '44px auto 0',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 2, overflow: 'hidden',
              animation: 'cm-slideUp 0.7s ease 0.9s both',
            }}>
              <div style={{
                height: '100%', width: '100%',
                background: 'linear-gradient(90deg, #7a0300, #e10600, #ff1e00)',
                boxShadow: '0 0 24px #e10600',
                animation: `progressIntro ${INTRO_DURATION}ms linear`,
              }} />
            </div>
          </div>

          <style>{`
            @keyframes progressIntro {
              from { transform: translateX(-100%); }
              to   { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}

      {/* ============================================================ */}
      {/* ============ PHASE 2 — PLAYING ============================= */}
      {/* ============================================================ */}
      {phase === 'playing' && driver && (
        <div key={driver.id} style={{
          position: 'absolute', inset: 0,
          animation: 'cm-slideEnter 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>

          {/* Base gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at 32% 55%, ${color}55 0%, #000 72%)`,
            transition: 'background 0.8s',
          }} />

          {/* Diagonale sweep */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(115deg, transparent 45%, ${color}22 48%, transparent 52%)`,
            pointerEvents: 'none',
          }} />

          {/* ============================================================ */}
          {/* 💥 SPEED BURST — radial lines on entry ==================== */}
          {/* ============================================================ */}
          <SpeedBurst color={color} />

          {/* ============================================================ */}
          {/* 🌊 RIPPLE WAVE — expanding rings on entry ================= */}
          {/* ============================================================ */}
          <RippleWave color={color} />

          {/* ============================================================ */}
          {/* 🎞️ GLITCH BANDS — sweep across on entry ================== */}
          {/* ============================================================ */}
          <GlitchBands color={color} />

          {/* ============================================================ */}
          {/* 🏎️ VOITURE F1 — floutée, plus grande, DERRIÈRE le pilote ==== */}
          {/* ============================================================ */}
          {carImage && (
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              width: '92%',
              maxWidth: 1400,
              pointerEvents: 'none',
              zIndex: 0,
              opacity: 0.75,
              filter: `blur(7px) drop-shadow(0 -20px 80px ${color}55) drop-shadow(0 40px 100px rgba(0,0,0,0.95))`,
              transform: 'translateX(-50%)',
              animation: 'cm-carSlideUp 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both',
              maskImage: 'linear-gradient(180deg, transparent 0%, black 40%, black 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 40%, black 100%)',
            }}>
              <img
                src={carImage}
                alt={`${driver.teamName} F1 Car`}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                  filter: `contrast(1.18) saturate(1.25)`,
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />

              <div style={{
                position: 'absolute',
                top: '10%', bottom: '40%',
                left: 0,
                width: '30%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'cm-carShine 4s ease-in-out 2s infinite',
                pointerEvents: 'none',
                mixBlendMode: 'overlay',
              }} />

              <div style={{
                position: 'absolute',
                bottom: 0, left: '10%', right: '10%',
                height: 8,
                background: `radial-gradient(ellipse, ${color}ee 0%, transparent 70%)`,
                filter: 'blur(10px)',
                pointerEvents: 'none',
              }} />
            </div>
          )}

          {/* Giant rotated driver code */}
          {driverCode && (
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%) rotate(-12deg)',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(320px, 48vw, 720px)',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: '-0.06em',
              color: 'transparent',
              WebkitTextStroke: `2px ${color}`,
              opacity: 0.05,
              lineHeight: 0.85,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 1,
              animation: 'cm-slideEnter 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>{driverCode}</div>
          )}

          {/* Speed streaks */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: `${15 + i * 13}%`,
                left: 0, right: 0, height: i % 2 ? 2 : 1,
                background: `linear-gradient(90deg, transparent, ${color}cc, transparent)`,
                animation: `cm-streak ${1.2 + (i % 3) * 0.4}s linear infinite`,
                animationDelay: `${i * 0.35}s`,
                opacity: 0.5,
              }} />
            ))}
          </div>

          {/* ============================================================ */}
          {/* ✨ DATA RAIN — colonnes de caractères hex ================== */}
          {/* ============================================================ */}
          <DataRain color={color} side="left" delay={0.9} />

          {/* ============================================================ */}
          {/* ⚡ ENERGY ARCS — autour du gros numéro ===================== */}
          {/* ============================================================ */}
          <EnergyArcs color={color} />

          {/* ============================================================ */}
          {/* PHOTO PILOTE =============================================== */}
          {/* ============================================================ */}
          {photo && (
            <div style={{
              position: 'absolute',
              right: 0, top: 0, bottom: 0,
              width: '60%',
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '80px 40px 60px',
              animation: 'cm-slideInRight 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
              zIndex: 2,
            }}>
              <div style={{
                position: 'absolute',
                bottom: '10%', right: '8%',
                width: 620, height: 620,
                background: `radial-gradient(circle, ${color}88 0%, transparent 65%)`,
                filter: 'blur(70px)',
                animation: 'cm-pulseGlow 3s ease-in-out infinite',
                pointerEvents: 'none',
              }} />

              <img
                src={imgSrc(photo)}
                alt={driver.lastName}
                style={{
                  position: 'relative',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  filter: `drop-shadow(0 40px 80px rgba(0,0,0,0.95)) drop-shadow(0 0 90px ${color}cc)`,
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />

              {/* Brackets */}
              {[
                { top: 60, left: 40, r: 0 },
                { top: 60, right: 40, r: 90 },
                { bottom: 90, right: 40, r: 180 },
                { bottom: 90, left: 40, r: 270 },
              ].map((c, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: c.top, left: c.left, right: c.right, bottom: c.bottom,
                  width: 32, height: 32,
                  borderTop: `2px solid ${color}`,
                  borderLeft: `2px solid ${color}`,
                  transform: `rotate(${c.r}deg)`,
                  opacity: 0.75,
                  pointerEvents: 'none',
                  filter: `drop-shadow(0 0 8px ${color})`,
                  animation: `cm-bracketPulse 2.4s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}

              {/* Scan line */}
              <div style={{
                position: 'absolute',
                left: '5%', right: '5%', top: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                boxShadow: `0 0 20px ${color}, 0 0 40px ${color}88`,
                pointerEvents: 'none',
                animation: 'cm-scanTravel 3.6s ease-in-out infinite',
                opacity: 0.85,
              }} />
            </div>
          )}

          {/* GROS NUMÉRO avec aberration chromatique */}
          {driver.number && (
            <>
              <div style={{
                position: 'absolute', right: '4%', top: '4%',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(200px, 34vw, 520px)',
                fontWeight: 900, fontStyle: 'italic',
                color: 'transparent',
                WebkitTextStroke: `3px rgba(255,40,40,0.35)`,
                opacity: 0.5, lineHeight: 0.8,
                letterSpacing: '-0.05em',
                pointerEvents: 'none',
                transform: 'translate(-3px, -2px)',
                animation: 'cm-slideInRight 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
                zIndex: 1,
              }}>{driver.number}</div>
              <div style={{
                position: 'absolute', right: '4%', top: '4%',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(200px, 34vw, 520px)',
                fontWeight: 900, fontStyle: 'italic',
                color: 'transparent',
                WebkitTextStroke: `3px rgba(40,120,255,0.35)`,
                opacity: 0.5, lineHeight: 0.8,
                letterSpacing: '-0.05em',
                pointerEvents: 'none',
                transform: 'translate(3px, 2px)',
                animation: 'cm-slideInRight 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
                zIndex: 1,
              }}>{driver.number}</div>
              <div style={{
                position: 'absolute', right: '4%', top: '4%',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(200px, 34vw, 520px)',
                fontWeight: 900, fontStyle: 'italic',
                color: 'transparent',
                WebkitTextStroke: `3px ${color}`,
                opacity: 0.14, lineHeight: 0.8,
                letterSpacing: '-0.05em',
                pointerEvents: 'none',
                animation: 'cm-slideInRight 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
                zIndex: 1,
              }}>{driver.number}</div>
            </>
          )}

          {/* Left rail */}
          {driverCode && (
            <div style={{
              position: 'absolute',
              left: 26, top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 10,
              zIndex: 5,
              animation: 'cm-slideInLeft 0.9s ease 0.3s both',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    animation: `cm-dotBlink 1.6s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <div style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontFamily: 'var(--font-display)',
                fontSize: 14, fontWeight: 900,
                letterSpacing: '0.8em',
                color: color,
                textShadow: `0 0 20px ${color}`,
                whiteSpace: 'nowrap',
              }}>
                {driverCode} · {driver.nationality?.slice(0, 3).toUpperCase() || '—'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    animation: `cm-dotBlink 1.6s ease-in-out ${(i + 4) * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Right barcode */}
          <div style={{
            position: 'absolute',
            right: 20, top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column',
            gap: 2, zIndex: 5, opacity: 0.7,
            animation: 'cm-slideInRight 0.9s ease 0.4s both',
          }}>
            {barcodeBars.map((w, i) => (
              <div key={i} style={{
                width: 14, height: w,
                background: i % 2 === 0 ? color : 'rgba(255,255,255,0.6)',
                boxShadow: i % 2 === 0 ? `0 0 6px ${color}88` : 'none',
              }} />
            ))}
          </div>

          {/* ============================================================ */}
          {/* BLOC TEXTE ================================================= */}
          {/* ============================================================ */}
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: '52%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            padding: '100px 60px 110px 70px',
            zIndex: 4,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              marginBottom: 22,
              animation: 'cm-slideInLeft 0.7s ease 0.1s both',
            }}>
              <span style={{ width: 44, height: 2, background: color, boxShadow: `0 0 15px ${color}` }} />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11, letterSpacing: '0.4em',
                color, fontWeight: 700,
                textShadow: `0 0 20px ${color}`,
              }}>◆ PILOTE #{String(currentIndex + 1).padStart(2, '0')}</span>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                background: 'rgba(0,0,0,0.55)',
                border: `1px solid ${color}66`,
                borderRadius: 4,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, fontWeight: 900,
                  color: '#fff',
                  letterSpacing: '0.05em',
                }}>P{currentIndex + 1}</span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 9, fontWeight: 900,
                  color: '#00d26a',
                  textShadow: '0 0 8px #00d26a',
                }}>▲{positionsGained}</span>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              marginBottom: 16,
              animation: 'cm-slideInLeft 0.7s ease 0.2s both',
            }}>
              {driver.countryCode && (
                <img src={flagSrc(driver.countryCode)} alt={driver.countryCode}
                  style={{
                    height: 34, width: 'auto', borderRadius: 4,
                    boxShadow: `0 0 22px ${color}88, 0 4px 12px rgba(0,0,0,0.8)`,
                  }} />
              )}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12, letterSpacing: '0.32em',
                color: '#fff', fontWeight: 700,
                textShadow: '0 2px 12px rgba(0,0,0,0.8)',
              }}>{driver.nationality?.toUpperCase() || ''}</span>
            </div>

            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.36em',
              color: 'rgba(255,255,255,0.65)', marginBottom: 8,
              animation: 'cm-slideInLeft 0.7s ease 0.3s both',
            }}>{driver.firstName}</div>

            {/* ============================================================ */}
            {/* ✨ KINETIC NAME — chaque lettre arrive individuellement ==== */}
            {/* ============================================================ */}
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(56px, 7.5vw, 118px)',
              fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '-0.045em', lineHeight: 0.88,
              color: '#fff', margin: 0,
              textShadow: `0 0 60px ${color}, 0 12px 40px rgba(0,0,0,0.95)`,
            }}>
              <KineticName
                text={driver.lastName?.toUpperCase() || ''}
                baseDelay={400}
              />
            </h1>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 14,
              marginTop: 26,
              animation: 'cm-slideInLeft 0.7s ease 0.5s both',
            }}>
              {driver.teamLogoUrl && (
                <img src={imgSrc(driver.teamLogoUrl)} alt={driver.teamName}
                  style={{
                    height: 48, width: 'auto',
                    background: '#fff', padding: 8, borderRadius: 8,
                    boxShadow: `0 0 30px ${color}cc`,
                  }} />
              )}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17, fontWeight: 900,
                letterSpacing: '0.18em', color,
                textShadow: `0 0 22px ${color}`,
              }}>{driver.teamName?.toUpperCase() || ''}</span>
            </div>

            <div style={{
              display: 'flex', gap: 30, marginTop: 42, flexWrap: 'wrap',
            }}>
              <StatBlock label="GP"      value={driver.gpEntered} color={color} delay={600} />
              <StatBlock label="PODIUMS" value={driver.podiums}   color={color} delay={720} />
              <StatBlock label="TITRES"  value={driver.worldChampionships} color={color} delay={840} crowns={driver.worldChampionships} />
            </div>

            {hasMap && (
              <div style={{ marginTop: 30, animation: 'cm-slideInLeft 0.7s ease 0.9s both' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  marginBottom: 10,
                }}>
                  <span style={{
                    width: 6, height: 6, background: color,
                    boxShadow: `0 0 8px ${color}`, transform: 'rotate(45deg)',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 9, letterSpacing: '0.3em',
                    color: 'var(--text-dim)', fontWeight: 700,
                  }}>◆ LIEU DE NAISSANCE</span>
                </div>
                <MiniBirthMap driver={driver} color={color} />
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* HUD CORNERS ================================================ */}
          {/* ============================================================ */}
          <div style={{
            position: 'absolute', top: 78, left: 70,
            display: 'flex', alignItems: 'center', gap: 12,
            zIndex: 8,
            animation: 'cm-hudFade 0.6s ease 0.4s both',
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#ff2e2e',
              boxShadow: '0 0 14px #ff2e2e, 0 0 28px #ff2e2e',
              animation: 'cm-recBlink 1s steps(1) infinite',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10, letterSpacing: '0.3em',
              color: '#fff', fontWeight: 800,
              textShadow: '0 0 10px rgba(255,46,46,0.9)',
            }}>REC</span>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.25)' }} />
            <LiveTimecode color={color} paused={paused} />
          </div>

          <div style={{
            position: 'absolute', top: 78, right: 70,
            display: 'flex', alignItems: 'flex-end', gap: 3,
            zIndex: 8,
            animation: 'cm-hudFade 0.6s ease 0.5s both',
          }}>
            {[6, 10, 14, 18, 22].map((h, i) => (
              <div key={i} style={{
                width: 3, height: h,
                background: i < 4 ? color : 'rgba(255,255,255,0.2)',
                boxShadow: i < 4 ? `0 0 8px ${color}` : 'none',
                animation: `cm-waveform 1.2s ease-in-out ${i * 0.1}s infinite`,
                transformOrigin: 'bottom',
              }} />
            ))}
            <span style={{
              marginLeft: 10,
              fontFamily: 'var(--font-display)',
              fontSize: 9, letterSpacing: '0.25em',
              color: 'rgba(255,255,255,0.7)', fontWeight: 700,
            }}>LIVE</span>
          </div>

          {/* SECTEURS + DRS — coin bas gauche ============== */}
          <div style={{
            position: 'absolute', bottom: 78, left: 70,
            zIndex: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <SectorPanel driver={driver} color={color} />
            <DRSIndicator color={color} active={!paused} />
          </div>

          <div style={{
            position: 'absolute', bottom: 78, right: 70,
            textAlign: 'right',
            zIndex: 8,
            animation: 'cm-hudFade 0.6s ease 0.7s both',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9, letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.5)', fontWeight: 700,
              marginBottom: 4,
            }}>SÉQUENCE</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22, fontWeight: 900,
              color: '#fff',
              letterSpacing: '0.04em',
              textShadow: `0 0 18px ${color}cc`,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {String(currentIndex + 1).padStart(2, '0')}
              <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>/</span>
              <span style={{ color }}>{String(drivers.length).padStart(2, '0')}</span>
            </div>
          </div>

          {/* G-FORCE — coin bas gauche (au-dessus des secteurs) ====== */}
          <div style={{
            position: 'absolute',
            bottom: 130,
            left: 70,
            zIndex: 8,
          }}>
            <GForceMeter color={color} active={!paused} driverId={driver.id} />
          </div>

          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 30px ${color}`,
          }} />

          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
            pointerEvents: 'none', opacity: 0.35,
          }} />

          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.75) 100%)',
            pointerEvents: 'none',
          }} />

          {/* Letterbox */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 60,
            background: '#000',
            zIndex: 9,
            animation: 'cm-letterboxTop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
            boxShadow: '0 4px 24px rgba(0,0,0,0.9)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            background: '#000',
            zIndex: 9,
            animation: 'cm-letterboxBot 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.9)',
          }} />

          {/* Progress segmented */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 60,
            display: 'flex', alignItems: 'center',
            padding: '0 70px', gap: 6,
            zIndex: 10,
          }}>
            {drivers.map((_, i) => {
              let fill = 0;
              if (i < currentIndex) fill = 100;
              else if (i === currentIndex) fill = progress;
              return (
                <div key={i} style={{
                  flex: 1, height: 3,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 2, overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    width: `${fill}%`,
                    background: i <= currentIndex
                      ? `linear-gradient(90deg, ${color}, ${color}dd)`
                      : 'transparent',
                    boxShadow: i === currentIndex ? `0 0 12px ${color}` : 'none',
                    transition: 'width 0.1s linear',
                  }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ============ PHASE 3 — OUTRO =============================== */}
      {/* ============================================================ */}
      {phase === 'outro' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at center, #240000 0%, #000 72%)',
          display: 'grid', placeItems: 'center',
          animation: 'cm-fadeIn 0.6s ease',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: `${i * 8.5}%`,
                left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(225,6,0,0.5), transparent)',
                animation: `cm-scanLine ${1.8 + (i % 4) * 0.3}s linear infinite`,
                animationDelay: `${i * 0.12}s`,
              }} />
            ))}
          </div>

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <img src="/Logo.png" alt="F1 Apex" style={{
              height: 140, width: 'auto',
              filter: 'drop-shadow(0 0 60px rgba(225,6,0,1))',
              marginBottom: 40,
              animation: 'cm-zoomLogo 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13, letterSpacing: '0.55em',
              color: '#e10600', fontWeight: 700,
              textShadow: '0 0 30px #e10600', marginBottom: 14,
              animation: 'cm-slideUp 0.6s ease 0.2s both',
            }}>◆ MERCI D'AVOIR REGARDÉ ◆</div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 32, fontWeight: 900,
              textTransform: 'uppercase', color: '#fff',
              letterSpacing: '0.08em',
              textShadow: '0 0 40px rgba(225,6,0,0.85)',
              animation: 'cm-slideUp 0.6s ease 0.4s both',
            }}>Rendez-vous sur la grille</div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ============ PLAYER CONTROLS =============================== */}
      {/* ============================================================ */}
      {phase === 'playing' && (
        <>
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 14px',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${color}66`,
            borderRadius: 999,
            boxShadow: `0 10px 40px rgba(0,0,0,0.9), 0 0 30px ${color}44`,
            zIndex: 12,
          }}>
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'transparent',
                border: `1px solid ${currentIndex === 0 ? 'rgba(255,255,255,0.15)' : color}`,
                color: currentIndex === 0 ? 'rgba(255,255,255,0.3)' : color,
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'grid', placeItems: 'center',
                fontSize: 15, fontWeight: 700,
                padding: 0, lineHeight: 1,
                transition: 'all 0.2s',
              }}
            >‹</button>

            <button
              onClick={() => setPaused(p => !p)}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                border: 'none', color: '#fff', cursor: 'pointer',
                display: 'grid', placeItems: 'center',
                boxShadow: `0 0 25px ${color}cc, inset 0 1px 0 rgba(255,255,255,0.3)`,
                padding: 0, fontSize: 14,
              }}
            >{paused ? '▶' : '❚❚'}</button>

            <button
              onClick={next}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'transparent',
                border: `1px solid ${color}`,
                color, cursor: 'pointer',
                display: 'grid', placeItems: 'center',
                fontSize: 15, fontWeight: 700,
                padding: 0, lineHeight: 1,
              }}
            >›</button>
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              position: 'absolute', top: 74, right: 24,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', cursor: 'pointer',
              display: 'grid', placeItems: 'center',
              fontSize: 20, fontWeight: 700,
              zIndex: 12, padding: 0,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#e10600';
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
              e.currentTarget.style.transform = 'rotate(0) scale(1)';
            }}
          >×</button>
        </>
      )}
    </div>
  );
}

/* ============================================================ */
/* ============ MINI BIRTH MAP ================================ */
/* ============================================================ */

function MiniBirthMap({ driver, color }) {
  const { latitude, longitude, birthCity, nationality, birthYear } = driver;

  const icon = L.divIcon({
    className: 'cinema-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px;">
        <div style="
          position: absolute; inset: 0; border-radius: 50%;
          background: ${color}44;
          animation: cm-pinPulse 1.8s ease-in-out infinite;
        "></div>
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 14px; height: 14px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid #fff;
          box-shadow: 0 0 12px ${color}, 0 0 24px ${color};
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return (
    <div style={{
      position: 'relative',
      width: 340, height: 180,
      borderRadius: 10,
      overflow: 'hidden',
      border: `1.5px solid ${color}66`,
      boxShadow: `0 0 30px ${color}44, inset 0 0 0 1px rgba(255,255,255,0.05)`,
    }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={5}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <Marker position={[latitude, longitude]} icon={icon}>
          <Popup>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
              <div style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>
                {birthCity || '—'}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {nationality}{birthYear ? ` · ${birthYear}` : ''}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      <div style={{
        position: 'absolute',
        bottom: 8, left: 10,
        padding: '4px 10px',
        background: 'rgba(0,0,0,0.85)',
        border: `1px solid ${color}66`,
        borderRadius: 4,
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.15em',
        color: '#fff',
        fontWeight: 700,
        pointerEvents: 'none',
      }}>
        📍 {birthCity || nationality || '—'}{birthYear ? ` · ${birthYear}` : ''}
      </div>

      <style>{`
        .cinema-pin .leaflet-container { background: #0a0a0a; }
        .leaflet-tile { filter: brightness(0.7) contrast(1.15) saturate(0.85) hue-rotate(-15deg); }
        .leaflet-popup-content-wrapper {
          background: #1a1a1a; color: #fff;
          border-radius: 6px;
          border: 1.5px solid ${color};
          box-shadow: 0 0 20px ${color}66;
        }
        .leaflet-popup-tip {
          background: #1a1a1a;
          border: 1.5px solid ${color};
        }
        @keyframes cm-pinPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%      { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}