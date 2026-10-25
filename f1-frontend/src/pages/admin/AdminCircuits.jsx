import { useEffect, useState } from 'react';
import api, { uploadFile, API_BASE } from '../../api/axios';

const empty = {
  name: '',
  country: '',
  countryCode: '',
  lengthKm: '',
  imageUrl: '',
  firstGrandPrix: '',
  fastestLapTime: '',
  latitude: '',
  longitude: '',
  architect: '',
  constructionCost: '',
  numberOfTurns: '',
};

const COUNTRIES = [
  { code: 'BH', name: 'Bahreïn' },
  { code: 'SA', name: 'Arabie Saoudite' },
  { code: 'AU', name: 'Australie' },
  { code: 'AZ', name: 'Azerbaïdjan' },
  { code: 'US', name: 'États-Unis' },
  { code: 'IT', name: 'Italie' },
  { code: 'MC', name: 'Monaco' },
  { code: 'ES', name: 'Espagne' },
  { code: 'CA', name: 'Canada' },
  { code: 'AT', name: 'Autriche' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'HU', name: 'Hongrie' },
  { code: 'BE', name: 'Belgique' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'SG', name: 'Singapour' },
  { code: 'JP', name: 'Japon' },
  { code: 'QA', name: 'Qatar' },
  { code: 'MX', name: 'Mexique' },
  { code: 'BR', name: 'Brésil' },
  { code: 'AE', name: 'Émirats arabes unis' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'PT', name: 'Portugal' },
  { code: 'TR', name: 'Turquie' },
  { code: 'RU', name: 'Russie' },
  { code: 'CN', name: 'Chine' },
  { code: 'KR', name: 'Corée du Sud' },
  { code: 'IN', name: 'Inde' },
  { code: 'ZA', name: 'Afrique du Sud' },
  { code: 'MA', name: 'Maroc' },
  { code: 'SE', name: 'Suède' },
  { code: 'CH', name: 'Suisse' },
  { code: 'AR', name: 'Argentine' },
  { code: 'MY', name: 'Malaisie' },
];

export default function AdminCircuits() {
  const [circuits, setCircuits] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = () => api.get('/circuits').then(r => setCircuits(r.data));
  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    setError('');
    const payload = {
      name: form.name,
      country: form.country,
      countryCode: form.countryCode,
      lengthKm: form.lengthKm ? Number(form.lengthKm) : null,
      imageUrl: form.imageUrl,
      firstGrandPrix: form.firstGrandPrix,
      fastestLapTime: form.fastestLapTime,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      architect: form.architect,
      constructionCost: form.constructionCost,
      numberOfTurns: form.numberOfTurns ? Number(form.numberOfTurns) : null,
    };
    try {
      if (editId) await api.put(`/circuits/${editId}`, payload);
      else await api.post('/circuits', payload);
      setForm(empty);
      setEditId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const edit = c => {
    setEditId(c.id);
    setForm({
      name: c.name || '',
      country: c.country || '',
      countryCode: c.countryCode || '',
      lengthKm: c.lengthKm ?? '',
      imageUrl: c.imageUrl || '',
      firstGrandPrix: c.firstGrandPrix || '',
      fastestLapTime: c.fastestLapTime || '',
      latitude: c.latitude ?? '',
      longitude: c.longitude ?? '',
      architect: c.architect || '',
      constructionCost: c.constructionCost || '',
      numberOfTurns: c.numberOfTurns ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async id => {
    if (!window.confirm('Supprimer ce circuit ?')) return;
    await api.delete(`/circuits/${id}`);
    load();
  };

  const handleUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadFile(file);
      setForm(f => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      alert('Erreur upload : ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const imgSrc = url => !url ? null
    : url.startsWith('http') ? url : API_BASE + url;

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* HEADER */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11,
          letterSpacing: '0.3em', color: 'var(--f1-red)', marginBottom: 8,
        }}>■ GESTION</div>
        <h1 style={{ fontSize: 40 }}>Circuits</h1>
      </div>

      {/* FORMULAIRE */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 20, fontSize: 18 }}>
          {editId ? `Modifier le circuit #${editId}` : 'Ajouter un circuit'}
        </h3>

        <form onSubmit={submit}>
          {/* ============ IDENTITÉ ============ */}
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 11,
            letterSpacing: '0.2em', color: 'var(--f1-red)', marginBottom: 12,
          }}>IDENTITÉ</div>

          <div className="grid-2">
            <div>
              <label>Nom du circuit *</label>
              <input value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Circuit de Monaco" required />
            </div>

            <div>
              <label>Pays (drapeau)</label>
              <select value={form.countryCode} onChange={e => {
                const c = COUNTRIES.find(x => x.code === e.target.value);
                setForm({
                  ...form,
                  countryCode: e.target.value,
                  country: c ? c.name : form.country,
                });
              }}>
                <option value="">— Choisir un pays —</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Nom du pays (texte)</label>
              <input value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                placeholder="Monaco" />
            </div>

            <div>
              <label>Longueur (km)</label>
              <input type="number" step="0.001" value={form.lengthKm}
                onChange={e => setForm({ ...form, lengthKm: e.target.value })}
                placeholder="3.337" />
            </div>

            <div>
              <label>🔄 Nombre de virages</label>
              <input type="number" value={form.numberOfTurns}
                onChange={e => setForm({ ...form, numberOfTurns: e.target.value })}
                placeholder="19" />
            </div>

            <div>
              <label>Premier Grand Prix</label>
              <input value={form.firstGrandPrix}
                onChange={e => setForm({ ...form, firstGrandPrix: e.target.value })}
                placeholder="1950" />
            </div>

            <div>
              <label>⏱️ Meilleur tour en course</label>
              <input value={form.fastestLapTime}
                onChange={e => setForm({ ...form, fastestLapTime: e.target.value })}
                placeholder="1:14.260" />
            </div>

            <div>
              <label>📐 Architecte</label>
              <input value={form.architect}
                onChange={e => setForm({ ...form, architect: e.target.value })}
                placeholder="Hermann Tilke" />
            </div>

            <div>
              <label>💰 Coût de construction</label>
              <input value={form.constructionCost}
                onChange={e => setForm({ ...form, constructionCost: e.target.value })}
                placeholder="$150 million" />
            </div>
          </div>

          {/* ============ LOCALISATION ============ */}
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 11,
            letterSpacing: '0.2em', color: 'var(--f1-red)', margin: '28px 0 12px',
          }}>📍 COORDONNÉES DE LOCALISATION</div>

          <div className="grid-2">
            <div>
              <label>Latitude</label>
              <input type="number" step="0.0001" value={form.latitude}
                onChange={e => setForm({ ...form, latitude: e.target.value })}
                placeholder="43.7347" />
            </div>

            <div>
              <label>Longitude</label>
              <input type="number" step="0.0001" value={form.longitude}
                onChange={e => setForm({ ...form, longitude: e.target.value })}
                placeholder="7.4206" />
            </div>
          </div>
          <p style={{
            fontSize: 11, color: 'var(--text-dim)',
            marginTop: 8, fontStyle: 'italic',
          }}>
            💡 Récupère les coordonnées sur <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" style={{ color: 'var(--f1-red)' }}>Google Maps</a> (clic droit → copier les coordonnées).
          </p>

          {/* ============ PHOTO ============ */}
          <div style={{ marginTop: 24 }}>
            <label>🖼️ Photo du circuit</label>
            <div style={{
              padding: 16,
              background: 'rgba(20,20,26,0.6)',
              border: `2px dashed ${form.imageUrl ? 'var(--f1-red)' : 'var(--border)'}`,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              {form.imageUrl ? (
                <>
                  <img src={imgSrc(form.imageUrl)} alt="Circuit"
                    style={{
                      height: 120, width: 200, objectFit: 'cover',
                      borderRadius: 6, border: '2px solid var(--f1-red)',
                    }}
                    onError={e => { e.target.style.display = 'none'; }} />
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{
                      fontSize: 12, color: 'var(--text-mid)',
                      marginBottom: 8, wordBreak: 'break-all',
                    }}>✅ Image uploadée</div>
                    <button type="button" className="danger"
                      onClick={() => setForm({ ...form, imageUrl: '' })}
                      style={{ padding: '6px 12px', fontSize: 11 }}>
                      ✖ Retirer
                    </button>
                  </div>
                </>
              ) : (
                <div style={{
                  fontSize: 12, color: 'var(--text-dim)',
                  fontStyle: 'italic', flex: 1,
                }}>
                  Aucune image
                </div>
              )}

              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 18px',
                background: uploading ? '#333' : 'var(--f1-red)',
                color: '#fff', borderRadius: 6,
                cursor: uploading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: 12, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 0,
              }}>
                {uploading ? (
                  <>
                    <span style={{
                      width: 12, height: 12,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Envoi...
                  </>
                ) : (
                  <>
                    📁 {form.imageUrl ? 'Changer' : 'Choisir une image'}
                  </>
                )}
                <input type="file" accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  style={{ display: 'none' }} />
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

      {/* TABLEAU */}
      <table>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Circuit</th>
            <th>Drapeau</th>
            <th>Pays</th>
            <th>Longueur</th>
            <th>Virages</th>
            <th>1er GP</th>
            <th>Meilleur tour</th>
            <th>Architecte</th>
            <th>Coût</th>
            <th>Coords</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {circuits.map(c => (
            <tr key={c.id}>
              <td>
                {c.imageUrl ? (
                  <img src={imgSrc(c.imageUrl)} alt={c.name}
                    style={{
                      height: 44, width: 66, objectFit: 'cover',
                      borderRadius: 4,
                      border: '2px solid var(--f1-red)',
                    }}
                    onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{
                    height: 44, width: 66,
                    background: '#222', borderRadius: 4,
                    display: 'grid', placeItems: 'center',
                    fontSize: 18, color: '#666',
                  }}>🛣️</div>
                )}
              </td>
              <td><strong>{c.name}</strong></td>
              <td>
                {c.countryCode ? (
                  <img
                    src={`https://flagcdn.com/w40/${c.countryCode.toLowerCase()}.png`}
                    alt={c.countryCode}
                    className="waving-flag"
                    style={{ height: 22, width: 'auto', padding: '0 1px' }}
                  />
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>
                )}
              </td>
              <td style={{ color: 'var(--text-mid)' }}>{c.country || '—'}</td>
              <td className="mono" style={{
                color: 'var(--f1-red)', fontWeight: 700,
              }}>
                {c.lengthKm ? `${c.lengthKm} km` : '—'}
              </td>
              <td className="mono" style={{
                color: '#ff8700', fontWeight: 700,
              }}>
                {c.numberOfTurns ?? '—'}
              </td>
              <td className="mono" style={{ color: 'var(--text-mid)' }}>
                {c.firstGrandPrix || '—'}
              </td>
              <td className="mono" style={{
                color: '#00d26a', fontWeight: 700,
              }}>
                {c.fastestLapTime || '—'}
              </td>
              <td style={{ color: 'var(--text-mid)', fontSize: 13 }}>
                {c.architect || '—'}
              </td>
              <td style={{ color: 'var(--text-mid)', fontSize: 13 }}>
                {c.constructionCost || '—'}
              </td>
              <td className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                {c.latitude != null && c.longitude != null
                  ? `${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)}`
                  : '—'}
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button className="secondary sm" onClick={() => edit(c)}
                  style={{ marginRight: 6 }}>
                  ✏️ Modifier
                </button>
                <button className="danger" onClick={() => remove(c.id)}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
          {circuits.length === 0 && (
            <tr>
              <td colSpan="12" style={{
                textAlign: 'center', color: 'var(--text-dim)', padding: 40,
              }}>
                Aucun circuit enregistré
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}