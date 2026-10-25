import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';

export default function RaceHighlights({ raceId, raceName, teamColor = '#e10600' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !raceId) return;
    setLoading(true);
    api.get(`/races/${raceId}/highlights`)
      .then(r => setData(r.data))
      .catch(err => setError(err?.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [visible, raceId]);

  if (loading) return (
    <section ref={sectionRef} style={{
      padding: '32px 0', textAlign: 'center',
      fontFamily: 'var(--font-display)', fontSize: 11,
      letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)',
    }}>🎥 CHARGEMENT HIGHLIGHTS...</section>
  );

  if (error || !data?.available) return <div ref={sectionRef} />;

  const openYouTube = () => window.open(data.watchUrl, '_blank', 'noopener,noreferrer');

  return (
    <section ref={sectionRef} style={{ padding: '40px 0' }}>
      <style>{`
        @keyframes highlightsFadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes playPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
        animation: 'highlightsFadeIn 0.6s ease',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.35em',
          color: teamColor, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ width: 6, height: 6, background: teamColor, transform: 'rotate(45deg)', boxShadow: `0 0 10px ${teamColor}` }} />
          ◆ HIGHLIGHTS OFFICIELS
        </div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${teamColor}66, transparent)` }} />
      </div>

      <button type="button" onClick={openYouTube} style={{
        all: 'unset', cursor: 'pointer', display: 'block', width: '100%',
        position: 'relative', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden',
        background: '#000', border: `1.5px solid ${teamColor}44`,
        boxShadow: `0 20px 60px -20px ${teamColor}88, 0 0 60px ${teamColor}22`,
        animation: 'highlightsFadeIn 0.7s ease 0.1s both',
        transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 30px 80px -20px ${teamColor}cc, 0 0 80px ${teamColor}44`;
          e.currentTarget.style.borderColor = teamColor;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 20px 60px -20px ${teamColor}88, 0 0 60px ${teamColor}22`;
          e.currentTarget.style.borderColor = `${teamColor}44`;
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${data.thumbnail})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.9) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 90, height: 90, borderRadius: '50%',
          background: 'rgba(225,6,0,0.95)', border: '3px solid #fff',
          boxShadow: `0 0 40px ${teamColor}, 0 0 80px ${teamColor}66`,
          display: 'grid', placeItems: 'center',
          animation: 'playPulse 2s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 40, color: '#fff', marginLeft: 6, lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>▶</span>
        </div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '60px 24px 20px',
          background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.95))',
          textAlign: 'left',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 9,
            letterSpacing: '0.3em', color: teamColor, fontWeight: 700, marginBottom: 6,
          }}>▶ {data.channelTitle?.toUpperCase() || 'FORMULA 1'}</div>
          <div style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(16px, 2vw, 22px)',
            fontWeight: 900, color: '#fff', textTransform: 'uppercase',
            lineHeight: 1.1, textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', marginBottom: 12,
          }}>{data.title}</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', background: `rgba(225,6,0,0.95)`, borderRadius: 6,
            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900,
            color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(225,6,0,0.5)',
          }}>▶ Ouvrir sur YouTube</div>
        </div>
      </button>

      {data.alternatives?.length > 0 && (
        <div style={{ marginTop: 24, animation: 'highlightsFadeIn 0.7s ease 0.2s both' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 9,
            letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)',
            fontWeight: 700, marginBottom: 12,
          }}>◆ PLUS DE VIDÉOS</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {data.alternatives.map((alt, i) => (
              <a key={alt.videoId} href={alt.watchUrl} target="_blank" rel="noopener noreferrer" style={{
                textDecoration: 'none', color: 'inherit',
                background: 'rgba(0,0,0,0.5)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 8, overflow: 'hidden', transition: 'all 0.3s',
                animation: `highlightsFadeIn 0.5s ease ${i * 0.05}s both`,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = teamColor;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 10px 30px -10px ${teamColor}88`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  position: 'relative', width: '100%', aspectRatio: '16 / 9',
                  backgroundImage: alt.thumbnail ? `url(${alt.thumbnail})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  background: alt.thumbnail ? undefined : '#0a0a0a',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.9) 100%)' }} />
                  <div style={{
                    position: 'absolute', bottom: 6, right: 6, padding: '2px 6px',
                    background: 'rgba(225,6,0,0.9)', borderRadius: 3,
                    fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 900,
                    color: '#fff', letterSpacing: '0.1em',
                  }}>▶</div>
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700,
                    color: '#fff', lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>{alt.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}