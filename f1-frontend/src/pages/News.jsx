import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const ACCENT = '#e10600';

/* ============================================================ */
/* ============ HELPERS ======================================= */
/* ============================================================ */

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
/* ============ FEATURED HERO (grand) ========================= */
/* ============================================================ */

function FeaturedHero({ article }) {
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <Link
      to={`/news/${article.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={onMove}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        minHeight: 600,
        padding: '48px 52px',
        borderRadius: 24,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        border: `2px solid ${hovered ? ACCENT : `${ACCENT}44`}`,
        background: article.imageUrl
          ? `linear-gradient(180deg, rgba(5,7,10,0.1) 0%, rgba(5,7,10,0.7) 40%, rgba(5,7,10,0.99) 100%), url(${article.imageUrl}) center/cover`
          : `linear-gradient(135deg, ${ACCENT}44 0%, #0b0b12 100%)`,
        transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 50px 100px -25px ${ACCENT}ee, 0 0 100px ${ACCENT}55`
          : `0 25px 60px rgba(0,0,0,0.8)`,
      }}
    >
      {/* Grille */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(${ACCENT}12 1px, transparent 1px),
          linear-gradient(90deg, ${ACCENT}12 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        opacity: hovered ? 0.9 : 0.5,
        transition: 'opacity 0.5s',
        pointerEvents: 'none',
      }} />

      {/* Halo souris */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, ${ACCENT}55 0%, transparent 45%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.4s',
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }} />

      {/* Scanline */}
      {hovered && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 120,
          background: `linear-gradient(180deg, transparent, ${ACCENT}66, transparent)`,
          animation: 'nsScan 2.5s ease-in-out infinite',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }} />
      )}

      {/* Diagonale */}
      <div style={{
        position: 'absolute',
        top: -120, right: -120,
        width: 480, height: 480,
        background: `linear-gradient(135deg, transparent 45%, ${ACCENT}44 45%, ${ACCENT}44 55%, transparent 55%)`,
        transform: 'rotate(15deg)',
        opacity: hovered ? 1 : 0.5,
        transition: 'opacity 0.4s',
        pointerEvents: 'none',
      }} />

      {/* Top strip */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 5,
        background: `linear-gradient(90deg, transparent 0%, ${ACCENT} 30%, ${ACCENT} 70%, transparent 100%)`,
        boxShadow: `0 0 30px ${ACCENT}`,
      }} />

      {/* Badges */}
      <div style={{
        position: 'absolute', top: 32, left: 36,
        display: 'flex', gap: 10, flexWrap: 'wrap', zIndex: 3,
      }}>
        <span style={{
          padding: '10px 20px',
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
          color: '#fff',
          fontFamily: 'var(--font-display)',
          fontSize: 11, fontWeight: 900,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          borderRadius: 6,
          boxShadow: `0 0 30px ${ACCENT}cc`,
          display: 'inline-flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#fff',
            animation: 'nsPulse 1.2s ease-in-out infinite',
          }} />
          ◆ À LA UNE
        </span>
        {article.category && (
          <span style={{
            padding: '10px 18px',
            background: 'rgba(0,0,0,0.9)',
            border: `1.5px solid ${ACCENT}88`,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            borderRadius: 6,
            backdropFilter: 'blur(12px)',
          }}>
            {article.category}
          </span>
        )}
      </div>

      {/* Live badge */}
      <div style={{
        position: 'absolute', top: 32, right: 36,
        padding: '10px 18px',
        background: 'rgba(0,0,0,0.9)',
        border: '1.5px solid #00d26a',
        borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--font-display)',
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.25em',
        color: '#fff',
        zIndex: 3,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 0 20px rgba(0,210,106,0.4)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#00d26a',
          boxShadow: '0 0 8px #00d26a',
          animation: 'nsBlink 1.4s ease-in-out infinite',
        }} />
        {timeAgo(article.publishedAt)}
      </div>

      {/* Contenu */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1000 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12, letterSpacing: '0.4em',
          color: ACCENT, fontWeight: 700,
          marginBottom: 22,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ width: 40, height: 2, background: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }} />
          ◆ {article.source?.toUpperCase() || 'F1 APEX'}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(36px, 5.5vw, 68px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          lineHeight: 0.94,
          letterSpacing: '-0.035em',
          color: '#fff',
          marginBottom: 24,
          textShadow: `0 4px 40px rgba(0,0,0,0.95), 0 0 80px ${ACCENT}66`,
        }}>
          {article.title}
        </h1>

        <p style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 17,
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.65,
          marginBottom: 32,
          maxWidth: 820,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {article.excerpt}
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 16,
          padding: '16px 36px',
          background: hovered ? ACCENT : 'rgba(255,255,255,0.1)',
          border: `2px solid ${hovered ? ACCENT : 'rgba(255,255,255,0.3)'}`,
          borderRadius: 10,
          fontFamily: 'var(--font-display)',
          fontSize: 12, fontWeight: 900,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#fff',
          transition: 'all 0.3s',
          boxShadow: hovered ? `0 12px 40px ${ACCENT}aa` : 'none',
        }}>
          Lire l'article complet
          <span style={{
            fontSize: 18,
            transform: hovered ? 'translateX(8px)' : 'translateX(0)',
            transition: 'transform 0.3s',
          }}>→</span>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================ */
/* ============ NEWS CARD ===================================== */
/* ============================================================ */

function NewsCard({ article, index, featured = false }) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 5, ry: px * 5 });
  };

  /* Variante horizontale pour les "featured secondaires" */
  if (featured) {
    return (
      <Link
        to={`/news/${article.id}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: 0,
          minHeight: 240,
          borderRadius: 14,
          overflow: 'hidden',
          textDecoration: 'none',
          color: 'inherit',
          background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
          border: `1.5px solid ${hovered ? ACCENT : 'rgba(255,255,255,0.08)'}`,
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered
            ? `0 25px 50px -20px ${ACCENT}cc, 0 0 40px ${ACCENT}33`
            : '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Image gauche */}
        <div style={{
          position: 'relative',
          background: article.imageUrl
            ? `url(${article.imageUrl}) center/cover`
            : `linear-gradient(135deg, ${ACCENT}33 0%, #0b0b12 100%)`,
          filter: hovered ? 'brightness(1.1)' : 'brightness(0.85)',
          transition: 'filter 0.4s',
          overflow: 'hidden',
        }}>
          {!article.imageUrl && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'grid', placeItems: 'center',
              fontSize: 72, opacity: 0.3,
            }}>📰</div>
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(90deg, transparent 60%, #05070a 100%)`,
          }} />
          {hovered && (
            <div style={{
              position: 'absolute',
              top: 0, bottom: 0, left: 0,
              width: 60,
              background: `linear-gradient(90deg, transparent, ${ACCENT}88, transparent)`,
              animation: 'nsScanH 1.8s ease-in-out infinite',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Contenu droite */}
        <div style={{
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-display)',
              fontSize: 10, letterSpacing: '0.3em',
              color: ACCENT, fontWeight: 700,
            }}>
              <span style={{
                width: 5, height: 5,
                background: ACCENT,
                transform: 'rotate(45deg)',
                boxShadow: `0 0 8px ${ACCENT}`,
              }} />
              {article.source?.toUpperCase()}
            </div>
            {article.category && (
              <span style={{
                padding: '4px 10px',
                background: `${ACCENT}22`,
                border: `1px solid ${ACCENT}55`,
                borderRadius: 3,
                fontFamily: 'var(--font-display)',
                fontSize: 8, fontWeight: 700,
                letterSpacing: '0.2em',
                color: ACCENT,
              }}>{article.category}</span>
            )}
          </div>

          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22, fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 1.15,
            color: '#fff',
            marginBottom: 12,
            letterSpacing: '-0.01em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{article.title}</h3>

          <p style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 13, color: 'var(--text-mid)',
            lineHeight: 1.5,
            marginBottom: 18,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{article.excerpt}</p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            paddingTop: 14,
            borderTop: '1px dashed rgba(255,255,255,0.08)',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9, letterSpacing: '0.18em',
              color: 'var(--text-dim)', fontWeight: 700,
            }}>
              {timeAgo(article.publishedAt)} · {article.readTime} min
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-display)',
              fontSize: 10, fontWeight: 900,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: ACCENT,
            }}>
              Lire
              <span style={{
                transform: hovered ? 'translateX(6px)' : 'translateX(0)',
                transition: 'transform 0.3s',
              }}>→</span>
            </span>
          </div>
        </div>

        {/* Accent top */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: hovered ? '100%' : '15%',
          height: 3,
          background: `linear-gradient(90deg, ${ACCENT}, transparent)`,
          boxShadow: `0 0 15px ${ACCENT}`,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </Link>
    );
  }

  /* Variante verticale standard */
  return (
    <Link
      to={`/news/${article.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ rx: 0, ry: 0 }); }}
      onMouseMove={onMove}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 360,
        borderRadius: 14,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
        border: `1.5px solid ${hovered ? ACCENT : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered
          ? `translateY(-8px) perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : 'translateY(0)',
        transformStyle: 'preserve-3d',
        boxShadow: hovered
          ? `0 30px 60px -20px ${ACCENT}cc, 0 0 50px ${ACCENT}44`
          : '0 10px 30px rgba(0,0,0,0.5)',
        animation: `nsFadeIn 0.6s ease ${index * 0.05}s both`,
      }}
    >
      <div style={{
        position: 'relative',
        height: 180,
        overflow: 'hidden',
        background: article.imageUrl
          ? `url(${article.imageUrl}) center/cover`
          : `linear-gradient(135deg, ${ACCENT}33 0%, #0b0b12 100%)`,
        filter: hovered ? 'brightness(1.1)' : 'brightness(0.85)',
        transition: 'filter 0.4s',
      }}>
        {!article.imageUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid', placeItems: 'center',
            fontSize: 64, opacity: 0.3,
          }}>📰</div>
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(5,7,10,0.2) 0%, rgba(5,7,10,0.5) 60%, #05070a 100%)',
        }} />
        {article.category && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            padding: '5px 10px',
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 8, fontWeight: 900,
            letterSpacing: '0.2em',
            borderRadius: 3,
            boxShadow: `0 0 15px ${ACCENT}88`,
          }}>{article.category}</div>
        )}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          padding: '5px 9px',
          background: 'rgba(0,0,0,0.85)',
          border: `1px solid ${ACCENT}55`,
          borderRadius: 3,
          fontFamily: 'var(--font-display)',
          fontSize: 8, fontWeight: 700,
          letterSpacing: '0.15em',
          color: '#fff',
          backdropFilter: 'blur(8px)',
        }}>{timeAgo(article.publishedAt)}</div>
        {hovered && (
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            height: 60,
            background: `linear-gradient(180deg, transparent, ${ACCENT}88, transparent)`,
            animation: 'nsScan 1.6s ease-in-out infinite',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      <div style={{
        position: 'relative',
        padding: '20px 22px 22px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-display)',
          fontSize: 9, letterSpacing: '0.28em',
          color: ACCENT, fontWeight: 700,
          marginBottom: 12,
        }}>
          <span style={{
            width: 5, height: 5,
            background: ACCENT,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 8px ${ACCENT}`,
          }} />
          {article.source?.toUpperCase()}
        </div>

        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 18, fontWeight: 900,
          textTransform: 'uppercase',
          lineHeight: 1.15,
          color: '#fff',
          marginBottom: 10,
          letterSpacing: '-0.01em',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textShadow: hovered ? `0 0 20px ${ACCENT}66` : 'none',
          transition: 'text-shadow 0.3s',
        }}>{article.title}</h3>

        <p style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12,
          color: 'var(--text-mid)',
          lineHeight: 1.5,
          marginBottom: 16,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{article.excerpt}</p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px dashed rgba(255,255,255,0.08)',
          gap: 8,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 9, letterSpacing: '0.15em',
            color: 'var(--text-dim)',
            fontWeight: 700,
          }}>{article.readTime ? `${article.readTime} min` : '—'}</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: ACCENT,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Lire
            <span style={{
              fontSize: 14,
              transform: hovered ? 'translateX(6px)' : 'translateX(0)',
              transition: 'transform 0.35s',
            }}>→</span>
          </span>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: hovered ? '100%' : '25%',
        height: 3,
        background: `linear-gradient(90deg, ${ACCENT}, transparent)`,
        boxShadow: `0 0 15px ${ACCENT}`,
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </Link>
  );
}

/* ============================================================ */
/* ============ PAGE PRINCIPALE =============================== */
/* ============================================================ */

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    api.get('/news', { params: { limit: 60 } })
      .then(r => setArticles(Array.isArray(r.data) ? r.data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    articles.forEach(a => { if (a.category) set.add(a.category); });
    return ['all', ...Array.from(set)];
  }, [articles]);

  const filtered = useMemo(() => {
    let list = articles;

    if (filter !== 'all') list = list.filter(a => a.category === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.excerpt || '').toLowerCase().includes(q) ||
        (a.source || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'recent') {
      list = [...list].sort((a, b) =>
        new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
      );
    } else if (sortBy === 'oldest') {
      list = [...list].sort((a, b) =>
        new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0)
      );
    }

    return list;
  }, [articles, filter, search, sortBy]);

  const [featured, ...rest] = filtered;

  return (
    <div className="container" style={{ maxWidth: 1500, padding: '80px 32px 80px' }}>

      {/* ============================================================ */}
      {/* ============ STYLES ======================================== */}
      {/* ============================================================ */}
      <style>{`
        @keyframes nsFadeIn {
          from { opacity: 0; transform: translateY(30px) scale(0.96); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes nsScan {
          0%   { top: -100px; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes nsScanH {
          0%   { left: -60px; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes nsPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes nsBlink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
        @keyframes nsSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes nsMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes nsGridShift {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
        }
      `}</style>

      {/* ============================================================ */}
      {/* ============ TICKER ======================================== */}
      {/* ============================================================ */}
      <div style={{
        position: 'relative',
        marginBottom: 40,
        padding: '14px 0',
        background: `linear-gradient(90deg, transparent, ${ACCENT}11, transparent)`,
        borderTop: `1px solid ${ACCENT}33`,
        borderBottom: `1px solid ${ACCENT}33`,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          gap: 48,
          whiteSpace: 'nowrap',
          animation: 'nsMarquee 35s linear infinite',
        }}>
          {[...Array(3)].map((_, rep) => (
            <div key={rep} style={{ display: 'flex', gap: 48 }}>
              {[
                '◆ NEWSROOM',
                'F1 NEWS AGGREGATOR',
                `${articles.length} ARTICLES DISPONIBLES`,
                'STREAM LIVE',
                '◆ THE RACE · MOTORSPORT · RACEFANS · PLANETF1',
                'UPDATED · 5MIN',
              ].map((text, i) => (
                <span key={i} style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10,
                  letterSpacing: '0.35em',
                  color: i % 2 === 0 ? ACCENT : 'rgba(255,255,255,0.4)',
                  fontWeight: 700,
                }}>
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ============ HEADER ======================================== */}
      {/* ============================================================ */}
      <header style={{ marginBottom: 50 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 24,
          alignItems: 'flex-end',
          marginBottom: 32,
        }}>
          <div>
            {/* Label */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              marginBottom: 20,
              padding: '6px 16px',
              background: 'rgba(0,0,0,0.7)',
              border: `1px solid ${ACCENT}66`,
              borderRadius: 4,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#00d26a',
                boxShadow: '0 0 10px #00d26a',
                animation: 'nsBlink 1.4s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10, letterSpacing: '0.4em',
                color: '#00d26a', fontWeight: 700,
              }}>
                LIVE · LE FIL DE LA F1
              </span>
            </div>

            {/* Titre */}
            <h1 style={{
              fontSize: 'clamp(52px, 9vw, 130px)',
              fontWeight: 900,
              lineHeight: 0.82,
              letterSpacing: '-0.05em',
              margin: 0,
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: 24,
            }}>
              Actualités{' '}
              <span style={{
                display: 'inline-block',
                color: 'transparent',
                WebkitTextStroke: `2.5px ${ACCENT}`,
                fontStyle: 'italic',
                letterSpacing: '-0.06em',
                filter: `drop-shadow(0 0 40px ${ACCENT}88)`,
              }}>F1</span>
            </h1>

            <p style={{
              color: 'var(--text-mid)', fontSize: 17,
              fontFamily: 'var(--font-heading)',
              maxWidth: 700, lineHeight: 1.7, margin: 0,
            }}>
              Toutes les actualités de la Formule 1, agrégées en temps réel
              depuis les meilleures sources internationales. Filtrez, recherchez,
              explorez.
            </p>
          </div>

          {/* Compteur */}
          <div style={{
            textAlign: 'right',
            padding: '24px 28px',
            background: 'rgba(0,0,0,0.6)',
            border: `1.5px solid ${ACCENT}66`,
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            boxShadow: `0 0 30px ${ACCENT}22`,
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9, letterSpacing: '0.35em',
              color: 'var(--text-dim)', fontWeight: 700,
              marginBottom: 8,
            }}>TOTAL</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 48, fontWeight: 900,
              color: ACCENT, lineHeight: 1,
              textShadow: `0 0 30px ${ACCENT}88`,
            }}>{filtered.length}</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9, letterSpacing: '0.25em',
              color: 'var(--text-dim)', fontWeight: 700,
              marginTop: 6,
            }}>ARTICLES</div>
          </div>
        </div>

        {/* Barre filtres */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 16,
          alignItems: 'center',
          padding: '16px 20px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          backdropFilter: 'blur(10px)',
        }}>
          {/* Catégories */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map(cat => {
              const active = filter === cat;
              const label = cat === 'all' ? 'TOUT' : cat.toUpperCase();
              return (
                <button key={cat} onClick={() => setFilter(cat)} style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '8px 14px',
                  background: active
                    ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6,
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, fontWeight: 900,
                  letterSpacing: '0.2em',
                  color: active ? '#fff' : 'var(--text-mid)',
                  transition: 'all 0.25s',
                  boxShadow: active ? `0 4px 16px ${ACCENT}66` : 'none',
                }}>{label}</button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', minWidth: 200 }}>
            <input
              type="text"
              placeholder="Rechercher une actu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 14px',
                background: 'rgba(15,15,22,0.95)',
                border: `1px solid ${search ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 6, color: '#fff',
                fontFamily: 'var(--font-body)', fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.25s',
              }}
            />
            <span style={{
              position: 'absolute', right: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: ACCENT, fontSize: 14,
              pointerEvents: 'none',
            }}>🔍</span>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 36, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 18, height: 18,
                  background: ACCENT, border: 'none',
                  borderRadius: '50%', color: '#fff',
                  cursor: 'pointer', padding: 0,
                  fontSize: 11, lineHeight: 1,
                  display: 'grid', placeItems: 'center',
                }}
              >×</button>
            )}
          </div>

          {/* Tri */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '10px 14px',
              background: 'rgba(15,15,22,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: '#fff',
              fontFamily: 'var(--font-display)', fontSize: 10,
              fontWeight: 700, letterSpacing: '0.2em',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="recent">PLUS RÉCENT</option>
            <option value="oldest">PLUS ANCIEN</option>
          </select>
        </div>
      </header>

      {/* ============================================================ */}
      {/* ============ CONTENU ======================================= */}
      {/* ============================================================ */}
      {loading ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 20,
          padding: 120,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            border: `3px solid ${ACCENT}22`,
            borderTopColor: ACCENT,
            animation: 'nsSpin 0.9s linear infinite',
          }} />
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11, letterSpacing: '0.4em',
            color: ACCENT, fontWeight: 700,
          }}>
            ◆ CHARGEMENT DES ACTUALITÉS...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 120,
          textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 16,
          color: 'var(--text-dim)',
        }}>
          <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>📰</div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22, fontWeight: 700, marginBottom: 8,
            color: '#fff',
          }}>
            Aucune actualité trouvée
          </div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            {search ? `Aucun résultat pour « ${search} »` : 'Le flux RSS est peut-être indisponible.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Hero featured */}
          {featured && <FeaturedHero article={featured} />}

          {/* 2 secondaires en grid */}
          {rest.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 24,
            }}>
              {rest.slice(0, 2).map((article, idx) => (
                <NewsCard
                  key={article.id || idx}
                  article={article}
                  index={idx}
                  featured
                />
              ))}
            </div>
          )}

          {/* Grille standard */}
          {rest.length > 2 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {rest.slice(2).map((article, idx) => (
                <NewsCard
                  key={article.id || idx}
                  article={article}
                  index={idx + 2}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}