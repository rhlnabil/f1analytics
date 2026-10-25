import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { imgSrc, flagSrc } from '../../utils/images';

/* ============================================================ */
/* ============ FLAG IMAGE =================================== */
/* ============================================================ */
const flagFallback = (code) => `https://flagcdn.com/w320/${code.toLowerCase()}.png`;

function FlagImage({ code, style }) {
  if (!code) return null;
  return (
    <img
      src={flagSrc(code)}
      alt={code}
      style={style}
      onError={e => {
        if (!e.target.dataset.fallback) {
          e.target.dataset.fallback = '1';
          e.target.src = flagFallback(code);
        } else {
          e.target.style.display = 'none';
        }
      }}
    />
  );
}

/* ============================================================ */
/* ============ MODAL DE PRONOSTIC ============================ */
/* ============================================================ */
function PredictionModal({ race, existing, drivers, onClose, onSave, onPrev, onNext, hasPrev, hasNext }) {
  const [p1, setP1] = useState(existing?.p1DriverId || '');
  const [p2, setP2] = useState(existing?.p2DriverId || '');
  const [p3, setP3] = useState(existing?.p3DriverId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selected = useMemo(() => {
    const find = (id) => drivers.find(d => String(d.id) === String(id));
    return { p1: find(p1), p2: find(p2), p3: find(p3) };
  }, [p1, p2, p3, drivers]);

  const handleSave = async () => {
    setError('');
    if (!p1 || !p2 || !p3) { setError('Choisis les 3 pilotes'); return; }
    if (new Set([p1, p2, p3]).size !== 3) { setError('Tu dois choisir 3 pilotes différents'); return; }
    setSaving(true);
    try {
      await api.post('/fan/predictions', {
        raceId: race.id,
        p1DriverId: Number(p1),
        p2DriverId: Number(p2),
        p3DriverId: Number(p3),
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const renderSlot = (place, driver, color, label) => {
    if (!driver) {
      return (
        <div style={{
          padding: '20px',
          background: 'rgba(0,0,0,0.5)',
          border: `2px dashed ${color}44`,
          borderRadius: 10, textAlign: 'center', minHeight: 140,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <div style={{ fontSize: 32, opacity: 0.3 }}>👤</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 9,
            letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', fontWeight: 700,
          }}>{label}</div>
        </div>
      );
    }
    return (
      <div style={{
        padding: '16px',
        background: `linear-gradient(180deg, ${driver.teamColor || '#666'}22 0%, rgba(0,0,0,0.5) 100%)`,
        border: `2px solid ${color}`,
        borderRadius: 10, textAlign: 'center',
        boxShadow: `0 0 20px ${color}33`,
      }}>
        <div style={{
          width: 60, height: 60, margin: '0 auto 10px',
          borderRadius: '50%', overflow: 'hidden',
          border: `2px solid ${color}`, background: '#0a0a0a',
        }}>
          {driver.actionPhotoUrl || driver.photoUrl ? (
            <img src={imgSrc(driver.actionPhotoUrl || driver.photoUrl)} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900,
              color: driver.teamColor,
            }}>{driver.lastName?.[0] || '?'}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
          {driver.countryCode && <FlagImage code={driver.countryCode} style={{ height: 12, width: 'auto', borderRadius: 2 }} />}
          <div style={{
            fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 900,
            textTransform: 'uppercase', color: '#fff',
          }}>{driver.lastName}</div>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 8, letterSpacing: '0.2em',
          color: driver.teamColor || 'var(--text-dim)',
          fontWeight: 700, textTransform: 'uppercase',
        }}>{driver.teamName || '—'}</div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(3,3,8,0.95)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, overflow: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: 720,
        background: 'linear-gradient(160deg, rgba(13,13,20,0.98) 0%, rgba(5,7,10,0.98) 100%)',
        border: '1px solid rgba(225,6,0,0.3)',
        borderRadius: 16, padding: 32,
        boxShadow: '0 40px 100px -20px rgba(0,0,0,0.9), 0 0 80px rgba(225,6,0,0.15)',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}>×</button>

        {/* Prev / Next nav */}
        <div style={{
          position: 'absolute', top: 20, left: 20,
          display: 'flex', gap: 8,
        }}>
          <button onClick={onPrev} disabled={!hasPrev} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: hasPrev ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${hasPrev ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: hasPrev ? '#e10600' : 'rgba(255,255,255,0.3)',
            fontSize: 16, fontWeight: 900,
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            display: 'grid', placeItems: 'center', padding: 0,
          }}>‹</button>
          <button onClick={onNext} disabled={!hasNext} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: hasNext ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${hasNext ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: hasNext ? '#e10600' : 'rgba(255,255,255,0.3)',
            fontSize: 16, fontWeight: 900,
            cursor: hasNext ? 'pointer' : 'not-allowed',
            display: 'grid', placeItems: 'center', padding: 0,
          }}>›</button>
        </div>

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.4em',
          color: '#e10600', fontWeight: 700, marginBottom: 8, marginTop: 8,
        }}>
          ◆ PRONOSTIC {race.season} R{String(race.round).padStart(2, '0')} ◆
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 900,
          textTransform: 'uppercase', color: '#fff', marginBottom: 24,
          letterSpacing: '-0.01em',
        }}>{race.name}</h2>

        {/* Podium slots */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { key: 'p1', place: 1, color: '#FFD700', label: '🥇 P1', value: p1, setter: setP1, driver: selected.p1 },
            { key: 'p2', place: 2, color: '#C0C0C0', label: '🥈 P2', value: p2, setter: setP2, driver: selected.p2 },
            { key: 'p3', place: 3, color: '#CD7F32', label: '🥉 P3', value: p3, setter: setP3, driver: selected.p3 },
          ].map(slot => (
            <div key={slot.key}>
              <div style={{
                textAlign: 'center', marginBottom: 10,
                fontFamily: 'var(--font-display)', fontSize: 10,
                letterSpacing: '0.3em', color: slot.color, fontWeight: 900,
              }}>{slot.label}</div>
              {renderSlot(slot.place, slot.driver, slot.color, `P${slot.place}`)}
              <select
                value={slot.value}
                onChange={e => slot.setter(e.target.value)}
                style={{
                  width: '100%', marginTop: 10, padding: '10px 12px',
                  background: 'rgba(20,20,26,0.9)',
                  border: `1px solid ${slot.color}66`,
                  borderRadius: 6, color: '#fff',
                  fontFamily: 'var(--font-heading)', fontSize: 13, outline: 'none',
                }}
              >
                <option value="">— Choisir P{slot.place} —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>#{d.number} {d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Points explain */}
        <div style={{
          padding: '14px 18px', background: 'rgba(225,6,0,0.08)',
          border: '1px solid rgba(225,6,0,0.25)',
          borderRadius: 8, marginBottom: 20,
          fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--text-mid)',
        }}>
          🥇 Bon P1 → <strong style={{ color: '#FFD700' }}>10 pts</strong> ·
          🥈 Bon P2 → <strong style={{ color: '#C0C0C0' }}>5 pts</strong> ·
          🥉 Bon P3 → <strong style={{ color: '#CD7F32' }}>3 pts</strong> ·
          🎯 3/3 → <strong style={{ color: '#e10600' }}>+20 pts bonus</strong>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'rgba(255,85,85,0.1)',
            border: '1px solid rgba(255,85,85,0.4)',
            borderRadius: 6, marginBottom: 16,
            color: '#ff5555', fontSize: 13, fontFamily: 'var(--font-heading)',
          }}>{error}</div>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '16px',
          background: saving ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #e10600 0%, #b80500 100%)',
          border: 'none', borderRadius: 8, color: '#fff',
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900,
          letterSpacing: '0.25em', cursor: saving ? 'wait' : 'pointer',
          clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
          boxShadow: saving ? 'none' : '0 4px 20px rgba(225,6,0,0.4)',
        }}>
          {saving ? '⟳ VALIDATION...' : existing ? '◆ MODIFIER MON PRONOSTIC' : '◆ VALIDER MON PRONOSTIC'}
        </button>
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ PREDICTION CARD =============================== */
/* ============================================================ */
function PredictionCard({ prediction, onClick, locked }) {
  const [hovered, setHovered] = useState(false);
  const isPast = prediction.isLocked;
  const accent = prediction.isScored
    ? (prediction.perfect ? '#FFD700' : '#00d26a')
    : (isPast ? '#8a8a95' : '#e10600');

  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        all: 'unset', cursor: locked ? 'default' : 'pointer',
        display: 'block', width: '100%',
        background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
        border: `2px solid ${hovered ? accent : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12, padding: 24,
        transition: 'all 0.3s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 20px 40px -15px ${accent}88` : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accent, boxShadow: `0 0 15px ${accent}`,
      }} />

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 14, gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 9,
              letterSpacing: '0.25em', color: accent, fontWeight: 900,
            }}>R{String(prediction.raceRound).padStart(2, '0')}</span>
            {prediction.circuitCountryCode && (
              <FlagImage code={prediction.circuitCountryCode} style={{ height: 14, width: 'auto', borderRadius: 2 }} />
            )}
          </div>
          <div style={{
            fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900,
            textTransform: 'uppercase', color: '#fff', lineHeight: 1.1,
          }}>{prediction.raceName}</div>
          <div style={{
            marginTop: 6, fontFamily: 'var(--font-display)',
            fontSize: 10, letterSpacing: '0.15em',
            color: 'var(--text-dim)', fontWeight: 700,
          }}>
            {prediction.raceDate
              ? new Date(prediction.raceDate).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                }).toUpperCase()
              : '—'}
          </div>
        </div>
        <div style={{
          padding: '4px 10px', background: `${accent}22`,
          border: `1px solid ${accent}88`, borderRadius: 4,
          fontFamily: 'var(--font-display)', fontSize: 8,
          letterSpacing: '0.2em', fontWeight: 900,
          color: accent, whiteSpace: 'nowrap',
        }}>
          {prediction.isScored
            ? (prediction.perfect ? '🏆 3/3' : '✓ SCORÉ')
            : (isPast ? '🔒 FERMÉ' : '◆ OUVERT')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { p: 'p1', label: 'P1', color: '#FFD700', ok: prediction.p1Correct },
          { p: 'p2', label: 'P2', color: '#C0C0C0', ok: prediction.p2Correct },
          { p: 'p3', label: 'P3', color: '#CD7F32', ok: prediction.p3Correct },
        ].map(({ p, label, color, ok }) => {
          const name = prediction[`${p}DriverName`];
          const photo = prediction[`${p}DriverPhotoUrl`];
          const teamColor = prediction[`${p}TeamColor`];
          const isCorrect = ok === true;
          const isWrong = ok === false;
          return (
            <div key={p} style={{
              padding: '8px 6px',
              background: isWrong ? 'rgba(255,85,85,0.1)' : (isCorrect ? 'rgba(0,210,106,0.1)' : 'rgba(0,0,0,0.4)'),
              border: `1px solid ${isWrong ? '#ff5555' : (isCorrect ? '#00d26a' : color + '33')}`,
              borderRadius: 6, textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 7,
                letterSpacing: '0.2em', color, fontWeight: 900, marginBottom: 4,
              }}>{label} {isCorrect ? '✓' : isWrong ? '✗' : ''}</div>
              <div style={{
                width: 32, height: 32, margin: '0 auto 4px',
                borderRadius: '50%', overflow: 'hidden',
                border: `1.5px solid ${color}88`, background: '#0a0a0a',
              }}>
                {photo ? (
                  <img src={imgSrc(photo)} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900, color: teamColor,
                  }}>{name?.[0] || '?'}</div>
                )}
              </div>
              <div style={{
                fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 700,
                color: '#fff', textTransform: 'uppercase',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{name?.split(' ').pop() || '—'}</div>
            </div>
          );
        })}
      </div>

      {prediction.isScored ? (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.1)',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 10,
            letterSpacing: '0.2em', color: 'var(--text-dim)', fontWeight: 700,
          }}>POINTS GAGNÉS</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900,
            color: accent, textShadow: `0 0 15px ${accent}88`,
          }}>+{prediction.pointsEarned} PTS</span>
        </div>
      ) : (
        <div style={{
          paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.1)',
          textAlign: 'center',
          fontFamily: 'var(--font-display)', fontSize: 9,
          letterSpacing: '0.3em',
          color: isPast ? 'var(--text-dim)' : accent,
          fontWeight: 700,
        }}>
          {isPast ? '◆ EN ATTENTE DES RÉSULTATS' : '◆ CLIQUE POUR MODIFIER'}
        </div>
      )}
    </button>
  );
}

/* ============================================================ */
/* ============ LEADERBOARD ROW =============================== */
/* ============================================================ */
function LeaderboardRow({ entry, index }) {
  const medalColor =
    entry.rank === 1 ? '#FFD700' :
    entry.rank === 2 ? '#C0C0C0' :
    entry.rank === 3 ? '#CD7F32' : null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '60px 48px 1fr 90px 90px 100px',
      alignItems: 'center', gap: 16, padding: '14px 20px',
      background: entry.isCurrentUser ? 'linear-gradient(90deg, rgba(225,6,0,0.15) 0%, transparent 100%)' : 'transparent',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      borderLeft: entry.isCurrentUser ? '3px solid #e10600' : '3px solid transparent',
      animation: `lbRowIn 0.4s ease ${index * 0.03}s both`,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, fontStyle: 'italic',
        color: medalColor || 'rgba(255,255,255,0.5)',
        textShadow: medalColor ? `0 0 15px ${medalColor}88` : 'none',
        textAlign: 'center',
      }}>{entry.rank}</div>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
        border: `2px solid ${medalColor || 'rgba(255,255,255,0.15)'}`, background: '#0a0a0a',
      }}>
        {entry.avatarUrl ? (
          <img src={imgSrc(entry.avatarUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, color: '#e10600',
          }}>{entry.username?.[0]?.toUpperCase() || '?'}</div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 900,
          color: '#fff', textTransform: 'uppercase',
        }}>
          @{entry.username}
          {entry.isCurrentUser && (
            <span style={{
              marginLeft: 8, padding: '2px 8px', background: '#e10600', color: '#fff',
              borderRadius: 3, fontFamily: 'var(--font-display)',
              fontSize: 8, letterSpacing: '0.15em', fontWeight: 900,
            }}>TOI</span>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.7)' }}>
          {entry.predictionsCount}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, letterSpacing: '0.2em', color: 'var(--text-dim)', fontWeight: 700 }}>
          PRONOS
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 900,
          color: entry.perfectCount > 0 ? '#FFD700' : 'rgba(255,255,255,0.3)',
          textShadow: entry.perfectCount > 0 ? '0 0 10px #FFD70066' : 'none',
        }}>🏆 {entry.perfectCount}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, letterSpacing: '0.2em', color: 'var(--text-dim)', fontWeight: 700 }}>
          PARFAITS
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900,
          color: medalColor || '#e10600',
          textShadow: `0 0 15px ${medalColor || '#e10600'}66`,
        }}>{entry.totalPoints}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, letterSpacing: '0.2em', color: 'var(--text-dim)', fontWeight: 700 }}>
          PTS
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ MAIN COMPONENT ================================ */
/* ============================================================ */
export default function Predictions() {
  const [tab, setTab] = useState('upcoming');
  const [races, setRaces] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIndex, setModalIndex] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [rRes, pRes, lRes, dRes] = await Promise.all([
        api.get('/races'),
        api.get('/fan/predictions'),
        api.get('/fan/predictions/leaderboard'),
        api.get('/drivers'),
      ]);
      setRaces(rRes.data || []);
      setPredictions(pRes.data || []);
      setLeaderboard(lRes.data || []);
      setDrivers(dRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const predictionsMap = useMemo(() => {
    const map = {};
    predictions.forEach(p => { map[p.raceId] = p; });
    return map;
  }, [predictions]);

  const upcomingRaces = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return races
      .filter(r => r.raceDate && new Date(r.raceDate) >= today)
      .sort((a, b) => new Date(a.raceDate) - new Date(b.raceDate));
  }, [races]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 100, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)', color: 'var(--f1-red)', letterSpacing: '0.3em',
        }}>CHARGEMENT...</div>
      </div>
    );
  }

  const modalRace = modalIndex !== null ? upcomingRaces[modalIndex] : null;

  /* ✅ TABS CONFIG avec icônes */
  const TABS = [
    { id: 'upcoming', icon: '📅', label: 'À venir', sublabel: 'Pronostiquer', count: upcomingRaces.length, color: '#e10600' },
    { id: 'mine', icon: '🎯', label: 'Mes pronostics', sublabel: 'Historique', count: predictions.length, color: '#00d26a' },
    { id: 'leaderboard', icon: '🏆', label: 'Classement', sublabel: 'Top fans', count: leaderboard.length, color: '#FFD700' },
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <style>{`
        @keyframes lbRowIn {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* ============================================================ */}
      {/* ============ HERO ========================================= */}
      {/* ============================================================ */}
      <section className="container" style={{ padding: '60px 32px 30px', maxWidth: 1400 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 24, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 11,
              letterSpacing: '0.4em', color: '#e10600', fontWeight: 700, marginBottom: 12,
            }}>◆ PRONOSTICS</div>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 900, lineHeight: 0.95,
              letterSpacing: '-0.03em', marginBottom: 16, color: '#fff',
            }}>
              La course aux <span style={{ color: '#e10600', fontStyle: 'italic' }}>pronostics</span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-heading)', fontSize: 16,
              color: 'var(--text-mid)', maxWidth: 600, lineHeight: 1.6,
            }}>
              Prédit le podium de chaque Grand Prix avant la course. Gagne des points,
              grimpe dans le classement et deviens le fan le plus clairvoyant.
            </p>
          </div>

          {/* ✅ BOUTON RETOUR DASHBOARD */}
          <Link to="/fan" style={{
            padding: '12px 22px',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(225,6,0,0.6)',
            borderRadius: 8, color: '#e10600',
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            fontSize: 12, letterSpacing: '0.15em',
            textTransform: 'uppercase', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 0 20px rgba(225,6,0,0.2)',
          }}>
            ← Mon espace
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============ TABS — GROS BOUTONS VISIBLES ================== */}
      {/* ============================================================ */}
      <section className="container" style={{ padding: '0 32px 40px', maxWidth: 1400 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {TABS.map(t => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '20px 22px',
                  background: isActive
                    ? `linear-gradient(135deg, ${t.color}33 0%, ${t.color}11 100%)`
                    : 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
                  border: `2px solid ${isActive ? t.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: isActive
                    ? `0 10px 40px -10px ${t.color}, 0 0 30px ${t.color}44`
                    : '0 4px 12px rgba(0,0,0,0.4)',
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                  overflow: 'hidden',
                  clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
                }}
                onMouseEnter={e => {
                  if (isActive) return;
                  e.currentTarget.style.borderColor = `${t.color}66`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  if (isActive) return;
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Barre latérale colorée si actif */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0, top: 12, bottom: 12,
                    width: 3,
                    background: t.color,
                    boxShadow: `0 0 12px ${t.color}`,
                    borderRadius: 2,
                  }} />
                )}

                <div style={{
                  fontSize: 32,
                  lineHeight: 1,
                  filter: isActive
                    ? `drop-shadow(0 0 12px ${t.color})`
                    : 'grayscale(0.6)',
                  transition: 'filter 0.3s',
                }}>
                  {t.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 16,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: isActive ? '#fff' : 'var(--text-mid)',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                    marginBottom: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{t.label}</div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    color: isActive ? t.color : 'var(--text-dim)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>{t.sublabel}</div>
                </div>

                <div style={{
                  minWidth: 44, height: 44,
                  padding: '0 10px',
                  borderRadius: 10,
                  background: isActive ? t.color : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isActive ? t.color : 'rgba(255,255,255,0.08)'}`,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 18, fontWeight: 900,
                  color: isActive ? '#000' : 'var(--text-dim)',
                  boxShadow: isActive ? `0 0 20px ${t.color}88` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {t.count}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============ CONTENT ======================================= */}
      {/* ============================================================ */}
      <section className="container" style={{ padding: '0 32px', maxWidth: 1400 }}>
        {error && (
          <div style={{
            padding: '14px 20px', marginBottom: 20,
            background: 'rgba(255,85,85,0.1)',
            border: '1px solid rgba(255,85,85,0.3)',
            borderRadius: 8, color: '#ff5555',
            fontFamily: 'var(--font-display)', fontSize: 11,
          }}>⚠ {error}</div>
        )}

        {/* ============ À VENIR ============ */}
        {tab === 'upcoming' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11, letterSpacing: '0.35em',
                color: '#e10600', fontWeight: 900,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 6, height: 6, background: '#e10600', transform: 'rotate(45deg)', boxShadow: '0 0 8px #e10600' }} />
                PROCHAINS GP ({upcomingRaces.length})
              </h2>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12, color: 'var(--text-dim)',
              }}>
                Clique sur une course pour pronostiquer
              </div>
            </div>

            {upcomingRaces.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🏁</div>
                <h3 style={{ color: 'var(--text-dim)' }}>Aucune course à venir</h3>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 20,
              }}>
                {upcomingRaces.map((r, idx) => {
                  const existing = predictionsMap[r.id];
                  return (
                    <PredictionCard
                      key={r.id}
                      prediction={existing || {
                        raceId: r.id,
                        raceName: r.name,
                        raceRound: r.round,
                        raceSeason: r.season,
                        raceDate: r.raceDate,
                        circuitName: r.circuitName,
                        circuitCountryCode: r.circuitCountryCode,
                        isLocked: false,
                        isScored: false,
                      }}
                      onClick={() => setModalIndex(idx)}
                      locked={false}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ MES PRONOSTICS ============ */}
        {tab === 'mine' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11, letterSpacing: '0.35em',
                color: '#00d26a', fontWeight: 900,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 6, height: 6, background: '#00d26a', transform: 'rotate(45deg)', boxShadow: '0 0 8px #00d26a' }} />
                TOUS MES PRONOSTICS ({predictions.length})
              </h2>
              <button onClick={() => setTab('upcoming')} style={{
                padding: '8px 16px',
                background: 'rgba(225,6,0,0.15)',
                border: '1px solid rgba(225,6,0,0.5)',
                borderRadius: 6, color: '#e10600',
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: 11, letterSpacing: '0.12em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}>
                + Nouveau pronostic
              </button>
            </div>

            {predictions.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🎯</div>
                <h3 style={{ color: 'var(--text-dim)', marginBottom: 8 }}>Aucun pronostic</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20 }}>
                  Va dans "À venir" et pronostique ton premier podium.
                </p>
                <button onClick={() => setTab('upcoming')} style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #e10600, #b80500)',
                  border: 'none', borderRadius: 6, color: '#fff',
                  fontFamily: 'var(--font-heading)', fontWeight: 700,
                  fontSize: 12, letterSpacing: '0.15em',
                  textTransform: 'uppercase', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(225,6,0,0.4)',
                }}>
                  ◆ Voir les GP à venir
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 20,
              }}>
                {predictions.map(p => {
                  const idx = upcomingRaces.findIndex(r => r.id === p.raceId);
                  return (
                    <PredictionCard
                      key={p.id}
                      prediction={p}
                      onClick={() => {
                        if (p.isLocked) return;
                        if (idx >= 0) setModalIndex(idx);
                      }}
                      locked={p.isLocked}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ LEADERBOARD ============ */}
        {tab === 'leaderboard' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11, letterSpacing: '0.35em',
                color: '#FFD700', fontWeight: 900,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 6, height: 6, background: '#FFD700', transform: 'rotate(45deg)', boxShadow: '0 0 8px #FFD700' }} />
                CLASSEMENT GLOBAL ({leaderboard.length})
              </h2>
            </div>

            {leaderboard.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🏆</div>
                <h3 style={{ color: 'var(--text-dim)' }}>Aucun pronostic scoré pour le moment</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 8 }}>
                  Le classement apparaîtra après les premières courses.
                </p>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(180deg, rgba(13,13,20,0.98) 0%, rgba(5,7,10,0.98) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, overflow: 'hidden',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 48px 1fr 90px 90px 100px',
                  alignItems: 'center', gap: 16,
                  padding: '12px 20px',
                  background: 'linear-gradient(90deg, rgba(255,215,0,0.12) 0%, rgba(5,7,10,0.98) 60%)',
                  borderBottom: '1px solid rgba(255,215,0,0.3)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 8, letterSpacing: '0.25em',
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 700, textTransform: 'uppercase',
                }}>
                  <div style={{ textAlign: 'center' }}>RANG</div>
                  <div></div>
                  <div>FAN</div>
                  <div style={{ textAlign: 'center' }}>PRONOS</div>
                  <div style={{ textAlign: 'center' }}>PARFAITS</div>
                  <div style={{ textAlign: 'right' }}>POINTS</div>
                </div>
                {leaderboard.map((entry, i) => (
                  <LeaderboardRow key={entry.userId} entry={entry} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* ============ MODAL ========================================= */}
      {/* ============================================================ */}
      {modalRace && (
        <PredictionModal
          race={modalRace}
          existing={predictionsMap[modalRace.id]}
          drivers={drivers}
          onClose={() => setModalIndex(null)}
          onSave={() => { setModalIndex(null); load(); }}
          onPrev={() => modalIndex > 0 && setModalIndex(modalIndex - 1)}
          onNext={() => modalIndex < upcomingRaces.length - 1 && setModalIndex(modalIndex + 1)}
          hasPrev={modalIndex > 0}
          hasNext={modalIndex < upcomingRaces.length - 1}
        />
      )}
    </div>
  );
}