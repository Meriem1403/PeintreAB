import { useEffect, useState } from 'react';
import { FiCheck, FiCopy, FiLink, FiMail, FiShield } from 'react-icons/fi';
import { smtpAPI } from '../utils/apiService';
import PasswordInput from './PasswordInput';
import '../pages/Login.css';
import './SmtpSettingsForm.css';

const looksLikePlaceholder = (value) => {
  const cleaned = String(value || '').replace(/\s+/g, '').toLowerCase();
  return !cleaned || /^x+$/i.test(cleaned) || cleaned.includes('xxxx');
};

const SmtpSettingsForm = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [setupUrl, setSetupUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

    if (looksLikePlaceholder(appPassword)) {
      setError(
        'Ce n’est pas le bon champ : il faut un vrai « mot de passe d’application » Google (16 caractères), pas le texte xxxx ni votre mot de passe Gmail habituel.'
      );
      setSaving(false);
      return;
    }

    try {
      const data = await smtpAPI.update({
        user_email: userEmail,
        app_password: appPassword,
        from_email: fromEmail || userEmail,
      });
      setStatus(data);
      setAppPassword('');
      setMessage(data.message || 'Envoi d’e-mails configuré.');
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
      <section className="smtp-settings-card">
        <header className="smtp-settings-card-head">
          <FiMail aria-hidden />
          <div>
            <h3>À quoi ça sert ?</h3>
            <p>
              Ce n’est <strong>pas</strong> le mot de passe pour se connecter à l’admin.
              <br />
              C’est uniquement pour que le <strong>site puisse envoyer des e-mails</strong> via
              Gmail : messages de contact, billets d’événements, « mot de passe oublié ».
              <br />
              Sans cette config, ces e-mails n’arrivent pas dans une vraie boîte Gmail.
            </p>
          </div>
        </header>
        <p className="smtp-settings-status">
          {status?.configured
            ? `État : configuré (${status.user_email_masked || status.user_email})`
            : 'État : pas encore configuré — les e-mails du site ne partent pas vers Gmail.'}
        </p>
      </section>

      <section className="smtp-settings-card smtp-settings-card--secure">
        <header className="smtp-settings-card-head">
          <FiShield aria-hidden />
          <div>
            <h3>Méthode recommandée — lien pour Alexandre</h3>
            <p>
              Alexandre crée un « mot de passe d’application » dans son compte Google, puis le
              saisit sur une page sécurisée. Vous générez le lien ici et vous le lui envoyez
              (WhatsApp / Signal). Vous ne voyez jamais son secret.
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
          {linkLoading ? 'Création…' : 'Générer le lien pour Alexandre'}
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

        {message && !error && !showAdvanced && (
          <div className="success-message" style={{ marginTop: '1rem' }}>
            {message}
          </div>
        )}
        {error && !showAdvanced && (
          <div className="error-message" style={{ marginTop: '1rem' }}>
            {error}
          </div>
        )}
      </section>

      <section className="smtp-settings-card">
        <button
          type="button"
          className="smtp-settings-advanced-toggle"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? 'Masquer' : 'Afficher'} l’option avancée (si vous avez déjà le mot de
          passe d’application Google)
        </button>

        {showAdvanced && (
          <>
            <header className="smtp-settings-card-head" style={{ marginTop: '1rem' }}>
              <div>
                <h3>Configurer vous-même</h3>
                <p>
                  Uniquement si vous avez créé un{' '}
                  <strong>mot de passe d’application</strong> (16 caractères) dans le compte
                  Google du site — ce n’est <strong>pas</strong> votre mot de passe Gmail de
                  connexion, et ce n’est pas le texte « xxxx xxxx… » (c’est juste un exemple).
                </p>
              </div>
            </header>

            <form className="app-form smtp-settings-form" onSubmit={handleSave}>
              {error && <div className="error-message">{error}</div>}
              {message && !error && <div className="success-message">{message}</div>}

              <div className="form-group">
                <label htmlFor="smtp-email">Compte Gmail qui enverra les mails du site</label>
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
                <label htmlFor="smtp-from">Expéditeur affiché (optionnel)</label>
                <input
                  id="smtp-from"
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="Identique au Gmail par défaut"
                />
              </div>

              <div className="form-group">
                <label htmlFor="smtp-app-password">Mot de passe d’application Google</label>
                <PasswordInput
                  id="smtp-app-password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Coller les 16 caractères ici"
                  required
                  minLength={8}
                />
                <p className="form-hint">
                  Google → Sécurité → Validation en 2 étapes (obligatoire) → Mots de passe des
                  applications → créer « Site Peintre » → coller le code généré.
                </p>
              </div>

              <button
                type="submit"
                className="smtp-settings-btn smtp-settings-btn--primary"
                disabled={saving}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer l’envoi d’e-mails'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
};

export default SmtpSettingsForm;
