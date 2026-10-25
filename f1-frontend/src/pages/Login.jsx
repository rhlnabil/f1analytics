import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api, { API_BASE } from '../api/axios';   


const QR_SCANNER_ID = 'f1-qr-scanner-region';

/* ============================================================ */
/* ============ FORCE STOP CAMERA ============================= */
/* ============================================================ */
function forceReleaseAllCameras() {
  document.querySelectorAll('video').forEach((video) => {
    const stream = video.srcObject;
    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach((track) => {
        try { track.stop(); } catch { /* ignore */ }
      });
    }
    try { video.srcObject = null; } catch { /* ignore */ }
  });
}

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canvasRef = useRef(null);

  const [qrScanning, setQrScanning] = useState(false);
  const [qrError, setQrError] = useState('');
  const qrScannerRef = useRef(null);

  const oauthError = searchParams.get('error');

  /* ============ PARTICULES CANVAS ============ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let particles = [];
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', onMouseMove);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
      });
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(225, 6, 0, ${0.15 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 6, 0, ${0.4 + Math.random() * 0.3})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  /* ============ LOGIN ============ */
  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);
      navigate(data.role === 'ROLE_ADMIN' ? '/admin/drivers' : '/fan');
    } catch {
      setError('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    setGoogleLoading(true);
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  /* ============ CAMERA ============ */
  const stopQrScan = async () => {
    const scanner = qrScannerRef.current;
    qrScannerRef.current = null;

    if (scanner) {
      try {
        const state = scanner.getState?.();
        if (state === 2 || state === 3) await scanner.stop();
      } catch { /* ignore */ }
      try { scanner.clear(); } catch { /* ignore */ }
    }
    forceReleaseAllCameras();
    setQrScanning(false);
  };

  const startQrScan = () => {
    setQrError('');
    setQrScanning(true);
  };

  /* ============ HANDLER QR ============ */
  const handleQrScanned = async (decodedText) => {
    await stopQrScan();

    let token = decodedText;
    try {
      const url = new URL(decodedText);
      const fromUrl = url.searchParams.get('token');
      if (fromUrl) token = fromUrl;
    } catch { /* brute */ }

    if (!token || token.length < 20) {
      setQrError('QR code invalide');
      setTimeout(() => setQrScanning(true), 300);
      return;
    }

    navigate(`/qr-access?token=${encodeURIComponent(token)}`, { replace: true });
  };

  /* ============ SCANNER LIFECYCLE ============ */
  useEffect(() => {
    if (!qrScanning) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        const scanner = new Html5Qrcode(QR_SCANNER_ID);
        qrScannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (text) => { if (!cancelled) handleQrScanned(text); },
          () => {}
        );
      } catch (err) {
        if (!cancelled) {
          setQrError(
            err?.message?.includes('Permission')
              ? 'Autorisation caméra refusée'
              : 'Impossible d\'accéder à la caméra'
          );
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      const scanner = qrScannerRef.current;
      qrScannerRef.current = null;
      if (scanner) {
        try {
          const state = scanner.getState?.();
          if (state === 2 || state === 3) scanner.stop().catch(() => {});
        } catch {}
        try { scanner.clear(); } catch {}
      }
      forceReleaseAllCameras();
    };
  }, [qrScanning]);

  useEffect(() => {
    return () => { forceReleaseAllCameras(); };
  }, []);

  /* ============ RENDER ============ */
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--f1-black)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ===== GAUCHE : VIDEO ===== */}
      <div style={{ position: 'relative', overflow: 'hidden', background: '#000' }}>
        <video
          src="/Opening.mp4"
          autoPlay loop muted playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(225,6,0,0.4) 60%, rgba(0,0,0,0.9) 100%)',
          zIndex: 1,
        }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, zIndex: 2, pointerEvents: 'none' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${i * 8.5}%`,
              left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${i % 2 ? 'rgba(225,6,0,0.7)' : 'rgba(255,255,255,0.3)'}, transparent)`,
              animation: `speedLine ${1.8 + i * 0.25}s linear infinite`,
              animationDelay: `${i * 0.12}s`,
            }} />
          ))}
        </div>
        <div style={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, textAlign: 'center' }}>
          <div style={{ maxWidth: 500, position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400, height: 400,
              background: 'radial-gradient(circle, rgba(225,6,0,0.5) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'logoPulse 4s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            <img src="/Logo.png" alt="F1 Apex" style={{
              height: 180, width: 'auto',
              position: 'relative', zIndex: 1,
              marginBottom: 40,
              filter: 'drop-shadow(0 0 40px rgba(225,6,0,0.9)) drop-shadow(0 4px 20px rgba(0,0,0,0.9))',
              animation: 'float 5s ease-in-out infinite',
            }} />
            <p style={{
              fontSize: 18, color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.7, textShadow: '0 2px 10px rgba(0,0,0,0.9)',
              position: 'relative', zIndex: 1,
            }}>
              Accédez à votre espace personnel F1 Apex.<br />
              Retrouvez vos pilotes et écuries favoris.
            </p>
          </div>
        </div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, transparent 0%, #e10600 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'borderSlide 3s linear infinite',
          boxShadow: '0 0 30px rgba(225,6,0,0.8)',
          zIndex: 4,
        }} />
      </div>

      {/* ===== DROITE : FORM ===== */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--f1-black)', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px 20px', maxWidth: 560, margin: '0 auto', width: '100%' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--f1-red)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 20, height: 1, background: 'var(--f1-red)', boxShadow: '0 0 10px var(--f1-red)' }} />
            ■ CONNEXION
          </div>

          <h2 style={{
            marginBottom: 8, fontSize: 42,
            background: 'linear-gradient(135deg, #fff 0%, #b8b8c0 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Bienvenue</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: 40, fontSize: 15, fontFamily: 'var(--font-heading)' }}>
            Connecte-toi à ton espace
          </p>

        {oauthError && (
  <div style={{
    padding: '12px 16px',
    background: 'rgba(255,85,85,0.1)',
    border: '1px solid rgba(255,85,85,0.4)',
    borderLeft: '3px solid #ff5555',
    borderRadius: 6,
    marginBottom: 24,
    color: '#ff5555',
    fontSize: 13,
    fontFamily: 'var(--font-heading)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  }}>
    <span>
      {oauthError === 'oauth_failed' ? 'Échec de la connexion Google' :
       oauthError === 'oauth_user_not_found' ? 'Utilisateur Google introuvable' :
       oauthError === 'oauth_no_email' ? 'Aucun email Google fourni' :
       oauthError === 'access_denied' ? 'Accès refusé sur Google' :
       `Erreur OAuth : ${oauthError}`}
    </span>
    <button
      onClick={loginWithGoogle}
      disabled={googleLoading}
      style={{
        all: 'unset',
        cursor: 'pointer',
        padding: '4px 12px',
        background: 'rgba(255,85,85,0.2)',
        borderRadius: 3,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      ↻ Réessayer
    </button>
  </div>
)}
          <form onSubmit={submit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 4, height: 4, background: 'var(--f1-red)', transform: 'rotate(45deg)', boxShadow: '0 0 6px var(--f1-red)' }} />
                Nom d'utilisateur
              </label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="ton pseudo" required style={{ background: 'rgba(20,20,26,0.7)', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 4, height: 4, background: 'var(--f1-red)', transform: 'rotate(45deg)', boxShadow: '0 0 6px var(--f1-red)' }} />
                Mot de passe
              </label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required style={{ background: 'rgba(20,20,26,0.7)', border: '1px solid var(--border)' }} />
            </div>
            {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px 24px', fontSize: 13,
              opacity: loading ? 0.6 : 1,
              background: 'linear-gradient(135deg, #e10600 0%, #b80500 100%)',
              clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
            }}>
              {loading ? '⟳ Connexion...' : '🔓 Se connecter'}
            </button>
          </form>

          <p style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
            Pas encore de compte ?{' '}<Link to="/register" style={{ color: 'var(--f1-red)', fontWeight: 700 }}>Devenir Fan</Link>
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, padding: '0 80px 60px', maxWidth: 560, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(225,6,0,0.4))' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, border: '1px solid var(--f1-red)', transform: 'rotate(45deg)' }} />
              OU CONTINUER AVEC
              <span style={{ width: 6, height: 6, border: '1px solid var(--f1-red)', transform: 'rotate(45deg)' }} />
            </span>
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(225,6,0,0.4), transparent)' }} />
          </div>

          <button type="button" onClick={startQrScan} style={{
            position: 'relative', width: '100%', padding: '20px 28px', marginBottom: 16,
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 50%, #0a0a0a 100%)',
            border: '2px solid rgba(225,6,0,0.6)', borderRadius: 8, color: '#fff',
            fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.15em',
            cursor: 'pointer', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            transition: 'all 0.35s', clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(225,6,0,0.15)',
          }}>
            <span style={{ position: 'relative', zIndex: 1, display: 'grid', placeItems: 'center', width: 32, height: 32, background: '#fff', borderRadius: 6, padding: 4, flexShrink: 0, boxShadow: '0 0 15px rgba(225,6,0,0.6)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zM3 15h6v6H3v-6zm2 2v2h2v-2H5zM15 3h6v6h-6V3zm2 2v2h2V5h-2z" fill="#e10600"/>
                <path d="M15 15h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm2 0h2v2h-2v-2zm2 0h2v2h-2v-2z" fill="#7a0300"/>
              </svg>
            </span>
            <span style={{ position: 'relative', zIndex: 1, color: '#fff', textShadow: '0 0 20px rgba(225,6,0,0.8)' }}>
              Scanner un badge QR
            </span>
          </button>

          <button type="button" onClick={loginWithGoogle} disabled={googleLoading} style={{
            position: 'relative', width: '100%', padding: '20px 28px',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 50%, #0a0a0a 100%)',
            border: '2px solid rgba(225,6,0,0.6)', borderRadius: 8, color: '#fff',
            fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.15em',
            cursor: googleLoading ? 'wait' : 'pointer', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            transition: 'all 0.35s', clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(225,6,0,0.15)',
          }}>
            <span style={{ position: 'relative', zIndex: 1, display: 'grid', placeItems: 'center', width: 32, height: 32, background: '#fff', borderRadius: '50%', padding: 4, flexShrink: 0, boxShadow: '0 0 15px rgba(225,6,0,0.6)' }}>
              <svg width="22" height="22" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C36.9 40.3 44 35 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
            </span>
            <span style={{ position: 'relative', zIndex: 1, color: '#fff', textShadow: '0 0 20px rgba(225,6,0,0.6)' }}>
              {googleLoading ? '⟳ Redirection...' : 'Continuer avec Google'}
            </span>
          </button>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: 'var(--text-dim)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>← Retour au site</Link>
            <span style={{ color: 'var(--border)' }}>·</span>
          </div>
        </div>
      </div>

      {/* ===== OVERLAY SCANNER ===== */}
      {qrScanning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(3,3,8,0.98)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 20, animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ position: 'absolute', top: 30, left: 0, right: 0, padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.4em', color: '#e10600', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 24, height: 2, background: '#e10600' }} />
                QR ACCESS SCANNER
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: 0 }}>
                Scanne ton badge
              </h2>
            </div>
            <button onClick={stopQrScan} style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 22, fontWeight: 700, cursor: 'pointer',
              display: 'grid', placeItems: 'center', transition: 'all 0.25s',
            }}>×</button>
          </div>

          <div style={{
            position: 'relative', width: '100%', maxWidth: 500, aspectRatio: '1 / 1',
            borderRadius: 20, overflow: 'hidden',
            border: '2px solid rgba(225,6,0,0.6)',
            boxShadow: '0 40px 80px -20px rgba(225,6,0,0.6), 0 0 80px rgba(225,6,0,0.4)',
            background: '#000',
          }}>
            <div id={QR_SCANNER_ID} style={{ width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'grid', placeItems: 'center' }}>
              <div style={{ position: 'relative', width: '70%', height: '70%' }}>
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg, transparent 0%, #e10600 50%, transparent 100%)',
                  boxShadow: '0 0 20px #e10600, 0 0 40px #e10600',
                  animation: 'qrScanLine 2s ease-in-out infinite',
                }} />
                <span style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTop: '3px solid #e10600', borderLeft: '3px solid #e10600' }} />
                <span style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTop: '3px solid #e10600', borderRight: '3px solid #e10600' }} />
                <span style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottom: '3px solid #e10600', borderLeft: '3px solid #e10600' }} />
                <span style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottom: '3px solid #e10600', borderRight: '3px solid #e10600' }} />
              </div>
            </div>
          </div>

          {qrError && (
            <div style={{
              marginTop: 24, padding: '12px 24px',
              background: 'rgba(255,85,85,0.1)',
              border: '1px solid rgba(255,85,85,0.4)',
              borderLeft: '3px solid #ff5555',
              borderRadius: 6, color: '#ff5555', fontSize: 13,
              fontFamily: 'var(--font-heading)', fontWeight: 600,
              maxWidth: 500, textAlign: 'center',
            }}>{qrError}</div>
          )}

          <div style={{ marginTop: 30, fontFamily: 'var(--font-heading)', fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 500, lineHeight: 1.6 }}>
            💡 Présente le QR code de ton badge F1 Apex<br />face à la caméra
          </div>
        </div>
      )}

      <style>{`
        @keyframes speedLine { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes borderSlide { 0% { background-position: 0% 0%; } 100% { background-position: 200% 0%; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes logoPulse { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qrScanLine { 0%, 100% { top: 0%; } 50% { top: calc(100% - 3px); } }

        #${QR_SCANNER_ID} > div:first-child > div:first-child { display: none !important; }
        #${QR_SCANNER_ID} video { width: 100% !important; height: 100% !important; object-fit: cover !important; }

        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}