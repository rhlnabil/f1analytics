import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const SURFACE = '#0a0a0a';
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
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = article.imageUrl && !imgFailed;

  return (
    <Link
      to={`/news/${article.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        minHeight: 'clamp(20rem, 40vw, 32.5rem)',
        padding: 'clamp(1.5rem, 3vw, 3rem)',
        borderRadius: 16,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        background: '#0a0a0a',
        border: `1px solid ${hovered ? accent : BORDER}`,
        transition: 'border-color 0.25s',
      }}
    >
      {showImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${article.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#0a0a0a',
            opacity: hovered ? 1 : 0.92,
            transition: 'opacity 0.4s',
          }}
          aria-hidden="true"
          onError={() => setImgFailed(true)}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.98) 100%)',
          pointerEvents: 'none',
        }}
      />

      {article.category && (
        <div
          style={{
            position: 'absolute',
            top: 'clamp(0.75rem, 1.5vw, 1.5rem)',
            left: 'clamp(0.75rem, 1.5vw, 1.5rem)',
            padding: '0.375rem 0.75rem',
            background: accent,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: '0.75rem',
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderRadius: 3,
            zIndex: 2,
          }}
        >
          {article.category}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 'clamp(0.75rem, 1.5vw, 1.5rem)',
          right: 'clamp(0.75rem, 1.5vw, 1.5rem)',
          padding: '0.375rem 0.75rem',
          background: 'rgba(0,0,0,0.85)',
          border: `1px solid ${BORDER}`,
          borderRadius: 3,
          fontFamily: 'var(--font-display)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#fff',
          zIndex: 2,
        }}
      >
        {timeAgo(article.publishedAt)}
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.875rem',
            letterSpacing: '0.08em',
            color: accent,
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ width: '1.5rem', height: 2, background: accent }} />
          {article.source?.toUpperCase() || 'F1 APEX'}
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.5rem, 3.5vw + 0.5rem, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            color: '#fff',
            marginBottom: '1rem',
            textWrap: 'balance',
          }}
        >
          {article.title}
        </h2>

        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(0.9375rem, 1.2vw + 0.5rem, 1.125rem)',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
            marginBottom: '1.75rem',
            maxWidth: '55ch',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.excerpt}
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.75rem 1.5rem',
            background: hovered ? accent : 'transparent',
            border: `1px solid ${hovered ? accent : 'rgba(255,255,255,0.3)'}`,
            borderRadius: 4,
            fontFamily: 'var(--font-display)',
            fontSize: '0.875rem',
            fontWeight: 900,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#fff',
            transition: 'background 0.25s, border-color 0.25s',
          }}
        >
          Lire l'article
          <span
            style={{
              fontSize: '1rem',
              transform: hovered ? 'translateX(4px)' : 'translateX(0)',
              transition: 'transform 0.25s',
            }}
          >
            →
          </span>
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
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = article.imageUrl && !imgFailed;

  return (
    <Link
      to={`/news/${article.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        background: '#0a0a0a',
        border: `1px solid ${hovered ? accent : BORDER}`,
        transition: 'border-color 0.25s',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 'clamp(10rem, 15vw, 12.5rem)',
          overflow: 'hidden',
          background: showImage
            ? `url(${article.imageUrl}) center/cover`
            : '#0a0a0a',
          backgroundColor: '#0a0a0a',
        }}
      >
        {!showImage && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(225,6,0,0.18)',
              fontSize: '3rem',
              fontFamily: 'var(--font-display)',
            }}
          >
            📰
          </div>
        )}

        {article.category && (
          <div
            style={{
              position: 'absolute',
              top: '0.875rem',
              left: '0.875rem',
              padding: '0.3125rem 0.625rem',
              background: accent,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: '0.625rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderRadius: 3,
              zIndex: 2,
            }}
          >
            {article.category}
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: '0.875rem',
            right: '0.875rem',
            padding: '0.3125rem 0.625rem',
            background: 'rgba(0,0,0,0.85)',
            border: `1px solid ${BORDER}`,
            borderRadius: 3,
            fontFamily: 'var(--font-display)',
            fontSize: '0.625rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: '#fff',
            zIndex: 2,
          }}
        >
          {timeAgo(article.publishedAt)}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          padding: 'clamp(1rem, 2vw, 1.5rem)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          background: '#0a0a0a',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--font-display)',
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            color: accent,
            fontWeight: 700,
            marginBottom: '0.875rem',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              background: accent,
              borderRadius: '50%',
            }}
          />
          {article.source?.toUpperCase() || 'SOURCE'}
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1rem, 1.5vw + 0.5rem, 1.25rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 1.2,
            color: '#fff',
            marginBottom: '0.75rem',
            letterSpacing: '-0.01em',
            textWrap: 'balance',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.title}
        </h3>

        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(0.8125rem, 1vw + 0.4rem, 0.9375rem)',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6,
            marginBottom: '1.25rem',
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.excerpt}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: `1px solid ${BORDER}`,
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.6875rem',
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
            }}
          >
            {article.readTime ? `${article.readTime} min` : '—'}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              color: accent,
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Lire
            <span
              style={{
                fontSize: '0.875rem',
                transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                transition: 'transform 0.25s',
              }}
            >
              →
            </span>
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

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ['all', ...Array.from(set)];
  }, [articles]);

  const filtered = useMemo(() => {
    if (filter === 'all') return articles;
    return articles.filter((a) => a.category === filter);
  }, [articles, filter]);

  const [featured, ...rest] = filtered;

  if (loading) {
    return (
      <section
        className="home-news"
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 6rem) 0',
          background: '#0a0a0a',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: `3px solid rgba(225,6,0,0.15)`,
              borderTopColor: accentColor,
              animation: 'nsSpin 0.9s linear infinite',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              color: accentColor,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Chargement des actualités
          </div>
        </div>
        <style>{`@keyframes nsSpin { to { transform: rotate(360deg); } }`}</style>
      </section>
    );
  }

  return (
    <section
      className="home-news"
      style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding:
          'clamp(3rem, 6vw, 6rem) clamp(1rem, 2vw, 2rem) clamp(3rem, 6vw, 5rem)',
        position: 'relative',
        background: '#0a0a0a',
      }}
    >
      <div style={{ marginBottom: 'clamp(2rem, 4vw, 3.75rem)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 'clamp(1rem, 3vw, 2.5rem)',
            flexWrap: 'wrap',
            marginBottom: 'clamp(1rem, 2vw, 2rem)',
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <h2
              style={{
                fontSize: 'clamp(2rem, 6vw + 0.5rem, 4.5rem)',
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                margin: 0,
                textTransform: 'uppercase',
                color: '#fff',
                marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
                textWrap: 'balance',
              }}
            >
              Actualités F1
            </h2>

            <p
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: 'clamp(0.9375rem, 1.2vw + 0.4rem, 1.0625rem)',
                fontFamily: 'var(--font-heading)',
                margin: 0,
                maxWidth: '55ch',
                lineHeight: 1.65,
              }}
            >
              Les dernières nouvelles de la Formule 1, agrégées en temps réel
              depuis les meilleures sources internationales.
            </p>
          </div>

          <Link
            to="/news"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.875rem 1.5rem',
              background: 'transparent',
              border: `1px solid ${accentColor}`,
              borderRadius: 4,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background 0.25s',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = accentColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Tout voir
            <span style={{ fontSize: '0.875rem' }}>→</span>
          </Link>
        </div>

        {categories.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              paddingTop: '1.5rem',
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            {categories.map((cat) => {
              const active = filter === cat;
              const label = cat === 'all' ? 'Tout' : cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    background: active ? accentColor : 'transparent',
                    border: `1px solid ${
                      active ? accentColor : 'rgba(255,255,255,0.12)'
                    }`,
                    borderRadius: 4,
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.6875rem',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {isFallback && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(255,135,0,0.06)',
              border: '1px solid rgba(255,135,0,0.25)',
              borderLeft: '3px solid #ff8700',
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.8125rem',
              color: '#ff8700',
              flexWrap: 'wrap',
            }}
          >
            Flux RSS indisponible — articles de démonstration affichés.
            <button
              onClick={load}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '0.25rem 0.75rem',
                background: 'rgba(255,135,0,0.15)',
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '0.6875rem',
                letterSpacing: '0.08em',
                border: '1px solid rgba(255,135,0,0.4)',
                textTransform: 'uppercase',
              }}
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: '6rem 1rem',
            textAlign: 'center',
            background: SURFACE,
            border: `1px dashed ${BORDER}`,
            borderRadius: 16,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            Aucune actualité
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Le flux RSS est peut-être momentanément indisponible.
          </div>
        </div>
      ) : (
        <div
          className="home-news-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 'clamp(1rem, 2vw, 1.75rem)',
          }}
        >
          {featured && (
            <div className="hn-featured" style={{ gridColumn: 'span 8' }}>
              <FeaturedCard article={featured} accent={accentColor} />
            </div>
          )}
          {rest[0] && (
            <div className="hn-card" style={{ gridColumn: 'span 4' }}>
              <NewsCard article={rest[0]} accent={accentColor} />
            </div>
          )}
          {rest.slice(1).map((article) => (
            <div
              key={article.id}
              className="hn-card"
              style={{ gridColumn: 'span 4' }}
            >
              <NewsCard article={article} accent={accentColor} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes nsSpin {
          to { transform: rotate(360deg); }
        }

        /* ✅ Fond noir forcé */
        .home-news,
        .home-news > *,
        .home-news-grid,
        .home-news-grid > * {
          background-color: transparent !important;
        }
        .home-news {
          background: #0a0a0a !important;
        }

        .hn-featured,
        .hn-card {
          min-width: 0;
        }

        /* ✅ Tablette : featured 12, cards 6 */
        @media (max-width: 1024px) {
          .hn-featured {
            grid-column: span 12 !important;
          }
          .hn-card {
            grid-column: span 6 !important;
          }
        }

        /* ✅ Mobile : tout en 1 colonne */
        @media (max-width: 640px) {
          .hn-featured {
            grid-column: span 12 !important;
          }
          .hn-card {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </section>
  );
}