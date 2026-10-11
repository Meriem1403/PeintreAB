import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiLock, FiMail } from 'react-icons/fi';
import { smtpAPI } from '../utils/apiService';
import Seo from '../components/Seo';
import './Login.css';

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
      setError('Lien invalide — demandez un nouveau lien à votre développeur.');
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
          <h1>E-mail du site</h1>
          <p>
            Configurez l’envoi des messages (contact, billets, mot de passe oublié). Le mot de
            passe d’application reste chiffré côté serveur — personne d’autre ne le voit.
          </p>
        </div>

        {checking ? (
          <p className="login-form__success">Vérification du lien…</p>
        ) : done ? (
          <div className="login-form__success">
            <FiCheckCircle aria-hidden style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }} />
            <p>
              Configuration enregistrée{masked ? ` pour ${masked}` : ''}. Vous pouvez fermer cette
              page.
            </p>
            <Link to="/" className="login-form__link-btn btn-login">
              Retour au site
            </Link>
          </div>
        ) : !valid ? (
          <div>
            {error && <div className="error-message">{error}</div>}
            <p className="login-form__success">
              Demandez un nouveau lien depuis l’administration du site.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="app-form login-form">
            {error && <div className="error-message">{error}</div>}

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
              />
              {suggestedEmail && (
                <p className="login-form__success" style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                  Compte prévu : {suggestedEmail}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="setup-smtp-password" className="form-label-inline">
                <FiLock className="icon" aria-hidden />
                Mot de passe d’application
              </label>
              <input
                id="setup-smtp-password"
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="xxxx xxxx xxxx xxxx"
                minLength={8}
                required
              />
              <p className="login-form__success" style={{ marginTop: '0.45rem', fontSize: '0.8rem', lineHeight: 1.4 }}>
                Sur votre téléphone ou ordinateur : compte Google → Sécurité → Validation en 2
                étapes (activée) → Mots de passe des applications → créer « Site Peintre » → coller
                ici les 16 caractères.
              </p>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Enregistrement…' : 'Enregistrer en toute sécurité'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default SetupSmtpPage;
