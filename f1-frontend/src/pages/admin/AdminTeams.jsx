import { useEffect, useState } from 'react';
import api, { uploadFile, API_BASE } from '../../api/axios';

const empty = {
  name: '', country: '', countryCode: '', color: '#e10600', logoUrl: '',
  fullName: '', teamChief: '', technicalChief: '', chassis: '',
  powerUnit: '', reserveDriver: '', firstEntry: '',
  gpEntered: '', teamPoints: '', highestFinish: '', podiums: '',
  highestGrid: '', polePositions: '', worldChampionships: ''
};

const COUNTRIES = [
  { code: 'IT', name: 'Italie' },
  { code: 'AT', name: 'Autriche' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'FR', name: 'France' },
  { code: 'CH', name: 'Suisse' },
  { code: 'US', name: 'États-Unis' },
  { code: 'JP', name: 'Japon' },
  { code: 'CN', name: 'Chine' },
  { code: 'SA', name: 'Arabie Saoudite' },
  { code: 'AE', name: 'Émirats arabes unis' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'ES', name: 'Espagne' },
  { code: 'MC', name: 'Monaco' },
  { code: 'BE', name: 'Belgique' },
  { code: 'BR', name: 'Brésil' },
  { code: 'MX', name: 'Mexique' },
  { code: 'AU', name: 'Australie' },
  { code: 'SG', name: 'Singapour' },
  { code: 'CA', name: 'Canada' },
  { code: 'HU', name: 'Hongrie' },
  { code: 'AZ', name: 'Azerbaïdjan' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KR', name: 'Corée du Sud' },
  { code: 'IN', name: 'Inde' },
  { code: 'RU', name: 'Russie' },
  { code: 'FI', name: 'Finlande' },
  { code: 'SE', name: 'Suède' },
  { code: 'DK', name: 'Danemark' },
  { code: 'PL', name: 'Pologne' },
  { code: 'ZA', name: 'Afrique du Sud' },
];

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = () => api.get('/teams').then(r => setTeams(r.data));
  useEffect(() => { load(); }, []);

  const n = v => v === '' || v === null || v === undefined ? null : Number(v);

  const handleFileUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadFile(file);
      setForm(f => ({ ...f, logoUrl: data.url }));
    } catch (err) {
      alert('Erreur upload : ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    const payload = {
      name: form.name,
      country: form.country,
      countryCode: form.countryCode,
      color: form.color,
      logoUrl: form.logoUrl,
      fullName: form.fullName,
      teamChief: form.teamChief,
      technicalChief: form.technicalChief,
      chassis: form.chassis,
      powerUnit: form.powerUnit,
      reserveDriver: form.reserveDriver,
      firstEntry: n(form.firstEntry),
      gpEntered: n(form.gpEntered),
      teamPoints: n(form.teamPoints),
      highestFinish: form.highestFinish,
      podiums: n(form.podiums),
      highestGrid: form.highestGrid,
      polePositions: n(form.polePositions),
      worldChampionships: n(form.worldChampionships)
    };
    try {
      if (editId) await api.put(`/teams/${editId}`, payload);
      else await api.post('/teams', payload);
      setForm(empty);
      setEditId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const edit = t => {
    setEditId(t.id);
    setForm({
      name: t.name || '',
      country: t.country || '',
      countryCode: t.countryCode || '',
      color: t.color || '#e10600',
      logoUrl: t.logoUrl || '',
      fullName: t.fullName || '',
      teamChief: t.teamChief || '',
      technicalChief: t.technicalChief || '',
      chassis: t.chassis || '',
      powerUnit: t.powerUnit || '',
      reserveDriver: t.reserveDriver || '',
      firstEntry: t.firstEntry ?? '',
      gpEntered: t.gpEntered ?? '',
      teamPoints: t.teamPoints ?? '',
      highestFinish: t.highestFinish || '',
      podiums: t.podiums ?? '',
      highestGrid: t.highestGrid || '',
      polePositions: t.polePositions ?? '',
      worldChampionships: t.worldChampionships ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async id => {
    if (!window.confirm('Supprimer cette écurie ?')) return;
    await api.delete(`/teams/${id}`);
    load();
  };

  const logoSrc = url => !url ? null
    : url.startsWith('http') ? url : API_BASE + url;

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--f1-red)', marginBottom: 8 }}>■ GESTION</div>
        <h1 style={{ fontSize: 40 }}>Écuries</h1>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 20, fontSize: 18 }}>
          {editId ? `Modifier l'écurie #${editId}` : 'Ajouter une écurie'}
        </h3>

        <form onSubmit={submit}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--f1-red)', marginBottom: 12 }}>IDENTITÉ</div>
          <div className="grid-2">
            <div><label>Nom court *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ferrari" required /></div>
            <div><label>Nom complet</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Scuderia Ferrari HP" /></div>
            <div>
              <label>Pays</label>
              <select
                value={form.countryCode}
                onChange={e => {
                  const c = COUNTRIES.find(x => x.code === e.target.value);
                  setForm({
                    ...form,
                    countryCode: e.target.value,
                    country: c ? c.name : form.country
                  });
                }}
              >
                <option value="">— Choisir —</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div><label>Couleur</label>
              <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ height: 44, padding: 4 }} /></div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label>Logo de l'écurie</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 20px',
                background: uploading ? '#333' : 'var(--f1-red)',
                color: '#fff', borderRadius: 6,
                cursor: uploading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700, fontSize: 13,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 0,
              }}>
                📁 {uploading ? 'Envoi...' : 'Choisir un logo'}
                <input type="file" accept="image/*" onChange={handleFileUpload}
                  disabled={uploading} style={{ display: 'none' }} />
              </label>

              {form.logoUrl && (
                <button type="button" className="secondary"
                  onClick={() => setForm({ ...form, logoUrl: '' })}
                  style={{ padding: '12px 20px' }}>
                  ✖ Retirer
                </button>
              )}
            </div>
          </div>

          {form.logoUrl && (
            <div style={{ marginTop: 20 }}>
              <label>Aperçu</label>
              <img src={logoSrc(form.logoUrl)} alt="Aperçu"
                style={{
                  height: 80, width: 'auto',
                  background: '#fff', padding: 8,
                  borderRadius: 6, border: '2px solid var(--f1-red)',
                  display: 'block',
                }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
          )}

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--f1-red)', margin: '28px 0 12px' }}>TEAM PROFILE</div>
          <div className="grid-2">
            <div><label>Team Chief (Directeur)</label>
              <input value={form.teamChief} onChange={e => setForm({ ...form, teamChief: e.target.value })} placeholder="Frédéric Vasseur" /></div>
            <div><label>Technical Chief</label>
              <input value={form.technicalChief} onChange={e => setForm({ ...form, technicalChief: e.target.value })} placeholder="Loïc Serra" /></div>
            <div><label>Châssis</label>
              <input value={form.chassis} onChange={e => setForm({ ...form, chassis: e.target.value })} placeholder="SF-25" /></div>
            <div><label>Unité de puissance (moteur)</label>
              <input value={form.powerUnit} onChange={e => setForm({ ...form, powerUnit: e.target.value })} placeholder="Ferrari" /></div>
            <div><label>Pilote réserviste</label>
              <input value={form.reserveDriver} onChange={e => setForm({ ...form, reserveDriver: e.target.value })} placeholder="Antonio Giovinazzi" /></div>
            <div><label>Première entrée en F1 (année)</label>
              <input type="number" value={form.firstEntry} onChange={e => setForm({ ...form, firstEntry: e.target.value })} placeholder="1950" /></div>
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--f1-red)', margin: '28px 0 12px' }}>TEAM SUMMARY</div>
          <div className="grid-4">
            <div><label>GP disputés</label>
              <input type="number" value={form.gpEntered} onChange={e => setForm({ ...form, gpEntered: e.target.value })} placeholder="1100" /></div>
            <div><label>Points équipe</label>
              <input type="number" step="0.5" value={form.teamPoints} onChange={e => setForm({ ...form, teamPoints: e.target.value })} placeholder="10000" /></div>
            <div><label>Meilleure position course</label>
              <input value={form.highestFinish} onChange={e => setForm({ ...form, highestFinish: e.target.value })} placeholder="1 (x254)" /></div>
            <div><label>Podiums</label>
              <input type="number" value={form.podiums} onChange={e => setForm({ ...form, podiums: e.target.value })} placeholder="800" /></div>
            <div><label>Meilleure position grille</label>
              <input value={form.highestGrid} onChange={e => setForm({ ...form, highestGrid: e.target.value })} placeholder="1 (x100)" /></div>
            <div><label>Pole positions</label>
              <input type="number" value={form.polePositions} onChange={e => setForm({ ...form, polePositions: e.target.value })} placeholder="250" /></div>
            <div><label>Championnats du monde</label>
              <input type="number" value={form.worldChampionships} onChange={e => setForm({ ...form, worldChampionships: e.target.value })} placeholder="16" /></div>
          </div>

          {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}

          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button type="submit">{editId ? '💾 Enregistrer' : '➕ Ajouter'}</button>
            {editId && <button type="button" className="secondary" onClick={() => { setEditId(null); setForm(empty); }}>Annuler</button>}
          </div>
        </form>
      </div>

      <table>
        <thead>
          <tr><th>Logo</th><th>Nom</th><th>Drapeau</th><th>Directeur</th><th>Moteur</th><th>1ʳᵉ entrée</th><th>Titres</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
        </thead>
        <tbody>
          {teams.map(t => (
            <tr key={t.id}>
              <td>
                {t.logoUrl ? (
                  <img src={logoSrc(t.logoUrl)} alt={t.name}
                    style={{ height: 36, width: 'auto', background: '#fff', padding: 4, borderRadius: 4 }} />
                ) : (
                  <span className="color-dot" style={{ background: t.color }} />
                )}
              </td>
              <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="color-dot" style={{ background: t.color }} />
                <strong>{t.name}</strong>
              </span></td>
              <td>
                {t.countryCode ? (
                  <img
                    src={`https://flagcdn.com/w40/${t.countryCode.toLowerCase()}.png`}
                    alt={t.countryCode}
                    className="waving-flag"
                    style={{ height: 20, width: 'auto', padding: '0 1px' }}
                  />
                ) : '—'}
              </td>
              <td style={{ color: 'var(--text-mid)' }}>{t.teamChief || '—'}</td>
              <td style={{ color: 'var(--text-mid)' }}>{t.powerUnit || '—'}</td>
              <td className="mono" style={{ color: 'var(--text-mid)' }}>{t.firstEntry || '—'}</td>
              <td className="mono" style={{ color: 'var(--f1-red)', fontWeight: 700 }}>{t.worldChampionships > 0 ? `🏆 ×${t.worldChampionships}` : '—'}</td>
              <td style={{ textAlign: 'right' }}>
                <button className="secondary sm" onClick={() => edit(t)} style={{ marginRight: 6 }}>✏️ Modifier</button>
                <button className="danger" onClick={() => remove(t.id)}>🗑️</button>
              </td>
            </tr>
          ))}
          {teams.length === 0 && (
            <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>Aucune écurie enregistrée</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}