import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';

export default function RaceRadio({ raceId, teamColor = '#e10600' }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!raceId) return;
    setLoading(true);
    api.get(`/races/${raceId}/radio`)
      .then(r => setMessages(r.data))
      .catch(err => setError(err?.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [raceId]);

  const togglePlay = (message) => {
    if (playingId === message.recordingUrl) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(message.recordingUrl);
      audioRef.current = audio;
      audio.play();
      setPlayingId(message.recordingUrl);
      audio.onended = () => setPlayingId(null);
    }
  };

  if (loading) return (
    <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
      📻 CHARGEMENT DE LA RADIO...
    </div>
  );

  if (error || messages.length === 0) {
    return (
      <div style={{
        padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.3)',
        borderRadius: 8, color: 'var(--text-dim)',
      }}>Aucun message radio disponible pour cette course.</div>
    );
  }

  return (
    <section style={{ padding: '40px 0' }}>
      <style>{`
        @keyframes radioPulse { 0%,100%{box-shadow:0 0 0 0 rgba(225,6,0,0.7)} 50%{box-shadow:0 0 0 10px rgba(225,6,0,0)} }
        .radio-card:hover { border-color: ${teamColor} !important; transform: translateY(-2px); }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.35em',
          color: teamColor, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ width: 6, height: 6, background: teamColor, transform: 'rotate(45deg)', boxShadow: `0 0 10px ${teamColor}` }} />
          ◆ RADIO D'ÉQUIPE
        </div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${teamColor}66, transparent)` }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
          {messages.length} MESSAGES
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, idx) => {
          const isPlaying = playingId === msg.recordingUrl;
          const time = new Date(msg.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={idx} className="radio-card" onClick={() => togglePlay(msg)} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px', background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${isPlaying ? teamColor : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.25s ease',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: isPlaying ? teamColor : 'rgba(255,255,255,0.05)',
                display: 'grid', placeItems: 'center', flexShrink: 0,
                color: isPlaying ? '#fff' : teamColor,
                border: `2px solid ${isPlaying ? '#fff' : teamColor}44`,
                animation: isPlaying ? 'radioPulse 1.5s infinite' : 'none',
              }}>
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 900, color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 16 }}>{msg.driverName}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>#{msg.driverNumber}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: msg.teamColor, boxShadow: `0 0 6px ${msg.teamColor}` }} />
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{time}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    width: 3,
                    height: isPlaying ? `${20 + Math.random() * 60}%` : '20%',
                    background: isPlaying ? teamColor : 'rgba(255,255,255,0.15)',
                    borderRadius: 2, transition: 'height 0.15s ease',
                  }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}