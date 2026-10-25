import { useEffect, useState } from 'react';
import api from '../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TelemetryChart({ sessionKey, driverNumber, driverName, teamColor = '#e10600' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionKey || !driverNumber) return;
    setLoading(true);
    api.get('/telemetry', { params: { sessionKey, driverNumber } })
      .then(r => {
        const formatted = r.data.map((point, index) => ({
          index, speed: point.speed, throttle: point.throttle,
          brake: point.brake, gear: point.nGear,
        }));
        setData(formatted);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [sessionKey, driverNumber]);

  if (loading) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.4)', border: `1px solid ${teamColor}44`,
        borderRadius: 12, padding: 20, minHeight: 460,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `3px solid ${teamColor}44`, borderTopColor: teamColor,
          animation: 'spinFast 0.8s linear infinite',
        }} />
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 10,
          letterSpacing: '0.3em', color: teamColor,
        }}>CHARGEMENT · {driverName?.toUpperCase()}</div>
        <style>{`@keyframes spinFast { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.3)', border: `1px solid ${teamColor}33`,
        borderRadius: 12, padding: 40, textAlign: 'center',
        color: 'var(--text-dim)', fontFamily: 'var(--font-heading)', fontSize: 13,
      }}>Aucune donnée pour {driverName}</div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)', border: `1px solid ${teamColor}44`,
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', margin: 0, fontSize: 16 }}>{driverName}</h3>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 9,
          letterSpacing: '0.2em', color: 'var(--text-dim)',
        }}>{data.length} POINTS</span>
      </div>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} syncId="telemetry" margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" />
            <XAxis dataKey="index" stroke="#ffffff33" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis yAxisId="speed" stroke={teamColor} domain={[0, 360]} tick={{ fontSize: 9 }} width={35} />
            <YAxis yAxisId="gear" orientation="right" stroke="#ffffff66" domain={[0, 8]} tick={{ fontSize: 9 }} width={25} />
            <Tooltip contentStyle={{ background: '#0a0a0f', border: `1px solid ${teamColor}`, borderRadius: 6, fontSize: 11 }} labelStyle={{ color: '#fff' }} />
            <Line yAxisId="speed" type="monotone" dataKey="speed" stroke={teamColor} dot={false} strokeWidth={1.8} isAnimationActive={false} />
            <Line yAxisId="gear" type="stepAfter" dataKey="gear" stroke="#ffffff66" dot={false} strokeWidth={1} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: 140, marginTop: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} syncId="telemetry" margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" />
            <XAxis dataKey="index" stroke="#ffffff33" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} stroke="#ffffff66" tick={{ fontSize: 9 }} width={35} />
            <Tooltip contentStyle={{ background: '#0a0a0f', border: `1px solid ${teamColor}`, borderRadius: 6, fontSize: 11 }} labelStyle={{ color: '#fff' }} />
            <Line type="monotone" dataKey="throttle" stroke="#00d26a" dot={false} strokeWidth={1.8} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="brake" stroke="#ff5555" dot={false} strokeWidth={1.8} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}