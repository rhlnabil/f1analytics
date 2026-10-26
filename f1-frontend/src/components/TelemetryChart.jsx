import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts';

/* ============================================================ */
/* ============ TOOLTIP CUSTOM ================================ */
/* ============================================================ */
function CustomTooltip({ active, payload, label, teamColor }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;

  return (
    <div style={{
      background: 'rgba(10,10,15,0.98)',
      border: `1.5px solid ${teamColor}`,
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: 'var(--font-display)',
      fontSize: 11,
      color: '#fff',
      boxShadow: `0 10px 30px rgba(0,0,0,0.9), 0 0 20px ${teamColor}66`,
      minWidth: 140,
    }}>
      <div style={{
        fontSize: 9, letterSpacing: '0.2em',
        color: teamColor, fontWeight: 700,
        marginBottom: 8,
        paddingBottom: 6,
        borderBottom: `1px dashed ${teamColor}44`,
      }}>
        ◆ POINT #{label}
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        <Row label="SPEED" value={`${point.speed ?? '—'} km/h`} color={teamColor} />
        <Row label="GEAR" value={point.gear ?? '—'} color="#ffffff" />
        <Row label="THROTTLE" value={`${point.throttle ?? 0}%`} color="#00d26a" />
        <Row label="BRAKE" value={`${point.brake ?? 0}%`} color="#ff5555" />
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, letterSpacing: '0.15em' }}>
        {label}
      </span>
      <span style={{ color, fontWeight: 900, fontSize: 11 }}>
        {value}
      </span>
    </div>
  );
}

/* ============================================================ */
/* ============ STAT BADGE ==================================== */
/* ============================================================ */
function StatBadge({ icon, label, value, color }) {
  return (
    <div style={{
      padding: '8px 12px',
      background: `linear-gradient(160deg, ${color}22 0%, rgba(0,0,0,0.6) 100%)`,
      border: `1px solid ${color}55`,
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 0,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 7,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 700,
          marginBottom: 1,
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 900,
          color,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>{value}</div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* ============ MAIN COMPONENT ================================ */
/* ============================================================ */
export default function TelemetryChart({
  sessionKey, driverNumber, driverName, teamColor = '#e10600',
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionKey || !driverNumber) return;
    setLoading(true);
    setError(null);

    api.get('/telemetry', { params: { sessionKey, driverNumber } })
      .then(r => {
        const arr = Array.isArray(r.data) ? r.data : [];
        const formatted = arr.map((point, index) => ({
          index,
          speed: Number(point.speed) || 0,
          throttle: Number(point.throttle) || 0,
          brake: Number(point.brake) || 0,
          gear: Number(point.nGear) || 0,
        }));
        setData(formatted);
      })
      .catch((err) => {
        setError(err?.response?.status === 401 ? 'Non authentifié' : 'Erreur de chargement');
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [sessionKey, driverNumber]);

  /* ============ STATS CALCULÉES ============ */
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const speeds = data.map(d => d.speed);
    const throttles = data.map(d => d.throttle);
    const brakes = data.map(d => d.brake);
    return {
      maxSpeed: Math.max(...speeds),
      avgSpeed: Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length),
      fullThrottle: Math.round((throttles.filter(t => t > 95).length / data.length) * 100),
      fullBrake: Math.round((brakes.filter(b => b > 95).length / data.length) * 100),
    };
  }, [data]);

  /* ============================================================ */
  /* ============ LOADING ======================================= */
  /* ============================================================ */
  if (loading) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${teamColor}44`,
        borderRadius: 12,
        padding: 20,
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `3px solid ${teamColor}44`,
          borderTopColor: teamColor,
          animation: 'spinFast 0.8s linear infinite',
        }} />
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          letterSpacing: '0.3em',
          color: teamColor,
          fontWeight: 700,
        }}>
          CHARGEMENT · {driverName?.toUpperCase()}
        </div>
        <style>{`@keyframes spinFast { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ============================================================ */
  /* ============ NO DATA ======================================= */
  /* ============================================================ */
  if (data.length === 0) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        border: `1px dashed ${teamColor}55`,
        borderRadius: 12,
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📡</div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 16,
          fontWeight: 900,
          textTransform: 'uppercase',
          color: '#fff',
          marginBottom: 6,
        }}>
          Aucune donnée pour {driverName}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9,
          letterSpacing: '0.2em',
          color: 'var(--text-dim)',
          fontWeight: 700,
        }}>
          {error || 'SESSION · ' + sessionKey + ' · DRIVER #' + driverNumber}
        </div>
      </div>
    );
  }

  /* ============================================================ */
  /* ============ CHART ========================================= */
  /* ============================================================ */
  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(13,13,20,0.98) 0%, rgba(5,7,10,0.98) 100%)',
      border: `1.5px solid ${teamColor}55`,
      borderRadius: 12,
      padding: '18px 20px 20px',
      boxShadow: `0 10px 40px -10px ${teamColor}44`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Halo déco */}
      <div style={{
        position: 'absolute',
        top: -60, right: -60,
        width: 200, height: 200,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${teamColor}33 0%, transparent 70%)`,
        filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      {/* ============ HEADER ============ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        position: 'relative',
        zIndex: 1,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: teamColor,
            boxShadow: `0 0 10px ${teamColor}`,
            animation: 'telemetryPulse 1.4s ease-in-out infinite',
          }} />
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            color: '#fff',
            margin: 0,
            fontSize: 17,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
          }}>
            {driverName}
          </h3>
        </div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9,
          letterSpacing: '0.2em',
          color: teamColor,
          fontWeight: 700,
          padding: '4px 10px',
          background: `${teamColor}22`,
          border: `1px solid ${teamColor}55`,
          borderRadius: 4,
        }}>
          {data.length} POINTS
        </span>
      </div>

      {/* ============ STATS ============ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 8,
        marginBottom: 16,
        position: 'relative',
        zIndex: 1,
      }}>
        <StatBadge icon="🏎️" label="V-MAX" value={`${stats.maxSpeed} km/h`} color={teamColor} />
        <StatBadge icon="📊" label="MOYENNE" value={`${stats.avgSpeed} km/h`} color="#00d4ff" />
        <StatBadge icon="🟢" label="FULL THROTTLE" value={`${stats.fullThrottle}%`} color="#00d26a" />
        <StatBadge icon="🔴" label="FULL BRAKE" value={`${stats.fullBrake}%`} color="#ff5555" />
      </div>

      {/* ============ GRAPHE 1 : VITESSE ============ */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 8,
        letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 700,
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ width: 16, height: 1, background: teamColor }} />
        ◆ VITESSE & RAPPORT
        <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${teamColor}44, transparent)` }} />
      </div>

      <div style={{ width: '100%', height: 220, position: 'relative', zIndex: 1 }}>
        <ResponsiveContainer width="100%" height={220} initialDimension={{ width: 400, height: 220 }}>
          <AreaChart data={data} syncId="telemetry" margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id={`speedGrad-${driverNumber}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={teamColor} stopOpacity={0.6} />
                <stop offset="100%" stopColor={teamColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="index" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} interval="preserveStartEnd" />
            <YAxis yAxisId="speed" stroke={teamColor} domain={[0, 'dataMax + 20']} tick={{ fontSize: 9, fill: teamColor }} width={40} />
            <YAxis yAxisId="gear" orientation="right" stroke="rgba(255,255,255,0.4)" domain={[0, 8]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} width={25} />
            <Tooltip content={<CustomTooltip teamColor={teamColor} />} cursor={{ stroke: teamColor, strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area yAxisId="speed" type="monotone" dataKey="speed" stroke={teamColor} strokeWidth={2} fill={`url(#speedGrad-${driverNumber})`} isAnimationActive={false} />
            <Line yAxisId="gear" type="stepAfter" dataKey="gear" stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} dot={false} isAnimationActive={false} strokeDasharray="2 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ============ GRAPHE 2 : THROTTLE / BRAKE ============ */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 8,
        letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 700,
        marginTop: 18,
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ width: 16, height: 1, background: '#00d26a' }} />
        ◆ ACCÉLÉRATEUR & FREIN
        <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #00d26a44, transparent)' }} />
      </div>

      <div style={{ width: '100%', height: 130, position: 'relative', zIndex: 1 }}>
        <ResponsiveContainer width="100%" height={130} initialDimension={{ width: 400, height: 130 }}>
          <AreaChart data={data} syncId="telemetry" margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id={`throttleGrad-${driverNumber}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d26a" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#00d26a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`brakeGrad-${driverNumber}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5555" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#ff5555" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="index" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} width={40} />
            <Tooltip content={<CustomTooltip teamColor={teamColor} />} cursor={{ stroke: teamColor, strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area type="monotone" dataKey="throttle" stroke="#00d26a" strokeWidth={2} fill={`url(#throttleGrad-${driverNumber})`} isAnimationActive={false} />
            <Area type="stepAfter" dataKey="brake" stroke="#ff5555" strokeWidth={2} fill={`url(#brakeGrad-${driverNumber})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ============ LÉGENDE ============ */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 14,
        paddingTop: 12,
        borderTop: `1px dashed ${teamColor}33`,
        fontFamily: 'var(--font-display)',
        fontSize: 8,
        letterSpacing: '0.2em',
        fontWeight: 700,
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1,
      }}>
        <LegendItem color={teamColor} label="VITESSE" />
        <LegendItem color="rgba(255,255,255,0.6)" label="RAPPORT" dashed />
        <LegendItem color="#00d26a" label="THROTTLE" />
        <LegendItem color="#ff5555" label="FREIN" />
      </div>

      <style>{`
        @keyframes telemetryPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.55)' }}>
      <span style={{
        width: dashed ? 16 : 12,
        height: 2,
        background: dashed
          ? `repeating-linear-gradient(90deg, ${color} 0px, ${color} 3px, transparent 3px, transparent 5px)`
          : color,
        boxShadow: dashed ? 'none' : `0 0 6px ${color}`,
        borderRadius: 1,
      }} />
      {label}
    </div>
  );
}