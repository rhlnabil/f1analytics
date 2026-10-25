import { useEffect, useState } from 'react';
import api from '../../api/axios';

const empty = { raceId: '', driverId: '', position: '', points: '', fastestLap: false };

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [races, setRaces] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [r, ra, dr] = await Promise.all([
      api.get('/results'),
      api.get('/races'),
      api.get('/drivers')
    ]);
    setResults(r.data);
    setRaces(ra.data);
    setDrivers(dr.data);
  };
  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    setError('');
    const payload = {
      raceId: Number(form.raceId),
      driverId: Number(form.driverId),
      position: form.position ? Number(form.position) : null,
      points: form.points ? Number(form.points) : null,
      fastestLap: form.fastestLap
    };
    try {
      if (editId) await api.put(`/results/${editId}`, payload);
      else await api.post('/results', payload);
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
      raceId: r.raceId ?? '',
      driverId: r.driverId ?? '',
      position: r.position ?? '',
      points: r.points ?? '',
      fastestLap: r.fastestLap || false
    });
  };

  const remove = async id => {
    if (!window.confirm('Supprimer ce résultat ?')) return;
    await api.delete(`/results/${id}`);
    load();
  };

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.3em',
          color: 'var(--f1-red)',
          marginBottom: 8,
        }}>
          ■ GESTION
        </div>
        <h1 style={{ fontSize: 40 }}>Résultats</h1>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 20, fontSize: 18 }}>
          {editId ? `Modifier le résultat #${editId}` : 'Ajouter un résultat'}
        </h3>

        <form onSubmit={submit}>
          <div className="grid-2">
            <div>
              <label>Course *</label>
              <select value={form.raceId}
                onChange={e => setForm({ ...form, raceId: e.target.value })} required>
                <option value="">— Choisir une course —</option>
                {races.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.season} R{r.round} — {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Pilote *</label>
              <select value={form.driverId}
                onChange={e => setForm({ ...form, driverId: e.target.value })} required>
                <option value="">— Choisir un pilote —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} {d.number ? `(#${d.number})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Position</label>
              <input type="number" value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}
                placeholder="1" />
            </div>
            <div>
              <label>Points</label>
              <input type="number" step="0.5" value={form.points}
                onChange={e => setForm({ ...form, points: e.target.value })}
                placeholder="25" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                marginBottom: 0,
              }}>
                <input
                  type="checkbox"
                  checked={form.fastestLap}
                  onChange={e => setForm({ ...form, fastestLap: e.target.checked })}
                  style={{ width: 'auto' }}
                />
                <span>🏁 Meilleur tour</span>
              </label>
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

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Course</th>
            <th>Pilote</th>
            <th>Position</th>
            <th>Points</th>
            <th>Meilleur tour</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id}>
              <td className="mono" style={{ color: 'var(--text-dim)' }}>#{r.id}</td>
              <td style={{ color: 'var(--text-mid)' }}>{r.raceName || '—'}</td>
              <td><strong>{r.driverName || '—'}</strong></td>
              <td>
                <span className="mono" style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: r.position === 1 ? '#FFD700'
                       : r.position === 2 ? '#C0C0C0'
                       : r.position === 3 ? '#CD7F32'
                       : 'var(--f1-white)',
                }}>
                  {r.position || '—'}
                </span>
              </td>
              <td className="mono" style={{ color: 'var(--f1-red)', fontWeight: 700 }}>
                {r.points != null ? `${r.points} pts` : '—'}
              </td>
              <td style={{ fontSize: 18 }}>
                {r.fastestLap ? '🏁' : <span style={{ color: 'var(--text-dim)' }}>—</span>}
              </td>
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
          {results.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>
                Aucun résultat enregistré
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}