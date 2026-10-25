import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const SURFACE = '#0b0b12';
const BORDER = 'rgba(255,255,255,0.08)';

const MOCK_NEWS = [
  {
    id: 'mock-1',
    title: 'Verstappen signe la pole à Monaco dans une séance haletante',
    excerpt: 'Le Néerlandais a devancé Leclerc de 0.082s dans une Q3 perturbée par la pluie. Alonso surprend avec une P3.',
    source: 'F1.com',
    url: 'https://www.formula1.com',
    imageUrl: null,
    category: 'Qualifs',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    readTime: 3,
  },
  {
    id: 'mock-2',
    title: 'Ferrari dévoile une évolution majeure du plancher pour Barcelone',
    excerpt: "La Scuderia introduit un nouveau plancher pour tenter de réduire l'écart avec Red Bull sur les circuits rapides.",
    source: 'Motorsport',
    url: 'https://www.motorsport.com',
    imageUrl: null,
    category: 'Technique',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    readTime: 5,
  },
  {
    id: 'mock-3',
    title: 'Hamilton : "Monaco reste le défi ultime pour un pilote"',
    excerpt: 'Le septuple champion du monde revient sur sa relation particulière avec le tracé monégasque avant le GP.',
    source: 'Sky Sports F1',
    url: 'https://www.skysports.com/f1',
    imageUrl: null,
    category: 'Interview',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    readTime: 4,
  },
  {
    id: 'mock-4',
    title: "Norris prolonge avec McLaren jusqu'en 2028",
    excerpt: "L'écurie de Woking sécurise son pilote vedette avec un contrat longue durée.",
    source: 'BBC Sport',
    url: 'https://www.bbc.com/sport/formula1',
    imageUrl: null,
    category: 'Transferts',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    readTime: 2,
  },
  {
    id: 'mock-5',
    title: "Sprint weekend : ce qu'il faut savoir avant Shanghai",
    excerpt: 'Format réduit, pneus spécifiques, parc fermé anticipé... le point complet sur le week-end sprint.',
    source: 'The Race',
    url: 'https://www.the-race.com',
    imageUrl: null,
    category: 'Explainer',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    readTime: 6,
  },
];

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(isoString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/* ============================================================ */
/* ============ FEATURED CARD ================================= */
/* ============================================================ */
function FeaturedCard({ article, accent }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/news/${article.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        minHeight: 520, padding: '48px 48px 44px',
        borderRadius: 16, overflow: 'hidden',
        textDecoration: 'none', color: 'inherit',
        background: article.imageUrl ? '#05070a' : SURFACE,
        border: `1px solid ${hovered ? accent : BORDER}`,
        transition: 'border-color 0.25s',
      }}
    >
      {article.imageUrl && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${article.imageUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: hovered ? 1 : 0.92,
          transition: 'opacity 0.4s',
        }} />
      )}

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(5,7,10,0.15) 0%, rgba(5,7,10,0.85) 55%, rgba(5,7,10,0.98) 100%)',
        pointerEvents: 'none',
      }} />

      {article.category && (
        <div style={{
          position: 'absolute', top: 24, left: 24,
          padding: '6px 12px', background: accent, color: '#fff',
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          borderRadius: 3, zIndex: 2,
        }}>{article.category}</div>
      )}

      <div style={{
        position: 'absolute', top: 24, right: 24,
        padding: '6px 12px', background: 'rgba(0,0,0,0.75)',
        border: `1px solid ${BORDER}`, borderRadius: 3,
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.06em', color: '#fff', zIndex: 2,
      }}>{timeAgo(article.publishedAt)}</div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 12,
          letterSpacing: '0.08em', color: accent, fontWeight: 700,
          textTransform: 'uppercase', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ width: 24, height: 2, background: accent }} />
          {article.source?.toUpperCase() || 'F1 APEX'}
        </div>

        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(28px, 4.2vw, 48px)',
          fontWeight: 900, textTransform: 'uppercase',
          lineHeight: 1.0, letterSpacing: '-0.02em',
          color: '#fff', marginBottom: 18,
          textWrap: 'balance',
        }}>{article.title}</h2>

        <p style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 15, color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.6, marginBottom: 28,
          maxWidth: '55ch',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{article.excerpt}</p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '12px 24px',
          background: hovered ? accent : 'transparent',
          border: `1px solid ${hovered ? accent : 'rgba(255,255,255,0.3)'}`,
          borderRadius: 4,
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff',
          transition: 'background 0.25s, border-color 0.25s',
        }}>
          Lire l'article
          <span style={{
            fontSize: 14,
            transform: hovered ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.25s',
          }}>→</span>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================ */
/* ============ NEWS CARD ===================================== */
/* ============================================================ */
function NewsCard({ article, accent }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/news/${article.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        height: '100%', borderRadius: 12, overflow: 'hidden',
        textDecoration: 'none', color: 'inherit',
        background: SURFACE,
        border: `1px solid ${hovered ? accent : BORDER}`,
        transition: 'border-color 0.25s',
      }}
    >
      <div style={{
        position: 'relative', height: 200, overflow: 'hidden',
        background: article.imageUrl
          ? `url(${article.imageUrl}) center/cover`
          : 'rgba(255,255,255,0.03)',
      }}>
        {article.category && (
          <div style={{
            position: 'absolute', top: 14, left: 14,
            padding: '5px 10px', background: accent, color: '#fff',
            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            borderRadius: 3, zIndex: 2,
          }}>{article.category}</div>
        )}

        <div style={{
          position: 'absolute', top: 14, right: 14,
          padding: '5px 10px', background: 'rgba(0,0,0,0.75)',
          border: `1px solid ${BORDER}`, borderRadius: 3,
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.06em', color: '#fff', zIndex: 2,
        }}>{timeAgo(article.publishedAt)}</div>
      </div>

      <div style={{
        position: 'relative',
        padding: '24px 24px 22px',
        display: 'flex', flexDirection: 'column', flex: 1,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-display)', fontSize: 11,
          letterSpacing: '0.08em', color: accent, fontWeight: 700,
          marginBottom: 14, textTransform: 'uppercase',
        }}>
          <span style={{ width: 4, height: 4, background: accent, borderRadius: '50%' }} />
          {article.source?.toUpperCase() || 'SOURCE'}
        </div>

        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 20, fontWeight: 900, textTransform: 'uppercase',
          lineHeight: 1.2, color: '#fff', marginBottom: 12,
          letterSpacing: '-0.01em', textWrap: 'balance',
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{article.title}</h3>

        <p style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 14, color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.6, marginBottom: 20, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{article.excerpt}</p>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 16, borderTop: `1px solid ${BORDER}`, gap: 8,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11,
            letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', fontWeight: 700,
          }}>{article.readTime ? `${article.readTime} min` : '—'}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: accent,
            fontFamily: 'var(--font-display)', fontWeight: 900,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Lire
            <span style={{
              fontSize: 14,
              transform: hovered ? 'translateX(4px)' : 'translateX(0)',
              transition: 'transform 0.25s',
            }}>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================ */
/* ============ SECTION ======================================= */
/* ============================================================ */
export default function HomeNewsSection({ accentColor = '#e10600' }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isFallback, setIsFallback] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/news', { params: { limit: 10 } });
      const list = Array.isArray(data) ? data : [];
      if (list.length === 0) throw new Error('empty');
      setArticles(list);
      setIsFallback(false);
    } catch {
      setArticles(MOCK_NEWS);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const set = new Set();
    articles.forEach(a => { if (a.category) set.add(a.category); });
    return ['all', ...Array.from(set)];
  }, [articles]);

  const filtered = useMemo(() => {
    if (filter === 'all') return articles;
    return articles.filter(a => a.category === filter);
  }, [articles, filter]);

  const [featured, ...rest] = filtered;

  if (loading) {
    return (
      <section className="container" style={{ maxWidth: 1400, padding: '100px 32px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: `3px solid rgba(225,6,0,0.15)`,
            borderTopColor: accentColor,
            animation: 'nsSpin 0.9s linear infinite',
          }} />
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12, letterSpacing: '0.1em',
            color: accentColor, fontWeight: 700, textTransform: 'uppercase',
          }}>Chargement des actualités</div>
        </div>
        <style>{`@keyframes nsSpin { to { transform: rotate(360deg); } }`}</style>
      </section>
    );
  }

  return (
    <section className="container" style={{
      maxWidth: 1400, padding: '120px 32px 80px', position: 'relative',
    }}>
      <div style={{ marginBottom: 60 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 40, flexWrap: 'wrap', marginBottom: 32,
        }}>
          <div style={{ maxWidth: 720 }}>
            <h2 style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 900, lineHeight: 0.95,
              letterSpacing: '-0.03em', margin: 0,
              textTransform: 'uppercase', color: '#fff',
              marginBottom: 20, textWrap: 'balance',
            }}>Actualités F1</h2>

            <p style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 16,
              fontFamily: 'var(--font-heading)',
              margin: 0, maxWidth: '55ch', lineHeight: 1.65,
            }}>
              Les dernières nouvelles de la Formule 1, agrégées en temps réel
              depuis les meilleures sources internationales.
            </p>
          </div>

          <Link to="/news" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 24px', background: 'transparent',
            border: `1px solid ${accentColor}`, borderRadius: 4,
            color: '#fff',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            textDecoration: 'none', transition: 'background 0.25s',
            alignSelf: 'flex-start',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = accentColor; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Tout voir
            <span style={{ fontSize: 14 }}>→</span>
          </Link>
        </div>

        {categories.length > 1 && (
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            paddingTop: 24, borderTop: `1px solid ${BORDER}`,
          }}>
            {categories.map(cat => {
              const active = filter === cat;
              const label = cat === 'all' ? 'Tout' : cat;
              return (
                <button key={cat} onClick={() => setFilter(cat)} style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '8px 16px',
                  background: active ? accentColor : 'transparent',
                  border: `1px solid ${active ? accentColor : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 4,
                  fontFamily: 'var(--font-display)', fontSize: 11,
                  fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                }}>{label}</button>
              );
            })}
          </div>
        )}

        {isFallback && (
          <div style={{
            marginTop: 24, padding: '12px 16px',
            background: 'rgba(255,135,0,0.06)',
            border: '1px solid rgba(255,135,0,0.25)',
            borderLeft: '3px solid #ff8700',
            borderRadius: 6,
            display: 'inline-flex', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-heading)', fontSize: 13, color: '#ff8700',
          }}>
            Flux RSS indisponible — articles de démonstration affichés.
            <button onClick={load} style={{
              all: 'unset', cursor: 'pointer',
              padding: '4px 12px',
              background: 'rgba(255,135,0,0.15)',
              borderRadius: 3,
              fontWeight: 700, fontSize: 11, letterSpacing: '0.08em',
              border: '1px solid rgba(255,135,0,0.4)',
              textTransform: 'uppercase',
            }}>Réessayer</button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          padding: 100, textAlign: 'center',
          background: SURFACE, border: `1px dashed ${BORDER}`,
          borderRadius: 16, color: 'rgba(255,255,255,0.5)',
        }}>
          <div style={{
            fontFamily: 'var(--font-heading)', fontSize: 20,
            fontWeight: 700, marginBottom: 8,
          }}>Aucune actualité</div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            Le flux RSS est peut-être momentanément indisponible.
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 24,
        }}>
          {featured && (
            <div style={{ gridColumn: 'span 8' }}>
              <FeaturedCard article={featured} accent={accentColor} />
            </div>
          )}
          {rest[0] && (
            <div style={{ gridColumn: 'span 4' }}>
              <NewsCard article={rest[0]} accent={accentColor} />
            </div>
          )}
          {rest.slice(1).map((article) => (
            <div key={article.id} style={{ gridColumn: 'span 4' }}>
              <NewsCard article={article} accent={accentColor} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          section > div[style*="grid-template-columns: repeat(12, 1fr)"] > div {
            grid-column: span 6 !important;
          }
          section > div[style*="grid-template-columns: repeat(12, 1fr)"] > div:first-child {
            grid-column: span 12 !important;
          }
        }
        @media (max-width: 640px) {
          section > div[style*="grid-template-columns: repeat(12, 1fr)"] > div {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </section>
  );
}