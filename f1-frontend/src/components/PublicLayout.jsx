import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WeatherWidget from './WeatherWidget';
import LanguageSwitcher from './LanguageSwitcher';
import StaggeredMenu from './StaggeredMenu';
import NextRaceCountdown from './NextRaceCountdown';
import ChatBot from './Chatbot';

export default function PublicLayout({ children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [lightState, setLightState] = useState(0);
  const [authVersion, setAuthVersion] = useState(0);

  useEffect(() => {
    let timeout;
    const sequence = () => {
      setLightState((prev) => (prev >= 8 ? 0 : prev + 1));
      timeout = setTimeout(sequence, 700);
    };
    timeout = setTimeout(sequence, 700);
    return () => clearTimeout(timeout);
  }, []);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setAuthVersion((v) => v + 1);
    navigate('/');
  };

  const menuItems = [
    { label: t('nav.home'),      ariaLabel: t('nav.home'),      link: '/' },
    { label: t('nav.drivers'),   ariaLabel: t('nav.drivers'),   link: '/drivers' },
    { label: t('nav.teams'),     ariaLabel: t('nav.teams'),     link: '/teams' },
    { label: t('nav.races'),     ariaLabel: t('nav.races'),     link: '/races' },
    { label: t('nav.standings'), ariaLabel: t('nav.standings'), link: '/standings' },
    { label: t('nav.cinema'),    ariaLabel: t('nav.cinema'),    link: '/cinema' },
  ];

  if (token) {
    if (role === 'ROLE_ADMIN') {
      menuItems.push({ label: t('nav.admin'), ariaLabel: t('nav.admin'), link: '/admin/drivers' });
    } else {
      menuItems.push({ label: t('nav.fanSpace'), ariaLabel: t('nav.fanSpace'), link: '/fan' });
      menuItems.push({ label: t('nav.games'),    ariaLabel: t('nav.games'),    link: '/fan/games' });
    }
    menuItems.push({ label: t('nav.logout'), ariaLabel: t('nav.logout'), onClick: logout });
  } else {
    menuItems.push({ label: t('nav.login'),    ariaLabel: t('nav.login'),    link: '/login' });
    menuItems.push({ label: t('nav.register'), ariaLabel: t('nav.register'), link: '/register' });
  }

  const socialItems = [
    { label: t('footer.twitter'),  link: 'https://twitter.com' },
    { label: t('footer.github'),   link: 'https://github.com' },
    { label: t('footer.linkedin'), link: 'https://linkedin.com' },
  ];

  const accent = '#e10600';

  const getLightColor = (index) => {
    if (lightState === 0) return { bg: '#1a0000', glow: 'none' };
    if (lightState >= 1 && lightState <= 5) {
      if (index < lightState) return { bg: '#e10600', glow: '0 0 12px #e10600, 0 0 24px rgba(225,6,0,0.7)' };
      return { bg: '#1a0000', glow: 'none' };
    }
    return { bg: '#00d26a', glow: '0 0 12px #00d26a, 0 0 24px rgba(0,210,106,0.7)' };
  };

  const footerLinks = [
    { to: '/',         label: t('nav.home') },
    { to: '/drivers',  label: t('nav.drivers') },
    { to: '/teams',    label: t('nav.teams') },
    { to: '/races',    label: t('nav.races') },
    { to: '/cinema',   label: t('nav.cinema') },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Top status bar */}
      <div className="top-status-bar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 40, zIndex: 500,
        background: 'linear-gradient(90deg, #0a0a0f 0%, #15151c 50%, #0a0a0f 100%)',
        borderBottom: '1px solid rgba(225,6,0,0.25)',
        padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.2em', color: 'var(--text-dim)',
        overflow: 'visible', gap: 12,
      }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: 200,
          background: 'linear-gradient(90deg, transparent, rgba(225,6,0,0.3), transparent)',
          animation: 'scanAcross 8s linear infinite', pointerEvents: 'none',
        }} />

        <div className="top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#00d26a', boxShadow: '0 0 8px #00d26a',
              animation: 'pulseGlow 2s infinite',
            }} />
            <span style={{ color: '#fff' }}>{t('statusBar.sessionLive')}</span>
          </div>
          <span className="hide-mobile" style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
          <span className="hide-mobile">{t('statusBar.fp1Season')}</span>
          <span className="hide-mobile" style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
          <span className="hide-mobile" style={{ color: '#e10600', animation: 'blink 1.2s infinite step-end' }}>● {t('statusBar.rec')}</span>

          <span className="hide-mobile" style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)' }} />
          <NextRaceCountdown variant="compact" accentColor="#e10600" />

          <div className="hide-mobile" style={{
            display: 'flex', gap: 4, padding: '4px 8px',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, marginLeft: 8,
          }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const { bg, glow } = getLightColor(i);
              return (
                <span key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: bg,
                  boxShadow: glow !== 'none' ? glow : 'inset 0 0 4px rgba(0,0,0,0.9)',
                  transition: 'background 0.25s ease, box-shadow 0.25s ease',
                  border: '1px solid rgba(255,255,255,0.1)',
                }} />
              );
            })}
          </div>
        </div>

        <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <WeatherWidget />
          <LanguageSwitcher />
        </div>
      </div>

      <StaggeredMenu
        key={authVersion}
        isFixed
        position="right"
        className="public-menu"
        colors={['#7a0300', '#e10600']}
        accentColor={accent}
        menuButtonColor="#fff"
        openMenuButtonColor="#fff"
        displaySocials
        displayItemNumbering
        logoUrl="/Logo.png"
        items={menuItems}
        socialItems={socialItems}
      />

      <main style={{ flex: 1, position: 'relative', zIndex: 1, paddingTop: 110 }}>
        {children}
      </main>

      <footer style={{
        position: 'relative',
        borderTop: '1px solid rgba(225,6,0,0.15)',
        background: 'linear-gradient(180deg, rgba(10,10,15,0.6) 0%, rgba(5,5,8,0.95) 100%)',
        padding: '70px 40px 30px', marginTop: 100, overflow: 'hidden', zIndex: 1,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, #e10600 20%, #e10600 80%, transparent 100%)',
          boxShadow: '0 0 20px rgba(225,6,0,0.5)',
          backgroundSize: '200% 100%', animation: 'borderSlide 5s linear infinite',
        }} />

        <div className="container" style={{ maxWidth: 1400, position: 'relative', zIndex: 1 }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60, marginBottom: 60 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 50, height: 50, display: 'grid', placeItems: 'center',
                  border: '1px solid rgba(225,6,0,0.3)',
                  borderRadius: 4, background: 'rgba(225,6,0,0.05)',
                }}>
                  <img src="/Logo.png" alt="F1 Apex" style={{ height: 36, width: 'auto' }} />
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 16,
                    fontWeight: 900, letterSpacing: '0.1em', color: '#fff',
                  }}>F1 <span style={{ color: '#e10600' }}>APEX</span></div>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: 9,
                    fontWeight: 600, letterSpacing: '0.3em',
                    color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: 2,
                  }}>{t('footer.tagline')}</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.8, maxWidth: 380, marginBottom: 24 }}>
                {t('footer.description')}
              </p>
              <div style={{ display: 'flex', gap: 4 }}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10,
                    background: i % 2 === 0 ? '#fff' : '#000',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }} />
                ))}
              </div>
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.3em', color: '#e10600', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 20, height: 1, background: '#e10600' }} />
                {t('footer.navigation')}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {footerLinks.map((l) => (
                  <li key={l.to} style={{ marginBottom: 14 }}>
                    <Link to={l.to} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      color: 'var(--text-mid)', fontSize: 14, fontWeight: 500,
                      textDecoration: 'none', transition: 'all 0.25s',
                    }}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.3em', color: '#e10600', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 20, height: 1, background: '#e10600' }} />
                {t('footer.season')}
              </div>
              <div style={{
                padding: '16px 18px', background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(225,6,0,0.2)', borderRadius: 4, marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#00d26a', boxShadow: '0 0 10px #00d26a',
                    animation: 'pulseGlow 2s infinite',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 10,
                    fontWeight: 700, letterSpacing: '0.2em', color: '#fff',
                  }}>{t('footer.live')}</span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 22,
                  fontWeight: 900, color: '#e10600', letterSpacing: '-0.02em',
                  textShadow: '0 0 20px rgba(225,6,0,0.5)',
                }}>2026</div>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.6 }}>
                {t('home.seasonBanner.subtitle')}
              </p>
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.3em', color: '#e10600', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 20, height: 1, background: '#e10600' }} />
                {t('footer.info')}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-mid)', fontSize: 13, lineHeight: 1.6 }}>{t('footer.projectDesc')}</span>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-mid)', fontSize: 13, lineHeight: 1.6 }}>{t('footer.stack')}</span>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-mid)', fontSize: 13, lineHeight: 1.6 }}>{t('footer.nonAffiliated')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom" style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-dim)' }}>© 2026</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.15em', color: '#fff', fontWeight: 700 }}>F1 APEX</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>{t('footer.rights')}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-dim)', opacity: 0.6 }}>
              {t('footer.build')}
            </div>
          </div>
        </div>
      </footer>

      <ChatBot />

      <style>{`
        @keyframes pulseGlow { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:.25} }
        @keyframes scanAcross { 0%{transform:translateX(-100%)} 100%{transform:translateX(100vw)} }
        @keyframes borderSlide { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }

        /* ✅ RESPONSIVE — Tablette */
        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 40px !important;
          }
        }

        /* ✅ RESPONSIVE — Mobile */
        @media (max-width: 900px) {
          .hide-mobile {
            display: none !important;
          }

          .top-status-bar {
            padding: 0 10px !important;
            font-size: 8px !important;
            letter-spacing: 0.1em !important;
          }

          .top-bar-left,
          .top-bar-right {
            gap: 8px !important;
          }

          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }

          footer {
            padding: 40px 16px 20px !important;
            margin-top: 60px !important;
          }

          .footer-bottom {
            flex-direction: column !important;
            text-align: center !important;
            gap: 12px !important;
          }
        }

        @media (max-width: 600px) {
          .top-status-bar {
            height: 36px !important;
          }
          .top-bar-right {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}