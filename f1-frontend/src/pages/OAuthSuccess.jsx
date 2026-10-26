import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../api/axios';   // ✅ import centralisé

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({});
  const [strategyLog, setStrategyLog] = useState([]);

  useEffect(() => {
    const run = async () => {
      /* ============================================================ */
      /* 1. Récupération des params                                  */
      /* ============================================================ */
      const rawToken =
        params.get('token') ||
        params.get('access_token') ||
        params.get('accessToken') ||
        params.get('jwt');

      const rawUsername =
        params.get('username') ||
        params.get('user') ||
        params.get('name');

      const rawRole =
        params.get('role') ||
        params.get('authorities');

      const errCode =
        params.get('error') ||
        params.get('error_code');

      setDebug({
        url: window.location.href,
        search: window.location.search,
        hasToken: Boolean(rawToken),
        hasUsername: Boolean(rawUsername),
        hasRole: Boolean(rawRole),
        tokenLength: rawToken?.length || 0,
        tokenParts: rawToken?.split('.').length || 0,
        tokenHasSpaces: rawToken?.includes(' ') || false,
        tokenHasPlus: rawToken?.includes('+') || false,
        tokenPreview: rawToken
          ? rawToken.substring(0, 24) +
            '…' +
            rawToken.substring(Math.max(24, rawToken.length - 16))
          : null,
        apiBase: API_BASE,
      });

      /* ============================================================ */
      /* 2. Erreurs backend explicites                               */
      /* ============================================================ */
      if (errCode) {
        setStatus('error');
        setError(`Le backend a renvoyé une erreur : "${errCode}"`);
        return;
      }

      if (!rawToken || !rawUsername || !rawRole) {
        setStatus('error');
        setError(
          "L'URL ne contient pas les 3 params (token / username / role). " +
          "Le successHandler Spring doit les ajouter."
        );
        return;
      }

      /* ============================================================ */
      /* 3. Génère les variantes de décodage possibles               */
      /*    (bug classique : les "+" du JWT deviennent des espaces)  */
      /* ============================================================ */
      const rawCandidates = [
        { name: 'decodeURIComponent', value: safeDecode(rawToken) },
        { name: 'space → +', value: rawToken.replace(/ /g, '+') },
        { name: 'raw (non décodé)', value: rawToken },
        { name: 'decode + space→+', value: safeDecode(rawToken).replace(/ /g, '+') },
      ];

      const seen = new Set();
      const candidates = rawCandidates.filter(c => {
        if (!c.value || !c.value.includes('.')) return false;
        if (seen.has(c.value)) return false;
        seen.add(c.value);
        return true;
      });

      const decodedUsername = safeDecode(rawUsername);
      const decodedRole = safeDecode(rawRole);

      /* ============================================================ */
      /* 4. Teste chaque variante via fetch (pas d'axios requis)      */
      /* ============================================================ */
      const log = [];

      for (const candidate of candidates) {
        try {
          const res = await fetch(`${API_BASE}/api/fan/me`, {
            headers: { Authorization: `Bearer ${candidate.value}` },
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            log.push({
              strategy: candidate.name,
              ok: false,
              httpStatus: res.status,
              message: data.message || data.error || res.statusText,
            });
            setStrategyLog([...log]);
            console.warn(
              `[OAuthSuccess] ❌ ${candidate.name} →`,
              res.status,
              data.message || data.error || res.statusText
            );
            continue;
          }

          /* ✅ SUCCESS */
          log.push({ strategy: candidate.name, ok: true });
          setStrategyLog(log);

          localStorage.setItem('token', candidate.value);
          localStorage.setItem('username', decodedUsername);
          localStorage.setItem('role', decodedRole);

          console.log('[OAuthSuccess] ✅ Token validé avec :', candidate.name);

          setStatus('success');
          setTimeout(() => {
            navigate(
              decodedRole === 'ROLE_ADMIN' ? '/admin/drivers' : '/fan',
              { replace: true }
            );
          }, 700);
          return;
        } catch (err) {
          log.push({
            strategy: candidate.name,
            ok: false,
            httpStatus: undefined,
            message: err?.message,
          });
          setStrategyLog([...log]);
          console.warn(`[OAuthSuccess] ❌ ${candidate.name} →`, err?.message);
        }
      }

      /* ============================================================ */
      /* 5. Toutes les variantes ont échoué                          */
      /* ============================================================ */
      setStatus('error');
      setError(
        'Le token a été reçu mais le backend l\'a rejeté sur toutes les variantes. ' +
        'Voir le panneau technique ci-dessous.'
      );
    };

    run();
  }, [params, navigate]);

  /* ============================================================ */
  /* ============ RENDU ========================================= */
  /* ============================================================ */
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--f1-black)',
      padding: 20,
    }}>
      <div style={{
        maxWidth: 700,
        width: '100%',
        padding: 40,
        background: 'linear-gradient(160deg, rgba(13,13,20,0.98), rgba(5,7,10,0.98))',
        border: `1px solid ${
          status === 'error' ? 'rgba(255,85,85,0.4)'
          : status === 'success' ? 'rgba(0,210,106,0.4)'
          : 'rgba(225,6,0,0.4)'
        }`,
        borderRadius: 16,
        textAlign: 'center',
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.9)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: 60, height: 60, margin: '0 auto 24px',
              border: '3px solid rgba(225,6,0,0.3)',
              borderTopColor: '#e10600',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12, letterSpacing: '0.3em',
              color: 'var(--f1-red)', fontWeight: 700,
            }}>VALIDATION DU TOKEN...</div>
            <div style={{
              marginTop: 16,
              fontFamily: 'var(--font-heading)',
              fontSize: 13, color: 'var(--text-dim)',
            }}>
              Vérification de la signature JWT auprès du backend.
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✓</div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 24, fontWeight: 900,
              color: '#00d26a', textTransform: 'uppercase',
              marginBottom: 8,
            }}>Connexion réussie</div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 14, color: 'var(--text-dim)',
            }}>
              Token validé ✅ · Redirection vers ton espace...
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11, letterSpacing: '0.4em',
              color: '#ff5555', fontWeight: 700,
              marginBottom: 12,
            }}>◆ TOKEN REJETÉ ◆</div>

            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22, fontWeight: 900,
              color: '#fff', textTransform: 'uppercase',
              marginBottom: 16,
            }}>Le backend rejette le token</h2>

            <p style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 14, color: 'var(--text-mid)',
              lineHeight: 1.6, marginBottom: 24,
            }}>{error}</p>

            {/* Log des stratégies */}
            {strategyLog.length > 0 && (
              <div style={{
                marginBottom: 20,
                padding: 14,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: 11,
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 9, letterSpacing: '0.2em',
                  color: '#e10600', fontWeight: 700,
                  marginBottom: 10,
                }}>◆ STRATÉGIES TESTÉES</div>
                {strategyLog.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 10,
                    padding: '4px 0',
                    borderBottom: i < strategyLog.length - 1
                      ? '1px dashed rgba(255,255,255,0.05)'
                      : 'none',
                  }}>
                    <span style={{
                      color: s.ok ? '#00d26a' : '#ff5555',
                      minWidth: 20,
                    }}>{s.ok ? '✅' : '❌'}</span>
                    <span style={{ color: '#fff', flex: 1 }}>{s.strategy}</span>
                    {!s.ok && (
                      <span style={{
                        color: s.httpStatus === 401 ? '#ff5555'
                          : s.httpStatus === 403 ? '#ff8700'
                          : '#888',
                        fontSize: 10,
                      }}>
                        HTTP {s.httpStatus || '—'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Diagnostic */}
            <details style={{
              textAlign: 'left',
              padding: 16,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              marginBottom: 20,
              fontFamily: 'monospace',
              fontSize: 11,
            }}>
              <summary style={{
                cursor: 'pointer', color: '#e10600',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.15em',
                fontSize: 10, padding: '4px 0',
              }}>▼ DIAGNOSTIC URL & TOKEN</summary>
              <div style={{
                marginTop: 12, padding: 12,
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 6,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.7,
                wordBreak: 'break-all',
              }}>
                <div><span style={{ color: '#e10600' }}>URL :</span> {debug.url}</div>
                <div><span style={{ color: '#e10600' }}>API_BASE :</span> {debug.apiBase}</div>
                <div><span style={{ color: '#e10600' }}>Token length :</span> {debug.tokenLength}</div>
                <div><span style={{ color: '#e10600' }}>Token parts :</span> {debug.tokenParts} (attendu : 3)</div>
                <div><span style={{ color: '#e10600' }}>Espaces dans token :</span> {debug.tokenHasSpaces ? '⚠️ OUI (bug +/espace)' : 'non'}</div>
                <div><span style={{ color: '#e10600' }}>+ dans token :</span> {debug.tokenHasPlus ? '⚠️ OUI' : 'non'}</div>
                {debug.tokenPreview && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ color: '#e10600' }}>Aperçu :</span>
                    <pre style={{
                      margin: '4px 0 0',
                      whiteSpace: 'pre-wrap',
                      color: 'rgba(255,255,255,0.6)',
                    }}>{debug.tokenPreview}</pre>
                  </div>
                )}
              </div>
            </details>

            {/* Aide */}
            <div style={{
              textAlign: 'left',
              padding: '14px 18px',
              background: 'rgba(255,135,0,0.08)',
              border: '1px solid rgba(255,135,0,0.3)',
              borderLeft: '3px solid #ff8700',
              borderRadius: 8,
              fontFamily: 'var(--font-heading)',
              fontSize: 12, color: '#ffb86c',
              lineHeight: 1.7, marginBottom: 24,
            }}>
              <strong>🔍 Causes possibles :</strong>
              <ol style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li><strong>Secret JWT différent</strong> entre le module OAuth et le filtre JWT</li>
                <li><strong>Token expiré</strong> (vérifie le TTL côté backend)</li>
                <li><strong>Utilisateur non créé en DB</strong> après OAuth (le successHandler doit faire un upsert)</li>
                <li><strong>Bug URL-encode</strong> — les <code>+</code> du JWT deviennent des espaces (voir "Espaces dans token")</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/login', { replace: true })} style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #e10600, #b80500)',
                border: 'none', borderRadius: 8, color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: 12, fontWeight: 900,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(225,6,0,0.4)',
              }}>← Login</button>

              <button onClick={() => {
                window.location.href = `${API_BASE}/oauth2/authorization/google`;
              }} style={{
                padding: '14px 28px',
                background: 'transparent',
                border: '1.5px solid rgba(255,255,255,0.2)',
                borderRadius: 8, color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: 12, fontWeight: 900,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}>↻ Réessayer</button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ============================================================ */
/* ============ HELPER : decode safe ========================== */
/* ============================================================ */
function safeDecode(s) {
  if (!s) return s;
  try { return decodeURIComponent(s); }
  catch { return s; }
}