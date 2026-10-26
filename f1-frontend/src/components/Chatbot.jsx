import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { API_BASE } from '../api/axios';

const STORAGE_KEY = 'f1apex-chat-history-v1';
const SOUND_KEY = 'f1apex-chat-sound-enabled';
const MAX_HISTORY = 40;
const HIDDEN_PREFIXES = ['/cinema', '/admin'];

const BOT_NAME = 'BOX';
const BOT_TAGLINE = "Radio d'équipe · F1 Apex";
const RADIO_FREQ = '142.800 MHz';

const SUGGESTIONS = [
  'Qui mène le championnat ?',
  'Explique-moi le DRS',
  'Quel est le prochain GP ?',
  'Palmarès de Verstappen',
];

/* ================= MARKDOWN ================= */
function renderInline(text) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return tokens.map((t, i) => {
    if (/^\*\*[^*]+\*\*$/.test(t))
      return <strong key={i} style={{ color: '#fff', fontWeight: 700 }}>{t.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(t)) return <em key={i}>{t.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(t))
      return <code key={i} style={{
        background: 'rgba(0,212,255,0.15)', color: '#00d4ff',
        padding: '1px 6px', borderRadius: 3, fontFamily: 'monospace', fontSize: 12,
      }}>{t.slice(1, -1)}</code>;
    return <span key={i}>{t}</span>;
  });
}

function Markdown({ text }) {
  if (!text) return null;

  // ✅ Nettoie les balises HTML brutes que le LLM peut envoyer
  const cleaned = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<\/?p>/gi, '\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]+>/g, '')   // supprime toute balise HTML restante
    .replace(/\n{3,}/g, '\n\n'); // évite les lignes vides en cascade

  const blocks = cleaned.split(/(```[\s\S]*?```)/g);
  return blocks.map((block, bi) => {
    if (block.startsWith('```')) {
      const code = block.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
      return (
        <pre key={bi} style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(0,212,255,0.2)',
          padding: '10px 12px', borderRadius: 6,
          overflow: 'auto', fontFamily: 'monospace', fontSize: 12, margin: '8px 0',
        }}><code>{code}</code></pre>
      );
    }
    const lines = block.split('\n');
    return (
      <span key={bi}>
        {lines.map((line, li) => {
          if (/^\s*[-•]\s+/.test(line)) {
            return (
              <div key={li} style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
                <span style={{ color: '#e10600', flexShrink: 0 }}>▸</span>
                <span>{renderInline(line.replace(/^\s*[-•]\s+/, ''))}</span>
              </div>
            );
          }
          if (/^\s*\d+\.\s+/.test(line)) {
            const m = line.match(/^\s*(\d+)\.\s+(.*)/);
            return (
              <div key={li} style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
                <span style={{ color: '#e10600', fontWeight: 800, flexShrink: 0 }}>{m[1]}.</span>
                <span>{renderInline(m[2])}</span>
              </div>
            );
          }
          if (/^#{1,3}\s+/.test(line)) {
            return (
              <div key={li} style={{ fontWeight: 800, color: '#fff', marginTop: 6, marginBottom: 2 }}>
                {line.replace(/^#{1,3}\s+/, '')}
              </div>
            );
          }
          return <div key={li}>{renderInline(line)}</div>;
        })}
      </span>
    );
  });
}

/* ================= TYPING DOTS ================= */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#e10600',
          boxShadow: '0 0 6px #e10600',
          animation: `cbDot 1.2s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ================= AUDIO ENGINE ================= */
function useBotSound(audioPath, enabled) {
  const ctxRef = useRef(null);
  const bufferRef = useRef(null);
  const htmlAudioRef = useRef(null);
  const unlockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          const ctx = new AC();
          ctxRef.current = ctx;
          const res = await fetch(audioPath);
          const arr = await res.arrayBuffer();
          const buf = await ctx.decodeAudioData(arr);
          if (!cancelled) bufferRef.current = buf;
        }
      } catch { /* ignore */ }
      try {
        const audio = new Audio(audioPath);
        audio.preload = 'auto';
        audio.volume = 0.6;
        htmlAudioRef.current = audio;
        audio.load();
      } catch { /* ignore */ }
    };
    init();
    return () => {
      cancelled = true;
      try { ctxRef.current?.close?.(); } catch { /* ignore */ }
      try { htmlAudioRef.current?.pause?.(); } catch { /* ignore */ }
    };
  }, [audioPath]);

  const unlock = useCallback(() => {
    if (unlockRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const empty = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = empty;
      src.connect(ctx.destination);
      src.start(0);
      unlockRef.current = true;
    } catch { /* ignore */ }
  }, []);

  const play = useCallback(() => {
    if (!enabled) return;
    const ctx = ctxRef.current;
    const buffer = bufferRef.current;
    if (ctx && buffer) {
      try {
        if (ctx.state === 'suspended') ctx.resume();
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = 0.6;
        src.connect(gain).connect(ctx.destination);
        src.start(0);
        return;
      } catch { /* fallback */ }
    }
    const audio = htmlAudioRef.current;
    if (audio) {
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch { /* ignore */ }
    }
  }, [enabled]);

  return { unlock, play };
}

/* ============================================================ */
/* ============ CHAT FAB ====================================== */
/* ============================================================ */
function ChatFAB({ open, hovered, onClick, onEnter, onLeave, unread }) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (open) return;
    const i = setInterval(() => setPulse(p => (p + 1) % 360), 50);
    return () => clearInterval(i);
  }, [open]);

  return (
    <button
      type="button"
      aria-label={open ? 'Fermer Box' : 'Ouvrir Box'}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        all: 'unset',
        cursor: 'pointer',
        position: 'fixed', bottom: 24, right: 24,
        width: 76, height: 76, borderRadius: '50%',
        zIndex: 9000,
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <span style={{
        position: 'absolute', inset: -14, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(225,6,0,0.7) 0%, transparent 70%)`,
        filter: 'blur(18px)',
        opacity: open ? 0.9 : (hovered ? 1 : 0.65),
        animation: open ? 'none' : 'boxFabHalo 2.6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      <span style={{
        position: 'absolute', inset: -6, borderRadius: '50%',
        border: '2px dashed rgba(225,6,0,0.75)',
        animation: open ? 'none' : 'boxFabSpin 14s linear infinite',
        opacity: 0.85,
        pointerEvents: 'none',
      }} />

      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '2px solid rgba(0,212,255,0.55)',
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        animation: open ? 'none' : 'boxFabSpin 5s linear infinite reverse',
        pointerEvents: 'none',
      }} />

      <span style={{
        position: 'absolute', inset: 6, borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #ff1e00 0%, #e10600 45%, #7a0300 100%)',
        border: '2px solid rgba(255,255,255,0.2)',
        display: 'grid', placeItems: 'center',
        boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.6), 0 0 20px rgba(225,6,0,0.6)',
        overflow: 'hidden',
      }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          backgroundImage: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
          backgroundSize: '10px 10px',
          opacity: 0.5,
        }} />

        {!open && (
          <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `conic-gradient(from ${pulse}deg, rgba(255,255,255,0.5) 0deg, transparent 80deg)`,
            opacity: 0.55,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }} />
        )}

        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff"
            strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'relative', zIndex: 2 }}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"
            style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
            <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-7l-4 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <circle cx="8" cy="10.5" r="1.4" fill="#3a0505" />
            <circle cx="12" cy="10.5" r="1.4" fill="#3a0505" />
            <circle cx="16" cy="10.5" r="1.4" fill="#3a0505" />
          </svg>
        )}
      </span>

      {!open && (
        <span style={{
          position: 'absolute', bottom: -6, right: -8,
          padding: '3px 9px',
          background: '#0a0a0f',
          border: '1.5px solid #e10600',
          borderRadius: 4,
          fontFamily: 'var(--font-display)',
          fontSize: 8, fontWeight: 900,
          letterSpacing: '0.18em',
          color: '#fff',
          boxShadow: '0 0 14px rgba(225,6,0,0.9)',
          zIndex: 3,
        }}>BOX</span>
      )}

      {!open && (
        <span style={{
          position: 'absolute', top: -3, left: -3,
          width: 12, height: 12, borderRadius: '50%',
          background: '#00d26a', border: '2px solid #0a0a0f',
          boxShadow: '0 0 12px #00d26a, 0 0 24px #00d26a88',
          animation: 'boxLedBlink 1.4s ease-in-out infinite',
          zIndex: 3,
        }} />
      )}

      {!open && unread > 0 && (
        <span style={{
          position: 'absolute', top: -10, right: -10,
          minWidth: 22, height: 22, padding: '0 6px',
          borderRadius: 11,
          background: '#e10600', border: '2px solid #0a0a0f',
          color: '#fff', fontSize: 10, fontWeight: 900,
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-display)',
          boxShadow: '0 0 15px #e10600',
          animation: 'boxNotifPulse 1.2s ease-in-out infinite',
          zIndex: 3,
        }}>{unread}</span>
      )}
    </button>
  );
}

/* ============================================================ */
/* ============ MAIN ========================================== */
/* ============================================================ */
export default function ChatBot() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [unread, setUnread] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const v = localStorage.getItem(SOUND_KEY);
      return v === null ? true : v === 'true';
    } catch { return true; }
  });

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const taRef = useRef(null);

  const { unlock: unlockSound, play: playResponseSound } =
    useBotSound('/Box.mp3', soundEnabled);

  const isHidden = HIDDEN_PREFIXES.some(p => location.pathname.startsWith(p));
  const hideFabOnPage = location.pathname === '/';

  useEffect(() => {
    try { localStorage.setItem(SOUND_KEY, soundEnabled ? 'true' : 'false'); } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const onOpen = () => {
      unlockSound();
      setOpen(true);
    };
    window.addEventListener('f1apex:open-chatbot', onOpen);
    return () => window.removeEventListener('f1apex:open-chatbot', onOpen);
  }, [unlockSound]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [input]);

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  const send = useCallback(async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    unlockSound();
    setError(null);
    setInput('');

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const reply = data.reply || '';
      if (!reply) throw new Error('Réponse vide');

      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
      playResponseSound();
      if (!open) setUnread(u => u + 1);
    } catch (err) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, playResponseSound, unlockSound, open]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clear = () => {
    setMessages([]);
    setError(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  if (isHidden) return null;

  const panelUI = open ? (
    <div
      role="dialog"
      aria-label="Assistant Box — F1 Apex"
      className="box-panel"
      style={{
        position: 'fixed',
        bottom: 112,
        right: 24,
        width: 440,
        maxWidth: 'calc(100vw - 32px)',
        height: 'min(680px, calc(100vh - 156px))',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, #0a0d12 0%, #04060a 100%)',
        border: '1.5px solid rgba(225,6,0,0.55)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: `
          0 40px 100px -20px rgba(0,0,0,0.95),
          0 0 80px rgba(225,6,0,0.4),
          inset 0 0 0 1px rgba(255,255,255,0.05)
        `,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 2147483000,
        fontFamily: 'var(--font-heading)',
      }}
    >
      {/* ============ HEADER ============ */}
      <div style={{
        position: 'relative',
        padding: '16px 18px 14px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: '1px solid rgba(225,6,0,0.35)',
        background:
          'linear-gradient(90deg, rgba(225,6,0,0.25) 0%, rgba(10,13,18,0.7) 60%, transparent 100%)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0,
          height: 50,
          background: 'linear-gradient(180deg, transparent, rgba(225,6,0,0.35), transparent)',
          animation: 'boxScanline 4s ease-in-out infinite',
          pointerEvents: 'none', mixBlendMode: 'screen',
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
          maskImage: 'radial-gradient(ellipse at left, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at left, black 30%, transparent 80%)',
        }} />

        <div style={{
          position: 'relative',
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #ff1e00 0%, #3a0505 100%)',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'grid', placeItems: 'center',
          boxShadow: '0 0 25px rgba(225,6,0,0.85), inset 0 0 12px rgba(255,255,255,0.15)',
          flexShrink: 0,
          zIndex: 2,
        }}>
          <span style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: '1.5px dashed rgba(225,6,0,0.7)',
            animation: 'boxFabSpin 8s linear infinite',
            pointerEvents: 'none',
          }} />

          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"
            style={{ filter: 'drop-shadow(0 0 8px #fff)' }}>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
          </svg>

          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 10, height: 10, borderRadius: '50%',
            background: '#00d26a', border: '2px solid #0a0a0f',
            boxShadow: '0 0 10px #00d26a',
            animation: 'boxLedBlink 1.4s ease-in-out infinite',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13, letterSpacing: '0.35em',
            color: '#e10600', fontWeight: 900,
            marginBottom: 4,
            textShadow: '0 0 15px rgba(225,6,0,0.9)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ◆ {BOT_NAME}
            <span style={{
              fontSize: 8, letterSpacing: '0.15em',
              color: '#ff5555', padding: '2px 6px',
              background: 'rgba(225,6,0,0.25)',
              border: '1px solid rgba(255,85,85,0.6)',
              borderRadius: 3,
              animation: 'boxRecBlink 1.2s infinite',
            }}>REC ●</span>
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(0,212,255,0.9)',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.18em',
            fontWeight: 700,
          }}>
            {BOT_TAGLINE}
          </div>
        </div>

        {/* Bouton son */}
        <button
          type="button"
          onClick={() => setSoundEnabled(s => !s)}
          title={soundEnabled ? 'Couper la radio' : 'Activer la radio'}
          style={{
            all: 'unset',
            cursor: 'pointer',
            position: 'relative',
            width: 34, height: 34, borderRadius: 8,
            background: soundEnabled ? 'rgba(225,6,0,0.22)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${soundEnabled ? 'rgba(225,6,0,0.7)' : 'rgba(255,255,255,0.12)'}`,
            color: soundEnabled ? '#e10600' : 'rgba(255,255,255,0.5)',
            display: 'grid', placeItems: 'center',
            padding: 0,
            transition: 'all 0.2s',
            zIndex: 2,
            boxShadow: soundEnabled ? '0 0 15px rgba(225,6,0,0.5)' : 'none',
          }}
        >
          {soundEnabled ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>

        {/* Bouton clear */}
        <button
          type="button"
          onClick={clear}
          title="Effacer la radio"
          style={{
            all: 'unset',
            cursor: 'pointer',
            position: 'relative',
            width: 34, height: 34, borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.7)',
            display: 'grid', placeItems: 'center',
            padding: 0,
            zIndex: 2,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(225,6,0,0.2)';
            e.currentTarget.style.borderColor = 'rgba(225,6,0,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>

        {/* Bouton fermer */}
        <button
          type="button"
          onClick={closePanel}
          title="Fermer le chat"
          aria-label="Fermer le chat"
          style={{
            all: 'unset',
            cursor: 'pointer',
            position: 'relative',
            width: 34, height: 34, borderRadius: 8,
            background: 'rgba(225,6,0,0.15)',
            border: '1px solid rgba(225,6,0,0.6)',
            color: '#e10600',
            display: 'grid', placeItems: 'center',
            padding: 0,
            zIndex: 2,
            transition: 'all 0.25s',
            boxShadow: '0 0 12px rgba(225,6,0,0.3)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#e10600';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(225,6,0,0.8), 0 0 40px rgba(225,6,0,0.4)';
            e.currentTarget.style.transform = 'rotate(90deg) scale(1.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(225,6,0,0.15)';
            e.currentTarget.style.color = '#e10600';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(225,6,0,0.3)';
            e.currentTarget.style.transform = 'rotate(0) scale(1)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ============ TÉLÉMÉTRIE ============ */}
      <div style={{
        position: 'relative',
        padding: '6px 18px',
        background: 'linear-gradient(90deg, rgba(0,212,255,0.1) 0%, rgba(0,0,0,0.6) 100%)',
        borderBottom: '1px solid rgba(0,212,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'var(--font-display)', fontSize: 8,
        letterSpacing: '0.3em', fontWeight: 700,
        color: 'rgba(0,212,255,0.65)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: soundEnabled ? '#00d26a' : '#555',
            boxShadow: soundEnabled ? '0 0 8px #00d26a' : 'none',
            animation: soundEnabled ? 'boxLedBlink 1.4s infinite' : 'none',
          }} />
          <span>FREQ · {RADIO_FREQ}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 12 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <span key={i} style={{
              width: 2, height: '100%',
              background: 'rgba(0,212,255,0.8)',
              transformOrigin: 'bottom',
              animation: `boxWaveBar ${0.8 + (i % 3) * 0.2}s ease-in-out ${i * 0.1}s infinite`,
              borderRadius: 1,
              opacity: soundEnabled ? 1 : 0.3,
            }} />
          ))}
        </div>

        <span style={{ animation: 'boxFreq 2s ease-in-out infinite' }}>
          {soundEnabled ? '🔊 ON' : '🔇 OFF'}
        </span>
      </div>

      {/* ============ MESSAGES ============ */}
      <div
        ref={listRef}
        className="box-scroll"
        role="log"
        aria-live="polite"
        style={{
          flex: 1, overflowY: 'auto',
          padding: '18px 16px',
          display: 'flex', flexDirection: 'column', gap: 14,
          position: 'relative',
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
          animation: 'boxGridShift 24s linear infinite',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, bottom: 0, right: 4,
          width: 14, opacity: 0.25, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', gap: 4,
          overflow: 'hidden',
        }}>
          <div style={{ animation: 'boxDataStream 6s linear infinite' }}>
            {[...Array(40)].map((_, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-display)', fontSize: 6,
                color: '#00d4ff', fontWeight: 700, opacity: 0.6,
              }}>{String(Math.floor(Math.random() * 99)).padStart(2, '0')}</div>
            ))}
          </div>
        </div>

        {messages.length === 0 && (
          <div style={{ padding: '4px 0', position: 'relative', zIndex: 1 }}>
            <div style={{
              position: 'relative',
              padding: '20px 18px',
              borderRadius: 14,
              background: `linear-gradient(135deg, rgba(225,6,0,0.15), rgba(0,0,0,0.7))`,
              border: '1px dashed rgba(225,6,0,0.5)',
              marginBottom: 18,
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 120, height: 120, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(225,6,0,0.5) 0%, transparent 70%)',
                filter: 'blur(24px)',
                pointerEvents: 'none',
              }} />

              {[
                { top: 6, left: 6, bt: true, bl: true },
                { top: 6, right: 6, bt: true, br: true },
                { bottom: 6, left: 6, bb: true, bl: true },
                { bottom: 6, right: 6, bb: true, br: true },
              ].map((c, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: c.top, left: c.left, right: c.right, bottom: c.bottom,
                  width: 14, height: 14,
                  borderTop: c.bt ? '2px solid rgba(225,6,0,0.8)' : 'none',
                  borderBottom: c.bb ? '2px solid rgba(225,6,0,0.8)' : 'none',
                  borderLeft: c.bl ? '2px solid rgba(225,6,0,0.8)' : 'none',
                  borderRight: c.br ? '2px solid rgba(225,6,0,0.8)' : 'none',
                  animation: `boxCornerPulse 2s ease-in-out ${i * 0.15}s infinite`,
                  pointerEvents: 'none',
                }} />
              ))}

              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 9, letterSpacing: '0.35em',
                color: '#e10600', fontWeight: 900,
                marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  width: 6, height: 6, background: '#00d26a',
                  borderRadius: '50%', boxShadow: '0 0 10px #00d26a',
                  animation: 'boxLedBlink 1.4s infinite',
                }} />
                ◆ LIAISON ÉTABLIE
              </div>

              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.6,
                marginBottom: 6,
              }}>
                Salut, ici <strong style={{
                  color: '#fff',
                  textShadow: '0 0 15px rgba(225,6,0,0.8)',
                }}>Box</strong> — ta radio d'équipe F1.
              </div>

              <div style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.5,
              }}>
                Pilotes, écuries, circuits, règlement — demande.
              </div>
            </div>

            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9, letterSpacing: '0.35em',
              color: 'rgba(0,212,255,0.75)',
              fontWeight: 700, marginBottom: 12,
              paddingLeft: 4,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 20, height: 1, background: 'rgba(0,212,255,0.6)' }} />
              ◆ CANAUX DISPONIBLES
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => send(s)}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    position: 'relative',
                    padding: '12px 14px',
                    background: 'rgba(0,212,255,0.04)',
                    border: '1px solid rgba(0,212,255,0.18)',
                    borderRadius: 10,
                    color: 'rgba(255,255,255,0.92)',
                    fontSize: 13,
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 500,
                    transition: 'all 0.25s',
                    display: 'flex', alignItems: 'center', gap: 12,
                    animation: `boxSuggestionIn 0.4s ease ${i * 0.08}s both`,
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(225,6,0,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(225,6,0,0.6)';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(225,6,0,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0,212,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.18)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.92)';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10, fontWeight: 900,
                    color: '#e10600',
                    letterSpacing: '0.1em',
                    minWidth: 22,
                  }}>{String(i + 1).padStart(2, '0')}</span>

                  <div style={{
                    flex: 1, height: 1,
                    background: 'linear-gradient(90deg, rgba(225,6,0,0.4), transparent)',
                  }} />

                  <span style={{ flexShrink: 0 }}>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={i}
              className="box-msg"
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: 10, position: 'relative', zIndex: 1,
              }}
            >
              {!isUser && (
                <div style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #e10600, #3a0505)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  display: 'grid', placeItems: 'center',
                  fontSize: 13, color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 0 15px rgba(225,6,0,0.7), inset 0 0 8px rgba(255,255,255,0.1)',
                  position: 'relative',
                }}>
                  ✦
                  <span style={{
                    position: 'absolute', inset: -4,
                    borderRadius: '50%',
                    border: '1px solid rgba(225,6,0,0.5)',
                    animation: 'boxPulseRing 2s ease-out infinite',
                    pointerEvents: 'none',
                  }} />
                </div>
              )}

              <div style={{
                maxWidth: '82%',
                padding: '12px 16px',
                borderRadius: 16,
                borderTopLeftRadius: isUser ? 16 : 4,
                borderTopRightRadius: isUser ? 4 : 16,
                background: isUser
                  ? 'linear-gradient(135deg, #e10600 0%, #7a0300 100%)'
                  : 'linear-gradient(135deg, rgba(0,212,255,0.09), rgba(0,0,0,0.55))',
                border: isUser
                  ? '1px solid rgba(255,255,255,0.22)'
                  : '1px solid rgba(0,212,255,0.3)',
                color: '#fff',
                fontSize: 14,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxShadow: isUser
                  ? '0 6px 24px rgba(225,6,0,0.4)'
                  : '0 6px 24px rgba(0,212,255,0.1), inset 0 1px 0 rgba(255,255,255,0.03)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {!isUser && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)',
                    pointerEvents: 'none',
                  }} />
                )}

                {isUser ? m.content : <Markdown text={m.content} />}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="box-msg" style={{
            display: 'flex', gap: 10, justifyContent: 'flex-start',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'radial-gradient(circle, #e10600, #3a0505)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              display: 'grid', placeItems: 'center',
              fontSize: 13, color: '#fff', flexShrink: 0,
              boxShadow: '0 0 15px rgba(225,6,0,0.7)',
              position: 'relative',
            }}>
              ✦
              <span style={{
                position: 'absolute', inset: -4,
                borderRadius: '50%',
                border: '1px solid rgba(225,6,0,0.5)',
                animation: 'boxPulseRing 2s ease-out infinite',
                pointerEvents: 'none',
              }} />
            </div>
            <div style={{
              padding: '14px 18px',
              borderRadius: 16, borderTopLeftRadius: 4,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.09), rgba(0,0,0,0.55))',
              border: '1px solid rgba(0,212,255,0.3)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <TypingDots />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 8, letterSpacing: '0.25em',
                color: 'rgba(0,212,255,0.7)',
                fontWeight: 700,
              }}>
                EN COURS
              </span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255,85,85,0.1)',
            border: '1px solid rgba(255,85,85,0.5)',
            borderRadius: 10,
            color: '#ff8888',
            fontSize: 12,
            fontFamily: 'var(--font-heading)',
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            {error}
          </div>
        )}
      </div>

      {/* ============ INPUT ============ */}
      <div style={{
        padding: '14px 16px 12px',
        borderTop: '1px solid rgba(225,6,0,0.3)',
        background: 'linear-gradient(180deg, rgba(10,13,18,0.95), rgba(4,6,10,0.98))',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          padding: '6px 6px 6px 14px',
          background: 'rgba(15,20,26,0.95)',
          border: '1.5px solid rgba(225,6,0,0.45)',
          borderRadius: 14,
          transition: 'border-color 0.25s, box-shadow 0.25s',
          boxShadow: 'inset 0 0 20px rgba(225,6,0,0.08)',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11, fontWeight: 900,
            color: '#e10600',
            letterSpacing: '0.25em',
            paddingBottom: 8,
            textShadow: '0 0 10px rgba(225,6,0,0.8)',
          }}>▸</span>
          <textarea
            ref={(el) => { inputRef.current = el; taRef.current = el; }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Transmettre un message à Box…"
            rows={1}
            disabled={loading}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              background: 'transparent', color: '#fff',
              fontSize: 14,
              fontFamily: 'var(--font-heading)',
              lineHeight: 1.5,
              padding: '6px 0', maxHeight: 120, overflowY: 'auto',
            }}
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            aria-label="Envoyer"
            style={{
              all: 'unset',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              width: 40, height: 40, borderRadius: 12,
              background: loading || !input.trim()
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #e10600, #7a0300)',
              color: loading || !input.trim() ? 'rgba(255,255,255,0.3)' : '#fff',
              display: 'grid', placeItems: 'center',
              flexShrink: 0,
              boxShadow: loading || !input.trim()
                ? 'none'
                : '0 4px 20px rgba(225,6,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
              transition: 'all 0.25s',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {!loading && input.trim() && (
              <span style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'boxChatStream 1.5s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
              style={{ position: 'relative', zIndex: 1 }}>
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
          </button>
        </div>

        <div style={{
          marginTop: 10,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 8, letterSpacing: '0.25em',
          color: 'rgba(0,212,255,0.55)',
          fontWeight: 700,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 5, height: 5,
              background: soundEnabled ? '#00d26a' : '#555',
              borderRadius: '50%',
              boxShadow: soundEnabled ? '0 0 6px #00d26a' : 'none',
              animation: soundEnabled ? 'boxLedBlink 1.4s infinite' : 'none',
            }} />
            LLAMA · GROQ · LIVE
          </span>
          <span>{RADIO_FREQ}</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <style>{`
        @keyframes boxFabSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes boxFabHalo {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50%      { transform: scale(1.18); opacity: 1; }
        }
        @keyframes boxLedBlink {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }
        @keyframes boxNotifPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 15px #e10600; }
          50%      { transform: scale(1.12); box-shadow: 0 0 25px #e10600, 0 0 40px #e1060088; }
        }
        @keyframes boxPanelIn {
          0%   { opacity: 0; transform: translateY(40px) scale(0.9); filter: blur(12px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes boxMsgIn {
          0%   { opacity: 0; transform: translateY(12px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cbDot {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30%           { opacity: 1;    transform: translateY(-4px); }
        }
        @keyframes boxRecBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.15; } }
        @keyframes boxScanline {
          0%   { top: -10%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes boxGridShift {
          0%   { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes boxFreq { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes boxWaveBar {
          0%, 100% { transform: scaleY(0.3); }
          50%      { transform: scaleY(1); }
        }
        @keyframes boxSuggestionIn {
          0%   { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes boxCornerPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes boxDataStream {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes boxChatStream {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        @keyframes boxPulseRing {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }

        .box-panel { animation: boxPanelIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .box-msg   { animation: boxMsgIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        .box-scroll::-webkit-scrollbar { width: 6px; }
        .box-scroll::-webkit-scrollbar-track { background: transparent; }
        .box-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #e10600, #7a0300);
          border-radius: 3px;
        }
        .box-scroll::-webkit-scrollbar-thumb:hover { background: #ff1e00; }
      `}</style>

      {!hideFabOnPage && (
        <ChatFAB
          open={open}
          hovered={hovered}
          unread={unread}
          onEnter={() => setHovered(true)}
          onLeave={() => setHovered(false)}
          onClick={() => { unlockSound(); setOpen(o => !o); }}
        />
      )}

      {open && createPortal(panelUI, document.body)}
    </>
  );
}