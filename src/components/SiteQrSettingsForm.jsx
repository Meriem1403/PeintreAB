import { useCallback, useEffect, useMemo, useState } from 'react';
import { siteSettingsAPI } from '../utils/apiService';
import { useWorks } from '../contexts/WorksContext';
import './SiteQrSettingsForm.css';

const isLocalOrPrivateHost = (urlString) => {
  try {
    const { hostname } = new URL(urlString);
    const host = hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
    if (host.endsWith('.local')) return true;
    if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
    if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)) return true;
    return false;
  } catch {
    return true;
  }
};

const SiteQrSettingsForm = () => {
  const { works } = useWorks();
  const events = useMemo(() => works.evenements || [], [works.evenements]);

  const [publicSiteUrl, setPublicSiteUrl] = useState('');
  const [qrPreview, setQrPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [leadEventId, setLeadEventId] = useState('');
  const [leadQrPreview, setLeadQrPreview] = useState(null);
  const [leadPreviewUrl, setLeadPreviewUrl] = useState('');
  const [leadQrLoading, setLeadQrLoading] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [copied, setCopied] = useState(false);

  /** Base publique uniquement — jamais localhost (un téléphone ne peut pas y accéder) */
  const publicBase = useMemo(() => {
    const raw = (publicSiteUrl || '').trim().replace(/\/$/, '');
    if (!raw) return '';
    try {
      const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      return parsed.href.replace(/\/$/, '');
    } catch {
      return '';
    }
  }, [publicSiteUrl]);

  const publicBaseUsable = Boolean(publicBase) && !isLocalOrPrivateHost(publicBase);

  const leadFormUrl = useMemo(() => {
    if (!publicBaseUsable) return '';
    const path = leadEventId
      ? `/rejoindre?e=${encodeURIComponent(leadEventId)}`
      : '/rejoindre';
    return `${publicBase}${path}`;
  }, [publicBase, publicBaseUsable, leadEventId]);

  useEffect(() => {
    (async () => {
      try {
        const data = await siteSettingsAPI.get();
        const url = data.public_site_url || '';
        setPublicSiteUrl(url);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les paramètres.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshQr = useCallback(
    async (urlCandidate) => {
      const candidate = (urlCandidate ?? publicSiteUrl).trim();
      if (!candidate) {
        setQrPreview(null);
        setPreviewUrl('');
        return;
      }
      setQrLoading(true);
      setError('');
      try {
        const data = await siteSettingsAPI.getWebsiteQr(candidate);
        setQrPreview(data.qr_data_url);
        setPreviewUrl(data.url);
      } catch (err) {
        setQrPreview(null);
        setPreviewUrl('');
        setError(err.message || 'QR code indisponible pour cette URL.');
      } finally {
        setQrLoading(false);
      }
    },
    [publicSiteUrl]
  );

  const refreshLeadQr = useCallback(async (url) => {
    if (!url) {
      setLeadQrPreview(null);
      setLeadPreviewUrl('');
      return;
    }
    setLeadQrLoading(true);
    setLeadError('');
    try {
      const data = await siteSettingsAPI.getWebsiteQr(url);
      setLeadQrPreview(data.qr_data_url);
      setLeadPreviewUrl(data.url);
    } catch (err) {
      setLeadQrPreview(null);
      setLeadPreviewUrl('');
      setLeadError(err.message || 'QR formulaire indisponible.');
    } finally {
      setLeadQrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const t = setTimeout(() => {
      refreshQr(publicSiteUrl);
    }, 400);
    return () => clearTimeout(t);
  }, [publicSiteUrl, loading, refreshQr]);

  useEffect(() => {
    if (loading) return undefined;
    if (!leadFormUrl) {
      setLeadQrPreview(null);
      setLeadPreviewUrl('');
      return undefined;
    }
    const t = setTimeout(() => {
      refreshLeadQr(leadFormUrl);
    }, 400);
    return () => clearTimeout(t);
  }, [leadFormUrl, loading, refreshLeadQr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await siteSettingsAPI.update({ public_site_url: publicSiteUrl.trim() });
      await refreshQr(publicSiteUrl.trim());
      setMessage('URL enregistrée — les QR codes utilisent cette adresse de base.');
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const downloadPng = (dataUrl, filename) => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const copyLeadUrl = async () => {
    if (!leadPreviewUrl && !leadFormUrl) return;
    try {
      await navigator.clipboard.writeText(leadPreviewUrl || leadFormUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setLeadError('Copie impossible — sélectionnez l’URL manuellement.');
    }
  };

  if (loading) {
    return <p className="site-qr-loading">Chargement…</p>;
  }

  return (
    <div className="site-qr-form app-form app-form-panel">
      <form onSubmit={handleSubmit}>
        <h3 className="site-qr-section-title">Site</h3>

        <div className="form-group">
          <label htmlFor="public_site_url">Adresse publique (pas localhost)</label>
          <input
            id="public_site_url"
            name="public_site_url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://www.alexandre-bindl.fr"
            value={publicSiteUrl}
            onChange={(e) => setPublicSiteUrl(e.target.value)}
            required
          />
        </div>

        <div className="site-qr-preview" aria-live="polite">
          {qrLoading && <p className="site-qr-preview__status">Génération du QR…</p>}
          {!qrLoading && qrPreview && (
            <>
              <img src={qrPreview} alt="QR code vers le site" className="site-qr-preview__img" />
              <p className="site-qr-preview__url">{previewUrl}</p>
              {previewUrl && isLocalOrPrivateHost(previewUrl) && (
                <p className="site-qr-lead-warn">
                  Cette URL est locale (<code>localhost</code>). Un téléphone qui scanne ne pourra
                  pas ouvrir le site. Utilisez votre domaine public HTTPS.
                </p>
              )}
              <div className="site-qr-preview__actions">
                <button
                  type="button"
                  className="btn-save"
                  onClick={() => downloadPng(qrPreview, 'qr-code-site.png')}
                >
                  Télécharger PNG
                </button>
              </div>
            </>
          )}
          {!qrLoading && !qrPreview && !error && (
            <p className="site-qr-preview__status">Saisissez une URL pour prévisualiser le QR.</p>
          )}
        </div>

        {error && (
          <p className="site-qr-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="site-qr-success" role="status">
            {message}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={saving || qrLoading}>
            {saving ? 'Enregistrement…' : 'Enregistrer l’URL'}
          </button>
        </div>
      </form>

      <section className="site-qr-lead" aria-labelledby="site-qr-lead-title">
        <h3 id="site-qr-lead-title" className="site-qr-section-title">
          Contacts (salon / vernissage)
        </h3>

        {!publicBaseUsable && (
          <p className="site-qr-lead-warn" role="status">
            Pour que le scan fonctionne sur un téléphone, enregistrez d’abord une URL publique
            ci-dessus (ex. <code>https://www.alexandre-bindl.fr</code>), pas{' '}
            <code>http://localhost:5173</code>.
          </p>
        )}

        <div className="form-group">
          <label htmlFor="lead_event_id">Événement lié (optionnel)</label>
          <select
            id="lead_event_id"
            value={leadEventId}
            onChange={(e) => setLeadEventId(e.target.value)}
          >
            <option value="">Général — tous événements</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.titre}
              </option>
            ))}
          </select>
        </div>

        <div className="site-qr-preview site-qr-preview--lead" aria-live="polite">
          {leadQrLoading && <p className="site-qr-preview__status">Génération du QR…</p>}
          {!leadQrLoading && publicBaseUsable && leadQrPreview && (
            <>
              <img
                src={leadQrPreview}
                alt="QR code vers le formulaire contacts"
                className="site-qr-preview__img"
              />
              <p className="site-qr-preview__url">{leadPreviewUrl}</p>
              <div className="site-qr-preview__actions site-qr-preview__actions--row">
                <button
                  type="button"
                  className="btn-save"
                  onClick={() =>
                    downloadPng(
                      leadQrPreview,
                      leadEventId ? `qr-contacts-event-${leadEventId}.png` : 'qr-contacts.png'
                    )
                  }
                >
                  Télécharger PNG
                </button>
                <button type="button" className="site-qr-btn-secondary" onClick={copyLeadUrl}>
                  {copied ? 'Lien copié' : 'Copier le lien'}
                </button>
                <a
                  className="site-qr-btn-secondary"
                  href={leadPreviewUrl || leadFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tester le formulaire
                </a>
              </div>
            </>
          )}
          {!leadQrLoading && !publicBaseUsable && (
            <p className="site-qr-preview__status">
              QR contacts en attente d’une URL publique valide.
            </p>
          )}
        </div>

        {leadError && (
          <p className="site-qr-error" role="alert">
            {leadError}
          </p>
        )}
      </section>
    </div>
  );
};

export default SiteQrSettingsForm;
