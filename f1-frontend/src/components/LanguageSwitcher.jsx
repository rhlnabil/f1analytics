import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'es', label: 'ES', flag: '🇪🇸', name: 'Español' },
  { code: 'it', label: 'IT', flag: '🇮🇹', name: 'Italiano' },
  { code: 'ar', label: 'AR', flag: '🇸🇦', name: 'العربية' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  const current = LANGUAGES.find(l => i18n.language?.startsWith(l.code)) || LANGUAGES[0];

  const change = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  // Calcule la position du dropdown au moment de l'ouverture
  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(o => !o);
  };

  // Ferme au clic extérieur
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        if (!e.target.closest('[data-lang-dropdown]')) {
          setOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Ferme au scroll
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);

  const dropdown = open ? createPortal(
    <div
      data-lang-dropdown
      style={{
        position: 'fixed',
        top: pos.top,
        right: pos.right,
        minWidth: 200,
        background: 'rgba(10,10,15,0.98)',
        border: '1px solid rgba(225,6,0,0.4)',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.95), 0 0 30px rgba(225,6,0,0.3)',
        zIndex: 2147483647,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {LANGUAGES.map((lng, idx) => {
        const active = current.code === lng.code;
        return (
          <button
            key={lng.code}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); change(lng.code); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 14px',
              background: active ? 'rgba(225,6,0,0.15)' : 'transparent',
              border: 'none',
              borderBottom: idx < LANGUAGES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              color: active ? '#fff' : 'var(--text-dim)',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (active) return;
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              if (active) return;
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-dim)';
            }}
          >
            <span style={{ fontSize: 16 }}>{lng.flag}</span>
            <span style={{ flex: 1 }}>{lng.label}</span>
            <span style={{ fontSize: 10, opacity: 0.5, letterSpacing: 0 }}>{lng.name}</span>
            {active && <span style={{ color: '#e10600', fontSize: 10 }}>●</span>}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px',
          background: open ? 'rgba(225,6,0,0.15)' : 'rgba(0,0,0,0.6)',
          border: `1px solid ${open ? '#e10600' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 6, color: '#fff',
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', cursor: 'pointer',
          transition: 'all 0.25s', textTransform: 'uppercase',
        }}
      >
        <span style={{ fontSize: 14 }}>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{
          fontSize: 8, opacity: 0.6, transition: 'transform 0.25s',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
        }}>▼</span>
      </button>

      {dropdown}
    </div>
  );
}