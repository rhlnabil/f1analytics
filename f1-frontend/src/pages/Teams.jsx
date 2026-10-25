import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
/* ==================== DRIVER AVATAR ========================== */
/* ============================================================ */

function DriverAvatar({ driver, teamColor, size = 56 }) {
  const [hovered, setHovered] = useState(false);
  const displayName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();

  /* ✅ ACTION en priorité, TRANSITION en fallback */
  const driverPhoto = driver.actionPhotoUrl || driver.transitionPhotoUrl;

  return (
    <Link
      to={`/drivers/${driver.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        textDecoration: 'none',
        display: 'block',
        flexShrink: 0,
      }}
      title={displayName}
    >
      <div
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          border: `2px solid ${teamColor}`,
          boxShadow: hovered
            ? `0 0 12px ${teamColor}, 0 0 24px ${teamColor}88`
            : `0 0 6px ${teamColor}66`,
          opacity: hovered ? 1 : 0.7,
          transition: 'all 0.3s',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.6)',
          border: '2px solid #0a0a0a',
          zIndex: 1,
        }}
      >
        {driverPhoto ? (
          <img
            src={imgSrc(driverPhoto)}
            alt={displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              /* ✅ VISAGE : cadrage 2% du haut */
              objectPosition: 'center 2%',
              transform: hovered ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
              filter: 'contrast(1.05) saturate(1.1)',
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: size * 0.35,
            fontWeight: 900,
            color: teamColor,
          }}>
            {driver.firstName?.[0]}{driver.lastName?.[0]}
          </div>
        )}
      </div>

      {driver.number && (
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            minWidth: 20,
            height: 20,
            padding: '0 5px',
            borderRadius: 10,
            background: teamColor,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 900,
            display: 'grid',
            placeItems: 'center',
            border: '2px solid #0a0a0a',
            zIndex: 3,
            boxShadow: hovered ? `0 0 10px ${teamColor}` : 'none',
            transition: 'box-shadow 0.3s',
          }}
        >
          {driver.number}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: `translateX(-50%) translateY(${hovered ? 0 : 4}px)`,
          padding: '5px 10px',
          background: 'rgba(0,0,0,0.95)',
          border: `1px solid ${teamColor}66`,
          borderRadius: 4,
          fontFamily: 'var(--font-heading)',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#fff',
          whiteSpace: 'nowrap',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.25s, transform 0.25s',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: `0 4px 16px rgba(0,0,0,0.8)`,
        }}
      >
        {driver.firstName} <strong>{driver.lastName}</strong>
      </div>
    </Link>
  );
}

/* ============================================================ */
/* ==================== TEAM CARD ============================== */
/* ============================================================ */

function TeamCard({ team, index, teamDrivers }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);

  const color = team.color || '#666';

  const onMove = useCallback(e => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ rx: -(py - 0.5) * 6, ry: (px - 0.5) * 6 });
  }, []);

  const onLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0 });
    setHovered(false);
  }, []);

  return (
    <Reveal delay={index * 0.06} direction="up">
      <Link
        to={`/teams/${team.id}`}
        ref={cardRef}
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onLeave}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          perspective: 1000,
        }}
      >
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            position: 'relative',
            border: `1px solid ${hovered ? color : `${color}33`}`,
            borderLeftWidth: 4,
            borderLeftColor: color,
            transition: 'border-color 0.4s',
            transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(0) scale(${hovered ? 1.01 : 1})`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0, right: 0,
            width: '40%', height: '100%',
            background: `linear-gradient(135deg, ${color} 0%, ${color}66 50%, transparent 100%)`,
            opacity: hovered ? 0.25 : 0.15,
            pointerEvents: 'none',
            transition: 'opacity 0.4s',
          }} />

          <div style={{ padding: 32, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{
                width: 90, height: 90,
                borderRadius: 8,
                display: 'grid', placeItems: 'center',
                flexShrink: 0,
                padding: 4,
                transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
              }}>
                {team.logoUrl ? (
                  <img src={imgSrc(team.logoUrl)} alt={team.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 32, fontWeight: 900, color,
                  }}>
                    {team.name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 26, fontWeight: 900,
                  textTransform: 'uppercase',
                  color: 'var(--f1-white)',
                  marginBottom: 6, lineHeight: 1.1,
                }}>
                  {team.name}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 10, color: 'var(--text-dim)',
                  fontSize: 15, marginBottom: 12,
                }}>
                  {team.countryCode ? (
                    <>
                      <img src={flagSrc(team.countryCode)} alt={team.countryCode}
                        style={{ height: 22, width: 'auto', borderRadius: 3 }} />
                      <span>{team.country}</span>
                    </>
                  ) : (
                    <span>📍 {team.country || 'Pays non renseigné'}</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                  {team.firstEntry && (
                    <span className="badge" style={{
                      background: `${color}22`,
                      color: 'var(--f1-white)',
                      border: `1px solid ${color}66`,
                    }}>
                      F1 depuis {team.firstEntry}
                    </span>
                  )}
                  {team.worldChampionships > 0 && (
                    <span className="badge" style={{
                      background: 'rgba(255,215,0,0.15)',
                      color: '#FFD700',
                      border: '1px solid rgba(255,215,0,0.3)',
                    }}>
                      🏆 ×{team.worldChampionships}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {teamDrivers.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: `1px solid ${color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    letterSpacing: '0.25em',
                    color: 'var(--text-dim)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginRight: 4,
                  }}
                >
                  ◆ Pilotes
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {teamDrivers.map(d => (
                    <DriverAvatar
                      key={d.id}
                      driver={d}
                      teamColor={color}
                      size={56}
                    />
                  ))}
                </div>
              </div>
            )}

            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${color}, transparent)`,
              opacity: hovered ? 1 : 0.5,
              transition: 'opacity 0.4s',
            }} />
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

/* ============================================================ */
/* ==================== MAIN COMPONENT ========================= */
/* ============================================================ */

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [heroVisible, setHeroVisible] = useState(false);

  const parallax = useMouseParallax(12);

  useEffect(() => {
    Promise.all([api.get('/teams'), api.get('/drivers')])
      .then(([t, d]) => {
        setTeams(t.data);
        setDrivers(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => setHeroVisible(true), 200);
  }, [loading]);

  const teamCount = useCountUp(teams.length, 1200, heroVisible);

  const driversByTeam = useMemo(() => {
    const map = {};
    drivers.forEach(d => {
      if (d.teamId != null) {
        const key = String(d.teamId);
        if (!map[key]) map[key] = [];
        map[key].push(d);
      }
    });
    return map;
  }, [drivers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.fullName || '').toLowerCase().includes(q) ||
      (t.country || '').toLowerCase().includes(q) ||
      (t.teamChief || '').toLowerCase().includes(q) ||
      (t.powerUnit || '').toLowerCase().includes(q)
    );
  }, [teams, search]);

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
        @keyframes slowRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes heroGridShift {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
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
                CONSTRUCTEURS
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 900, lineHeight: 0.9,
              marginBottom: 20, letterSpacing: '-0.03em',
            }}>
              LES{' '}
              <span style={{ color: 'var(--f1-red)', fontStyle: 'italic' }}>
                ÉCURIES
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
                  {teamCount}
                </span>
                écurie{teams.length > 1 ? 's' : ''} au paddock
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
                SAISON ACTIVE
              </div>
            </div>

            <div style={{ marginTop: 40, maxWidth: 520 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une écurie, un pays, un directeur..."
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

      <section className="container" style={{ padding: '40px 32px 100px', maxWidth: 1400 }}>
        {teams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🏆</div>
            <h3 style={{ color: 'var(--text-dim)', marginBottom: 8 }}>Aucune écurie</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🔍</div>
            <h3 style={{ color: 'var(--text-dim)', marginBottom: 8 }}>Aucun résultat</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              Essaie avec un autre nom, un autre pays ou un autre directeur.
            </p>
          </div>
        ) : (
          <div className="grid-2" style={{ gap: 24 }}>
            {filtered.map((t, idx) => (
              <TeamCard
                key={t.id}
                team={t}
                index={idx}
                teamDrivers={driversByTeam[String(t.id)] || []}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}