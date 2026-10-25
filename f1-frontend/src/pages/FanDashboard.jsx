import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { imgSrc, flagSrc } from '../utils/images';
import { useCursor } from '../context/CursorContext';
import { useSound } from '../context/SoundContext';
import FanBadge from '../components/FanBadge';

/* ============================================================ */
/* ============== TRANSITION OVERLAY ========================== */
/* ============================================================ */

function TransitionOverlay({ active, type, phase, team, driver }) {
  if (!active) return null;
  const color = team?.color || '#e10600';
  const isDriver = type === 'driver';
  const photoUrl = driver?.transitionPhotoUrl || driver?.actionPhotoUrl;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      pointerEvents: 'none',
      display: 'grid', placeItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at center, ${color} 0%, #0a0a0a 75%)`,
        animation: phase === 'out'
          ? 'transOut 0.8s cubic-bezier(0.4,0,0.2,1) forwards'
          : 'transIn 0.8s cubic-bezier(0.4,0,0.2,1) forwards',
      }} />

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${i * 5}%`, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${i % 2 ? '#fff' : color}, transparent)`,
            opacity: 0,
            animation: `speedLineTrans 0.7s linear ${i * 0.02}s forwards`,
          }} />
        ))}
      </div>

      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 200, height: 200, borderRadius: '50%',
        border: `3px solid ${color}`,
        opacity: 0,
        animation: 'ringExpand 1.2s ease-out forwards',
      }} />

      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: '40px 60px',
        maxWidth: '95%', maxHeight: '95vh',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12, letterSpacing: '0.5em',
          color: '#fff', fontWeight: 700,
          textShadow: `0 0 30px ${color}`,
          opacity: 0,
          animation: 'textSlideUp 0.9s cubic-bezier(0.4,0,0.2,1) forwards',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ width: 60, height: 1, background: color }} />
          {isDriver ? '◆ PILOTE SÉLECTIONNÉ ◆' : '◆ ÉCURIE SÉLECTIONNÉE ◆'}
          <span style={{ width: 60, height: 1, background: color }} />
        </div>

        {!isDriver && team?.logoUrl && (
          <div style={{
            animation: 'logoZoom 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            opacity: 0, position: 'relative',
          }}>
            <img src={imgSrc(team.logoUrl)} alt={team.name}
              style={{
                position: 'relative',
                height: 240, width: 'auto',
                background: '#fff', padding: 28, borderRadius: 28,
                boxShadow: `0 0 120px ${color}, 0 0 200px ${color}88`,
              }} />
          </div>
        )}

        {isDriver && (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 60,
            width: '100%', maxWidth: 1200,
          }}>
            {team?.logoUrl && (
              <div style={{
                animation: 'slideFromLeft 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                opacity: 0,
              }}>
                <img src={imgSrc(team.logoUrl)} alt={team.name}
                  style={{
                    height: 200, width: 'auto',
                    background: '#fff', padding: 24, borderRadius: 24,
                    boxShadow: `0 0 80px ${color}, 0 0 140px ${color}88`,
                  }} />
              </div>
            )}

            <div style={{
              width: 2, height: 320,
              background: `linear-gradient(180deg, transparent, ${color}, #fff, ${color}, transparent)`,
              boxShadow: `0 0 30px ${color}`,
            }} />

            {photoUrl && (
              <div style={{
                animation: 'slideFromRight 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards',
                opacity: 0, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                maxHeight: 560, pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'absolute', inset: -60,
                  background: `radial-gradient(ellipse, ${color}66 0%, ${color}22 40%, transparent 75%)`,
                  filter: 'blur(40px)', pointerEvents: 'none',
                }} />
                <img src={imgSrc(photoUrl)} alt={driver?.lastName}
                  style={{
                    maxHeight: 520, maxWidth: 420,
                    width: 'auto', height: 'auto',
                    objectFit: 'contain', position: 'relative',
                    filter: `drop-shadow(0 30px 60px rgba(0,0,0,0.95)) drop-shadow(0 0 60px ${color}cc) drop-shadow(0 0 100px ${color}88)`,
                  }} />
              </div>
            )}
          </div>
        )}

        <div style={{
          textAlign: 'center', opacity: 0,
          animation: 'textSlideUp 0.9s cubic-bezier(0.4,0,0.2,1) 0.4s forwards',
        }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(28px, 4.5vw, 52px)',
            fontWeight: 900, textTransform: 'uppercase',
            color: '#fff', letterSpacing: '-0.02em',
            lineHeight: 1, textShadow: `0 0 40px ${color}`,
          }}>
            {isDriver ? `${driver?.firstName} ${driver?.lastName}` : team?.name}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes transIn { 0% { clip-path: circle(0% at 50% 50%); } 100% { clip-path: circle(150% at 50% 50%); } }
        @keyframes transOut { 0% { clip-path: circle(150% at 50% 50%); opacity: 1; } 100% { clip-path: circle(150% at 50% 50%); opacity: 0; } }
        @keyframes logoZoom { 0% { opacity: 0; transform: scale(0.3) rotate(-15deg); } 100% { opacity: 1; transform: scale(1) rotate(0); } }
        @keyframes slideFromLeft { 0% { opacity: 0; transform: translateX(-120px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes slideFromRight { 0% { opacity: 0; transform: translateX(120px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes textSlideUp { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes ringExpand { 0% { opacity: 1; transform: translate(-50%, -50%) scale(0.2); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(4); } }
        @keyframes speedLineTrans { 0% { opacity: 0; transform: translateX(-100%); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

/* ============================================================ */
/* ====================== TEAM CARD ============================ */
/* ============================================================ */

function TeamCard({ team, onSelect, index }) {
  const [hovered, setHovered] = useState(false);
  const color = team.color || '#e10600';

  return (
    <button
      type="button"
      onClick={() => onSelect(team)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        all: 'unset', cursor: 'pointer',
        position: 'relative', display: 'block', width: '100%',
        background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
        border: `1.5px solid ${hovered ? color : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10, overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 30px 60px -15px ${color}cc, 0 0 50px ${color}55`
          : '0 10px 30px rgba(0,0,0,0.4)',
        clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: hovered ? '100%' : '30%', height: 3,
        background: color,
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
      }} />

      <div style={{ position: 'relative', padding: '32px 28px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 120, height: 120, borderRadius: 16,
            background: '#fff', padding: 14,
            display: 'grid', placeItems: 'center',
            boxShadow: `0 0 25px ${color}88, 0 0 50px ${color}44`,
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.4s',
          }}>
            {team.logoUrl ? (
              <img src={imgSrc(team.logoUrl)} alt={team.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 42, fontWeight: 900, color,
              }}>
                {team.name?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10, letterSpacing: '0.3em',
          color, fontWeight: 700, marginBottom: 8, textAlign: 'center',
        }}>◆ ÉCURIE ◆</div>

        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 26, fontWeight: 900,
          textTransform: 'uppercase', color: '#fff',
          lineHeight: 1, marginBottom: 10, textAlign: 'center',
        }}>{team.name}</div>

        {team.country && (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            color: 'var(--text-dim)', fontSize: 12,
            fontFamily: 'var(--font-heading)', marginBottom: 20,
          }}>
            {team.countryCode && (
              <img src={flagSrc(team.countryCode)} alt={team.countryCode}
                style={{ height: 14, width: 'auto', borderRadius: 2 }} />
            )}
            {team.country}
          </div>
        )}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8, marginBottom: 20,
        }}>
          {[
            { label: 'GP', value: team.gpEntered || '—' },
            { label: 'PODIUMS', value: team.podiums || '—' },
            { label: 'TITRES', value: team.worldChampionships ?? '—' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '10px 8px',
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${color}22`,
              borderRadius: 6, textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16, fontWeight: 900, color, marginBottom: 2,
              }}>{s.value}</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 7, letterSpacing: '0.2em',
                color: 'var(--text-dim)', fontWeight: 700,
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '14px 20px',
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, fontFamily: 'var(--font-heading)',
          fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.15em',
          color: '#fff',
          clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        }}>Sélectionner →</div>
      </div>
    </button>
  );
}

/* ============================================================ */
/* ===================== DRIVER CARD =========================== */
/* ============================================================ */

function DriverCard({ driver, selected, onSelect, teamColor, index }) {
  const [hovered, setHovered] = useState(false);
  const color = driver.teamColor || teamColor || '#e10600';
  const isActive = selected?.id === driver.id;
  const driverPhoto = driver.actionPhotoUrl || driver.transitionPhotoUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect(driver)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        all: 'unset', cursor: 'pointer',
        position: 'relative', display: 'block', width: '100%',
        background: 'linear-gradient(180deg, #0a0e15 0%, #05070a 100%)',
        border: `2px solid ${isActive ? color : hovered ? `${color}aa` : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12, overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isActive
          ? `0 30px 70px -15px ${color}ee, 0 0 60px ${color}66`
          : hovered ? `0 30px 60px -20px ${color}aa` : '0 10px 30px rgba(0,0,0,0.5)',
        clipPath: 'polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 26px 100%, 0 calc(100% - 26px))',
      }}
    >
      <div style={{
        position: 'absolute', top: '15%', right: '-10%',
        fontFamily: 'var(--font-display)', fontSize: 340,
        fontWeight: 900, fontStyle: 'italic', color,
        opacity: hovered ? 0.15 : 0.06,
        lineHeight: 1, letterSpacing: '-0.08em',
        pointerEvents: 'none', userSelect: 'none',
      }}>{driver.number || '—'}</div>

      <div style={{
        position: 'relative', height: 320,
        overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {driverPhoto ? (
          <img src={imgSrc(driverPhoto)} alt={`${driver.firstName} ${driver.lastName}`}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: 'center 2%',
              transform: hovered ? 'scale(1.55) translateY(2%)' : 'scale(1.45)',
              transformOrigin: 'center 12%',
              transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
              filter: hovered
                ? `drop-shadow(0 0 25px ${color}) contrast(1.1) saturate(1.2)`
                : `drop-shadow(0 0 15px ${color}88) contrast(1.05)`,
            }}
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 100,
            fontWeight: 900, color, opacity: 0.3,
          }}>{driver.firstName?.[0]}{driver.lastName?.[0]}</div>
        )}

        {driver.number != null && (
          <div style={{
            position: 'absolute', top: 18, right: 18,
            minWidth: 52, height: 52, padding: '0 14px',
            background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
            color: '#fff', fontFamily: 'var(--font-display)',
            fontSize: 24, fontWeight: 900, fontStyle: 'italic',
            borderRadius: 10, display: 'grid', placeItems: 'center',
            boxShadow: `0 0 25px ${color}cc`, zIndex: 3,
          }}>{driver.number}</div>
        )}

        {driver.worldChampionships > 0 && (
          <div style={{
            position: 'absolute', top: 18, left: 18,
            padding: '6px 12px',
            background: 'rgba(0,0,0,0.9)',
            border: '1.5px solid rgba(255,215,0,0.7)',
            color: '#FFD700', fontFamily: 'var(--font-display)',
            fontSize: 11, fontWeight: 700,
            borderRadius: 6, zIndex: 3,
          }}>👑 ×{driver.worldChampionships}</div>
        )}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 120,
          background: 'linear-gradient(180deg, transparent, #05070a)',
          pointerEvents: 'none', zIndex: 2,
        }} />
      </div>

      <div style={{ position: 'relative', padding: '20px 24px 24px' }}>
        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: 11,
          fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.3em', color: 'var(--text-dim)',
          marginBottom: 4,
        }}>{driver.firstName}</div>

        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: 34,
          fontWeight: 900, textTransform: 'uppercase',
          letterSpacing: '-0.02em', color: '#fff',
          lineHeight: 1, marginBottom: 16,
        }}>{driver.lastName}</div>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 14,
          borderTop: `1px solid ${color}33`,
          marginBottom: 16, gap: 8, flexWrap: 'wrap',
        }}>
          {driver.countryCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={flagSrc(driver.countryCode)} alt={driver.countryCode}
                style={{ height: 18, width: 'auto', borderRadius: 2 }} />
              <span style={{
                fontSize: 12, color: 'var(--text-mid)',
                fontFamily: 'var(--font-heading)', fontWeight: 600,
              }}>{driver.nationality}</span>
            </div>
          )}
          {driver.debutYear && (
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10, color, fontWeight: 700,
              letterSpacing: '0.1em',
            }}>F1 · {driver.debutYear}</span>
          )}
        </div>

        <div style={{
          padding: '12px 20px',
          background: isActive
            ? `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
            : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, fontFamily: 'var(--font-heading)',
          fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.15em',
          color: isActive ? '#fff' : 'var(--text-mid)',
          clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        }}>
          {isActive ? '✓ Sélectionné' : 'Sélectionner →'}
        </div>
      </div>
    </button>
  );
}

/* ============================================================ */
/* ============ CENTER HUD — HOVER EFFECT ===================== */
/* ============================================================ */

function CenterHUD({ meta }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 25,
      pointerEvents: 'none',
      display: 'grid', placeItems: 'center',
      overflow: 'hidden', borderRadius: 10,
      animation: 'hudPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
    }}>
      <div style={{
        position: 'absolute',
        width: '170%', height: '170%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${meta.color}66 0%, ${meta.color}22 35%, transparent 70%)`,
        filter: 'blur(30px)',
        animation: 'hudGlow 1.6s ease-in-out infinite',
      }} />

      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 40, height: 40, borderRadius: '50%',
          border: `2px solid ${meta.color}`,
          boxShadow: `0 0 20px ${meta.color}, inset 0 0 20px ${meta.color}66`,
          opacity: 0,
          animation: `hudRing 1.6s ease-out ${i * 0.3}s infinite`,
        }} />
      ))}

      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 3,
          background: `linear-gradient(180deg, ${meta.color}, transparent)`,
          transformOrigin: '50% 0',
          transform: `translate(-50%, 0) rotate(${i * 30}deg)`,
          opacity: 0,
          animation: `hudLine 0.9s ease-out ${i * 0.04}s both`,
        }} />
      ))}

      {[
        { top: 8, left: 8, bt: true, bl: true },
        { top: 8, right: 8, bt: true, br: true },
        { bottom: 8, left: 8, bb: true, bl: true },
        { bottom: 8, right: 8, bb: true, br: true },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: c.top, left: c.left, right: c.right, bottom: c.bottom,
          width: 22, height: 22,
          borderTop: c.bt ? `2px solid ${meta.color}` : 'none',
          borderBottom: c.bb ? `2px solid ${meta.color}` : 'none',
          borderLeft: c.bl ? `2px solid ${meta.color}` : 'none',
          borderRight: c.br ? `2px solid ${meta.color}` : 'none',
          boxShadow: `0 0 10px ${meta.color}88`,
          animation: `hudCorner 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.1 + i * 0.05}s both`,
        }} />
      ))}

      <div style={{
        position: 'relative', textAlign: 'center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, zIndex: 2,
      }}>
        <div style={{
          fontSize: 58, lineHeight: 1,
          filter: `drop-shadow(0 0 20px ${meta.color}) drop-shadow(0 0 40px ${meta.color}88)`,
          animation: 'hudIcon 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}>{meta.icon}</div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 30, fontWeight: 900,
          letterSpacing: '0.18em', color: '#fff',
          textShadow: `-2px 0 ${meta.color}, 2px 0 ${meta.color}cc, 0 0 20px ${meta.color}, 0 0 40px ${meta.color}88`,
          animation: 'hudLabel 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both',
          whiteSpace: 'nowrap',
        }}>{meta.label}</div>

        <div style={{
          width: 60, height: 2,
          background: meta.color,
          boxShadow: `0 0 12px ${meta.color}`,
          animation: 'hudDivider 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both',
        }} />

        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.8)',
          animation: 'hudSub 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.22s both',
        }}>{meta.sub}</div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ F1 WHEEL ===================================== */
/* ============================================================ */

function F1Wheel({
  themeColor, username, teamName,
  onGames, onBadge, onEdit, onReset, onLogout, onMyDriver,
}) {
  const { playButtonHover, playCarPass } = useSound();
  const [hovered, setHovered] = useState(null);
  const [pressed, setPressed] = useState(null);
  const [ignition, setIgnition] = useState('off');
  const [revSweep, setRevSweep] = useState(0);
  const [flashIgn, setFlashIgn] = useState(false);
  const [booting, setBooting] = useState(false);
  const [bootLeds, setBootLeds] = useState(0);

  const [raceInfo, setRaceInfo] = useState(null);

  useEffect(() => {
    api.get('/races/current')
      .then(r => setRaceInfo(r.data))
      .catch(err => {
        console.warn('[F1Wheel] Impossible de charger les infos race :', err?.message);
      });
  }, []);

  const isRunning = ignition === 'running';
  const isIgnArmed = ignition === 'ign';
  const isLocked = !isRunning;

  useEffect(() => {
    if (!isRunning || booting) { setRevSweep(0); return; }
    let raf;
    const t0 = performance.now();
    const loop = (t) => {
      const s = (t - t0) / 1000;
      const phase = (Math.sin(s * Math.PI * 0.9) + 1) / 2;
      setRevSweep(Math.round(phase * 15));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isRunning, booting]);

  useEffect(() => {
    if (!booting) { setBootLeds(0); return; }
    let raf;
    const t0 = performance.now();
    const dur = 2200;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      setBootLeds(Math.round(p * 15));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [booting]);

  const pressIgn = () => {
    playButtonHover();
    setIgnition(prev => prev === 'off' ? 'ign' : 'off');
    setBooting(false);
  };

  const pressStart = () => {
    if (ignition === 'off') {
      playButtonHover();
      setFlashIgn(true);
      setTimeout(() => setFlashIgn(false), 700);
      return;
    }
    if (ignition === 'ign') {
      setIgnition('running');
      setBooting(true);
      playCarPass();
      setTimeout(() => setBooting(false), 2200);
    } else {
      setIgnition('ign');
      setBooting(false);
      playButtonHover();
    }
  };

  const BUTTON_META = {
    games:    { icon: '🎮', label: 'GAMES',    sub: 'Joue avec tes pilotes',     color: '#00d4ff' },
    badge:    { icon: '🎫', label: 'BADGE',    sub: 'Ton badge 360° de fan',     color: themeColor },
    edit:     { icon: '⚙️', label: 'SETUP',    sub: 'Modifier tes favoris',      color: '#ffd700' },
    myDriver: { icon: '📊', label: 'DRIVER',   sub: 'Suivi de ton pilote',       color: '#1e41ff' },
    reset:    { icon: '⟲',  label: 'RESET',    sub: 'Effacer tes favoris',       color: '#ff8700' },
    logout:   { icon: '⏻',  label: 'LOGOUT',   sub: 'Fermer la session',         color: '#e10600' },
  };
  const hoverMeta = hovered ? BUTTON_META[hovered] : null;

  const leftButtons = [
    { id: 'games', color: '#00d4ff', onClick: onGames, top: '18%' },
    { id: 'badge', color: themeColor, onClick: onBadge, top: '36%' },
    { id: 'edit',  color: '#ffd700', onClick: onEdit,  top: '54%' },
  ];
  const rightButtons = [
    { id: 'reset',    color: '#ff8700', onClick: onReset,     top: '18%' },
    { id: 'myDriver', color: '#1e41ff', onClick: onMyDriver,  top: '36%' },
    { id: 'extra2',   color: '#00d26a', onClick: () => {},    top: '54%' },
  ];

  const press = (id, fn) => {
    setPressed(id);
    setTimeout(() => setPressed(null), 180);
    if (fn) fn();
  };

  const handleHoverEnter = (id, disabled = false) => {
    if (disabled || isLocked || booting) return;
    setHovered(id);
    playButtonHover();
  };
  const handleHoverLeave = () => setHovered(null);

  const hoverLeds = hovered
    ? {
        games: 3,
        badge: 6,
        edit: 9,
        myDriver: 10,
        reset: 12,
        logout: 15,
      }[hovered] || 0
    : null;

  let ledsLit = 0;
  if (ignition === 'off')        ledsLit = 0;
  else if (booting)              ledsLit = bootLeds;
  else if (hoverLeds != null)    ledsLit = hoverLeds;
  else if (ignition === 'ign')   ledsLit = 4;
  else                           ledsLit = revSweep;

  const ledColor = (i) => {
    if (i < 3)  return '#00d26a';
    if (i < 6)  return '#ffd700';
    if (i < 9)  return '#ff8700';
    if (i < 12) return '#e10600';
    return '#00d4ff';
  };

  const ignColor  = ignition === 'off' ? '#b38600' : '#00d26a';
  const ignBorder = ignition === 'off' ? '#8a6800' : '#00a050';
  const ignGlow   = ignition === 'off' ? 'none' : '0 0 20px #00d26a, 0 0 40px rgba(0,210,106,0.6)';
  const ignLabel  = ignition === 'off' ? 'IGN' : 'IGN · ON';

  const startColor  = isRunning ? '#00d26a' : isIgnArmed ? '#ffd700' : '#b38600';
  const startBorder = isRunning ? '#00a050' : isIgnArmed ? '#b38600' : '#8a6800';
  const startGlow   = isRunning
    ? '0 0 20px #00d26a, 0 0 40px rgba(0,210,106,0.6)'
    : isIgnArmed
    ? '0 0 15px #ffd700, 0 0 30px rgba(255,215,0,0.5)'
    : 'none';
  const startLabel = isRunning ? 'RUNNING' : 'START';

  const bootProgress = (bootLeds / 15) * 100;

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '40px 20px 60px',
      animation: 'fadeSlideUp 0.8s ease',
    }}>
      <style>{`
        @keyframes hudPop { 0% { opacity: 0; transform: scale(0.5); filter: blur(20px); } 60% { opacity: 1; filter: blur(0); } 100% { opacity: 1; transform: scale(1); filter: blur(0); } }
        @keyframes hudGlow { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes hudRing { 0% { width: 40px; height: 40px; opacity: 0.9; } 100% { width: 340px; height: 340px; opacity: 0; } }
        @keyframes hudLine { 0% { height: 0; opacity: 0; } 35% { height: 60px; opacity: 1; } 100% { height: 130px; opacity: 0; } }
        @keyframes hudIcon { 0% { opacity: 0; transform: scale(0) rotate(-180deg); } 60% { opacity: 1; transform: scale(1.2) rotate(12deg); } 100% { opacity: 1; transform: scale(1) rotate(0); } }
        @keyframes hudLabel { 0% { opacity: 0; transform: translateY(20px) scale(0.7); filter: blur(8px); } 60% { opacity: 1; filter: blur(0); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes hudDivider { 0% { width: 0; opacity: 0; } 100% { width: 60px; opacity: 1; } }
        @keyframes hudSub { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 0.8; transform: translateY(0); } }
        @keyframes hudCorner { 0% { opacity: 0; transform: scale(0.4); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes ignPulse { 0%, 100% { box-shadow: 0 0 15px #ffd70088, 0 0 25px #ffd70044; } 50% { box-shadow: 0 0 25px #ffd700cc, 0 0 45px #ffd70088; } }
        @keyframes ignFlash { 0%, 100% { box-shadow: inset 0 3px 6px rgba(255,255,255,0.4); } 50% { box-shadow: 0 0 40px #ff2020, 0 0 70px #ff202088, inset 0 3px 6px rgba(255,255,255,0.4); } }
        @keyframes lcdBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes lcdFadeIn { 0% { opacity: 0; transform: scale(0.96); filter: blur(4px); } 100% { opacity: 1; transform: scale(1); filter: blur(0); } }
        @keyframes bootLogo { 0% { opacity: 0; transform: scale(0.3) rotate(-15deg); filter: blur(12px); } 60% { opacity: 1; transform: scale(1.15) rotate(4deg); filter: blur(0); } 100% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); } }
        @keyframes bootHalo { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes bootRingSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bootText { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes bootScan { 0% { top: -20%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 120%; opacity: 0; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{
        position: 'relative', width: '100%',
        maxWidth: 780, aspectRatio: '780 / 500',
      }}>
        {/* Paddle shifters */}
        <div style={{
          position: 'absolute', top: '45%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92%', maxWidth: 820,
          display: 'flex', justifyContent: 'space-between', zIndex: 0,
        }}>
          <div style={{
            width: '18%', height: 54,
            background: 'linear-gradient(180deg, #2a2a35 0%, #05070a 100%)',
            border: '1px solid #3a3a48',
            borderRadius: '14px 4px 4px 14px',
            transform: 'rotate(-10deg)',
            boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.08), 0 8px 20px rgba(0,0,0,0.7)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 8, letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.35)',
          }}>DOWNSHIFT</div>
          <div style={{
            width: '18%', height: 54,
            background: 'linear-gradient(180deg, #2a2a35 0%, #05070a 100%)',
            border: '1px solid #3a3a48',
            borderRadius: '4px 14px 14px 4px',
            transform: 'rotate(10deg)',
            boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.08), 0 8px 20px rgba(0,0,0,0.7)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 8, letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.35)',
          }}>UPSHIFT</div>
        </div>

        {/* Main body */}
        <div style={{
          position: 'absolute', inset: '8% 0',
          background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 3px, transparent 3px, transparent 6px), radial-gradient(ellipse at 50% 30%, #1a1a22 0%, #0a0a0f 70%)',
          clipPath: 'polygon(18% 0%, 82% 0%, 96% 12%, 100% 28%, 100% 72%, 96% 88%, 82% 100%, 18% 100%, 4% 88%, 0% 72%, 0% 28%, 4% 12%)',
          border: '1px solid #2a2a35',
          boxShadow: `inset 0 2px 4px rgba(255,255,255,0.05), inset 0 -4px 12px rgba(0,0,0,0.8), 0 30px 60px rgba(0,0,0,0.9), 0 0 80px ${isRunning ? themeColor + '44' : 'transparent'}`,
          transition: 'box-shadow 0.6s ease',
          zIndex: 1,
        }} />

        {/* Side grips */}
        <div style={{
          position: 'absolute', left: '-1%', top: '22%',
          width: '18%', height: '56%',
          background: 'linear-gradient(90deg, #05070a 0%, #1a1a22 60%, #2a2a35 100%)',
          borderRadius: '50px 8px 8px 50px',
          boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.05), inset 0 -6px 12px rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.9)',
          zIndex: 2,
        }}>
          <div style={{
            position: 'absolute', inset: '12% 10%',
            borderRadius: '40px 4px 4px 40px',
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 8px)',
            opacity: 0.6,
          }} />
        </div>

        <div style={{
          position: 'absolute', right: '-1%', top: '22%',
          width: '18%', height: '56%',
          background: 'linear-gradient(90deg, #2a2a35 0%, #1a1a22 40%, #05070a 100%)',
          borderRadius: '8px 50px 50px 8px',
          boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.05), inset 0 -6px 12px rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.9)',
          zIndex: 2,
        }}>
          <div style={{
            position: 'absolute', inset: '12% 10%',
            borderRadius: '4px 40px 40px 4px',
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 8px)',
            opacity: 0.6,
          }} />
        </div>

        {/* Center LCD area */}
        <div style={{
          position: 'absolute', top: '14%', left: '22%',
          width: '56%', height: '72%',
          zIndex: 3, display: 'flex', flexDirection: 'column',
          gap: '3%', alignItems: 'center',
        }}>
          {/* LEDs */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            alignItems: 'center', gap: 4,
            padding: '5px 12px',
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9)',
          }}>
            {[...Array(15)].map((_, i) => {
              const lit = i < ledsLit;
              const c = ledColor(i);
              return (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: lit ? c : '#1a1a22',
                  boxShadow: lit ? `0 0 6px ${c}, 0 0 12px ${c}aa` : 'inset 0 0 2px rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.15s ease',
                }} />
              );
            })}
          </div>

          {/* LCD */}
          <div style={{
            width: '100%', flex: 1, minHeight: 0,
            position: 'relative',
            background: 'linear-gradient(180deg, #05070a 0%, #0a0a0f 100%)',
            border: `2px solid ${isRunning ? themeColor + '55' : '#2a2a35'}`,
            borderRadius: 12,
            boxShadow: `inset 0 2px 8px rgba(0,0,0,0.95), inset 0 0 30px ${isRunning ? themeColor + '22' : 'transparent'}, 0 0 20px rgba(0,0,0,0.7)`,
            overflow: 'hidden',
            transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
          }}>
            {!isRunning && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8, textAlign: 'center', padding: 8,
              }}>
                <div style={{
                  fontSize: 36, filter: 'grayscale(0.4)',
                  opacity: 0.85,
                  animation: isIgnArmed ? 'lcdBlink 1.2s infinite' : 'none',
                }}>{ignition === 'off' ? '🔌' : '⚡'}</div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14, fontWeight: 900,
                  letterSpacing: '0.22em',
                  color: ignition === 'off' ? '#ff8700' : '#00d26a',
                  textShadow: ignition === 'off' ? '0 0 10px #ff870088' : '0 0 12px #00d26a88',
                  animation: isIgnArmed ? 'lcdBlink 1.2s infinite' : 'none',
                }}>{ignition === 'off' ? 'IGNITION OFF' : 'PRESS START'}</div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 9, letterSpacing: '0.25em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                }}>{ignition === 'off' ? 'Appuie sur ⏻ IGN' : 'Appuie sur ▶ START'}</div>
              </div>
            )}

            {isRunning && booting && (
              <div key="boot" style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: 12,
                animation: 'lcdFadeIn 0.35s ease',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 40,
                  background: `linear-gradient(180deg, transparent 0%, ${themeColor}44 50%, transparent 100%)`,
                  animation: 'bootScan 1.6s ease-in-out infinite',
                  pointerEvents: 'none', mixBlendMode: 'screen',
                }} />

                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `linear-gradient(${themeColor}0a 1px, transparent 1px), linear-gradient(90deg, ${themeColor}0a 1px, transparent 1px)`,
                  backgroundSize: '18px 18px',
                  pointerEvents: 'none', opacity: 0.7,
                }} />

                <div style={{
                  position: 'relative', display: 'grid', placeItems: 'center',
                  width: 90, height: 90, zIndex: 1,
                }}>
                  <div style={{
                    position: 'absolute', inset: -25,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${themeColor}66 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                    animation: 'bootHalo 1.4s ease-in-out infinite',
                  }} />
                  <div style={{
                    position: 'absolute', inset: -8,
                    borderRadius: '50%',
                    border: `2px dashed ${themeColor}88`,
                    animation: 'bootRingSpin 3s linear infinite',
                  }} />
                  <div style={{
                    position: 'absolute', inset: -14,
                    borderRadius: '50%',
                    border: `1px solid ${themeColor}44`,
                    animation: 'bootRingSpin 5s linear infinite reverse',
                  }} />
                  <img src="/Logo.png" alt="F1 Apex"
                    style={{
                      position: 'relative',
                      width: 62, height: 'auto',
                      filter: `drop-shadow(0 0 15px ${themeColor}) drop-shadow(0 0 30px ${themeColor}88)`,
                      animation: 'bootLogo 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                    }} />
                </div>

                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, letterSpacing: '0.38em',
                  color: '#fff', fontWeight: 900,
                  textShadow: `0 0 12px ${themeColor}aa`,
                  animation: 'bootText 0.5s ease 0.3s both',
                  zIndex: 1,
                }}>
                  F1<span style={{ color: themeColor }}>·</span>APEX
                </div>

                <div style={{
                  position: 'relative', width: '72%', height: 4,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 2, overflow: 'hidden',
                  animation: 'bootText 0.5s ease 0.5s both',
                  zIndex: 1,
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    width: `${bootProgress}%`,
                    background: `linear-gradient(90deg, ${themeColor}, #fff)`,
                    boxShadow: `0 0 12px ${themeColor}`,
                    transition: 'width 0.08s linear',
                  }} />
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  animation: 'bootText 0.5s ease 0.7s both',
                  zIndex: 1,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: themeColor,
                    boxShadow: `0 0 6px ${themeColor}`,
                    animation: 'lcdBlink 0.6s infinite',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 7, letterSpacing: '0.32em',
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 700,
                  }}>SYSTEM · BOOT · {Math.round(bootProgress)}%</span>
                </div>
              </div>
            )}

            {isRunning && !booting && (
              <div key="params" style={{
                position: 'absolute', inset: 0,
                padding: '6px 10px',
                display: 'flex', flexDirection: 'column',
                gap: 3,
                opacity: hovered ? 0.12 : 1,
                filter: hovered ? 'blur(3px)' : 'none',
                transform: hovered ? 'scale(0.94)' : 'scale(1)',
                transition: 'opacity 0.4s ease, filter 0.4s ease, transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                animation: 'lcdFadeIn 0.45s cubic-bezier(0.4,0,0.2,1)',
              }}>
                {raceInfo && raceInfo.status !== 'none' && raceInfo.race && (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingBottom: 3,
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 8, fontWeight: 900,
                        letterSpacing: '0.15em',
                        color:
                          raceInfo.status === 'live' ? '#ff2020' :
                          raceInfo.status === 'upcoming' ? '#ffd700' : '#00d26a',
                        textShadow:
                          raceInfo.status === 'live' ? '0 0 10px #ff2020' :
                          raceInfo.status === 'upcoming' ? '0 0 10px #ffd70088' :
                          '0 0 10px #00d26a88',
                        animation: raceInfo.status === 'live' ? 'lcdBlink 1s infinite' : 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        {raceInfo.status === 'live' && '● LIVE'}
                        {raceInfo.status === 'upcoming' && '⏱ DANS'}
                        {raceInfo.status === 'finished' && '🏁 PODIUM'}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 8, fontWeight: 900,
                        color: 'rgba(255,255,255,0.55)',
                        letterSpacing: '0.15em',
                      }}>
                        R{String(raceInfo.race.round).padStart(2, '0')}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                      gap: 6,
                      marginTop: 2,
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 12, fontWeight: 900,
                        textTransform: 'uppercase', color: '#fff',
                        letterSpacing: '0.01em',
                        maxWidth: '72%',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textShadow: '0 0 8px rgba(0,0,0,0.9)',
                      }}>
                        {raceInfo.race.name.replace(/^(FORMULA 1\s+)?/i, '')}
                      </div>

                      {raceInfo.status === 'upcoming' && (
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 16, fontWeight: 900,
                          color: '#ffd700',
                          lineHeight: 1,
                          textShadow: '0 0 12px #ffd70088',
                        }}>
                          {raceInfo.daysUntil}<span style={{ fontSize: 8, marginLeft: 1, color: 'rgba(255,255,255,0.5)' }}>J</span>
                        </span>
                      )}
                      {raceInfo.status === 'live' && (
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10, fontWeight: 900,
                          color: '#ff2020',
                          animation: 'lcdBlink 1s infinite',
                        }}>●</span>
                      )}
                    </div>

                    {raceInfo.status === 'finished' && raceInfo.podium && raceInfo.podium.length >= 3 && (
                      <div style={{
                        display: 'flex', gap: 5, marginTop: 3,
                        fontFamily: 'var(--font-display)',
                        fontSize: 10, fontWeight: 900,
                        letterSpacing: '0.05em',
                      }}>
                        {raceInfo.podium.map((r, i) => (
                          <span key={i} style={{
                            color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32',
                            textShadow: `0 0 8px ${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32'}88`,
                          }}>
                            {r.driverCode || '?'}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{
                      height: 1,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                      margin: '4px 0 2px',
                    }} />
                  </>
                )}

                <div style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', gap: 2,
                  minHeight: 0,
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 7, letterSpacing: '0.3em',
                      color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                    }}>DRIVER</div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 12, fontWeight: 900,
                      color: themeColor, textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      textShadow: `0 0 10px ${themeColor}66`,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>@{username || 'FAN'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 7, letterSpacing: '0.3em',
                      color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                    }}>TEAM</div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 12, fontWeight: 900,
                      color: '#fff', textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{teamName || '—'}</div>
                  </div>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 'auto', paddingTop: 3,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#00d26a',
                      boxShadow: '0 0 6px #00d26a',
                      animation: 'lcdBlink 1s infinite',
                    }} />
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 7, letterSpacing: '0.2em',
                      color: '#00d26a', fontWeight: 700,
                    }}>RUNNING</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 7, letterSpacing: '0.2em',
                    color: 'rgba(255,255,255,0.35)',
                    fontWeight: 700,
                  }}>F1·APEX</span>
                </div>
              </div>
            )}

            {isRunning && !booting && hoverMeta && (
              <CenterHUD key={hovered} meta={hoverMeta} />
            )}
          </div>
        </div>

        {/* Left buttons */}
        {leftButtons.map(b => {
          const isHover = hovered === b.id;
          const isPressed = pressed === b.id;
          return (
            <button key={b.id} type="button"
              onClick={() => !isLocked && !booting && press(b.id, b.onClick)}
              onMouseEnter={() => handleHoverEnter(b.id)}
              onMouseLeave={handleHoverLeave}
              style={{
                all: 'unset',
                cursor: isLocked || booting ? 'not-allowed' : 'pointer',
                position: 'absolute', left: '10%', top: b.top,
                width: 40, height: 40, borderRadius: '50%',
                background: isPressed
                  ? `radial-gradient(circle at 30% 30%, ${b.color} 0%, ${b.color}88 70%)`
                  : isHover
                  ? `radial-gradient(circle at 30% 30%, ${b.color} 0%, ${b.color}55 70%)`
                  : `radial-gradient(circle at 30% 30%, ${b.color}dd 0%, ${b.color}44 70%)`,
                border: `2px solid ${b.color}`,
                boxShadow: isHover || isPressed
                  ? `0 0 20px ${b.color}aa, inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -3px 8px rgba(0,0,0,0.6)`
                  : `inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 8px rgba(0,0,0,0.7), 0 3px 8px rgba(0,0,0,0.5)`,
                transition: 'all 0.3s ease, opacity 0.4s ease',
                transform: isPressed ? 'translateY(2px) scale(0.95)' : 'scale(1)',
                display: 'grid', placeItems: 'center',
                zIndex: 4,
                opacity: isLocked ? 0.28 : 1,
                filter: isLocked ? 'grayscale(0.85)' : 'none',
              }}
            >
              <span style={{
                width: '40%', height: '25%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, transparent 70%)',
                position: 'absolute', top: '15%', left: '30%',
                pointerEvents: 'none',
              }} />
            </button>
          );
        })}

        {/* Right buttons */}
        {rightButtons.map(b => {
          const isHover = hovered === b.id;
          const isPressed = pressed === b.id;
          const disabled = b.id.startsWith('extra');
          const reallyLocked = isLocked || disabled || booting;
          return (
            <button key={b.id} type="button"
              onClick={() => !reallyLocked && press(b.id, b.onClick)}
              onMouseEnter={() => handleHoverEnter(b.id, disabled)}
              onMouseLeave={handleHoverLeave}
              style={{
                all: 'unset',
                cursor: reallyLocked ? 'not-allowed' : 'pointer',
                position: 'absolute', right: '10%', top: b.top,
                width: 40, height: 40, borderRadius: '50%',
                background: isPressed
                  ? `radial-gradient(circle at 30% 30%, ${b.color} 0%, ${b.color}88 70%)`
                  : isHover
                  ? `radial-gradient(circle at 30% 30%, ${b.color} 0%, ${b.color}55 70%)`
                  : `radial-gradient(circle at 30% 30%, ${b.color}dd 0%, ${b.color}44 70%)`,
                border: `2px solid ${b.color}`,
                boxShadow: isHover || isPressed
                  ? `0 0 20px ${b.color}aa, inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -3px 8px rgba(0,0,0,0.6)`
                  : `inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 8px rgba(0,0,0,0.7), 0 3px 8px rgba(0,0,0,0.5)`,
                transition: 'all 0.3s ease, opacity 0.4s ease',
                transform: isPressed ? 'translateY(2px) scale(0.95)' : 'scale(1)',
                display: 'grid', placeItems: 'center',
                zIndex: 4,
                opacity: isLocked ? 0.28 : 1,
                filter: isLocked ? 'grayscale(0.85)' : 'none',
              }}
            >
              <span style={{
                width: '40%', height: '25%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, transparent 70%)',
                position: 'absolute', top: '15%', left: '30%',
                pointerEvents: 'none',
              }} />
            </button>
          );
        })}

        {/* Logout top-left */}
        <button type="button"
          onClick={() => press('logout', onLogout)}
          onMouseEnter={() => handleHoverEnter('logout')}
          onMouseLeave={handleHoverLeave}
          title="Déconnexion"
          style={{
            all: 'unset', cursor: 'pointer',
            position: 'absolute', left: '18%', top: '8%',
            width: 38, height: 38, borderRadius: '50%',
            background: pressed === 'logout'
              ? 'radial-gradient(circle at 30% 30%, #ff5555 0%, #7a0300 70%)'
              : hovered === 'logout'
              ? 'radial-gradient(circle at 30% 30%, #ff2e2e 0%, #5a0300 70%)'
              : 'radial-gradient(circle at 30% 30%, #e10600 0%, #3a0505 70%)',
            border: '2px solid #7a0300',
            boxShadow: hovered === 'logout'
              ? '0 0 20px #ff2e2eaa, inset 0 2px 4px rgba(255,255,255,0.3)'
              : 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 8px rgba(0,0,0,0.7), 0 3px 8px rgba(0,0,0,0.6)',
            transition: 'all 0.15s ease',
            transform: pressed === 'logout' ? 'translateY(2px) scale(0.95)' : 'scale(1)',
            display: 'grid', placeItems: 'center',
            fontSize: 14, color: '#fff', zIndex: 4,
          }}
        >⏻</button>

        {/* Red dot top-right */}
        <div style={{
          position: 'absolute', right: '18%', top: '8%',
          width: 38, height: 38, borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #e10600 0%, #3a0505 70%)',
          border: '2px solid #7a0300',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 8px rgba(0,0,0,0.7), 0 3px 8px rgba(0,0,0,0.6)',
          zIndex: 4,
        }} />

        {/* Rotary dials */}
        <div style={{
          position: 'absolute', bottom: '14%', left: '38%',
          transform: 'translateX(-50%)',
          width: 60, height: 60, zIndex: 4,
          opacity: isLocked ? 0.4 : 1,
          filter: isLocked ? 'grayscale(0.7)' : 'none',
          transition: 'opacity 0.6s ease, filter 0.6s ease',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #e10600 0deg 45deg, #ff8700 45deg 135deg, #ffd700 135deg 225deg, #00d4ff 225deg 315deg, #e10600 315deg 360deg)',
            boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.6)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid #0a0a0f',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8)',
          }} />
          <div style={{
            position: 'absolute', inset: 20,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #2a2a35 0%, #0a0a0f 80%)',
            border: '2px solid #3a3a48',
          }} />
          <div style={{
            position: 'absolute', top: 4, left: '50%',
            transform: 'translateX(-50%)',
            width: 3, height: 10,
            background: '#fff', borderRadius: 2,
            boxShadow: '0 0 4px #fff',
          }} />
        </div>

        <div style={{
          position: 'absolute', bottom: '14%', right: '38%',
          transform: 'translateX(50%)',
          width: 60, height: 60, zIndex: 4,
          opacity: isLocked ? 0.4 : 1,
          filter: isLocked ? 'grayscale(0.7)' : 'none',
          transition: 'opacity 0.6s ease, filter 0.6s ease',
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #00d4ff 0deg 45deg, #00d26a 45deg 135deg, #ffd700 135deg 225deg, #ff8700 225deg 315deg, #00d4ff 315deg 360deg)',
            boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.6)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid #0a0a0f',
          }} />
          <div style={{
            position: 'absolute', inset: 20,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #2a2a35 0%, #0a0a0f 80%)',
            border: '2px solid #3a3a48',
          }} />
          <div style={{
            position: 'absolute', top: 4, left: '50%',
            transform: 'translateX(-50%)',
            width: 3, height: 10,
            background: '#fff', borderRadius: 2,
            boxShadow: '0 0 4px #fff',
          }} />
        </div>

        {/* Red button */}
        <button type="button" onClick={() => {}} style={{
          all: 'unset',
          position: 'absolute', bottom: '6%', left: '50%',
          transform: 'translateX(-50%)',
          width: 46, height: 30, borderRadius: '8px',
          background: 'radial-gradient(ellipse at 50% 20%, #ff2e2e 0%, #7a0300 80%)',
          border: '2px solid #5a0300',
          boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.2), inset 0 -4px 8px rgba(0,0,0,0.6), 0 3px 8px rgba(0,0,0,0.6)',
          cursor: 'pointer', zIndex: 4,
          opacity: isLocked ? 0.4 : 1,
          transition: 'opacity 0.6s ease',
        }} />

        {/* IGN button */}
        <div style={{
          position: 'absolute', bottom: '4%', left: '16%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 5, zIndex: 5,
        }}>
          <button type="button" onClick={pressIgn} title="Ignition"
            style={{
              all: 'unset', cursor: 'pointer',
              width: 42, height: 42, borderRadius: 10,
              background: `radial-gradient(circle at 35% 35%, ${ignition === 'off' ? '#ffeb55' : '#7dffb0'} 0%, ${ignColor} 80%)`,
              border: `2px solid ${ignBorder}`,
              boxShadow: ignition === 'off'
                ? 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.5), 0 3px 8px rgba(0,0,0,0.6)'
                : `${ignGlow}, inset 0 3px 6px rgba(255,255,255,0.4)`,
              display: 'grid', placeItems: 'center',
              fontSize: 16,
              color: ignition === 'off' ? '#3a2a00' : '#003a1c',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              animation: flashIgn && ignition === 'off' ? 'ignFlash 0.7s ease' : 'none',
            }}
          >{ignition === 'off' ? '⏻' : '⚡'}</button>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 7, letterSpacing: '0.25em',
            fontWeight: 700,
            color: ignition === 'off' ? '#ffd700' : '#00d26a',
            textShadow: ignition === 'off' ? '0 0 8px rgba(255,215,0,0.6)' : '0 0 10px rgba(0,210,106,0.9)',
            whiteSpace: 'nowrap',
          }}>{ignLabel}</span>
        </div>

        {/* START button */}
        <div style={{
          position: 'absolute', bottom: '4%', right: '16%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 5, zIndex: 5,
        }}>
          <button type="button" onClick={pressStart}
            style={{
              all: 'unset', cursor: 'pointer',
              width: 42, height: 42, borderRadius: 10,
              background: `radial-gradient(circle at 35% 35%, ${isRunning ? '#7dffb0' : '#ffeb55'} 0%, ${startColor} 80%)`,
              border: `2px solid ${startBorder}`,
              boxShadow: isRunning || isIgnArmed
                ? `${startGlow}, inset 0 3px 6px rgba(255,255,255,0.4)`
                : 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.5), 0 3px 8px rgba(0,0,0,0.6)',
              display: 'grid', placeItems: 'center',
              fontSize: 16,
              color: isRunning ? '#003a1c' : '#3a2a00',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              animation: isIgnArmed && !isRunning ? 'ignPulse 1.4s ease-in-out infinite' : 'none',
            }}
          >{isRunning ? '●' : '▶'}</button>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 7, letterSpacing: '0.25em',
            fontWeight: 700,
            color: isRunning ? '#00d26a' : isIgnArmed ? '#ffd700' : '#b38600',
            textShadow: isRunning
              ? '0 0 10px rgba(0,210,106,0.9)'
              : isIgnArmed
              ? '0 0 10px rgba(255,215,0,0.8)'
              : 'none',
            whiteSpace: 'nowrap',
          }}>{startLabel}</span>
        </div>

        {/* Screws */}
        {[
          { top: '10%', left: '12%' },
          { top: '10%', right: '12%' },
          { bottom: '10%', left: '12%' },
          { bottom: '10%', right: '12%' },
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', ...pos,
            width: 8, height: 8, borderRadius: '50%',
            background: 'radial-gradient(circle, #4a4a55 0%, #1a1a22 80%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 1px rgba(0,0,0,0.8)',
            pointerEvents: 'none', zIndex: 5,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================ */
/* ==================== MAIN COMPONENT ========================= */
/* ============================================================ */

export default function FanDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState('team');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [error, setError] = useState('');
  const [badgeOpen, setBadgeOpen] = useState(false);

  const [transition, setTransition] = useState({
    active: false, phase: 'in', type: 'team',
  });

  const { setCursorColor, resetCursorColor } = useCursor();

  const themeColor = useMemo(() => {
    if (step === 'driver' && selectedTeam) return selectedTeam.color || '#e10600';
    if (step === 'done' && profile?.favoriteTeamColor) return profile.favoriteTeamColor;
    return '#e10600';
  }, [step, selectedTeam, profile]);

  const avatarUrl = useMemo(() => {
    if (step === 'done') {
      const url = profile?.favoriteDriverActionPhotoUrl || profile?.favoriteDriverPhotoUrl;
      if (url) return imgSrc(url);
    }
    if (selectedDriver) {
      return imgSrc(selectedDriver.actionPhotoUrl || selectedDriver.photoUrl);
    }
    return null;
  }, [step, selectedDriver, profile]);

  useEffect(() => {
    if (themeColor) setCursorColor(themeColor);
    return () => resetCursorColor();
  }, [themeColor, setCursorColor, resetCursorColor]);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, t, d] = await Promise.all([
          api.get('/fan/me'),
          api.get('/teams'),
          api.get('/drivers'),
        ]);
        setProfile(p.data);
        setTeams(t.data);
        setDrivers(d.data);
        if (p.data.favoriteTeamId || p.data.favoriteDriverId) setStep('done');
      } catch (err) {
        console.error(err);
        setError('Impossible de charger ton profil');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectTeam = (team) => {
    setSelectedTeam(team);
    setSelectedDriver(null);
    setTransition({ active: true, phase: 'in', type: 'team' });
    setTimeout(() => {
      setStep('driver');
      setTransition({ active: true, phase: 'out', type: 'team' });
      window.scrollTo({ top: 0, behavior: 'auto' });
      setTimeout(() => setTransition({ active: false, phase: 'in', type: 'team' }), 800);
    }, 1200);
  };

  const selectDriver = async (driver) => {
    setSelectedDriver(driver);
    setTransition({ active: true, phase: 'in', type: 'driver' });
    try {
      const { data } = await api.put('/fan/favorites', {
        teamId: selectedTeam?.id ?? null,
        driverId: driver.id,
      });
      setProfile(data);
      window.dispatchEvent(new Event('fanFavoritesUpdated'));
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de sauvegarde');
    }
    setTimeout(() => {
      setStep('done');
      setTransition({ active: true, phase: 'out', type: 'driver' });
      window.scrollTo({ top: 0, behavior: 'auto' });
      setTimeout(() => setTransition({ active: false, phase: 'in', type: 'team' }), 900);
    }, 1800);
  };

  const backToTeams = () => {
    setTransition({ active: true, phase: 'in', type: 'team' });
    setTimeout(() => {
      setStep('team');
      setSelectedTeam(null);
      setSelectedDriver(null);
      setTransition({ active: true, phase: 'out', type: 'team' });
      window.scrollTo({ top: 0, behavior: 'auto' });
      setTimeout(() => setTransition({ active: false, phase: 'in', type: 'team' }), 800);
    }, 600);
  };

  const reset = async () => {
    if (!window.confirm('Retirer tes favoris ?')) return;
    try {
      const { data } = await api.delete('/fan/favorites');
      setProfile(data);
      setSelectedTeam(null);
      setSelectedDriver(null);
      setStep('team');
    } catch { setError('Erreur'); }
  };

  const startEdit = () => {
    const t = teams.find(x => x.id === profile.favoriteTeamId) || null;
    const d = drivers.find(x => x.id === profile.favoriteDriverId) || null;
    setSelectedTeam(t);
    setSelectedDriver(d);
    setStep('team');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  const teamDrivers = useMemo(() => {
    if (!selectedTeam) return [];
    return drivers.filter(d => {
      if (d.teamId == null) return false;
      return Number(d.teamId) === Number(selectedTeam.id);
    });
  }, [drivers, selectedTeam]);

  if (loading) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <div className="mono" style={{ color: 'var(--f1-red)', letterSpacing: '0.3em' }}>
        CHARGEMENT...
      </div>
    </div>
  );

  if (!profile) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-dim)' }}>Erreur de chargement</h2>
      <Link to="/" style={{ color: 'var(--f1-red)' }}>← Retour à l'accueil</Link>
    </div>
  );

  const hasFavorites = profile.favoriteTeamId || profile.favoriteDriverId;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60, position: 'relative' }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes auraBreath { 0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); } }
        @keyframes avatarRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <TransitionOverlay
        active={transition.active}
        type={transition.type}
        phase={transition.phase}
        team={selectedTeam}
        driver={selectedDriver}
      />

      {step !== 'done' && (
        <section style={{
          position: 'relative',
          padding: '60px 32px 40px',
          background: `radial-gradient(ellipse at top, ${themeColor}33 0%, transparent 60%)`,
          overflow: 'hidden',
        }}>
          <div className="container" style={{ position: 'relative', maxWidth: 1400 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 24, fontFamily: 'var(--font-display)',
              fontSize: 10, letterSpacing: '0.3em', fontWeight: 700,
            }}>
              <span style={{ color: step === 'team' ? themeColor : 'var(--text-dim)' }}>ÉTAPE 01 · ÉCURIE</span>
              <span style={{ color: 'var(--border)' }}>→</span>
              <span style={{ color: step === 'driver' ? themeColor : 'var(--text-dim)', opacity: step === 'team' ? 0.4 : 1 }}>ÉTAPE 02 · PILOTE</span>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 40,
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 10,
                  letterSpacing: '0.4em', color: themeColor,
                  fontWeight: 700, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ width: 40, height: 2, background: themeColor }} />
                  ESPACE FAN
                </div>
                <h1 style={{
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  fontWeight: 900, lineHeight: 0.95,
                  letterSpacing: '-0.03em', marginBottom: 12,
                  color: '#fff', textTransform: 'uppercase',
                }}>
                  {step === 'team' && <>Choisis ton <span style={{ color: themeColor, fontStyle: 'italic' }}>écurie</span></>}
                  {step === 'driver' && <>Choisis ton <span style={{ color: themeColor, fontStyle: 'italic' }}>pilote</span></>}
                </h1>
                <p style={{
                  color: 'var(--text-dim)', fontSize: 15,
                  fontFamily: 'var(--font-heading)',
                }}>
                  Salut <span style={{ color: themeColor, fontWeight: 700 }}>{profile.username}</span>
                  {' — '}
                  {step === 'team' ? 'Sélectionne ta scuderia préférée' : 'Sa photo deviendra ton avatar'}
                </p>
              </div>

              {hasFavorites && (
                <button className="secondary" onClick={() => setStep('done')}
                  style={{ padding: '10px 20px', fontSize: 12 }}>
                  ← Retour à mon espace
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {step === 'team' && (
        <section className="container" style={{ maxWidth: 1400, padding: '20px 32px 80px' }}>
          <div className="grid-3" style={{ gap: 24 }}>
            {teams.map((t, idx) => (
              <TeamCard key={t.id} team={t} onSelect={selectTeam} index={idx} />
            ))}
          </div>
        </section>
      )}

      {step === 'driver' && selectedTeam && (
        <section className="container" style={{
          maxWidth: 1400, padding: '20px 32px 80px',
          animation: 'fadeSlideUp 0.6s ease',
        }}>
          <div style={{
            position: 'relative', padding: '24px 32px',
            background: `linear-gradient(135deg, ${themeColor}22 0%, transparent 100%)`,
            border: `1.5px solid ${themeColor}66`,
            borderLeftWidth: 5, borderLeftColor: themeColor,
            borderRadius: 10, marginBottom: 40,
            display: 'flex', alignItems: 'center',
            gap: 20, flexWrap: 'wrap',
          }}>
            {selectedTeam.logoUrl && (
              <img src={imgSrc(selectedTeam.logoUrl)} alt={selectedTeam.name}
                style={{
                  height: 64, width: 'auto',
                  background: '#fff', padding: 8, borderRadius: 10,
                  boxShadow: `0 0 25px ${themeColor}88`,
                }} />
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 9, letterSpacing: '0.3em',
                color: themeColor, fontWeight: 700, marginBottom: 4,
              }}>◆ ÉCURIE SÉLECTIONNÉE</div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 26, fontWeight: 900,
                textTransform: 'uppercase', color: '#fff',
              }}>{selectedTeam.name}</div>
            </div>
            <button onClick={backToTeams} className="secondary"
              style={{ padding: '12px 24px', fontSize: 12 }}>
              ⟲ Changer d'écurie
            </button>
          </div>

          {teamDrivers.length === 0 ? (
            <div style={{
              padding: 80, textAlign: 'center',
              background: `linear-gradient(160deg, ${themeColor}11 0%, #0b0b12 100%)`,
              border: `1.5px dashed ${themeColor}44`,
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.5 }}>🏎️</div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20, fontWeight: 700,
                color: 'var(--text-dim)', marginBottom: 8,
              }}>Aucun pilote pour cette écurie</div>
            </div>
          ) : (
            <>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11, letterSpacing: '0.3em',
                color: themeColor, fontWeight: 700, marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{
                  width: 12, height: 12,
                  background: themeColor,
                  transform: 'rotate(45deg)',
                  boxShadow: `0 0 15px ${themeColor}`,
                }} />
                {teamDrivers.length} PILOTE{teamDrivers.length > 1 ? 'S' : ''} DISPONIBLE{teamDrivers.length > 1 ? 'S' : ''}
              </div>

              <div className="grid-3" style={{ gap: 28 }}>
                {teamDrivers.map((d, idx) => (
                  <DriverCard key={d.id} driver={d}
                    selected={selectedDriver}
                    onSelect={selectDriver}
                    teamColor={themeColor}
                    index={idx} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {step === 'done' && hasFavorites && (
        <section className="container" style={{ maxWidth: 1200, padding: '60px 32px' }}>
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center',
            marginBottom: 40, animation: 'fadeSlideUp 0.6s ease',
          }}>
            <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 24 }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 240, height: 240,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${themeColor}77 0%, transparent 70%)`,
                filter: 'blur(30px)',
                animation: 'auraBreath 3s ease-in-out infinite',
              }} />

              <div style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                border: `2px dashed ${themeColor}88`, opacity: 0.55,
                animation: 'avatarRing 14s linear infinite',
              }} />

              <div style={{
                position: 'relative', width: '100%', height: '100%',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${themeColor}44, #0a0a0a)`,
                border: `3px solid ${themeColor}`,
                overflow: 'hidden',
                display: 'grid', placeItems: 'center',
                boxShadow: `0 0 50px ${themeColor}88, 0 0 100px ${themeColor}44`,
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar"
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', objectPosition: 'center 2%',
                      filter: 'contrast(1.08) saturate(1.15)',
                    }}
                    onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 54, fontWeight: 900, color: themeColor,
                  }}>{profile.username?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>

              {profile.favoriteDriverNumber != null && (
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  minWidth: 42, height: 42, padding: '0 12px',
                  borderRadius: 21,
                  background: '#0a0a0a',
                  border: `3px solid ${themeColor}`,
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: 16, fontWeight: 900, fontStyle: 'italic',
                  display: 'grid', placeItems: 'center',
                  boxShadow: `0 0 25px ${themeColor}88`,
                }}>{profile.favoriteDriverNumber}</div>
              )}
            </div>

            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10, letterSpacing: '0.4em',
              color: themeColor, fontWeight: 700,
              marginBottom: 14,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 12,
            }}>
              <span style={{ width: 30, height: 2, background: themeColor }} />
              TON ESPACE PERSONNALISÉ
              <span style={{ width: 30, height: 2, background: themeColor }} />
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 6vw, 60px)',
              fontWeight: 900, lineHeight: 1,
              letterSpacing: '-0.03em', marginBottom: 10,
              color: '#fff', textTransform: 'uppercase',
            }}>
              Bienvenue,{' '}
              <span style={{
                color: themeColor, fontStyle: 'italic',
                textShadow: `0 0 40px ${themeColor}88`,
              }}>{profile.username}</span>
            </h1>

            <p style={{
              color: 'var(--text-mid)', fontSize: 15,
              fontFamily: 'var(--font-heading)',
              maxWidth: 520, lineHeight: 1.6,
            }}>Allume l'ignition pour démarrer ton volant.</p>
          </div>

          {/* F1 WHEEL */}
          <F1Wheel
            themeColor={themeColor}
            username={profile.username}
            teamName={profile.favoriteTeamName}
            onGames={() => navigate('/fan/games')}
            onBadge={() => setBadgeOpen(true)}
            onEdit={startEdit}
            onReset={reset}
            onLogout={logout}
            onMyDriver={() => navigate('/fan/my-driver')}
          />

          {/* 2 CARDS : Écurie + Pilote */}
          <div className="grid-2" style={{ gap: 24, marginTop: 40 }}>
            <div style={{
              position: 'relative', padding: 32,
              background: `linear-gradient(160deg, ${themeColor}22 0%, #0b0b12 60%)`,
              border: `1.5px solid ${themeColor}66`,
              borderRadius: 12, overflow: 'hidden',
              display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
            }}>
              {profile.favoriteTeamLogoUrl && (
                <img src={imgSrc(profile.favoriteTeamLogoUrl)} alt={profile.favoriteTeamName}
                  style={{
                    height: 90, width: 'auto',
                    background: '#fff', padding: 10, borderRadius: 10,
                    boxShadow: `0 0 25px ${themeColor}88`,
                  }} />
              )}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 9, letterSpacing: '0.3em',
                  color: themeColor, fontWeight: 700,
                  marginBottom: 8,
                }}>◆ ÉCURIE FAVORITE</div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 26, fontWeight: 900,
                  textTransform: 'uppercase',
                  lineHeight: 1, color: '#fff', marginBottom: 8,
                }}>{profile.favoriteTeamName}</div>
                <Link to={`/teams/${profile.favoriteTeamId}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--font-heading)', fontWeight: 700,
                    fontSize: 11, letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: themeColor, textDecoration: 'none',
                    borderBottom: `1px solid ${themeColor}`,
                    paddingBottom: 2,
                  }}>Voir la page →</Link>
              </div>
            </div>

            <div style={{
              position: 'relative', padding: 32,
              background: `linear-gradient(160deg, ${themeColor}22 0%, #0b0b12 60%)`,
              border: `1.5px solid ${themeColor}66`,
              borderRadius: 12, overflow: 'hidden',
              display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
            }}>
              {(profile.favoriteDriverActionPhotoUrl ||
                profile.favoriteDriverTransitionPhotoUrl ||
                profile.favoriteDriverPhotoUrl) && (
                <div style={{
                  width: 90, height: 120,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, borderRadius: 8, overflow: 'hidden',
                }}>
                  <img
                    src={imgSrc(
                      profile.favoriteDriverActionPhotoUrl ||
                      profile.favoriteDriverTransitionPhotoUrl ||
                      profile.favoriteDriverPhotoUrl
                    )}
                    alt={profile.favoriteDriverLastName}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', objectPosition: 'center 2%',
                      filter: `drop-shadow(0 0 15px ${themeColor}88)`,
                    }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 9, letterSpacing: '0.3em',
                  color: themeColor, fontWeight: 700,
                  marginBottom: 8,
                }}>◆ PILOTE FAVORI</div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13, color: 'var(--text-dim)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase', marginBottom: 2,
                }}>{profile.favoriteDriverFirstName}</div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 32, fontWeight: 900,
                  textTransform: 'uppercase',
                  lineHeight: 1, color: '#fff', marginBottom: 10,
                }}>{profile.favoriteDriverLastName}</div>
                <Link to={`/drivers/${profile.favoriteDriverId}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--font-heading)', fontWeight: 700,
                    fontSize: 11, letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: themeColor, textDecoration: 'none',
                    borderBottom: `1px solid ${themeColor}`,
                    paddingBottom: 2,
                  }}>Voir la page →</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {badgeOpen && (
        <FanBadge profile={profile} onClose={() => setBadgeOpen(false)} />
      )}

      {error && (
        <div className="container" style={{ padding: '20px 32px' }}>
          <p className="error">{error}</p>
        </div>
      )}
    </div>
  );
}