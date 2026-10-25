import { createContext, useCallback, useContext, useEffect, useRef } from 'react';

/* ============================================================ */
/* ============ SOUND CONTEXT — F1 APEX ======================= */
/* ============================================================ */
/*  • playCarPass()      → moteur F1 synthétisé (Web Audio)     */
/*  • playButtonHover()  → /ButtonSound.mp3 (hover sur bouton)  */
/* ============================================================ */

const SoundContext = createContext({
  playCarPass: () => {},
  playButtonHover: () => {},
});

export function SoundProvider({ children }) {
  const audioCtxRef = useRef(null);

  /* ===== Hover sound (MP3) ===== */
  const hoverAudioRef = useRef(null);
  const hoverReadyRef = useRef(false);
  const hoverLastPlayRef = useRef(0);

  /* ===== Web Audio ===== */
  const ensureCtx = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtxRef.current = new AC();
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    const unlock = () => {
      const ctx = ensureCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [ensureCtx]);

  /* ============================================================ */
  /* ============ PRELOAD du son de hover ====================== */
  /* ============================================================ */
  useEffect(() => {
    const audio = new Audio('/ButtonSound.mp3');
    audio.preload = 'auto';
    audio.volume = 0.45;
    hoverAudioRef.current = audio;

    const onReady = () => { hoverReadyRef.current = true; };
    audio.addEventListener('canplaythrough', onReady);
    audio.addEventListener('loadeddata', onReady);

    // Kick off loading explicitly
    try { audio.load(); } catch { /* ignore */ }

    return () => {
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('loadeddata', onReady);
      try { audio.pause(); } catch { /* ignore */ }
      audio.src = '';
      hoverAudioRef.current = null;
    };
  }, []);

  /* ============================================================ */
  /* ============ SON : HOVER BUTTON (MP3) ===================== */
  /* ============================================================ */
  const playButtonHover = useCallback(() => {
    const audio = hoverAudioRef.current;
    if (!audio) return;

    // Throttle : ignore si joué il y a moins de 100 ms
    const now = performance.now();
    if (now - hoverLastPlayRef.current < 100) return;
    hoverLastPlayRef.current = now;

    try {
      // Reset pour autoriser un rejeu rapide
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { /* autoplay bloqué → on ignore */ });
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* ============================================================ */
  /* ============ SON : F1 CAR PASSING (DOPPLER) ================ */
  /* ============================================================ */
  const playCarPass = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const duration = 1.6;

    /* ===== 1) BRUIT BLANC (pneus + aéro) ===== */
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 4;
    filter.frequency.setValueAtTime(150, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.7);
    filter.frequency.exponentialRampToValueAtTime(180, now + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.22, now + 0.55);
    noiseGain.gain.exponentialRampToValueAtTime(0.18, now + 0.9);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(now);
    noiseSrc.stop(now + duration);

    /* ===== 2) MOTEUR (oscillateur saw profond) ===== */
    const engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(45, now);
    engineOsc.frequency.exponentialRampToValueAtTime(90, now + 0.7);
    engineOsc.frequency.exponentialRampToValueAtTime(40, now + duration);

    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(180, now);
    engineFilter.frequency.exponentialRampToValueAtTime(800, now + 0.7);
    engineFilter.frequency.exponentialRampToValueAtTime(150, now + duration);

    const engineGain = ctx.createGain();
    engineGain.gain.setValueAtTime(0.0001, now);
    engineGain.gain.exponentialRampToValueAtTime(0.18, now + 0.55);
    engineGain.gain.exponentialRampToValueAtTime(0.15, now + 0.9);
    engineGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(ctx.destination);
    engineOsc.start(now);
    engineOsc.stop(now + duration);
  }, [ensureCtx]);

  return (
    <SoundContext.Provider value={{ playCarPass, playButtonHover }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}