import { useEffect, useState, useRef } from 'react';
import api, { uploadFile, API_BASE } from '../../api/axios';

const empty = {
  externalId: '',
  firstName: '', lastName: '', number: '', nationality: '', countryCode: '',
  birthYear: '', birthCity: '', latitude: '', longitude: '',
  debutYear: '',
  transitionPhotoUrl: '', actionPhotoUrl: '', aboutPhotoUrl: '',
  biography: '', gallery: '', quote: '', quoteAuthor: '',
  favoriteTrack: '', favoriteTrackImage: '', favoriteTrackDescription: '',
  helmetImage: '', signatureImage: '', teamId: '',
  gpEntered: '', careerPoints: '', highestFinish: '', podiums: '',
  highestGrid: '', polePositions: '', worldChampionships: '', dnfs: ''
};

const COUNTRIES = [
  { code: 'FR', name: 'France' }, { code: 'MC', name: 'Monaco' },
  { code: 'GB', name: 'Royaume-Uni' }, { code: 'NL', name: 'Pays-Bas' },
  { code: 'DE', name: 'Allemagne' }, { code: 'IT', name: 'Italie' },
  { code: 'ES', name: 'Espagne' }, { code: 'MX', name: 'Mexique' },
  { code: 'BR', name: 'Brésil' }, { code: 'AU', name: 'Australie' },
  { code: 'JP', name: 'Japon' }, { code: 'CA', name: 'Canada' },
  { code: 'FI', name: 'Finlande' }, { code: 'TH', name: 'Thaïlande' },
  { code: 'CN', name: 'Chine' }, { code: 'US', name: 'États-Unis' },
  { code: 'NZ', name: 'Nouvelle-Zélande' }, { code: 'DK', name: 'Danemark' },
  { code: 'SE', name: 'Suède' }, { code: 'BE', name: 'Belgique' },
  { code: 'AT', name: 'Autriche' }, { code: 'AR', name: 'Argentine' },
  { code: 'PL', name: 'Pologne' }, { code: 'CH', name: 'Suisse' },
];

/* ============================================================ */
/* ============ SYNC OVERLAY ================================== */
/* ============================================================ */

function SyncOverlay({ syncing, report, onClose, driverNames }) {
  const [progress, setProgress] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dots, setDots] = useState('');
  const [glitching, setGlitching] = useState(false);
  const [flash, setFlash] = useState(false);
  const [particles, setParticles] = useState([]);
  const rafRef = useRef(null);
  const t0Ref = useRef(0);

  useEffect(() => {
    if (!syncing) return;
    t0Ref.current = performance.now();
    const tick = (t) => {
      const elapsed = (t - t0Ref.current) / 1000;
      const p = Math.min(92, (1 - Math.exp(-elapsed / 12)) * 100);
      setProgress(p);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const dotTick = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 300);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(dotTick);
    };
  }, [syncing]);

  useEffect(() => {
    if (!syncing || driverNames.length === 0) return;
    const cycle = setInterval(() => {
      setGlitching(true);
      setFlash(true);
      const newParticles = Array.from({ length: 24 }).map((_, i) => ({
        id: Date.now() + i,
        angle: (i / 24) * 360,
        distance: 80 + Math.random() * 200,
        size: 2 + Math.random() * 4,
        color: i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#e10600' : '#00d4ff',
        delay: Math.random() * 0.15,
      }));
      setParticles(newParticles);
      setTimeout(() => {
        setCurrentIdx((i) => (i + 1) % Math.max(1, driverNames.length));
      }, 120);
      setTimeout(() => setGlitching(false), 320);
      setTimeout(() => setFlash(false), 180);
      setTimeout(() => setParticles([]), 900);
    }, 1400);
    return () => clearInterval(cycle);
  }, [syncing, driverNames.length]);

  useEffect(() => {
    if (report) setProgress(100);
  }, [report]);

  if (!syncing && !report) return null;

  const currentName = driverNames[currentIdx] || 'CHARGEMENT';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(3,3,8,0.98)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      display: 'grid', placeItems: 'center',
      padding: 20, overflow: 'hidden',
    }}>
      <style>{`
        @keyframes syncSpeedLine {
          0%   { transform: translateX(-100%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes syncLogoPulse {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 40px #e10600); }
          50%      { transform: scale(1.08); filter: drop-shadow(0 0 80px #e10600) drop-shadow(0 0 120px rgba(225,6,0,0.6)); }
        }
        @keyframes syncRingSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes syncDataScroll {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes syncFlash {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.9; }
        }
        @keyframes syncReportPop {
          0%   { opacity: 0; transform: scale(0.85); filter: blur(10px); }
          60%  { opacity: 1; transform: scale(1.03); filter: blur(0); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes gridScroll {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
        }
        @keyframes glitchJolt {
          0%   { transform: translate(0,0) skewX(0deg); }
          15%  { transform: translate(-8px, 3px) skewX(-4deg); }
          30%  { transform: translate(6px, -2px) skewX(3deg); }
          45%  { transform: translate(-4px, -3px) skewX(-2deg); }
          60%  { transform: translate(5px, 2px) skewX(2deg); }
          80%  { transform: translate(-2px, 1px) skewX(-1deg); }
          100% { transform: translate(0,0) skewX(0deg); }
        }
        @keyframes rgbSplit {
          0%   { text-shadow: 0 0 20px rgba(225,6,0,0.8); }
          25%  { text-shadow: -4px 0 #ff0044, 4px 0 #00ffff, 0 0 30px rgba(225,6,0,0.9); }
          50%  { text-shadow: 3px 0 #00d4ff, -3px 0 #e10600, 0 0 30px rgba(225,6,0,0.9); }
          75%  { text-shadow: 0 0 20px rgba(225,6,0,0.8); }
          100% { text-shadow: 0 0 20px rgba(225,6,0,0.8); }
        }
        @keyframes particleBurst {
          0%   { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.2); }
        }
        @keyframes scanSweep {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes cardSlide {
          0%   { opacity: 0; transform: translateX(30px) scale(0.95); filter: blur(8px); }
          60%  { opacity: 1; transform: translateX(-4px) scale(1.02); filter: blur(0); }
          100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
        }
        @keyframes ledSweep {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        @keyframes hexFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
          50%      { transform: translateY(-8px) rotate(180deg); opacity: 0.4; }
        }
      `}</style>

      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(225,6,0,0.08) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(225,6,0,0.08) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        animation: 'gridScroll 15s linear infinite',
        pointerEvents: 'none',
      }} />

      {[...Array(8)].map((_, i) => (
        <div key={`hex-${i}`} style={{
          position: 'absolute',
          left: `${10 + i * 12}%`,
          top: `${20 + (i % 3) * 25}%`,
          width: 40, height: 40,
          background: 'linear-gradient(135deg, #e10600, #7a0300)',
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          animation: `hexFloat ${3 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${i * 5}%`,
            left: 0, right: 0,
            height: i % 3 === 0 ? 2 : 1,
            background: `linear-gradient(90deg, transparent, ${
              i % 2 ? '#e10600' : 'rgba(255,255,255,0.4)'
            }, transparent)`,
            animation: `syncSpeedLine ${0.8 + (i % 5) * 0.2}s linear infinite`,
            animationDelay: `${i * 0.05}s`,
          }} />
        ))}
      </div>

      {flash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle, #fff 0%, #e10600 40%, transparent 70%)',
          animation: 'syncFlash 0.18s ease-out',
          pointerEvents: 'none',
          zIndex: 50,
          mixBlendMode: 'screen',
        }} />
      )}

      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, right: 20,
        width: 60, overflow: 'hidden',
        opacity: 0.2, pointerEvents: 'none',
        fontFamily: 'var(--font-display)',
        fontSize: 11, lineHeight: 1.4,
        color: '#00d4ff',
      }}>
        <div style={{ animation: 'syncDataScroll 8s linear infinite' }}>
          {[...Array(80)].map((_, i) => (
            <div key={i} style={{ opacity: 0.3 + (i % 4) * 0.2 }}>
              {String(Math.floor(Math.random() * 9999)).padStart(4, '0')}
            </div>
          ))}
          {[...Array(80)].map((_, i) => (
            <div key={`b${i}`} style={{ opacity: 0.3 + (i % 4) * 0.2 }}>
              {String(Math.floor(Math.random() * 9999)).padStart(4, '0')}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, left: 20,
        width: 60, overflow: 'hidden',
        opacity: 0.15, pointerEvents: 'none',
        fontFamily: 'var(--font-display)',
        fontSize: 11, lineHeight: 1.4,
        color: '#e10600',
      }}>
        <div style={{ animation: 'syncDataScroll 10s linear infinite reverse' }}>
          {[...Array(80)].map((_, i) => (
            <div key={i} style={{ opacity: 0.3 + (i % 4) * 0.2 }}>
              {String(Math.floor(Math.random() * 9999)).padStart(4, '0')}
            </div>
          ))}
          {[...Array(80)].map((_, i) => (
            <div key={`b${i}`} style={{ opacity: 0.3 + (i % 4) * 0.2 }}>
              {String(Math.floor(Math.random() * 9999)).padStart(4, '0')}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'relative',
        maxWidth: 780,
        width: '100%',
        zIndex: 10,
      }}>
        {syncing && !report && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 26,
            padding: '40px 30px',
          }}>
            <div style={{ position: 'relative', width: 160, height: 160 }}>
              <div style={{
                position: 'absolute', inset: -20,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(225,6,0,0.5) 0%, transparent 70%)',
                filter: 'blur(30px)',
                animation: 'syncFlash 1.5s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '2px dashed rgba(225,6,0,0.6)',
                animation: 'syncRingSpin 4s linear infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 15,
                borderRadius: '50%',
                border: '1px solid rgba(225,6,0,0.3)',
                animation: 'syncRingSpin 7s linear infinite reverse',
              }} />
              <img
                src="/Logo.png"
                alt="F1 Apex"
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  height: 90, width: 'auto',
                  animation: 'syncLogoPulse 1.4s ease-in-out infinite',
                }}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11, letterSpacing: '0.5em',
                color: '#e10600', fontWeight: 700,
                textShadow: '0 0 20px rgba(225,6,0,0.8)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}>
                <span style={{ width: 30, height: 1, background: '#e10600' }} />
                ◆ COLLECTE DATA ◆
                <span style={{ width: 30, height: 1, background: '#e10600' }} />
              </div>

              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 26, fontWeight: 900,
                textTransform: 'uppercase',
                color: '#fff',
                textShadow: '0 0 40px rgba(225,6,0,0.6)',
                letterSpacing: '0.05em',
              }}>
                Scan en cours{dots}
              </div>
            </div>

            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: 560,
              minHeight: 120,
              display: 'grid',
              placeItems: 'center',
            }}>
              {particles.map((p) => {
                const rad = (p.angle * Math.PI) / 180;
                return (
                  <div
                    key={p.id}
                    style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      width: p.size, height: p.size,
                      borderRadius: '50%',
                      background: p.color,
                      boxShadow: `0 0 10px ${p.color}, 0 0 20px ${p.color}88`,
                      '--dx': `${Math.cos(rad) * p.distance}px`,
                      '--dy': `${Math.sin(rad) * p.distance}px`,
                      animation: `particleBurst 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${p.delay}s both`,
                      pointerEvents: 'none',
                      zIndex: 20,
                    }}
                  />
                );
              })}

              <div
                key={currentIdx}
                style={{
                  position: 'relative',
                  width: '100%',
                  padding: '24px 36px',
                  background: `linear-gradient(135deg, rgba(225,6,0,0.15) 0%, rgba(0,0,0,0.7) 100%)`,
                  border: '2px solid rgba(225,6,0,0.6)',
                  borderRadius: 12,
                  boxShadow: '0 0 40px rgba(225,6,0,0.4), inset 0 0 40px rgba(225,6,0,0.1)',
                  animation: glitching
                    ? 'glitchJolt 0.35s ease-in-out'
                    : 'cardSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  overflow: 'hidden',
                  clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  height: 40,
                  background: `linear-gradient(180deg, transparent 0%, rgba(225,6,0,0.4) 50%, transparent 100%)`,
                  animation: 'scanSweep 2s ease-in-out infinite',
                  pointerEvents: 'none',
                  mixBlendMode: 'screen',
                }} />

                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                }}>
                  <div style={{
                    width: 52, height: 52,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #e10600, #7a0300)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 22,
                    color: '#fff',
                    boxShadow: '0 0 20px rgba(225,6,0,0.8)',
                    flexShrink: 0,
                  }}>
                    🏎️
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 9,
                      letterSpacing: '0.35em',
                      color: 'rgba(255,255,255,0.5)',
                      fontWeight: 700,
                      marginBottom: 6,
                    }}>
                      ◆ SCAN {String(currentIdx + 1).padStart(2, '0')} / {String(driverNames.length).padStart(2, '0')}
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 26,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#fff',
                        animation: glitching ? 'rgbSplit 0.35s ease-in-out' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentName}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 8,
                    }}>
                      <span style={{
                        width: 6, height: 6,
                        borderRadius: '50%',
                        background: '#00d26a',
                        boxShadow: '0 0 8px #00d26a',
                        animation: 'ledSweep 0.8s ease-in-out infinite',
                      }} />
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 8,
                        letterSpacing: '0.3em',
                        color: '#00d26a',
                        fontWeight: 700,
                      }}>
                        {glitching ? 'SYNCING DATA' : 'CONNECTED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {[...Array(24)].map((_, i) => {
                const active = (i / 24) * 100 <= progress;
                const color = i < 7 ? '#00d26a' : i < 14 ? '#ffd700' : i < 20 ? '#ff8700' : '#e10600';
                return (
                  <div key={i} style={{
                    width: 7, height: 7,
                    borderRadius: '50%',
                    background: active ? color : 'rgba(255,255,255,0.08)',
                    boxShadow: active ? `0 0 8px ${color}` : 'none',
                  }} />
                );
              })}
            </div>

            <div style={{ width: '100%', maxWidth: 560 }}>
              <div style={{
                position: 'relative',
                height: 6,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, bottom: 0,
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #7a0300, #e10600, #ff1e00)',
                  boxShadow: '0 0 20px #e10600',
                }} />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'var(--text-dim)',
              }}>
                <span>COLLECTE DES STATS</span>
                <span style={{ color: '#e10600', fontWeight: 900, fontSize: 13 }}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {report && (
          <div style={{
            animation: 'syncReportPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            background: 'linear-gradient(160deg, rgba(20,20,28,0.95) 0%, rgba(10,10,15,0.95) 100%)',
            border: '2px solid rgba(0,210,106,0.4)',
            borderRadius: 16,
            padding: 32,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: 'linear-gradient(90deg, transparent, #00d26a, transparent)',
              boxShadow: '0 0 20px #00d26a',
            }} />

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🏁</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11, letterSpacing: '0.4em',
                color: '#00d26a', fontWeight: 700,
                marginBottom: 8,
              }}>◆ SYNCHRONISATION TERMINÉE ◆</div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 26, fontWeight: 900,
                textTransform: 'uppercase',
                color: '#fff',
              }}>Data à jour</div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}>
              {[
                { label: 'MIS À JOUR', value: report.updatedCount || 0, color: '#00d26a', icon: '✅' },
                { label: 'IGNORÉS',   value: report.skipped?.length || 0, color: '#ff8700', icon: '⚠️' },
                { label: 'ÉCHECS',    value: report.failed?.length || 0, color: '#ff5555', icon: '❌' },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: '20px 12px',
                  background: `linear-gradient(160deg, ${s.color}22 0%, transparent 100%)`,
                  border: `1px solid ${s.color}55`,
                  borderRadius: 10,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 40,
                    fontWeight: 900,
                    color: s.color,
                    lineHeight: 1,
                    textShadow: `0 0 20px ${s.color}88`,
                  }}>{s.value}</div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 9,
                    letterSpacing: '0.25em',
                    color: 'var(--text-dim)',
                    marginTop: 6,
                    fontWeight: 700,
                  }}>{s.label}</div>
                </div>
              ))}
            </div>

            {report.updated?.length > 0 && (
              <details style={{ marginBottom: 10 }} open={report.updated.length <= 8}>
                <summary style={{
                  cursor: 'pointer', color: '#00d26a',
                  fontSize: 13, fontWeight: 700,
                  fontFamily: 'var(--font-heading)', padding: '8px 0',
                }}>
                  ✅ Mis à jour — {report.updated.length} pilote{report.updated.length > 1 ? 's' : ''}
                </summary>
                <div style={{
                  marginTop: 10, padding: 12,
                  background: 'rgba(0,210,106,0.06)',
                  borderRadius: 6, fontSize: 12,
                  color: 'var(--text-mid)',
                  fontFamily: 'var(--font-heading)',
                  maxHeight: 140, overflowY: 'auto',
                }}>{report.updated.join(' · ')}</div>
              </details>
            )}

            {report.failed?.length > 0 && (
              <details style={{ marginBottom: 10 }}>
                <summary style={{
                  cursor: 'pointer', color: '#ff5555',
                  fontSize: 13, fontWeight: 700,
                  fontFamily: 'var(--font-heading)', padding: '8px 0',
                }}>
                  ❌ Échecs — {report.failed.length}
                </summary>
                <div style={{
                  marginTop: 10, padding: 12,
                  background: 'rgba(255,85,85,0.06)',
                  borderRadius: 6, fontSize: 12,
                  color: 'var(--text-mid)',
                  fontFamily: 'var(--font-heading)',
                  maxHeight: 140, overflowY: 'auto',
                }}>{report.failed.join(' · ')}</div>
              </details>
            )}

            <button
              onClick={onClose}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #00d26a 0%, #00a050 100%)',
                border: 'none', borderRadius: 8, color: '#fff',
                fontFamily: 'var(--font-heading)',
                fontSize: 13, fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,210,106,0.4)',
                clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
              }}
            >
              ◆ Fermer ◆
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ COMPOSANT PRINCIPAL ========================== */
/* ============================================================ */

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [syncReport, setSyncReport] = useState(null);
  const [driverNames, setDriverNames] = useState([]);

  const load = async () => {
    const [d, t] = await Promise.all([api.get('/drivers'), api.get('/teams')]);
    setDrivers(d.data);
    setTeams(t.data);
  };

  useEffect(() => { load(); }, []);

  const n = v => {
    if (v === '' || v === null || v === undefined) return null;
    const num = Number(v);
    return isNaN(num) ? null : num;
  };

  const refreshStats = async () => {
    setDriverNames(drivers.map(d => `${d.firstName} ${d.lastName}`.toUpperCase()));
    setSyncingId(null);
    setSyncing(true);
    setSyncReport(null);
    try {
      const { data } = await api.post('/admin/drivers/refresh-stats');
      setTimeout(() => { setSyncReport(data); load(); }, 400);
    } catch (err) {
      setSyncReport({
        updatedCount: 0, updated: [], skipped: [],
        failed: [err.response?.data?.message || err.message],
      });
    } finally {
      setSyncing(false);
    }
  };

  const refreshOne = async (driver) => {
    setDriverNames([`${driver.firstName} ${driver.lastName}`.toUpperCase()]);
    setSyncingId(driver.id);
    setSyncing(true);
    setSyncReport(null);
    try {
      const { data } = await api.post(`/admin/drivers/${driver.id}/refresh-stats`);
      setTimeout(() => {
        setSyncReport({
          updatedCount: data.success ? 1 : 0,
          updated: data.updated || [],
          skipped: [],
          failed: data.failed || [],
        });
        load();
      }, 400);
    } catch (err) {
      setSyncReport({
        updatedCount: 0, updated: [], skipped: [],
        failed: [err.response?.data?.message || err.message],
      });
    } finally {
      setSyncing(false);
      setSyncingId(null);
    }
  };

  const closeSync = () => {
    setSyncReport(null);
    setSyncing(false);
    setSyncingId(null);
  };

  const uploadHandler = (field) => async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadFile(file);
      setForm(f => ({ ...f, [field]: data.url }));
    } catch (err) {
      alert('Erreur upload : ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleTransitionUpload = uploadHandler('transitionPhotoUrl');
  const handleActionUpload = uploadHandler('actionPhotoUrl');
  const handleAboutUpload = uploadHandler('aboutPhotoUrl');
  const handleFavoriteTrackUpload = uploadHandler('favoriteTrackImage');
  const handleHelmetUpload = uploadHandler('helmetImage');
  const handleSignatureUpload = uploadHandler('signatureImage');

  const handleGalleryUpload = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      let urls = [];
      try { urls = JSON.parse(form.gallery || '[]'); } catch { urls = []; }
      if (!Array.isArray(urls)) urls = [];
      for (const file of files) {
        const data = await uploadFile(file);
        urls.push(data.url);
      }
      setForm(f => ({ ...f, gallery: JSON.stringify(urls) }));
    } catch (err) {
      alert('Erreur upload : ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeGalleryImage = idx => {
    let urls = [];
    try { urls = JSON.parse(form.gallery || '[]'); } catch { urls = []; }
    if (!Array.isArray(urls)) urls = [];
    urls = urls.filter((_, i) => i !== idx);
    setForm({ ...form, gallery: JSON.stringify(urls) });
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    const payload = {
      externalId: form.externalId,
      firstName: form.firstName,
      lastName: form.lastName,
      number: n(form.number),
      nationality: form.nationality,
      countryCode: form.countryCode,
      birthYear: n(form.birthYear),
      birthCity: form.birthCity,
      latitude: n(form.latitude),
      longitude: n(form.longitude),
      debutYear: n(form.debutYear),
      transitionPhotoUrl: form.transitionPhotoUrl,
      actionPhotoUrl: form.actionPhotoUrl,
      aboutPhotoUrl: form.aboutPhotoUrl,
      biography: form.biography,
      gallery: form.gallery,
      quote: form.quote,
      quoteAuthor: form.quoteAuthor,
      favoriteTrack: form.favoriteTrack,
      favoriteTrackImage: form.favoriteTrackImage,
      favoriteTrackDescription: form.favoriteTrackDescription,
      helmetImage: form.helmetImage,
      signatureImage: form.signatureImage,
      teamId: n(form.teamId),
      gpEntered: n(form.gpEntered),
      careerPoints: n(form.careerPoints),
      highestFinish: form.highestFinish,
      podiums: n(form.podiums),
      highestGrid: form.highestGrid,
      polePositions: n(form.polePositions),
      worldChampionships: n(form.worldChampionships),
      dnfs: n(form.dnfs)
    };
    try {
      if (editId) await api.put(`/drivers/${editId}`, payload);
      else await api.post('/drivers', payload);
      setForm(empty);
      setEditId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const edit = d => {
    setEditId(d.id);
    setForm({
      externalId: d.externalId || '',
      firstName: d.firstName || '',
      lastName: d.lastName || '',
      number: d.number ?? '',
      nationality: d.nationality || '',
      countryCode: d.countryCode || '',
      birthYear: d.birthYear ?? '',
      birthCity: d.birthCity || '',
      latitude: d.latitude ?? '',
      longitude: d.longitude ?? '',
      debutYear: d.debutYear ?? '',
      transitionPhotoUrl: d.transitionPhotoUrl || '',
      actionPhotoUrl: d.actionPhotoUrl || '',
      aboutPhotoUrl: d.aboutPhotoUrl || '',
      biography: d.biography || '',
      gallery: d.gallery || '',
      quote: d.quote || '',
      quoteAuthor: d.quoteAuthor || '',
      favoriteTrack: d.favoriteTrack || '',
      favoriteTrackImage: d.favoriteTrackImage || '',
      favoriteTrackDescription: d.favoriteTrackDescription || '',
      helmetImage: d.helmetImage || '',
      signatureImage: d.signatureImage || '',
      teamId: d.teamId != null ? String(d.teamId) : '',
      gpEntered: d.gpEntered ?? '',
      careerPoints: d.careerPoints ?? '',
      highestFinish: d.highestFinish || '',
      podiums: d.podiums ?? '',
      highestGrid: d.highestGrid || '',
      polePositions: d.polePositions ?? '',
      worldChampionships: d.worldChampionships ?? '',
      dnfs: d.dnfs ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async id => {
    if (!window.confirm('Supprimer ce pilote ?')) return;
    await api.delete(`/drivers/${id}`);
    load();
  };

  const photoSrc = url => !url ? null
    : url.startsWith('http') ? url : API_BASE + url;

  let galleryUrls = [];
  try { galleryUrls = JSON.parse(form.gallery || '[]'); } catch { galleryUrls = []; }
  if (!Array.isArray(galleryUrls)) galleryUrls = [];

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmerRed {
          0%   { transform: translateX(-100%); opacity: 0; }
          50%  { transform: translateX(100%); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes rowSyncGlow {
          0%, 100% { background: rgba(0,210,106,0.08); }
          50%      { background: rgba(0,210,106,0.18); }
        }
      `}</style>

      <SyncOverlay
        syncing={syncing}
        report={syncReport}
        onClose={closeSync}
        driverNames={driverNames}
      />

      <div className="fade-up" style={{
        marginBottom: 32,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 11,
            letterSpacing: '0.3em', color: 'var(--f1-red)', marginBottom: 8,
          }}>■ GESTION</div>
          <h1 style={{ fontSize: 40 }}>Pilotes</h1>
        </div>

        <button
          type="button"
          onClick={refreshStats}
          disabled={syncing}
          style={{
            position: 'relative',
            padding: '16px 32px',
            background: syncing
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #00d26a 0%, #00a050 100%)',
            border: syncing ? '1px solid var(--border)' : '2px solid #00d26a',
            color: syncing ? 'var(--text-dim)' : '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 12, fontWeight: 900,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            cursor: syncing ? 'wait' : 'pointer',
            borderRadius: 8,
            boxShadow: syncing ? 'none' : '0 4px 20px rgba(0,210,106,0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
            overflow: 'hidden',
          }}
        >
          {!syncing && (
            <span style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              transform: 'translateX(-100%)',
              animation: 'shimmerRed 3s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          )}

          {syncing ? (
            <>
              <span style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#00d26a',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              SYNCHRONISATION...
            </>
          ) : (
            <>◆ SYNCHRONISER TOUS LES PILOTES ◆</>
          )}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 20, fontSize: 18 }}>
          {editId ? `Modifier le pilote #${editId}` : 'Ajouter un pilote'}
        </h3>

        <form onSubmit={submit}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--f1-red)', marginBottom: 12 }}>
            IDENTITÉ
          </div>
          <div className="grid-2">
            <div><label>Prénom *</label>
              <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div><label>Nom *</label>
              <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></div>
            <div><label>Numéro</label>
              <input type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} /></div>
            <div><label>Pays (drapeau)</label>
              <select value={form.countryCode} onChange={e => {
                const c = COUNTRIES.find(x => x.code === e.target.value);
                setForm({ ...form, countryCode: e.target.value, nationality: c ? c.name : form.nationality });
              }}>
                <option value="">— Choisir —</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select></div>
            <div><label>Nationalité (texte)</label>
              <input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} /></div>
            <div><label>Année de naissance</label>
              <input type="number" value={form.birthYear} onChange={e => setForm({ ...form, birthYear: e.target.value })} placeholder="1997" /></div>
            <div><label>Ville de naissance</label>
              <input value={form.birthCity} onChange={e => setForm({ ...form, birthCity: e.target.value })} placeholder="Hasselt" /></div>
            <div><label>Latitude</label>
              <input type="number" step="0.0001" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="50.9307" /></div>
            <div><label>Longitude</label>
              <input type="number" step="0.0001" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="5.3378" /></div>
            <div><label>Année d'entrée en F1</label>
              <input type="number" value={form.debutYear} onChange={e => setForm({ ...form, debutYear: e.target.value })} placeholder="2015" /></div>
            <div>
              <label>Écurie</label>
              <select value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })}>
                <option value="">— Aucune —</option>
                {teams.map(t => (
                  <option key={t.id} value={String(t.id)}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>🆔 ID interne (sync)</label>
              <input
                value={form.externalId || ''}
                onChange={e => setForm({ ...form, externalId: e.target.value })}
                placeholder="hamilton, max-verstappen, leclerc…"
              />
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--f1-red)', margin: '28px 0 12px' }}>
            STATISTIQUES DE CARRIÈRE
          </div>
          <div className="grid-4">
            <div><label>GP disputés</label>
              <input type="number" value={form.gpEntered} onChange={e => setForm({ ...form, gpEntered: e.target.value })} placeholder="200" /></div>
            <div><label>Points carrière</label>
              <input type="number" step="0.5" value={form.careerPoints} onChange={e => setForm({ ...form, careerPoints: e.target.value })} placeholder="2500" /></div>
            <div><label>Meilleure position course</label>
              <input value={form.highestFinish} onChange={e => setForm({ ...form, highestFinish: e.target.value })} placeholder="1 (x254)" /></div>
            <div><label>Podiums</label>
              <input type="number" value={form.podiums} onChange={e => setForm({ ...form, podiums: e.target.value })} placeholder="100" /></div>
            <div><label>Meilleure position qualif</label>
              <input value={form.highestGrid} onChange={e => setForm({ ...form, highestGrid: e.target.value })} placeholder="1 (x100)" /></div>
            <div><label>Pole positions</label>
              <input type="number" value={form.polePositions} onChange={e => setForm({ ...form, polePositions: e.target.value })} placeholder="40" /></div>
            <div><label>Championnats du monde</label>
              <input type="number" value={form.worldChampionships} onChange={e => setForm({ ...form, worldChampionships: e.target.value })} placeholder="3" /></div>
            <div><label>Abandons (DNF)</label>
              <input type="number" value={form.dnfs} onChange={e => setForm({ ...form, dnfs: e.target.value })} placeholder="20" /></div>
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--f1-red)', margin: '28px 0 12px' }}>
            PHOTOS
          </div>

          <div className="grid-2" style={{ gap: 24 }}>
            <div>
              <label>🏎️ Photo d'action (photo principale)</label>
              <div style={{
                padding: 16, background: 'rgba(20,20,26,0.6)',
                border: `2px dashed ${form.actionPhotoUrl ? 'var(--f1-red)' : 'var(--border)'}`,
                borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {form.actionPhotoUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img src={photoSrc(form.actionPhotoUrl)} alt="Action"
                      style={{ height: 120, width: 200, objectFit: 'cover', objectPosition: 'center 25%', borderRadius: 6, border: '2px solid var(--f1-red)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>✅ Photo d'action</div>
                      <button type="button" className="danger" onClick={() => setForm({ ...form, actionPhotoUrl: '' })} style={{ padding: '6px 12px', fontSize: 11 }}>✖ Retirer</button>
                    </div>
                  </div>
                ) : <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', padding: '20px 0' }}>Aucune photo d'action</div>}
                <label style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 16px', background: uploading ? '#333' : 'var(--f1-red)',
                  color: '#fff', borderRadius: 6, cursor: uploading ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 0,
                }}>
                  📁 {uploading ? 'Envoi...' : (form.actionPhotoUrl ? 'Changer' : "Choisir une action")}
                  <input type="file" accept="image/*" onChange={handleActionUpload} disabled={uploading} style={{ display: 'none' }} />
                </label>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, fontStyle: 'italic' }}>
                💡 Photo en piste — photo principale du pilote
              </p>
            </div>

            <div>
              <label>🎬 Photo TRANSITION (PNG transparent)</label>
              <div style={{
                padding: 16, background: 'rgba(20,20,26,0.6)',
                border: `2px dashed ${form.transitionPhotoUrl ? 'var(--f1-red)' : 'var(--border)'}`,
                borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {form.transitionPhotoUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img src={photoSrc(form.transitionPhotoUrl)} alt="Transition"
                      style={{
                        height: 180, width: 'auto', objectFit: 'contain',
                        borderRadius: 6, border: '2px solid var(--f1-red)',
                        background: 'rgba(255,255,255,0.05)',
                      }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>✅ Photo transition</div>
                      <button type="button" className="danger" onClick={() => setForm({ ...form, transitionPhotoUrl: '' })} style={{ padding: '6px 12px', fontSize: 11 }}>✖ Retirer</button>
                    </div>
                  </div>
                ) : <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', padding: '20px 0' }}>Aucune photo transition</div>}
                <label style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 16px', background: uploading ? '#333' : 'var(--f1-red)',
                  color: '#fff', borderRadius: 6, cursor: uploading ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 0,
                }}>
                  📁 {uploading ? 'Envoi...' : (form.transitionPhotoUrl ? 'Changer' : 'Choisir un PNG')}
                  <input type="file" accept="image/*" onChange={handleTransitionUpload} disabled={uploading} style={{ display: 'none' }} />
                </label>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, fontStyle: 'italic' }}>
                💡 PNG fond transparent — utilisée pour les transitions
              </p>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <label>📖 Photo "ALL ABOUT"</label>
            <div style={{
              padding: 16, background: 'rgba(20,20,26,0.6)',
              border: `2px dashed ${form.aboutPhotoUrl ? 'var(--f1-red)' : 'var(--border)'}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              {form.aboutPhotoUrl ? (
                <>
                  <img src={photoSrc(form.aboutPhotoUrl)} alt="About"
                    style={{ height: 100, width: 160, objectFit: 'cover', objectPosition: 'center 25%', borderRadius: 6, border: '2px solid var(--f1-red)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>✅ Photo ALL ABOUT</div>
                    <button type="button" className="danger" onClick={() => setForm({ ...form, aboutPhotoUrl: '' })} style={{ padding: '6px 12px', fontSize: 11 }}>✖ Retirer</button>
                  </div>
                </>
              ) : <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', flex: 1 }}>Aucune photo ALL ABOUT</div>}
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', background: uploading ? '#333' : 'var(--f1-red)',
                color: '#fff', borderRadius: 6, cursor: uploading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 0,
              }}>
                📁 {uploading ? 'Envoi...' : (form.aboutPhotoUrl ? 'Changer' : 'Choisir une photo')}
                <input type="file" accept="image/*" onChange={handleAboutUpload} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <label>📸 Galerie</label>
            <div style={{
              padding: 16, background: 'rgba(20,20,26,0.6)',
              border: '2px dashed var(--border)', borderRadius: 8,
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
            }}>
              {galleryUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={photoSrc(url)} alt={`gallery-${i}`}
                    style={{ height: 80, width: 120, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--f1-red)' }} />
                  <button type="button" onClick={() => removeGalleryImage(i)}
                    style={{
                      position: 'absolute', top: -8, right: -8,
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#e10600', color: '#fff',
                      border: '2px solid #fff', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700,
                      display: 'grid', placeItems: 'center', padding: 0, lineHeight: 1,
                    }}>×</button>
                </div>
              ))}
              <label style={{
                width: 120, height: 80,
                display: 'grid', placeItems: 'center',
                background: 'rgba(225,6,0,0.15)',
                border: '2px dashed var(--f1-red)',
                borderRadius: 6, cursor: uploading ? 'wait' : 'pointer',
                color: 'var(--f1-red)',
                fontFamily: 'var(--font-display)',
                fontSize: 24, fontWeight: 700,
              }}>
                {uploading ? '...' : '+'}
                <input type="file" accept="image/*" multiple disabled={uploading} onChange={handleGalleryUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <label>Biographie (sépare les paragraphes avec une ligne vide)</label>
            <textarea value={form.biography} onChange={e => setForm({ ...form, biography: e.target.value })}
              rows={10}
              placeholder={"Premier paragraphe...\n\nDeuxième paragraphe..."}
              style={{
                width: '100%', background: 'rgba(20,20,26,0.8)', color: 'var(--f1-white)',
                border: '1px solid var(--border)', padding: 12, borderRadius: 4,
                fontFamily: 'var(--font-body)', fontSize: 15, resize: 'vertical',
              }} />
          </div>

          <div style={{ marginTop: 24 }}>
            <label>Citation du pilote</label>
            <textarea value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })}
              rows={3}
              placeholder="Je ne cherche pas à être aimé, je cherche à être respecté."
              style={{
                width: '100%', background: 'rgba(20,20,26,0.8)', color: 'var(--f1-white)',
                border: '1px solid var(--border)', padding: 12, borderRadius: 4,
                fontFamily: 'var(--font-body)', fontSize: 15, resize: 'vertical',
              }} />
          </div>

          <div style={{ marginTop: 16 }}>
            <label>Auteur de la citation</label>
            <input value={form.quoteAuthor} onChange={e => setForm({ ...form, quoteAuthor: e.target.value })} placeholder="Ayrton Senna" />
          </div>

          <div style={{ marginTop: 24 }}>
            <label>🏁 Circuit préféré du pilote</label>
            <input value={form.favoriteTrack} onChange={e => setForm({ ...form, favoriteTrack: e.target.value })} placeholder="Circuit de Monaco" />
          </div>

          <div style={{ marginTop: 16 }}>
            <label>Image du circuit préféré</label>
            <div style={{
              padding: 16, background: 'rgba(20,20,26,0.6)',
              border: `2px dashed ${form.favoriteTrackImage ? 'var(--f1-red)' : 'var(--border)'}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              {form.favoriteTrackImage ? (
                <>
                  <img src={photoSrc(form.favoriteTrackImage)} alt="Favorite track"
                    style={{ height: 100, width: 180, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--f1-red)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>✅ Image uploadée</div>
                    <button type="button" className="danger" onClick={() => setForm({ ...form, favoriteTrackImage: '' })} style={{ padding: '6px 12px', fontSize: 11 }}>✖ Retirer</button>
                  </div>
                </>
              ) : <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', flex: 1 }}>Aucune image</div>}
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', background: uploading ? '#333' : 'var(--f1-red)',
                color: '#fff', borderRadius: 6, cursor: uploading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 0,
              }}>
                📁 {uploading ? 'Envoi...' : (form.favoriteTrackImage ? 'Changer' : 'Choisir une image')}
                <input type="file" accept="image/*" onChange={handleFavoriteTrackUpload} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label>Petit paragraphe sur le circuit préféré</label>
            <textarea value={form.favoriteTrackDescription} onChange={e => setForm({ ...form, favoriteTrackDescription: e.target.value })}
              rows={4}
              placeholder="Monaco — his home circuit..."
              style={{
                width: '100%', background: 'rgba(20,20,26,0.8)', color: 'var(--f1-white)',
                border: '1px solid var(--border)', padding: 12, borderRadius: 4,
                fontFamily: 'var(--font-body)', fontSize: 15, resize: 'vertical',
              }} />
          </div>

          <div style={{ marginTop: 24 }}>
            <label>🪖 Photo du casque</label>
            <div style={{
              padding: 16, background: 'rgba(20,20,26,0.6)',
              border: `2px dashed ${form.helmetImage ? 'var(--f1-red)' : 'var(--border)'}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              {form.helmetImage ? (
                <>
                  <img src={photoSrc(form.helmetImage)} alt="Casque"
                    style={{ height: 100, width: 140, objectFit: 'contain', borderRadius: 6, border: '2px solid var(--f1-red)', background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>✅ Photo du casque</div>
                    <button type="button" className="danger" onClick={() => setForm({ ...form, helmetImage: '' })} style={{ padding: '6px 12px', fontSize: 11 }}>✖ Retirer</button>
                  </div>
                </>
              ) : <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', flex: 1 }}>Aucune photo de casque</div>}
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', background: uploading ? '#333' : 'var(--f1-red)',
                color: '#fff', borderRadius: 6, cursor: uploading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 0,
              }}>
                📁 {uploading ? 'Envoi...' : (form.helmetImage ? 'Changer' : 'Choisir une image')}
                <input type="file" accept="image/*" onChange={handleHelmetUpload} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <label>✍️ Signature du pilote (PNG transparent)</label>
            <div style={{
              padding: 16, background: 'rgba(20,20,26,0.6)',
              border: `2px dashed ${form.signatureImage ? 'var(--f1-red)' : 'var(--border)'}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              {form.signatureImage ? (
                <>
                  <img src={photoSrc(form.signatureImage)} alt="Signature"
                    style={{ height: 80, maxWidth: 240, objectFit: 'contain', padding: 8, borderRadius: 6, border: '2px solid var(--f1-red)', background: 'rgba(255,255,255,0.05)', filter: 'invert(1)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>✅ Signature</div>
                    <button type="button" className="danger" onClick={() => setForm({ ...form, signatureImage: '' })} style={{ padding: '6px 12px', fontSize: 11 }}>✖ Retirer</button>
                  </div>
                </>
              ) : <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', flex: 1 }}>Aucune signature</div>}
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', background: uploading ? '#333' : 'var(--f1-red)',
                color: '#fff', borderRadius: 6, cursor: uploading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 0,
              }}>
                📁 {uploading ? 'Envoi...' : (form.signatureImage ? 'Changer' : 'Choisir une signature')}
                <input type="file" accept="image/*" onChange={handleSignatureUpload} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}

          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button type="submit">{editId ? '💾 Enregistrer' : '➕ Ajouter'}</button>
            {editId && (
              <button type="button" className="secondary" onClick={() => { setEditId(null); setForm(empty); }}>Annuler</button>
            )}
          </div>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>Photo</th>
            <th>ID</th>
            <th>N°</th>
            <th>Pilote</th>
            <th>Ville</th>
            <th>Écurie</th>
            <th>GP</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => {
            const isThisSyncing = syncingId === d.id;
            /* ✅ ACTION en priorité, TRANSITION en fallback */
            const rowPhoto = d.actionPhotoUrl || d.transitionPhotoUrl;
            return (
              <tr
                key={d.id}
                style={{
                  animation: isThisSyncing ? 'rowSyncGlow 1s ease-in-out infinite' : 'none',
                  transition: 'background 0.3s',
                }}
              >
                <td>
                  {rowPhoto ? (
                    <img
                      src={photoSrc(rowPhoto)}
                      alt={d.lastName}
                      style={{
                        height: 48, width: 48,
                        objectFit: 'cover',
                        /* ✅ VISAGE : focus sur le haut de l'image */
                        objectPosition: 'center 8%',
                        borderRadius: '50%',
                        border: `2px solid ${d.teamColor || 'var(--f1-red)'}`,
                      }} />
                  ) : (
                    <div style={{ height: 48, width: 48, borderRadius: '50%', background: '#222', display: 'grid', placeItems: 'center', fontSize: 20, color: '#666' }}>👤</div>
                  )}
                </td>
                <td>
                  {d.externalId
                    ? <code style={{ fontSize: 11, color: '#00d26a', background: 'rgba(0,210,106,0.1)', padding: '2px 6px', borderRadius: 3 }}>{d.externalId}</code>
                    : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>}
                </td>
                <td>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 900, color: d.teamColor || 'var(--f1-red)' }}>
                    {d.number || '—'}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{d.firstName} <strong>{d.lastName}</strong></td>
                <td style={{ color: 'var(--text-mid)', fontSize: 13 }}>
                  {d.birthCity || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                </td>
                <td>
                  {d.teamName ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {d.teamLogoUrl && (
                        <img src={photoSrc(d.teamLogoUrl)} alt={d.teamName}
                          style={{ height: 22, width: 'auto', background: '#fff', padding: 2, borderRadius: 3 }} />
                      )}
                      <span className="color-dot" style={{ background: d.teamColor }} />
                      <span style={{ fontWeight: 600 }}>{d.teamName}</span>
                    </span>
                  ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                </td>
                <td className="mono" style={{ color: 'var(--text-mid)', fontWeight: 700 }}>
                  {d.gpEntered ?? '—'}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    onClick={() => refreshOne(d)}
                    disabled={syncing}
                    style={{
                      padding: '6px 12px', fontSize: 11, marginRight: 6,
                      background: isThisSyncing ? 'rgba(0,210,106,0.35)' : 'rgba(0,210,106,0.15)',
                      border: '1px solid rgba(0,210,106,0.5)',
                      borderRadius: 3, color: '#00d26a',
                      fontFamily: 'var(--font-heading)', fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      cursor: syncing ? 'not-allowed' : 'pointer',
                      opacity: syncing && !isThisSyncing ? 0.35 : 1,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {isThisSyncing ? (
                      <>
                        <span style={{
                          width: 10, height: 10,
                          border: '2px solid rgba(0,210,106,0.3)',
                          borderTopColor: '#00d26a',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                        SYNC
                      </>
                    ) : <>🔄 SYNC</>}
                  </button>
                  <button className="secondary sm" onClick={() => edit(d)}
                    style={{ marginRight: 6, opacity: syncing ? 0.5 : 1 }}
                    disabled={syncing}>✏️ Modifier</button>
                  <button className="danger" onClick={() => remove(d.id)}
                    disabled={syncing}
                    style={{ opacity: syncing ? 0.5 : 1 }}>🗑️</button>
                </td>
              </tr>
            );
          })}
          {drivers.length === 0 && (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>Aucun pilote enregistré</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}