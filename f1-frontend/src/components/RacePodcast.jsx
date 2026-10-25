import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const VOICE_CONFIGS = {
  fr: {
    locale: 'fr-FR',
    male: ['thomas', 'microsoft paul', 'microsoft claude', 'microsoft henri', 'daniel', 'jacques'],
    female: ['hortense', 'amelie', 'audrey', 'marie', 'julie', 'aurelie'],
    labels: {
      title: 'Le résumé audio du Grand Prix',
      voice: 'VOIX',
      transcript: 'Lire le transcript',
      unavailable: 'Podcast indisponible pour ce Grand Prix.',
      loading: 'GÉNÉRATION DU PODCAST...',
      noVoice: 'Aucune voix française détectée sur ce navigateur.',
    },
  },
  en: {
    locale: 'en-US',
    male: ['alex', 'daniel', 'microsoft guy', 'microsoft mark', 'microsoft david', 'google us english male'],
    female: ['samantha', 'victoria', 'karen', 'moira', 'tessa', 'google us english'],
    labels: {
      title: 'Audio race recap',
      voice: 'VOICE',
      transcript: 'Show transcript',
      unavailable: 'Podcast unavailable for this Grand Prix.',
      loading: 'GENERATING PODCAST...',
      noVoice: 'No English voice detected on this browser.',
    },
  },
  es: {
    locale: 'es-ES',
    male: ['jorge', 'diego', 'microsoft pablo', 'microsoft raul', 'google español male'],
    female: ['monica', 'paulina', 'marisol', 'google español'],
    labels: {
      title: 'El resumen de audio del Gran Premio',
      voice: 'VOZ',
      transcript: 'Ver transcripción',
      unavailable: 'Podcast no disponible para este Gran Premio.',
      loading: 'GENERANDO PODCAST...',
      noVoice: 'No se ha detectado ninguna voz en español en este navegador.',
    },
  },
  it: {
    locale: 'it-IT',
    male: ['luca', 'microsoft cosimo', 'google italiano male'],
    female: ['alice', 'elisa', 'paola', 'google italiano'],
    labels: {
      title: 'Il riepilogo audio del Gran Premio',
      voice: 'VOCE',
      transcript: 'Leggi la trascrizione',
      unavailable: 'Podcast non disponibile per questo Gran Premio.',
      loading: 'GENERAZIONE PODCAST...',
      noVoice: 'Nessuna voce italiana rilevata su questo browser.',
    },
  },
  ar: {
    locale: 'ar-SA',
    male: ['maged', 'microsoft hamed', 'microsoft naayf'],
    female: ['laila', 'zeina', 'microsoft hoda', 'google العربية'],
    labels: {
      title: 'الملخص الصوتي للجائزة الكبرى',
      voice: 'الصوت',
      transcript: 'اقرأ النص',
      unavailable: 'البودكاست غير متاح لهذه الجائزة الكبرى.',
      loading: 'جارٍ إنشاء البودكاست...',
      noVoice: 'لم يتم الكشف عن أي صوت عربي على هذا المتصفح.',
    },
  },
};

const FALLBACK_LANG = 'fr';

function pickVoice(lang) {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const config = VOICE_CONFIGS[lang] || VOICE_CONFIGS[FALLBACK_LANG];
  const prefix = config.locale.split('-')[0];

  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(prefix));
  if (langVoices.length === 0) return null;

  for (const name of config.male) {
    const match = langVoices.find(v => v.name.toLowerCase().includes(name));
    if (match) {
      console.log(`[Podcast][${lang}] Male voice:`, match.name);
      return match;
    }
  }

  const nonFemale = langVoices.find(v => {
    const n = v.name.toLowerCase();
    return !config.female.some(f => n.includes(f));
  });
  if (nonFemale) {
    console.log(`[Podcast][${lang}] Non-female voice:`, nonFemale.name);
    return nonFemale;
  }

  console.warn(`[Podcast][${lang}] Fallback voice:`, langVoices[0].name);
  return langVoices[0];
}

function generateFallbackScript(lang, raceName, results) {
  if (!results || results.length < 3) return '';
  const p1 = results[0], p2 = results[1], p3 = results[2];
  const fastest = results.find(r => r.isFastestLap);
  const name = d => `${d.driverFirstName || ''} ${d.driverLastName || ''}`.trim();

  switch (lang) {
    case 'en':
      return `Welcome to F1 Analytics. Today, the ${raceName}. ${name(p1)} takes the win` +
        (p1.constructorName ? ` for ${p1.constructorName}` : '') +
        `, ahead of ${name(p2)} and ${name(p3)}.` +
        (fastest ? ` Fastest lap for ${name(fastest)} in ${fastest.fastestLapTime}.` : '') +
        ` See you at the next Grand Prix.`;
    case 'es':
      return `Bienvenidos a F1 Analytics. Hoy, el ${raceName}. ${name(p1)} se lleva la victoria` +
        (p1.constructorName ? ` al volante de su ${p1.constructorName}` : '') +
        `, por delante de ${name(p2)} y ${name(p3)}.` +
        (fastest ? ` Vuelta rápida para ${name(fastest)} en ${fastest.fastestLapTime}.` : '') +
        ` Nos vemos en el próximo Gran Premio.`;
    case 'it':
      return `Benvenuti su F1 Analytics. Oggi, il ${raceName}. È ${name(p1)} a vincere` +
        (p1.constructorName ? ` al volante della sua ${p1.constructorName}` : '') +
        `, davanti a ${name(p2)} e ${name(p3)}.` +
        (fastest ? ` Giro veloce per ${name(fastest)} in ${fastest.fastestLapTime}.` : '') +
        ` Ci vediamo al prossimo Gran Premio.`;
    case 'ar':
      return `مرحبًا بكم في F1 Analytics. اليوم، ${raceName}. فاز ${name(p1)}` +
        (p1.constructorName ? ` على متن ${p1.constructorName}` : '') +
        `، متقدمًا على ${name(p2)} و ${name(p3)}.` +
        (fastest ? ` أسرع لفة لـ ${name(fastest)} بزمن ${fastest.fastestLapTime}.` : '') +
        ` نراكم في الجائزة الكبرى القادمة.`;
    default:
      return `Bienvenue sur F1 Analytics. Aujourd'hui, le ${raceName}. ${name(p1)} s'impose` +
        (p1.constructorName ? ` au volant de sa ${p1.constructorName}` : '') +
        `, devant ${name(p2)} et ${name(p3)}.` +
        (fastest ? ` Meilleur tour pour ${name(fastest)} en ${fastest.fastestLapTime}.` : '') +
        ` Rendez-vous au prochain Grand Prix.`;
  }
}

export default function RacePodcast({ raceId, raceName, results = [], teamColor = '#e10600' }) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || FALLBACK_LANG).split('-')[0];

  const config = VOICE_CONFIGS[currentLang] || VOICE_CONFIGS[FALLBACK_LANG];
  const L = config.labels;

  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [voicesReady, setVoicesReady] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [volume, setVolume] = useState(1.0);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoicesReady(true);
        const best = pickVoice(currentLang);
        if (best) {
          setSelectedVoiceName(best.name);
          setVoiceError('');
        } else {
          setSelectedVoiceName('');
          setVoiceError(L.noVoice);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLang]);

  useEffect(() => {
    if (!raceId) return;

    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
    setLoading(true);

    api.get(`/races/${raceId}/podcast`, { params: { lang: currentLang } })
      .then(r => {
        const backendScript = r.data?.script || '';
        if (backendScript.length > 20) {
          setScript(backendScript);
        } else {
          setScript(generateFallbackScript(currentLang, raceName, results));
        }
      })
      .catch(() => {
        setScript(generateFallbackScript(currentLang, raceName, results));
      })
      .finally(() => setLoading(false));
  }, [raceId, raceName, results, currentLang]);

  const play = () => {
    if (!script || !voicesReady) return;

    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = config.locale;
    utterance.rate = 0.92;
    utterance.pitch = 0.9;
    utterance.volume = volume;

    const voice = pickVoice(currentLang);
    if (voice) utterance.voice = voice;

    const wordCount = script.split(/\s+/).length;
    setDuration(Math.round((wordCount / 150) * 60));

    utterance.onboundary = (e) => {
      if (e.name === 'word' && script.length > 0) {
        setProgress(Math.min(100, (e.charIndex / script.length) * 100));
      }
    };

    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
      setProgress(100);
    };

    utterance.onerror = (e) => {
      console.error('[Podcast] Erreur TTS:', e);
      setPlaying(false);
      setPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setPlaying(true);
    setPaused(false);
  };

  const pause = () => {
    if (playing) {
      window.speechSynthesis.pause();
      setPaused(true);
      setPlaying(false);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
  };

  if (loading) {
    return (
      <div style={{
        padding: 24, textAlign: 'center',
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${teamColor}44`,
        borderRadius: 16,
        fontFamily: 'var(--font-display)',
        fontSize: 11, letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.4)',
      }}>
        🎙 {L.loading}
      </div>
    );
  }

  if (!script) {
    return (
      <div style={{
        padding: 24, textAlign: 'center',
        background: 'rgba(0,0,0,0.3)',
        border: `1px dashed ${teamColor}44`,
        borderRadius: 16,
        color: 'var(--text-dim)',
        fontFamily: 'var(--font-heading)', fontSize: 13,
      }}>
        🎙 {L.unavailable}
      </div>
    );
  }

  const isRTL = currentLang === 'ar';

  return (
    <div style={{
      position: 'relative',
      padding: '24px 28px',
      background: `linear-gradient(135deg, ${teamColor}22 0%, #0b0b12 100%)`,
      border: `1.5px solid ${teamColor}66`,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: `0 20px 60px -20px ${teamColor}66`,
      direction: isRTL ? 'rtl' : 'ltr',
    }}>
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 200, height: 200, borderRadius: '50%',
        background: `radial-gradient(circle, ${teamColor}44 0%, transparent 70%)`,
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
        }}>
          <span style={{ width: 24, height: 2, background: teamColor }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10, letterSpacing: '0.35em',
            color: teamColor, fontWeight: 700,
          }}>
            🎙 PODCAST · {raceName?.toUpperCase()}
          </span>
        </div>

        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 22, fontWeight: 900,
          textTransform: 'uppercase',
          color: '#fff',
          marginBottom: 6,
        }}>
          {L.title}
        </div>

        {selectedVoiceName && (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 9, letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: 16,
          }}>
            {L.voice} · {selectedVoiceName.toUpperCase()}
          </div>
        )}

        {voiceError && (
          <div style={{
            padding: '8px 12px',
            marginBottom: 16,
            background: 'rgba(255,135,0,0.1)',
            border: '1px solid rgba(255,135,0,0.3)',
            borderRadius: 6,
            color: '#ff8700',
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
          }}>
            ⚠️ {voiceError}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 20px',
          background: 'rgba(0,0,0,0.5)',
          border: `1px solid ${teamColor}44`,
          borderRadius: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          <button
            onClick={playing ? pause : play}
            disabled={!voicesReady || !!voiceError}
            style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: voicesReady && !voiceError
                ? `radial-gradient(circle, ${teamColor} 0%, ${teamColor}aa 100%)`
                : 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: '#fff',
              fontSize: 22,
              cursor: voicesReady && !voiceError ? 'pointer' : 'wait',
              display: 'grid', placeItems: 'center',
              boxShadow: voicesReady && !voiceError ? `0 0 25px ${teamColor}aa` : 'none',
              flexShrink: 0,
            }}
          >
            {playing ? (
              <span style={{ display: 'flex', gap: 4 }}>
                <span style={{ width: 5, height: 20, background: '#fff', borderRadius: 2 }} />
                <span style={{ width: 5, height: 20, background: '#fff', borderRadius: 2 }} />
              </span>
            ) : (
              <span style={{ marginLeft: 4 }}>▶</span>
            )}
          </button>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{
              height: 6, background: 'rgba(255,255,255,0.08)',
              borderRadius: 3, overflow: 'hidden', marginBottom: 8,
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${teamColor}, #ff1e00)`,
                boxShadow: `0 0 10px ${teamColor}`,
                transition: 'width 0.2s',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--font-display)', fontSize: 9,
              letterSpacing: '0.15em', color: 'var(--text-dim)',
            }}>
              <span>{voicesReady ? `${Math.round((progress / 100) * duration)}s` : '...'}</span>
              <span>{voicesReady ? `~${duration}s` : ''}</span>
            </div>
          </div>

          {(playing || paused) && (
            <button onClick={stop} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', cursor: 'pointer',
              display: 'grid', placeItems: 'center',
              fontSize: 14, flexShrink: 0,
            }}>✕</button>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16,
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 16 }}>🔊</span>
          <input
            type="range" min="0" max="1" step="0.05"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{
              flex: 1, accentColor: teamColor, cursor: 'pointer', height: 4,
            }}
          />
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 10,
            letterSpacing: '0.1em', color: teamColor, fontWeight: 700,
            minWidth: 36, textAlign: 'right',
          }}>{Math.round(volume * 100)}%</span>
        </div>

        <details style={{
          fontFamily: 'var(--font-heading)', fontSize: 13,
          color: 'var(--text-mid)', lineHeight: 1.7,
        }}>
          <summary style={{
            cursor: 'pointer', color: teamColor,
            fontWeight: 700, fontSize: 12,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '8px 0',
          }}>▼ {L.transcript}</summary>
          <div style={{
            padding: '12px 16px',
            marginTop: 8,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 8,
            fontStyle: 'italic',
            color: 'var(--text-dim)',
            direction: isRTL ? 'rtl' : 'ltr',
            textAlign: isRTL ? 'right' : 'left',
          }}>{script}</div>
        </details>
      </div>
    </div>
  );
}