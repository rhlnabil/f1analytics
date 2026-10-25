import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { flagSrc } from '../utils/images';

/* ============================================================ */
/* ============ HOOK : LIVE COUNTDOWN ========================= */
/* ============================================================ */
function useCountdown(raceDate) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!raceDate) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [raceDate]);

  return useMemo(() => {
    if (!raceDate) return null;
    const target = new Date(raceDate); target.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - now;
    const dayMs = 1000 * 60 * 60 * 24;

    if (diffMs <= 0) {
      const isSameDay = target.getTime() === today.getTime();
      return isSameDay
        ? { status: 'today', days: 0, h: 0, m: 0, s: 0 }
        : { status: 'finished', days: Math.floor(-diffMs / dayMs), h: 0, m: 0, s: 0 };
    }

    return {
      status: 'upcoming',
      days: Math.floor(diffMs / dayMs),
      h: Math.floor((diffMs % dayMs) / (1000 * 60 * 60)),
      m: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
      s: Math.floor((diffMs % (1000 * 60)) / 1000),
      diffMs,
    };
  }, [raceDate, now]);
}

/* ============================================================ */
/* ============ HOOK : FETCH NEXT RACE ======================== */
/* ============================================================ */
function useNextRace() {
  const [race, setRace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get('/races/current');
        if (!cancelled && data?.race) {
          setRace({ ...data.race, status: data.status, daysUntil: data.daysUntil });
          setLoading(false);
          return;
        }
      } catch { /* fallback */ }

      try {
        const { data } = await api.get('/races');
        if (cancelled) return;
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const upcoming = (data || [])
          .filter(r => r.raceDate && new Date(r.raceDate) >= now)
          .sort((a, b) => new Date(a.raceDate) - new Date(b.raceDate));
        if (upcoming.length) {
          const r = upcoming[0];
          const d = new Date(r.raceDate); d.setHours(0, 0, 0, 0);
          const days = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
          setRace({ ...r, status: 'upcoming', daysUntil: days });
        }
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { race, loading };
}

/* ============================================================ */
/* ============ COMPOSANT PRINCIPAL =========================== */
/* ============================================================ */
export default function NextRaceCountdown({
  variant = 'compact',
  accentColor = '#e10600',
  onClick,
  style = {},
}) {
  const navigate = useNavigate();
  const { race, loading } = useNextRace();
  const cd = useCountdown(race?.raceDate);

  if (loading) {
    if (variant === 'compact') {
      return (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9, letterSpacing: '0.25em',
          color: 'rgba(255,255,255,0.35)',
        }}>…</span>
      );
    }
    return null;
  }

  if (!race) return null;

  const handleClick = () => {
    if (onClick) onClick(race);
    else navigate(`/races/${race.id}`);
  };

  /* ============================================================ */
  /* ============ VARIANT : COMPACT ============================= */
  /* ============================================================ */
  if (variant === 'compact') {
    const statusColor =
      cd?.status === 'today' ? '#ff2020'
      : cd?.status === 'upcoming' ? '#ffd700'
      : cd?.status === 'finished' ? '#00d26a'
      : '#8a8a95';

    const pulse = cd?.status === 'today' || cd?.status === 'upcoming';

    const timeLabel = (() => {
      if (!cd) return '—';
      if (cd.status === 'today') return "AUJOURD'HUI";
      if (cd.status === 'finished') return 'TERMINÉ';
      if (cd.days > 0) return `${cd.days}j ${cd.h}h`;
      return `${cd.h}h ${String(cd.m).padStart(2, '0')}m`;
    })();

    return (
      <button
        type="button"
        onClick={handleClick}
        title={race.name}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 12px',
          background: 'linear-gradient(90deg, rgba(225,6,0,0.10) 0%, rgba(0,0,0,0.65) 100%)',
          border: `1px solid ${statusColor}55`,
          borderRadius: 4,
          clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          transition: 'all 0.25s',
          ...style,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = statusColor;
          e.currentTarget.style.boxShadow = `0 0 20px ${statusColor}66`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = `${statusColor}55`;
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: statusColor,
          boxShadow: `0 0 8px ${statusColor}`,
          animation: pulse ? 'nrcBlink 1.2s ease-in-out infinite' : 'none',
        }} />

        {race.circuitCountryCode && (
          <img
            src={flagSrc(race.circuitCountryCode)}
            alt={race.circuitCountryCode}
            style={{ height: 12, width: 'auto', borderRadius: 1 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}

        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9, letterSpacing: '0.18em',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.55)',
        }}>
          R{String(race.round).padStart(2, '0')}
        </span>

        <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.15)' }} />

        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11, letterSpacing: '0.08em',
          fontWeight: 900,
          color: statusColor,
          textShadow: `0 0 10px ${statusColor}88`,
          fontVariantNumeric: 'tabular-nums',
          direction: 'ltr',
          whiteSpace: 'nowrap',
        }}>
          {timeLabel}
        </span>

        <style>{`
          @keyframes nrcBlink {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50%      { opacity: 1;   transform: scale(1.3); }
          }
        `}</style>
      </button>
    );
  }

  /* ============================================================ */
  /* ============ VARIANT : FULL ================================ */
  /* ============================================================ */
  const statusMeta = (() => {
    if (!cd || cd.status === 'upcoming') {
      return { label: '◆ PROCHAIN GP', color: accentColor };
    }
    if (cd.status === 'today') {
      return { label: '◆ JOUR DE COURSE', color: '#ff2020' };
    }
    return { label: '◆ TERMINÉ', color: '#00d26a' };
  })();

  const bigNumber = (() => {
    if (!cd) return '—';
    if (cd.status === 'today') return 'GP';
    if (cd.status === 'finished') return '✓';
    if (cd.days > 0) return String(cd.days);
    return String(cd.h);
  })();

  const bigUnit = (() => {
    if (!cd) return '';
    if (cd.status === 'today') return "AUJOURD'HUI";
    if (cd.status === 'finished') return 'TERMINÉ';
    if (cd.days > 0) return cd.days === 1 ? 'JOUR' : 'JOURS';
    return cd.h === 1 ? 'HEURE' : 'HEURES';
  })();

  const formattedDate = race.raceDate
    ? new Date(race.raceDate).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }).toUpperCase()
    : null;

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') handleClick(); }}
      style={{
        position: 'relative',
        padding: '24px 28px',
        background: `linear-gradient(135deg, ${accentColor}22 0%, #0b0b12 100%)`,
        border: `1.5px solid ${accentColor}66`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 12,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `0 10px 30px -15px ${accentColor}88`,
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 20px 50px -15px ${accentColor}cc, 0 0 40px ${accentColor}44`;
        e.currentTarget.style.borderColor = accentColor;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 10px 30px -15px ${accentColor}88`;
        e.currentTarget.style.borderColor = `${accentColor}66`;
      }}
    >
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 220, height: 220, borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}55 0%, transparent 70%)`,
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: 'var(--font-display)',
            fontSize: 10, letterSpacing: '0.35em',
            color: statusMeta.color, fontWeight: 700,
            marginBottom: 12,
          }}>
            <span style={{ width: 20, height: 2, background: statusMeta.color }} />
            {statusMeta.label}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            {race.circuitCountryCode && (
              <img src={flagSrc(race.circuitCountryCode)} alt={race.circuitCountryCode}
                style={{
                  height: 26, width: 'auto', borderRadius: 3,
                  boxShadow: `0 0 15px ${accentColor}66`,
                }}
                onError={e => { e.target.style.display = 'none'; }} />
            )}
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11, letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.6)', fontWeight: 700,
            }}>
              R{String(race.round).padStart(2, '0')} · {race.season}
            </div>
          </div>

          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(20px, 2.4vw, 28px)',
            fontWeight: 900, textTransform: 'uppercase',
            lineHeight: 1.05, color: '#fff',
            letterSpacing: '-0.01em', marginBottom: 10,
            textShadow: `0 0 25px ${accentColor}66`,
          }}>{race.name}</div>

          {race.circuitName && (
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 13, color: 'var(--text-mid)',
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 6,
            }}>🛣️ {race.circuitName}</div>
          )}

          {formattedDate && (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10, letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.4)', fontWeight: 700,
            }}>{formattedDate}</div>
          )}
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minWidth: 140, padding: '8px 12px',
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${accentColor}44`,
          borderRadius: 10, direction: 'ltr',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 52, fontWeight: 900, lineHeight: 1,
            color: statusMeta.color,
            textShadow: `0 0 30px ${statusMeta.color}88`,
            fontVariantNumeric: 'tabular-nums',
          }}>{bigNumber}</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 9, letterSpacing: '0.3em',
            fontWeight: 700, color: 'rgba(255,255,255,0.55)',
            marginTop: 4,
          }}>{bigUnit}</div>

          {cd?.status === 'upcoming' && cd.days > 0 && (
            <div style={{
              marginTop: 8, padding: '4px 10px',
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}55`,
              borderRadius: 4,
              fontFamily: 'var(--font-display)',
              fontSize: 10, fontWeight: 900, color: accentColor,
              letterSpacing: '0.15em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {String(cd.h).padStart(2, '0')}:{String(cd.m).padStart(2, '0')}:{String(cd.s).padStart(2, '0')}
            </div>
          )}

          {cd?.status === 'upcoming' && cd.days === 0 && (
            <div style={{
              marginTop: 8, padding: '4px 10px',
              background: '#ff202022',
              border: '1px solid #ff202055',
              borderRadius: 4,
              fontFamily: 'var(--font-display)',
              fontSize: 10, fontWeight: 900, color: '#ff2020',
              letterSpacing: '0.15em',
              fontVariantNumeric: 'tabular-nums',
              animation: 'nrcBlinkFull 1s infinite',
            }}>
              {String(cd.h).padStart(2, '0')}:{String(cd.m).padStart(2, '0')}:{String(cd.s).padStart(2, '0')}
            </div>
          )}

          {cd?.status === 'today' && (
            <div style={{
              marginTop: 8, padding: '4px 10px',
              background: '#ff2020',
              borderRadius: 4,
              fontFamily: 'var(--font-display)',
              fontSize: 10, fontWeight: 900, color: '#fff',
              letterSpacing: '0.2em',
              animation: 'nrcBlinkFull 1.2s infinite',
            }}>● LIVE</div>
          )}
        </div>
      </div>

      <div style={{
        marginTop: 20, paddingTop: 14,
        borderTop: `1px dashed ${accentColor}33`,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9, letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.4)', fontWeight: 700,
        }}>◆ CLIQUE POUR VOIR LE GP</span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: accentColor,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>VOIR →</span>
      </div>

      <style>{`
        @keyframes nrcBlinkFull {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}