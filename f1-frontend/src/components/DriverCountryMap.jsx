import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { imgSrc } from '../utils/images';

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(225,6,0,${alpha})`;
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(225,6,0,${alpha})`;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function createDriverIcon(driver, teamColor) {
  const W = 90;
  const H = 108;
  const number = driver.number != null ? driver.number : '?';
  const code = (driver.lastName || '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || '???';
  const flag = driver.countryCode ? `/flags/${driver.countryCode.toLowerCase()}.gif` : '';
  const flagPng = driver.countryCode ? `https://flagcdn.com/w40/${driver.countryCode.toLowerCase()}.png` : '';
  const soft = hexToRgba(teamColor, 0.35);
  const faint = hexToRgba(teamColor, 0.15);

  const html = `
    <div class="f1-radar-marker" style="--team-color:${teamColor};--team-soft:${soft};--team-faint:${faint};">
      <div class="f1-radar-halo"></div>
      <div class="f1-radar-ring"></div>
      <div class="f1-radar-body">
        <div class="f1-radar-grid"></div>
        <div class="f1-radar-sweep"></div>
        <div class="f1-radar-ring-inner f1-radar-ring-inner-1"></div>
        <div class="f1-radar-ring-inner f1-radar-ring-inner-2"></div>
        <div class="f1-radar-ring-inner f1-radar-ring-inner-3"></div>
        <div class="f1-radar-crosshair"></div>
        <div class="f1-radar-center">
          <div class="f1-radar-number">${number}</div>
          <div class="f1-radar-code">${code}</div>
        </div>
        <div class="f1-radar-orbit f1-radar-orbit-1"><div class="f1-radar-blip"></div></div>
        <div class="f1-radar-orbit f1-radar-orbit-2"><div class="f1-radar-blip"></div></div>
      </div>
      ${flag ? `<div class="f1-radar-flag"><img src="${flag}" onerror="this.src='${flagPng}'; this.onerror=null;" alt="${driver.countryCode}" /></div>` : ''}
      <div class="f1-radar-tail-line"></div>
      <div class="f1-radar-tail-dot"></div>
    </div>
  `;

  return L.divIcon({
    html, className: 'f1-radar-icon',
    iconSize: [W, H], iconAnchor: [W / 2, 99], popupAnchor: [0, -H],
  });
}

function MapResizer({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

export default function DriverCountryMap({ driver, teamColor = '#e10600' }) {
  const { latitude, longitude, birthCity, nationality, birthYear, countryCode } = driver;

  const icon = useMemo(
    () => (latitude != null && longitude != null ? createDriverIcon(driver, teamColor) : null),
    [driver, teamColor, latitude, longitude]
  );

  if (latitude == null || longitude == null) {
    return (
      <div style={{
        textAlign: 'center', padding: 60,
        background: 'rgba(15,15,22,0.6)',
        border: `1px dashed ${teamColor}44`,
        borderRadius: 12, color: 'var(--text-dim)',
        fontFamily: 'var(--font-heading)', fontSize: 14,
      }}>📍 Coordonnées du lieu de naissance non renseignées</div>
    );
  }

  const center = [latitude, longitude];

  return (
    <>
      <style>{`
        .leaflet-container {
          z-index: 1 !important;
          background: #0a0a0a;
          font-family: var(--font-heading);
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.75) !important;
          color: #555 !important; font-size: 8px !important;
        }
        .leaflet-control-attribution a { color: #888 !important; }
        .leaflet-control-zoom a {
          background: #1a1a1a !important; color: #fff !important;
          border-color: ${teamColor}66 !important; font-weight: 900;
          width: 34px !important; height: 34px !important;
          line-height: 34px !important; font-size: 18px !important;
        }
        .leaflet-control-zoom a:hover { background: ${teamColor} !important; color: #fff !important; }
        .leaflet-popup-content-wrapper {
          background: #1a1a1a !important; color: #fff !important;
          border-radius: 8px !important;
          border: 1.5px solid ${teamColor} !important;
          box-shadow: 0 0 30px ${teamColor}66 !important;
        }
        .leaflet-popup-tip {
          background: #1a1a1a !important;
          border: 1.5px solid ${teamColor} !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
          font-family: var(--font-heading) !important;
          font-size: 13px !important;
        }
        .leaflet-tile { filter: brightness(0.7) contrast(1.15) saturate(0.8) hue-rotate(-15deg); }

        .f1-radar-icon { background: transparent !important; border: none !important; }
        .f1-radar-marker { position: relative; width: 100%; height: 100%; animation: f1RadarEnter 0.65s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .f1-radar-halo {
          position: absolute; top: 5px; left: 50%; transform: translateX(-50%);
          width: 78px; height: 78px; border-radius: 50%;
          background: radial-gradient(circle, var(--team-color) 0%, transparent 70%);
          opacity: 0.45; filter: blur(16px);
          animation: f1RadarPulse 2.4s ease-in-out infinite; pointer-events: none;
        }
        .f1-radar-ring {
          position: absolute; top: 2px; left: 50%; transform: translateX(-50%);
          width: 84px; height: 84px; border-radius: 50%;
          border: 1.5px dashed var(--team-color); opacity: 0.75;
          animation: f1RadarRingSpin 14s linear infinite; pointer-events: none;
        }
        .f1-radar-body {
          position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
          width: 68px; height: 68px; border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #1a1a24 0%, #0a0a12 100%);
          border: 2px solid var(--team-color);
          box-shadow:
            0 6px 12px rgba(0,0,0,0.9),
            0 0 18px var(--team-color),
            0 0 36px var(--team-soft),
            inset 0 0 20px var(--team-faint);
          overflow: hidden;
        }
        .f1-radar-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(var(--team-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--team-color) 1px, transparent 1px);
          background-size: 10px 10px; opacity: 0.16; pointer-events: none;
        }
        .f1-radar-sweep {
          position: absolute; inset: 0; border-radius: 50%;
          background: conic-gradient(from 0deg, var(--team-color) 0deg, var(--team-color) 20deg, transparent 90deg, transparent 360deg);
          opacity: 0.7; animation: f1RadarSpin360 3s linear infinite;
          pointer-events: none; mix-blend-mode: screen;
        }
        .f1-radar-ring-inner {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid var(--team-color);
          pointer-events: none;
        }
        .f1-radar-ring-inner-1 { width: 48px; height: 48px; opacity: 0.45; }
        .f1-radar-ring-inner-2 { width: 36px; height: 36px; opacity: 0.3; }
        .f1-radar-ring-inner-3 { width: 24px; height: 24px; opacity: 0.2; }
        .f1-radar-crosshair {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 46px; height: 46px; pointer-events: none;
        }
        .f1-radar-crosshair::before,
        .f1-radar-crosshair::after {
          content: ''; position: absolute;
          background: var(--team-color); opacity: 0.55;
        }
        .f1-radar-crosshair::before { left: 0; right: 0; top: 50%; height: 1px; transform: translateY(-50%); }
        .f1-radar-crosshair::after { top: 0; bottom: 0; left: 50%; width: 1px; transform: translateX(-50%); }
        .f1-radar-center {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          display: flex; flex-direction: column;
          align-items: center; gap: 1px;
          z-index: 5; pointer-events: none;
        }
        .f1-radar-number {
          font-family: Orbitron, sans-serif; font-size: 22px; font-weight: 900;
          font-style: italic; color: #fff; line-height: 1;
          letter-spacing: -0.03em;
          text-shadow: 0 0 10px var(--team-color), 0 0 20px var(--team-color);
        }
        .f1-radar-code {
          font-family: Orbitron, sans-serif; font-size: 7px; font-weight: 900;
          letter-spacing: 0.15em; color: var(--team-color);
          text-shadow: 0 0 6px var(--team-color); margin-top: 2px;
        }
        .f1-radar-orbit { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; }
        .f1-radar-orbit-1 { animation: f1RadarSpin360 5s linear infinite; }
        .f1-radar-orbit-2 { animation: f1RadarSpin360 8s linear infinite reverse; }
        .f1-radar-blip {
          position: absolute; top: -3px; left: 50%;
          transform: translateX(-50%);
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--team-color);
          box-shadow: 0 0 8px var(--team-color), 0 0 14px var(--team-color);
        }
        .f1-radar-flag {
          position: absolute; top: 0; right: 0;
          width: 22px; height: 14px;
          border-radius: 2px; overflow: hidden;
          border: 1.5px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.9), 0 0 10px var(--team-color);
          z-index: 10; background: #0a0a0a;
        }
        .f1-radar-flag img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .f1-radar-tail-line {
          position: absolute; bottom: 14px; left: 50%;
          transform: translateX(-50%);
          width: 2px; height: 22px;
          background: linear-gradient(180deg, var(--team-color) 0%, var(--team-color) 55%, transparent 100%);
          box-shadow: 0 0 6px var(--team-color); pointer-events: none;
        }
        .f1-radar-tail-dot {
          position: absolute; bottom: 4px; left: 50%;
          transform: translateX(-50%);
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--team-color); border: 2px solid #fff;
          box-shadow: 0 0 14px var(--team-color), 0 0 24px var(--team-color);
          animation: f1RadarDotPulse 2s ease-in-out infinite;
          pointer-events: none; z-index: 10;
        }
        @keyframes f1RadarEnter {
          0% { opacity: 0; transform: translateY(-20px) scale(0.5); }
          60% { opacity: 1; transform: translateY(2px) scale(1.1); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes f1RadarPulse {
          0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.75; transform: translateX(-50%) scale(1.15); }
        }
        @keyframes f1RadarRingSpin {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes f1RadarSpin360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes f1RadarDotPulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.25); }
        }
        @keyframes f1Scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .f1-scanline {
          position: absolute; left: 0; right: 0; height: 90px;
          background: linear-gradient(180deg, transparent 0%, ${teamColor}55 50%, transparent 100%);
          animation: f1Scan 6s linear infinite; pointer-events: none;
          z-index: 300; mix-blend-mode: screen;
        }
        .f1-grid-overlay {
          position: absolute; inset: 0;
          pointer-events: none; z-index: 200;
          background-image:
            linear-gradient(${teamColor}08 1px, transparent 1px),
            linear-gradient(90deg, ${teamColor}08 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 40%, transparent 90%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 90%);
        }
        .f1-vignette {
          position: absolute; inset: 0;
          pointer-events: none; z-index: 250;
          background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%);
        }
        @keyframes f1CrossPulse {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
        }
        .f1-crosshair {
          position: absolute; top: 50%; left: 50%;
          width: 60px; height: 60px;
          pointer-events: none; z-index: 290;
          animation: f1CrossPulse 3s ease-in-out infinite;
        }
        .f1-crosshair::before, .f1-crosshair::after {
          content: ''; position: absolute; background: ${teamColor};
        }
        .f1-crosshair::before { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-50%); }
        .f1-crosshair::after { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); }
        @keyframes f1Dash {
          0% { transform: translateX(0); }
          100% { transform: translateX(-60px); }
        }
        .f1-telemetry-line {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: repeating-linear-gradient(90deg, ${teamColor}00 0px, ${teamColor}00 8px, ${teamColor} 8px, ${teamColor} 20px);
          animation: f1Dash 1.2s linear infinite;
          z-index: 400; opacity: 0.9; pointer-events: none;
        }
        .f1-stripe-corner {
          position: absolute; top: 0; right: 0;
          width: 140px; height: 70px;
          background: linear-gradient(135deg, transparent 45%, ${teamColor}ee 45%, ${teamColor}ee 55%, transparent 55%, transparent 70%, ${teamColor}aa 70%, ${teamColor}aa 80%, transparent 80%);
          z-index: 400; pointer-events: none;
          clip-path: polygon(0 0, 100% 0, 100% 100%);
        }
      `}</style>

      <div style={{
        position: 'relative', width: '100%', height: 520,
        borderRadius: 12, overflow: 'hidden',
        border: `2px solid ${teamColor}66`,
        boxShadow: `0 30px 60px -20px ${teamColor}88, 0 0 60px ${teamColor}22, inset 0 0 0 1px rgba(255,255,255,0.04)`,
        background: '#0a0a0a',
      }}>
        <div className="f1-telemetry-line" />

        <MapContainer center={center} zoom={13} scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />

          <Marker position={center} icon={icon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 10,
                  letterSpacing: '0.2em', color: teamColor,
                  fontWeight: 700, marginBottom: 6,
                }}>◆ LIEU DE NAISSANCE</div>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: 16,
                  fontWeight: 900, textTransform: 'uppercase',
                  color: '#fff', marginBottom: 4,
                }}>{birthCity || '—'}</div>
                {nationality && (
                  <div style={{ fontSize: 12, color: '#b8b8c0', fontFamily: 'var(--font-heading)' }}>
                    {nationality}{birthYear ? ` · ${birthYear}` : ''}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>

          <MapResizer trigger={`${latitude}-${longitude}`} />
        </MapContainer>

        <div className="f1-grid-overlay" />
        <div className="f1-scanline" />
        <div className="f1-crosshair" />
        <div className="f1-vignette" />
        <div className="f1-stripe-corner" />

        <div style={{
          position: 'absolute', top: 14, left: 14,
          width: 28, height: 28,
          borderTop: `3px solid ${teamColor}`, borderLeft: `3px solid ${teamColor}`,
          zIndex: 450, pointerEvents: 'none',
          boxShadow: `-2px -2px 12px ${teamColor}66`,
        }} />
        <div style={{
          position: 'absolute', bottom: 14, left: 14,
          width: 28, height: 28,
          borderBottom: `3px solid ${teamColor}`, borderLeft: `3px solid ${teamColor}`,
          zIndex: 450, pointerEvents: 'none',
          boxShadow: `-2px 2px 12px ${teamColor}66`,
        }} />
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          width: 28, height: 28,
          borderBottom: `3px solid ${teamColor}`, borderRight: `3px solid ${teamColor}`,
          zIndex: 450, pointerEvents: 'none',
          boxShadow: `2px 2px 12px ${teamColor}66`,
        }} />

        <div style={{
          position: 'absolute', top: 22, left: 22,
          padding: '8px 14px 8px 10px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          border: `1.5px solid ${teamColor}`, borderRadius: 4,
          display: 'flex', alignItems: 'center', gap: 10,
          zIndex: 460,
          boxShadow: `0 0 24px ${teamColor}55, inset 0 0 12px ${teamColor}11`,
          fontFamily: 'var(--font-display)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: teamColor,
            boxShadow: `0 0 10px ${teamColor}`,
            animation: 'f1RadarPulse 1.5s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 9, letterSpacing: '0.25em', color: teamColor, fontWeight: 700 }}>LOC</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.15em' }}>
            {countryCode || '—'}
          </span>
        </div>

        <div style={{
          position: 'absolute', top: 22, right: 165,
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          border: `1.5px solid ${teamColor}88`, borderRadius: 4,
          display: 'flex', alignItems: 'center', gap: 8,
          zIndex: 460, fontFamily: 'var(--font-display)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#00d26a',
            boxShadow: '0 0 8px #00d26a',
            animation: 'f1RadarPulse 1.2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 9, letterSpacing: '0.25em', color: '#00d26a', fontWeight: 700 }}>
            GPS LOCK
          </span>
        </div>

        <div style={{
          position: 'absolute', bottom: 22, left: 22,
          padding: '14px 20px',
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: `1.5px solid ${teamColor}`,
          borderLeft: `3px solid ${teamColor}`,
          borderRadius: 6, zIndex: 460,
          maxWidth: 'calc(100% - 200px)',
          boxShadow: `0 0 30px ${teamColor}44, inset 0 0 20px ${teamColor}11`,
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 9,
            letterSpacing: '0.3em', color: teamColor, fontWeight: 700,
            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 5, height: 5, background: teamColor,
              transform: 'rotate(45deg)', boxShadow: `0 0 8px ${teamColor}`,
            }} />
            ◆ LIEU DE NAISSANCE
          </div>
          <div style={{
            fontFamily: 'var(--font-heading)', fontSize: 24,
            fontWeight: 900, color: '#fff', textTransform: 'uppercase',
            letterSpacing: '0.03em', lineHeight: 1,
            marginBottom: 6, textShadow: `0 0 20px ${teamColor}66`,
          }}>{birthCity || '—'}</div>
          <div style={{
            display: 'flex', gap: 12, fontFamily: 'var(--font-display)',
            fontSize: 10, letterSpacing: '0.15em', color: 'var(--text-dim)',
          }}>
            {nationality && <span>{nationality.toUpperCase()}</span>}
            {nationality && birthYear && <span style={{ color: teamColor }}>·</span>}
            {birthYear && <span style={{ color: teamColor }}>{birthYear}</span>}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 22, right: 22,
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          border: `1.5px solid ${teamColor}66`, borderRadius: 4,
          zIndex: 460, fontFamily: 'var(--font-display)', textAlign: 'right',
        }}>
          <div style={{ fontSize: 8, letterSpacing: '0.25em', color: teamColor, fontWeight: 700, marginBottom: 4 }}>◆ COORD</div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#fff', lineHeight: 1.4 }}>
            <div>N {latitude.toFixed(4)}°</div>
            <div>E {longitude.toFixed(4)}°</div>
          </div>
        </div>

        <div style={{
          position: 'absolute', top: 22, left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 16px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          border: `1.5px solid ${teamColor}88`, borderRadius: 999,
          display: 'flex', alignItems: 'center', gap: 10,
          zIndex: 460, fontFamily: 'var(--font-display)',
        }}>
          <span style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--text-dim)', fontWeight: 700 }}>
            HOME
          </span>
          <span style={{ width: 1, height: 10, background: `${teamColor}66` }} />
          <span style={{
            fontSize: 12, fontWeight: 900, color: teamColor,
            letterSpacing: '0.15em', textShadow: `0 0 12px ${teamColor}`,
          }}>{driver.lastName?.toUpperCase()}</span>
        </div>
      </div>
    </>
  );
}