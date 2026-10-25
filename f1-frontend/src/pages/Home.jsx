import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import HomeNewsSection from '../components/HomeNewsSection';

/* ============================================================ */
/* ============ CONSTANTES ==================================== */
/* ============================================================ */
const ACCENT = '#e10600';
const SURFACE = '#0b0b12';
const BORDER = 'rgba(255,255,255,0.08)';

/* ============================================================ */
/* ============ CHATBOT FAB (bouton custom Home) ============== */
/* ============================================================ */
function ChatbotFab({ accent = '#e10600' }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const open = () => {
    console.log('[Home ChatbotFab] 🚀 dispatch f1apex:open-chatbot');
    window.dispatchEvent(new CustomEvent('f1apex:open-chatbot'));
  };

  return (
    <button
      type="button"
      aria-label="Ouvrir l'assistant Box"
      onClick={open}
      onMouseEnter={() => { setHovered(true); setExpanded(true); }}
      onMouseLeave={() => { setHovered(false); setExpanded(false); }}
      style={{
        all: 'unset',
        position: 'fixed',
        bottom: 28,
        right: 28,
        height: 62,
        padding: expanded ? '0 26px 0 8px' : '0 8px',
        minWidth: 62,
        background: 'linear-gradient(135deg, #0a0d12 0%, #04060a 100%)',
        border: `1.5px solid ${hovered ? accent : 'rgba(225,6,0,0.5)'}`,
        borderRadius: 999,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 8500,
        boxShadow: hovered
          ? `0 20px 50px -15px ${accent}cc, 0 0 60px ${accent}66, inset 0 0 20px ${accent}22`
          : `0 10px 30px -10px rgba(0,0,0,0.9), 0 0 30px ${accent}44`,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
      }}
    >
      <span style={{
        position: 'absolute',
        inset: -4,
        borderRadius: 999,
        background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)`,
        filter: 'blur(12px)',
        opacity: hovered ? 1 : 0.6,
        animation: 'fabHalo 2.4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      <span style={{
        position: 'absolute',
        top: 0, bottom: 0,
        left: '-100%',
        width: '60%',
        background: `linear-gradient(90deg, transparent, ${accent}44, transparent)`,
        animation: hovered ? 'fabShine 1.4s ease-in-out infinite' : 'none',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }} />

      <span style={{
        position: 'relative',
        width: 46,
        height: 46,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${accent} 0%, #3a0505 100%)`,
        border: '1.5px solid rgba(255,255,255,0.25)',
        boxShadow: `0 0 20px ${accent}aa, inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.6)`,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        transition: 'transform 0.4s',
        transform: hovered ? 'rotate(-8deg) scale(1.05)' : 'rotate(0) scale(1)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
          <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-7l-4 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <circle cx="8" cy="10.5" r="1.3" fill="#3a0505" />
          <circle cx="12" cy="10.5" r="1.3" fill="#3a0505" />
          <circle cx="16" cy="10.5" r="1.3" fill="#3a0505" />
        </svg>

        <span style={{
          position: 'absolute',
          top: -1, right: -1,
          width: 10, height: 10,
          borderRadius: '50%',
          background: '#00d26a',
          border: '2px solid #0a0a0f',
          boxShadow: '0 0 10px #00d26a',
          animation: 'fabLed 1.4s ease-in-out infinite',
        }} />
      </span>

      <span style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 1,
        maxWidth: expanded ? 160 : 0,
        opacity: expanded ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s',
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          letterSpacing: '0.3em',
          color: accent,
          fontWeight: 900,
          textShadow: `0 0 10px ${accent}88`,
        }}>
          ◆ BOX
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.02em',
        }}>
          Assistant F1
        </span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 7,
          letterSpacing: '0.25em',
          color: 'rgba(0,212,255,0.7)',
          fontWeight: 700,
          marginTop: 1,
        }}>
          ● EN LIGNE
        </span>
      </span>

      <style>{`
        @keyframes fabHalo {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
        @keyframes fabShine {
          0%   { left: -100%; opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes fabLed {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>
    </button>
  );
}

/* ============================================================ */
/* ============ HOOKS ========================================= */
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

function Reveal({ children, delay = 0, direction = 'up', style = {} }) {
  const [ref, visible] = useScrollReveal();
  const transforms = {
    up: 'translateY(40px)',
    left: 'translateX(-40px)',
    right: 'translateX(40px)',
    scale: 'scale(0.96)',
  };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : transforms[direction],
      transition: `opacity 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

/* ============================================================ */
/* ============ START LIGHTS ================================== */
/* ============================================================ */
function StartLights({ active }) {
  const [litCount, setLitCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setLitCount(count);
      if (count >= 5) clearInterval(interval);
    }, 300);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: '50%',
          background: i < litCount ? '#ff2020' : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: i < litCount
            ? '0 0 15px #ff2020, 0 0 30px rgba(255,32,32,0.6)'
            : 'none',
          transition: 'all 0.2s ease',
        }} />
      ))}
    </div>
  );
}

/* ============================================================ */
/* ============ PIT WALL ROW ================================== */
/* ============================================================ */
function PitWallRow({ to, position, title, subtitle, isFirst }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '100px 1fr auto',
        alignItems: 'center',
        gap: 28,
        padding: '28px 32px',
        textDecoration: 'none',
        color: '#fff',
        background: hovered ? 'rgba(225,6,0,0.05)' : 'transparent',
        borderLeft: `3px solid ${hovered ? ACCENT : 'transparent'}`,
        borderTop: isFirst ? 'none' : `1px solid ${BORDER}`,
        transition: 'background 0.25s, border-color 0.25s',
        overflow: 'hidden',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 44, fontWeight: 900, fontStyle: 'italic',
        color: hovered ? ACCENT : 'rgba(255,255,255,0.22)',
        lineHeight: 1, letterSpacing: '-0.02em',
        transition: 'color 0.25s',
      }}>
        {String(position).padStart(2, '0')}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 26, fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          lineHeight: 1.1, color: '#fff',
          marginBottom: 8,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 14, fontWeight: 500,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{subtitle}</div>
        )}
      </div>

      <div style={{
        padding: '8px 14px',
        border: `1px solid ${hovered ? ACCENT : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 4,
        fontFamily: 'var(--font-display)',
        fontSize: 11, fontWeight: 900,
        letterSpacing: '0.1em', color: '#fff',
        transition: 'border-color 0.25s, transform 0.25s',
        whiteSpace: 'nowrap',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
      }}>{t('home.pitWall.access')}</div>

      {hovered && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: 40, background: ACCENT, opacity: 0.18,
          animation: 'pitSweep 0.8s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}
    </Link>
  );
}

/* ============================================================ */
/* ============ MAIN COMPONENT ================================ */
/* ============================================================ */
export default function Home() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    drivers: 0, teams: 0, races: 0, circuits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lightsActive, setLightsActive] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/drivers'),
      api.get('/teams'),
      api.get('/races'),
      api.get('/circuits'),
    ]).then(([d, t2, r, c]) => {
      setStats({
        drivers: d.data.length,
        teams: t2.data.length,
        races: r.data.length,
        circuits: c.data.length,
      });
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => setLightsActive(true), 300);
  }, [loading]);

  const menuItems = [
    { to: '/drivers',  position: '01', title: t('home.menuItems.drivers'),  subtitle: t('home.menuItems.driversSub')  },
    { to: '/teams',    position: '02', title: t('home.menuItems.teams'),    subtitle: t('home.menuItems.teamsSub')    },
    { to: '/races',    position: '03', title: t('home.menuItems.races'),    subtitle: t('home.menuItems.racesSub')    },
    { to: '/circuits', position: '04', title: t('home.menuItems.circuits'), subtitle: t('home.menuItems.circuitsSub') },
    { to: '/cinema',   position: '05', title: t('home.menuItems.cinema'),   subtitle: t('home.menuItems.cinemaSub')   },
  ];

  const statsCards = [
    { labelKey: 'home.stats.drivers', unitKey: 'home.stats.driversUnit', value: stats.drivers,  to: '/drivers',  isAccent: true  },
    { labelKey: 'home.stats.teams',   unitKey: 'home.stats.teamsUnit',   value: stats.teams,    to: '/teams',    isAccent: false },
    { labelKey: 'home.stats.races',   unitKey: 'home.stats.racesUnit',   value: stats.races,    to: '/races',    isAccent: false },
    { labelKey: 'home.menuItems.circuits', unitKey: 'home.stats.resultsUnit', value: stats.circuits, to: '/circuits', isAccent: false },
  ];

  return (
    <div>
      <style>{`
        @keyframes speedLine {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes pitSweep {
          0%   { left: 0%;   opacity: 0; }
          20%  { opacity: 0.3; }
          80%  { opacity: 0.3; }
          100% { left: 100%;  opacity: 0; }
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.7fr);
          gap: 80px;
          align-items: end;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* HERO */}
      <section style={{
        position: 'relative',
        padding: '100px 32px 60px',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${15 + i * 14}%`,
              left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${i % 2 ? 'rgba(225,6,0,0.3)' : 'rgba(255,255,255,0.1)'}, transparent)`,
              animation: `speedLine ${3 + i * 0.4}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
            }} />
          ))}
        </div>

        <div className="container" style={{ position: 'relative', maxWidth: 1400 }}>
          <div className="fade-up hero-grid">
            <div>
              <h1 style={{
                marginBottom: 28,
                textWrap: 'balance',
                fontWeight: 900,
                letterSpacing: '-0.03em',
              }}>
                {t('home.hero.title1')}<br />
                <span style={{ color: ACCENT }}>{t('home.hero.title2')}</span>
              </h1>

              <p style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.55)',
                maxWidth: '55ch',
                lineHeight: 1.65,
                margin: 0,
                fontFamily: 'var(--font-heading)',
              }}>{t('home.hero.subtitle')}</p>
            </div>

            <aside style={{
              paddingLeft: 32,
              borderLeft: `2px solid ${ACCENT}`,
              paddingBottom: 4,
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                letterSpacing: '0.08em',
                color: ACCENT,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}>{t('home.seasonBanner.label')}</div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 15,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.55)',
              }}>{t('home.seasonBanner.subtitle')}</div>
            </aside>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container" style={{ marginTop: 20, padding: '0 32px', maxWidth: 1400 }}>
        <div className="stats-grid">
          {statsCards.map((c, idx) => (
            <Link
              key={c.labelKey}
              to={c.to}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div
                className="fade-up"
                style={{
                  animationDelay: `${idx * 0.08}s`,
                  cursor: 'pointer',
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: 32,
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.25s, transform 0.25s',
                  height: '100%',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = c.isAccent ? ACCENT : 'rgba(255,255,255,0.22)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: c.isAccent ? ACCENT : 'rgba(255,255,255,0.5)',
                }}>{t(c.labelKey)}</div>

                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 64,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: c.isAccent ? ACCENT : '#fff',
                    letterSpacing: '-0.02em',
                  }}>{loading ? '—' : c.value}</div>
                  <div style={{
                    marginTop: 10,
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: 'var(--font-heading)',
                  }}>{t(c.unitKey)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* NEWS */}
      <HomeNewsSection accentColor={ACCENT} />

      {/* PIT WALL TOWER */}
      <section className="container" style={{ maxWidth: 1100, padding: '60px 32px 40px' }}>
        <Reveal direction="up">
          <div style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            background: SURFACE,
            border: `1px solid ${BORDER}`,
          }}>
            <div style={{ height: 3, background: ACCENT }} />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 32px',
              background: 'transparent',
              borderBottom: `1px solid ${BORDER}`,
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <StartLights active={lightsActive} />
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  color: ACCENT,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textTransform: 'uppercase',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#00d26a',
                    boxShadow: '0 0 8px #00d26a',
                    animation: 'pulseGlow 1.5s infinite',
                  }} />
                  {t('home.pitWall.live')}
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
              }}>{t('home.pitWall.session')}</div>
            </div>

            <div style={{ position: 'relative' }}>
              {menuItems.map((item, idx) => (
                <PitWallRow key={item.to} {...item} isFirst={idx === 0} />
              ))}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 32px',
              background: 'transparent',
              borderTop: `1px solid ${BORDER}`,
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
            }}>
              <span>◆ {t('home.pitWall.brand')}</span>

              <div style={{ display: 'flex', gap: 6 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: i < 3 ? '#00d26a' : 'rgba(255,255,255,0.15)',
                    boxShadow: i < 3 ? '0 0 6px #00d26a' : 'none',
                  }} />
                ))}
              </div>

              <span>{t('home.pitWall.subtitle')}</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SEASON BANNER */}
      <section className="container" style={{ marginTop: 40, padding: '0 32px', maxWidth: 1400 }}>
        <Reveal direction="up">
          <div style={{
            position: 'relative',
            padding: 80,
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
          }}>
            <div style={{ maxWidth: 720 }}>
              <h2 style={{
                marginBottom: 20,
                textWrap: 'balance',
                fontWeight: 900,
                letterSpacing: '-0.02em',
              }}>
                {t('home.seasonBanner.title')}
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: 17,
                lineHeight: 1.7,
                margin: 0,
                fontFamily: 'var(--font-heading)',
                maxWidth: '55ch',
              }}>
                {t('home.seasonBanner.subtitle')}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <div style={{ height: 100 }} />

      {/* ✅ CHATBOT FAB CUSTOM (Home uniquement) */}
      <ChatbotFab accent={ACCENT} />
    </div>
  );
}