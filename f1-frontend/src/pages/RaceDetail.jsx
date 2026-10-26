import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { imgSrc, flagSrc } from '../utils/images';
import RaceHighlights from '../components/RaceHighlights';
import RacePodcast from '../components/RacePodcast';

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
/* ============ FLAG WRAPPER ================================== */
/* ============================================================ */

const flagFallback = (code) => `https://flagcdn.com/w320/${code.toLowerCase()}.png`;

function FlagImage({ code, style, className, onError: customOnError }) {
  if (!code) return null;
  return (
    <img
      src={flagSrc(code)}
      alt={code}
      className={className}
      style={style}
      onError={e => {
        if (!e.target.dataset.fallback) {
          e.target.dataset.fallback = '1';
          e.target.src = flagFallback(code);
        } else if (customOnError) {
          customOnError(e);
        } else {
          e.target.style.display = 'none';
        }
      }}
    />
  );
}

/* ============================================================ */
/* ============ PODIUM CARD =================================== */
/* ============================================================ */

function PodiumCard({ driver, place }) {
  const placeColor = place === 1 ? '#FFD700' : place === 2 ? '#C0C0C0' : '#CD7F32';
  const placeLabel = place === 1 ? 'WINNER' : `P${place}`;
  const teamColor = driver.teamColor || '#666';
  const photoSize = place === 1 ? 130 : 100;
  const pointsAnim = useCountUp(driver.points || 0, 1400);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      animation: `podiumRise 0.9s cubic-bezier(0.34,1.56,0.64,1) ${place * 0.15}s both`,
      position: 'relative',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        letterSpacing: '0.35em',
        fontWeight: 900,
        color: placeColor,
        marginBottom: 16,
        textShadow: `0 0 20px ${placeColor}88`,
        padding: '4px 12px',
        border: `1px solid ${placeColor}66`,
        borderRadius: 3,
        background: `${placeColor}11`,
      }}>
        {placeLabel}
      </div>

      <div style={{ position: 'relative', marginBottom: 18 }}>
        <div style={{
          position: 'absolute',
          inset: -12,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${placeColor}55 0%, transparent 70%)`,
          filter: 'blur(20px)',
          animation: place === 1 ? 'haloBreath 2.5s ease-in-out infinite' : 'none',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative',
          width: photoSize,
          height: photoSize,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `3px solid ${placeColor}`,
          boxShadow: `0 0 40px ${placeColor}aa, inset 0 0 20px ${placeColor}33`,
          background: '#0a0a0a',
        }}>
          {driver.driverPhotoUrl ? (
            <img
              src={imgSrc(driver.driverPhotoUrl)}
              alt=""
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 5%',
              }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 32, fontWeight: 900,
              color: teamColor,
            }}>
              {driver.driverCode || '?'}
            </div>
          )}
        </div>

        {driver.driverNumber && (
          <div style={{
            position: 'absolute',
            bottom: -6, right: -6,
            minWidth: 32, height: 32,
            padding: '0 8px',
            borderRadius: 16,
            background: teamColor,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 900,
            fontStyle: 'italic',
            display: 'grid',
            placeItems: 'center',
            border: '2px solid #0a0a0a',
            boxShadow: `0 0 15px ${teamColor}`,
          }}>
            {driver.driverNumber}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {driver.driverCountryCode && (
          <FlagImage
            code={driver.driverCountryCode}
            className="detail-flag-small"
            style={{ height: 16, width: 'auto', borderRadius: 2 }}
          />
        )}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.6)',
          fontWeight: 900,
        }}>
          {driver.driverCode || '—'}
        </span>
      </div>

      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 22,
        fontWeight: 900,
        textTransform: 'uppercase',
        color: '#fff',
        lineHeight: 1,
        textAlign: 'center',
        marginBottom: 6,
        textShadow: `0 0 20px ${teamColor}66`,
      }}>
        {driver.driverLastName}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.2em',
        color: teamColor,
        fontWeight: 900,
        textTransform: 'uppercase',
        marginBottom: 16,
      }}>
        {driver.teamLogoUrl && (
          <img
            src={imgSrc(driver.teamLogoUrl)}
            alt=""
            style={{
              height: 14, width: 'auto',
              background: '#fff', padding: 1, borderRadius: 2,
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
        {driver.constructorName}
      </div>

      <div style={{
        width: '100%',
        maxWidth: 160,
        padding: '12px 16px',
        background: `linear-gradient(180deg, ${placeColor}22 0%, transparent 100%)`,
        border: `1px solid ${placeColor}66`,
        borderRadius: 8,
        textAlign: 'center',
        boxShadow: `0 0 20px ${placeColor}33`,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          textShadow: `0 0 20px ${placeColor}88`,
        }}>
          {pointsAnim}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8,
          letterSpacing: '0.3em',
          color: placeColor,
          fontWeight: 900,
          marginTop: 6,
        }}>
          POINTS
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ RESULT ROW ==================================== */
/* ============================================================ */

function ResultRow({ result, isFastestLap, index }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100 + index * 30);
    return () => clearTimeout(t);
  }, [index]);

  const teamColor = result.teamColor || '#666';
  const isDNF = result.positionText === 'R' || result.positionText === 'W' || !result.position;
  const positionDisplay = isDNF
    ? (result.positionText === 'W' ? 'DNS' : 'DNF')
    : String(result.position).padStart(2, '0');
  const positionColor = isDNF
    ? '#ff5555'
    : result.position === 1 ? '#FFD700'
    : result.position === 2 ? '#C0C0C0'
    : result.position === 3 ? '#CD7F32'
    : 'rgba(255,255,255,0.6)';

  const flRank = result.fastestLapRank || 20;
  const formBars = [1 - flRank / 25, 1 - flRank / 22, 1 - flRank / 20].map(v =>
    Math.max(10, Math.min(100, v * 100))
  );

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '44px 26px 32px 1fr 130px 80px 90px 110px',
        alignItems: 'center',
        gap: 12,
        padding: '11px 20px 11px 0',
        background: isFastestLap
          ? 'linear-gradient(90deg, rgba(192,132,252,0.12) 0%, transparent 60%)'
          : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.2s',
        animation: `rowSlideIn 0.5s ease ${index * 0.02}s both`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${teamColor}0f`; }}
      onMouseLeave={e => {
        e.currentTarget.style.background = isFastestLap
          ? 'linear-gradient(90deg, rgba(192,132,252,0.12) 0%, transparent 60%)'
          : 'transparent';
      }}
    >
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: teamColor,
        boxShadow: `0 0 10px ${teamColor}88`,
      }} />

      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: isDNF ? 11 : 20,
        fontWeight: 900,
        fontStyle: 'italic',
        color: positionColor,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        textShadow: !isDNF && result.position <= 3 ? `0 0 15px ${positionColor}66` : 'none',
      }}>
        {positionDisplay}
      </div>

      <div style={{
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        fontWeight: 900,
        color: isFastestLap ? '#c084fc' : 'transparent',
        textShadow: isFastestLap ? '0 0 10px #c084fc' : 'none',
      }}>
        ⚡
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}>
        {result.driverCountryCode && (
          <FlagImage
            code={result.driverCountryCode}
            className="detail-flag-tiny"
            style={{ height: 10, width: 'auto', borderRadius: 1 }}
          />
        )}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '0.05em',
          textAlign: 'center',
          padding: '3px 0',
          width: '100%',
          background: `${teamColor}22`,
          border: `1px solid ${teamColor}55`,
          borderRadius: 3,
        }}>
          {result.driverCode || '???'}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 15,
          fontWeight: 900,
          textTransform: 'uppercase',
          color: '#fff',
          lineHeight: 1,
          marginBottom: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {result.driverFirstName} {result.driverLastName}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8,
          letterSpacing: '0.2em',
          color: 'var(--text-dim)',
          fontWeight: 700,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {result.teamLogoUrl && (
            <img
              src={imgSrc(result.teamLogoUrl)}
              alt=""
              style={{ height: 10, width: 'auto', background: '#fff', padding: 1, borderRadius: 1 }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          {result.constructorName || '—'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {formBars.map((pct, i) => {
          const c = i === 0 ? '#00d26a' : i === 1 ? '#ffd700' : teamColor;
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
                width: animated ? `${pct}%` : '0%',
                background: c,
                boxShadow: `0 0 4px ${c}`,
                transition: `width 1.1s cubic-bezier(0.4,0,0.2,1) ${i * 0.08}s`,
              }} />
            </div>
          );
        })}
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        color: isFastestLap ? '#c084fc' : 'rgba(255,255,255,0.5)',
        fontWeight: isFastestLap ? 900 : 700,
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {result.fastestLapTime || '—'}
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 700,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {result.laps || '—'} <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>L</span>
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.15em',
        color: isDNF ? '#ff5555' : '#00d26a',
        fontWeight: 900,
        textAlign: 'right',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {isDNF ? (result.positionText === 'W' ? 'DNS' : 'DNF') : 'FINISHED'}
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        fontWeight: 900,
        color: teamColor,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 12px ${teamColor}66`,
      }}>
        {result.points || 0} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>PTS</span>
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ TELEMETRY PANEL =============================== */
/* ============================================================ */

function TelemetryPanel({ sessionKey, drivers }) {
  const [driverA, setDriverA] = useState('');
  const [driverB, setDriverB] = useState('');
  const [preloaded, setPreloaded] = useState({});

  const driverOptions = useMemo(() => {
    return drivers
      .filter(d => d.driverNumber)
      .map(d => ({
        number: parseInt(d.driverNumber, 10),
        name: `${d.driverFirstName} ${d.driverLastName}`,
        code: d.driverCode,
        color: d.teamColor || '#e10600',
      }))
      .filter(d => !isNaN(d.number));
  }, [drivers]);

  useEffect(() => {
    if (driverOptions.length >= 2 && !driverA) setDriverA(String(driverOptions[0].number));
    if (driverOptions.length >= 2 && !driverB) setDriverB(String(driverOptions[1].number));
  }, [driverOptions, driverA, driverB]);

  useEffect(() => {
    if (!sessionKey || driverOptions.length < 2) return;
    const dA = driverOptions[0].number;
    const dB = driverOptions[1].number;

    Promise.all([
      api.get('/telemetry', { params: { sessionKey, driverNumber: dA } }).catch(() => null),
      api.get('/telemetry', { params: { sessionKey, driverNumber: dB } }).catch(() => null),
    ]).then(([rA, rB]) => {
      setPreloaded({
        [dA]: rA?.data || [],
        [dB]: rB?.data || [],
      });
    });
  }, [sessionKey, driverOptions]);

  const driverAObj = driverOptions.find(d => String(d.number) === driverA);
  const driverBObj = driverOptions.find(d => String(d.number) === driverB);

  if (driverOptions.length < 2) {
    return (
      <div style={{
        padding: 40, textAlign: 'center', color: 'var(--text-dim)',
        background: 'rgba(0,0,0,0.3)', borderRadius: 8,
        fontFamily: 'var(--font-heading)', fontSize: 13,
      }}>
        Pas assez de pilotes pour comparer la télémétrie.
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20,
      }}>
        <div>
          <label style={{
            display: 'block', marginBottom: 6,
            fontFamily: 'var(--font-display)', fontSize: 9,
            letterSpacing: '0.2em', color: 'var(--text-dim)', fontWeight: 700,
          }}>PILOTE 1</label>
          <select
            value={driverA}
            onChange={e => setDriverA(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px',
              background: 'rgba(20,20,26,0.9)',
              border: `1px solid ${driverAObj?.color || '#e10600'}66`,
              borderRadius: 6, color: '#fff',
              fontFamily: 'var(--font-heading)', fontSize: 14, outline: 'none',
              cursor: 'pointer',
            }}
          >
            {driverOptions.map(d => (
              <option key={d.number} value={d.number}>
                #{d.number} · {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{
            display: 'block', marginBottom: 6,
            fontFamily: 'var(--font-display)', fontSize: 9,
            letterSpacing: '0.2em', color: 'var(--text-dim)', fontWeight: 700,
          }}>PILOTE 2</label>
          <select
            value={driverB}
            onChange={e => setDriverB(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px',
              background: 'rgba(20,20,26,0.9)',
              border: `1px solid ${driverBObj?.color || '#e10600'}66`,
              borderRadius: 6, color: '#fff',
              fontFamily: 'var(--font-heading)', fontSize: 14, outline: 'none',
              cursor: 'pointer',
            }}
          >
            {driverOptions.map(d => (
              <option key={d.number} value={d.number}>
                #{d.number} · {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {driverAObj && (
          <TelemetryChart
            key={`a-${sessionKey}-${driverAObj.number}`}
            sessionKey={sessionKey}
            driverNumber={driverAObj.number}
            driverName={driverAObj.name}
            teamColor={driverAObj.color}
          />
        )}
        {driverBObj && (
          <TelemetryChart
            key={`b-${sessionKey}-${driverBObj.number}`}
            sessionKey={sessionKey}
            driverNumber={driverBObj.number}
            driverName={driverBObj.name}
            teamColor={driverBObj.color}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ MAIN COMPONENT ================================ */
/* ============================================================ */

export default function RaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [race, setRace] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('results');
  const [sessionKey, setSessionKey] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [raceRes, resultsRes] = await Promise.all([
          api.get(`/races/${id}`),
          api.get(`/races/${id}/results`).catch(() => ({ data: [] })),
        ]);
        setRace(raceRes.data);
        setResults(resultsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de charger la course');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    api.get(`/races/${id}/session-key`)
      .then(r => setSessionKey(r.data?.sessionKey ?? null))
      .catch(() => setSessionKey(null));
  }, [id]);

  const podium = useMemo(() => results.slice(0, 3), [results]);
  const rest = useMemo(() => results.slice(3), [results]);
  const fastestLap = useMemo(() => results.find(r => r.isFastestLap), [results]);

  const formattedDate = useMemo(() => {
    if (!race?.raceDate) return '—';
    try {
      return new Date(race.raceDate).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }).toUpperCase();
    } catch { return race.raceDate; }
  }, [race]);

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
          LOADING RACE DATA...
        </div>
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="container" style={{ padding: 120, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-dim)', marginBottom: 16 }}>
          {error || 'Course introuvable'}
        </h2>
        <button onClick={() => navigate('/races')} style={{
          padding: '12px 24px',
          background: 'transparent',
          border: '1px solid #e10600',
          borderRadius: 4,
          color: '#fff',
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.2em',
          fontWeight: 700,
          cursor: 'pointer',
        }}>
          ← RETOUR AU CALENDRIER
        </button>
      </div>
    );
  }

  const hasResults = results.length > 0;
  const cc = race.circuitCountryCode?.toUpperCase() || '';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#05070a' }}>
      <style>{`
        @keyframes liveBlink {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.15); }
        }
        @keyframes haloBreath {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.15); }
        }
        @keyframes podiumRise {
          0%   { opacity: 0; transform: translateY(80px); }
          60%  { opacity: 1; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowSlideIn {
          0%   { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroFlagWave {
          0%   { transform: perspective(1000px) rotateY(0deg) skewY(0deg); }
          25%  { transform: perspective(1000px) rotateY(4deg) skewY(-1.5deg); }
          50%  { transform: perspective(1000px) rotateY(-3deg) skewY(1deg); }
          75%  { transform: perspective(1000px) rotateY(5deg) skewY(-1.8deg); }
          100% { transform: perspective(1000px) rotateY(0deg) skewY(0deg); }
        }
        @keyframes flagBadgeWave {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25%      { transform: scale(1.05) rotate(-2deg); }
          75%      { transform: scale(1.03) rotate(2deg); }
        }
        .detail-hero-flag { animation: heroFlagWave 5s ease-in-out infinite; }
        .detail-flag-small { animation: flagBadgeWave 3s ease-in-out infinite; }
        .detail-flag-tiny { opacity: 0.85; }
      `}</style>

      {/* HERO */}
      <section style={{
        position: 'relative',
        padding: '100px 0 40px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(5,7,10,0.98) 100%)',
        overflow: 'hidden',
      }}>
        {race.circuitCountryCode && (
          <div style={{
            position: 'absolute',
            top: 0, right: 0,
            width: '55%', height: '100%',
            overflow: 'hidden',
            opacity: 0.15,
            maskImage: 'linear-gradient(90deg, transparent 0%, black 60%)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 60%)',
            pointerEvents: 'none',
          }}>
            <FlagImage
              code={race.circuitCountryCode}
              className="detail-hero-flag"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(2px) saturate(1.2)',
                transformOrigin: 'left center',
              }}
            />
          </div>
        )}

        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(225,6,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225,6,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at 30% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 30% 50%, black 20%, transparent 80%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 4,
          background: 'repeating-linear-gradient(180deg, #e10600 0, #e10600 30px, transparent 30px, transparent 60px)',
          opacity: 0.6,
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
            flexWrap: 'wrap',
          }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>HOME</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <Link to="/races" style={{ color: 'inherit', textDecoration: 'none' }}>CALENDAR</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: '#e10600' }}>R{String(race.round).padStart(2, '0')}</span>
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(225,6,0,0.4), transparent)' }} />
            <span>SEASON {race.season}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'flex-end',
            gap: 32,
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 20,
              }}>
                {cc && (
                  <div style={{
                    width: 54, height: 54,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid #e10600',
                    boxShadow: '0 0 25px rgba(225,6,0,0.7), 0 4px 12px rgba(0,0,0,0.9)',
                    background: '#0a0a0a',
                  }}>
                    <FlagImage
                      code={race.circuitCountryCode}
                      className="detail-flag-small"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                )}
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    letterSpacing: '0.35em',
                    color: '#e10600',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}>
                    {race.circuitCountry?.toUpperCase() || 'GRAND PRIX'}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 900,
                    letterSpacing: '0.15em',
                    color: '#fff',
                  }}>
                    {cc}
                  </div>
                </div>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(40px, 6vw, 76px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.04em',
                lineHeight: 0.92,
                margin: 0,
                color: '#fff',
                marginBottom: 20,
                textShadow: '0 4px 30px rgba(0,0,0,0.9)',
              }}>
                {race.name}
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'var(--text-dim)',
                fontWeight: 700,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  background: 'rgba(225,6,0,0.1)',
                  border: '1px solid rgba(225,6,0,0.3)',
                  borderRadius: 3,
                }}>
                  <span style={{
                    width: 5, height: 5,
                    background: '#e10600',
                    borderRadius: '50%',
                    boxShadow: '0 0 6px #e10600',
                  }} />
                  {formattedDate}
                </div>

                {race.circuitName && (
                  <Link
                    to={race.circuitId ? `/circuits/${race.circuitId}` : '#'}
                    style={{
                      color: '#e10600',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    🏁 {race.circuitName}
                  </Link>
                )}

                {hasResults && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    background: 'rgba(0,210,106,0.1)',
                    border: '1px solid rgba(0,210,106,0.3)',
                    borderRadius: 3,
                    color: '#00d26a',
                  }}>
                    <span style={{
                      width: 5, height: 5,
                      background: '#00d26a',
                      borderRadius: '50%',
                      boxShadow: '0 0 6px #00d26a',
                      animation: 'liveBlink 2s infinite',
                    }} />
                    RÉSULTATS FINAUX
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right', fontFamily: 'var(--font-display)' }}>
              <div style={{
                fontSize: 9,
                letterSpacing: '0.3em',
                color: 'var(--text-dim)',
                fontWeight: 700,
                marginBottom: 4,
              }}>
                ROUND
              </div>
              <div style={{
                fontSize: 84,
                fontWeight: 900,
                color: '#e10600',
                lineHeight: 0.9,
                letterSpacing: '-0.02em',
                textShadow: '0 0 40px rgba(225,6,0,0.6)',
              }}>
                {String(race.round).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NO RESULTS */}
      {!hasResults && (
        <section className="container" style={{ padding: '80px 0', maxWidth: 1400 }}>
          <Reveal direction="up">
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
                ◆ RESULTS NOT AVAILABLE ◆
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
                Race not yet completed
              </h3>
              <p style={{
                color: 'var(--text-dim)',
                fontSize: 14,
                fontFamily: 'var(--font-heading)',
                maxWidth: 480,
                margin: '0 auto',
                lineHeight: 1.6,
              }}>
                Results will appear a few hours after the checkered flag.
              </p>
            </div>
          </Reveal>
        </section>
      )}

      {/* PODIUM */}
      {podium.length >= 3 && (
        <section className="container" style={{ padding: '60px 0 0', maxWidth: 1400 }}>
          <Reveal direction="up">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 40,
              justifyContent: 'center',
            }}>
              <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #FFD700)' }} />
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.4em',
                color: '#FFD700',
                fontWeight: 900,
                textShadow: '0 0 20px #FFD70088',
              }}>
                PODIUM
              </div>
              <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, #FFD700, transparent)' }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              alignItems: 'flex-end',
              maxWidth: 900,
              margin: '0 auto',
            }}>
              <PodiumCard driver={podium[1]} place={2} />
              <PodiumCard driver={podium[0]} place={1} />
              <PodiumCard driver={podium[2]} place={3} />
            </div>
          </Reveal>
        </section>
      )}

      {/* ✅ HIGHLIGHTS YOUTUBE (EN PREMIER) */}
      {hasResults && (
        <section className="container" style={{
          padding: '40px 32px 0',
          maxWidth: 1400,
          minHeight: 400,
        }}>
          <RaceHighlights raceId={race.id} raceName={race.name} teamColor="#e10600" />
        </section>
      )}

      {/* ✅ PODCAST AUDIO (SOUS LA VIDÉO) */}
      {hasResults && (
        <section className="container" style={{
          padding: '24px 32px 0',
          maxWidth: 1400,
          minHeight: 200,
        }}>
          <RacePodcast
            raceId={race.id}
            raceName={race.name}
            results={results}
            teamColor="#e10600"
          />
        </section>
      )}

      {/* FASTEST LAP BANNER */}
      {fastestLap && (
        <section className="container" style={{ padding: '50px 0 0', maxWidth: 1400 }}>
          <Reveal direction="up">
            <div style={{
              padding: '24px 32px',
              background: 'linear-gradient(90deg, rgba(192,132,252,0.15) 0%, rgba(13,13,20,0.95) 100%)',
              border: '1px solid rgba(192,132,252,0.4)',
              borderLeft: '4px solid #c084fc',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
              boxShadow: '0 0 40px rgba(192,132,252,0.15)',
            }}>
              <div style={{
                fontSize: 32,
                filter: 'drop-shadow(0 0 15px #c084fc)',
              }}>⚡</div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 9,
                  letterSpacing: '0.35em',
                  color: '#c084fc',
                  fontWeight: 900,
                  marginBottom: 6,
                }}>
                  FASTEST LAP
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}>
                  {fastestLap.driverCountryCode && (
                    <FlagImage
                      code={fastestLap.driverCountryCode}
                      className="detail-flag-small"
                      style={{ height: 22, width: 'auto', borderRadius: 3 }}
                    />
                  )}
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 22,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: '#fff',
                    letterSpacing: '0.02em',
                    textShadow: '0 0 20px rgba(192,132,252,0.5)',
                  }}>
                    {fastestLap.driverFirstName} {fastestLap.driverLastName}
                  </div>
                  {fastestLap.teamLogoUrl && (
                    <img
                      src={imgSrc(fastestLap.teamLogoUrl)}
                      alt=""
                      style={{
                        height: 20,
                        width: 'auto',
                        background: '#fff',
                        padding: 2,
                        borderRadius: 3,
                      }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 8,
                    letterSpacing: '0.3em',
                    color: 'var(--text-dim)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}>
                    TIME
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 26,
                    fontWeight: 900,
                    color: '#c084fc',
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: '0 0 20px #c084fc88',
                  }}>
                    {fastestLap.fastestLapTime}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 8,
                    letterSpacing: '0.3em',
                    color: 'var(--text-dim)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}>
                    LAP
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 26,
                    fontWeight: 900,
                    color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fastestLap.fastestLapLap}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ONGLETS : CLASSIFICATION / TÉLÉMÉTRIE */}
      {hasResults && (
        <section className="container" style={{ padding: '50px 0 100px', maxWidth: 1400 }}>
          <div style={{
            display: 'flex',
            gap: 4,
            marginBottom: 24,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <button
              onClick={() => setActiveTab('results')}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '12px 20px',
                position: 'relative',
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.25em',
                fontWeight: 900,
                color: activeTab === 'results' ? '#fff' : 'var(--text-dim)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{
                width: 6, height: 6,
                background: activeTab === 'results' ? '#e10600' : 'rgba(255,255,255,0.2)',
                transform: 'rotate(45deg)',
                boxShadow: activeTab === 'results' ? '0 0 10px #e10600' : 'none',
              }} />
              ◆ CLASSIFICATION
              <span style={{
                fontSize: 9,
                color: activeTab === 'results' ? '#e10600' : 'rgba(255,255,255,0.3)',
              }}>({results.length})</span>
              {activeTab === 'results' && (
                <div style={{
                  position: 'absolute',
                  bottom: -1, left: 0, right: 0,
                  height: 2,
                  background: '#e10600',
                  boxShadow: '0 0 10px #e10600',
                }} />
              )}
            </button>

            {sessionKey && (
              <button
                onClick={() => setActiveTab('telemetry')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '12px 20px',
                  position: 'relative',
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.25em',
                  fontWeight: 900,
                  color: activeTab === 'telemetry' ? '#fff' : 'var(--text-dim)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{
                  width: 6, height: 6,
                  background: activeTab === 'telemetry' ? '#00d4ff' : 'rgba(255,255,255,0.2)',
                  transform: 'rotate(45deg)',
                  boxShadow: activeTab === 'telemetry' ? '0 0 10px #00d4ff' : 'none',
                }} />
                📊 TÉLÉMÉTRIE
                {activeTab === 'telemetry' && (
                  <div style={{
                    position: 'absolute',
                    bottom: -1, left: 0, right: 0,
                    height: 2,
                    background: '#00d4ff',
                    boxShadow: '0 0 10px #00d4ff',
                  }} />
                )}
              </button>
            )}
          </div>

          {activeTab === 'results' ? (
            <div style={{
              background: 'linear-gradient(180deg, rgba(13,13,20,0.98) 0%, rgba(5,7,10,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '44px 26px 32px 1fr 130px 80px 90px 110px',
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
                <div style={{ textAlign: 'center' }}>POS</div>
                <div></div>
                <div style={{ textAlign: 'center' }}>CODE</div>
                <div style={{ paddingLeft: 4 }}>DRIVER</div>
                <div style={{ textAlign: 'center' }}>FORM</div>
                <div style={{ textAlign: 'center' }}>FL</div>
                <div style={{ textAlign: 'right' }}>LAPS</div>
                <div style={{ textAlign: 'right' }}>POINTS</div>
              </div>

              {[...podium, ...rest].map((r, i) => (
                <ResultRow key={r.driverId} result={r} isFastestLap={r.isFastestLap} index={i} />
              ))}
            </div>
          ) : (
            <TelemetryPanel sessionKey={sessionKey} drivers={results} />
          )}
        </section>
      )}

      {/* CTA */}
      <section className="container" style={{ padding: '0 0 80px', maxWidth: 1400, textAlign: 'center' }}>
        <Link
          to="/races"
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
          ← BACK TO CALENDAR
        </Link>
      </section>

      <style>{`
        @media (max-width: 900px) {
          section[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
            max-width: 100% !important;
          }
        }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 44px 26px 32px 1fr 130px 80px 90px 110px"] {
            grid-template-columns: 40px 22px 50px 1fr 70px 70px !important;
            gap: 6px !important;
          }
        }
      `}</style>
    </div>
  );
}