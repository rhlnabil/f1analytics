import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const ACCENT = '#e10600';
const QUESTION_TIME = 15;
const TOTAL_QUESTIONS = 10;

function TimerCircle({ seconds, total }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / total;
  const offset = circumference * (1 - progress);
  const color = seconds > total * 0.5 ? '#00d26a' : seconds > total * 0.25 ? '#ffd700' : '#ff2020';
  return (
    <div style={{ position: 'relative', width: 84, height: 84 }}>
      <svg width={84} height={84} viewBox="0 0 84 84" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={42} cy={42} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle cx={42} cy={42} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s', filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900,
        color, textShadow: `0 0 15px ${color}`, fontVariantNumeric: 'tabular-nums',
      }}>{seconds}</div>
    </div>
  );
}

function StreakFlash({ streak }) {
  if (streak < 2) return null;
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9998, pointerEvents: 'none',
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(48px, 10vw, 120px)',
      fontWeight: 900, fontStyle: 'italic',
      color: streak >= 5 ? '#FFD700' : '#ff8700',
      textShadow: `0 0 40px ${streak >= 5 ? '#FFD700' : '#ff8700'}, 0 0 80px currentColor`,
      animation: 'qStreakPop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    }}>
      ×{streak} 🔥
      <style>{`
        @keyframes qStreakPop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) rotate(-15deg); }
          40% { opacity: 1; transform: translate(-50%, -50%) scale(1.2) rotate(5deg); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5) rotate(0); }
        }
      `}</style>
    </div>
  );
}

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [phase, setPhase] = useState('loading');
  const [answers, setAnswers] = useState([]);
  const [bestScore, setBestScore] = useState(() => {
    const raw = localStorage.getItem('f1quiz_best');
    return raw ? parseInt(raw, 10) : 0;
  });
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [flashStreak, setFlashStreak] = useState(0);
  const timerRef = useRef(null);

  const loadQuestions = () => {
    setPhase('loading');
    setIndex(0);
    setScore(0);
    setSelected(null);
    setAnswers([]);
    setTimeLeft(QUESTION_TIME);
    setStreak(0);
    setMaxStreak(0);

    api.get('/quiz/questions', { params: { count: TOTAL_QUESTIONS } })
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        if (data.length === 0) { setQuestions([]); setPhase('finished'); }
        else { setQuestions(data); setPhase('playing'); }
      })
      .catch(() => { setQuestions([]); setPhase('finished'); });
  };

  useEffect(() => { loadQuestions(); }, []);

  const current = questions[index] || null;

  useEffect(() => {
    if (phase !== 'playing' || !current) return;
    setTimeLeft(QUESTION_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleAnswer(-1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase, current?.id]);

  const handleAnswer = (choiceIndex) => {
    if (phase !== 'playing' || !current) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const correct = choiceIndex === current.correctIndex;

    if (correct) {
      setScore(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(m => Math.max(m, newStreak));
      if (newStreak >= 2) {
        setFlashStreak(newStreak);
        setTimeout(() => setFlashStreak(0), 900);
      }
    } else {
      setStreak(0);
    }

    setSelected(choiceIndex);
    setAnswers(a => [...a, {
      questionId: current.id, question: current.question,
      selectedIndex: choiceIndex, correctIndex: current.correctIndex, correct,
    }]);
    setPhase('feedback');
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setPhase('finished');
      if (score > bestScore) {
        localStorage.setItem('f1quiz_best', String(score));
        setBestScore(score);
      }
    } else {
      setIndex(i => i + 1);
      setSelected(null);
      setTimeLeft(QUESTION_TIME);
      setPhase('playing');
    }
  };

  if (phase === 'loading') {
    return (
      <div className="container" style={{ padding: 120, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', border: `3px solid ${ACCENT}22`, borderTopColor: ACCENT, animation: 'qspin 0.9s linear infinite' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.4em', color: ACCENT, fontWeight: 700 }}>◆ GÉNÉRATION DU QUIZ...</div>
        <style>{`@keyframes qspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (phase === 'finished') {
    const total = answers.length;
    const isNewRecord = score >= bestScore && score > 0;
    const medal = score === total && total > 0 ? '🏆' : score >= total * 0.8 ? '🥇' : score >= total * 0.6 ? '🥈' : score >= total * 0.4 ? '🥉' : '🏁';
    const title = score === total && total > 0 ? 'PARFAIT !' : score >= total * 0.8 ? 'EXCELLENT !' : score >= total * 0.6 ? 'BIEN JOUÉ !' : score >= total * 0.4 ? 'PAS MAL !' : 'RÉESSAIE !';

    return (
      <div className="container" style={{ maxWidth: 800, padding: '60px 32px 100px' }}>
        <div style={{ position: 'relative', padding: '48px 40px', background: 'linear-gradient(160deg, rgba(13,13,20,0.98), rgba(8,8,12,0.98))', border: `2px solid ${ACCENT}66`, borderRadius: 20, textAlign: 'center', boxShadow: `0 30px 80px -30px ${ACCENT}88`, animation: 'qpop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, boxShadow: `0 0 30px ${ACCENT}`, borderRadius: '20px 20px 0 0' }} />
          <div style={{ fontSize: 100, marginBottom: 20, lineHeight: 1 }}>{medal}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.45em', color: ACCENT, fontWeight: 700, marginBottom: 12 }}>◆ RÉSULTAT FINAL ◆</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: 16, letterSpacing: '-0.03em', textShadow: `0 0 40px ${ACCENT}88` }}>{title}</h1>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.5)', border: `1.5px solid ${ACCENT}55`, borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.25em', color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>SCORE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: ACCENT, lineHeight: 1, textShadow: `0 0 20px ${ACCENT}66` }}>{score}/{total}</div>
            </div>
            <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,215,0,0.4)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.25em', color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>MEILLEUR</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: '#FFD700', lineHeight: 1, textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>{bestScore}/{total}</div>
            </div>
            <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.5)', border: '1.5px solid #ff8700', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.25em', color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>MAX STREAK</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: '#ff8700', lineHeight: 1, textShadow: '0 0 20px #ff870066' }}>×{maxStreak}</div>
            </div>
          </div>

          {isNewRecord && (
            <div style={{ display: 'inline-block', padding: '8px 20px', marginBottom: 24, background: 'linear-gradient(135deg, #FFD700, #b38600)', color: '#000', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', borderRadius: 6, boxShadow: '0 0 30px rgba(255,215,0,0.6)', animation: 'qpulse 1.5s ease-in-out infinite' }}>★ NOUVEAU RECORD ★</div>
          )}

          {answers.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 32, maxHeight: 260, overflowY: 'auto', textAlign: 'left', padding: 16, background: 'rgba(0,0,0,0.4)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
              {answers.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < answers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', background: a.correct ? 'rgba(0,210,106,0.15)' : 'rgba(255,85,85,0.15)', color: a.correct ? '#00d26a' : '#ff5555', fontSize: 12, fontWeight: 900 }}>{a.correct ? '✓' : '✗'}</span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{a.question}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={loadQuestions} style={{ padding: '16px 32px', background: `linear-gradient(135deg, ${ACCENT}, #b80500)`, border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `0 8px 30px ${ACCENT}66`, clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}>⟳ Rejouer</button>
            <Link to="/fan/games" style={{ padding: '16px 32px', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', textDecoration: 'none' }}>← Jeux</Link>
          </div>
        </div>
        <style>{`
          @keyframes qpop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
          @keyframes qpulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        `}</style>
      </div>
    );
  }

  const isFeedback = phase === 'feedback';
  const correctIdx = current.correctIndex;

  return (
    <div className="container" style={{ maxWidth: 900, padding: '40px 32px 100px' }}>
      <StreakFlash streak={flashStreak} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <Link to="/fan/games" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none' }}>← JEUX</Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', color: ACCENT, fontWeight: 700 }}>◆ QUIZ F1</div>
        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.7)' }}>
          {streak >= 2 && <span style={{ color: streak >= 5 ? '#FFD700' : '#ff8700' }}>🔥 ×{streak}</span>}
          <span>Q {index + 1} / {questions.length}</span>
          <span style={{ color: ACCENT }}>SCORE {score}</span>
        </div>
      </div>

      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ height: '100%', width: `${((index + (isFeedback ? 1 : 0)) / questions.length) * 100}%`, background: `linear-gradient(90deg, ${ACCENT}, #ff3c00)`, boxShadow: `0 0 15px ${ACCENT}`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ position: 'relative', padding: '36px 40px 40px', background: 'linear-gradient(160deg, rgba(13,13,20,0.98), rgba(8,8,12,0.98))', border: `1.5px solid ${ACCENT}55`, borderRadius: 18, marginBottom: 24, animation: 'qslide 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, boxShadow: `0 0 20px ${ACCENT}`, borderRadius: '18px 18px 0 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, borderRadius: 4, fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', color: ACCENT, marginBottom: 16 }}>{current.category}</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 2.8vw, 28px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em', margin: 0 }}>{current.question}</h2>
          </div>
          {!isFeedback && <TimerCircle seconds={timeLeft} total={QUESTION_TIME} />}
          {isFeedback && (
            <div style={{ width: 84, height: 84, display: 'grid', placeItems: 'center', fontSize: 44, filter: selected === correctIdx ? 'drop-shadow(0 0 20px #00d26a)' : 'drop-shadow(0 0 20px #ff5555)' }}>{selected === correctIdx ? '✓' : '✗'}</div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {current.choices.map((choice, i) => {
            const isCorrect = i === correctIdx;
            const isSelected = i === selected;
            const showCorrect = isFeedback && isCorrect;
            const showWrong = isFeedback && isSelected && !isCorrect;
            let bg = 'rgba(0,0,0,0.4)'; let border = 'rgba(255,255,255,0.1)'; let color = 'rgba(240,240,245,0.9)';
            if (showCorrect) { bg = 'rgba(0,210,106,0.15)'; border = '#00d26a'; color = '#00d26a'; }
            else if (showWrong) { bg = 'rgba(255,85,85,0.15)'; border = '#ff5555'; color = '#ff5555'; }
            return (
              <button key={i} onClick={() => !isFeedback && handleAnswer(i)} disabled={isFeedback} style={{ all: 'unset', cursor: isFeedback ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', background: bg, border: `1.5px solid ${border}`, borderRadius: 10, color, fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, transition: 'all 0.2s', minHeight: 64 }}
                onMouseEnter={(e) => { if (isFeedback) return; e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = `${ACCENT}15`; }}
                onMouseLeave={(e) => { if (isFeedback) return; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }}
              >
                <span style={{ width: 32, height: 32, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}44`, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{choice}</span>
                {showCorrect && <span style={{ fontSize: 16 }}>✓</span>}
                {showWrong && <span style={{ fontSize: 16 }}>✗</span>}
              </button>
            );
          })}
        </div>

        {isFeedback && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: selected === correctIdx ? '#00d26a' : '#ff5555', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              {selected === correctIdx ? '✓ Bonne réponse !' : selected === -1 ? '⏱ Temps écoulé !' : `✗ Mauvaise réponse — c'était "${current.choices[correctIdx]}"`}
            </div>
            <button onClick={next} style={{ padding: '14px 28px', background: `linear-gradient(135deg, ${ACCENT}, #b80500)`, border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `0 4px 20px ${ACCENT}66`, clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>{index + 1 >= questions.length ? 'Voir les résultats →' : 'Suivant →'}</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes qslide { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(2, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}