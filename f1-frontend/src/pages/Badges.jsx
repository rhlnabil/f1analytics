import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBadges, driverToMeta } from '../context/BadgeContext';
import { BADGES, BADGE_CATEGORIES, RARITY } from '../utils/badges';
import Badge3D from '../components/Badge3D';
import BadgeShowcase from '../components/BadgeShowcase';

const ACCENT = '#e10600';

export default function BadgesPage() {
  const { badges, drivers, count, total, loading, getRarity } = useBadges();
  const [showcase, setShowcase] = useState(null); // { badgeId, driverId }
  const [filterDriver, setFilterDriver] = useState('all');

  if (loading) {
    return (
      <div className="container" style={{ padding: 100, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)', color: ACCENT,
          letterSpacing: '0.3em', fontSize: 11, fontWeight: 700,
        }}>◆ CHARGEMENT DES CARTES...</div>
      </div>
    );
  }

  /* ✅ Total CARTES = badges débloqués × pilotes */
  const unlockedBadges = Object.values(BADGES).filter(b => badges[b.id]);
  const totalCards = unlockedBadges.length * drivers.length;
  const collectionTotal = total * drivers.length;

  const byCategory = Object.entries(BADGE_CATEGORIES).map(([key, cat]) => ({
    key, ...cat,
    badges: Object.values(BADGES).filter(b => b.category === key),
    unlockedCount: Object.values(BADGES).filter(b => b.category === key && badges[b.id]).length,
  }));

  const progressPct = collectionTotal > 0
    ? Math.round((totalCards / collectionTotal) * 100)
    : 0;

  /* ✅ Pilotes affichés (filtre optionnel) */
  const visibleDrivers = filterDriver === 'all'
    ? drivers
    : drivers.filter(d => String(d.teamId) === String(filterDriver));

  /* ✅ Groupes d'écuries pour le filtre */
  const uniqueTeams = Array.from(
    new Map(drivers.map(d => [d.teamId, {
      id: d.teamId,
      name: d.teamName,
      color: d.teamColor,
    }])).values()
  ).filter(t => t.id != null);

  /* ✅ Card cliquée pour la vue détail */
  const showcaseBadge = showcase ? BADGES[showcase.badgeId] : null;
  const showcaseDriver = showcase
    ? drivers.find(d => d.id === showcase.driverId)
    : null;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100, position: 'relative' }}>
      <style>{`
        @keyframes badgesFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ============================================================ */}
      {/* ============ HERO ========================================= */}
      {/* ============================================================ */}
      <section style={{
        position: 'relative', padding: '80px 32px 40px', overflow: 'hidden',
        background: `radial-gradient(ellipse at top, ${ACCENT}22 0%, transparent 60%)`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${ACCENT}08 1px, transparent 1px), linear-gradient(90deg, ${ACCENT}08 1px, transparent 1px)`,
          backgroundSize: '60px 60px', opacity: 0.5, pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', maxWidth: 1400 }}>
          <Link to="/fan" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'var(--text-dim)', fontSize: 11,
            fontFamily: 'var(--font-display)', fontWeight: 700,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            marginBottom: 24, textDecoration: 'none',
          }}>← Mon espace</Link>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', gap: 24, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 10,
                letterSpacing: '0.4em', color: ACCENT, fontWeight: 700, marginBottom: 12,
              }}>◆ COLLECTION</div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(40px, 7vw, 80px)',
                fontWeight: 900, lineHeight: 0.9,
                letterSpacing: '-0.03em', marginBottom: 16,
                color: '#fff', textTransform: 'uppercase',
              }}>
                Mes <span style={{
                  color: ACCENT, fontStyle: 'italic',
                  textShadow: `0 0 40px ${ACCENT}88`,
                }}>cartes 3D</span>
              </h1>
              <p style={{
                fontFamily: 'var(--font-heading)', fontSize: 15,
                color: 'var(--text-mid)', maxWidth: 640,
              }}>
                <strong style={{ color: '#fff' }}>{unlockedBadges.length}</strong> badge{unlockedBadges.length > 1 ? 's' : ''} débloqué{unlockedBadges.length > 1 ? 's' : ''} ·{' '}
                <strong style={{ color: ACCENT }}>{drivers.length}</strong> pilote{drivers.length > 1 ? 's' : ''} chacun{' '}
                → <strong style={{ color: ACCENT }}>{totalCards}</strong> cartes sur {collectionTotal}
                {' · '}{progressPct}% de complétion
              </p>
            </div>

            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="52"
                  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle cx="60" cy="60" r="52"
                  fill="none" stroke={ACCENT} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - totalCards / Math.max(collectionTotal, 1))}
                  style={{
                    filter: `drop-shadow(0 0 10px ${ACCENT})`,
                    transition: 'stroke-dashoffset 1s ease',
                  }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 24, fontWeight: 900,
                color: '#fff',
                textShadow: `0 0 20px ${ACCENT}`,
              }}>{progressPct}%</div>
            </div>
          </div>

          {/* ✅ Filtre par écurie */}
          {uniqueTeams.length > 0 && (
            <div style={{
              display: 'flex', gap: 6, flexWrap: 'wrap',
              marginTop: 32, paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <button
                onClick={() => setFilterDriver('all')}
                style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '6px 14px',
                  background: filterDriver === 'all' ? ACCENT : 'rgba(0,0,0,0.5)',
                  border: `1px solid ${filterDriver === 'all' ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6,
                  fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 900,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: '#fff',
                }}
              >
                TOUS · {drivers.length}
              </button>
              {uniqueTeams.map(t => {
                const teamCount = drivers.filter(d => String(d.teamId) === String(t.id)).length;
                const isActive = filterDriver === String(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => setFilterDriver(String(t.id))}
                    style={{
                      all: 'unset', cursor: 'pointer',
                      padding: '6px 14px',
                      background: isActive ? t.color : 'rgba(0,0,0,0.5)',
                      border: `1px solid ${isActive ? t.color : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 6,
                      fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 900,
                      letterSpacing: '0.2em', textTransform: 'uppercase',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: isActive ? '#fff' : t.color,
                      boxShadow: `0 0 6px ${t.color}`,
                    }} />
                    {t.name?.split(' ')[0].toUpperCase()} · {teamCount}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============ SECTION PAR CATÉGORIE ========================= */}
      {/* ============================================================ */}
      <section className="container" style={{ padding: '40px 32px 60px', maxWidth: 1400 }}>
        {byCategory.map((cat) => (
          <div key={cat.key} style={{ marginBottom: 60 }}>
            {/* Header catégorie */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 16, marginBottom: 24,
              paddingBottom: 12,
              borderBottom: `1px solid ${cat.color}33`,
            }}>
              <div style={{ fontSize: 28 }}>{cat.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 22, fontWeight: 900,
                  textTransform: 'uppercase',
                  color: '#fff', letterSpacing: '-0.01em',
                }}>{cat.label}</div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, letterSpacing: '0.25em',
                  color: cat.color, fontWeight: 700,
                  marginTop: 3,
                }}>
                  {cat.unlockedCount} / {cat.badges.length} BADGES DÉBLOQUÉS ·{' '}
                  <span style={{ color: ACCENT }}>
                    {cat.unlockedCount * drivers.length} CARTES
                  </span>
                </div>
              </div>
              <div style={{
                width: 80, height: 4,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(cat.unlockedCount / Math.max(cat.badges.length, 1)) * 100}%`,
                  background: cat.color,
                  boxShadow: `0 0 10px ${cat.color}`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            {/* ✅ Boucle : pour chaque badge → soit placeholder, soit tous les pilotes */}
            {cat.badges.map((b, badgeIdx) => {
              const isUnlocked = Boolean(badges[b.id]);
              const rarity = RARITY[getRarity(b.id)] || RARITY.common;

              return (
                <div
                  key={b.id}
                  style={{
                    marginBottom: 40,
                    paddingBottom: 32,
                    borderBottom: '1px dashed rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Ligne badge header */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 12, marginBottom: 16, flexWrap: 'wrap',
                  }}>
                    <div style={{
                      width: 8, height: 8,
                      background: rarity.color,
                      boxShadow: `0 0 10px ${rarity.color}`,
                      transform: 'rotate(45deg)',
                    }} />
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 18, fontWeight: 900,
                      textTransform: 'uppercase',
                      color: isUnlocked ? '#fff' : 'var(--text-dim)',
                      letterSpacing: '0.02em',
                    }}>
                      {b.name}
                    </div>
                    <div style={{
                      padding: '3px 10px',
                      background: `${rarity.color}22`,
                      border: `1px solid ${rarity.color}66`,
                      borderRadius: 3,
                      fontFamily: 'var(--font-display)',
                      fontSize: 8, fontWeight: 900,
                      letterSpacing: '0.2em',
                      color: rarity.color,
                    }}>
                      {rarity.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 9, letterSpacing: '0.15em',
                      color: isUnlocked ? '#00d26a' : 'var(--text-dim)',
                      fontWeight: 700,
                    }}>
                      {isUnlocked
                        ? `✓ ${drivers.length} CARTES`
                        : '🔒 VERROUILLÉ'}
                    </div>
                  </div>

                  {/* ✅ Cartes */}
                  {isUnlocked ? (
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        overflowX: 'auto',
                        paddingBottom: 12,
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'thin',
                        scrollbarColor: `${ACCENT}44 transparent`,
                      }}
                    >
                      {visibleDrivers.map((d, idx) => (
                        <div
                          key={d.id}
                          style={{
                            flexShrink: 0,
                            scrollSnapAlign: 'start',
                            animation: `badgesFadeUp 0.5s ease ${idx * 0.02}s both`,
                          }}
                        >
                          <Badge3D
                            badgeId={b.id}
                            unlocked={true}
                            unlockedAt={badges[b.id]}
                            meta={driverToMeta(d)}
                            rarityOverride={getRarity(b.id)}
                            size={170}
                            mode="grid"
                            cardIndex={idx}
                            onClick={() => setShowcase({ badgeId: b.id, driverId: d.id })}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Placeholder "locked" */
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Badge3D
                        badgeId={b.id}
                        unlocked={false}
                        meta={{}}
                        rarityOverride={getRarity(b.id)}
                        size={140}
                        mode="grid"
                      />
                      <div style={{
                        padding: '20px 24px',
                        border: `1px dashed ${rarity.color}33`,
                        borderRadius: 12,
                        display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', gap: 6,
                        flex: 1, minWidth: 0,
                        background: 'rgba(0,0,0,0.3)',
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: 15, fontWeight: 700,
                          color: 'var(--text-mid)',
                        }}>{b.desc}</div>
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10, letterSpacing: '0.2em',
                          color: 'var(--text-dim)',
                          fontWeight: 700,
                        }}>
                          Débloque ce badge pour obtenir ses {drivers.length} cartes
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      {/* ============================================================ */}
      {/* ============ SHOWCASE ===================================== */}
      {/* ============================================================ */}
      {showcase && showcaseBadge && showcaseDriver && (
        <BadgeShowcase
          badgeId={showcase.badgeId}
          unlocked={Boolean(badges[showcase.badgeId])}
          unlockedAt={badges[showcase.badgeId]}
          meta={driverToMeta(showcaseDriver)}
          rarityOverride={getRarity(showcase.badgeId)}
          onClose={() => setShowcase(null)}
        />
      )}
    </div>
  );
}