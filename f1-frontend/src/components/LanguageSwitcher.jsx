import { useState } from 'react';
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

  const current = LANGUAGES.find(l => i18n.language?.startsWith(l.code)) || LANGUAGES[0];

  const change = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
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

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          minWidth: 160, background: 'rgba(10,10,15,0.98)',
          border: '1px solid rgba(225,6,0,0.3)', borderRadius: 6,
          overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          zIndex: 500, backdropFilter: 'blur(20px)',
        }}>
          {LANGUAGES.map((lng, idx) => {
            const active = current.code === lng.code;
            return (
              <button key={lng.code} onMouseDown={(e) => { e.preventDefault(); change(lng.code); }} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px',
                background: active ? 'rgba(225,6,0,0.15)' : 'transparent',
                border: 'none',
                borderBottom: idx < LANGUAGES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                color: active ? '#fff' : 'var(--text-dim)',
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
              }}>
                <span style={{ fontSize: 16 }}>{lng.flag}</span>
                <span style={{ flex: 1 }}>{lng.label}</span>
                <span style={{ fontSize: 10, opacity: 0.5, letterSpacing: 0 }}>{lng.name}</span>
                {active && <span style={{ color: '#e10600', fontSize: 10 }}>●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}