import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiLock, FiMail } from 'react-icons/fi';
import { smtpAPI } from '../utils/apiService';
import PasswordInput from '../components/PasswordInput';
import Seo from '../components/Seo';
import './Login.css';

const looksLikePlaceholder = (value) => {
  const cleaned = String(value || '').replace(/\s+/g, '').toLowerCase();
  return !cleaned || /^x+$/i.test(cleaned) || cleaned.includes('xxxx');
};

const SetupSmtpPage = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [suggestedEmail, setSuggestedEmail] = useState('alexandre.bindl@gmail.com');
  const [email, setEmail] = useState('alexandre.bindl@gmail.com');
  const [appPassword, setAppPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [masked, setMasked] = useState('');

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setValid(false);
      setError('Lien invalide — demandez un nouveau lien depuis l’admin.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await smtpAPI.validateSetupToken(token);
        if (cancelled) return;
        setValid(Boolean(data.valid));
        if (data.suggestedEmail) {
          setSuggestedEmail(data.suggestedEmail);
          setEmail(data.suggestedEmail);
        }
      } catch (err) {
        if (cancelled) return;
        setValid(false);
        setError(err.message || 'Lien invalide ou expiré');
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (looksLikePlaceholder(appPassword)) {
      setError(
        'Collez le vrai mot de passe d’application Google (16 caractères), pas le texte d’exemple « xxxx » et pas votre mot de passe Gmail habituel.'
      );
      return;
    }
    if (appPassword.replace(/\s+/g, '').length < 16) {
      setError('Un mot de passe d’application Google fait 16 caractères (espaces possibles).');
      return;
    }

    setLoading(true);
    try {
      const data = await smtpAPI.completeSetup(token, {
        user_email: email,
        app_password: appPassword,
      });
      setMasked(data.user_email_masked || '');
      setDone(true);
      setAppPassword('');
    } catch (err) {
      setError(err.message || 'Enregistrement impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Seo title="Configurer l’e-mail du site" path="/configurer-email" noIndex />
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-card-header">
          <h1>E-mails du site</h1>
          <p>
            Page réservée à <strong>Alexandre</strong> : brancher Gmail pour que le site puisse
            envoyer des messages (contact, billets, mot de passe oublié).
          </p>
        </div>

        {checking ? (
          <p className="login-form__success">Vérification du lien…</p>
        ) : done ? (
          <div className="login-form__success">
            <FiCheckCircle aria-hidden style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }} />
            <p>
              C’est enregistré{masked ? ` pour ${masked}` : ''}. Les e-mails du site partiront via
              Gmail. Vous pouvez fermer cette page.
            </p>
            <Link to="/" className="login-form__link-btn btn-login">
              Retour au site
            </Link>
          </div>
        ) : !valid ? (
          <div>
            {error && <div className="error-message">{error}</div>}
            <p className="login-form__success">
              {/trop/i.test(error)
                ? 'Attendez quelques minutes, puis rouvrez le même lien (ou demandez-en un nouveau).'
                : 'Demandez un nouveau lien dans l’admin → Compte & e-mail.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="app-form login-form">
            {error && <div className="error-message">{error}</div>}

            <ol className="login-form__steps">
              <li>
                Ouvrez{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mots de passe des applications
                </a>{' '}
                (compte Google {suggestedEmail || 'Gmail'}).
              </li>
              <li>La validation en 2 étapes doit être activée.</li>
              <li>
                Créez un mot de passe nommé <strong>Site Peintre</strong>, puis copiez les 16
                caractères.
              </li>
              <li>Collez-les ci-dessous et enregistrez.</li>
            </ol>

            <div className="form-group">
              <label htmlFor="setup-smtp-email" className="form-label-inline">
                <FiMail className="icon" aria-hidden />
                Adresse Gmail
              </label>
              <input
                id="setup-smtp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                style={{ fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="setup-smtp-password" className="form-label-inline">
                <FiLock className="icon" aria-hidden />
                Mot de passe d’application (16 caractères)
              </label>
              <PasswordInput
                id="setup-smtp-password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Coller ici (pas le mot de passe Gmail)"
                minLength={8}
                required
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default SetupSmtpPage;
