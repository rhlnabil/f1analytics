import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import api from '../api/axios';
import { imgSrc, flagSrc } from '../utils/images';

/* ============================================================ */
/* ============ FAN BADGE — CARTE RECTANGULAIRE 360° ========= */
/* ============================================================ */

export default function FanBadge({ profile, onClose }) {
  const color = profile?.favoriteTeamColor || '#e10600';
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const [spin, setSpin] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);

  const [qrToken, setQrToken] = useState(null);

  const rafRef = useRef(null);
  const lastRef = useRef(performance.now());
  const manualRef = useRef(false);
  const dragStartRef = useRef(null);

  useEffect(() => {
    api.get('/auth/qr-token')
      .then(res => setQrToken(res.data.qrToken))
      .catch(err => console.warn('[FanBadge] QR token indisponible :', err?.message));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (paused || !entered) return;

    const loop = (now) => {
      if (!manualRef.current) {
        const dt = now - lastRef.current;
        lastRef.current = now;
        setSpin(prev => (prev + dt * 0.045) % 360);
      } else {
        lastRef.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, entered]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 400);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPointerDown = (e) => {
    manualRef.current = true;
    dragStartRef.current = { x: e.clientX, spin };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    setSpin(dragStartRef.current.spin + dx * 0.6);
  };

  const onPointerUp = () => {
    dragStartRef.current = null;
    manualRef.current = false;
  };

  /* ============================================================ */
  /* ============ TÉLÉCHARGEMENT PNG + QR CODE ================== */
  /* ============================================================ */
  const download = async () => {
    const loadImage = (url) => new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

    const W = 800;
    const H = 1380;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    let qrDataUrl = null;
    if (qrToken) {
      const qrUrl = `${window.location.origin}/qr-access?token=${encodeURIComponent(qrToken)}`;
      try {
        qrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 512,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#0a0a0f', light: '#ffffff' },
        });
      } catch (e) {
        console.warn('QR génération échouée', e);
      }
    }

    const driverPhotoUrl =
      profile?.favoriteDriverActionPhotoUrl ||
      profile?.favoriteDriverTransitionPhotoUrl ||
      profile?.favoriteDriverPhotoUrl;

    const [driverPhoto, teamLogo, apexLogo, signature, qrImage] = await Promise.all([
      loadImage(imgSrc(driverPhotoUrl)),
      loadImage(imgSrc(profile?.favoriteTeamLogoUrl)),
      loadImage('/Logo.png'),
      loadImage(imgSrc(profile?.favoriteDriverSignatureUrl)),
      loadImage(qrDataUrl),
    ]);

    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a0a0f');
    bgGrad.addColorStop(0.5, `rgba(${r},${g},${b}, 0.2)`);
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = `rgba(${r},${g},${b}, 0.08)`;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);

    if (apexLogo) {
      ctx.drawImage(apexLogo, 40, 40, 70, 70);
      ctx.font = `900 22px Orbitron, sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('F1 APEX', 130, 75);
    }

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(W - 180, 60, 140, 40, 8);
    else ctx.rect(W - 180, 60, 140, 40);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `900 16px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('FAN ID', W - 110, 80);

    const sepGrad = ctx.createLinearGradient(0, 0, W, 0);
    sepGrad.addColorStop(0, 'rgba(0,0,0,0)');
    sepGrad.addColorStop(0.5, `rgb(${r},${g},${b})`);
    sepGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sepGrad;
    ctx.fillRect(0, 140, W, 2);

    if (driverPhoto) {
      const photoAreaY = 180;
      const photoAreaH = 480;
      const photoAreaW = W - 80;

      const photoHalo = ctx.createRadialGradient(
        W / 2, photoAreaY + photoAreaH / 2, 50,
        W / 2, photoAreaY + photoAreaH / 2, photoAreaH * 0.7
      );
      photoHalo.addColorStop(0, `rgba(${r},${g},${b}, 0.5)`);
      photoHalo.addColorStop(1, `rgba(${r},${g},${b}, 0)`);
      ctx.fillStyle = photoHalo;
      ctx.fillRect(0, photoAreaY, W, photoAreaH);

      const srcW = driverPhoto.width;
      const srcH = driverPhoto.height;
      const ratio = srcW / srcH;

      let destW = photoAreaW;
      let destH = destW / ratio;

      if (destH > photoAreaH) {
        destH = photoAreaH;
        destW = destH * ratio;
      }

      const destX = (W - destW) / 2;
      const destY = photoAreaY + (photoAreaH - destH) / 2;

      ctx.shadowColor = `rgba(${r},${g},${b}, 0.9)`;
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 20;

      ctx.drawImage(
        driverPhoto,
        0, 0, srcW, srcH,
        destX, destY, destW, destH
      );

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    if (profile?.favoriteDriverNumber) {
      ctx.font = `italic 900 160px Orbitron, sans-serif`;
      ctx.fillStyle = `rgba(${r},${g},${b}, 0.12)`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(String(profile.favoriteDriverNumber), W - 40, 180);
    }

    const nameY = 700;
    ctx.font = `600 28px 'Titillium Web', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '8px';
    ctx.fillText((profile?.favoriteDriverFirstName || '').toUpperCase(), W / 2, nameY);
    ctx.letterSpacing = '0px';

    ctx.font = `900 72px 'Titillium Web', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = `rgb(${r},${g},${b})`;
    ctx.shadowBlur = 40;
    ctx.fillText((profile?.favoriteDriverLastName || '').toUpperCase(), W / 2, nameY + 70);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    const lineW = 400;
    const lineY = nameY + 130;
    const lineGrad = ctx.createLinearGradient(W / 2 - lineW / 2, 0, W / 2 + lineW / 2, 0);
    lineGrad.addColorStop(0, 'rgba(0,0,0,0)');
    lineGrad.addColorStop(0.5, `rgb(${r},${g},${b})`);
    lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(W / 2 - lineW / 2, lineY, lineW, 3);

    ctx.font = `900 26px Orbitron, sans-serif`;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.textAlign = 'center';
    ctx.letterSpacing = '8px';
    ctx.fillText((profile?.favoriteTeamName || '').toUpperCase(), W / 2, lineY + 50);
    ctx.letterSpacing = '0px';

    if (signature) {
      const sigMaxW = 320;
      const ratio = signature.width / signature.height;
      let sw = sigMaxW;
      let sh = sw / ratio;
      if (sh > 110) { sh = 110; sw = sh * ratio; }
      const sigX = (W - sw) / 2;
      const sigY = lineY + 100;

      const sigHalo = ctx.createRadialGradient(
        W / 2, sigY + sh / 2, 10,
        W / 2, sigY + sh / 2, sw
      );
      sigHalo.addColorStop(0, `rgba(${r},${g},${b}, 0.5)`);
      sigHalo.addColorStop(1, `rgba(${r},${g},${b}, 0)`);
      ctx.fillStyle = sigHalo;
      ctx.fillRect(sigX - 40, sigY - 40, sw + 80, sh + 80);

      const sigCanvas = document.createElement('canvas');
      sigCanvas.width = signature.width;
      sigCanvas.height = signature.height;
      const sigCtx = sigCanvas.getContext('2d');
      sigCtx.drawImage(signature, 0, 0);

      try {
        const imgData = sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i]     = 255 - d[i];
          d[i + 1] = 255 - d[i + 1];
          d[i + 2] = 255 - d[i + 2];
        }
        sigCtx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.warn('[FanBadge] Impossible d\'inverser la signature :', err);
      }

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.drawImage(sigCanvas, sigX, sigY, sw, sh);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.drawImage(sigCanvas, sigX, sigY, sw, sh);
      ctx.restore();
    }

    const userY = 1060;
    ctx.font = `700 28px Orbitron, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText(`@${profile?.username || 'fan'}`.toUpperCase(), W / 2, userY);
    ctx.letterSpacing = '0px';

    ctx.font = `500 14px Orbitron, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.letterSpacing = '8px';
    ctx.fillText('F1 APEX · RACE INTELLIGENCE', W / 2, userY + 36);
    ctx.letterSpacing = '0px';

    const qrSectionY = 1140;

    const qrSepGrad = ctx.createLinearGradient(60, 0, W - 60, 0);
    qrSepGrad.addColorStop(0, 'rgba(0,0,0,0)');
    qrSepGrad.addColorStop(0.5, `rgba(${r},${g},${b}, 0.6)`);
    qrSepGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = qrSepGrad;
    ctx.fillRect(60, qrSectionY, W - 120, 2);

    ctx.font = `900 11px Orbitron, sans-serif`;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('◆ SCAN TO OPEN YOUR FAN HUB ◆', W / 2, qrSectionY + 30);
    ctx.letterSpacing = '0px';

    if (qrImage) {
      const qrSize = 150;
      const qrX = (W - qrSize) / 2;
      const qrY = qrSectionY + 55;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 10);
      else ctx.rect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
      ctx.fill();

      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      ctx.font = `700 9px Orbitron, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.letterSpacing = '3px';
      ctx.fillText('NO LOGIN · DIRECT ACCESS', W / 2, qrY + qrSize + 24);
      ctx.letterSpacing = '0px';
    }

    const link = document.createElement('a');
    link.download = `f1apex-badge-${profile?.username || 'fan'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const CARD_W = 360;
  const CARD_H = 560;

  const driverNumber = profile?.favoriteDriverNumber;
  const firstName = (profile?.favoriteDriverFirstName || '').toUpperCase();
  const lastName = (profile?.favoriteDriverLastName || '').toUpperCase();
  const code = (profile?.favoriteDriverLastName || profile?.favoriteDriverFirstName || 'FAN')
    .replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();

  const teamName = (profile?.favoriteTeamName || '').toUpperCase();
  const teamCountry = (profile?.favoriteTeamCountry || '').toUpperCase();
  const teamCountryCode = profile?.favoriteTeamCountryCode || '';
  const championships = profile?.favoriteTeamWorldChampionships || 0;

  const driverPhotoUrl =
    profile?.favoriteDriverActionPhotoUrl ||
    profile?.favoriteDriverTransitionPhotoUrl ||
    profile?.favoriteDriverPhotoUrl;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483647,
        background: 'rgba(3,3,8,0.98)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 20, overflow: 'auto',
        fontFamily: 'var(--font-heading)',
        opacity: closing ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 30, left: 0, right: 0,
        padding: '0 40px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 16,
        zIndex: 20,
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.6s ease 0.1s',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 10,
            letterSpacing: '0.4em', color, fontWeight: 700,
            marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 24, height: 2, background: color }} />
            FAN ID BADGE 360°
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 24,
            fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '-0.02em', color: '#fff', margin: 0,
          }}>Ton badge de fan</h2>
        </div>

        <button
          onClick={handleClose}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 22, fontWeight: 700,
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            transition: 'all 0.25s',
          }}
        >×</button>
      </div>

      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 60, paddingBottom: 40,
        justifyContent: 'center',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s',
      }}>

        <div
          className="fb-side-orb fb-side-left"
          style={{
            position: 'absolute', left: -96, top: '50%',
            transform: entered ? 'translateY(-50%) translateX(0) scale(1)' : 'translateY(-50%) translateX(-70px) scale(0.6)',
            opacity: entered ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.55s',
            zIndex: 30, width: 68, height: 68,
          }}
        >
          <div style={{
            position: 'absolute', inset: -9, borderRadius: '50%',
            border: `1.5px dashed ${color}77`,
            animation: 'spinRing 14s linear infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: -22, borderRadius: '50%',
            background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
            filter: 'blur(18px)', pointerEvents: 'none',
            opacity: paused ? 1 : 0.55,
          }} />
          <button
            onClick={(e) => { e.stopPropagation(); setPaused(p => !p); }}
            style={{
              position: 'relative', width: 68, height: 68,
              borderRadius: '50%',
              background: paused
                ? `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`
                : 'rgba(10,10,16,0.72)',
              border: `1.5px solid ${color}`,
              color: paused ? '#fff' : color,
              cursor: 'pointer', display: 'grid', placeItems: 'center',
              backdropFilter: 'blur(16px)',
              transition: 'all 0.4s',
              padding: 0, outline: 'none',
            }}
          >
            {paused ? (
              <div style={{
                width: 0, height: 0,
                borderTop: '11px solid transparent',
                borderBottom: '11px solid transparent',
                borderLeft: `17px solid currentColor`,
                marginLeft: 4,
              }} />
            ) : (
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 5, height: 22, background: 'currentColor', borderRadius: 2 }} />
                <div style={{ width: 5, height: 22, background: 'currentColor', borderRadius: 2 }} />
              </div>
            )}
          </button>
        </div>

        <div
          className="fb-side-orb fb-side-right"
          style={{
            position: 'absolute', right: -96, top: '50%',
            transform: entered ? 'translateY(-50%) translateX(0) scale(1)' : 'translateY(-50%) translateX(70px) scale(0.6)',
            opacity: entered ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s',
            zIndex: 30, width: 68, height: 68,
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `2px solid ${color}`,
            animation: 'orbPulse 2.4s ease-out infinite',
            pointerEvents: 'none', opacity: 0.7,
          }} />
          <div style={{
            position: 'absolute', inset: -9, borderRadius: '50%',
            border: `1.5px dashed ${color}99`,
            animation: 'spinRingRev 12s linear infinite',
            pointerEvents: 'none',
          }} />
          <button
            onClick={(e) => { e.stopPropagation(); download(); }}
            style={{
              position: 'relative', width: 68, height: 68,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`,
              border: `1.5px solid rgba(255,255,255,0.35)`,
              color: '#fff', cursor: 'pointer',
              display: 'grid', placeItems: 'center',
              boxShadow: `0 0 34px ${color}dd, 0 0 65px ${color}88`,
              transition: 'all 0.4s', padding: 0, outline: 'none',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 18v1.5A1.5 1.5 0 005.5 21h13A1.5 1.5 0 0020 19.5V18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div style={{ position: 'relative', width: 60, height: 200, marginBottom: -6, zIndex: 2 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, width: '50%', height: '100%',
            background: `linear-gradient(180deg, ${color} 0%, ${color}dd 30%, #0a0a0f 60%, ${color}dd 100%)`,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 95%)',
            transform: 'rotate(-1.5deg)', transformOrigin: 'top center',
          }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, width: '50%', height: '100%',
            background: `linear-gradient(180deg, ${color} 0%, ${color}dd 30%, #0a0a0f 60%, ${color}dd 100%)`,
            clipPath: 'polygon(0 0, 100% 0, 100% 95%, 0 100%)',
            transform: 'rotate(1.5deg)', transformOrigin: 'top center',
          }} />
          <div style={{
            position: 'absolute', inset: '4px 6px',
            backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 10px, rgba(255,255,255,0.18) 10px, rgba(255,255,255,0.18) 12px)`,
            opacity: 0.85, pointerEvents: 'none',
          }} />
        </div>

        <div style={{
          perspective: '1800px', perspectiveOrigin: '50% 50%',
          width: CARD_W, height: CARD_H,
        }}>
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => { if (!dragStartRef.current) setPaused(p => !p); }}
            style={{
              position: 'relative', width: '100%', height: '100%',
              transformStyle: 'preserve-3d',
              transform: `rotateY(${spin}deg)`,
              cursor: dragStartRef.current ? 'grabbing' : 'grab',
              userSelect: 'none', touchAction: 'none',
            }}
          >
            {/* FACE AVANT */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              borderRadius: 20, overflow: 'hidden',
              background: `linear-gradient(160deg, #08080d 0%, #04060a 100%)`,
              border: `2px solid rgba(${r},${g},${b}, 0.7)`,
              boxShadow: hovered
                ? `0 40px 80px -20px ${color}cc, 0 0 60px ${color}88`
                : `0 20px 50px rgba(0,0,0,0.8), 0 0 40px ${color}55`,
              transition: 'box-shadow 0.4s',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, ${color}55 0%, ${color}00 42%, ${color}00 58%, ${color}44 100%)`,
                pointerEvents: 'none',
              }} />

              {driverNumber && (
                <div style={{
                  position: 'absolute', top: '10%', right: '-10%',
                  transform: 'rotate(-8deg)',
                  fontFamily: 'var(--font-display)', fontSize: 320,
                  fontWeight: 900, fontStyle: 'italic',
                  lineHeight: 0.8, letterSpacing: '-0.08em',
                  color: 'transparent',
                  WebkitTextStroke: `2px rgba(${r},${g},${b}, 0.5)`,
                  pointerEvents: 'none', userSelect: 'none', zIndex: 1,
                }}>{driverNumber}</div>
              )}

              {driverPhotoUrl && (
                <div style={{
                  position: 'absolute',
                  top: 40,
                  left: 0,
                  right: 0,
                  bottom: 180,
                  overflow: 'hidden',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                }}>
                  <img
                    src={imgSrc(driverPhotoUrl)}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      transform: hovered ? 'scale(1.08)' : 'scale(1)',
                      transformOrigin: 'center top',
                      transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
                      filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.95)) drop-shadow(0 0 35px ${color}cc) contrast(1.08) saturate(1.15)`,
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, height: 240,
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 45%, #000 100%)',
                pointerEvents: 'none', zIndex: 3,
              }} />

              <div style={{
                position: 'absolute', top: 18, left: -26, right: -26, height: 46,
                background: `linear-gradient(90deg, ${color}, ${color}ee)`,
                transform: 'rotate(-2deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px',
                boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 30px ${color}88`,
                zIndex: 5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {driverNumber && (
                    <div style={{
                      background: '#05070a', color: '#fff',
                      padding: '3px 9px', borderRadius: 4,
                      fontFamily: 'var(--font-display)', fontSize: 14,
                      fontWeight: 900, fontStyle: 'italic', lineHeight: 1,
                    }}>#{driverNumber}</div>
                  )}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 20,
                    fontWeight: 900, fontStyle: 'italic',
                    color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}>{code}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {profile?.favoriteDriverCountryCode && (
                    <img
                      src={flagSrc(profile.favoriteDriverCountryCode)}
                      alt=""
                      style={{ height: 14, width: 'auto', borderRadius: 2 }}
                    />
                  )}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 10,
                    fontWeight: 700, color: '#fff', letterSpacing: '0.22em',
                  }}>{profile?.favoriteDriverCountryCode || ''}</div>
                </div>
              </div>

              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 66,
                padding: '0 8px', textAlign: 'center', zIndex: 5,
              }}>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: 11,
                  fontWeight: 700, letterSpacing: '0.5em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.75)', marginBottom: 2,
                  textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                  paddingLeft: '0.5em',
                }}>{firstName}</div>

                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: 46,
                  fontWeight: 900, fontStyle: 'italic',
                  letterSpacing: '-0.045em', textTransform: 'uppercase',
                  color: '#fff', lineHeight: 0.9, whiteSpace: 'nowrap',
                  textShadow: `0 0 30px ${color}, 0 4px 20px rgba(0,0,0,0.9)`,
                  transform: 'rotate(-2deg)', marginBottom: 10,
                }}>{lastName}</div>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px',
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  borderRadius: 3,
                  fontFamily: 'var(--font-display)', fontSize: 9,
                  fontWeight: 900, letterSpacing: '0.25em',
                  color: '#fff', textTransform: 'uppercase',
                  boxShadow: `0 4px 16px ${color}aa`,
                }}>{teamName}</div>
              </div>

              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, height: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 14px',
                borderTop: `1px solid rgba(${r},${g},${b}, 0.35)`,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%)',
                zIndex: 5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: color, boxShadow: `0 0 8px ${color}`,
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 10,
                    fontWeight: 700, letterSpacing: '0.14em', color: '#fff',
                  }}>@{profile?.username?.toUpperCase() || 'FAN'}</span>
                </div>

                {profile?.favoriteDriverSignatureUrl && (
                  <img
                    src={imgSrc(profile.favoriteDriverSignatureUrl)}
                    alt=""
                    style={{
                      height: 26, width: 'auto', maxWidth: 120,
                      objectFit: 'contain',
                      filter: `invert(1) drop-shadow(0 0 6px ${color})`,
                      opacity: 0.92,
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}

                {profile?.favoriteTeamLogoUrl && (
                  <img
                    src={imgSrc(profile.favoriteTeamLogoUrl)}
                    alt=""
                    style={{
                      height: 22, width: 'auto', objectFit: 'contain',
                      filter: `drop-shadow(0 0 6px ${color}aa)`, opacity: 0.9,
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>
            </div>

            {/* FACE ARRIÈRE */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 20, overflow: 'hidden',
              background: `linear-gradient(160deg, #08080d 0%, #04060a 100%)`,
              border: `2px solid rgba(${r},${g},${b}, 0.7)`,
              boxShadow: hovered
                ? `0 40px 80px -20px ${color}cc, 0 0 60px ${color}88`
                : `0 20px 50px rgba(0,0,0,0.8), 0 0 40px ${color}55`,
              transition: 'box-shadow 0.4s',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(-135deg, ${color}55 0%, ${color}00 42%, ${color}00 58%, ${color}44 100%)`,
                pointerEvents: 'none',
              }} />

              {teamName && (
                <div style={{
                  position: 'absolute', top: '8%', left: '-30%',
                  transform: 'rotate(-8deg)',
                  fontFamily: 'var(--font-display)', fontSize: 140,
                  fontWeight: 900, fontStyle: 'italic',
                  lineHeight: 0.85, letterSpacing: '-0.06em',
                  color: 'transparent',
                  WebkitTextStroke: `2px rgba(${r},${g},${b}, 0.35)`,
                  pointerEvents: 'none', userSelect: 'none',
                  whiteSpace: 'nowrap', zIndex: 1,
                }}>{teamName}</div>
              )}

              {profile?.favoriteTeamLogoUrl && (
                <div style={{
                  position: 'absolute', top: '44%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 200, height: 200,
                  display: 'grid', placeItems: 'center', zIndex: 3,
                }}>
                  <div style={{
                    position: 'absolute', inset: -18, borderRadius: '50%',
                    border: `2px dashed ${color}`, opacity: 0.75,
                    animation: 'spinRing 14s linear infinite',
                  }} />
                  <div style={{
                    position: 'relative', width: '100%', height: '100%',
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                    background: `linear-gradient(160deg, #ffffff 0%, #f0f0f5 100%)`,
                    padding: 26, display: 'grid', placeItems: 'center',
                    boxShadow: `0 0 50px ${color}88, 0 0 90px ${color}44`,
                  }}>
                    <img
                      src={imgSrc(profile.favoriteTeamLogoUrl)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative' }}
                    />
                  </div>
                </div>
              )}

              <div style={{
                position: 'absolute', top: 18, left: -26, right: -26, height: 46,
                background: `linear-gradient(90deg, ${color}ee, ${color})`,
                transform: 'rotate(2deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px',
                boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 30px ${color}88`,
                zIndex: 5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {teamCountryCode && (
                    <img src={flagSrc(teamCountryCode)} alt=""
                      style={{ height: 14, width: 'auto', borderRadius: 2 }} />
                  )}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 11,
                    fontWeight: 900, color: '#fff', letterSpacing: '0.22em',
                  }}>{teamCountryCode || ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {championships > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: '#05070a', color: '#FFD700',
                      padding: '3px 10px', borderRadius: 4,
                      fontFamily: 'var(--font-display)', fontSize: 12,
                      fontWeight: 900, fontStyle: 'italic',
                    }}>👑 ×{championships}</div>
                  )}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 10,
                    fontWeight: 700, color: '#fff', letterSpacing: '0.22em',
                  }}>TEAM</div>
                </div>
              </div>

              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 66,
                padding: '0 8px', textAlign: 'center', zIndex: 5,
              }}>
                {teamCountry && (
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: 11,
                    fontWeight: 700, letterSpacing: '0.5em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.75)', marginBottom: 4,
                    textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                    paddingLeft: '0.5em',
                  }}>{teamCountry}</div>
                )}

                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: 40,
                  fontWeight: 900, fontStyle: 'italic',
                  letterSpacing: '-0.045em', textTransform: 'uppercase',
                  color: '#fff', lineHeight: 0.92, whiteSpace: 'nowrap',
                  textShadow: `0 0 30px ${color}, 0 4px 20px rgba(0,0,0,0.9)`,
                  transform: 'rotate(2deg)', marginBottom: 12,
                }}>{teamName}</div>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '4px 12px',
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  borderRadius: 3,
                  fontFamily: 'var(--font-display)', fontSize: 9,
                  fontWeight: 900, letterSpacing: '0.28em',
                  color: '#fff', textTransform: 'uppercase',
                }}>F1 APEX · FAN ID</div>
              </div>

              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, height: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 14px',
                borderTop: `1px solid rgba(${r},${g},${b}, 0.35)`,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%)',
                zIndex: 5,
              }}>
                {profile?.favoriteTeamLogoUrl && (
                  <img src={imgSrc(profile.favoriteTeamLogoUrl)} alt=""
                    style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#fff' }}>
                    @{profile?.username?.toUpperCase() || 'FAN'}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)' }}>
                  RACE INTELLIGENCE
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 40, width: 260, height: 20,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${color}88 0%, transparent 70%)`,
          filter: 'blur(20px)', opacity: 0.6,
          animation: 'shadowPulse 3s ease-in-out infinite',
        }} />
      </div>

      <div style={{
        fontFamily: 'var(--font-heading)', fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', maxWidth: 500,
        marginTop: 10, marginBottom: 30, zIndex: 20,
        opacity: entered ? 1 : 0,
        transition: 'opacity 0.6s ease 0.9s',
      }}>
        💡 Clique pour pause · Glisse pour tourner · Esc = fermer
        {qrToken && <><br /><span style={{ color }}>◆ Le PNG téléchargé contient un QR d'accès direct à ton espace fan</span></>}
      </div>

      <style>{`
        @keyframes badgeHalo {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes shadowPulse {
          0%, 100% { opacity: 0.4; transform: scaleX(1); }
          50%      { opacity: 0.7; transform: scaleX(1.1); }
        }
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spinRingRev {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
        @keyframes orbPulse {
          0%   { transform: scale(1);   opacity: 0.85; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        body { overflow: hidden !important; }
        @media (max-width: 700px) {
          .fb-side-left  { left: -68px !important; }
          .fb-side-right { right: -68px !important; }
        }
      `}</style>
    </div>,
    document.body
  );
}