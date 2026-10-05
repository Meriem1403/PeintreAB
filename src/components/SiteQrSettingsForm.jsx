import { useCallback, useEffect, useState } from 'react';
import { siteSettingsAPI } from '../utils/apiService';
import './SiteQrSettingsForm.css';

const SiteQrSettingsForm = () => {
  const [publicSiteUrl, setPublicSiteUrl] = useState('');
  const [qrPreview, setQrPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  const refreshQr = useCallback(async (urlCandidate) => {
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
  }, [publicSiteUrl]);

  useEffect(() => {
    if (loading) return undefined;
    const t = setTimeout(() => {
      refreshQr(publicSiteUrl);
    }, 400);
    return () => clearTimeout(t);
  }, [publicSiteUrl, loading, refreshQr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await siteSettingsAPI.update({ public_site_url: publicSiteUrl.trim() });
      await refreshQr(publicSiteUrl.trim());
      setMessage('URL enregistrée — le QR code pointe vers cette adresse.');
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPng = () => {
    if (!qrPreview) return;
    const a = document.createElement('a');
    a.href = qrPreview;
    a.download = 'qr-code-site.png';
    a.click();
  };

  if (loading) {
    return <p className="site-qr-loading">Chargement…</p>;
  }

  return (
    <form className="site-qr-form app-form app-form-panel" onSubmit={handleSubmit}>
      <h2>QR code du site</h2>
      <p className="site-qr-intro app-form-intro">
        Générez un QR code vers l&apos;adresse de votre site (carte de visite, affiche, vernissage).
        Modifiez l&apos;URL ici si votre domaine change, puis enregistrez.
      </p>

      <div className="form-group">
        <label htmlFor="public_site_url">Adresse du site (URL)</label>
        <input
          id="public_site_url"
          name="public_site_url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://www.votre-site.fr"
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
            <div className="site-qr-preview__actions">
              <button type="button" className="btn-save" onClick={handleDownloadPng}>
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
  );
};

export default SiteQrSettingsForm;
