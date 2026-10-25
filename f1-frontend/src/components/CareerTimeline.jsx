import { useEffect, useState, useMemo, useRef } from 'react';
import api from '../api/axios';
import { imgSrc } from '../utils/images';

/* ============================================================ */
/* ============ HELPERS ======================================= */
/* ============================================================ */

function hexRgb(hex) {
  if (!hex || typeof hex !== 'string') return '225,6,0';
  const h = hex.replace('#', '');
  if (h.length !== 6) return '225,6,0';
  return `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`;
}

/* ✅ Fallback : seasonStats (agrégés) → entrées timeline */
function mapSeasonStatsToEntries(stats, driver) {
  if (!Array.isArray(stats) || stats.length === 0) return [];
  return stats
    .filter(s => s && s.season != null)
    .map(s => ({
      season: Number(s.season),
      points: Number(s.points) || 0,
      wins: Number(s.wins) || 0,
      podiums: Number(s.podiums) || 0,
      poles: 0,
      races: Number(s.races) || 0,
      position: s.position ?? null,
      teamName: driver?.teamName || '—',
      teamColor: driver?.teamColor || '#e10600',
      teamLogoUrl: driver?.teamLogoUrl || null,
      isFallback: true,
    }))
    .sort((a, b) => a.season - b.season);
}

/* ✅ Dernier recours : 1 entrée avec totaux carrière */
function buildCareerTotalEntry(driver) {
  if (!driver) return [];
  const hasAny =
    Number(driver.careerPoints) > 0 ||
    Number(driver.gpEntered) > 0 ||
    Number(driver.podiums) > 0 ||
    driver.debutYear != null;

  if (!hasAny) return [];

  const currentYear = new Date().getFullYear();
  const startYear = driver.debutYear;

  const parseWins = (hf) => {
    if (!hf) return 0;
    const m = String(hf).match(/^\s*1\s*(?:\(x?\s*(\d+)\s*\))?/i);
    return m?.[1] ? parseInt(m[1], 10) : 0;
  };

  return [{
    season: startYear || currentYear,
    isCareerTotal: true,
    points: Number(driver.careerPoints) || 0,
    wins: parseWins(driver.highestFinish),
    podiums: Number(driver.podiums) || 0,
    poles: Number(driver.polePositions) || 0,
    races: Number(driver.gpEntered) || 0,
    position: null,
    teamName: driver.teamName || '—',
    teamColor: driver.teamColor || '#e10600',
    teamLogoUrl: driver.teamLogoUrl || null,
  }];
}

/* ============================================================ */
/* ✅ FILL GAPS — de debutYear à aujourd'hui ================== */
/* ============================================================ */

/**
 * Étend la timeline pour couvrir TOUTES les années entre
 * `startYear` (debutYear) et `currentYear` inclus.
 * Les années sans données deviennent des entrées "gap" (pause).
 */
function fillYearsGap(timeline, startYear, currentYear) {
  if (!timeline || timeline.length === 0) {
    if (!startYear) return [];
    // Aucune donnée → on crée uniquement les cartes vides
    const result = [];
    for (let y = startYear; y <= currentYear; y++) {
      result.push({ season: y, isEmpty: true });
    }
    return result;
  }

  const byYear = new Map();
  timeline.forEach(t => {
    if (t?.season != null) byYear.set(Number(t.season), t);
  });

  // Si pas de debutYear fiable, on prend la 1ère année disponible
  const realStart =
    Number.isFinite(startYear) && startYear > 1950
      ? startYear
      : Math.min(...[...byYear.keys()]);

  const finalStart = Math.min(realStart, Math.min(...[...byYear.keys()]));
  const finalEnd = Math.max(currentYear, Math.max(...[...byYear.keys()]));

  const result = [];
  for (let y = finalStart; y <= finalEnd; y++) {
    if (byYear.has(y)) {
      result.push(byYear.get(y));
    } else {
      result.push({ season: y, isEmpty: true });
    }
  }
  return result;
}

/* ============================================================ */
/* ============ SEASON CARD =================================== */
/* ============================================================ */

function SeasonCard({ entry, maxPoints, index, isCurrentYear }) {
  const isEmpty = entry.isEmpty;
  const color = isEmpty ? 'rgba(255,255,255,0.18)' : (entry.teamColor || '#e10600');
  const rgb = isEmpty ? '120,120,130' : hexRgb(color);
  const pointsPct = maxPoints > 0 ? (entry.points / maxPoints) * 100 : 0;

  const posColor =
    entry.position === 1 ? '#FFD700' :
    entry.position === 2 ? '#C0C0C0' :
    entry.position === 3 ? '#CD7F32' :
    entry.position ? 'rgba(255,255,255,0.65)' :
    'rgba(255,255,255,0.3)';

  /* ✅ CARTE "PAUSE" (année sans F1) */
  if (isEmpty) {
    return (
      <div
        style={{
          flexShrink: 0,
          width: 160,
          scrollSnapAlign: 'start',
          position: 'relative',
          background: `linear-gradient(160deg, rgba(${rgb}, 0.06) 0%, #0a0a10 100%)`,
          border: `1.5px dashed rgba(${rgb}, 0.35)`,
          borderRadius: 12,
          padding: '20px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 260,
          animation: `ctCardIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.04}s both`,
          opacity: 0.72,
        }}
      >
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 34,
          fontWeight: 900,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.3)',
          lineHeight: 0.9,
          letterSpacing: '-0.03em',
          marginBottom: 14,
        }}>
          {entry.season}
        </div>

        <div style={{
          fontSize: 30,
          opacity: 0.5,
          marginBottom: 12,
        }}>⏸</div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          PAS DE<br />SAISON F1
        </div>
      </div>
    );
  }

  /* ✅ CARTE NORMALE (saison active) */
  return (
    <div
      style={{
        flexShrink: 0,
        width: 220,
        scrollSnapAlign: 'start',
        position: 'relative',
        background: `linear-gradient(160deg, rgba(${rgb}, 0.18) 0%, #0b0b12 100%)`,
        border: `1.5px solid ${isCurrentYear ? color : `rgba(${rgb}, 0.5)`}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 12,
        padding: '20px 18px 16px',
        boxShadow: isCurrentYear
          ? `0 0 30px rgba(${rgb}, 0.6), 0 10px 30px -10px rgba(${rgb}, 0.5)`
          : `0 10px 30px -10px rgba(${rgb}, 0.5), 0 0 24px rgba(${rgb}, 0.12)`,
        animation: `ctCardIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.04}s both`,
        transition: 'transform 0.3s, box-shadow 0.3s',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 20px 50px -15px rgba(${rgb}, 0.9), 0 0 40px rgba(${rgb}, 0.25)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isCurrentYear
          ? `0 0 30px rgba(${rgb}, 0.6), 0 10px 30px -10px rgba(${rgb}, 0.5)`
          : `0 10px 30px -10px rgba(${rgb}, 0.5), 0 0 24px rgba(${rgb}, 0.12)`;
      }}
    >
      {/* Badge "saison en cours" */}
      {isCurrentYear && (
        <div style={{
          position: 'absolute',
          top: 10, left: 10,
          padding: '3px 8px',
          background: color,
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 3,
          fontFamily: 'var(--font-display)',
          fontSize: 7,
          fontWeight: 900,
          letterSpacing: '0.2em',
          color: '#000',
          boxShadow: `0 0 12px ${color}`,
        }}>
          ● EN COURS
        </div>
      )}

      {/* Team logo top-right */}
      {entry.teamLogoUrl && (
        <div style={{
          position: 'absolute',
          top: 12, right: 12,
          width: 28, height: 28,
          borderRadius: 6,
          background: '#fff',
          padding: 3,
          display: 'grid', placeItems: 'center',
          boxShadow: `0 0 12px rgba(${rgb}, 0.5)`,
        }}>
          <img
            src={imgSrc(entry.teamLogoUrl)}
            alt={entry.teamName}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Year */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 44,
        fontWeight: 900,
        fontStyle: 'italic',
        color,
        lineHeight: 0.9,
        letterSpacing: '-0.03em',
        textShadow: `0 0 20px rgba(${rgb}, 0.5)`,
        marginBottom: 8,
        paddingRight: entry.teamLogoUrl ? 30 : 0,
        marginTop: isCurrentYear ? 22 : 0,
      }}>
        {entry.season}
      </div>

      {/* Championship position */}
      {entry.position != null && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          background: `${posColor}1a`,
          border: `1px solid ${posColor}66`,
          borderRadius: 4,
          marginBottom: 12,
          fontFamily: 'var(--font-display)',
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: '0.15em',
          color: posColor,
          textTransform: 'uppercase',
        }}>
          {entry.position === 1 ? '👑' : `P${entry.position}`} AU CHAMPIONNAT
        </div>
      )}

      {/* Points big */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 5,
        marginBottom: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 30,
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          textShadow: `0 0 15px rgba(${rgb}, 0.5)`,
        }}>{entry.points}</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9,
          letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 700,
        }}>PTS</span>
      </div>

      {/* Points bar */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 4,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 14,
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: `${Math.max(3, pointsPct)}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 10px rgba(${rgb}, 0.8)`,
          borderRadius: 2,
        }} />
      </div>

      {/* Mini stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        paddingTop: 12,
        borderTop: '1px dashed rgba(255,255,255,0.08)',
      }}>
        <StatMini icon="🏁" label="GP" value={entry.races} color={color} />
        <StatMini icon="🏆" label="VIC" value={entry.wins} color={entry.wins > 0 ? '#FFD700' : 'rgba(255,255,255,0.35)'} />
        <StatMini icon="🥇" label="POD" value={entry.podiums} color={entry.podiums > 0 ? '#00d26a' : 'rgba(255,255,255,0.35)'} />
        <StatMini icon="🎯" label="POLE" value={entry.poles} color={entry.poles > 0 ? '#c084fc' : 'rgba(255,255,255,0.35)'} />
      </div>

      {/* Team name */}
      {entry.teamName && entry.teamName !== '—' && (
        <div style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontFamily: 'var(--font-display)',
          fontSize: 9,
          letterSpacing: '0.2em',
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textShadow: `0 0 8px rgba(${rgb}, 0.5)`,
        }}>
          {entry.teamName}
        </div>
      )}
    </div>
  );
}

function StatMini({ icon, label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, lineHeight: 1, marginBottom: 3 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        fontWeight: 900,
        color,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>{value ?? 0}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 7,
        letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 700,
        marginTop: 2,
      }}>{label}</div>
    </div>
  );
}

/* ============================================================ */
/* ============ MAIN COMPONENT ================================ */
/* ============================================================ */

export default function CareerTimeline({
  driverId,
  driver: driverProp = null,
  seasonStats: seasonStatsProp = null,
  teamColor = '#e10600',
}) {
  const [driver, setDriver] = useState(driverProp);
  const [seasonStats, setSeasonStats] = useState(
    Array.isArray(seasonStatsProp) ? seasonStatsProp : []
  );
  const [rawTimeline, setRawTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [source, setSource] = useState(null);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* ============ SYNC PROPS ============ */
  useEffect(() => { if (driverProp !== null) setDriver(driverProp); }, [driverProp]);
  useEffect(() => {
    if (Array.isArray(seasonStatsProp)) setSeasonStats(seasonStatsProp);
  }, [seasonStatsProp]);

  /* ============================================================ */
  /* ============ FETCH + FALLBACK PROGRESSIF ================== */
  /* ============================================================ */
  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      setSource('no-driver-id');
      return;
    }

    let cancelled = false;

    const run = async () => {
      const [driverRes, seasonRes] = await Promise.allSettled([
        driverProp ? Promise.resolve({ data: driverProp })
                   : api.get(`/drivers/${driverId}`),
        Array.isArray(seasonStatsProp)
          ? Promise.resolve({ data: seasonStatsProp })
          : api.get(`/drivers/${driverId}/season-stats`).catch(() => ({ data: [] })),
      ]);

      if (cancelled) return;

      const d = driverRes.status === 'fulfilled' ? driverRes.value.data : null;
      const s = seasonRes.status === 'fulfilled' ? seasonRes.value.data : [];

      if (d) setDriver(d);
      if (Array.isArray(s)) setSeasonStats(s);

      const fallback =
        mapSeasonStatsToEntries(s, d).length > 0
          ? mapSeasonStatsToEntries(s, d)
          : buildCareerTotalEntry(d);

      if (fallback && fallback.length > 0) {
        setRawTimeline(fallback);
        setSource(fallback[0].isCareerTotal ? 'career-total' : 'season-stats');
        setLoading(false);
      } else {
        setRawTimeline([]);
        setSource('empty');
        setLoading(false);
      }

      setUpgrading(true);
      try {
        const r = await api.get(`/drivers/${driverId}/career-timeline`, {
          timeout: 30000,
        });
        const data = Array.isArray(r.data) ? r.data : [];
        if (!cancelled && data.length > 0) {
          const clean = data
            .filter(e => e && e.season != null)
            .map(e => ({ ...e, season: Number(e.season) }))
            .sort((a, b) => a.season - b.season);
          setRawTimeline(clean);
          setSource('api');
        }
      } catch (e) {
        console.warn('[CareerTimeline] Jolpica indisponible :', e?.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setUpgrading(false);
        }
      }
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  /* ============================================================ */
  /* ✅ FILL GAPS — de debutYear à currentYear ================== */
  /* ============================================================ */
  const currentYear = new Date().getFullYear();

  const timeline = useMemo(() => {
    const startYear = driver?.debutYear ?? null;
    return fillYearsGap(rawTimeline, startYear, currentYear);
  }, [rawTimeline, driver?.debutYear, currentYear]);

  /* ============================================================ */
  /* ============ SCROLL STATE ================================= */
  /* ============================================================ */
  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [timeline]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  /* Auto-scroll pour centrer l'année en cours au premier rendu */
  useEffect(() => {
    if (!scrollRef.current || timeline.length === 0) return;
    const el = scrollRef.current;
    const currentIndex = timeline.findIndex(t => Number(t.season) === currentYear);
    if (currentIndex >= 0) {
      const cardWidth = 234; // 220 + gap 14
      const scrollPos = Math.max(0, currentIndex * cardWidth - el.clientWidth / 2 + cardWidth / 2);
      setTimeout(() => {
        el.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }, 300);
    }
  }, [timeline, currentYear]);

  /* ============================================================ */
  /* ============ COMPUTED ===================================== */
  /* ============================================================ */
  const activeEntries = useMemo(
    () => timeline.filter(t => !t.isEmpty),
    [timeline]
  );

  const maxPoints = useMemo(
    () => Math.max(...activeEntries.map(t => Number(t.points) || 0), 1),
    [activeEntries]
  );

  const summary = useMemo(() => {
    if (activeEntries.length === 0) return null;
    return {
      seasons: activeEntries.length,
      totalPoints: activeEntries.reduce((s, t) => s + (Number(t.points) || 0), 0),
      totalWins: activeEntries.reduce((s, t) => s + (Number(t.wins) || 0), 0),
      totalPodiums: activeEntries.reduce((s, t) => s + (Number(t.podiums) || 0), 0),
      bestPosition: activeEntries
        .map(t => t.position)
        .filter(p => p != null)
        .reduce((best, p) => (best == null ? p : Math.min(best, p)), null),
    };
  }, [activeEntries]);

  /* ============================================================ */
  /* ============ RENDER STATES ================================ */
  /* ============================================================ */

  if (loading && timeline.length === 0) {
    return (
      <div style={{
        minHeight: 260,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 40,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `3px solid ${teamColor}22`,
          borderTopColor: teamColor,
          animation: 'ctSpin 0.9s linear infinite',
        }} />
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10, letterSpacing: '0.35em',
          color: teamColor, fontWeight: 700,
        }}>
          ◆ CHARGEMENT DE LA CARRIÈRE...
        </div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div style={{
        minHeight: 220,
        padding: '40px 30px',
        textAlign: 'center',
        background: `radial-gradient(ellipse at center, ${teamColor}11 0%, transparent 80%)`,
        border: `1px dashed ${teamColor}44`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}>
        <div style={{ fontSize: 44, opacity: 0.4 }}>📊</div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 16, fontWeight: 900,
          color: '#fff', textTransform: 'uppercase',
        }}>
          Aucune donnée de carrière disponible
        </div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12, color: 'rgba(255,255,255,0.55)',
          maxWidth: 420, lineHeight: 1.6,
        }}>
          Jolpica n'a pas encore répondu et aucune saison n'est enregistrée en DB.
          Réessaie dans quelques secondes.
        </div>
      </div>
    );
  }

  /* ============================================================ */
  /* ============ RENDER PRINCIPAL ============================= */
  /* ============================================================ */

  const sourceLabel =
    source === 'api' ? 'API JOLPICA' :
    source === 'season-stats' ? 'STATS PAR SAISON' :
    source === 'career-total' ? 'TOTAUX CARRIÈRE' :
    null;

  const startYear = timeline[0]?.season;
  const endYear = timeline[timeline.length - 1]?.season;

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        @keyframes ctCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ctSpin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ============ HEADER ============ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 6, height: 6,
            background: teamColor,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 10px ${teamColor}`,
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10, letterSpacing: '0.3em',
            color: teamColor, fontWeight: 700,
          }}>
            ◆ CARRIÈRE · {startYear} → {endYear}
          </span>
          {sourceLabel && (
            <span style={{
              padding: '2px 8px',
              background: `${teamColor}22`,
              border: `1px solid ${teamColor}55`,
              borderRadius: 3,
              fontFamily: 'var(--font-display)',
              fontSize: 8, letterSpacing: '0.2em',
              color: teamColor, fontWeight: 700,
            }}>
              {sourceLabel}
              {upgrading && ' · ⟳'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            aria-label="Années précédentes"
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: canScrollLeft ? `${teamColor}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${canScrollLeft ? teamColor : 'rgba(255,255,255,0.1)'}`,
              color: canScrollLeft ? teamColor : 'rgba(255,255,255,0.25)',
              cursor: canScrollLeft ? 'pointer' : 'not-allowed',
              fontSize: 16, fontWeight: 900,
              display: 'grid', placeItems: 'center',
              padding: 0,
            }}
          >‹</button>
          <button
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            aria-label="Années suivantes"
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: canScrollRight ? `${teamColor}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${canScrollRight ? teamColor : 'rgba(255,255,255,0.1)'}`,
              color: canScrollRight ? teamColor : 'rgba(255,255,255,0.25)',
              cursor: canScrollRight ? 'pointer' : 'not-allowed',
              fontSize: 16, fontWeight: 900,
              display: 'grid', placeItems: 'center',
              padding: 0,
            }}
          >›</button>
        </div>
      </div>

      {/* ============ SUMMARY ============ */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 10,
          marginBottom: 20,
        }}>
          <SummaryCard label="SAISONS F1" value={summary.seasons} color={teamColor} />
          <SummaryCard label="POINTS" value={summary.totalPoints} color="#00d26a" />
          <SummaryCard label="VICTOIRES" value={summary.totalWins} color="#FFD700" />
          <SummaryCard label="PODIUMS" value={summary.totalPodiums} color="#c084fc" />
          {summary.bestPosition != null && (
            <SummaryCard
              label="MEILLEUR"
              value={`P${summary.bestPosition}`}
              color={summary.bestPosition === 1 ? '#FFD700' : teamColor}
            />
          )}
        </div>
      )}

      {/* ============ TIMELINE SCROLL ============ */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: 20, right: 20,
          top: '50%',
          height: 1,
          background: `linear-gradient(90deg, transparent, ${teamColor}33, transparent)`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 14,
            overflowX: 'auto',
            padding: '12px 4px 20px',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'thin',
            scrollbarColor: `${teamColor}66 transparent`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {timeline.map((entry, i) => (
            <SeasonCard
              key={`${entry.season}-${i}`}
              entry={entry}
              maxPoints={maxPoints}
              index={i}
              isCurrentYear={Number(entry.season) === currentYear && !entry.isEmpty}
            />
          ))}

          <div style={{ flexShrink: 0, width: 4 }} />
        </div>
      </div>

      {/* ============ LÉGENDE ============ */}
      <div style={{
        marginTop: 16,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.45)',
        fontWeight: 700,
      }}>
        <LegendItem color={teamColor} label="SAISON ACTIVE" />
        <LegendItem color="rgba(255,255,255,0.3)" label="PAUSE / PAS DE F1" dashed />
        <LegendItem color="#FFD700" label="★ ANNÉE EN COURS" star />
      </div>

      {/* ============ NOTE FALLBACK ============ */}
      {source === 'career-total' && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: 'rgba(255,135,0,0.06)',
          border: '1px solid rgba(255,135,0,0.25)',
          borderRadius: 8,
          fontFamily: 'var(--font-heading)',
          fontSize: 12,
          color: '#ff8700',
          lineHeight: 1.6,
        }}>
          💡 Seuls les <strong>totaux carrière</strong> sont disponibles pour l'instant.
          Toutes les années depuis le début (debutYear) sont affichées mais non détaillées.
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* ============ SUMMARY CARD ================================== */
/* ============================================================ */

function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderTop: `2px solid ${color}`,
      borderRadius: 8,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 7, letterSpacing: '0.25em',
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 700, marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20, fontWeight: 900,
        color, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 12px ${color}66`,
      }}>{value}</div>
    </div>
  );
}

/* ============================================================ */
/* ============ LEGEND ITEM =================================== */
/* ============================================================ */

function LegendItem({ color, label, dashed, star }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        width: 14, height: 14,
        borderRadius: 3,
        background: dashed ? 'transparent' : color,
        border: `1.5px ${dashed ? 'dashed' : 'solid'} ${color}`,
        boxShadow: dashed ? 'none' : `0 0 8px ${color}88`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 8,
        color: dashed ? color : '#000',
        fontWeight: 900,
      }}>
        {star ? '★' : ''}
      </span>
      {label}
    </div>
  );
}