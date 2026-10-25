import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const links = [
    { to: '/admin/drivers',  label: 'Pilotes',        icon: '🏎️' },
    { to: '/admin/teams',    label: 'Écuries',        icon: '🏆' },
    { to: '/admin/circuits', label: 'Circuits',       icon: '🛣️' },
    { to: '/admin/races',    label: 'Courses',        icon: '📅' },
    { to: '/admin/results',  label: 'Résultats',      icon: '📊' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--f1-black)' }}>
      <aside style={{
        width: 260,
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
        padding: '24px 0', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '0 20px', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/Logo.png" alt="F1 Apex" style={{
              height: 44, width: 'auto',
              filter: 'drop-shadow(0 0 12px rgba(225,6,0,0.5))',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900,
                color: 'var(--f1-white)', letterSpacing: 0.5,
              }}>F1 <span style={{ color: 'var(--f1-red)' }}>APEX</span></span>
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.2em',
                color: 'var(--text-dim)', marginTop: 4,
              }}>Admin</span>
            </div>
          </Link>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map(l => {
            const active = location.pathname === l.to;
            return (
              <Link key={l.to} to={l.to} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 24px',
                fontFamily: 'var(--font-heading)', fontSize: 14,
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: active ? 'var(--f1-white)' : 'var(--text-dim)',
                background: active ? 'linear-gradient(90deg, rgba(225,6,0,0.15), transparent)' : 'transparent',
                borderLeft: active ? '3px solid var(--f1-red)' : '3px solid transparent',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 18 }}>{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '0 24px' }}>
          <Link to="/" style={{ display: 'block', color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>
            ← Site public
          </Link>
          <button className="secondary" onClick={logout} style={{ width: '100%' }}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 40, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}