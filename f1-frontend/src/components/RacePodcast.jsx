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
      noVoice: 'Aucune voix française détectée — la voix par défaut du navigateur sera utilisée.',
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
      noVoice: 'No English voice detected — the browser default voice will be used.',
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
      noVoice: 'No se ha detectado ninguna voz en español — se usará la voz por defecto del navegador.',
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
      noVoice: 'Nessuna voce italiana rilevata — verrà usata la voce predefinita del browser.',
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
      noVoice: 'لم يتم الكشف عن أي صوت عربي — سيتم استخدام الصوت الافتراضي للمتصفح.',
    },
  },
};

const FALLBACK_LANG = 'fr';

/* ============================================================ */
/* ✅ CHARGEMENT FIABLE DES VOIX (getVoices est async)          */
/* ============================================================ */
function getVoicesAsync() {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve([]);

    const existing = window.speechSynthesis.getVoices();
    if (existing && existing.length > 0) return resolve(existing);

    // Les voix ne sont pas encore chargées → on attend voiceschanged
    let resolved = false;
    const handler = () => {
      if (resolved) return;
      resolved = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);

    // Filet de sécurité : si l'événement ne se déclenche pas
    // (bug Safari/iOS), on re-vérifie après un court délai
    setTimeout(() => {
      if (resolved) return;
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        resolved = true;
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(v);
      }
    }, 800);

    // Dernier recours : après 2s, on résout avec ce qu'on a
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices() || []);
    }, 2000);
  });
}

/* ============================================================ */
/* ✅ SÉLECTION DE VOIX — retourne null mais ne bloque jamais    */
/* ============================================================ */
function pickVoice(voices, lang) {
  const config = VOICE_CONFIGS[lang] || VOICE_CONFIGS[FALLBACK_LANG];
  const prefix = config.locale.split('-')[0]; // ex: 'ar', 'en', 'es'

  // Filtre robuste : on teste le préfixe de langue
  const langVoices = (voices || []).filter((v) => {
    if (!v || !v.lang) return false;
    return v.lang.toLowerCase().startsWith(prefix);
  });

  if (langVoices.length === 0) {
    console.warn(`[Podcast][${lang}] Aucune voix ${prefix} dans getVoices(). Total disponible: ${voices?.length || 0}`);
    return null;
  }

  // 1. Essaye les voix mâles connues
  for (const name of config.male) {
    const match = langVoices.find((v) => v.name.toLowerCase().includes(name));
    if (match) {
      console.log(`[Podcast][${lang}] ✅ Male voice:`, match.name, '|', match.lang);
      return match;
    }
  }

  // 2. Fallback : première voix non-femelle
  const nonFemale = langVoices.find((v) => {
    const n = v.name.toLowerCase();
    return !config.female.some((f) => n.includes(f));
  });
  if (nonFemale) {
    console.log(`[Podcast][${lang}] ✅ Non-female voice:`, nonFemale.name, '|', nonFemale.lang);
    return nonFemale;
  }

  // 3. Dernier recours : la première voix de la langue
  console.log(`[Podcast][${lang}] ✅ Fallback voice:`, langVoices[0].name, '|', langVoices[0].lang);
  return langVoices[0];
}

/* ============================================================ */
/* ============ SCRIPT FALLBACK LOCAL ========================= */
/* ============================================================ */
function generateFallbackScript(lang, raceName, results) {
  if (!results || results.length < 3) return '';
  const p1 = results[0], p2 = results[1], p3 = results[2];
  const fastest = results.find((r) => r.isFastestLap);
  const name = (d) => `${d.driverFirstName || ''} ${d.driverLastName || ''}`.trim();

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

/* ============================================================ */
/* ==================== COMPOSANT PRINCIPAL =================== */
/* ============================================================ */
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
  const [voiceWarning, setVoiceWarning] = useState('');
  const [volume, setVolume] = useState(1.0);

  /* ============================================================ */
  /* ✅ CHARGEMENT DES VOIX (async fiable)                        */
  /* ============================================================ */
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setVoicesReady(true);
      setVoiceWarning('La synthèse vocale n\'est pas supportée par ce navigateur.');
      return;
    }

    let cancelled = false;

    getVoicesAsync().then((voices) => {
      if (cancelled) return;
      setVoicesReady(true);

      const best = pickVoice(voices, currentLang);
      if (best) {
        setSelectedVoiceName(best.name);
        setVoiceWarning('');
      } else {
        setSelectedVoiceName('');
        // ✅ Avertissement NON bloquant — le podcast reste utilisable
        setVoiceWarning(L.noVoice);
        console.warn(`[Podcast] Aucune voix "${currentLang}" détectée. Voix par défaut du navigateur utilisée.`);
      }
    });

    return () => {
      cancelled = true;
      try { window.speechSynthesis.cancel(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLang]);

  /* ============================================================ */
  /* ✅ CHARGEMENT DU SCRIPT (backend ou fallback local)         */
  /* ============================================================ */
  useEffect(() => {
    if (!raceId) return;

    try { window.speechSynthesis.cancel(); } catch {}
    setPlaying(false);
    setPaused(false);
    setProgress(0);
    setLoading(true);

    api.get(`/races/${raceId}/podcast`, { params: { lang: currentLang } })
      .then((r) => {
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

  /* ============================================================ */
  /* ✅ LECTURE — ne bloque plus sur absence de voix             */
  /* ============================================================ */
  const play = () => {
    if (!script) return;

    if (paused) {
      try { window.speechSynthesis.resume(); } catch {}
      setPaused(false);
      setPlaying(true);
      return;
    }

    try { window.speechSynthesis.cancel(); } catch {}

    const utterance = new SpeechSynthesisUtterance(script);

    // ✅ TOUJOURS définir la langue cible
    utterance.lang = config.locale;

    utterance.rate = 0.92;
    utterance.pitch = 0.9;
    utterance.volume = volume;

    // ✅ On tente d'assigner la meilleure voix
    // Si aucune n'est trouvée, on N'ASSIGNE PAS `voice`
    // → le navigateur utilise sa voix par défaut pour `utterance.lang`
    const voices = window.speechSynthesis.getVoices() || [];
    const voice = pickVoice(voices, currentLang);
    if (voice) {
      utterance.voice = voice;
    } else {
      console.warn(`[Podcast] Pas de voix "${currentLang}" — fallback voix par défaut du navigateur.`);
    }

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

    try {
      window.speechSynthesis.speak(utterance);
      setPlaying(true);
      setPaused(false);
    } catch (err) {
      console.error('[Podcast] speak() a échoué :', err);
    }
  };

  const pause = () => {
    if (playing) {
      try { window.speechSynthesis.pause(); } catch {}
      setPaused(true);
      setPlaying(false);
    }
  };

  const stop = () => {
    try { window.speechSynthesis.cancel(); } catch {}
    setPlaying(false);
    setPaused(false);
    setProgress(0);
  };

  /* ============================================================ */
  /* ============ RENDER STATES ================================= */
  /* ============================================================ */
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

  /* ✅ Le bouton n'est désactivé QUE si la synthèse vocale
         n'est pas supportée du tout par le navigateur */
  const speechSupported = 'speechSynthesis' in window;
  const buttonDisabled = !speechSupported;

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

        {/* ✅ Avertissement NON bloquant */}
        {voiceWarning && (
          <div style={{
            padding: '8px 12px',
            marginBottom: 16,
            background: 'rgba(255,135,0,0.08)',
            border: '1px solid rgba(255,135,0,0.25)',
            borderRadius: 6,
            color: '#ff8700',
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            lineHeight: 1.5,
          }}>
            ⚠️ {voiceWarning}
          </div>
        )}

        {/* Player */}
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
            disabled={buttonDisabled}
            style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: buttonDisabled
                ? 'rgba(255,255,255,0.1)'
                : `radial-gradient(circle, ${teamColor} 0%, ${teamColor}aa 100%)`,
              border: '2px solid rgba(255,255,255,0.3)',
              color: '#fff',
              fontSize: 22,
              cursor: buttonDisabled ? 'not-allowed' : 'pointer',
              display: 'grid', placeItems: 'center',
              boxShadow: buttonDisabled ? 'none' : `0 0 25px ${teamColor}aa`,
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
              <span>{`${Math.round((progress / 100) * duration)}s`}</span>
              <span>{`~${duration}s`}</span>
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

        {/* Volume */}
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
            onChange={(e) => setVolume(parseFloat(e.target.value))}
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

        {/* Transcript */}
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