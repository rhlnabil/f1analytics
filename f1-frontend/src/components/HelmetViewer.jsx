import { useRef, useState, useCallback, useEffect } from 'react';
import { imgSrc } from '../utils/images';

export default function HelmetViewer({
  driver, size = 360, autoRotate = true, interactive = true, onDragStart, onDragEnd,
}) {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startRotation: 0 });
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef(null);

  const teamColor = driver.teamColor || '#e10600';
  const helmet = driver.helmetImage ? imgSrc(driver.helmetImage) : null;

  useEffect(() => {
    if (!autoRotate || dragging) return;
    const loop = (now) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      setRotation(r => (r + dt * 0.03) % 360);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [autoRotate, dragging]);

  const onPointerDown = useCallback((e) => {
    if (!interactive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragRef.current = { startX: e.clientX, startRotation: rotation };
    onDragStart?.();
  }, [rotation, interactive, onDragStart]);

  const onPointerMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    setRotation((dragRef.current.startRotation + dx * 0.8) % 360);
  }, [dragging]);

  const onPointerUp = useCallback((e) => {
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    onDragEnd?.();
  }, [onDragEnd]);

  const rad = (rotation * Math.PI) / 180;
  const tiltY = Math.sin(rad) * 8;
  const shadowX = Math.sin(rad) * 20;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'relative', width: size, height: size,
        cursor: dragging ? 'grabbing' : (interactive ? 'grab' : 'default'),
        userSelect: 'none', touchAction: 'none', perspective: 1200,
      }}
    >
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size * 0.9, height: size * 0.9, borderRadius: '50%',
        background: `radial-gradient(circle, ${teamColor}55 0%, transparent 65%)`,
        filter: 'blur(50px)', pointerEvents: 'none',
        animation: 'helmetHalo 3s ease-in-out infinite',
      }} />

      <div style={{
        position: 'absolute', bottom: size * 0.08, left: '50%',
        transform: `translateX(-50%) translateX(${shadowX}px)`,
        width: size * 0.75, height: 40, borderRadius: '50%',
        background: `radial-gradient(ellipse, ${teamColor}dd 0%, ${teamColor}44 40%, transparent 70%)`,
        filter: 'blur(18px)', opacity: 0.7, pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        transformStyle: 'preserve-3d',
        transform: `rotateY(${tiltY}deg) translateZ(30px)`,
      }}>
        {helmet ? (
          <img src={helmet} alt={`Casque ${driver.firstName} ${driver.lastName}`}
            draggable={false}
            style={{
              width: '70%', height: '70%', objectFit: 'contain',
              filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 30px ${teamColor}cc)`,
              pointerEvents: 'none',
            }} />
        ) : (
          <div style={{
            width: '60%', height: '60%', display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)', fontSize: 120, color: teamColor, opacity: 0.3,
          }}>🪖</div>
        )}
      </div>

      {interactive && (
        <div style={{
          position: 'absolute', bottom: 6, left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-display)', fontSize: 9,
          letterSpacing: '0.3em', color: teamColor,
          opacity: dragging ? 0 : 0.6, pointerEvents: 'none',
        }}>◆ DRAG TO ROTATE ◆</div>
      )}

      <style>{`
        @keyframes helmetHalo {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>
    </div>
  );
}