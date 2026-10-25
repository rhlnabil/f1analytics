import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

/* ============================================================ */
/* ============ ✅ FLAGS — FIX COMPLET + SINGAPORE =========== */
/* ============================================================ */

const F1_COUNTRIES = new Set([
  'bh', 'sa', 'au', 'az', 'us', 'it', 'mc', 'es', 'ca', 'at',
  'gb', 'hu', 'be', 'nl', 'sg', 'jp', 'qa', 'mx', 'br', 'ae',
  'cn', 'th', 'kr', 'ar', 'nz', 'ch', 'de', 'fr', 'pt', 'tr',
  'ru', 'in', 'my', 'za', 'ma', 'se', 'fi', 'dk', 'pl', 'is',
]);

const FLAG_ALIASES = {
  uk: 'gb', gbr: 'gb', britain: 'gb', england: 'gb',
  greatbritain: 'gb', unitedkingdom: 'gb',
  usa: 'us', unitedstates: 'us', america: 'us',
  unitedstatesofamerica: 'us',
  uae: 'ae', emirates: 'ae', unitedarabemirates: 'ae', abudhabi: 'ae',
  ksa: 'sa', arabia: 'sa', saudiarabia: 'sa',
  korea: 'kr', southkorea: 'kr',
  deutschland: 'de', germany: 'de',
  italia: 'it', italy: 'it',
  espana: 'es', spain: 'es',
  nederland: 'nl', netherlands: 'nl', holland: 'nl',
  suisse: 'ch', switzerland: 'ch',
  belgie: 'be', belgique: 'be', belgium: 'be',
  osterreich: 'at', austria: 'at',
  magyaro: 'hu', hungary: 'hu',
  brasil: 'br', brazil: 'br',
  mexico: 'mx', monaco: 'mc', japan: 'jp', china: 'cn',
  australia: 'au', canada: 'ca', bahrain: 'bh',
  singapore: 'sg', singapour: 'sg',
  azerbaijan: 'az', azerbaidjan: 'az',
  qatar: 'qa', thailand: 'th', newzealand: 'nz', argentina: 'ar',
};

const CIRCUIT_TO_COUNTRY = {
  'albert park': 'au', 'melbourne': 'au',
  'shanghai': 'cn',
  'suzuka': 'jp',
  'bahrain': 'bh', 'sakhir': 'bh',
  'jeddah': 'sa', 'corniche': 'sa',
  'miami': 'us', 'hard rock': 'us',
  'austin': 'us', 'americas': 'us',
  'las vegas': 'us',
  'imola': 'it', 'enzo e dino': 'it',
  'monza': 'it',
  'monaco': 'mc',
  'catalunya': 'es', 'barcelona': 'es', 'madring': 'es',
  'gilles villeneuve': 'ca', 'montreal': 'ca',
  'silverstone': 'gb',
  'red bull ring': 'at', 'spielberg': 'at',
  'hungaroring': 'hu',
  'spa': 'be', 'francorchamps': 'be',
  'zandvoort': 'nl',
  'marina bay': 'sg', 'marina bay street': 'sg',
  'marina bay circuit': 'sg', 'marina bay street circuit': 'sg',
  'singapore': 'sg', 'singapore street': 'sg', 'singapore street circuit': 'sg',
  'baku': 'az', 'baku city': 'az', 'baku city circuit': 'az',
  'losail': 'qa', 'lusail': 'qa',
  'losail international': 'qa', 'lusail international': 'qa',
  'rodriguez': 'mx', 'mexico city': 'mx', 'hermanos rodriguez': 'mx',
  'interlagos': 'br', 'jose carlos pace': 'br',
  'yas marina': 'ae', 'yas marina circuit': 'ae', 'abu dhabi': 'ae',
  'buriram': 'th',
  'jacarepagua': 'br',
};

function normalizeFlagCode(raw) {
  if (!raw) return null;
  const c = String(raw).toLowerCase().trim().replace(/[^a-z]/g, '');
  if (c.length === 0) return null;
  if (c.length === 2) {
    const mapped = FLAG_ALIASES[c] || c;
    return F1_COUNTRIES.has(mapped) ? mapped : null;
  }
  if (FLAG_ALIASES[c]) return FLAG_ALIASES[c];
  const compact = c.replace(/\s+/g, '');
  if (FLAG_ALIASES[compact]) return FLAG_ALIASES[compact];
  return null;
}

function resolveFlagCode(race) {
  if (!race) return null;
  if (race.circuitName) {
    const name = race.circuitName.toLowerCase();
    for (const [keyword, code] of Object.entries(CIRCUIT_TO_COUNTRY)) {
      if (name.includes(keyword)) return code;
    }
  }
  if (race.circuitCountryCode) {
    const code = normalizeFlagCode(race.circuitCountryCode);
    if (code) return code;
  }
  if (race.circuitCountry) {
    const c = String(race.circuitCountry).toLowerCase().trim().replace(/\s+/g, '');
    if (FLAG_ALIASES[c]) return FLAG_ALIASES[c];
    if (c.length === 2 && F1_COUNTRIES.has(c)) return c;
  }
  if (race.name) {
    const gp = race.name.toLowerCase();
    if (gp.includes('emirates') || gp.includes('abu dhabi')) return 'ae';
    if (gp.includes('brazil') || gp.includes('brasil') || gp.includes('são paulo') || gp.includes('sao paulo')) return 'br';
    if (gp.includes('canadian')) return 'ca';
    if (gp.includes('australian')) return 'au';
    if (gp.includes('chinese')) return 'cn';
    if (gp.includes('japanese')) return 'jp';
    if (gp.includes('bahrain')) return 'bh';
    if (gp.includes('saudi')) return 'sa';
    if (gp.includes('miami')) return 'us';
    if (gp.includes('monaco')) return 'mc';
    if (gp.includes('spanish')) return 'es';
    if (gp.includes('italian')) return 'it';
    if (gp.includes('austrian')) return 'at';
    if (gp.includes('british')) return 'gb';
    if (gp.includes('hungarian')) return 'hu';
    if (gp.includes('belgian')) return 'be';
    if (gp.includes('dutch')) return 'nl';
    if (gp.includes('singapore') || gp.includes('singapour')) return 'sg';
    if (gp.includes('azerbaijan')) return 'az';
    if (gp.includes('qatar')) return 'qa';
    if (gp.includes('mexican')) return 'mx';
    if (gp.includes('united states') || gp.includes('vegas') || gp.includes('austin')) return 'us';
    if (gp.includes('thai')) return 'th';
  }
  return null;
}

function FlagImage({ code, style, className, alt = '' }) {
  const [level, setLevel] = useState(0);
  const normalized = normalizeFlagCode(code);

  if (!normalized) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background: 'rgba(255,255,255,0.08)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 8,
          fontWeight: 900,
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'var(--font-display)',
        }}
      >
        ?
      </div>
    );
  }

  const sources = [
    `/flags/${normalized}.gif`,
    `https://flagcdn.com/w320/${normalized}.png`,
    `https://flagcdn.com/${normalized}.svg`,
  ];

  if (level >= sources.length) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background: 'rgba(255,255,255,0.08)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 900,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.1em',
        }}
      >
        {normalized.toUpperCase()}
      </div>
    );
  }

  const src = sources[level];

  return (
    <img
      key={src}
      src={src}
      alt={alt || normalized.toUpperCase()}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setLevel(l => l + 1)}
    />
  );
}

/* ============================================================ */
/* ======================= HOOKS =============================== */
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
/* ============ RACE CARD ===================================== */
/* ============================================================ */

function RaceCard({ race, index }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const cardRef = useRef(null);

  const now = new Date();
  const raceDate = race.raceDate ? new Date(race.raceDate) : null;
  const isPast = raceDate && raceDate < now;
  const daysUntil = raceDate
    ? Math.ceil((raceDate - now) / (1000 * 60 * 60 * 24))
    : null;

  const monthDay = raceDate
    ? {
        day: raceDate.toLocaleDateString('fr-FR', { day: '2-digit' }),
        month: raceDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase(),
      }
    : { day: '—', month: '—' };

  const onMove = useCallback(e => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }, []);

  const statusColor = isPast ? '#00d26a' : '#ff8700';
  const statusLabel = isPast ? t('races.resultsAvailable') : t('races.upcoming');
  const roundNumber = String(race.round).padStart(2, '0');

  const flagCode = resolveFlagCode(race);
  const hasFlag = !!flagCode;
  const displayCode = flagCode ? flagCode.toUpperCase() : '';

  return (
    <Reveal delay={index * 0.04} direction="up">
      <Link
        to={`/races/${race.id}`}
        ref={cardRef}
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          display: 'block',
          textDecoration: 'none',
          color: 'inherit',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
          border: `2px solid ${hovered ? statusColor : 'rgba(255,255,255,0.08)'}`,
          transition: 'border-color 0.4s, box-shadow 0.4s, transform 0.4s cubic-bezier(0.4,0,0.2,1)',
          transform: hovered ? 'translateY(-10px)' : 'translateY(0)',
          boxShadow: hovered
            ? `0 40px 80px -20px ${statusColor}88, 0 0 60px ${statusColor}44`
            : '0 10px 30px rgba(0,0,0,0.5)',
          cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'relative',
          height: 160,
          overflow: 'hidden',
          background: `linear-gradient(135deg, #1a0505, #0a0a0a)`,
        }}>
          {hasFlag && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <FlagImage
                code={flagCode}
                alt={race.circuitCountry || displayCode}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: hovered ? 1 : 0.85,
                  filter: hovered
                    ? 'brightness(1.05) saturate(1.4) contrast(1.1)'
                    : 'brightness(0.8) saturate(1.15)',
                  transition: 'filter 0.5s, opacity 0.5s',
                }}
              />
            </div>
          )}

          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(5,7,10,0.15) 0%, rgba(5,7,10,0.5) 50%, rgba(5,7,10,0.92) 85%, #05070a 100%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'absolute',
            top: -40, right: -40,
            width: 200, height: 200,
            background: `linear-gradient(135deg, transparent 45%, ${statusColor}55 45%, ${statusColor}55 55%, transparent 55%)`,
            transform: 'rotate(15deg)',
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity 0.4s',
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(255,255,255,0.4) 0%, transparent 40%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.4s',
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }} />

          {hovered && (
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              height: 60,
              background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.45), transparent)`,
              animation: 'raceCardScan 1.6s ease-in-out infinite',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }} />
          )}

          <div style={{
            position: 'absolute',
            top: 8, right: 12,
            fontFamily: 'var(--font-display)',
            fontSize: 80,
            fontWeight: 900,
            fontStyle: 'italic',
            color: 'transparent',
            WebkitTextStroke: `1.5px rgba(255,255,255,0.3)`,
            lineHeight: 1,
            letterSpacing: '-0.06em',
            pointerEvents: 'none',
            userSelect: 'none',
            opacity: hovered ? 0.9 : 0.5,
            transition: 'opacity 0.4s',
          }}>
            {roundNumber}
          </div>

          {displayCode && (
            <div style={{
              position: 'absolute',
              top: 14, left: 14,
              padding: '6px 12px',
              background: 'rgba(0,0,0,0.85)',
              border: `2px solid ${statusColor}`,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: `0 0 20px ${statusColor}66`,
              zIndex: 3,
            }}>
              <span style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
                animation: hovered ? 'pulseDot 1s ease-in-out infinite' : 'none',
              }} />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.25em',
                color: '#fff',
              }}>
                {displayCode}
              </span>
            </div>
          )}

          {hasFlag && (
            <div style={{
              position: 'absolute',
              top: 14, right: 14,
              width: 52, height: 52,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2.5px solid ${statusColor}`,
              boxShadow: `0 0 30px ${statusColor}aa, 0 4px 12px rgba(0,0,0,0.9)`,
              background: '#0a0a0a',
              zIndex: 3,
            }}>
              <FlagImage
                code={flagCode}
                alt={race.circuitCountry || displayCode}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: hovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.4s',
                }}
              />
            </div>
          )}

          <div style={{
            position: 'absolute',
            bottom: 12, left: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            background: 'rgba(0,0,0,0.9)',
            border: `1px solid ${statusColor}88`,
            borderRadius: 4,
            fontFamily: 'var(--font-display)',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: statusColor,
            fontWeight: 900,
            zIndex: 3,
          }}>
            <span style={{
              width: 5, height: 5,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }} />
            {statusLabel}
          </div>

          <div style={{
            position: 'absolute',
            bottom: 12, right: 14,
            padding: '5px 10px',
            background: statusColor,
            borderRadius: 4,
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: '#000',
            fontWeight: 900,
            zIndex: 3,
            boxShadow: `0 0 15px ${statusColor}88`,
          }}>
            R{roundNumber}
          </div>
        </div>

        <div style={{ padding: '24px 26px 26px', position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}>
            <span style={{
              width: 6, height: 6,
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
              transform: 'rotate(45deg)',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              letterSpacing: '0.35em',
              color: 'var(--text-dim)',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              {t('races.season')} {race.season}
            </span>
          </div>

          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 26,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: '#fff',
            margin: 0,
            marginBottom: 12,
            transition: 'color 0.3s',
            textShadow: hovered ? `0 0 30px ${statusColor}88` : 'none',
          }}>
            {race.name}
          </h3>

          {race.circuitName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              color: 'var(--text-dim)',
            }}>
              <span style={{ opacity: 0.6 }}>🛣️</span>
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {race.circuitName}
              </span>
            </div>
          )}

          <div style={{
            width: hovered ? '100%' : '30%',
            height: 2,
            background: `linear-gradient(90deg, ${statusColor}, transparent)`,
            boxShadow: hovered ? `0 0 15px ${statusColor}` : 'none',
            marginBottom: 20,
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s',
          }} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 12,
            alignItems: 'center',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 14px',
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${hovered ? `${statusColor}66` : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
              transition: 'border-color 0.4s',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30,
                fontWeight: 900,
                color: statusColor,
                lineHeight: 1,
                textShadow: `0 0 15px ${statusColor}88`,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {monthDay.day}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  fontWeight: 900,
                  color: '#fff',
                  letterSpacing: '0.1em',
                }}>
                  {monthDay.month}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 8,
                  color: 'var(--text-dim)',
                  letterSpacing: '0.2em',
                  fontWeight: 700,
                }}>
                  {race.season}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              {isPast ? (
                <>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 8,
                    letterSpacing: '0.2em',
                    color: 'var(--text-dim)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}>
                    {t('races.status')}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: 900,
                    color: '#00d26a',
                    letterSpacing: '0.15em',
                  }}>
                    {t('races.finished')} ✓
                  </div>
                </>
              ) : daysUntil != null && daysUntil >= 0 ? (
                <>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 8,
                    letterSpacing: '0.2em',
                    color: 'var(--text-dim)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}>
                    {t('races.inDays')}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: daysUntil === 0 ? 14 : 22,
                    fontWeight: 900,
                    color: '#ff8700',
                    letterSpacing: '0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: '0 0 12px rgba(255,135,0,0.5)',
                  }}>
                    {daysUntil === 0
                      ? t('races.today')
                      : daysUntil === 1
                      ? t('races.tomorrow')
                      : `${daysUntil}${t('races.days')}`}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px dashed rgba(255,255,255,0.1)',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9,
              letterSpacing: '0.35em',
              color: hovered ? statusColor : 'var(--text-dim)',
              fontWeight: 700,
              transition: 'color 0.3s',
            }}>
              {hovered
                ? `◆ ${isPast ? t('races.viewResults') : t('races.viewDetail')}`
                : `◆ ${t('races.detail')}`}
            </span>
            <span style={{
              fontSize: 20,
              color: statusColor,
              transform: hovered ? 'translateX(8px)' : 'translateX(0)',
              transition: 'transform 0.4s',
              textShadow: hovered ? `0 0 15px ${statusColor}` : 'none',
            }}>
              →
            </span>
          </div>
        </div>
      </Link>

      <style>{`
        @keyframes raceCardScan {
          0%   { top: -60px; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
      `}</style>
    </Reveal>
  );
}

/* ============================================================ */
/* ============ MAIN COMPONENT ================================ */
/* ============================================================ */

export default function Races() {
  const { t } = useTranslation();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [heroVisible, setHeroVisible] = useState(false);

  const parallax = useMouseParallax(12);

  useEffect(() => {
    api.get('/races')
      .then(r => setRaces(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => setHeroVisible(true), 200);
  }, [loading]);

  const raceCount = useCountUp(races.length, 1200, heroVisible);

  const formatted = useMemo(() => {
    const now = new Date();
    return races.map(r => {
      const raceDate = r.raceDate ? new Date(r.raceDate) : null;
      const isPast = raceDate && raceDate < now;
      return { ...r, isPast, raceDateObj: raceDate };
    }).sort((a, b) => a.round - b.round);
  }, [races]);

  const filtered = useMemo(() => {
    let result = formatted;
    if (activeTab === 'upcoming') result = result.filter(r => !r.isPast);
    else if (activeTab === 'completed') result = result.filter(r => r.isPast);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.circuitName || '').toLowerCase().includes(q) ||
        (r.circuitCountry || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [formatted, activeTab, search]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      all: formatted.length,
      upcoming: formatted.filter(r => !(r.raceDate && new Date(r.raceDate) < now)).length,
      completed: formatted.filter(r => r.raceDate && new Date(r.raceDate) < now).length,
    };
  }, [formatted]);

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
        @keyframes speedLine {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
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
          backgroundImage: `
            linear-gradient(rgba(225,6,0,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225,6,0,0.06) 1px, transparent 1px)
          `,
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
            linear-gradient(45deg, rgba(225,6,0,0.2) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(225,6,0,0.2) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(225,6,0,0.2) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(225,6,0,0.2) 75%)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          animation: 'checkeredSlide 3s linear infinite',
          opacity: 0.9,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.4 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${15 + i * 14}%`,
              left: 0, right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${i % 2 ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.15)'}, transparent)`,
              animation: `speedLine ${4 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
            }} />
          ))}
        </div>

        <div className="container" style={{
          position: 'relative',
          maxWidth: 1400,
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
                {t('races.label')}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 900,
              lineHeight: 0.9,
              marginBottom: 20,
              letterSpacing: '-0.03em',
            }}>
              {t('races.title1').toUpperCase()}{' '}
              <span style={{
                color: 'var(--f1-red)',
                fontStyle: 'italic',
                textShadow: '0 0 40px rgba(225,6,0,0.5)',
              }}>
                {t('races.title2').toUpperCase()}
              </span>
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', marginTop: 24 }}>
              <p style={{
                color: 'var(--text-mid)', fontSize: 17,
                margin: 0, fontFamily: 'var(--font-heading)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28, fontWeight: 900,
                  color: 'var(--f1-red)',
                  marginRight: 10,
                }}>
                  {raceCount}
                </span>
                {t('races.count', { count: races.length })}
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
                {counts.completed} {t('races.completed')}
              </div>
            </div>

            <div style={{
              marginTop: 40,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 420 }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('races.searchPlaceholder')}
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

              <div style={{
                display: 'flex',
                gap: 4,
                padding: 4,
                background: 'rgba(10,10,15,0.9)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}>
                {[
                  { id: 'all', label: t('races.all'), count: counts.all },
                  { id: 'upcoming', label: t('races.upcoming'), count: counts.upcoming },
                  { id: 'completed', label: t('races.completed'), count: counts.completed },
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        padding: '10px 16px',
                        background: isActive ? 'var(--f1-red)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-dim)',
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        fontWeight: 900,
                        borderRadius: 6,
                        transition: 'all 0.25s',
                        boxShadow: isActive ? '0 0 20px rgba(225,6,0,0.4)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {tab.label}
                      <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 700 }}>
                        ({tab.count})
                      </span>
                    </button>
                  );
                })}
              </div>
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
      </section>

      <section className="container" style={{ padding: '40px 32px 100px', maxWidth: 1400 }}>
        {races.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🏁</div>
            <h3 style={{ color: 'var(--text-dim)', marginBottom: 8 }}>
              {t('races.noRaces')}
            </h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>🔍</div>
            <h3 style={{ color: 'var(--text-dim)', marginBottom: 8 }}>
              {t('common.noResults')}
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              {t('races.noRaces')}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 28,
          }}>
            {filtered.map((r, idx) => (
              <RaceCard key={r.id} race={r} index={idx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}