import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { imgSrc, flagSrc } from '../utils/images';
import { useCursor } from '../context/CursorContext';

/* ============================================================ */
/* ============ ANIMATED COUNTER ============================== */
/* ============================================================ */
function useCountUp(target, duration = 1200) {
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
/* ============ MAIN COMPONENT ================================ */
/* ============================================================ */
export default function MyDriver() {
  const navigate = useNavigate();
  const { setCursorColor, resetCursorColor } = useCursor();

  const [profile, setProfile] = useState(null);
  const [driver, setDriver] = useState(null);
  const [standings, setStandings] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const themeColor = driver?.teamColor || profile?.favoriteTeamColor || '#e10600';

  useEffect(() => {
    if (themeColor) setCursorColor(themeColor);
    return () => resetCursorColor();
  }, [themeColor, setCursorColor, resetCursorColor]);

  /* ============================================================ */
  /* ============ LOAD DATA ===================================== */
  /* ============================================================ */
  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, dRes, sRes, rRes] = await Promise.all([
          api.get('/fan/me'),
          api.get('/drivers'),
          api.get('/standings/drivers').catch(() => ({ data: [] })),
          api.get('/races').catch(() => ({ data: [] })),
        ]);

        setProfile(pRes.data);
        setStandings(sRes.data || []);
        setRaces(rRes.data || []);

        if (pRes.data.favoriteDriverId) {
          const favDriver = dRes.data.find(d => String(d.id) === String(pRes.data.favoriteDriverId));
          setDriver(favDriver || null);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ============================================================ */
  /* ============ COMPUTED ====================================== */
  /* ============================================================ */

  const myStanding = useMemo(() => {
    if (!driver) return null;
    return standings.find(s => String(s.localDriverId) === String(driver.id)) || null;
  }, [standings, driver]);

  const nextRace = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return races
      .filter(r => r.raceDate && new Date(r.raceDate) >= today)
      .sort((a, b) => new Date(a.raceDate) - new Date(b.raceDate))[0] || null;
  }, [races]);

  const daysUntilNext = useMemo(() => {
    if (!nextRace?.raceDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const raceDate = new Date(nextRace.raceDate);
    raceDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  }, [nextRace]);

  const animPosition = useCountUp(myStanding?.position, 1200);
  const animPoints = useCountUp(Number(myStanding?.points) || 0, 1200);
  const animWins = useCountUp(Number(myStanding?.wins) || 0, 1200);
  const animPodiums = useCountUp(driver?.podiums, 1400);
  const animPoles = useCountUp(driver?.polePositions, 1500);
  const animTitles = useCountUp(driver?.worldChampionships, 1600);
  const animGP = useCountUp(driver?.gpEntered, 1700);
  const animDNF = useCountUp(driver?.dnfs, 1800);

  /* ============================================================ */
  /* ============ RENDER STATES ================================= */
  /* ============================================================ */

  if (loading) {
    return (
      <div className="container" style={{ padding: 100, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--f1-red)',
          letterSpacing: '0.3em',
        }}>
          CHARGEMENT...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: 100, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>⚠️</div>
        <h2 style={{ color: 'var(--text-dim)', marginBottom: 20 }}>{error}</h2>
        <Link to="/fan" style={{
          padding: '12px 24px', background: themeColor, color: '#fff',
          borderRadius: 6, textDecoration: 'none', fontWeight: 700,
          fontFamily: 'var(--font-heading)', letterSpacing: '0.15em',
          fontSize: 12, textTransform: 'uppercase',
        }}>← Retour à mon espace</Link>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="container" style={{ padding: '80px 32px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontSize: 80, marginBottom: 24, opacity: 0.3 }}>🏎️</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11,
          letterSpacing: '0.4em', color: themeColor,
          fontWeight: 700, marginBottom: 12,
        }}>◆ MON PILOTE</div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 900, textTransform: 'uppercase',
          color: '#fff', marginBottom: 16,
          letterSpacing: '-0.02em',
        }}>
          Pas encore de <span style={{ color: themeColor }}>pilote favori</span>
        </h1>
        <p style={{
          color: 'var(--text-mid)', fontSize: 15,
          fontFamily: 'var(--font-heading)',
          maxWidth: 500, margin: '0 auto 32px',
          lineHeight: 1.6,
        }}>
          Choisis ton pilote favori depuis ton espace fan pour accéder à son suivi personnalisé.
        </p>
        <Link to="/fan" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 28px',
          background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 100%)`,
          color: '#fff', borderRadius: 8,
          textDecoration: 'none',
          fontFamily: 'var(--font-display)',
          fontSize: 12, fontWeight: 900,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          boxShadow: `0 4px 20px ${themeColor}66`,
          clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
        }}>
          ◆ Choisir mon pilote
        </Link>
      </div>
    );
  }

  /* ============================================================ */
  /* ============ RENDER PRINCIPAL ============================== */
  /* ============================================================ */

  const driverPhoto = driver.actionPhotoUrl || driver.transitionPhotoUrl || driver.photoUrl;
  const isAction = !!driver.actionPhotoUrl;
  const isTransition = !isAction && !!driver.transitionPhotoUrl;

  return (
    <div style={{ position: 'relative', paddingBottom: 80 }}>

      <style>{`
        @keyframes myDriverFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes myDriverGlow {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.7; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes countdownPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        @keyframes myDriverFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-6px) scale(1.02); }
        }
      `}</style>

      {/* ============================================================ */}
      {/* ============ HERO ========================================== */}
      {/* ============================================================ */}
      <section style={{
        position: 'relative',
        padding: '60px 32px 40px',
        overflow: 'hidden',
        background: `radial-gradient(ellipse at top, ${themeColor}33 0%, transparent 60%)`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(${themeColor}08 1px, transparent 1px),
            linear-gradient(90deg, ${themeColor}08 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.6,
          pointerEvents: 'none',
          maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)',
        }} />

        <div className="container" style={{ position: 'relative', maxWidth: 1400 }}>

          <Link to="/fan" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'var(--text-dim)', fontSize: 12,
            fontFamily: 'var(--font-display)', fontWeight: 700,
            letterSpacing: '0.25em', textTransform: 'uppercase',
            marginBottom: 32, textDecoration: 'none',
          }}>← Mon espace</Link>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 40,
            alignItems: 'center',
            animation: 'myDriverFadeIn 0.7s ease',
          }} className="my-driver-hero">

            {/* ============================================================ */}
            {/* ✅ PHOTO PILOTE — FIX VISAGE + PNG TRANSPARENT */}
            {/* ============================================================ */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 420, height: 420,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${themeColor}77 0%, transparent 70%)`,
                filter: 'blur(50px)',
                animation: 'myDriverGlow 3s ease-in-out infinite',
                pointerEvents: 'none',
              }} />

              <div style={{
                position: 'relative',
                width: 260, height: 320,
                borderRadius: 16,
                overflow: 'hidden',
                border: `3px solid ${themeColor}`,
                boxShadow: `0 30px 60px -20px ${themeColor}cc, 0 0 50px ${themeColor}44`,
                /* Fond dégradé pour PNG transparents, uni pour actions */
                background: isTransition
                  ? `linear-gradient(180deg, ${themeColor}15 0%, #0a0a0a 100%)`
                  : '#0a0a0a',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {driverPhoto ? (
                  <img
                    src={imgSrc(driverPhoto)}
                    alt={`${driver.firstName} ${driver.lastName}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      /* ACTION → cover (recadre) · TRANSITION → contain (entier visible) */
                      objectFit: isTransition ? 'contain' : 'cover',
                      /* ACTION → focus visage · TRANSITION → centré */
                      objectPosition: isTransition ? 'center' : 'center 1%',
                      display: 'block',
                      /* Padding pour PNG (ne pas toucher les bords) */
                      padding: isTransition ? 10 : 0,
                      boxSizing: 'border-box',
                      /* Glow sur PNG, contraste sur action */
                      filter: isTransition
                        ? `drop-shadow(0 10px 30px ${themeColor}88) drop-shadow(0 0 20px ${themeColor}44)`
                        : 'contrast(1.05) saturate(1.1)',
                      /* Flottement sur PNG */
                      animation: isTransition ? 'myDriverFloat 4s ease-in-out infinite' : 'none',
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 72, fontWeight: 900,
                    color: themeColor, opacity: 0.4,
                  }}>{driver.firstName?.[0]}{driver.lastName?.[0]}</div>
                )}
              </div>

              {driver.number && (
                <div style={{
                  position: 'absolute',
                  bottom: -12, right: -12,
                  minWidth: 52, height: 52,
                  padding: '0 12px',
                  borderRadius: 26,
                  background: '#0a0a0a',
                  border: `3px solid ${themeColor}`,
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: 20, fontWeight: 900, fontStyle: 'italic',
                  display: 'grid', placeItems: 'center',
                  boxShadow: `0 0 25px ${themeColor}aa`,
                  zIndex: 2,
                }}>{driver.number}</div>
              )}
            </div>

            {/* Infos pilote */}
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10, letterSpacing: '0.4em',
                color: themeColor, fontWeight: 700,
                marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 30, height: 2, background: themeColor }} />
                MON PILOTE
              </div>

              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20, fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--text-dim)',
                marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {driver.countryCode && (
                  <img src={flagSrc(driver.countryCode)} alt={driver.countryCode}
                    style={{ height: 22, width: 'auto', borderRadius: 3 }} />
                )}
                {driver.firstName}
              </div>

              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(40px, 6vw, 72px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.04em',
                lineHeight: 0.9,
                color: '#fff',
                margin: 0,
                marginBottom: 20,
                textShadow: `0 0 60px ${themeColor}88, 0 10px 40px rgba(0,0,0,0.9)`,
              }}>
                {driver.lastName}
              </h1>

              {driver.teamName && (
                <Link to={`/teams/${driver.teamId}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  padding: '10px 18px',
                  background: `${themeColor}22`,
                  border: `1.5px solid ${themeColor}88`,
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700, fontSize: 14,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#fff',
                  boxShadow: `0 0 20px ${themeColor}44`,
                }}>
                  {driver.teamLogoUrl && (
                    <img src={imgSrc(driver.teamLogoUrl)} alt={driver.teamName}
                      style={{ height: 24, width: 'auto', objectFit: 'contain' }} />
                  )}
                  {driver.teamName}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============ BIG STATS ROW ================================= */}
      {/* ============================================================ */}
      <section className="container" style={{ maxWidth: 1400, padding: '20px 32px 40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}>
          <BigStat label="POSITION" value={animPosition || '—'}
            sub={myStanding ? 'au championnat' : 'pas encore classé'}
            color={myStanding?.position === 1 ? '#FFD700' : themeColor}
            icon="🏆" delay={0} />
          <BigStat label="POINTS" value={animPoints} sub="cette saison" color="#00d26a" icon="⭐" delay={0.1} />
          <BigStat label="VICTOIRES" value={animWins} sub="cette saison" color="#ffd700" icon="🥇" delay={0.2} />
          <BigStat label="PODIUMS" value={animPodiums} sub="carrière" color="#c084fc" icon="🏅" delay={0.3} />
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============ NEXT RACE + CAREER ============================ */}
      {/* ============================================================ */}
      <section className="container" style={{ maxWidth: 1400, padding: '20px 32px 40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: 24,
        }} className="my-driver-grid">

          <div style={{
            position: 'relative',
            padding: '32px 36px',
            background: `linear-gradient(135deg, ${themeColor}22 0%, #0b0b12 100%)`,
            border: `2px solid ${themeColor}66`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: `0 20px 60px -20px ${themeColor}88`,
          }}>
            <div style={{
              position: 'absolute',
              top: -60, right: -60,
              width: 220, height: 220,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${themeColor}66 0%, transparent 70%)`,
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10, letterSpacing: '0.35em',
                color: themeColor, fontWeight: 700,
                marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 24, height: 2, background: themeColor }} />
                PROCHAIN GP
              </div>

              {nextRace ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {nextRace.circuitCountryCode && (
                      <img src={flagSrc(nextRace.circuitCountryCode)} alt={nextRace.circuitCountryCode}
                        style={{
                          height: 32, width: 'auto', borderRadius: 4,
                          boxShadow: `0 0 15px ${themeColor}66`,
                        }} />
                    )}
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11, letterSpacing: '0.2em',
                      color: 'rgba(255,255,255,0.6)', fontWeight: 700,
                    }}>
                      R{String(nextRace.round).padStart(2, '0')} · {nextRace.season}
                    </div>
                  </div>

                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 28, fontWeight: 900,
                    textTransform: 'uppercase',
                    color: '#fff', lineHeight: 1.05,
                    letterSpacing: '-0.01em',
                    marginBottom: 16,
                    textShadow: `0 0 25px ${themeColor}66`,
                  }}>{nextRace.name}</div>

                  {nextRace.circuitName && (
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 13, color: 'var(--text-mid)',
                      marginBottom: 20,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>🛣️ {nextRace.circuitName}</div>
                  )}

                  {daysUntilNext !== null && (
                    <div style={{
                      display: 'flex', alignItems: 'baseline', gap: 10,
                      padding: '12px 18px',
                      background: 'rgba(0,0,0,0.5)',
                      border: `1px solid ${themeColor}44`,
                      borderRadius: 8,
                      animation: daysUntilNext <= 3 ? 'countdownPulse 2s ease-in-out infinite' : 'none',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 42, fontWeight: 900,
                        color: daysUntilNext === 0 ? '#00d26a' : daysUntilNext <= 3 ? '#ff8700' : themeColor,
                        lineHeight: 1,
                        textShadow: `0 0 20px ${daysUntilNext <= 3 ? '#ff8700' : themeColor}88`,
                        fontVariantNumeric: 'tabular-nums',
                      }}>{daysUntilNext}</span>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 11, letterSpacing: '0.2em',
                          color: '#fff', fontWeight: 900,
                        }}>
                          {daysUntilNext === 0 ? "AUJOURD'HUI" : daysUntilNext === 1 ? 'DEMAIN' : 'JOURS'}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: 11, color: 'var(--text-dim)',
                        }}>
                          {nextRace.raceDate
                            ? new Date(nextRace.raceDate).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'long', year: 'numeric',
                              })
                            : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  <Link to={`/races/${nextRace.id}`} style={{
                    marginTop: 20,
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px',
                    background: themeColor, color: '#fff',
                    borderRadius: 6, textDecoration: 'none',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    boxShadow: `0 4px 16px ${themeColor}66`,
                    clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                  }}>Voir le GP →</Link>
                </>
              ) : (
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16, color: 'var(--text-dim)',
                }}>Aucun GP programmé pour le moment.</div>
              )}
            </div>
          </div>

          <div style={{
            position: 'relative',
            padding: '32px 36px',
            background: 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
            border: `1.5px solid ${themeColor}33`,
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)`,
              boxShadow: `0 0 15px ${themeColor}`,
            }} />

            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10, letterSpacing: '0.35em',
              color: themeColor, fontWeight: 700,
              marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 24, height: 2, background: themeColor }} />
              CARRIÈRE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <CareerRow icon="🏁" label="GP disputés" value={animGP} />
              <CareerRow icon="🎯" label="Pole positions" value={animPoles} />
              <CareerRow icon="👑" label="Championnats" value={animTitles} highlight={animTitles > 0} color="#FFD700" />
              <CareerRow icon="💥" label="Abandons (DNF)" value={animDNF} color="#ff5555" />
              {driver.highestFinish && (
                <CareerRow icon="🥇" label="Meilleure position" value={driver.highestFinish} isText />
              )}
              {driver.debutYear && (
                <CareerRow icon="📅" label="F1 depuis" value={driver.debutYear} isText />
              )}
            </div>

            <Link to={`/drivers/${driver.id}`} style={{
              marginTop: 24,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${themeColor}55`,
              borderRadius: 6, textDecoration: 'none',
              color: themeColor,
              fontFamily: 'var(--font-heading)',
              fontSize: 12, fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>Fiche complète →</Link>
          </div>
        </div>
      </section>

      <section className="container" style={{ maxWidth: 1400, padding: '20px 32px 40px', textAlign: 'center' }}>
        <Link to="/fan" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '12px 24px',
          background: 'transparent',
          border: `1.5px solid ${themeColor}88`,
          borderRadius: 8, textDecoration: 'none',
          color: 'var(--f1-white)',
          fontFamily: 'var(--font-heading)',
          fontSize: 12, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>← Retour à mon espace</Link>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .my-driver-hero {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .my-driver-hero > div:first-child {
            margin: 0 auto;
          }
          .my-driver-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================ */
/* ============ SUB-COMPONENTS ================================ */
/* ============================================================ */

function BigStat({ label, value, sub, color, icon, delay }) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '22px 20px',
        background: 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
        border: `1px solid ${color}33`,
        borderTop: `3px solid ${color}`,
        borderRadius: 10,
        overflow: 'hidden',
        animation: `myDriverFadeIn 0.6s ease ${delay}s both`,
        boxShadow: `0 10px 30px -15px ${color}66`,
      }}
    >
      <div style={{
        position: 'absolute', top: 10, right: 10,
        fontSize: 22, opacity: 0.4,
      }}>{icon}</div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 9, letterSpacing: '0.3em',
        color: 'var(--text-dim)', fontWeight: 700,
        marginBottom: 8,
      }}>{label}</div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 36, fontWeight: 900,
        color, lineHeight: 1,
        textShadow: `0 0 20px ${color}66`,
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 6,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>{value}</div>

      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 11, color: 'var(--text-dim)',
        letterSpacing: '0.05em',
      }}>{sub}</div>
    </div>
  );
}

function CareerRow({ icon, label, value, isText, highlight, color }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 8,
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-mid)',
        }}>{label}</span>
      </div>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: isText ? 13 : 18,
        fontWeight: 900,
        color: color || (highlight ? '#FFD700' : '#fff'),
        textShadow: highlight ? '0 0 12px #FFD70088' : 'none',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>{value ?? '—'}</span>
    </div>
  );
}