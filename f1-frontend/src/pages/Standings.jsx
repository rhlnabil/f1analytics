import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { imgSrc, flagSrc } from '../utils/images';

/* ============================================================ */
/* ============ HOOKS ========================================= */
/* ============================================================ */

function useCountUp(target, duration = 1200, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target == null || isNaN(target)) { setValue(target); return; }
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
  }, [target, duration, start]);
  return value;
}

/* ============================================================ */
/* ============ FLAG WRAPPER ================================== */
/* ============================================================ */

const LOCAL_GIF_FLAGS = new Set([
  'ar', 'at', 'au', 'be', 'bh', 'br', 'ca', 'ch', 'cn', 'de',
  'es', 'fr', 'gb', 'hu', 'it', 'jp', 'mc', 'mx', 'nl', 'nz',
  'th', 'us',
]);

function FlagImage({ code, style, className }) {
  if (!code) return null;
  const lc = code.toLowerCase();
  const isLocalGif = LOCAL_GIF_FLAGS.has(lc);
  const primaryUrl = isLocalGif
    ? `/flags/${lc}.gif`
    : `https://flagcdn.com/w320/${lc}.png`;
  const fallbackUrl = `https://flagcdn.com/w320/${lc}.png`;

  return (
    <img
      src={primaryUrl}
      alt={code}
      className={className}
      style={style}
      onError={e => {
        if (e.target.dataset.fallback !== '1' && primaryUrl !== fallbackUrl) {
          e.target.dataset.fallback = '1';
          e.target.src = fallbackUrl;
        } else {
          e.target.style.display = 'none';
        }
      }}
    />
  );
}

/* ============================================================ */
/* ============ HERO BAR ====================================== */
/* ============================================================ */

function HeroBar({ status }) {
  const { t } = useTranslation();

  const lastUpdate = useMemo(() => {
    if (!status?.lastUpdate || status.lastUpdate === 'never') return '—';
    try {
      const date = new Date(status.lastUpdate);
      const diff = Math.floor((Date.now() - date) / 60000);
      if (diff < 1) return 'il y a quelques secondes';
      if (diff < 60) return `il y a ${diff} min`;
      const hours = Math.floor(diff / 60);
      if (hours < 24) return `il y a ${hours}h`;
      return date.toLocaleDateString();
    } catch { return status.lastUpdate; }
  }, [status]);

  return (
    <section style={{
      position: 'relative',
      padding: '100px 0 40px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(5,7,10,0.98) 100%)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(225,6,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(225,6,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 4,
        background: 'repeating-linear-gradient(180deg, #e10600 0, #e10600 30px, transparent 30px, transparent 60px)',
        opacity: 0.6,
      }} />
      <div style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: 4,
        background: 'repeating-linear-gradient(180deg, #ffffff 0, #ffffff 30px, transparent 30px, transparent 60px)',
        opacity: 0.2,
      }} />

      <div className="container" style={{ position: 'relative', maxWidth: 1400 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 24,
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          letterSpacing: '0.3em',
          color: 'var(--text-dim)',
          fontWeight: 700,
        }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>{t('standings.home')}</Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: '#e10600' }}>{t('standings.standings')}</span>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(225,6,0,0.4), transparent)' }} />
          <span>{t('standings.season')} 2026</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'flex-end',
          gap: 32,
          flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(48px, 7vw, 96px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.04em',
              lineHeight: 0.88,
              margin: 0,
              color: '#fff',
              marginBottom: 16,
            }}>
              {t('standings.championship').toUpperCase()}
              <br />
              <span style={{
                color: 'transparent',
                WebkitTextStroke: '2px #e10600',
                fontStyle: 'italic',
                letterSpacing: '-0.05em',
              }}>{t('standings.standings').toUpperCase()}</span>
            </h1>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 12px',
                background: 'rgba(0,210,106,0.1)',
                border: '1px solid rgba(0,210,106,0.4)',
                borderRadius: 3,
                fontFamily: 'var(--font-display)',
                fontSize: 9,
                letterSpacing: '0.25em',
                color: '#00d26a',
                fontWeight: 700,
              }}>
                <span style={{
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: '#00d26a',
                  boxShadow: '0 0 8px #00d26a',
                  animation: 'liveBlink 2s infinite',
                }} />
                {t('standings.liveFeed')}
              </div>

              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'var(--text-dim)',
                fontWeight: 700,
              }}>
                {t('standings.updated')} · {lastUpdate}
              </div>
            </div>
          </div>

          <div style={{
            textAlign: 'right',
            fontFamily: 'var(--font-display)',
          }}>
            <div style={{
              fontSize: 9,
              letterSpacing: '0.3em',
              color: 'var(--text-dim)',
              fontWeight: 700,
              marginBottom: 6,
            }}>
              {t('standings.season')}
            </div>
            <div style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#e10600',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              textShadow: '0 0 40px rgba(225,6,0,0.5)',
            }}>
              2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ============ KPI STRIP ===================================== */
/* ============================================================ */

function KpiStrip({ drivers, constructors, tab }) {
  const { t } = useTranslation();
  const active = tab === 'drivers' ? drivers : constructors;
  const leader = active[0];
  const second = active[1];

  const leaderPts = Number(leader?.points) || 0;
  const gapToP2 = second ? leaderPts - (Number(second.points) || 0) : 0;
  const totalWins = active.reduce((s, x) => s + (Number(x.wins) || 0), 0);

  const gapAnim = useCountUp(gapToP2, 1400);
  const winsAnim = useCountUp(totalWins, 1400);

  if (!leader) return null;

  const kpis = [
    {
      label: t('standings.leader'),
      value: tab === 'drivers' ? leader.lastName : leader.name,
      sub: tab === 'drivers' ? leader.constructorName : leader.nationality,
      color: leader?.teamColor || '#e10600',
      isText: true,
      flagCode: leader?.driverCountryCode,
    },
    {
      label: t('standings.gapP1P2'),
      value: gapAnim,
      unit: t('standings.points'),
      color: '#00d26a',
      isText: false,
    },
    {
      label: t('standings.totalWins'),
      value: winsAnim,
      unit: tab === 'drivers' ? t('standings.wins') : t('standings.wins'),
      color: '#FFD700',
      isText: false,
    },
    {
      label: t('standings.entries'),
      value: active.length,
      unit: tab === 'drivers' ? t('standings.drivers') : t('standings.constructors'),
      color: '#1e41ff',
      isText: false,
    },
  ];

  return (
    <section className="container" style={{ padding: '32px 0 0', maxWidth: 1400 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 1,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {kpis.map((kpi, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, rgba(13,13,20,0.95) 0%, rgba(5,7,10,0.98) 100%)',
              padding: '20px 24px',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 2,
              background: kpi.color,
              boxShadow: `0 0 12px ${kpi.color}`,
              opacity: 0.85,
            }} />

            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9,
              letterSpacing: '0.3em',
              color: 'var(--text-dim)',
              fontWeight: 700,
              marginBottom: 10,
            }}>
              {kpi.label}
            </div>

            {kpi.isText ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {kpi.flagCode && (
                    <FlagImage
                      code={kpi.flagCode}
                      style={{ height: 20, width: 'auto', borderRadius: 3 }}
                    />
                  )}
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 26,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: '#fff',
                    lineHeight: 1,
                    textShadow: `0 0 20px ${kpi.color}44`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{kpi.value}</div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 9,
                  letterSpacing: '0.15em',
                  color: kpi.color,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}>{kpi.sub || '—'}</div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 38,
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: `0 0 20px ${kpi.color}66`,
                }}>{kpi.value}</span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  color: kpi.color,
                  fontWeight: 700,
                }}>{kpi.unit}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================ */
/* ============ TIMING ROW ==================================== */
/* ============================================================ */

function TimingRow({ entry, leaderPts, maxPts, tab, index }) {
  const { t } = useTranslation();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 80 + index * 35);
    return () => clearTimeout(timer);
  }, [index]);

  const teamColor = entry.teamColor || '#666';
  const points = Number(entry.points) || 0;
  const wins = Number(entry.wins) || 0;
  const gap = leaderPts - points;
  const pct = maxPts > 0 ? (points / maxPts) * 100 : 0;
  const isLeader = entry.position === 1;

  const positionColor =
    entry.position === 1 ? '#FFD700' :
    entry.position === 2 ? '#C0C0C0' :
    entry.position === 3 ? '#CD7F32' :
    'rgba(255,255,255,0.5)';

  const code = tab === 'drivers'
    ? (entry.code || entry.lastName?.slice(0, 3).toUpperCase() || '???')
    : (entry.name?.slice(0, 3).toUpperCase() || '???');

  const displayName = tab === 'drivers' ? entry.lastName : entry.name;
  const secondary = tab === 'drivers' ? entry.constructorName : entry.nationality;
  const photoUrl = tab === 'drivers' ? entry.photoUrl : entry.teamLogoUrl;

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '44px 32px 72px 32px 1fr 130px 90px 90px 60px',
        alignItems: 'center',
        gap: 12,
        padding: '11px 20px 11px 0',
        background: isLeader
          ? 'linear-gradient(90deg, rgba(255,215,0,0.06) 0%, transparent 60%)'
          : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${teamColor}0f`; }}
      onMouseLeave={e => {
        e.currentTarget.style.background = isLeader
          ? 'linear-gradient(90deg, rgba(255,215,0,0.06) 0%, transparent 60%)'
          : 'transparent';
      }}
    >
      <div style={{
        width: 3,
        height: '100%',
        background: teamColor,
        boxShadow: `0 0 10px ${teamColor}88`,
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
      }} />

      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        fontWeight: 900,
        fontStyle: 'italic',
        color: positionColor,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        textShadow: entry.position <= 3 ? `0 0 15px ${positionColor}66` : 'none',
      }}>
        {String(entry.position).padStart(2, '0')}
      </div>

      <div style={{ display: 'grid', placeItems: 'center' }}>
        {tab === 'drivers' && entry.driverCountryCode ? (
          <FlagImage
            code={entry.driverCountryCode}
            style={{ height: 14, width: 'auto', borderRadius: 2 }}
          />
        ) : (
          <span style={{
            fontSize: 10,
            color: 'var(--text-dim)',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
          }}>
            {entry.nationality?.slice(0, 2).toUpperCase() || '—'}
          </span>
        )}
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        fontWeight: 900,
        color: '#fff',
        letterSpacing: '0.05em',
        textAlign: 'center',
        padding: '4px 0',
        background: `${teamColor}22`,
        border: `1px solid ${teamColor}55`,
        borderRadius: 3,
        textShadow: `0 0 10px ${teamColor}66`,
      }}>
        {code}
      </div>

      <div style={{
        width: 28,
        height: 28,
        borderRadius: tab === 'drivers' ? '50%' : 4,
        overflow: 'hidden',
        border: `1.5px solid ${teamColor}66`,
        background: '#0a0a0a',
      }}>
        {photoUrl ? (
          <img
            src={imgSrc(photoUrl)}
            alt=""
            style={{
              width: '100%', height: '100%',
              objectFit: tab === 'drivers' ? 'cover' : 'contain',
              objectPosition: 'center 5%',
              background: tab === 'drivers' ? undefined : '#fff',
              padding: tab === 'drivers' ? 0 : 2,
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'grid', placeItems: 'center',
            fontSize: 8, fontWeight: 900,
            color: teamColor,
            fontFamily: 'var(--font-display)',
          }}>
            {code.slice(0, 2)}
          </div>
        )}
      </div>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 15,
          fontWeight: 900,
          textTransform: 'uppercase',
          color: '#fff',
          letterSpacing: '0.01em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {displayName}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8,
          letterSpacing: '0.2em',
          color: 'var(--text-dim)',
          fontWeight: 700,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {secondary || '—'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[0, 1, 2].map(i => {
          const sectorPct = Math.min(100, (pct - i * 8) * (1 + i * 0.1));
          const sectorColor =
            sectorPct >= 80 ? '#c084fc' :
            sectorPct >= 50 ? '#00d26a' :
            sectorPct >= 25 ? '#ffd700' :
            sectorPct > 0 ? '#ff8700' :
            'rgba(255,255,255,0.1)';

          return (
            <div key={i} style={{
              flex: 1,
              height: 4,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, bottom: 0,
                width: animated ? `${Math.max(4, sectorPct)}%` : '0%',
                background: sectorColor,
                boxShadow: `0 0 4px ${sectorColor}`,
                transition: `width 1.1s cubic-bezier(0.4,0,0.2,1) ${i * 0.08}s`,
              }} />
            </div>
          );
        })}
      </div>

      <div style={{
        textAlign: 'right',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'flex-end',
        gap: 4,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 900,
          color: wins > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
          fontVariantNumeric: 'tabular-nums',
        }}>{wins}</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 7,
          letterSpacing: '0.2em',
          color: 'var(--text-dim)',
          fontWeight: 700,
        }}>W</span>
      </div>

      <div style={{
        textAlign: 'right',
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        fontWeight: 700,
        color: isLeader ? '#00d26a' : (gap < 15 ? '#ff8700' : 'rgba(255,255,255,0.6)'),
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.02em',
      }}>
        {isLeader ? t('standings.leader_label') : `-${gap}`}
      </div>

      <div style={{
        textAlign: 'right',
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        fontWeight: 900,
        color: teamColor,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 12px ${teamColor}66`,
        letterSpacing: '-0.01em',
      }}>
        {points}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 2,
      }}>
        <div style={{
          width: 3,
          height: 3,
          borderRadius: '50%',
          background: isLeader ? '#00d26a' : 'rgba(255,255,255,0.15)',
          boxShadow: isLeader ? '0 0 6px #00d26a' : 'none',
        }} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 7,
          letterSpacing: '0.2em',
          color: 'var(--text-dim)',
          fontWeight: 700,
        }}>{t('standings.points')}</span>
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ BATTLE CENTER ================================= */
/* ============================================================ */

function BattleCenter({ entries, tab }) {
  const { t } = useTranslation();

  const battles = useMemo(() => {
    if (!entries || entries.length < 2) return [];
    const list = [];
    for (let i = 0; i < Math.min(4, entries.length - 1); i++) {
      const a = entries[i];
      const b = entries[i + 1];
      const gap = (Number(a.points) || 0) - (Number(b.points) || 0);
      list.push({ a, b, gap });
    }
    return list;
  }, [entries]);

  if (battles.length === 0) return null;

  return (
    <aside style={{
      position: 'sticky',
      top: 120,
      background: 'linear-gradient(180deg, rgba(13,13,20,0.98) 0%, rgba(5,7,10,0.98) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      overflow: 'hidden',
      alignSelf: 'start',
    }}>
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(90deg, rgba(225,6,0,0.15) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(225,6,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{
          width: 6, height: 6,
          background: '#e10600',
          transform: 'rotate(45deg)',
          boxShadow: '0 0 8px #e10600',
        }} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          letterSpacing: '0.3em',
          color: '#e10600',
          fontWeight: 900,
        }}>
          {t('standings.battleCenter')}
        </span>
      </div>

      <div style={{ padding: '4px 0' }}>
        {battles.map((battle, i) => {
          const gap = battle.gap;
          const isHot = gap <= 10;
          const isClose = gap <= 25;
          const accentColor = isHot ? '#ff2020' : isClose ? '#ff8700' : 'rgba(255,255,255,0.3)';
          const label = isHot ? t('standings.hot') : isClose ? t('standings.close') : t('standings.safe');

          return (
            <div key={i} style={{
              padding: '14px 20px',
              borderBottom: i < battles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {isHot && (
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: 2,
                  background: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }} />
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 8,
                  letterSpacing: '0.25em',
                  color: accentColor,
                  fontWeight: 900,
                }}>
                  P{battle.a.position} vs P{battle.b.position}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 8,
                  letterSpacing: '0.2em',
                  color: accentColor,
                  fontWeight: 900,
                  padding: '2px 6px',
                  background: `${accentColor}22`,
                  border: `1px solid ${accentColor}55`,
                  borderRadius: 2,
                }}>
                  {label}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
              }}>
                {tab === 'drivers' && battle.a.driverCountryCode && (
                  <FlagImage
                    code={battle.a.driverCountryCode}
                    style={{ height: 12, width: 'auto', borderRadius: 1 }}
                  />
                )}
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  fontWeight: 900,
                  color: '#fff',
                  textTransform: 'uppercase',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {tab === 'drivers' ? battle.a.lastName : battle.a.name}
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 9,
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                }}>VS</span>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  fontWeight: 900,
                  color: '#fff',
                  textTransform: 'uppercase',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}>
                  {tab === 'drivers' ? battle.b.lastName : battle.b.name}
                </span>
                {tab === 'drivers' && battle.b.driverCountryCode && (
                  <FlagImage
                    code={battle.b.driverCountryCode}
                    style={{ height: 12, width: 'auto', borderRadius: 1 }}
                  />
                )}
              </div>

              <div style={{
                position: 'relative',
                height: 6,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 3,
                overflow: 'hidden',
                marginBottom: 6,
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: `${Math.min(100, (gap / 50) * 100)}%`,
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66)`,
                  boxShadow: `0 0 8px ${accentColor}66`,
                  transition: 'width 1s ease',
                }} />
              </div>

              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                color: accentColor,
                fontWeight: 900,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {gap} {t('standings.points')}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ============================================================ */
/* ============ MAIN COMPONENT ================================ */
/* ============================================================ */

export default function Standings() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('drivers');
  const [drivers, setDrivers] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, c, s] = await Promise.all([
          api.get('/standings/drivers'),
          api.get('/standings/constructors'),
          api.get('/standings/status'),
        ]);
        setDrivers(d.data || []);
        setConstructors(c.data || []);
        setStatus(s.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const active = tab === 'drivers' ? drivers : constructors;
  const leaderPts = active[0] ? Number(active[0].points) || 0 : 0;
  const maxPts = leaderPts || 1;

  if (loading) {
    return (
      <div className="container" style={{ padding: 120, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          color: '#e10600',
          letterSpacing: '0.35em',
          fontSize: 11,
          fontWeight: 700,
        }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#05070a' }}>
      <style>{`
        @keyframes liveBlink {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.15); }
        }
      `}</style>

      <HeroBar status={status} />

      {active.length > 0 && (
        <KpiStrip drivers={drivers} constructors={constructors} tab={tab} />
      )}

      <section className="container" style={{ padding: '32px 0 0', maxWidth: 1400 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {[
            { id: 'drivers', label: t('standings.drivers'), count: drivers.length },
            { id: 'constructors', label: t('standings.constructors'), count: constructors.length },
          ].map(tabItem => {
            const isActive = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '14px 20px',
                  position: 'relative',
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.25em',
                  fontWeight: 900,
                  color: isActive ? '#fff' : 'var(--text-dim)',
                  transition: 'color 0.2s',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
                  {tabItem.label}
                  <span style={{
                    fontSize: 9,
                    color: isActive ? '#e10600' : 'rgba(255,255,255,0.3)',
                    fontWeight: 700,
                  }}>
                    ({tabItem.count})
                  </span>
                </span>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0, right: 0, bottom: -1,
                    height: 2,
                    background: '#e10600',
                    boxShadow: '0 0 10px #e10600',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {!error && active.length === 0 && (
        <section className="container" style={{ padding: '60px 0 100px', maxWidth: 1400 }}>
          <div style={{
            padding: '80px 40px',
            background: 'linear-gradient(180deg, rgba(13,13,20,0.95) 0%, rgba(5,7,10,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.4em',
              color: '#e10600',
              fontWeight: 700,
              marginBottom: 20,
            }}>
              ◆ {t('standings.noData')} ◆
            </div>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#fff',
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}>
              {t('standings.championshipBeginsSoon')}
            </h3>
            <p style={{
              color: 'var(--text-dim)',
              fontSize: 14,
              fontFamily: 'var(--font-heading)',
              maxWidth: 480,
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              {t('standings.standingsWillAppear')}
            </p>
          </div>
        </section>
      )}

      {error && (
        <section className="container" style={{ padding: '60px 0 100px', maxWidth: 1400 }}>
          <div style={{
            padding: '40px',
            background: 'rgba(255,85,85,0.05)',
            border: '1px solid rgba(255,85,85,0.3)',
            borderRadius: 8,
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            letterSpacing: '0.2em',
            color: '#ff5555',
          }}>
            ⚠ {error}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section
          className="container standings-layout"
          style={{
            padding: '24px 0 100px',
            maxWidth: 1400,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: 24,
          }}
        >
          <div style={{
            background: 'linear-gradient(180deg, rgba(13,13,20,0.98) 0%, rgba(5,7,10,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '44px 32px 72px 32px 1fr 130px 90px 90px 60px',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px 12px 0',
              background: 'linear-gradient(90deg, rgba(225,6,0,0.12) 0%, rgba(5,7,10,0.98) 60%)',
              borderBottom: '1px solid rgba(225,6,0,0.3)',
              fontFamily: 'var(--font-display)',
              fontSize: 8,
              letterSpacing: '0.25em',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              <div style={{ textAlign: 'center' }}>{t('standings.position')}</div>
              <div></div>
              <div style={{ textAlign: 'center' }}>{t('standings.code')}</div>
              <div></div>
              <div style={{ paddingLeft: 4 }}>
                {tab === 'drivers' ? t('standings.driver') : t('standings.constructor')}
              </div>
              <div style={{ textAlign: 'center' }}>{t('standings.form')}</div>
              <div style={{ textAlign: 'right' }}>{t('standings.wins')}</div>
              <div style={{ textAlign: 'right' }}>{t('standings.gap')}</div>
              <div style={{ textAlign: 'right', paddingRight: 4 }}>{t('standings.points')}</div>
            </div>

            <div>
              {active.map((entry, i) => (
                <TimingRow
                  key={(entry.driverId || entry.constructorId) || i}
                  entry={entry}
                  leaderPts={leaderPts}
                  maxPts={maxPts}
                  tab={tab}
                  index={i}
                />
              ))}
            </div>
          </div>

          <BattleCenter entries={active} tab={tab} />
        </section>
      )}

      {active.length > 0 && (
        <section className="container" style={{ padding: '0 0 80px', maxWidth: 1400, textAlign: 'center' }}>
          <Link
            to={tab === 'drivers' ? '/drivers' : '/teams'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 32px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#e10600';
              e.currentTarget.style.background = 'rgba(225,6,0,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {tab === 'drivers' ? t('standings.allDrivers') : t('standings.allConstructors')}
            <span style={{ fontSize: 14 }}>→</span>
          </Link>
        </section>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .standings-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 44px 32px 72px 32px 1fr 130px 90px 90px 60px"] {
            grid-template-columns: 40px 26px 55px 1fr 70px 70px !important;
            gap: 6px !important;
          }
        }
      `}</style>
    </div>
  );
}