import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const ACCENT = '#e10600';
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const WIN_STREAK_KEY = 'f1wordle_win_streak';

const WORDS = [
  'SAINZ', 'LANDO', 'LEWIS', 'OSCAR', 'NANDO',
  'PEREZ', 'ALBON', 'GASLY', 'TURBO', 'SPEED',
  'RACER', 'WHEEL', 'TRACK', 'TITLE', 'POINT',
  'GEARS', 'DRIFT', 'BRAKE', 'NIGEL', 'NIKKI',
  'CIRCU', 'GRIDS', 'PITIN', 'SPOIL', 'PACEY',
];

function getDailyWord() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return WORDS[seed % WORDS.length];
}

function getKeyState(letter, guesses) {
  if (!letter) return '';
  const up = letter.toUpperCase();
  if (guesses.some(g => g.some(l => l.letter === up && l.state === 'correct'))) return 'correct';
  if (guesses.some(g => g.some(l => l.letter === up && l.state === 'present'))) return 'present';
  if (guesses.some(g => g.some(l => l.letter === up))) return 'absent';
  return '';
}

function evaluateGuess(guess, target) {
  const result = [];
  const targetChars = target.split('');
  const used = new Array(targetChars.length).fill(false);
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === targetChars[i]) {
      result[i] = { letter: guess[i], state: 'correct' };
      used[i] = true;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i]) continue;
    const idx = targetChars.findIndex((c, j) => c === guess[i] && !used[j]);
    if (idx !== -1) {
      result[i] = { letter: guess[i], state: 'present' };
      used[idx] = true;
    } else {
      result[i] = { letter: guess[i], state: 'absent' };
    }
  }
  return result;
}

export default function F1Wordle() {
  const [target] = useState(() => getDailyWord());
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState('');
  const [phase, setPhase] = useState('playing');
  const [shake, setShake] = useState(false);
  const [winStreak, setWinStreak] = useState(() => {
    try { return parseInt(localStorage.getItem(WIN_STREAK_KEY) || '0', 10); } catch { return 0; }
  });

  const submit = useCallback(() => {
    if (current.length !== WORD_LENGTH) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const evaluated = evaluateGuess(current.toUpperCase(), target);
    const next = [...guesses, evaluated];
    setGuesses(next);
    setCurrent('');

    if (current.toUpperCase() === target) {
      setPhase('won');
      const newStreak = winStreak + 1;
      setWinStreak(newStreak);
      try { localStorage.setItem(WIN_STREAK_KEY, String(newStreak)); } catch {}
    } else if (next.length >= MAX_GUESSES) {
      setPhase('lost');
      setWinStreak(0);
      try { localStorage.setItem(WIN_STREAK_KEY, '0'); } catch {}
    }
  }, [current, guesses, target, winStreak]);

  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'playing') return;
      if (e.key === 'Enter') submit();
      else if (e.key === 'Backspace') setCurrent(c => c.slice(0, -1));
      else if (/^[a-zA-Z]$/.test(e.key) && current.length < WORD_LENGTH) {
        setCurrent(c => c + e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, current, submit]);

  const pressLetter = (letter) => {
    if (phase !== 'playing') return;
    if (letter === 'ENTER') submit();
    else if (letter === 'DEL') setCurrent(c => c.slice(0, -1));
    else if (current.length < WORD_LENGTH) setCurrent(c => c + letter);
  };

  const rowIndex = guesses.length;
  const rows = [...Array(MAX_GUESSES)].map((_, i) => {
    if (i < guesses.length) return guesses[i];
    if (i === rowIndex) return current.split('').map(l => ({ letter: l, state: 'empty' }));
    return [];
  });

  const KEYBOARD = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','DEL'],
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '60px 16px 100px', background: 'radial-gradient(ellipse at top, #1a0a0a 0%, #050508 70%)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Link to="/fan/games" style={{ position: 'absolute', top: 20, left: 20, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase' }}>← JEUX</Link>
      <div style={{ position: 'absolute', top: 20, right: 20, fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', color: ACCENT, fontWeight: 700 }}>🔤 F1 WORDLE</div>

      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>F1 Wordle</h1>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 16 }}>
        MOT DU JOUR · {MAX_GUESSES - guesses.length} ESSAIS
      </p>

      {winStreak > 0 && (
        <div style={{
          marginBottom: 16, padding: '6px 16px',
          background: 'rgba(255,135,0,0.15)',
          border: '1.5px solid #ff8700',
          borderRadius: 6,
          fontFamily: 'var(--font-display)',
          fontSize: 11, fontWeight: 900,
          letterSpacing: '0.2em', color: '#ff8700',
          boxShadow: '0 0 20px #ff870066',
        }}>🔥 {winStreak} WIN STREAK</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 6, animation: shake && ri === rowIndex ? 'wordleShake 0.4s' : 'none' }}>
            {[...Array(WORD_LENGTH)].map((_, ci) => {
              const cell = row[ci];
              const letter = cell?.letter || '';
              const state = cell?.state || 'empty';
              return (
                <div key={ci} style={{
                  width: 52, height: 52, display: 'grid', placeItems: 'center',
                  background: state === 'correct' ? 'rgba(0,210,106,0.9)' : state === 'present' ? 'rgba(255,215,0,0.9)' : state === 'absent' ? 'rgba(60,60,70,0.9)' : state === 'empty' && letter ? 'rgba(20,20,26,0.9)' : 'rgba(10,10,15,0.7)',
                  border: `2px solid ${state === 'correct' ? '#00d26a' : state === 'present' ? '#ffd700' : state === 'absent' ? 'rgba(60,60,70,0.9)' : letter ? `${ACCENT}88` : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6, fontFamily: 'var(--font-display)',
                  fontSize: 24, fontWeight: 900,
                  color: state === 'empty' ? '#fff' : '#000',
                  transition: 'all 0.25s',
                  animation: ri < guesses.length ? `wordleFlip 0.4s ease ${ci * 0.05}s both` : 'none',
                }}>{letter}</div>
              );
            })}
          </div>
        ))}
      </div>

      {phase === 'won' && (
        <div style={{ padding: '16px 24px', background: 'rgba(0,210,106,0.15)', border: '1.5px solid #00d26a', borderRadius: 10, marginBottom: 16, textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, color: '#00d26a', textTransform: 'uppercase', marginBottom: 6 }}>
            🎉 BRAVO ! En {guesses.length} essai{guesses.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ padding: '4px 10px', background: 'rgba(255,135,0,0.15)', border: '1px solid #ff8700', borderRadius: 4, fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 900, letterSpacing: '0.15em', color: '#ff8700' }}>🔥 STREAK {winStreak}</div>
          </div>
        </div>
      )}

      {phase === 'lost' && (
        <div style={{ padding: '16px 24px', background: 'rgba(255,85,85,0.15)', border: '1.5px solid #ff5555', borderRadius: 10, marginBottom: 16, fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>
          ❌ Perdu ! Le mot était <span style={{ color: ACCENT }}>{target}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 500 }}>
        {KEYBOARD.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {row.map(key => {
              const state = key.length === 1 ? getKeyState(key, guesses) : '';
              const width = key === 'ENTER' || key === 'DEL' ? 60 : 36;
              return (
                <button key={key} onClick={() => pressLetter(key)} style={{
                  all: 'unset', cursor: 'pointer', width, height: 48,
                  display: 'grid', placeItems: 'center',
                  background: state === 'correct' ? '#00d26a' : state === 'present' ? '#ffd700' : state === 'absent' ? 'rgba(60,60,70,0.9)' : 'rgba(30,30,38,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                  fontFamily: 'var(--font-display)',
                  fontSize: key.length > 1 ? 9 : 14, fontWeight: 900,
                  color: state === 'correct' || state === 'present' ? '#000' : '#fff',
                  letterSpacing: key.length > 1 ? '0.1em' : '0',
                }}>{key}</button>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes wordleShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        @keyframes wordleFlip { 0%{transform:rotateX(0)} 50%{transform:rotateX(90deg)} 100%{transform:rotateX(0)} }
      `}</style>
    </div>
  );
}