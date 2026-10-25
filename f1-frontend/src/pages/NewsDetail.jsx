import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatDateLong(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function parseContent(text) {
  if (!text) return [];
  const blocks = [];
  const lines = text.split('\n');
  let listBuffer = [];
  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push({ type: 'list', items: [...listBuffer] });
      listBuffer = [];
    }
  };
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); continue; }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'heading', text: trimmed.slice(3).trim() });
    } else if (trimmed.startsWith('> ')) {
      flushList();
      blocks.push({ type: 'quote', text: trimmed.slice(2).trim() });
    } else if (trimmed.startsWith('• ')) {
      listBuffer.push(trimmed.slice(2).trim());
    } else {
      flushList();
      blocks.push({ type: 'paragraph', text: trimmed });
    }
  }
  flushList();
  return blocks;
}

/* ============================================================ */
/* ============ READING PROGRESS ============================== */
/* ============================================================ */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 4, background: 'rgba(0,0,0,0.6)',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      <div style={{
        width: `${progress}%`, height: '100%',
        background: `linear-gradient(90deg, ${ACCENT}, #ff3c00)`,
        boxShadow: `0 0 15px ${ACCENT}`,
        transition: 'width 0.1s linear',
      }} />
    </div>
  );
}

/* ============================================================ */
/* ============ SHARE BUTTONS ================================= */
/* ============================================================ */
function ShareButtons({ article }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(article.title);
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      '_blank', 'noopener,noreferrer'
    );
  };

  const btnStyle = {
    all: 'unset',
    cursor: 'pointer',
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.5)',
    border: `1px solid ${ACCENT}44`,
    borderRadius: 6,
    color: 'rgba(240,240,245,0.9)',   /* ✅ blanc */
    fontFamily: 'var(--font-display)',
    fontSize: 10, fontWeight: 700,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    display: 'inline-flex', alignItems: 'center', gap: 8,
    transition: 'all 0.25s',
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        onClick={copyLink}
        style={{
          ...btnStyle,
          background: copied ? `${ACCENT}33` : 'rgba(0,0,0,0.5)',
          borderColor: copied ? ACCENT : `${ACCENT}44`,
          color: copied ? ACCENT : 'rgba(240,240,245,0.9)',
        }}
      >
        {copied ? '✓ COPIÉ' : '🔗 COPIER'}
      </button>
      <button
        onClick={shareTwitter}
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = `${ACCENT}22`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = `${ACCENT}44`; e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
      >
        🐦 TWITTER
      </button>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btnStyle, textDecoration: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = `${ACCENT}22`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = `${ACCENT}44`; e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
      >
        🔗 SOURCE
      </a>
    </div>
  );
}

/* ============================================================ */
/* ============ METADATA SIDEBAR ============================== */
/* ============================================================ */
function MetadataSidebar({ article }) {
  return (
    <aside style={{
      position: 'sticky',
      top: 130,
      padding: '24px 22px',
      /* ✅ Plus de background visible, seulement une fine ligne gauche rouge */
      borderLeft: `2px solid ${ACCENT}66`,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 9, letterSpacing: '0.35em',
        color: ACCENT, fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 5, height: 5,
          background: ACCENT,
          transform: 'rotate(45deg)',
          boxShadow: `0 0 8px ${ACCENT}`,
        }} />
        ARTICLE
      </div>

      {/* ✅ Divider en rouge subtil au lieu de blanc */}
      <div style={{ height: 1, background: `${ACCENT}22` }} />

      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8, letterSpacing: '0.3em',
          color: 'var(--text-dim)', fontWeight: 700, marginBottom: 6,
        }}>SOURCE</div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 14, fontWeight: 900,
          textTransform: 'uppercase',
          color: '#fff',   /* ✅ blanc */
          letterSpacing: '0.02em',
        }}>{article.source || '—'}</div>
      </div>

      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8, letterSpacing: '0.3em',
          color: 'var(--text-dim)', fontWeight: 700, marginBottom: 6,
        }}>PUBLIÉ</div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 13, fontWeight: 600,
          color: 'rgba(255,255,255,0.85)',   /* ✅ blanc */
          textTransform: 'capitalize',
          lineHeight: 1.4,
        }}>{formatDateLong(article.publishedAt)}</div>
      </div>

      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8, letterSpacing: '0.3em',
          color: 'var(--text-dim)', fontWeight: 700, marginBottom: 6,
        }}>LECTURE</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, fontWeight: 900,
            color: ACCENT, lineHeight: 1,
            textShadow: `0 0 20px ${ACCENT}66`,
          }}>{article.readTime || 1}</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10, letterSpacing: '0.2em',
            color: 'var(--text-dim)', fontWeight: 700,
          }}>MIN</span>
        </div>
      </div>

      {article.category && (
        <>
          <div style={{ height: 1, background: `${ACCENT}22` }} />
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 8, letterSpacing: '0.3em',
              color: 'var(--text-dim)', fontWeight: 700, marginBottom: 8,
            }}>CATÉGORIE</div>
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              background: `${ACCENT}22`,
              border: `1px solid ${ACCENT}66`,
              borderRadius: 4,
              fontFamily: 'var(--font-display)',
              fontSize: 9, fontWeight: 900,
              letterSpacing: '0.2em',
              color: ACCENT,
              textTransform: 'uppercase',
            }}>{article.category}</div>
          </div>
        </>
      )}

      <div style={{ height: 1, background: `${ACCENT}22` }} />
      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8, letterSpacing: '0.3em',
          color: 'var(--text-dim)', fontWeight: 700, marginBottom: 10,
        }}>PARTAGER</div>
        <ShareButtons article={article} />
      </div>
    </aside>
  );
}

/* ============================================================ */
/* ============ RELATED CARD ================================== */
/* ============================================================ */
function RelatedCard({ article }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/news/${article.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: 0,
        minHeight: 140,
        borderRadius: 10,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${hovered ? ACCENT : 'rgba(225,6,0,0.15)'}`,
        transition: 'all 0.3s',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      <div style={{
        position: 'relative',
        background: article.imageUrl
          ? `url(${article.imageUrl}) center/cover`
          : `linear-gradient(135deg, ${ACCENT}33 0%, #0b0b12 100%)`,
        filter: hovered ? 'brightness(1.1)' : 'brightness(0.8)',
        transition: 'filter 0.35s',
        overflow: 'hidden',
      }}>
        {!article.imageUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid', placeItems: 'center',
            fontSize: 48, opacity: 0.3,
          }}>📰</div>
        )}
      </div>

      <div style={{
        padding: '14px 18px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8, letterSpacing: '0.3em',
          color: ACCENT, fontWeight: 700,
          marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            width: 4, height: 4,
            background: ACCENT,
            transform: 'rotate(45deg)',
          }} />
          {article.source?.toUpperCase()}
        </div>

        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 14, fontWeight: 900,
          textTransform: 'uppercase',
          color: '#fff',   /* ✅ blanc */
          lineHeight: 1.2, marginBottom: 8,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{article.title}</div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8, letterSpacing: '0.18em',
          color: 'var(--text-dim)', fontWeight: 700,
        }}>{timeAgo(article.publishedAt)}</div>
      </div>
    </Link>
  );
}

/* ============================================================ */
/* ============ MAIN ========================================== */
/* ============================================================ */
export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const heroImgRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (!heroImgRef.current) return;
      heroImgRef.current.style.transform = `scale(1.05) translateY(${window.scrollY * 0.15}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0 });

    api.get(`/news/${id}`, { timeout: 30000 })
      .then(r => {
        setArticle(r.data);
        return api.get('/news', { params: { limit: 60 } });
      })
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        const others = all
          .filter(a => a.id !== id)
          .sort((a, b) => {
            const sameA = a.category && a.category === article?.category ? 1 : 0;
            const sameB = b.category && b.category === article?.category ? 1 : 0;
            return sameB - sameA;
          })
          .slice(0, 4);
        setRelated(others);
      })
      .catch(err => {
        setError(err.response?.status === 404
          ? 'Article introuvable (peut-être retiré du flux RSS)'
          : "Erreur de chargement de l'article");
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* ============================================================ */
  /* ============ LOADING ======================================= */
  /* ============================================================ */
  if (loading) {
    return (
      <div className="container" style={{
        padding: 120, textAlign: 'center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 24,
      }}>
        <div style={{
          width: 70, height: 70,
          borderRadius: '50%',
          border: `3px solid ${ACCENT}22`,
          borderTopColor: ACCENT,
          animation: 'ndSpin 0.9s linear infinite',
        }} />
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12, letterSpacing: '0.4em',
          color: ACCENT, fontWeight: 700,
        }}>◆ CHARGEMENT DE L'ARTICLE...</div>
        <style>{`@keyframes ndSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container" style={{ padding: 120, textAlign: 'center', maxWidth: 600 }}>
        <div style={{ fontSize: 100, marginBottom: 24, opacity: 0.3 }}>📰</div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 28, fontWeight: 900, textTransform: 'uppercase',
          color: '#fff', marginBottom: 16,
        }}>Article introuvable</h2>
        <p style={{
          color: 'var(--text-dim)', fontSize: 15,
          fontFamily: 'var(--font-heading)', marginBottom: 32,
        }}>{error}</p>
        <button
          onClick={() => navigate('/news')}
          style={{
            padding: '16px 32px',
            background: `linear-gradient(135deg, ${ACCENT}, #b80500)`,
            border: 'none', borderRadius: 10, color: '#fff',
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: `0 8px 30px ${ACCENT}66`,
            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
          }}
        >← Retour aux actualités</button>
      </div>
    );
  }

  const blocks = parseContent(article.content || article.excerpt || '');
  const isContentShort = (article.content || '').length < 800;

  return (
    <div style={{ position: 'relative', paddingBottom: 80 }}>

      <ReadingProgress />

      <style>{`
        @keyframes ndFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ndBlink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0.4; }
        }
      `}</style>

      {/* ============================================================ */}
      {/* ============ HERO ========================================== */}
      {/* ============================================================ */}
      <section style={{
        position: 'relative',
        minHeight: article.imageUrl ? 640 : 400,
        overflow: 'hidden',
        borderBottom: `1px solid ${ACCENT}22`,
      }}>
        {article.imageUrl && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <img
              ref={heroImgRef}
              src={article.imageUrl}
              alt=""
              style={{
                width: '100%', height: '110%',
                objectFit: 'cover',
                filter: 'brightness(0.45) saturate(1.1)',
                transition: 'transform 0.05s linear',
                willChange: 'transform',
              }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        <div style={{
          position: 'absolute', inset: 0,
          background: article.imageUrl
            ? 'linear-gradient(180deg, rgba(3,3,6,0.5) 0%, rgba(3,3,6,0.8) 50%, rgba(3,3,6,0.99) 100%)'
            : `radial-gradient(ellipse at top, ${ACCENT}33 0%, #050508 70%)`,
        }} />

        <div className="container" style={{
          position: 'relative', zIndex: 3,
          maxWidth: 1100,
          padding: '110px 32px 70px',
          minHeight: article.imageUrl ? 640 : 400,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
          <Link to="/news" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            color: 'rgba(240,240,245,0.85)',
            fontSize: 11,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: 32,
            textDecoration: 'none',
            transition: 'color 0.25s',
            alignSelf: 'flex-start',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = ACCENT; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,245,0.85)'; }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center',
              width: 28, height: 28,
              border: `1px solid ${ACCENT}`,
              borderRadius: '50%',
              fontSize: 14,
              color: ACCENT,
            }}>←</span>
            Toutes les actualités
          </Link>

          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap',
            marginBottom: 24,
            animation: 'ndFadeUp 0.6s ease 0.1s both',
          }}>
            {article.category && (
              <span style={{
                padding: '8px 16px',
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: 10, fontWeight: 900,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                borderRadius: 4,
                boxShadow: `0 0 25px ${ACCENT}aa`,
              }}>{article.category}</span>
            )}
            <span style={{
              padding: '8px 16px',
              background: 'rgba(0,0,0,0.85)',
              border: `1px solid ${ACCENT}55`,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              borderRadius: 4,
              backdropFilter: 'blur(12px)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#00d26a',
                boxShadow: '0 0 8px #00d26a',
                animation: 'ndBlink 1.4s ease-in-out infinite',
              }} />
              {article.source?.toUpperCase()}
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(32px, 5vw, 64px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 0.96,
            letterSpacing: '-0.035em',
            color: '#fff',
            margin: 0,
            marginBottom: 28,
            maxWidth: 1000,
            textShadow: `0 4px 30px rgba(0,0,0,0.95), 0 0 50px ${ACCENT}33`,
            animation: 'ndFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both',
          }}>{article.title}</h1>

          <div style={{
            display: 'flex', gap: 24, flexWrap: 'wrap',
            fontFamily: 'var(--font-display)',
            fontSize: 10, letterSpacing: '0.25em',
            fontWeight: 700,
            color: 'rgba(240,240,245,0.85)',
            animation: 'ndFadeUp 0.6s ease 0.4s both',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: ACCENT }}>🕒</span>
              {timeAgo(article.publishedAt)}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: ACCENT }}>📖</span>
              {article.readTime} min de lecture
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============ ARTICLE + SIDEBAR ============================= */}
      {/* ============================================================ */}
      <section
        className="container news-detail-layout"
        style={{
          maxWidth: 1400,
          padding: '60px 32px 40px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: 40,
          alignItems: 'flex-start',
        }}
      >
        {/* ============================================================ */}
        {/* ===== ARTICLE — ✅ PLUS DE BACKGROUND, PLUS DE BORDURE,   ==== */}
        {/* ===== PLUS DE SHADOW, PLUS DE BARRE TOP ================== */}
        {/* ============================================================ */}
        <article style={{
          position: 'relative',
          padding: '0 8px 0 0',   /* ✅ juste du padding, pas de fond */
          animation: 'ndFadeUp 0.8s ease 0.5s both',
        }}>
          {isContentShort && (
            <div style={{
              padding: '14px 18px',
              marginBottom: 32,
              background: 'rgba(255,135,0,0.08)',
              border: '1px solid rgba(255,135,0,0.3)',
              borderLeft: '3px solid #ff8700',
              borderRadius: 8,
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              color: '#ff8700',
              lineHeight: 1.5,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18 }}>ℹ️</span>
              <div>
                Le contenu complet n'a pas pu être extrait automatiquement.
                Consulte l'article original pour la version intégrale.
              </div>
            </div>
          )}

          {blocks.length === 0 ? (
            <p style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 16, lineHeight: 1.85,
              color: 'rgba(255,255,255,0.7)',
              margin: 0, fontStyle: 'italic',
            }}>
              Aucun contenu disponible. Clique sur « Voir l'original » ci-dessous.
            </p>
          ) : (
            blocks.map((block, idx) => {
              /* ===== HEADING ===== */
              if (block.type === 'heading') {
                return (
                  <h2
                    key={idx}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'clamp(20px, 2.5vw, 26px)',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      color: '#fff',   /* ✅ blanc */
                      marginTop: idx === 0 ? 0 : 44,
                      marginBottom: 20,
                      paddingBottom: 10,
                      borderBottom: `2px solid ${ACCENT}44`,
                      lineHeight: 1.2,
                    }}
                  >
                    {block.text}
                  </h2>
                );
              }

              /* ===== QUOTE ===== */
              if (block.type === 'quote') {
                return (
                  <blockquote
                    key={idx}
                    style={{
                      margin: '32px 0',
                      padding: '20px 28px',
                      borderLeft: `3px solid ${ACCENT}`,
                      fontFamily: 'Georgia, serif',
                      fontSize: 'clamp(16px, 1.8vw, 20px)',
                      fontStyle: 'italic',
                      lineHeight: 1.7,
                      color: 'rgba(255,255,255,0.95)',   /* ✅ blanc */
                    }}
                  >
                    « {block.text} »
                  </blockquote>
                );
              }

              /* ===== LIST ===== */
              if (block.type === 'list') {
                return (
                  <ul
                    key={idx}
                    style={{
                      margin: '20px 0 28px 0',
                      paddingLeft: 8,
                      listStyle: 'none',
                      fontFamily: 'Georgia, serif',
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: 'rgba(255,255,255,0.9)',   /* ✅ blanc */
                    }}
                  >
                    {block.items.map((item, i) => (
                      <li key={i} style={{
                        marginBottom: 12,
                        paddingLeft: 24,
                        position: 'relative',
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: 0, top: 2,
                          color: ACCENT,
                          fontWeight: 900,
                          fontSize: 14,
                        }}>◆</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }

              /* ===== PARAGRAPH ===== */
              const isLead = idx === 0;
              return (
                <p
                  key={idx}
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: isLead ? 19 : 17,
                    lineHeight: 1.9,
                    color: '#fff',   /* ✅ blanc pur */
                    margin: 0,
                    marginBottom: 24,
                    textAlign: 'justify',
                    letterSpacing: '0.005em',
                  }}
                >
                  {isLead && (
                    <span style={{
                      float: 'left',
                      fontSize: 64,
                      lineHeight: 0.85,
                      paddingRight: 14,
                      paddingTop: 8,
                      fontFamily: 'Georgia, serif',
                      fontWeight: 700,
                      color: ACCENT,
                      textShadow: `0 0 25px ${ACCENT}88`,
                    }}>
                      {block.text.charAt(0)}
                    </span>
                  )}
                  {isLead ? block.text.slice(1) : block.text}
                </p>
              );
            })
          )}

          {/* Footer article */}
          <div style={{
            marginTop: 48,
            paddingTop: 28,
            borderTop: `1px dashed ${ACCENT}33`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              letterSpacing: '0.3em',
              color: 'var(--text-dim)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{
                width: 5, height: 5,
                background: ACCENT,
                transform: 'rotate(45deg)',
                boxShadow: `0 0 8px ${ACCENT}`,
              }} />
              SOURCE · {article.source?.toUpperCase()}
            </div>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 22px',
                background: 'transparent',
                border: `1.5px solid ${ACCENT}`,
                borderRadius: 8,
                color: ACCENT,
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = ACCENT;
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.boxShadow = `0 0 25px ${ACCENT}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = ACCENT;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🔗 Voir l'original
            </a>
          </div>
        </article>

        <MetadataSidebar article={article} />
      </section>

      {/* ============================================================ */}
      {/* ============ ARTICLES LIÉS ================================= */}
      {/* ============================================================ */}
      {related.length > 0 && (
        <section className="container" style={{ maxWidth: 1400, padding: '40px 32px' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}>
              <div style={{
                width: 40, height: 2,
                background: ACCENT,
                boxShadow: `0 0 10px ${ACCENT}`,
              }} />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.45em',
                color: ACCENT,
                fontWeight: 700,
              }}>◆ À LIRE AUSSI</span>
            </div>

            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Continuez votre lecture
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {related.map((a) => (
              <RelatedCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* CTA RETOUR */}
      <section className="container" style={{
        maxWidth: 1400,
        padding: '20px 32px 0',
        textAlign: 'center',
      }}>
        <Link
          to="/news"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 36px',
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 10,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            textDecoration: 'none',
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = ACCENT;
            e.currentTarget.style.boxShadow = `0 0 40px ${ACCENT}`;
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← Toutes les actualités
        </Link>
      </section>

      <style>{`
        @media (max-width: 1024px) {
          .news-detail-layout {
            grid-template-columns: 1fr !important;
          }
          .news-detail-layout > aside {
            position: static !important;
            max-width: 500px;
            margin: 0 auto;
            padding: 24px 0 0 22px;
          }
        }
      `}</style>
    </div>
  );
}