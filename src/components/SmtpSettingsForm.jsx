import { useEffect, useState } from 'react';
import { FiCheck, FiCopy, FiLink, FiMail, FiShield } from 'react-icons/fi';
import { smtpAPI } from '../utils/apiService';
import PasswordInput from './PasswordInput';
import '../pages/Login.css';
import './SmtpSettingsForm.css';

const SmtpSettingsForm = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [setupUrl, setSetupUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [userEmail, setUserEmail] = useState('alexandre.bindl@gmail.com');
  const [appPassword, setAppPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await smtpAPI.getStatus();
        setStatus(data);
        if (data.user_email) setUserEmail(data.user_email);
        if (data.from_email) setFromEmail(data.from_email);
      } catch (err) {
        setError(err.message || 'Impossible de charger la config e-mail.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await smtpAPI.update({
        user_email: userEmail,
        app_password: appPassword,
        from_email: fromEmail || userEmail,
      });
      setStatus(data);
      setAppPassword('');
      setMessage(data.message || 'Configuration enregistrée.');
    } catch (err) {
      setError(err.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLink = async () => {
    setLinkLoading(true);
    setError('');
    setMessage('');
    setCopied(false);
    try {
      const data = await smtpAPI.createSetupLink();
      setSetupUrl(data.setupUrl || '');
      setMessage(data.message || 'Lien créé.');
    } catch (err) {
      setError(err.message || 'Impossible de créer le lien');
    } finally {
      setLinkLoading(false);
    }
  };

  const copyLink = async () => {
    if (!setupUrl) return;
    try {
      await navigator.clipboard.writeText(setupUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copie impossible — sélectionnez le lien manuellement.');
    }
  };

  if (loading) {
    return (
      <div className="smtp-settings-loading">
        <div className="loading-spinner" />
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="smtp-settings">
      <section className="smtp-settings-card smtp-settings-card--secure">
        <header className="smtp-settings-card-head">
          <FiShield aria-hidden />
          <div>
            <h3>Lien sécurisé pour Alexandre</h3>
            <p>
              Générez un lien à usage unique (48 h). Envoyez-le par WhatsApp ou Signal. Il saisit
              son mot de passe d’application Gmail sur le site — vous ne le verrez jamais.
            </p>
          </div>
        </header>

        <button
          type="button"
          className="smtp-settings-btn smtp-settings-btn--primary"
          onClick={handleCreateLink}
          disabled={linkLoading}
        >
          <FiLink aria-hidden />
          {linkLoading ? 'Création…' : 'Générer un lien de configuration'}
        </button>

        {setupUrl && (
          <div className="smtp-settings-link-box">
            <code className="smtp-settings-link">{setupUrl}</code>
            <button type="button" className="smtp-settings-btn" onClick={copyLink}>
              {copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        )}
      </section>

      <section className="smtp-settings-card">
        <header className="smtp-settings-card-head">
          <FiMail aria-hidden />
          <div>
            <h3>État actuel</h3>
            <p>
              {status?.configured
                ? `Configuré — ${status.user_email_masked || status.user_email}`
                : 'Pas encore configuré (Mailpit en local, ou lien ci-dessus en production).'}
            </p>
          </div>
        </header>
      </section>

      <section className="smtp-settings-card">
        <header className="smtp-settings-card-head">
          <div>
            <h3>Configurer ici (admin uniquement)</h3>
            <p>
              Réservé si vous avez le mot de passe d’application. Sinon, utilisez uniquement le
              lien sécurisé. Le mot de passe n’est jamais réaffichable après enregistrement.
            </p>
          </div>
        </header>

        <form className="app-form smtp-settings-form" onSubmit={handleSave}>
          {error && <div className="error-message">{error}</div>}
          {message && !error && <div className="success-message">{message}</div>}

          <div className="form-group">
            <label htmlFor="smtp-email">Adresse Gmail</label>
            <input
              id="smtp-email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="smtp-from">Expéditeur (optionnel)</label>
            <input
              id="smtp-from"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="Identique à Gmail par défaut"
            />
          </div>

          <div className="form-group">
            <label htmlFor="smtp-app-password">Mot de passe d’application Google</label>
            <PasswordInput
              id="smtp-app-password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="xxxx xxxx xxxx xxxx"
              required
              minLength={8}
            />
            <p className="form-hint">
              Compte Google → Sécurité → Validation en 2 étapes → Mots de passe des applications.
            </p>
          </div>

          <button type="submit" className="smtp-settings-btn smtp-settings-btn--primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default SmtpSettingsForm;
