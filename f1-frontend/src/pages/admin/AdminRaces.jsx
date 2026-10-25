import { useEffect, useState } from 'react';
import api from '../../api/axios';

const empty = { season: 2026, round: '', name: '', raceDate: '', circuitId: '' };

export default function AdminRaces() {
  const [races, setRaces] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState(null);
  const [syncSeason, setSyncSeason] = useState('2024');

  const load = async () => {
    try {
      const [r, c] = await Promise.all([api.get('/races'), api.get('/circuits')]);
      setRaces(r.data);
      setCircuits(c.data);
    } catch (err) {
      setError('Erreur de chargement');
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ============================================================ */
  /* ============ SYNC PAR SAISON =============================== */
  /* ============================================================ */
  const handleSync = async () => {
    if (!window.confirm(
      `Synchroniser le calendrier F1 ${syncSeason} depuis Jolpica ?\n\n` +
      `Les GP manquants seront ajoutés avec leurs dates exactes.`
    )) return;

    setSyncing(true);
    setSyncReport(null);
    setError('');

    try {
      const { data } = await api.post(`/admin/races/sync?season=${syncSeason}`);
      setSyncReport(data);
      setTimeout(() => load(), 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  /* ============================================================ */
  /* ============ CRUD ========================================== */
  /* ============================================================ */
  const submit = async e => {
    e.preventDefault();
    setError('');
    const payload = {
      season: Number(form.season),
      round: Number(form.round),
      name: form.name,
      raceDate: form.raceDate || null,
      circuitId: form.circuitId ? Number(form.circuitId) : null,
    };
    try {
      if (editId) await api.put(`/races/${editId}`, payload);
      else await api.post('/races', payload);
      setForm(empty);
      setEditId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const edit = r => {
    setEditId(r.id);
    setForm({
      season: r.season ?? 2026,
      round: r.round ?? '',
      name: r.name || '',
      raceDate: r.raceDate || '',
      circuitId: r.circuitId ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async id => {
    if (!window.confirm('Supprimer cette course ?')) return;
    await api.delete(`/races/${id}`);
    load();
  };

  const formatDate = dateStr => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();
    } catch {
      return dateStr;
    }
  };

  /* ✅ Groupe par saison */
  const racesBySeason = races.reduce((acc, r) => {
    if (!acc[r.season]) acc[r.season] = [];
    acc[r.season].push(r);
    return acc;
  }, {});

  const sortedSeasons = Object.keys(racesBySeason)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* HEADER */}
      <div className="fade-up" style={{
        marginBottom: 32,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            letterSpacing: '0.3em',
            color: 'var(--f1-red)',
            marginBottom: 8,
          }}>
            ■ GESTION
          </div>
          <h1 style={{ fontSize: 40 }}>Courses</h1>
        </div>

        {/* Panneau sync */}
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,210,106,0.3)',
          borderRadius: 8,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 700,
          }}>SAISON</span>
          <select
            value={syncSeason}
            onChange={e => setSyncSeason(e.target.value)}
            disabled={syncing}
            style={{
              padding: '8px 12px',
              background: 'rgba(20,20,26,0.9)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 900,
              cursor: syncing ? 'wait' : 'pointer',
              outline: 'none',
            }}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '10px 20px',
              background: syncing
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #00d26a 0%, #00a050 100%)',
              border: syncing ? '1px solid var(--border)' : '2px solid #00d26a',
              borderRadius: 6,
              color: syncing ? 'var(--text-dim)' : '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.15em',
              cursor: syncing ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: syncing ? 'none' : '0 4px 20px rgba(0,210,106,0.4)',
            }}
          >
            {syncing ? (
              <>
                <span style={{
                  width: 12, height: 12,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#00d26a',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                SYNC...
              </>
            ) : (
              <>🔄 SYNC {syncSeason}</>
            )}
          </button>
        </div>
      </div>

      {/* Rapport sync */}
      {syncReport && (
        <div style={{
          padding: '16px 20px',
          marginBottom: 24,
          background: syncReport.success ? 'rgba(0,210,106,0.1)' : 'rgba(255,85,85,0.1)',
          border: `1px solid ${syncReport.success ? 'rgba(0,210,106,0.4)' : 'rgba(255,85,85,0.4)'}`,
          borderLeft: `4px solid ${syncReport.success ? '#00d26a' : '#ff5555'}`,
          borderRadius: 8,
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          color: syncReport.success ? '#00d26a' : '#ff5555',
        }}>
          <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: '0.15em' }}>
            {syncReport.success ? '✅ SYNC RÉUSSIE' : '❌ SYNC ÉCHOUÉE'}
          </div>
          <div style={{
            color: 'var(--text-mid)',
            fontSize: 13,
            fontFamily: 'var(--font-heading)',
          }}>
            {syncReport.message}
          </div>
        </div>
      )}

      {/* Formulaire manuel */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 20, fontSize: 18 }}>
          {editId ? `Modifier la course #${editId}` : 'Ajouter une course manuellement'}
        </h3>

        <form onSubmit={submit}>
          <div className="grid-2">
            <div>
              <label>Saison *</label>
              <input type="number" value={form.season}
                onChange={e => setForm({ ...form, season: e.target.value })} required />
            </div>
            <div>
              <label>Manche (round) *</label>
              <input type="number" value={form.round}
                onChange={e => setForm({ ...form, round: e.target.value })} required />
            </div>
            <div>
              <label>Nom du Grand Prix *</label>
              <input value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="GP de Monaco" required />
            </div>
            <div>
              <label>Date de la course</label>
              <input type="date" value={form.raceDate}
                onChange={e => setForm({ ...form, raceDate: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Circuit</label>
              <select value={form.circuitId}
                onChange={e => setForm({ ...form, circuitId: e.target.value })}>
                <option value="">— Aucun —</option>
                {circuits.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}

          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button type="submit">
              {editId ? '💾 Enregistrer' : '➕ Ajouter'}
            </button>
            {editId && (
              <button type="button" className="secondary"
                onClick={() => { setEditId(null); setForm(empty); }}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tableau groupé par saison */}
      {sortedSeasons.length === 0 && (
        <div style={{
          padding: 60,
          textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 8,
          color: 'var(--text-dim)',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}>🏁</div>
          <div style={{ marginBottom: 8 }}>Aucune course en DB</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Clique sur <strong style={{ color: '#00d26a' }}>🔄 SYNC</strong> pour commencer
          </div>
        </div>
      )}

      {sortedSeasons.map(season => (
        <div key={season} style={{ marginBottom: 40 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 900,
              color: season === 2024 || season === 2025 ? '#00d26a' : '#e10600',
              letterSpacing: '0.15em',
            }}>
              SAISON {season}
            </h2>
            {(season === 2024 || season === 2025) && (
              <span style={{
                padding: '3px 10px',
                background: 'rgba(0,210,106,0.15)',
                border: '1px solid rgba(0,210,106,0.4)',
                borderRadius: 4,
                fontFamily: 'var(--font-display)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: '#00d26a',
              }}>
                ✅ RÉSULTATS + RADIO
              </span>
            )}
            <span style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.2), transparent)',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              color: 'var(--text-dim)',
              letterSpacing: '0.15em',
            }}>
              {racesBySeason[season].length} GP
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>R</th>
                <th>Grand Prix</th>
                <th>Date</th>
                <th>Circuit</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {racesBySeason[season]
                .slice()
                .sort((a, b) => a.round - b.round)
                .map(r => (
                  <tr key={r.id}>
                    <td className="mono" style={{ color: 'var(--text-dim)' }}>#{r.id}</td>
                    <td>
                      <span className="badge" style={{
                        background: 'rgba(225,6,0,0.15)',
                        color: 'var(--f1-red)',
                        border: '1px solid rgba(225,6,0,0.3)',
                      }}>
                        R{r.round}
                      </span>
                    </td>
                    <td><strong>{r.name}</strong></td>
                    <td className="mono" style={{ color: 'var(--text-mid)', fontSize: 13 }}>
                      {formatDate(r.raceDate)}
                    </td>
                    <td style={{ color: 'var(--text-mid)' }}>{r.circuitName || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="secondary sm" onClick={() => edit(r)} style={{ marginRight: 6 }}>
                        ✏️ Modifier
                      </button>
                      <button className="danger" onClick={() => remove(r.id)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}