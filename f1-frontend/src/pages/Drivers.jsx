import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { imgSrc, flagSrc } from '../utils/images';

/* ============================================================ */
/* ======================= HOOKS =============================== */
/* ============================================================ */

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
/* ================= SIGNATURE WRITER ========================== */
/* ============================================================ */

function SignatureWriter({ driver, teamColor, hovered }) {
  const { t } = useTranslation();
  const [sparks, setSparks] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!hovered) {
      setSparks([]);
      setDone(false);
      return;
    }

    const newSparks = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: 3 + Math.random() * 94,
      y: 15 + Math.random() * 70,
      size: 2 + Math.random() * 4,
      delay: 0.15 + Math.random() * 0.85,
      drift: -10 - Math.random() * 30,
      side: Math.random() > 0.5 ? 1 : -1,
    }));
    setSparks(newSparks);

    const tm = setTimeout(() => setDone(true), 1250);
    return () => clearTimeout(tm);
  }, [hovered]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 26,
        left: '50%',
        transform: `translateX(-50%) rotate(-4deg) scale(${hovered ? 1.02 : 0.92})`,
        width: '60%',
        maxWidth: 220,
        zIndex: 6,
        pointerEvents: 'none',
        transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -28,
          background: `radial-gradient(ellipse, ${teamColor}77 0%, ${teamColor}22 40%, transparent 75%)`,
          filter: 'blur(22px)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.6s',
          animation: hovered ? 'haloPulse 2s ease-in-out infinite' : 'none',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          animation: hovered ? 'sigWobble 1.15s ease-in-out' : 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            clipPath: hovered ? 'inset(-10% -10% -10% -10%)' : 'inset(-10% 100% -10% -10%)',
            transition: 'clip-path 1.1s cubic-bezier(0.65, 0, 0.35, 1)',
          }}
        >
          <img
            src={imgSrc(driver.signatureImage)}
            alt={`Signature ${driver.lastName}`}
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              filter: `invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 10px ${teamColor}88)`,
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: hovered ? '100%' : '0%',
            transform: 'translate(-50%, -50%)',
            opacity: hovered && !done ? 1 : 0,
            transition: hovered
              ? 'left 1.1s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.3s'
              : 'opacity 0.15s',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 32, height: 32,
            borderRadius: '50%',
            border: `2px solid ${teamColor}`,
            opacity: 0.7,
            animation: 'penRing 0.8s ease-out infinite',
          }} />

          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 60, height: 60,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${teamColor}cc 0%, ${teamColor}44 30%, transparent 70%)`,
            filter: 'blur(6px)',
            animation: 'penGlow 0.5s ease-in-out infinite alternate',
          }} />

          <div style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `
              0 0 10px #fff,
              0 0 20px ${teamColor},
              0 0 40px ${teamColor},
              0 0 60px ${teamColor}88
            `,
            transform: 'translate(-50%, -50%)',
            position: 'absolute',
            top: '50%', left: '50%',
          }} />

          <div style={{
            position: 'absolute',
            top: '50%', right: '50%',
            transform: 'translateY(-50%)',
            width: 140, height: 3,
            background: `linear-gradient(90deg, transparent 0%, ${teamColor}33 40%, ${teamColor}aa 80%, #fff 100%)`,
            filter: 'blur(1px)',
            borderRadius: 2,
            opacity: 0.85,
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
              boxShadow: `0 0 6px ${s.id % 3 === 0 ? '#fff' : teamColor}, 0 0 12px ${teamColor}88`,
              opacity: 0,
              animation: `sparkPop 0.7s ease-out ${s.delay}s forwards`,
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
            animation: 'finalFlash 0.8s ease-out forwards',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: -18,
          right: -12,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.85)',
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
          boxShadow: `0 4px 14px rgba(0,0,0,0.7), 0 0 20px ${teamColor}66`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <span style={{
          color: teamColor,
          fontSize: 11,
          lineHeight: 1,
          filter: `drop-shadow(0 0 6px ${teamColor})`,
        }}>✓</span>
        {t('common.signed')}
      </div>
    </div>
  );
}

/* ============================================================ */
/* ==================== DRIVER CARD ============================ */
/* ============================================================ */

function DriverCard({ driver, index }) {
  const { t } = useTranslation();
  const cardRef = useRef(null);
  const [magnet, setMagnet] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);
  const [sector, setSector] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [ripples, setRipples] = useState([]);

  const teamColor = driver.teamColor || '#666';

  /* ✅ ACTION en priorité, TRANSITION en fallback */
  const driverPhoto = driver.actionPhotoUrl || driver.transitionPhotoUrl;
  const isAction = Boolean(driver.actionPhotoUrl);

  const onMove = useCallback(e => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setMagnet({ x: px * 8, y: py * 8 });
    setTilt({ rx: -py * 6, ry: px * 6 });
  }, []);

  const onLeave = useCallback(() => {
    setMagnet({ x: 0, y: 0 });
    setTilt({ rx: 0, ry: 0 });
    setHovered(false);
  }, []);

  const onEnter = useCallback(() => {
    setHovered(true);
    setGlitch(true);
    setTimeout(() => setGlitch(false), 600);
  }, []);

  const onClick = useCallback(e => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, {
      id,
      x: e.clientX - r.left,
      y: e.clientY - r.top,
    }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 900);
  }, []);

  useEffect(() => {
    if (!hovered) { setSector(0); return; }
    const timers = [
      setTimeout(() => setSector(1), 150),
      setTimeout(() => setSector(2), 350),
      setTimeout(() => setSector(3), 550),
    ];
    return () => timers.forEach(clearTimeout);
  }, [hovered]);

  return (
    <Reveal delay={index * 0.05} direction="up">
      <Link
        to={`/drivers/${driver.id}`}
        ref={cardRef}
        onMouseMove={onMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={onClick}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          perspective: 1000,
        }}
      >
        <div
          className="driver-card"
          style={{
            position: 'relative',
            padding: 0,
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
            border: `1px solid ${hovered ? teamColor : 'rgba(255,255,255,0.06)'}`,
            transition: 'border-color 0.35s',
            transform: `translate(${magnet.x}px, ${magnet.y}px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transformStyle: 'preserve-3d',
            transformOrigin: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.35,
              pointerEvents: 'none',
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 4px),
                repeating-linear-gradient(-45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 4px)
              `,
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              opacity: hovered ? 0.5 : 0.15,
              transition: 'opacity 0.4s',
              pointerEvents: 'none',
              backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 8px, ${teamColor}22 8px, ${teamColor}22 10px)`,
              animation: hovered ? 'racingStripe 1.5s linear infinite' : 'none',
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: hovered ? 0.35 : 0,
              transition: 'opacity 0.5s',
              pointerEvents: 'none',
              backgroundImage: `linear-gradient(${teamColor}22 1px, transparent 1px), linear-gradient(90deg, ${teamColor}22 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              animation: hovered ? 'gridPulse 2s ease-in-out infinite' : 'none',
              zIndex: 0,
            }}
          />

          {hovered && (
            <svg
              viewBox="0 0 400 700"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 8,
              }}
            >
              <rect
                x="1" y="1"
                width="398" height="698"
                fill="none"
                stroke={teamColor}
                strokeWidth="2"
                strokeDasharray="60 2000"
                style={{
                  filter: `drop-shadow(0 0 6px ${teamColor})`,
                  animation: 'borderChase 3s linear infinite',
                }}
              />
            </svg>
          )}

          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -60,
              width: 140,
              height: '135%',
              background: teamColor,
              transform: 'rotate(20deg)',
              opacity: 0.14,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 0, left: 0,
              width: 60, height: 60,
              opacity: 0.05,
              pointerEvents: 'none',
              backgroundImage: `
                linear-gradient(45deg, #fff 25%, transparent 25%),
                linear-gradient(-45deg, #fff 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #fff 75%),
                linear-gradient(-45deg, transparent 75%, #fff 75%)
              `,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: hovered ? '100%' : '40%',
              height: 3,
              background: teamColor,
              transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 7,
              boxShadow: hovered ? `0 0 12px ${teamColor}` : 'none',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 14, left: 14,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px',
              background: 'rgba(0,0,0,0.75)',
              border: `1px solid ${teamColor}55`,
              fontFamily: 'var(--font-display)',
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.2em', color: '#fff',
              zIndex: 7,
            }}
          >
            <span style={{
              width: 5, height: 5,
              background: teamColor,
              borderRadius: '50%',
              animation: hovered ? 'pulseDot 0.8s infinite' : 'none',
            }} />
            P{String(index + 1).padStart(2, '0')}
          </div>

          {/* ============================================================ */}
          {/* ZONE PHOTO — VISAGE VISIBLE                                  */}
          {/* ============================================================ */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 400,
              overflow: 'hidden',
              background: `linear-gradient(180deg, ${teamColor}12 0%, transparent 55%, #0a0a0a 100%)`,
              zIndex: 2,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '48%', left: '50%',
                transform: `translate(-50%, -50%) rotate(-12deg) translateX(${hovered ? -10 : 0}px)`,
                fontFamily: 'var(--font-display)',
                fontSize: 300, fontWeight: 900, fontStyle: 'italic',
                color: teamColor, opacity: 0.07, lineHeight: 1,
                pointerEvents: 'none', userSelect: 'none',
                transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                zIndex: 1, letterSpacing: '-0.05em',
              }}
            >
              {driver.number || '—'}
            </div>

            {driver.teamLogoUrl && (
              <div style={{
                position: 'absolute',
                bottom: -30, right: -40,
                width: 200, height: 200,
                transform: 'rotate(15deg)',
                opacity: 0.06,
                pointerEvents: 'none',
                zIndex: 1,
              }}>
                <img src={imgSrc(driver.teamLogoUrl)} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
            )}

            {/* ✅ PHOTO — VISAGE VISIBLE (objectPosition 20% = tête) */}
            {driverPhoto ? (
              <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                zIndex: 2,
              }}>
                <img
                  src={imgSrc(driverPhoto)}
                  alt={`${driver.firstName} ${driver.lastName}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: isAction ? 'cover' : 'contain',
                    /* ✅ VISAGE : 15% du haut pour cadrer la tête */
                    objectPosition: isAction ? 'center 0.25%' : 'center bottom',
                    transform: hovered ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
                    display: 'block',
                    filter: isAction
                      ? 'contrast(1.05) saturate(1.1)'
                      : `drop-shadow(0 20px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 30px ${teamColor}88)`,
                  }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 140, fontWeight: 900,
                color: teamColor, opacity: 0.35,
                zIndex: 2,
              }}>
                {driver.firstName?.[0]}{driver.lastName?.[0]}
              </div>
            )}

            {hovered && (
              <div style={{
                position: 'absolute',
                left: 0, right: 0,
                height: 80,
                background: `linear-gradient(180deg, transparent 0%, ${teamColor}44 50%, transparent 100%)`,
                animation: 'radarScan 2s linear infinite',
                pointerEvents: 'none',
                zIndex: 3,
                mixBlendMode: 'screen',
              }} />
            )}

            {driver.signatureImage && (
              <SignatureWriter driver={driver} teamColor={teamColor} hovered={hovered} />
            )}

            <div
              className={glitch ? 'glitch-text' : ''}
              data-text={driver.number || '—'}
              style={{
                position: 'absolute',
                top: 10, right: 16,
                fontFamily: 'var(--font-display)',
                fontSize: 96, fontWeight: 900, fontStyle: 'italic',
                lineHeight: 0.9,
                color: teamColor,
                letterSpacing: '-0.04em',
                zIndex: 6,
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                pointerEvents: 'none', userSelect: 'none',
                textShadow: hovered
                  ? `0 0 20px ${teamColor}, 0 0 40px ${teamColor}88`
                  : 'none',
              }}
            >
              {driver.number || '—'}
            </div>

            {driver.worldChampionships > 0 && (
              <div style={{
                position: 'absolute',
                top: 50, left: 14,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid rgba(255,215,0,0.55)',
                fontFamily: 'var(--font-display)',
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#FFD700',
                zIndex: 6,
                boxShadow: hovered ? `0 0 20px rgba(255,215,0,0.5)` : 'none',
                transition: 'box-shadow 0.4s',
              }}>
                👑 ×{driver.worldChampionships}
              </div>
            )}

            {driver.teamLogoUrl && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 14, left: 14,
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.9)',
                  border: `1.5px solid ${teamColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  zIndex: 6,
                  overflow: 'hidden',
                  color: teamColor,
                  boxShadow: `
                    0 0 12px ${teamColor}88,
                    0 0 24px ${teamColor}44,
                    inset 0 0 12px ${teamColor}22
                  `,
                  transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                  clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                  animation: hovered ? 'teamLogoPulse 1.5s ease-in-out infinite' : 'none',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    inset: -20,
                    background: `radial-gradient(circle, ${teamColor}66 0%, transparent 70%)`,
                    filter: 'blur(10px)',
                    opacity: hovered ? 1 : 0.6,
                    transition: 'opacity 0.4s',
                    pointerEvents: 'none',
                    animation: 'teamLogoHalo 2s ease-in-out infinite',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 0, bottom: 0, left: 0,
                    width: '40%',
                    background: `linear-gradient(90deg, transparent, ${teamColor}aa, transparent)`,
                    pointerEvents: 'none',
                    mixBlendMode: 'screen',
                    animation: 'teamLogoShimmer 2.5s ease-in-out infinite',
                  }}
                />
                <img
                  src={imgSrc(driver.teamLogoUrl)}
                  alt={driver.teamName}
                  style={{
                    height: 22,
                    width: 'auto',
                    objectFit: 'contain',
                    position: 'relative',
                    zIndex: 2,
                    filter: hovered
                      ? `drop-shadow(0 0 8px ${teamColor}) drop-shadow(0 0 16px ${teamColor}) brightness(1.2)`
                      : `drop-shadow(0 0 6px ${teamColor}aa) brightness(1.05)`,
                    transition: 'filter 0.4s',
                  }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: teamColor,
                    boxShadow: `0 0 8px ${teamColor}, 0 0 16px ${teamColor}`,
                    position: 'relative',
                    zIndex: 2,
                    animation: 'teamLogoBlink 1.2s ease-in-out infinite',
                  }}
                />
              </div>
            )}

            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0, height: 120,
              background: 'linear-gradient(180deg, transparent, #0a0a0a)',
              pointerEvents: 'none',
              zIndex: 3,
            }} />

            <div style={{
              position: 'absolute',
              top: '55%', left: 0, right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${teamColor}, transparent)`,
              opacity: hovered ? 0.75 : 0,
              transform: hovered ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'opacity 0.4s, transform 0.7s cubic-bezier(0.4,0,0.2,1)',
              pointerEvents: 'none',
              zIndex: 4,
            }} />
          </div>

          <div style={{ padding: '24px 24px 22px', position: 'relative', zIndex: 3 }}>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.32em',
              color: 'var(--text-dim)',
              marginBottom: 4,
              opacity: hovered ? 1 : 0.7,
              transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
              transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
            }}>
              {driver.firstName}
            </div>

            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 32, fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: 'var(--f1-white)',
              lineHeight: 1,
              marginBottom: 20,
              transform: hovered ? 'translateX(0)' : 'translateX(8px)',
              transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1) 0.05s',
            }}>
              {driver.lastName}
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  flex: 1, height: 4,
                  background: hovered && sector > i ? teamColor : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                  boxShadow: hovered && sector > i ? `0 0 8px ${teamColor}` : 'none',
                }} />
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              gap: 8,
            }}>
              {driver.countryCode ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={flagSrc(driver.countryCode)} alt={driver.countryCode}
                    style={{ height: 20, width: 'auto', borderRadius: 2 }} />
                  <span style={{ color: 'var(--text-mid)', fontSize: 13, fontWeight: 500 }}>
                    {driver.nationality}
                  </span>
                </div>
              ) : <span />}

              {driver.debutYear && (
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.15em',
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                }}>
                  {t('drivers.since')} <span style={{ color: teamColor }}>{driver.debutYear}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${teamColor} 0%, ${teamColor}66 40%, transparent 100%)`,
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity 0.4s',
          }} />

          <div style={{
            position: 'absolute',
            bottom: 0, right: 0,
            width: 34, height: 34,
            background: teamColor,
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
            opacity: hovered ? 0.9 : 0.4,
            transition: 'opacity 0.4s',
            zIndex: 5,
          }} />

          {ripples.map(r => (
            <span key={r.id} style={{
              position: 'absolute',
              left: r.x, top: r.y,
              width: 10, height: 10,
              marginLeft: -5, marginTop: -5,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${teamColor}88 0%, transparent 70%)`,
              border: `2px solid ${teamColor}`,
              pointerEvents: 'none',
              animation: 'rippleOut 0.9s ease-out forwards',
              zIndex: 100,
            }} />
          ))}
        </div>
      </Link>
    </Reveal>
  );
}

/* ============================================================ */
/* ==================== MAIN COMPONENT ========================= */
/* ============================================================ */

export default function Drivers() {
  const { t } = useTranslation();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [heroVisible, setHeroVisible] = useState(false);

  const parallax = useMouseParallax(12);

  useEffect(() => {
    api.get('/drivers')
      .then(r => setDrivers(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => setHeroVisible(true), 200);
  }, [loading]);

  const driverCount = useCountUp(drivers.length, 1200, heroVisible);

  const filtered = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(d =>
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
      (d.teamName || '').toLowerCase().includes(q) ||
      (d.nationality || '').toLowerCase().includes(q) ||
      String(d.number || '').includes(q)
    );
  }, [drivers, search]);

  if (loading) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <div className="mono" style={{ color: 'var(--f1-red)', letterSpacing: '0.3em' }}>
        {t('common.loading')}
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
        @keyframes sigWobble {
          0%   { transform: translateY(0) rotate(0deg); }
          15%  { transform: translateY(-1px) rotate(-0.3deg); }
          30%  { transform: translateY(1px) rotate(0.2deg); }
          50%  { transform: translateY(-0.5px) rotate(-0.15deg); }
          70%  { transform: translateY(0.8px) rotate(0.1deg); }
          85%  { transform: translateY(-0.4px) rotate(-0.05deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes haloPulse {
          0%, 100% { transform: scale(1);    opacity: 0.85; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
        @keyframes penRing {
          0%   { width: 20px; height: 20px; opacity: 0.9; }
          100% { width: 60px; height: 60px; opacity: 0; }
        }
        @keyframes penGlow {
          0%   { transform: translate(-50%, -50%) scale(0.9);  opacity: 0.75; }
          100% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }
        @keyframes sparkPop {
          0%   { opacity: 0; transform: translate(0, 0) scale(0); }
          25%  { opacity: 1; transform: translate(calc(var(--drift-x) * 0.4), calc(var(--drift-y) * 0.4)) scale(1.2); }
          100% { opacity: 0; transform: translate(var(--drift-x), var(--drift-y)) scale(0.3); }
        }
        @keyframes finalFlash {
          0%   { width: 40px;  height: 40px;  opacity: 0.9; border-width: 3px; }
          100% { width: 200px; height: 200px; opacity: 0;   border-width: 1px; }
        }
        @keyframes racingStripe {
          from { background-position: 0 0; }
          to   { background-position: 20px 0; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.15; }
          50%      { opacity: 0.45; }
        }
        @keyframes borderChase {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -2060; }
        }
        @keyframes radarScan {
          0%   { top: -80px; }
          100% { top: 100%; }
        }
        @keyframes rippleOut {
          0%   { width: 10px; height: 10px; opacity: 1; margin-left: -5px; margin-top: -5px; }
          100% { width: 300px; height: 300px; opacity: 0; margin-left: -150px; margin-top: -150px; }
        }
        @keyframes glitchFlicker {
          0%, 88%, 100% { opacity: 1; transform: translate(0,0); }
          90%           { opacity: 0.5; transform: translate(-3px, 2px); }
          92%           { opacity: 1;   transform: translate(0,0); }
          94%           { opacity: 0.7; transform: translate(3px, -2px); }
          96%           { opacity: 1;   transform: translate(0,0); }
        }
        @keyframes teamLogoPulse {
          0%, 100% {
            box-shadow: 0 0 12px currentColor, 0 0 24px currentColor;
          }
          50% {
            box-shadow: 0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor;
          }
        }
        @keyframes teamLogoHalo {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
        @keyframes teamLogoShimmer {
          0%   { transform: translateX(-150%); opacity: 0; }
          50%  { opacity: 1; }
          100% { transform: translateX(350%); opacity: 0; }
        }
        @keyframes teamLogoBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.3; transform: scale(0.7); }
        }

        .glitch-text {
          animation: glitchFlicker 0.6s ease-in-out;
        }

        .driver-card {
          clip-path: polygon(
            0 0,
            calc(100% - 22px) 0,
            100% 22px,
            100% 100%,
            22px 100%,
            0 calc(100% - 22px)
          );
        }
      `}</style>

      <section style={{
        position: 'relative',
        padding: '80px 32px 40px',
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
            linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.08) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.08) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.08) 75%)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          animation: 'checkeredSlide 3s linear infinite',
          pointerEvents: 'none',
          opacity: 0.8,
        }} />

        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.4 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${15 + i * 14}%`, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${i % 2 ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.15)'}, transparent)`,
              animation: `speedLine ${4 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
            }} />
          ))}
        </div>

        <div className="container" style={{
          position: 'relative', maxWidth: 1400,
          transform: `translate(${parallax.x * 0.4}px, ${parallax.y * 0.4}px)`,
          transition: 'transform 0.3s ease-out',
        }}>
          <div className="fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 2, background: 'var(--f1-red)' }} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 11,
                letterSpacing: '0.4em', color: 'var(--f1-red)', fontWeight: 700,
              }}>
                {t('drivers.season')}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 900, lineHeight: 0.9,
              marginBottom: 20, letterSpacing: '-0.03em',
            }}>
              {t('drivers.title1')}{' '}
              <span style={{ color: 'var(--f1-red)', fontStyle: 'italic' }}>
                {t('drivers.title2')}
              </span>
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', marginTop: 24 }}>
              <p style={{ color: 'var(--text-mid)', fontSize: 17, margin: 0, fontFamily: 'var(--font-heading)' }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28, fontWeight: 900,
                  color: 'var(--f1-red)',
                  marginRight: 10,
                }}>
                  {driverCount}
                </span>
                {t('drivers.count', { count: drivers.length })}
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px',
                background: 'rgba(225,6,0,0.15)',
                border: '1px solid rgba(225,6,0,0.3)',
                borderRadius: 4,
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.15em', color: 'var(--f1-red)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--f1-red)',
                  animation: 'pulseDot 2s infinite',
                }} />
                {t('drivers.activeSeason')}
              </div>
            </div>

            <div style={{ marginTop: 40, maxWidth: 520 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('drivers.searchPlaceholder')}
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
                  {t('drivers.resultsFor', { count: filtered.length, query: search })}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '40px 32px 100px', maxWidth: 1400 }}>
        {drivers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🏎️</div>
            <h3 style={{ color: 'var(--text-dim)', marginBottom: 8 }}>{t('drivers.noDrivers')}</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🔍</div>
            <h3 style={{ color: 'var(--text-dim)', marginBottom: 8 }}>{t('drivers.noResults')}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              {t('drivers.noResultsHint')}
            </p>
          </div>
        ) : (
          <div className="grid-3" style={{ gap: 24 }}>
            {filtered.map((d, idx) => (
              <DriverCard key={d.id} driver={d} index={idx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}