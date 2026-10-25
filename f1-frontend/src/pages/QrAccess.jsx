import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { imgSrc } from '../utils/images';
import { useSound } from '../context/SoundContext';

const PHASE = {
  PORTAL: 'portal',
  WELCOME: 'welcome',
  ERROR: 'error',
};

export default function QrAccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { playCarPass } = useSound();

  const [phase, setPhase] = useState(PHASE.PORTAL);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [teamLogo, setTeamLogo] = useState(null);
  const [teamColor, setTeamColor] = useState('#e10600');

  /* ============================================================ */
  /* ============ PROGRESSION 0 → 100% ========================== */
  /* ============================================================ */
  useEffect(() => {
    if (phase !== PHASE.PORTAL) return;

    let raf;
    const t0 = performance.now();
    const duration = 2200;
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  /* ============================================================ */
  /* ============ APPEL API + ORCHESTRATION ==================== */
  /* ============================================================ */
  useEffect(() => {
    const qrToken = params.get('token');
    if (!qrToken) {
      setError('QR code invalide — token manquant');
      setPhase(PHASE.ERROR);
      return;
    }

    const startTime = performance.now();

    (async () => {
      try {
        const { data } = await api.get(
          `/auth/qr-login?token=${encodeURIComponent(qrToken)}`
        );
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        setUsername(data.username);

        try {
          const { data: profile } = await api.get('/fan/me');
          if (profile.favoriteTeamLogoUrl) setTeamLogo(imgSrc(profile.favoriteTeamLogoUrl));
          if (profile.favoriteTeamColor) setTeamColor(profile.favoriteTeamColor);
        } catch { /* profil indispo → fallback */ }

        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, 2200 - elapsed);

        setTimeout(() => {
          // 🔊 LE SEUL SON : voiture F1 qui passe
          playCarPass();
          setPhase(PHASE.WELCOME);

          setTimeout(() => {
            navigate('/fan', { replace: true });
          }, 2200);
        }, remaining);

      } catch (err) {
        setError('QR code invalide ou révoqué');
        setPhase(PHASE.ERROR);
      }
    })();
    // eslint-disable-next-line
  }, [params, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--f1-black)',
      position: 'relative',
      overflow: 'hidden',
      animation: 'qr-pageIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) both',
    }}>

      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(225,6,0,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(225,6,0,0.08) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
        pointerEvents: 'none',
        animation: 'qr-gridDrift 20s linear infinite',
      }} />

      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(18)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${i * 5.5}%`,
            left: 0, right: 0,
            height: i % 4 === 0 ? 2 : 1,
            background: `linear-gradient(90deg, transparent, ${
              i % 3 === 0 ? 'rgba(225,6,0,0.7)' : 'rgba(255,255,255,0.2)'
            }, transparent)`,
            animation: `qr-speedLine ${1.4 + (i % 5) * 0.3}s linear infinite`,
            animationDelay: `${i * 0.08}s`,
          }} />
        ))}
      </div>

      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 620, height: 620,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(225,6,0,0.45) 0%, transparent 65%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        animation: 'qr-haloPulse 3s ease-in-out infinite',
      }} />

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'repeating-linear-gradient(90deg, #e10600 0px, #e10600 20px, transparent 20px, transparent 30px)',
        animation: 'qr-telemetry 1.2s linear infinite',
        pointerEvents: 'none', zIndex: 6,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
        background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 10px, #e10600 10px, #e10600 30px)',
        animation: 'qr-telemetry 1.2s linear infinite reverse',
        pointerEvents: 'none', zIndex: 6,
      }} />

      {[
        { top: 24, left: 24, bt: true, bl: true },
        { top: 24, right: 24, bt: true, br: true },
        { bottom: 24, left: 24, bb: true, bl: true },
        { bottom: 24, right: 24, bb: true, br: true },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: c.top, left: c.left, right: c.right, bottom: c.bottom,
          width: 40, height: 40,
          borderTop: c.bt ? '3px solid #e10600' : 'none',
          borderBottom: c.bb ? '3px solid #e10600' : 'none',
          borderLeft: c.bl ? '3px solid #e10600' : 'none',
          borderRight: c.br ? '3px solid #e10600' : 'none',
          boxShadow: '0 0 20px rgba(225,6,0,0.6)',
          pointerEvents: 'none',
          zIndex: 4,
          animation: `qr-cornerPulse 2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}

      {/* ============ PHASE 1 : PORTAIL ============ */}
      {phase === PHASE.PORTAL && (
        <div style={{
          position: 'relative', textAlign: 'center',
          maxWidth: 520, padding: '40px 24px', zIndex: 10,
        }}>
          <div style={{
            position: 'relative', display: 'inline-block', marginBottom: 40,
            animation: 'qr-logoReveal 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 280, height: 280, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(225,6,0,0.75) 0%, transparent 70%)',
              filter: 'blur(50px)', pointerEvents: 'none',
              animation: 'qr-haloPulse 2.5s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 220, height: 220, borderRadius: '50%',
              border: '2px dashed rgba(225,6,0,0.7)',
              animation: 'qr-spin 6s linear infinite', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200, height: 200, borderRadius: '50%',
              border: '1px solid rgba(225,6,0,0.5)',
              animation: 'qr-ringExpand 2s ease-out infinite', pointerEvents: 'none',
            }} />
            <img src="/Logo.png" alt="F1 Apex" style={{
              position: 'relative', height: 150, width: 'auto',
              filter: 'drop-shadow(0 0 50px rgba(225,6,0,1)) drop-shadow(0 0 100px rgba(225,6,0,0.6))',
              animation: 'qr-logoFloat 3s ease-in-out infinite',
            }} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, #e10600)' }} />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.4em',
              color: '#e10600', fontWeight: 700, textShadow: '0 0 20px rgba(225,6,0,0.8)',
            }}>
              ◆ AUTHENTIFICATION QR ◆
            </span>
            <span style={{ width: 40, height: 1, background: 'linear-gradient(90deg, #e10600, transparent)' }} />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 38, fontWeight: 900,
            textTransform: 'uppercase', color: '#fff', marginBottom: 14,
            letterSpacing: '-0.02em',
            textShadow: '0 0 40px rgba(225,6,0,0.6), 0 4px 20px rgba(0,0,0,0.9)',
          }}>
            Ouverture du portail
          </h2>

          <p style={{
            color: 'var(--text-dim)', fontSize: 14,
            fontFamily: 'var(--font-heading)', marginBottom: 44, letterSpacing: '0.05em',
          }}>
            Vérification du badge en cours…
          </p>

          <div style={{
            position: 'relative', width: '100%', maxWidth: 460, height: 12,
            margin: '0 auto 14px', background: 'rgba(20,20,28,0.9)',
            border: '1px solid rgba(225,6,0,0.4)', borderRadius: 3, overflow: 'hidden',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 0 30px rgba(225,6,0,0.2)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #7a0300 0%, #e10600 50%, #ff1e00 100%)',
              boxShadow: '0 0 25px #e10600, 0 0 50px rgba(225,6,0,0.7)',
              transition: 'width 0.08s linear',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.18) 8px, rgba(255,255,255,0.18) 10px)',
              animation: 'qr-stripes 0.5s linear infinite',
              pointerEvents: 'none', opacity: 0.85,
            }} />
            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: 50,
              left: `${progress}%`, transform: 'translateX(-50%)',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
              filter: 'blur(6px)', pointerEvents: 'none',
              transition: 'left 0.08s linear',
            }} />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            maxWidth: 460, margin: '0 auto 40px',
            fontFamily: 'var(--font-display)', fontSize: 11,
            letterSpacing: '0.2em', color: 'var(--text-dim)',
          }}>
            <span style={{ color: '#e10600', fontWeight: 700 }}>◆ PORTAIL</span>
            <span style={{
              color: '#fff', fontWeight: 900, fontSize: 18,
              textShadow: '0 0 20px rgba(225,6,0,0.9)',
            }}>
              {progress}%
            </span>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
            fontFamily: 'var(--font-display)', fontSize: 9,
            letterSpacing: '0.2em', color: 'var(--text-dim)',
          }}>
            {[
              { label: 'TOKEN', active: progress > 20 },
              { label: 'SIGN',  active: progress > 45 },
              { label: 'DB',    active: progress > 70 },
              { label: 'JWT',   active: progress > 90 },
            ].map((s) => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: s.active ? 1 : 0.3, transition: 'opacity 0.3s',
              }}>
                <span style={{
                  width: 6, height: 6,
                  background: s.active ? '#e10600' : '#333',
                  boxShadow: s.active ? '0 0 8px #e10600' : 'none',
                  transform: 'rotate(45deg)',
                }} />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ PHASE 2 : BIENVENUE ============ */}
      {phase === PHASE.WELCOME && (
        <div style={{
          position: 'relative', textAlign: 'center',
          maxWidth: 520, padding: '40px 24px', zIndex: 10,
          animation: 'qr-welcomeIn 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}>
          <div style={{
            position: 'relative', display: 'inline-block', marginBottom: 40,
            animation: 'qr-teamReveal 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 320, height: 320, borderRadius: '50%',
              background: `radial-gradient(circle, ${teamColor}cc 0%, transparent 70%)`,
              filter: 'blur(60px)', pointerEvents: 'none',
              animation: 'qr-haloPulse 2.5s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 260, height: 260, borderRadius: '50%',
              border: `2px dashed ${teamColor}`,
              animation: 'qr-spin 8s linear infinite',
              pointerEvents: 'none', opacity: 0.8,
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 240, height: 240, borderRadius: '50%',
              border: `1px solid ${teamColor}66`,
              animation: 'qr-ringExpand 2s ease-out infinite',
              pointerEvents: 'none',
            }} />

            {teamLogo ? (
              <img src={teamLogo} alt="Écurie favorite" style={{
                position: 'relative', height: 170, width: 'auto',
                background: '#fff', padding: 22, borderRadius: 22,
                boxShadow: `0 0 60px ${teamColor}dd, 0 0 120px ${teamColor}88, 0 20px 60px rgba(0,0,0,0.8)`,
                animation: 'qr-logoFloat 3s ease-in-out infinite',
              }} onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <img src="/Logo.png" alt="F1 Apex" style={{
                position: 'relative', height: 150, width: 'auto',
                filter: `drop-shadow(0 0 50px ${teamColor}) drop-shadow(0 0 100px ${teamColor}88)`,
                animation: 'qr-logoFloat 3s ease-in-out infinite',
              }} />
            )}
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ width: 40, height: 2, background: '#00d26a', boxShadow: '0 0 15px #00d26a' }} />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.4em',
              color: '#00d26a', fontWeight: 700, textShadow: '0 0 20px rgba(0,210,106,0.9)',
            }}>
              ◆ ACCÈS AUTORISÉ ◆
            </span>
            <span style={{ width: 40, height: 2, background: '#00d26a', boxShadow: '0 0 15px #00d26a' }} />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 40, fontWeight: 900,
            textTransform: 'uppercase', color: '#fff', marginBottom: 12,
            letterSpacing: '-0.02em',
            textShadow: `0 0 40px ${teamColor}, 0 4px 20px rgba(0,0,0,0.9)`,
            animation: 'qr-welcomeText 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both',
          }}>
            Bienvenue
          </h2>

          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900,
            letterSpacing: '0.15em', color: teamColor,
            textShadow: `0 0 30px ${teamColor}, 0 0 60px ${teamColor}88`,
            marginBottom: 30,
            animation: 'qr-welcomeText 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both',
          }}>
            {username.toUpperCase()}
          </div>

          <p style={{
            color: 'var(--text-mid)', fontSize: 14,
            fontFamily: 'var(--font-heading)', letterSpacing: '0.05em',
            animation: 'qr-welcomeText 0.6s ease 0.9s both',
          }}>
            Redirection vers ton espace fan…
          </p>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32,
            animation: 'qr-welcomeText 0.6s ease 1s both',
          }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: teamColor, boxShadow: `0 0 12px ${teamColor}`,
                animation: `qr-dotPulse 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>

          <div style={{
            position: 'fixed', inset: 0,
            background: 'radial-gradient(circle at center, rgba(0,210,106,0.35) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'qr-flashGreen 1s ease-out forwards',
            zIndex: 5,
          }} />
        </div>
      )}

      {/* ============ PHASE 3 : ERREUR ============ */}
      {phase === PHASE.ERROR && (
        <div style={{
          position: 'relative', textAlign: 'center',
          maxWidth: 460, padding: '40px 24px', zIndex: 10,
        }}>
          <img src="/Logo.png" alt="F1 Apex" style={{
            height: 100, width: 'auto', marginBottom: 32,
            filter: 'drop-shadow(0 0 40px rgba(225,6,0,0.7))',
          }} />
          <div style={{
            fontSize: 72, marginBottom: 20,
            filter: 'drop-shadow(0 0 30px rgba(225,6,0,0.9))',
            animation: 'qr-errorPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}>⚠️</div>

          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900,
            textTransform: 'uppercase', color: '#fff', marginBottom: 12,
          }}>Accès refusé</h2>

          <p style={{
            color: 'var(--text-mid)', fontSize: 14,
            marginBottom: 32, fontFamily: 'var(--font-heading)',
          }}>{error}</p>

          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #e10600, #b80500)',
              color: '#fff',
              fontFamily: 'var(--font-heading)', fontWeight: 700,
              fontSize: 12, textTransform: 'uppercase',
              letterSpacing: '0.15em', textDecoration: 'none',
              borderRadius: 6,
              boxShadow: '0 4px 20px rgba(225,6,0,0.5)',
              clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
            }}
          >
            Aller à la connexion →
          </Link>
        </div>
      )}

      <style>{`
        @keyframes qr-pageIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes qr-gridDrift { 0% { background-position: 0 0; } 100% { background-position: 60px 60px; } }
        @keyframes qr-speedLine {
          0%   { transform: translateX(-100%); opacity: 0; }
          10%  { opacity: 1; } 90% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes qr-haloPulse {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.12); }
        }
        @keyframes qr-cornerPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes qr-telemetry { 0% { background-position: 0 0; } 100% { background-position: 30px 0; } }
        @keyframes qr-stripes { 0% { background-position: 0 0; } 100% { background-position: 30px 0; } }
        @keyframes qr-logoReveal {
          0%   { opacity: 0; transform: scale(0.5) rotate(-15deg); filter: blur(20px); }
          60%  { opacity: 1; transform: scale(1.1) rotate(3deg); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
        }
        @keyframes qr-logoFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes qr-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes qr-ringExpand {
          0%   { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
        }
        @keyframes qr-welcomeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes qr-teamReveal {
          0%   { opacity: 0; transform: scale(0.3) rotate(-20deg); filter: blur(20px); }
          60%  { opacity: 1; transform: scale(1.15) rotate(5deg); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
        }
        @keyframes qr-welcomeText {
          0%   { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes qr-dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes qr-flashGreen {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes qr-errorPop {
          0%   { transform: scale(0) rotate(180deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(-10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}