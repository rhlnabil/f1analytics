import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setError('');

    // Validations côté client
    if (!form.email.includes('@')) {
      setError('Format d\'email invalide');
      return;
    }
    if (form.username.length < 3) {
      setError('Nom d\'utilisateur : 3 caractères minimum');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 4) {
      setError('Mot de passe : 4 caractères minimum');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);
      navigate('/fan');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--f1-black)',
    }}>
      {/* ===== GAUCHE — VIDEO ===== */}
      <div style={{ position: 'relative', overflow: 'hidden', background: '#000' }}>
        <video
          src="/Opening.mp4"
          autoPlay loop muted playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
          }}
        />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(225,6,0,0.35) 60%, rgba(0,0,0,0.85) 100%)',
          zIndex: 1,
        }} />

        <div style={{ position: 'absolute', inset: 0, opacity: 0.35, zIndex: 2, pointerEvents: 'none' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${i * 12}%`, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${i % 2 ? 'rgba(225,6,0,0.6)' : 'rgba(255,255,255,0.25)'}, transparent)`,
              animation: `speedLine ${2 + i * 0.3}s linear infinite`,
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>

        <div style={{
          position: 'relative', zIndex: 3, height: '100%',
          display: 'grid', placeItems: 'center', padding: 60, textAlign: 'center',
        }}>
          <div style={{ maxWidth: 500 }}>
            <img src="/Logo.png" alt="F1 Apex Logo"
              style={{
                height: 180, width: 'auto', marginBottom: 40,
                filter: 'drop-shadow(0 0 40px rgba(225,6,0,0.9)) drop-shadow(0 4px 20px rgba(0,0,0,0.9))',
              }} />
            <p style={{
              fontSize: 18, color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6, textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            }}>
              Rejoins la communauté F1 Apex.<br />
              Choisis ton écurie et ton pilote favoris.
            </p>
            <div style={{
              marginTop: 60, fontFamily: 'var(--font-display)',
              fontSize: 11, letterSpacing: '0.4em',
              color: 'var(--f1-red)', textShadow: '0 0 20px rgba(225,6,0,0.8)',
            }}>
              ■ ■ ■ ■ ■
            </div>
          </div>
        </div>
      </div>

      {/* ===== DROITE — FORMULAIRE ===== */}
      <div style={{
        display: 'grid', placeItems: 'center', padding: 60,
        background: 'var(--f1-black)',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 11,
            letterSpacing: '0.3em', color: 'var(--f1-red)', marginBottom: 12,
          }}>
            ■ DEVENIR FAN
          </div>

          <h2 style={{ marginBottom: 8 }}>Inscription</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: 36, fontSize: 15 }}>
            Crée ton compte fan pour choisir tes favoris
          </p>

          <form onSubmit={submit}>
            {/* EMAIL */}
            <div style={{ marginBottom: 20 }}>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="ton.email@gmail.com"
                required
                autoFocus
              />
            </div>

            {/* USERNAME */}
            <div style={{ marginBottom: 20 }}>
              <label>Nom d'utilisateur</label>
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="ton pseudo"
                required
                minLength={3}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: 20 }}>
              <label>Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={4}
              />
            </div>

            {/* CONFIRM */}
            <div style={{ marginBottom: 20 }}>
              <label>Confirmer le mot de passe</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', marginTop: 12, padding: '14px 24px', fontSize: 13,
                opacity: loading ? 0.6 : 1,
                background: 'linear-gradient(135deg, #e10600 0%, #b80500 100%)',
                clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
              }}
            >
              {loading ? 'Inscription...' : '🏁 Créer mon compte'}
            </button>
          </form>

          <div style={{
            marginTop: 32, paddingTop: 24,
            borderTop: '1px solid var(--border)',
          }}>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
              Déjà un compte ?{' '}
              <Link to="/login" style={{ color: 'var(--f1-red)', fontWeight: 700 }}>
                Se connecter
              </Link>
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center' }}>
              <Link to="/" style={{ color: 'var(--f1-red)' }}>
                ← Retour au site
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}