import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { imgSrc, flagSrc } from '../utils/images';
import { findCarImage } from '../utils/cars';
import { useCursor } from '../context/CursorContext';

/* ============================================================ */
/* ======================= HOOKS =============================== */
/* ============================================================ */

function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useMouseParallax(strength = 12) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setPos({ x: x * strength, y: y * strength });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [strength]);
  return pos;
}

function Reveal({ children, delay = 0, direction = 'up', style = {} }) {
  const [ref, visible] = useScrollReveal();
  const transforms = {
    up: 'translateY(50px)',
    left: 'translateX(-50px)',
    right: 'translateX(50px)',
    scale: 'scale(0.92)',
  };
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity 0.9s cubic-bezier(0.4,0,0.2,1) ${delay}s, transform 0.9s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================ */
/* ============ MAP AUTO FIT ================================== */
/* ============================================================ */

function MapAutoFit({ positions, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length === 0) return;
    const t = setTimeout(() => {
      map.invalidateSize();
      if (positions.length === 1) {
        map.setView(positions[0], 6, { animate: true });
      } else {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 8, animate: true });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [positions, trigger, map]);
  return null;
}

/* ============================================================ */
/* ============ PILOT ORIGINS TRACKER ========================= */
/* ============================================================ */

function PilotOriginsTracker({ drivers, teamColor, teamName }) {
  const [selectedId, setSelectedId] = useState(null);
  const mapInstanceRef = useRef(null);

  const locatedDrivers = useMemo(
    () => drivers.filter(d => d.latitude != null && d.longitude != null),
    [drivers]
  );

  const unlocatedDrivers = useMemo(
    () => drivers.filter(d => d.latitude == null || d.longitude == null),
    [drivers]
  );

  const selectedDriver = useMemo(
    () => locatedDrivers.find(d => d.id === selectedId) || locatedDrivers[0] || null,
    [locatedDrivers, selectedId]
  );

  useEffect(() => {
    if (!selectedId && locatedDrivers.length > 0) {
      setSelectedId(locatedDrivers[0].id);
    }
  }, [locatedDrivers, selectedId]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedDriver) return;
    mapInstanceRef.current.flyTo(
      [selectedDriver.latitude, selectedDriver.longitude],
      8,
      { duration: 1.4, easeLinearity: 0.25 }
    );
  }, [selectedDriver]);

  if (locatedDrivers.length === 0) {
    return (
      <div style={{
        padding: 60, textAlign: 'center',
        background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
        border: `1.5px dashed ${teamColor}44`,
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}>📍</div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 18, fontWeight: 700,
          color: 'var(--text-dim)', marginBottom: 8,
        }}>
          Coordonnées des pilotes non renseignées
        </div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 13, color: 'var(--text-dim)', opacity: 0.6,
        }}>
          Ajoute la latitude / longitude des pilotes depuis l'admin
        </div>
      </div>
    );
  }

  const positions = locatedDrivers.map(d => [d.latitude, d.longitude]);
  const center = positions[0];

  return (
    <>
      <style>{`
        .origins-map .leaflet-container {
          background: #05070a !important;
          font-family: var(--font-heading) !important;
          outline: none !important;
        }
        .origins-map .leaflet-tile {
          filter: brightness(0.65) contrast(1.18) saturate(0.75) hue-rotate(-15deg);
        }
        .origins-map .leaflet-control-attribution {
          background: rgba(0,0,0,0.8) !important;
          color: #555 !important;
          font-size: 8px !important;
          border-radius: 3px !important;
        }
        .origins-map .leaflet-control-attribution a { color: #888 !important; }
        .origins-map .leaflet-control-zoom a {
          background: #1a1a1a !important;
          color: #fff !important;
          border-color: ${teamColor}66 !important;
          font-weight: 900 !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          font-size: 18px !important;
          transition: all 0.2s !important;
        }
        .origins-map .leaflet-control-zoom a:hover {
          background: ${teamColor} !important;
          box-shadow: 0 0 15px ${teamColor} !important;
        }
        .origins-map .leaflet-popup-content-wrapper {
          background: #0a0a0f !important;
          color: #fff !important;
          border-radius: 10px !important;
          border: 1.5px solid ${teamColor} !important;
          box-shadow: 0 0 40px ${teamColor}88, 0 10px 30px rgba(0,0,0,0.9) !important;
        }
        .origins-map .leaflet-popup-content {
          margin: 12px 16px !important;
          font-family: var(--font-heading) !important;
        }
        .origins-map .leaflet-popup-tip {
          background: #0a0a0f !important;
          border: 1.5px solid ${teamColor} !important;
        }

        .origin-pin {
          background: transparent !important;
          border: none !important;
        }
        .origin-pin-inner {
          position: relative;
          width: 56px;
          height: 56px;
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center bottom;
        }
        .origin-pin-inner:hover {
          transform: scale(1.15) translateY(-4px);
        }
        .origin-pin-inner.selected {
          transform: scale(1.25) translateY(-6px);
        }

        @keyframes originsHaloPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50%      { transform: translate(-50%, -50%) scale(1.25); opacity: 1; }
        }
        @keyframes originsScanLine {
          0%   { top: -100px; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes originsBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        @keyframes originsCardIn {
          0%   { opacity: 0; transform: translateX(-30px) scale(0.9); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes originsTimelineIn {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes originsDash {
          0%   { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>

      <div
        className="origins-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* ============ SÉLECTEUR PILOTES ============ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxHeight: 620,
          overflowY: 'auto',
          paddingRight: 4,
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 9, letterSpacing: '0.35em',
            color: teamColor, fontWeight: 700,
            padding: '4px 0',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 5, height: 5,
              background: teamColor,
              transform: 'rotate(45deg)',
              boxShadow: `0 0 8px ${teamColor}`,
            }} />
            ◆ PILOTES · {locatedDrivers.length}
          </div>

          {locatedDrivers.map((d, i) => {
            const isSelected = selectedDriver?.id === d.id;
            const photo = d.actionPhotoUrl || d.transitionPhotoUrl;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr auto',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: isSelected
                    ? `linear-gradient(135deg, ${teamColor}33 0%, ${teamColor}11 100%)`
                    : 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
                  border: `1.5px solid ${isSelected ? teamColor : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isSelected
                    ? `0 10px 30px -10px ${teamColor}, 0 0 30px ${teamColor}44, inset 0 0 25px ${teamColor}11`
                    : '0 4px 12px rgba(0,0,0,0.4)',
                  transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                  animation: `originsCardIn 0.45s cubic-bezier(0.4,0,0.2,1) ${i * 0.06}s both`,
                  transform: isSelected ? 'translateX(6px)' : 'translateX(0)',
                  clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
                }}
                onMouseEnter={e => {
                  if (isSelected) return;
                  e.currentTarget.style.borderColor = `${teamColor}66`;
                  e.currentTarget.style.transform = 'translateX(3px)';
                }}
                onMouseLeave={e => {
                  if (isSelected) return;
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* ✅ Photo pilote — VISAGE 2% */}
                <div style={{
                  position: 'relative',
                  width: 64, height: 64,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `2px solid ${isSelected ? teamColor : `${teamColor}66`}`,
                  background: '#0a0a0a',
                  flexShrink: 0,
                  boxShadow: isSelected ? `0 0 20px ${teamColor}88` : 'none',
                  transition: 'box-shadow 0.35s',
                }}>
                  {photo ? (
                    <img
                      src={imgSrc(photo)}
                      alt=""
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        /* ✅ VISAGE : 2% du haut */
                        objectPosition: 'center 2%',
                        filter: 'contrast(1.08) saturate(1.12)',
                      }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: 20, fontWeight: 900,
                      color: teamColor,
                    }}>
                      {d.firstName?.[0]}{d.lastName?.[0]}
                    </div>
                  )}

                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(180deg, transparent 60%, ${teamColor}44 100%)`,
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>

                {/* Nom + ville */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: isSelected ? teamColor : 'var(--text-dim)',
                    marginBottom: 3,
                    transition: 'color 0.3s',
                  }}>
                    {d.firstName}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 17, fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    color: '#fff',
                    lineHeight: 1,
                    marginBottom: 5,
                    textShadow: isSelected ? `0 0 15px ${teamColor}88` : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {d.lastName}
                  </div>
                  {d.birthCity && (
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      📍 {d.birthCity}
                    </div>
                  )}
                </div>

                {/* Numéro */}
                {d.number != null && (
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22, fontWeight: 900,
                    fontStyle: 'italic',
                    color: isSelected ? teamColor : 'rgba(255,255,255,0.25)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    textShadow: isSelected ? `0 0 15px ${teamColor}` : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {d.number}
                  </div>
                )}

                {isSelected && (
                  <span style={{
                    position: 'absolute',
                    left: -1, top: 12, bottom: 12,
                    width: 3,
                    background: teamColor,
                    boxShadow: `0 0 12px ${teamColor}`,
                    borderRadius: 2,
                  }} />
                )}
              </button>
            );
          })}

          {unlocatedDrivers.length > 0 && (
            <div style={{
              marginTop: 8,
              padding: '10px 12px',
              background: 'rgba(255,135,0,0.06)',
              border: '1px solid rgba(255,135,0,0.25)',
              borderRadius: 8,
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              color: '#ff8700',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>⚠️</span>
              <span>{unlocatedDrivers.length} pilote{unlocatedDrivers.length > 1 ? 's' : ''} sans coordonnées</span>
            </div>
          )}
        </div>

        {/* ============ CARTE ============ */}
        <div className="origins-map" style={{
          position: 'relative',
          height: 620,
          borderRadius: 14,
          overflow: 'hidden',
          border: `2px solid ${teamColor}88`,
          boxShadow: `0 40px 80px -30px ${teamColor}88, 0 0 80px ${teamColor}22, inset 0 0 0 1px rgba(255,255,255,0.04)`,
          background: '#05070a',
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 3,
            background: `repeating-linear-gradient(
              90deg,
              ${teamColor}00 0px, ${teamColor}00 8px,
              ${teamColor} 8px, ${teamColor} 20px
            )`,
            animation: 'originsDash 1.2s linear infinite',
            zIndex: 500,
            opacity: 0.9,
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'absolute', inset: 0,
            pointerEvents: 'none', zIndex: 400,
            backgroundImage: `
              linear-gradient(${teamColor}08 1px, transparent 1px),
              linear-gradient(90deg, ${teamColor}08 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
          }} />

          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            height: 100,
            background: `linear-gradient(180deg, transparent 0%, ${teamColor}44 50%, transparent 100%)`,
            animation: 'originsScanLine 6s linear infinite',
            pointerEvents: 'none',
            zIndex: 450,
            mixBlendMode: 'screen',
          }} />

          <div style={{
            position: 'absolute', inset: 0,
            pointerEvents: 'none', zIndex: 420,
            background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
          }} />

          <MapContainer
            center={center}
            zoom={6}
            scrollWheelZoom={true}
            className="origins-map-inner"
            style={{ width: '100%', height: '100%' }}
            whenCreated={map => { mapInstanceRef.current = map; }}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
              maxZoom={19}
            />

            {locatedDrivers.map(d => {
              const isSelected = selectedDriver?.id === d.id;
              const photo = d.actionPhotoUrl || d.transitionPhotoUrl;
              const photoUrl = photo ? imgSrc(photo) : '';
              const initials = `${d.firstName?.[0] || ''}${d.lastName?.[0] || ''}`;

              const icon = L.divIcon({
                className: 'origin-pin',
                html: `
                  <div class="origin-pin-inner ${isSelected ? 'selected' : ''}">
                    <div style="
                      position: absolute;
                      inset: -14px;
                      border-radius: 50%;
                      background: radial-gradient(circle, ${teamColor}66 0%, ${teamColor}22 40%, transparent 70%);
                      animation: originsHaloPulse 2.4s ease-in-out infinite;
                      pointer-events: none;
                    "></div>
                    <svg width="56" height="56" viewBox="0 0 56 56" style="
                      position: relative;
                      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.9)) drop-shadow(0 0 14px ${teamColor}cc);
                    ">
                      <defs>
                        <clipPath id="origins-clip-${d.id}">
                          <circle cx="28" cy="28" r="22" />
                        </clipPath>
                      </defs>
                      <circle cx="28" cy="28" r="26" fill="rgba(0,0,0,0.85)" stroke="${teamColor}" stroke-width="${isSelected ? 3 : 2}" />
                      <circle cx="28" cy="28" r="22" fill="#0a0a0a" />
                      ${photoUrl ? `
                        <image href="${photoUrl}"
                          x="6" y="6" width="44" height="44"
                          preserveAspectRatio="xMidYMin slice"
                          clip-path="url(#origins-clip-${d.id})"
                          style="filter: contrast(1.1) saturate(1.15);" />
                      ` : `
                        <text x="28" y="28" text-anchor="middle" dominant-baseline="central"
                          fill="${teamColor}" font-family="Orbitron, sans-serif"
                          font-weight="900" font-size="18">${initials}</text>
                      `}
                    </svg>
                    ${d.number != null ? `
                      <div style="
                        position: absolute;
                        bottom: -6px; right: -6px;
                        min-width: 22px; height: 22px;
                        padding: 0 5px;
                        background: #0a0a0a;
                        border: 2px solid ${teamColor};
                        color: #fff;
                        font-family: Orbitron, sans-serif;
                        font-weight: 900;
                        font-size: 10px;
                        border-radius: 11px;
                        display: grid;
                        place-items: center;
                        box-shadow: 0 0 10px ${teamColor}88;
                      ">${d.number}</div>
                    ` : ''}
                  </div>
                `,
                iconSize: [56, 56],
                iconAnchor: [28, 28],
              });

              return (
                <Marker
                  key={d.id}
                  position={[d.latitude, d.longitude]}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedId(d.id),
                  }}
                >
                  <Popup>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 9, letterSpacing: '0.3em',
                        color: teamColor, fontWeight: 700,
                        marginBottom: 8,
                      }}>◆ NAISSANCE</div>
                      <div style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 18, fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#fff',
                        lineHeight: 1, marginBottom: 4,
                      }}>
                        {d.firstName} <span style={{ color: teamColor }}>{d.lastName}</span>
                      </div>
                      {d.birthCity && (
                        <div style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: 12, color: 'rgba(255,255,255,0.75)',
                          marginTop: 6,
                        }}>📍 {d.birthCity}</div>
                      )}
                      {d.birthYear && (
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10, color: 'rgba(255,255,255,0.5)',
                          marginTop: 2, letterSpacing: '0.1em',
                        }}>{d.birthYear}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            <MapAutoFit positions={positions} trigger={locatedDrivers.map(d => d.id).join(',')} />
          </MapContainer>

          {/* HUD top-left */}
          <div style={{
            position: 'absolute',
            top: 18, left: 18,
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: `1.5px solid ${teamColor}`,
            borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 12,
            zIndex: 500,
            boxShadow: `0 0 24px ${teamColor}66, inset 0 0 12px ${teamColor}11`,
            fontFamily: 'var(--font-display)',
            pointerEvents: 'none',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#00d26a', boxShadow: '0 0 10px #00d26a',
              animation: 'originsBlink 1.4s infinite',
            }} />
            <span style={{
              fontSize: 9, letterSpacing: '0.3em',
              color: '#00d26a', fontWeight: 700,
            }}>GPS · LIVE</span>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.2)' }} />
            <span style={{
              fontSize: 10, letterSpacing: '0.2em',
              color: '#fff', fontWeight: 900,
            }}>
              {locatedDrivers.length} PILOTE{locatedDrivers.length > 1 ? 'S' : ''}
            </span>
          </div>

          {/* HUD top-right */}
          <div style={{
            position: 'absolute',
            top: 18, right: 18,
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: `1.5px solid ${teamColor}88`,
            borderRadius: 6,
            zIndex: 500,
            textAlign: 'right',
            fontFamily: 'var(--font-display)',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: 8, letterSpacing: '0.35em',
              color: teamColor, fontWeight: 700,
              marginBottom: 4,
            }}>◆ ÉCURIE</div>
            <div style={{
              fontSize: 13, fontWeight: 900,
              color: '#fff', letterSpacing: '0.12em',
              textShadow: `0 0 12px ${teamColor}88`,
            }}>{teamName?.toUpperCase()}</div>
          </div>

          {/* HUD bottom-left — Selected driver info */}
          {selectedDriver && (
            <div style={{
              position: 'absolute',
              bottom: 18, left: 18,
              padding: '14px 18px',
              background: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1.5px solid ${teamColor}`,
              borderLeft: `4px solid ${teamColor}`,
              borderRadius: 8,
              zIndex: 500,
              maxWidth: 300,
              boxShadow: `0 0 40px ${teamColor}66, 0 10px 30px rgba(0,0,0,0.9)`,
              pointerEvents: 'none',
              animation: 'originsCardIn 0.4s ease',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 8, letterSpacing: '0.35em',
                color: teamColor, fontWeight: 700,
                marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  width: 5, height: 5,
                  background: teamColor,
                  borderRadius: '50%',
                  boxShadow: `0 0 8px ${teamColor}`,
                  animation: 'originsBlink 1.2s infinite',
                }} />
                ◆ LOCALISATION ACTIVE
              </div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20, fontWeight: 900,
                textTransform: 'uppercase',
                color: '#fff',
                lineHeight: 1, marginBottom: 6,
                textShadow: `0 0 15px ${teamColor}88`,
              }}>
                {selectedDriver.lastName}
              </div>
              {selectedDriver.birthCity && (
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.85)',
                  marginBottom: 4,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  📍 {selectedDriver.birthCity}
                </div>
              )}
              <div style={{
                display: 'flex', gap: 14,
                fontFamily: 'var(--font-display)',
                fontSize: 9, letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.5)',
                marginTop: 8,
                paddingTop: 8,
                borderTop: `1px dashed ${teamColor}33`,
              }}>
                {selectedDriver.birthYear && (
                  <span>🎂 {selectedDriver.birthYear}</span>
                )}
                {selectedDriver.nationality && (
                  <span>🌍 {selectedDriver.nationality}</span>
                )}
              </div>
            </div>
          )}

          {/* Crosshair bottom-right */}
          <div style={{
            position: 'absolute',
            bottom: 18, right: 18,
            width: 46, height: 46,
            border: `1.5px solid ${teamColor}88`,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'grid', placeItems: 'center',
            zIndex: 500,
            pointerEvents: 'none',
            boxShadow: `0 0 20px ${teamColor}44`,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="7" stroke={teamColor} strokeWidth="1.5" opacity="0.7" />
              <circle cx="12" cy="12" r="2" fill={teamColor} />
              <line x1="12" y1="0" x2="12" y2="6" stroke={teamColor} strokeWidth="1.5" />
              <line x1="12" y1="18" x2="12" y2="24" stroke={teamColor} strokeWidth="1.5" />
              <line x1="0" y1="12" x2="6" y2="12" stroke={teamColor} strokeWidth="1.5" />
              <line x1="18" y1="12" x2="24" y2="12" stroke={teamColor} strokeWidth="1.5" />
            </svg>
          </div>

          {/* Corner brackets */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            width: 24, height: 24,
            borderTop: `2px solid ${teamColor}`,
            borderLeft: `2px solid ${teamColor}`,
            zIndex: 500, pointerEvents: 'none',
            boxShadow: `-2px -2px 10px ${teamColor}66`,
          }} />
          <div style={{
            position: 'absolute', top: 12, right: 12,
            width: 24, height: 24,
            borderTop: `2px solid ${teamColor}`,
            borderRight: `2px solid ${teamColor}`,
            zIndex: 500, pointerEvents: 'none',
            boxShadow: `2px -2px 10px ${teamColor}66`,
          }} />
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            width: 24, height: 24,
            borderBottom: `2px solid ${teamColor}`,
            borderLeft: `2px solid ${teamColor}`,
            zIndex: 500, pointerEvents: 'none',
            boxShadow: `-2px 2px 10px ${teamColor}66`,
          }} />
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            width: 24, height: 24,
            borderBottom: `2px solid ${teamColor}`,
            borderRight: `2px solid ${teamColor}`,
            zIndex: 500, pointerEvents: 'none',
            boxShadow: `2px 2px 10px ${teamColor}66`,
          }} />
        </div>
      </div>

      {/* ============ TIMELINE ============ */}
      {locatedDrivers.some(d => d.birthYear) && (
        <div style={{
          marginTop: 24,
          padding: '24px 28px',
          background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
          border: `1.5px solid ${teamColor}33`,
          borderRadius: 12,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${teamColor}, transparent)`,
            boxShadow: `0 0 15px ${teamColor}`,
          }} />

          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20, flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10, letterSpacing: '0.35em',
              color: teamColor, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{
                width: 6, height: 6,
                background: teamColor,
                transform: 'rotate(45deg)',
                boxShadow: `0 0 10px ${teamColor}`,
              }} />
              ◆ TIMELINE · GÉNÉRATIONS
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12, color: 'var(--text-dim)',
              letterSpacing: '0.05em',
            }}>
              Année de naissance des pilotes
            </div>
          </div>

          <div style={{
            position: 'relative',
            height: 130,
            padding: '0 10px',
          }}>
            <div style={{
              position: 'absolute',
              left: 20, right: 20, top: '50%',
              height: 2,
              background: `linear-gradient(90deg, transparent, ${teamColor}66, ${teamColor}66, transparent)`,
              boxShadow: `0 0 10px ${teamColor}44`,
            }} />

            <div style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              height: '100%',
            }}>
              {locatedDrivers
                .filter(d => d.birthYear)
                .sort((a, b) => a.birthYear - b.birthYear)
                .map((d, i) => {
                  const isSelected = selectedDriver?.id === d.id;
                  const isAbove = i % 2 === 0;
                  const photo = d.actionPhotoUrl || d.transitionPhotoUrl;

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        animation: `originsTimelineIn 0.5s ease ${i * 0.08}s both`,
                        zIndex: isSelected ? 10 : 1,
                      }}
                    >
                      {/* Point sur la ligne */}
                      <div style={{
                        position: 'relative',
                        width: 26, height: 26,
                        borderRadius: '50%',
                        background: isSelected ? teamColor : '#0a0a0a',
                        border: `2px solid ${teamColor}`,
                        boxShadow: isSelected
                          ? `0 0 20px ${teamColor}, 0 0 40px ${teamColor}88`
                          : `0 0 10px ${teamColor}44`,
                        display: 'grid',
                        placeItems: 'center',
                        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                        zIndex: 5,
                      }}>
                        <div style={{
                          width: 8, height: 8,
                          borderRadius: '50%',
                          background: isSelected ? '#fff' : teamColor,
                          boxShadow: `0 0 8px ${teamColor}`,
                        }} />
                      </div>

                      {/* Contenu au-dessus ou en dessous */}
                      <div style={{
                        position: 'absolute',
                        top: isAbove ? 'auto' : 34,
                        bottom: isAbove ? 34 : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        {/* Avatar — VISAGE 2% */}
                        <div style={{
                          width: 34, height: 34,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: `2px solid ${isSelected ? teamColor : 'rgba(255,255,255,0.2)'}`,
                          background: '#0a0a0a',
                          boxShadow: isSelected ? `0 0 15px ${teamColor}88` : 'none',
                          transition: 'all 0.3s',
                        }}>
                          {photo ? (
                            <img
                              src={imgSrc(photo)}
                              alt=""
                              style={{
                                width: '100%', height: '100%',
                                objectFit: 'cover',
                                /* ✅ VISAGE : 2% */
                                objectPosition: 'center 2%',
                              }}
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              display: 'grid', placeItems: 'center',
                              fontSize: 10, fontWeight: 900,
                              color: teamColor,
                              fontFamily: 'var(--font-display)',
                            }}>
                              {d.firstName?.[0]}{d.lastName?.[0]}
                            </div>
                          )}
                        </div>

                        {/* Année */}
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 12, fontWeight: 900,
                          color: isSelected ? teamColor : 'rgba(255,255,255,0.65)',
                          letterSpacing: '0.05em',
                          textShadow: isSelected ? `0 0 15px ${teamColor}` : 'none',
                          transition: 'all 0.3s',
                          whiteSpace: 'nowrap',
                        }}>
                          {d.birthYear}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================ */
/* ==================== RADAR CHART ============================ */
/* ============================================================ */

function TeamRadarChart({ team, teamColor, sectionVisible, size = 520 }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const [progress, setProgress] = useState(0);

  const AXES = [
    { key: 'gpEntered',          label: 'GP',       max: 1200 },
    { key: 'teamPoints',         label: 'POINTS',   max: 12000 },
    { key: 'podiums',            label: 'PODIUMS',  max: 900  },
    { key: 'polePositions',      label: 'POLES',    max: 250  },
    { key: 'worldChampionships', label: 'TITRES',   max: 20   },
  ];
  const n = AXES.length;

  useEffect(() => {
    if (!sectionVisible) return;
    let raf;
    const t0 = performance.now();
    const dur = 1400;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sectionVisible]);

  const values = AXES.map(a => {
    const raw = Number(team[a.key]) || 0;
    const ratio = a.max > 0 ? raw / a.max : 0;
    return { ...a, raw, normalized: Math.max(0.05, Math.min(ratio, 1)) * progress };
  });

  const angleAt = i => (Math.PI * 2 * i) / n - Math.PI / 2;

  const dataPoints = values.map((v, i) => {
    const a = angleAt(i);
    const r = radius * v.normalized;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  const levels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {levels.map((lvl, i) => (
        <polygon
          key={i}
          points={values.map((_, idx) => {
            const a = angleAt(idx);
            const r = radius * lvl;
            return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      {values.map((_, i) => {
        const a = angleAt(i);
        const x = cx + Math.cos(a) * radius;
        const y = cy + Math.sin(a) * radius;
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
      })}

      <polygon
        points={dataPolygon}
        fill={teamColor}
        fillOpacity="0.35"
        stroke={teamColor}
        strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 20px ${teamColor}88)` }}
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={teamColor} stroke="#fff" strokeWidth="1.5" />
      ))}

      {values.map((v, i) => {
        const a = angleAt(i);
        const labelR = radius + 52;
        const x = cx + Math.cos(a) * labelR;
        const y = cy + Math.sin(a) * labelR;
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle'
                     : Math.cos(a) > 0 ? 'start' : 'end';
        return (
          <g key={i}>
            <text
              x={x} y={y - 8}
              textAnchor={anchor}
              fill="#fff"
              fontSize="11"
              fontFamily="Orbitron, sans-serif"
              fontWeight="700"
              letterSpacing="0.2em"
            >
              {v.label}
            </text>
            <text
              x={x} y={y + 10}
              textAnchor={anchor}
              fill={teamColor}
              fontSize="15"
              fontFamily="Orbitron, sans-serif"
              fontWeight="900"
            >
              {v.raw}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="3" fill={teamColor} />
    </svg>
  );
}

/* ============================================================ */
/* ================== DRIVERS COMPARISON ====================== */
/* ============================================================ */

function DriversComparison({ drivers, teamColor, sectionVisible }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!sectionVisible) return;
    let raf;
    const t0 = performance.now();
    const dur = 1800;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sectionVisible]);

  if (!drivers || drivers.length < 2) return null;

  const [dA, dB] = drivers.slice(0, 2);

  const METRICS = [
    { key: 'careerPoints',       label: 'Points carrière', format: v => v ?? 0 },
    { key: 'podiums',            label: 'Podiums',         format: v => v ?? 0 },
    { key: 'polePositions',      label: 'Pole positions',  format: v => v ?? 0 },
    { key: 'worldChampionships', label: 'Championnats',    format: v => v ?? 0 },
    { key: 'gpEntered',          label: 'GP disputés',     format: v => v ?? 0 },
    { key: 'dnfs',               label: 'Abandons (DNF)',  format: v => v ?? 0 },
  ];

  const getInitials = d => `${d.firstName?.[0] || ''}${d.lastName?.[0] || ''}`;
  const getDriverPhoto = d => d.actionPhotoUrl || d.transitionPhotoUrl;

  const numberStyle = {
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    fontWeight: 900,
    color: '#ffffff',
    textShadow: '0 0 8px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)',
    letterSpacing: '0.05em',
    opacity: progress > 0.3 ? 1 : 0,
    transition: 'opacity 0.3s',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
      border: `1px solid ${teamColor}33`,
      borderRadius: 8,
      padding: '40px 36px',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(${teamColor}08 1px, transparent 1px),
          linear-gradient(90deg, ${teamColor}08 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 4,
        background: `linear-gradient(90deg, transparent 0%, ${teamColor} 30%, ${teamColor} 70%, transparent 100%)`,
        boxShadow: `0 0 20px ${teamColor}`,
      }} />

      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 20,
        marginBottom: 48,
        zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              letterSpacing: '0.3em',
              color: 'var(--text-dim)',
              marginBottom: 4,
              fontWeight: 700,
            }}>
              PILOTE 1
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 20,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#fff',
              lineHeight: 1,
              textShadow: `0 0 20px ${teamColor}66`,
            }}>
              {dA.lastName}
            </div>
          </div>
          {getDriverPhoto(dA) ? (
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid ${teamColor}`,
              boxShadow: `0 0 20px ${teamColor}88`,
              background: '#0a0a0a',
              flexShrink: 0,
            }}>
              <img
                src={imgSrc(getDriverPhoto(dA))}
                alt={dA.lastName}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  /* ✅ VISAGE : 2% */
                  objectPosition: 'center 2%',
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: `${teamColor}22`,
              border: `2px solid ${teamColor}`,
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 900,
              color: teamColor,
              flexShrink: 0,
            }}>
              {getInitials(dA)}
            </div>
          )}
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 900,
          fontStyle: 'italic',
          color: teamColor,
          letterSpacing: '0.1em',
          textShadow: `0 0 20px ${teamColor}, 0 0 40px ${teamColor}88`,
          padding: '8px 20px',
          border: `2px solid ${teamColor}`,
          borderRadius: 999,
          background: `${teamColor}11`,
          boxShadow: `0 0 30px ${teamColor}44, inset 0 0 20px ${teamColor}22`,
        }}>
          VS
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {getDriverPhoto(dB) ? (
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid ${teamColor}`,
              boxShadow: `0 0 20px ${teamColor}88`,
              background: '#0a0a0a',
              flexShrink: 0,
            }}>
              <img
                src={imgSrc(getDriverPhoto(dB))}
                alt={dB.lastName}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  /* ✅ VISAGE : 2% */
                  objectPosition: 'center 2%',
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: `${teamColor}22`,
              border: `2px solid ${teamColor}`,
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 900,
              color: teamColor,
              flexShrink: 0,
            }}>
              {getInitials(dB)}
            </div>
          )}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              letterSpacing: '0.3em',
              color: 'var(--text-dim)',
              marginBottom: 4,
              fontWeight: 700,
            }}>
              PILOTE 2
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 20,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#fff',
              lineHeight: 1,
              textShadow: `0 0 20px ${teamColor}66`,
            }}>
              {dB.lastName}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 2 }}>
        {METRICS.map((metric) => {
          const rawA = Number(dA[metric.key]) || 0;
          const rawB = Number(dB[metric.key]) || 0;
          const max = Math.max(rawA, rawB, 1);
          const pctA = (rawA / max) * 100 * progress;
          const pctB = (rawB / max) * 100 * progress;

          return (
            <div key={metric.key}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 12,
              }}>
                <div style={{
                  width: 40, height: 1,
                  background: `linear-gradient(90deg, transparent, ${teamColor}66)`,
                }} />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                }}>
                  {metric.label}
                </span>
                <div style={{
                  width: 40, height: 1,
                  background: `linear-gradient(90deg, ${teamColor}66, transparent)`,
                }} />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 60px 1fr',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: 32,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    direction: 'rtl',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0, right: 0, bottom: 0,
                      width: `${pctA}%`,
                      background: `linear-gradient(90deg, ${teamColor}cc, ${teamColor})`,
                      borderRadius: 4,
                      boxShadow: `0 0 12px ${teamColor}88`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      paddingLeft: 10,
                      transition: 'width 0.1s linear',
                    }}>
                      {pctA > 18 && (
                        <span style={numberStyle}>
                          {metric.format(rawA)}
                        </span>
                      )}
                    </div>

                    {pctA <= 18 && (
                      <span style={{
                        ...numberStyle,
                        position: 'absolute',
                        top: '50%',
                        right: 8,
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                      }}>
                        {metric.format(rawA)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  height: 32,
                  display: 'grid',
                  placeItems: 'center',
                  borderLeft: `1px solid ${teamColor}33`,
                  borderRight: `1px solid ${teamColor}33`,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    fontWeight: 900,
                    color: teamColor,
                    letterSpacing: '0.1em',
                  }}>
                    ■
                  </span>
                </div>

                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: 32,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, bottom: 0,
                      width: `${pctB}%`,
                      background: `linear-gradient(90deg, ${teamColor}, ${teamColor}cc)`,
                      borderRadius: 4,
                      boxShadow: `0 0 12px ${teamColor}88`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 10,
                      transition: 'width 0.1s linear',
                    }}>
                      {pctB > 18 && (
                        <span style={numberStyle}>
                          {metric.format(rawB)}
                        </span>
                      )}
                    </div>

                    {pctB <= 18 && (
                      <span style={{
                        ...numberStyle,
                        position: 'absolute',
                        top: '50%',
                        left: 8,
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                      }}>
                        {metric.format(rawB)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============== HOLOGRAPHIC DRIVER CARD ===================== */
/* ============================================================ */

function HoloDriverCard({ driver, teamColor, index, sectionVisible }) {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  /* ✅ ACTION prioritaire */
  const driverPhoto = driver.actionPhotoUrl || driver.transitionPhotoUrl;

  useEffect(() => {
    if (!sectionVisible) return;
    const t1 = setTimeout(() => setScanning(true), 300 + index * 250);
    const t2 = setTimeout(() => { setScanning(false); setScanDone(true); }, 1600 + index * 250);
    const t3 = setTimeout(() => setGlitch(true), 1600 + index * 250);
    const t4 = setTimeout(() => setGlitch(false), 2100 + index * 250);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [sectionVisible, index]);

  const onMove = useCallback(e => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setShine({ x: px * 100, y: py * 100 });
    setTilt({ rx: -(py - 0.5) * 6, ry: (px - 0.5) * 6 });
  }, []);

  const onLeave = useCallback(() => {
    setHovered(false);
    setTilt({ rx: 0, ry: 0 });
  }, []);

  return (
    <Link
      to={`/drivers/${driver.id}`}
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        position: 'relative',
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        background: 'linear-gradient(160deg, #0a0e15 0%, #05070a 100%)',
        border: `1px solid ${hovered ? teamColor : `${teamColor}44`}`,
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'border-color 0.4s, transform 0.4s, box-shadow 0.4s',
        transform: hovered
          ? `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-4px)`
          : 'perspective(1200px) translateY(0)',
        transformStyle: 'preserve-3d',
        boxShadow: hovered
          ? `0 30px 60px -20px ${teamColor}88, 0 0 40px ${teamColor}33, inset 0 0 40px ${teamColor}11`
          : `0 10px 30px rgba(0,0,0,0.4)`,
        opacity: sectionVisible ? 1 : 0,
        animation: sectionVisible
          ? `holoAppear 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s both`
          : 'none',
        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
        cursor: 'pointer',
      }}
    >
      {scanning && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${teamColor} 50%, transparent 100%)`,
          boxShadow: `0 0 20px ${teamColor}, 0 0 40px ${teamColor}88`,
          animation: 'scanTopBottom 1.6s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 20,
          pointerEvents: 'none',
        }} />
      )}

      {hovered && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 60,
          background: `linear-gradient(180deg, transparent 0%, ${teamColor}22 50%, transparent 100%)`,
          animation: 'scanTopBottomLoop 2.5s linear infinite',
          zIndex: 15,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }} />
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(${teamColor}0a 1px, transparent 1px),
          linear-gradient(90deg, ${teamColor}0a 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        opacity: hovered ? 0.6 : 0.3,
        transition: 'opacity 0.5s',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(135deg,
          ${teamColor}00 0%,
          ${teamColor}1a 25%,
          #00ffff1a 45%,
          ${teamColor}1a 65%,
          #ff00ff1a 85%,
          ${teamColor}00 100%)`,
        opacity: hovered ? 0.55 : 0.25,
        transition: 'opacity 0.6s',
        mixBlendMode: 'screen',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      <div style={{
        position: 'absolute', top: 12, left: 12,
        width: hovered ? 40 : 24,
        height: hovered ? 40 : 24,
        borderTop: `2px solid ${teamColor}`,
        borderLeft: `2px solid ${teamColor}`,
        boxShadow: `-2px -2px 12px ${teamColor}66`,
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 10,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: hovered ? 40 : 24,
        height: hovered ? 40 : 24,
        borderTop: `2px solid ${teamColor}`,
        borderRight: `2px solid ${teamColor}`,
        boxShadow: `2px -2px 12px ${teamColor}66`,
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 10,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        width: hovered ? 40 : 24,
        height: hovered ? 40 : 24,
        borderBottom: `2px solid ${teamColor}`,
        borderLeft: `2px solid ${teamColor}`,
        boxShadow: `-2px 2px 12px ${teamColor}66`,
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 10,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        width: hovered ? 40 : 24,
        height: hovered ? 40 : 24,
        borderBottom: `2px solid ${teamColor}`,
        borderRight: `2px solid ${teamColor}`,
        boxShadow: `2px 2px 12px ${teamColor}66`,
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 10,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px 12px',
        borderBottom: `1px solid ${teamColor}33`,
        background: `linear-gradient(90deg, ${teamColor}11 0%, transparent 100%)`,
        zIndex: 3,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: teamColor,
            boxShadow: `0 0 10px ${teamColor}`,
            animation: 'holoBlink 1.2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 9,
            letterSpacing: '0.3em',
            fontWeight: 700,
            color: teamColor,
            textShadow: `0 0 8px ${teamColor}`,
          }}>
            ◆ F1 · ID SCAN
          </span>
        </div>

        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9,
          letterSpacing: '0.25em',
          color: 'var(--text-dim)',
          fontWeight: 700,
        }}>
          #{String(index + 1).padStart(3, '0')}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        minHeight: 300,
        position: 'relative',
        zIndex: 3,
      }}>
        <div style={{
          position: 'relative',
          borderRight: `1px solid ${teamColor}22`,
          background: `linear-gradient(180deg, ${teamColor}11 0%, transparent 100%)`,
          overflow: 'hidden',
          minHeight: 300,
        }}>
          {/* ✅ PHOTO — VISAGE VISIBLE (2% du haut) */}
          {driverPhoto ? (
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
            }}>
              <img
                src={imgSrc(driverPhoto)}
                alt={`${driver.firstName} ${driver.lastName}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  /* ✅ VISAGE : 2% du haut */
                  objectPosition: 'center 2%',
                  filter: hovered
                    ? `drop-shadow(0 0 30px ${teamColor}) contrast(1.15) saturate(1.2)`
                    : `drop-shadow(0 0 20px ${teamColor}88) contrast(1.05)`,
                  transform: hovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.6s, filter 0.4s',
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 72,
              fontWeight: 900,
              color: teamColor,
              opacity: 0.3,
            }}>
              {driver.firstName?.[0]}{driver.lastName?.[0]}
            </div>
          )}

          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)`,
            opacity: 0.4,
            pointerEvents: 'none',
            zIndex: 2,
          }} />

          <div style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            fontWeight: 900,
            fontStyle: 'italic',
            color: teamColor,
            lineHeight: 1,
            textShadow: `0 0 20px ${teamColor}, 0 0 40px ${teamColor}88`,
            zIndex: 4,
          }}>
            {driver.number || '—'}
          </div>
        </div>

        <div style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0, right: 8,
            width: 1,
            background: `linear-gradient(180deg, transparent, ${teamColor}66, transparent)`,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: 0, right: 0,
              height: '50%',
              background: `linear-gradient(180deg, transparent, ${teamColor}, transparent)`,
              animation: 'dataStream 2s linear infinite',
            }} />
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9,
              letterSpacing: '0.3em',
              color: 'var(--text-dim)',
              marginBottom: 8,
              fontWeight: 700,
            }}>
              ◆ FIRST NAME
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 20,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-mid)',
              marginBottom: 20,
            }}>
              {driver.firstName}
            </div>

            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9,
              letterSpacing: '0.3em',
              color: 'var(--text-dim)',
              marginBottom: 8,
              fontWeight: 700,
            }}>
              ◆ LAST NAME
            </div>
            <div
              className={glitch ? 'holo-glitch' : ''}
              data-text={driver.lastName}
              style={{
                position: 'relative',
                fontFamily: 'var(--font-heading)',
                fontSize: 42,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                lineHeight: 0.95,
                color: '#fff',
                marginBottom: 6,
                textShadow: `0 0 20px ${teamColor}88, 0 0 40px ${teamColor}44`,
              }}
            >
              {driver.lastName}
            </div>

            <div style={{
              display: 'flex',
              gap: 4,
              marginBottom: 20,
            }}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 3,
                    background: scanDone
                      ? (i < 6 ? teamColor : `${teamColor}33`)
                      : `${teamColor}22`,
                    boxShadow: scanDone && i < 6 ? `0 0 6px ${teamColor}` : 'none',
                    transition: `background 0.3s ${i * 0.05}s, box-shadow 0.3s ${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 8,
                  letterSpacing: '0.25em',
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                  marginBottom: 4,
                }}>
                  NATIONALITY
                </div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--f1-white)',
                }}>
                  {driver.nationality || '—'}
                </div>
              </div>

              {driver.debutYear && (
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 8,
                    letterSpacing: '0.25em',
                    color: 'var(--text-dim)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}>
                    F1 SINCE
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: teamColor,
                    textShadow: `0 0 8px ${teamColor}66`,
                  }}>
                    {driver.debutYear}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: `1px solid ${teamColor}22`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                height: 24,
              }}>
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i % 3 === 0 ? 2 : 1,
                      height: 10 + (i % 5) * 3,
                      background: '#fff',
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>

              {driver.countryCode && (
                <img
                  src={flagSrc(driver.countryCode)}
                  alt={driver.countryCode}
                  style={{
                    height: 18,
                    width: 'auto',
                    borderRadius: 2,
                    boxShadow: `0 0 8px ${teamColor}66`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, ${teamColor}33 0%, transparent 40%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
        zIndex: 4,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        opacity: hovered ? 0.06 : 0.02,
        transition: 'opacity 0.5s',
        pointerEvents: 'none',
        zIndex: 5,
        mixBlendMode: 'overlay',
      }} />

      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '0.25em',
        fontWeight: 700,
        color: teamColor,
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateX(0)' : 'translateX(10px)',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        textShadow: `0 0 12px ${teamColor}`,
        zIndex: 8,
        pointerEvents: 'none',
      }}>
        OPEN →
      </div>
    </Link>
  );
}

/* ============================================================ */
/* ==================== MAIN COMPONENT ========================= */
/* ============================================================ */

export default function TeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const [driversVisible, setDriversVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [comparisonVisible, setComparisonVisible] = useState(false);
  const [sector, setSector] = useState(0);
  const [heroHovered, setHeroHovered] = useState(false);
  const statsRef = useRef(null);
  const driversSectionRef = useRef(null);
  const mapSectionRef = useRef(null);
  const comparisonRef = useRef(null);

  const parallax = useMouseParallax(14);

  const { setCursorColor, resetCursorColor } = useCursor();
  const teamColor = team?.color || null;

  useEffect(() => {
    if (teamColor) setCursorColor(teamColor);
    return () => resetCursorColor();
  }, [teamColor, setCursorColor, resetCursorColor]);

  useEffect(() => {
    Promise.all([
      api.get(`/teams/${id}`),
      api.get('/drivers'),
    ])
      .then(([t, d]) => {
        setTeam(t.data);
        setDrivers(d.data.filter(dr => String(dr.teamId) === String(id)));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, [team]);

  useEffect(() => {
    if (!driversSectionRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setDriversVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(driversSectionRef.current);
    return () => obs.disconnect();
  }, [team]);

  useEffect(() => {
    if (!mapSectionRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setMapVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(mapSectionRef.current);
    return () => obs.disconnect();
  }, [team]);

  useEffect(() => {
    if (!comparisonRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setComparisonVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(comparisonRef.current);
    return () => obs.disconnect();
  }, [team]);

  useEffect(() => {
    if (!heroHovered) { setSector(0); return; }
    const timers = [
      setTimeout(() => setSector(1), 150),
      setTimeout(() => setSector(2), 350),
      setTimeout(() => setSector(3), 550),
    ];
    return () => timers.forEach(clearTimeout);
  }, [heroHovered]);

  if (loading) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <div className="mono" style={{ color: 'var(--f1-red)', letterSpacing: '0.3em' }}>CHARGEMENT...</div>
    </div>
  );

  if (!team) return (
    <div className="container" style={{ padding: 100, textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-dim)' }}>Écurie introuvable</h2>
      <Link to="/teams" style={{ color: 'var(--f1-red)' }}>← Retour aux écuries</Link>
    </div>
  );

  const color = team.color || '#e10600';
  const carImage = findCarImage(team.name);

  const profileItems = [
    { label: 'Nom complet',       value: team.fullName },
    { label: 'Team Chief',        value: team.teamChief },
    { label: 'Technical Chief',   value: team.technicalChief },
    { label: 'Châssis',           value: team.chassis },
    { label: 'Moteur',            value: team.powerUnit },
    { label: 'Pilote réserviste', value: team.reserveDriver },
    { label: 'Première entrée',   value: team.firstEntry },
  ].filter(i => i.value);

  const summaryStats = [
    { label: 'GP disputés',        value: team.gpEntered,          icon: '🏁' },
    { label: 'Points équipe',      value: team.teamPoints,         icon: '⭐' },
    { label: 'Meilleure position', value: team.highestFinish,      icon: '🥇' },
    { label: 'Podiums',            value: team.podiums,            icon: '🏆' },
    { label: 'Meilleure grille',   value: team.highestGrid,        icon: '📊' },
    { label: 'Pole positions',     value: team.polePositions,      icon: '🎯' },
    { label: 'Championnats',       value: team.worldChampionships, icon: '👑' },
  ];

  return (
    <div style={{ position: 'relative' }}>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes emberRise {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.9; }
          100% { transform: translateY(-820px) translateX(30px) scale(0.4); opacity: 0; }
        }
        @keyframes slowRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes heroGridShift {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes carShine {
          0%   { transform: translateX(-100%) skewX(-20deg); opacity: 0; }
          40%  { opacity: 0.5; }
          100% { transform: translateX(300%) skewX(-20deg); opacity: 0; }
        }
        @keyframes holoAppear {
          0%   { opacity: 0; transform: translateY(30px) scale(0.96); filter: blur(8px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes scanTopBottom {
          from { top: 0%; }
          to   { top: 100%; }
        }
        @keyframes scanTopBottomLoop {
          0%   { top: -60px; }
          100% { top: 100%; }
        }
        @keyframes dataStream {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes holoBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        @keyframes holoGlitch {
          0%, 100% {
            transform: translate(0, 0);
            text-shadow: 0 0 20px #fff, 0 0 40px #fff;
            clip-path: inset(0 0 0 0);
          }
          10% {
            transform: translate(-3px, 2px);
            text-shadow: -3px 0 #ff0044, 3px 0 #00ffff;
            clip-path: inset(20% 0 40% 0);
          }
          20% {
            transform: translate(0, 0);
            text-shadow: 0 0 20px #fff, 0 0 40px #fff;
            clip-path: inset(0 0 0 0);
          }
          30% {
            transform: translate(2px, -1px);
            text-shadow: -2px 0 #00ffff, 2px 0 #ff0044;
            clip-path: inset(60% 0 10% 0);
          }
          40% {
            transform: translate(0, 0);
            text-shadow: 0 0 20px #fff, 0 0 40px #fff;
            clip-path: inset(0 0 0 0);
          }
        }
        .holo-glitch {
          animation: holoGlitch 0.5s ease-in-out;
        }
        .holo-glitch::before,
        .holo-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none;
        }
        .holo-glitch::before {
          color: #ff0044;
          mix-blend-mode: screen;
          animation: holoGlitch 0.5s ease-in-out reverse;
          transform: translate(-3px, 0);
          opacity: 0.7;
        }
        .holo-glitch::after {
          color: #00ffff;
          mix-blend-mode: screen;
          animation: holoGlitch 0.5s ease-in-out;
          transform: translate(3px, 0);
          opacity: 0.7;
        }
      `}</style>

      {/* HERO */}
      <section
        onMouseEnter={() => setHeroHovered(true)}
        onMouseLeave={() => setHeroHovered(false)}
        style={{
          position: 'relative',
          minHeight: 620,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${color}33 0%, #000 70%)`,
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${color}11 1px, transparent 1px), linear-gradient(90deg, ${color}11 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          zIndex: 0, opacity: 0.4,
          animation: 'heroGridShift 12s linear infinite',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 1400, height: 1400,
          transform: 'translate(-50%, -50%)',
          background: `conic-gradient(from 0deg, transparent 0%, ${color}22 25%, transparent 50%, ${color}11 75%, transparent 100%)`,
          filter: 'blur(60px)',
          opacity: 0.4,
          animation: 'slowRotate 40s linear infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.95) 100%)',
          zIndex: 1,
        }} />

        <div style={{ position: 'absolute', inset: 0, opacity: 0.3, zIndex: 2, pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${10 + i * 15}%`,
              left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${i % 2 ? `${color}88` : 'rgba(255,255,255,0.15)'}, transparent)`,
              animation: `speedLine ${3 + i * 0.3}s linear infinite`,
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>

        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(24)].map((_, i) => {
            const size = 2 + Math.random() * 3;
            const left = Math.random() * 100;
            const delay = Math.random() * 8;
            const duration = 7 + Math.random() * 7;
            const useColor = i % 3 === 0;
            return (
              <span key={i} style={{
                position: 'absolute',
                left: `${left}%`, bottom: -20,
                width: size, height: size,
                borderRadius: '50%',
                background: useColor ? color : '#fff',
                boxShadow: `0 0 8px ${useColor ? color : '#fff'}`,
                opacity: 0.7,
                animation: `emberRise ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
              }} />
            );
          })}
        </div>

        <div style={{
          position: 'absolute', top: '20%', left: '20%',
          width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
          filter: 'blur(80px)',
          zIndex: 1, pointerEvents: 'none',
        }} />

        {carImage && (
          <>
            <div style={{
              position: 'absolute', right: '-60px', bottom: '-10px',
              width: '75%', maxWidth: 1100,
              zIndex: 2, pointerEvents: 'none', opacity: 0.92,
              filter: `drop-shadow(0 40px 80px rgba(0,0,0,0.95)) drop-shadow(0 0 120px ${color}66)`,
              transform: `rotate(-3deg) translate(${-parallax.x * 1.5}px, ${-parallax.y * 1.2}px)`,
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <img src={carImage} alt={`${team.name} F1 Car`}
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }} />
              <div style={{
                position: 'absolute',
                top: 0, bottom: 0, left: 0,
                width: '30%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                animation: 'carShine 4s ease-in-out infinite',
                animationDelay: '1s',
                pointerEvents: 'none',
                mixBlendMode: 'overlay',
              }} />
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.5) 70%, rgba(10,10,10,0.98) 100%)',
              zIndex: 2, pointerEvents: 'none',
            }} />
          </>
        )}

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
          boxShadow: `0 0 30px ${color}`,
          zIndex: 4,
        }} />

        <div className="container" style={{
          position: 'relative', zIndex: 3,
          padding: '80px 32px 60px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 60,
          alignItems: 'center',
          minHeight: 620,
        }}>
          {team.logoUrl ? (
            <img
              src={imgSrc(team.logoUrl)}
              alt={team.name}
              style={{
                width: 240, height: 240,
                objectFit: 'contain',
                filter: `drop-shadow(0 0 60px ${color}cc) drop-shadow(0 20px 40px rgba(0,0,0,0.8))`,
                animation: 'float 6s ease-in-out infinite',
              }}
            />
          ) : (
            <div style={{
              width: 240, height: 240,
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 140, fontWeight: 900, color,
              textShadow: `0 0 60px ${color}88`,
            }}>
              {team.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          <div style={{ maxWidth: 620 }}>
            <Link to="/teams" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--text-dim)', fontSize: 13, marginBottom: 16,
              fontFamily: 'var(--font-heading)', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>← Retour aux écuries</Link>

            {team.fullName && (
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 16, fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--text-dim)',
                marginBottom: 8,
              }}>
                {team.fullName}
              </div>
            )}

            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 72, fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
              color: 'var(--f1-white)',
              lineHeight: 0.95,
              marginBottom: 24,
              textShadow: `0 0 40px ${color}66, 0 10px 40px rgba(0,0,0,0.9)`,
            }}>
              {team.name}
            </h1>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {team.countryCode && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  padding: '10px 18px 10px 14px',
                  background: 'rgba(0,0,0,0.6)',
                  border: `1px solid ${color}66`,
                  borderRadius: 6,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700, fontSize: 14,
                  textTransform: 'uppercase',
                  boxShadow: `0 0 20px ${color}33`,
                }}>
                  <img src={flagSrc(team.countryCode)} alt={team.countryCode}
                    style={{ height: 24, width: 'auto', borderRadius: 3 }} />
                  <span>{team.country}</span>
                </span>
              )}

              {team.firstEntry && (
                <span style={{
                  padding: '12px 16px',
                  background: `${color}22`,
                  border: `1px solid ${color}66`,
                  borderRadius: 6,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700, fontSize: 14,
                  textTransform: 'uppercase',
                  boxShadow: `0 0 20px ${color}33`,
                }}>
                  🏁 F1 depuis {team.firstEntry}
                </span>
              )}

              {team.worldChampionships > 0 && (
                <span style={{
                  padding: '12px 16px',
                  background: 'rgba(255,215,0,0.15)',
                  border: '1px solid rgba(255,215,0,0.4)',
                  borderRadius: 6,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700, fontSize: 14,
                  textTransform: 'uppercase',
                  color: '#FFD700',
                  boxShadow: `0 0 20px rgba(255,215,0,0.3)`,
                }}>
                  👑 {team.worldChampionships} titre{team.worldChampionships > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 32, maxWidth: 400 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  flex: 1, height: 4,
                  background: heroHovered && sector > i ? color : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.3s, box-shadow 0.3s',
                  boxShadow: heroHovered && sector > i ? `0 0 10px ${color}` : 'none',
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROFIL TECHNIQUE */}
      {profileItems.length > 0 && (
        <section className="container" style={{ padding: '80px 32px 40px' }}>
          <Reveal direction="up">
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 11,
                  letterSpacing: '0.4em', color, fontWeight: 700,
                }}>TEAM PROFILE</span>
              </div>
              <h2 style={{ fontSize: 48, marginBottom: 12 }}>La fiche technique</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>Identité et informations clés de l'écurie</p>
            </div>
          </Reveal>

          <div className="grid-2">
            {profileItems.map((item, idx) => (
              <Reveal key={item.label} delay={idx * 0.04} direction="up">
                <div
                  className="card"
                  style={{
                    padding: '20px 24px',
                    borderLeft: `3px solid ${color}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'transform 0.35s, box-shadow 0.35s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 20px 40px -20px ${color}88`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 12, fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-dim)',
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 16, fontWeight: 700,
                    color: 'var(--f1-white)',
                    textAlign: 'right',
                  }}>
                    {item.value}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* PILOTES */}
      {drivers.length > 0 && (
        <section
          ref={driversSectionRef}
          className="container"
          style={{ padding: '40px 32px 60px' }}
        >
          <Reveal direction="up">
            <div style={{ marginBottom: 60, textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 11,
                  letterSpacing: '0.4em', color, fontWeight: 700,
                }}>DRIVERS DATABASE</span>
                <div style={{ width: 40, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
              </div>
              <h2 style={{ fontSize: 48, marginBottom: 12 }}>
                Fiches <span style={{ color }}>pilotes</span> — {team.name}
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
                {drivers.length} pilote{drivers.length > 1 ? 's' : ''} · Cliquez pour voir la fiche complète
              </p>
            </div>
          </Reveal>

          <div className="grid-2" style={{ gap: 32 }}>
            {drivers.map((d, idx) => (
              <HoloDriverCard
                key={d.id}
                driver={d}
                teamColor={color}
                index={idx}
                sectionVisible={driversVisible}
              />
            ))}
          </div>
        </section>
      )}

      {/* ORIGINS TRACKER */}
      {drivers.length > 0 && (
        <section
          ref={mapSectionRef}
          className="container"
          style={{ padding: '40px 32px 80px' }}
        >
          <Reveal direction="up">
            <div style={{ marginBottom: 50, textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16,
              }}>
                <div style={{ width: 40, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 11,
                  letterSpacing: '0.45em', color, fontWeight: 700,
                }}>◆ ORIGINS TRACKER</span>
                <div style={{ width: 40, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
              </div>
              <h2 style={{
                fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '-0.03em', lineHeight: 0.95,
                margin: 0, marginBottom: 16,
              }}>
                Sur les traces de{' '}
                <span style={{ color, fontStyle: 'italic', textShadow: `0 0 50px ${color}88` }}>
                  {team.name}
                </span>
              </h2>
              <p style={{
                fontFamily: 'var(--font-heading)', fontSize: 15,
                color: 'var(--text-dim)', maxWidth: 620, margin: '0 auto',
              }}>
                Chaque pilote a une origine. Sélectionne un pilote pour découvrir son lieu de naissance.
              </p>
            </div>
          </Reveal>

          <Reveal direction="scale" delay={0.1}>
            <PilotOriginsTracker
              drivers={drivers}
              teamColor={color}
              teamName={team.name}
            />
          </Reveal>
        </section>
      )}

      {/* STATS */}
      <section className="container" style={{ padding: '40px 32px 40px' }}>
        <Reveal direction="up">
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12,
            }}>
              <div style={{ width: 40, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 11,
                letterSpacing: '0.4em', color, fontWeight: 700,
              }}>PROFIL DE L'ÉCURIE</span>
              <div style={{ width: 40, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
            </div>
            <h2 style={{ fontSize: 48, marginBottom: 12 }}>
              Statistiques en <span style={{ color }}>Formule 1</span>
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
              Vue d'ensemble des performances de l'écurie
            </p>
          </div>
        </Reveal>

        <div ref={statsRef}>
          <Reveal direction="scale">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '20px 0 40px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 520, height: 520, borderRadius: '50%',
                background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
                filter: 'blur(60px)',
                pointerEvents: 'none',
              }} />
              <TeamRadarChart
                team={team}
                teamColor={color}
                sectionVisible={statsVisible}
                size={520}
              />
            </div>
          </Reveal>

          <div className="grid-4" style={{ gap: 16, marginTop: 40 }}>
            {summaryStats.map((s, idx) => (
              <Reveal key={s.label} delay={idx * 0.05} direction="up">
                <div
                  style={{
                    padding: '20px 22px',
                    background: 'linear-gradient(160deg, #13131a 0%, #0b0b12 100%)',
                    border: `1px solid ${color}22`,
                    borderTop: `3px solid ${color}`,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${color}66`;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 20px 40px -20px ${color}88`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${color}22`;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <span style={{ fontSize: 26 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20, fontWeight: 900,
                      color,
                      lineHeight: 1,
                      marginBottom: 4,
                      textShadow: `0 0 20px ${color}66`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {s.value != null && s.value !== '' ? s.value : '—'}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--text-dim)',
                    }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARAISON */}
      {drivers.length >= 2 && (
        <section
          ref={comparisonRef}
          className="container"
          style={{ padding: '40px 32px 40px' }}
        >
          <Reveal direction="up">
            <div style={{ marginBottom: 40, textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12,
              }}>
                <div style={{ width: 40, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 11,
                  letterSpacing: '0.4em', color, fontWeight: 700,
                }}>HEAD TO HEAD</span>
                <div style={{ width: 40, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
              </div>
              <h2 style={{ fontSize: 48, marginBottom: 12 }}>
                Comparaison des <span style={{ color }}>pilotes</span>
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
                Face-à-face statistique des coéquipiers
              </p>
            </div>
          </Reveal>

          <Reveal direction="scale">
            <DriversComparison
              drivers={drivers}
              teamColor={color}
              sectionVisible={comparisonVisible}
            />
          </Reveal>
        </section>
      )}

      {/* CTA */}
      <section className="container" style={{ padding: '60px 32px 80px', textAlign: 'center' }}>
        <Link to="/teams" style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          padding: '16px 32px',
          background: 'transparent',
          border: `2px solid ${color}`,
          borderRadius: 8,
          color: 'var(--f1-white)',
          fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
          textTransform: 'uppercase', letterSpacing: '0.15em',
          textDecoration: 'none', transition: 'all 0.3s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = color;
          e.currentTarget.style.boxShadow = `0 0 40px ${color}`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.boxShadow = 'none';
        }}>
          ← Voir toutes les écuries
        </Link>
      </section>
    </div>
  );
}