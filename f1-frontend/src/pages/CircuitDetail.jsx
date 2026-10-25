import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api, { API_BASE } from '../api/axios';
import { flagSrc } from '../utils/images';

/* ============================================================ */
/* ======================= HOOKS =============================== */
/* ============================================================ */

function useScrollReveal(threshold = 0.15) {
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

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? window.scrollY / h : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return progress;
}

function Reveal({ children, delay = 0, direction = 'up', style = {} }) {
  const [ref, visible] = useScrollReveal();
  const transforms = {
    up: 'translateY(60px)',
    left: 'translateX(-60px)',
    right: 'translateX(60px)',
    scale: 'scale(0.92)',
  };
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity 1s cubic-bezier(0.4,0,0.2,1) ${delay}s, transform 1s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================ */
/* ============ CIRCUIT DIAL — HUD ROTATIF =================== */
/* ============================================================ */

function CircuitDial({ circuit, color = '#e10600', size = 520, lengthFormatted }) {
  const [tick, setTick] = useState(0);
  const cc = circuit.countryCode?.toUpperCase() || '';

  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const loop = (t) => {
      setTick((t - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const radius = size / 2;
  const LED_COUNT = 32;
  const activeLEDs = 20 + Math.floor((Math.sin(tick * 0.8) + 1) * 4);
  const tickMarks = Array.from({ length: 72 }, (_, i) => i);

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'grid',
      placeItems: 'center',
    }}>
      <div style={{
        position: 'absolute',
        inset: -40,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}55 0%, ${color}22 40%, transparent 70%)`,
        filter: 'blur(60px)',
        animation: 'dial-haloPulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        inset: -20,
        borderRadius: '50%',
        backgroundImage: `
          radial-gradient(circle, ${color}22 1px, transparent 1px),
          radial-gradient(circle, ${color}11 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px, 40px 40px',
        backgroundPosition: '0 0, 10px 10px',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <defs>
          <linearGradient id="dial-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="50%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.9" />
          </linearGradient>

          <filter id="dial-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g style={{ transformOrigin: 'center', transform: `rotate(${tick * 15}deg)` }}>
          <circle
            cx={radius} cy={radius} r={radius - 8}
            fill="none" stroke={color}
            strokeWidth="1" strokeDasharray="4 8" opacity="0.5"
          />
        </g>

        <circle
          cx={radius} cy={radius} r={radius - 20}
          fill="none" stroke={color} strokeWidth="2" opacity="0.3"
        />

        <g style={{ transformOrigin: 'center', transform: `rotate(${tick * 5}deg)` }}>
          {tickMarks.map(i => {
            const angle = (i / 72) * Math.PI * 2 - Math.PI / 2;
            const r1 = radius - 30;
            const r2 = i % 6 === 0 ? radius - 42 : radius - 36;
            const x1 = radius + Math.cos(angle) * r1;
            const y1 = radius + Math.sin(angle) * r1;
            const x2 = radius + Math.cos(angle) * r2;
            const y2 = radius + Math.sin(angle) * r2;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth={i % 6 === 0 ? 2 : 1}
                opacity={i % 6 === 0 ? 0.8 : 0.3}
              />
            );
          })}
        </g>

        <circle
          cx={radius} cy={radius} r={radius - 50}
          fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(activeLEDs / LED_COUNT) * 2 * Math.PI * (radius - 50)} ${2 * Math.PI * (radius - 50)}`}
          transform={`rotate(-90 ${radius} ${radius})`}
          filter="url(#dial-glow)"
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />

        <g style={{ transformOrigin: 'center', transform: `rotate(${tick * 30}deg)` }}>
          <line x1={radius} y1={radius} x2={radius} y2={20}
            stroke={color} strokeWidth="2" opacity="0.6" filter="url(#dial-glow)" />
          <line x1={radius} y1={radius} x2={radius} y2={20}
            stroke={color} strokeWidth="8" opacity="0.15" filter="url(#dial-glow)" />
        </g>

        <line x1={radius} y1={20} x2={radius} y2={40} stroke={color} strokeWidth="2" opacity="0.7" />
        <line x1={radius} y1={size - 20} x2={radius} y2={size - 40} stroke={color} strokeWidth="2" opacity="0.7" />
        <line x1={20} y1={radius} x2={40} y2={radius} stroke={color} strokeWidth="2" opacity="0.7" />
        <line x1={size - 20} y1={radius} x2={size - 40} y2={radius} stroke={color} strokeWidth="2" opacity="0.7" />

        {circuit.countryCode && (
          <g>
            <image
              href={flagSrc(circuit.countryCode)}
              x={radius - 30}
              y={12}
              width={60}
              height={40}
              preserveAspectRatio="xMidYMid slice"
              style={{
                filter: `drop-shadow(0 0 15px ${color}) drop-shadow(0 4px 8px rgba(0,0,0,0.9))`,
                clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)',
              }}
            />
          </g>
        )}
      </svg>

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}>
        {[...Array(LED_COUNT)].map((_, i) => {
          const angle = (i / LED_COUNT) * 360 - 90;
          const active = i < activeLEDs;
          const r = radius - 68;
          const x = radius + Math.cos((angle * Math.PI) / 180) * r;
          const y = radius + Math.sin((angle * Math.PI) / 180) * r;
          const ledColor = i < LED_COUNT * 0.35
            ? '#00d26a'
            : i < LED_COUNT * 0.6
            ? '#ffd700'
            : i < LED_COUNT * 0.8
            ? '#ff8700'
            : '#e10600';

          return (
            <div key={i} style={{
              position: 'absolute',
              left: x - 3,
              top: y - 3,
              width: 6, height: 6,
              borderRadius: '50%',
              background: active ? ledColor : 'rgba(255,255,255,0.06)',
              boxShadow: active ? `0 0 10px ${ledColor}, 0 0 20px ${ledColor}88` : 'inset 0 0 3px rgba(0,0,0,0.9)',
              transition: 'all 0.15s ease',
            }} />
          );
        })}
      </div>

      {/* CORE CENTRAL */}
      <div style={{
        position: 'relative',
        width: size * 0.52,
        height: size * 0.52,
        borderRadius: '50%',
        background: `radial-gradient(circle, #0a0d12 0%, #050508 100%)`,
        border: `2px solid ${color}66`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxShadow: `
          inset 0 0 60px rgba(0,0,0,0.9),
          inset 0 0 30px ${color}22,
          0 0 40px ${color}44
        `,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          backgroundImage: `
            linear-gradient(${color}0a 1px, transparent 1px),
            linear-gradient(90deg, ${color}0a 1px, transparent 1px)
          `,
          backgroundSize: '12px 12px',
          opacity: 0.6,
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 30,
          background: `linear-gradient(180deg, transparent, ${color}55, transparent)`,
          animation: 'dial-scan 3s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }} />

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: size * 0.16,
          fontWeight: 900,
          fontStyle: 'italic',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: '#fff',
          textShadow: `0 0 40px ${color}, 0 0 80px ${color}66, 0 4px 20px rgba(0,0,0,0.9)`,
          position: 'relative',
          zIndex: 2,
        }}>
          {cc}
        </div>

        <div style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-display)',
          fontSize: 8,
          letterSpacing: '0.35em',
          color: '#00d26a',
          fontWeight: 700,
          position: 'relative',
          zIndex: 2,
        }}>
          <span style={{
            width: 5, height: 5,
            borderRadius: '50%',
            background: '#00d26a',
            boxShadow: '0 0 8px #00d26a',
            animation: 'dial-blip 1.2s infinite',
          }} />
          LIVE
        </div>

        <div style={{
          width: '60%',
          height: 1,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          marginTop: 10,
          marginBottom: 10,
          position: 'relative',
          zIndex: 2,
        }} />

        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: size * 0.028,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          lineHeight: 1.15,
          maxWidth: '85%',
          position: 'relative',
          zIndex: 2,
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        }}>
          {circuit.name}
        </div>
      </div>

      {/* POINTEURS EXTERNES */}
      {[
        { label: 'LONG.', value: lengthFormatted ? `${lengthFormatted}km` : '—', angle: -45, color },
        { label: 'VIR.', value: circuit.numberOfTurns ?? '—', angle: 45, color: '#ff8700' },
        { label: 'DEPUIS', value: circuit.firstGrandPrix || '—', angle: 135, color: '#1e41ff' },
        { label: 'MEILLEUR', value: circuit.fastestLapTime || '—', angle: -135, color: '#00d26a' },
      ].map((item, i) => {
        const r = radius + 30;
        const rad = (item.angle * Math.PI) / 180;
        const x = radius + Math.cos(rad) * r;
        const y = radius + Math.sin(rad) * r;

        return (
          <div key={i} style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
            pointerEvents: 'none',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'rgba(0,0,0,0.9)',
              border: `1.5px solid ${item.color}`,
              borderRadius: 6,
              boxShadow: `0 0 20px ${item.color}66, inset 0 0 10px ${item.color}11`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              whiteSpace: 'nowrap',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 7,
                letterSpacing: '0.25em',
                color: item.color,
                fontWeight: 700,
              }}>
                {item.label}
              </div>
              <div style={{
                width: 1, height: 12,
                background: `${item.color}66`,
              }} />
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '0.02em',
              }}>
                {item.value}
              </div>
            </div>
          </div>
        );
      })}

      {[0, 1, 2, 3].map(i => {
        const angle = (i * 90 - 45) * (Math.PI / 180);
        const r = radius + 55;
        const x = radius + Math.cos(angle) * r;
        const y = radius + Math.sin(angle) * r;
        return (
          <div key={`screw-${i}`} style={{
            position: 'absolute',
            left: x - 5, top: y - 5,
            width: 10, height: 10,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #4a4a55 0%, #1a1a22 80%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 1px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
          }} />
        );
      })}

      <style>{`
        @keyframes dial-haloPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes dial-scan {
          0%   { top: -30px; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes dial-blip {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ============================================================ */
/* ============ TRACK LINE SVG ================================ */
/* ============================================================ */

function TrackLine({ height = 300, color = '#e10600' }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      <svg
        viewBox={`0 0 1000 ${height}`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          <linearGradient id="trackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="30%" stopColor={color} stopOpacity="0.6" />
            <stop offset="70%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>

          <filter id="trackGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={`M 50 0 Q 250 ${height * 0.35} 500 ${height * 0.5} T 950 ${height}`}
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="3"
          strokeDasharray="12 8"
          filter="url(#trackGlow)"
          style={{ animation: 'track-dash 20s linear infinite' }}
        />

        <path
          d={`M 70 0 Q 270 ${height * 0.35} 520 ${height * 0.5} T 970 ${height}`}
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      <style>{`
        @keyframes track-dash {
          to { stroke-dashoffset: -1000; }
        }
      `}</style>
    </div>
  );
}

/* ============================================================ */
/* ============ STAT BAR ====================================== */
/* ============================================================ */

function StatBar({ index, icon, label, value, unit, color, isNumeric }) {
  const [ref, visible] = useScrollReveal(0.2);
  const [hovered, setHovered] = useState(false);

  const numericValue = isNumeric && value != null && !isNaN(Number(value))
    ? Number(value) : null;

  const [counted, setCounted] = useState(0);
  useEffect(() => {
    if (!visible || numericValue == null) return;
    let raf;
    const t0 = performance.now();
    const dur = 1400;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCounted(numericValue % 1 === 0
        ? Math.round(numericValue * eased)
        : (numericValue * eased).toFixed(3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, numericValue]);

  const sectorColor = ['#c084fc', '#00d26a', '#ffd700'][index % 3];
  const pos = String(index + 1).padStart(2, '0');

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '60px 56px 1fr auto',
        alignItems: 'center',
        gap: 20,
        padding: '22px 28px',
        background: hovered
          ? `linear-gradient(90deg, ${color}20 0%, transparent 80%)`
          : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        transform: visible ? 'translateX(0)' : 'translateX(-60px)',
        opacity: visible ? 1 : 0,
        transitionDelay: `${index * 0.08}s`,
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        left: 0, top: 8, bottom: 8,
        width: hovered ? 6 : 4,
        background: hovered ? color : sectorColor,
        borderRadius: 2,
        boxShadow: `0 0 15px ${hovered ? color : sectorColor}`,
        transition: 'all 0.4s',
      }} />

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 32,
        fontWeight: 900,
        fontStyle: 'italic',
        color: hovered ? color : 'rgba(255,255,255,0.12)',
        letterSpacing: '-0.04em',
        lineHeight: 1,
        textShadow: hovered ? `0 0 25px ${color}` : 'none',
        transition: 'all 0.4s',
      }}>
        {pos}
      </div>

      <div style={{
        width: 44, height: 44,
        borderRadius: 8,
        display: 'grid',
        placeItems: 'center',
        fontSize: 22,
        background: `linear-gradient(135deg, ${color}25, ${color}08)`,
        border: `1.5px solid ${hovered ? color : 'rgba(255,255,255,0.1)'}`,
        transform: hovered ? 'scale(1.12) rotate(-5deg)' : 'scale(1) rotate(0)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: hovered ? `0 0 20px ${color}88` : 'none',
      }}>
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          letterSpacing: '0.3em',
          fontWeight: 700,
          color: hovered ? color : 'var(--text-dim)',
          textTransform: 'uppercase',
          marginBottom: 8,
          transition: 'color 0.3s',
        }}>
          ◆ {label}
        </div>

        <div style={{
          position: 'relative',
          width: '100%',
          height: 3,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            width: visible ? (hovered ? '100%' : '60%') : '0%',
            background: `linear-gradient(90deg, ${sectorColor}, ${color})`,
            boxShadow: `0 0 10px ${sectorColor}`,
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      <div style={{
        textAlign: 'right',
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color: value === '—' ? 'var(--text-dim)' : '#fff',
        textShadow: hovered ? `0 0 25px ${color}` : 'none',
        transition: 'text-shadow 0.4s',
      }}>
        {isNumeric && numericValue != null ? (
          <span style={{ fontSize: 32 }}>
            {counted}
            {unit && (
              <span style={{
                fontSize: 11,
                color: 'var(--text-dim)',
                marginLeft: 6,
                letterSpacing: '0.15em',
                fontWeight: 700,
              }}>{unit}</span>
            )}
          </span>
        ) : (
          <span style={{
            fontSize: typeof value === 'string' && value.length > 18 ? 14 : 20,
            wordBreak: 'break-word',
          }}>
            {value === '—' ? '—' : value}
          </span>
        )}
      </div>

      <div style={{
        position: 'absolute',
        top: 12, right: 12,
        width: 8, height: 8,
        borderRadius: '50%',
        background: hovered ? sectorColor : 'transparent',
        boxShadow: hovered ? `0 0 12px ${sectorColor}` : 'none',
        transition: 'all 0.4s',
      }} />
    </div>
  );
}

/* ============================================================ */
/* ============ MAP RESIZER ==================================== */
/* ============================================================ */

function MapResizer({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

/* ============================================================ */
/* ============ CIRCUIT MAP =================================== */
/* ============================================================ */

function CircuitMap({ circuit, themeColor = '#e10600' }) {
  const { latitude, longitude, name, country } = circuit;

  const icon = L.divIcon({
    className: 'circuit-pin',
    html: `
      <div style="position: relative; width: 44px; height: 56px;">
        <div style="
          position: absolute; inset: -12px;
          border-radius: 50%;
          background: radial-gradient(circle, ${themeColor}66 0%, transparent 70%);
          filter: blur(8px);
          animation: cpPulse 2s ease-in-out infinite;
        "></div>
        <svg width="44" height="56" viewBox="0 0 44 56" style="
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.9))
                  drop-shadow(0 0 12px ${themeColor}aa);
        ">
          <defs>
            <linearGradient id="cpGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="${themeColor}" stop-opacity="1" />
              <stop offset="100%" stop-color="${themeColor}" stop-opacity="0.7" />
            </linearGradient>
          </defs>
          <ellipse cx="22" cy="54" rx="8" ry="2" fill="#000" opacity="0.6"/>
          <path d="M 22 54 C 18 46, 4 34, 4 20 C 4 8, 12 2, 22 2 C 32 2, 40 8, 40 20 C 40 34, 26 46, 22 54 Z"
            fill="url(#cpGrad)" stroke="#0a0a0a" stroke-width="2" stroke-linejoin="round" />
          <circle cx="22" cy="20" r="12" fill="#0a0a0a" stroke="#fff" stroke-width="2" />
          <circle cx="22" cy="20" r="10" fill="#0a0a0a" />
          <text x="22" y="20" text-anchor="middle" dominant-baseline="central"
            fill="${themeColor}" font-family="Orbitron, sans-serif" font-weight="900" font-size="18">🏁</text>
          <circle cx="22" cy="20" r="12.5" fill="none" stroke="${themeColor}" stroke-width="1.5"/>
        </svg>
      </div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 54],
    popupAnchor: [0, -52],
  });

  return (
    <>
      <style>{`
        @keyframes cpPulse {
          0%, 100% { transform: scale(1);    opacity: 0.7; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
        .leaflet-container {
          z-index: 1 !important;
          background: #0a0a0a;
          font-family: var(--font-heading);
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.75) !important;
          color: #555 !important;
          font-size: 8px !important;
        }
        .leaflet-tile {
          filter: brightness(0.7) contrast(1.15) saturate(0.85) hue-rotate(-15deg);
        }
        .leaflet-control-zoom a {
          background: #1a1a1a !important;
          color: #fff !important;
          border-color: ${themeColor}66 !important;
          font-weight: 900;
        }
        .leaflet-control-zoom a:hover {
          background: ${themeColor} !important;
        }
        .leaflet-popup-content-wrapper {
          background: #1a1a1a !important;
          color: #fff !important;
          border-radius: 8px !important;
          border: 1.5px solid ${themeColor} !important;
          box-shadow: 0 0 30px ${themeColor}66 !important;
        }
        .leaflet-popup-tip {
          background: #1a1a1a !important;
          border: 1.5px solid ${themeColor} !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
        }
      `}</style>

      <div style={{
        position: 'relative',
        width: '100%',
        height: 520,
        borderRadius: 12,
        overflow: 'hidden',
        border: `2px solid ${themeColor}66`,
        boxShadow: `0 30px 60px -20px ${themeColor}88, 0 0 60px ${themeColor}22`,
        background: '#0a0a0a',
      }}>
        <div style={{
          position: 'absolute',
          left: 0, right: 0, height: 80,
          background: `linear-gradient(180deg, transparent, ${themeColor}55, transparent)`,
          animation: 'mapScan 6s linear infinite',
          pointerEvents: 'none',
          zIndex: 300,
          mixBlendMode: 'screen',
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
          zIndex: 250,
        }} />

        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
            maxZoom={19}
          />
          <Marker position={[latitude, longitude]} icon={icon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, letterSpacing: '0.2em',
                  color: themeColor, fontWeight: 700, marginBottom: 6,
                }}>
                  ◆ CIRCUIT
                </div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16, fontWeight: 900,
                  textTransform: 'uppercase',
                  color: '#fff',
                }}>
                  {name}
                </div>
                {country && (
                  <div style={{ fontSize: 12, color: '#b8b8c0', marginTop: 4 }}>
                    {country}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
          <MapResizer trigger={`${latitude}-${longitude}`} />
        </MapContainer>

        <div style={{
          position: 'absolute',
          bottom: 20, right: 20,
          padding: '10px 16px',
          background: 'rgba(0,0,0,0.9)',
          border: `1.5px solid ${themeColor}`,
          borderRadius: 6,
          fontFamily: 'var(--font-display)',
          zIndex: 460,
          textAlign: 'right',
        }}>
          <div style={{
            fontSize: 8, letterSpacing: '0.25em',
            color: themeColor, fontWeight: 700, marginBottom: 4,
          }}>◆ COORDONNÉES</div>
          <div style={{ fontSize: 11, color: '#fff', letterSpacing: '0.1em', lineHeight: 1.4 }}>
            <div>N {latitude.toFixed(4)}°</div>
            <div>E {longitude.toFixed(4)}°</div>
          </div>
        </div>

        <style>{`
          @keyframes mapScan {
            0%   { top: -80px; opacity: 0; }
            10%  { opacity: 1; }
            90%  { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}</style>
      </div>
    </>
  );
}

/* ============================================================ */
/* ==================== MAIN COMPONENT ========================= */
/* ============================================================ */

export default function CircuitDetail() {
  const { id } = useParams();
  const [circuit, setCircuit] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    api.get(`/circuits/${id}`)
      .then(r => setCircuit(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const imgSrc = url => !url ? null
    : url.startsWith('http') ? url : API_BASE + url;

  if (loading) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <div className="mono" style={{ color: 'var(--f1-red)', letterSpacing: '0.3em' }}>
        CHARGEMENT...
      </div>
    </div>
  );

  if (!circuit) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-dim)' }}>Circuit introuvable</h2>
      <Link to="/circuits" style={{ color: 'var(--f1-red)' }}>← Retour aux circuits</Link>
    </div>
  );

  const color = '#e10600';
  const hasMap = circuit.latitude != null && circuit.longitude != null;
  const cc = circuit.countryCode?.toUpperCase() || '';

  /* ✅ LONGUEUR FORMATÉE AVEC 3 DÉCIMALES */
  const lengthFormatted = circuit.lengthKm != null
    ? Number(circuit.lengthKm).toFixed(3)
    : null;

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        @keyframes cd-fadeUp {
          0%   { opacity: 0; transform: translateY(40px); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        @keyframes cd-fadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes cd-floating {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes cd-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes cd-blip {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        @keyframes cd-photoScan {
          0%   { top: -80px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes cd-gridDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes cd-speedLine {
          0%   { transform: translateX(-100%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>

      {/* SCROLL PROGRESS */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        height: 3,
        width: `${scrollProgress * 100}%`,
        background: `linear-gradient(90deg, ${color}, ${color}aa, transparent)`,
        boxShadow: `0 0 20px ${color}`,
        zIndex: 9999,
        transition: 'width 0.1s linear',
        pointerEvents: 'none',
      }} />

      {/* ============================================================ */}
      {/* ============ HERO ========================================== */}
      {/* ============================================================ */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 30% 30%, #1a0505 0%, #050508 70%)',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(${color}08 1px, transparent 1px),
            linear-gradient(90deg, ${color}08 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'cd-gridDrift 20s linear infinite',
          pointerEvents: 'none',
          maskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 90%)',
        }} />

        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.5 }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${i * 10}%`,
              left: 0, right: 0,
              height: i % 3 === 0 ? 2 : 1,
              background: `linear-gradient(90deg, transparent, ${
                i % 2 ? `${color}aa` : 'rgba(255,255,255,0.2)'
              }, transparent)`,
              animation: `cd-speedLine ${3 + (i % 5) * 0.5}s linear infinite`,
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>

        <div style={{
          position: 'absolute',
          top: '30%', right: '15%',
          width: 700, height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }} />

        {/* Top band LIVE */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 60,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          letterSpacing: '0.35em',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 700,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#00d26a',
              boxShadow: '0 0 8px #00d26a',
              animation: 'cd-blip 1.4s infinite',
            }} />
            <span>REC ● LIVE</span>
          </div>
          <span style={{ color }}>F1 APEX</span>
        </div>

        {/* CONTENU */}
        <div className="container" style={{
          position: 'relative', zIndex: 5,
          padding: '120px 32px 80px',
          maxWidth: 1400,
          width: '100%',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 60,
            alignItems: 'center',
          }} className="hero-grid">

            {/* TEXTE GAUCHE */}
            <div>
              <div style={{ animation: 'cd-fadeUp 0.8s ease both' }}>
                <Link to="/circuits" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  color: 'var(--text-dim)', fontSize: 12,
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  marginBottom: 32, textDecoration: 'none',
                }}>← RETOUR</Link>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 24,
                animation: 'cd-fadeUp 0.8s ease 0.1s both',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11, letterSpacing: '0.4em',
                  color, fontWeight: 900,
                }}>◆ CIRCUIT FILE</span>
                <span style={{
                  flex: 1, maxWidth: 160, height: 1,
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                }} />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 24,
                animation: 'cd-fadeUp 0.8s ease 0.2s both',
              }}>
                {circuit.countryCode && (
                  <img
                    src={flagSrc(circuit.countryCode)}
                    alt={circuit.countryCode}
                    className="waving-flag-lg"
                    style={{
                      height: 40, width: 'auto', borderRadius: 4,
                      boxShadow: `0 8px 24px rgba(0,0,0,0.9), 0 0 30px ${color}66`,
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13, letterSpacing: '0.5em',
                  color: '#fff', fontWeight: 700,
                }}>{circuit.country?.toUpperCase() || ''}</span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(48px, 8vw, 120px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.05em',
                lineHeight: 0.9,
                color: '#fff',
                margin: 0,
                marginBottom: 40,
                textShadow: `0 0 80px ${color}66, 0 20px 60px rgba(0,0,0,0.9)`,
                animation: 'cd-fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both',
              }}>
                {circuit.name}
              </h1>

              <div style={{
                display: 'flex', gap: 40, flexWrap: 'wrap',
                paddingTop: 28,
                borderTop: '1px dashed rgba(255,255,255,0.1)',
                animation: 'cd-fadeUp 0.8s ease 0.5s both',
              }}>
                {[
                  { label: 'LONGUEUR', value: lengthFormatted || '—', unit: 'KM', color },
                  { label: 'VIRAGES', value: circuit.numberOfTurns ?? '—', unit: 'TURNS', color: '#ff8700' },
                  { label: 'DEPUIS', value: circuit.firstGrandPrix || '—', unit: 'GP', color: '#1e41ff' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 9, letterSpacing: '0.35em',
                      color: 'rgba(255,255,255,0.5)',
                      fontWeight: 700, marginBottom: 8,
                    }}>◆ {item.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 38, fontWeight: 900,
                        color: item.color, lineHeight: 1,
                        textShadow: `0 0 30px ${item.color}`,
                        letterSpacing: '-0.02em',
                      }}>{item.value}</span>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11, color: 'rgba(255,255,255,0.5)',
                        fontWeight: 700, letterSpacing: '0.2em',
                      }}>{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CIRCUIT DIAL À DROITE */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              animation: 'cd-fadeUp 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both',
            }}>
              <CircuitDial
                circuit={circuit}
                color={color}
                size={520}
                lengthFormatted={lengthFormatted}
              />
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 1200px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
              gap: 40px !important;
              justify-items: center;
            }
          }
          @media (max-width: 700px) {
            .hero-grid > *:nth-child(2) {
              transform: scale(0.7);
            }
          }
        `}</style>
      </section>

      {/* ============================================================ */}
      {/* ============ PISTE SVG ===================================== */}
      {/* ============================================================ */}
      <TrackLine height={300} color={color} />

      {/* ============================================================ */}
      {/* ============ STATS ========================================= */}
      {/* ============================================================ */}
      <section className="container" style={{ padding: '40px 32px 60px', maxWidth: 1100 }}>
        <Reveal direction="up">
          <div style={{ marginBottom: 50 }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 20,
              flexWrap: 'wrap', marginBottom: 20,
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11, letterSpacing: '0.5em',
                color, fontWeight: 700,
              }}>◆ SESSION DATA</div>
              <div style={{
                flex: 1, minWidth: 100, height: 1,
                background: `linear-gradient(90deg, ${color}88, transparent)`,
              }} />
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10, letterSpacing: '0.3em',
                color: 'rgba(255,255,255,0.4)', fontWeight: 700,
              }}>LIVE · UPDATE</div>
            </div>

            <h2 style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '-0.03em', lineHeight: 0.95, margin: 0,
            }}>
              Les <span style={{
                color, fontStyle: 'italic',
                textShadow: `0 0 50px ${color}88`,
              }}>chiffres</span> clés
            </h2>
          </div>
        </Reveal>

        <div style={{
          border: '1.5px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(10,10,15,0.6) 0%, rgba(5,5,8,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `0 30px 80px -20px rgba(0,0,0,0.9), 0 0 60px ${color}11`,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 56px 1fr auto',
            gap: 20,
            padding: '16px 28px',
            background: `linear-gradient(90deg, ${color}22 0%, transparent 100%)`,
            borderBottom: `1.5px solid ${color}44`,
            fontFamily: 'var(--font-display)',
            fontSize: 9, letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.6)', fontWeight: 700,
          }}>
            <div>POS</div>
            <div>·</div>
            <div>STAT</div>
            <div style={{ textAlign: 'right' }}>VALUE</div>
          </div>

          <StatBar index={0} icon="📏" label="Longueur" value={lengthFormatted} unit="km" color="#e10600" isNumeric />
          <StatBar index={1} icon="🔄" label="Nombre de virages" value={circuit.numberOfTurns} unit="turns" color="#ff8700" isNumeric />
          <StatBar index={2} icon="🏁" label="Premier Grand Prix" value={circuit.firstGrandPrix || '—'} color="#1e41ff" />
          <StatBar index={3} icon="⏱️" label="Meilleur tour en course" value={circuit.fastestLapTime || '—'} color="#00d26a" />
          <StatBar index={4} icon="📐" label="Architecte" value={circuit.architect || '—'} color="#c084fc" />
          <StatBar index={5} icon="💰" label="Coût de construction" value={circuit.constructionCost || '—'} color="#ffd700" />
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============ PHOTO CINÉMATIQUE ============================= */}
      {/* ============================================================ */}
      {circuit.imageUrl && (
        <section style={{ position: 'relative', padding: '100px 0', overflow: 'hidden' }}>
          <div className="container" style={{ padding: '0 32px', maxWidth: 1400 }}>
            <Reveal direction="scale">
              <div style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                border: `2px solid ${color}66`,
                boxShadow: `0 60px 120px -30px rgba(0,0,0,0.95), 0 0 100px ${color}33`,
              }}>
                <img
                  src={imgSrc(circuit.imageUrl)}
                  alt={circuit.name}
                  style={{
                    display: 'block', width: '100%',
                    height: 'auto', maxHeight: 720,
                    objectFit: 'cover',
                    filter: 'contrast(1.1) saturate(1.15) brightness(0.85)',
                  }}
                  onError={e => { e.target.style.display = 'none'; }}
                />

                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, transparent 40%, rgba(5,5,10,0.6) 75%, rgba(5,5,10,0.95) 100%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(90deg, rgba(5,5,10,0.6) 0%, transparent 40%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  height: 80,
                  background: `linear-gradient(180deg, transparent 0%, ${color}66 50%, transparent 100%)`,
                  animation: 'cd-photoScan 4s ease-in-out infinite',
                  mixBlendMode: 'screen',
                  pointerEvents: 'none',
                }} />

                <div style={{
                  position: 'absolute',
                  top: 24, right: 24,
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px',
                  background: 'rgba(0,0,0,0.9)',
                  border: `1.5px solid ${color}`,
                  borderRadius: 6,
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, letterSpacing: '0.3em',
                  color: '#fff', fontWeight: 700,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  zIndex: 3,
                  boxShadow: `0 0 25px ${color}66`,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 10px ${color}`,
                    animation: 'cd-blip 1.2s infinite',
                  }} />
                  ◆ LE TRACÉ
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: 40, left: 40, right: 40,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: 20,
                  zIndex: 3,
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'clamp(28px, 4vw, 56px)',
                      fontWeight: 900, textTransform: 'uppercase',
                      letterSpacing: '-0.03em', lineHeight: 0.95,
                      color: '#fff',
                      textShadow: `0 0 50px ${color}, 0 8px 30px rgba(0,0,0,0.95)`,
                    }}>
                      {circuit.name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11, letterSpacing: '0.3em',
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 700, marginTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      {circuit.countryCode && (
                        <img
                          src={flagSrc(circuit.countryCode)}
                          alt=""
                          style={{
                            height: 16, width: 'auto',
                            borderRadius: 2,
                            animation: 'cd-blip 1.5s infinite',
                          }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      {circuit.country?.toUpperCase()}
                      {circuit.firstGrandPrix && ` · DEPUIS ${circuit.firstGrandPrix}`}
                    </div>
                  </div>

                  {lengthFormatted && (
                    <div style={{
                      padding: '12px 22px',
                      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                      borderRadius: 8,
                      fontFamily: 'var(--font-display)',
                      fontSize: 16, fontWeight: 900,
                      color: '#fff', letterSpacing: '0.15em',
                      boxShadow: `0 0 40px ${color}aa`,
                      clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                    }}>
                      {lengthFormatted} KM
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* ============ MAP =========================================== */}
      {/* ============================================================ */}
      {hasMap && (
        <section className="container" style={{ padding: '80px 32px 60px', maxWidth: 1400 }}>
          <Reveal direction="up">
            <div style={{ marginBottom: 50 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline',
                gap: 20, flexWrap: 'wrap', marginBottom: 20,
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11, letterSpacing: '0.5em',
                  color, fontWeight: 700,
                }}>◆ GEOLOCATION</div>
                <div style={{
                  flex: 1, minWidth: 100, height: 1,
                  background: `linear-gradient(90deg, ${color}88, transparent)`,
                }} />
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, letterSpacing: '0.3em',
                  color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                }}>GPS · LOCKED</div>
              </div>

              <h2 style={{
                fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '-0.03em', lineHeight: 0.95,
                margin: 0, marginBottom: 16,
              }}>
                Où se trouve<br />
                <span style={{
                  color, fontStyle: 'italic',
                  textShadow: `0 0 50px ${color}88`,
                }}>{circuit.name}</span> ?
              </h2>

              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12, letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.4)', fontWeight: 700,
              }}>
                {circuit.latitude.toFixed(4)}° N · {circuit.longitude.toFixed(4)}° E
              </div>
            </div>
          </Reveal>

          <Reveal direction="scale">
            <CircuitMap circuit={circuit} themeColor={color} />
          </Reveal>
        </section>
      )}

      {/* ============================================================ */}
      {/* ============ MARQUEE FINAL ================================= */}
      {/* ============================================================ */}
      <section style={{
        position: 'relative',
        background: color,
        padding: '20px 0',
        overflow: 'hidden',
        borderTop: '3px solid #000',
        borderBottom: '3px solid #000',
        boxShadow: `0 -10px 40px ${color}88, 0 10px 40px ${color}88`,
        marginTop: 60,
      }}>
        <div style={{
          display: 'flex',
          gap: 60,
          animation: 'cd-marquee 30s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          {[...Array(2)].map((_, dup) => (
            <div key={dup} style={{ display: 'flex', gap: 60 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14, letterSpacing: '0.3em',
                  fontWeight: 900, color: '#fff',
                }}>
                  <img
                    src={flagSrc(circuit.countryCode)}
                    alt=""
                    style={{
                      height: 18, width: 'auto',
                      borderRadius: 2,
                      animation: 'cd-blip 1.5s infinite',
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <span>{circuit.name.toUpperCase()}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ opacity: 0.7 }}>{cc}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ fontSize: 20 }}>🏎️</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============ CTA =========================================== */}
      {/* ============================================================ */}
      <section className="container" style={{ padding: '80px 32px 120px', textAlign: 'center' }}>
        <Link to="/circuits" style={{
          display: 'inline-flex', alignItems: 'center', gap: 14,
          padding: '20px 44px',
          background: 'transparent',
          border: `2px solid ${color}`,
          borderRadius: 8,
          color: 'var(--f1-white)',
          fontFamily: 'var(--font-display)',
          fontWeight: 900, fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          textDecoration: 'none',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = color;
          e.currentTarget.style.boxShadow = `0 0 60px ${color}, 0 0 100px ${color}66`;
          e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <span style={{ fontSize: 16 }}>←</span>
          RETOUR AUX CIRCUITS
          <span style={{
            width: 30, height: 1,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }} />
        </Link>
      </section>
    </div>
  );
}