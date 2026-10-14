import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiLock } from 'react-icons/fi';
import { authAPI } from '../utils/apiService';
import PasswordInput from '../components/PasswordInput';
import Seo from '../components/Seo';
import './Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Lien invalide — demandez un nouveau e-mail de réinitialisation.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
      setPassword('');
      setConfirm('');
      setTimeout(() => {
        navigate('/login', { replace: true, state: { resetOk: true } });
      }, 2200);
    } catch (err) {
      setError(err.message || 'Réinitialisation impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Seo title="Nouveau mot de passe" path="/reset-password" noIndex />
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-card-header">
          <h1>Nouveau mot de passe</h1>
          <p>Choisissez un mot de passe d’au moins 8 caractères.</p>
        </div>

        {done ? (
          <div className="login-form__success" role="status">
            <FiCheckCircle aria-hidden style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }} />
            <p>
              Mot de passe enregistré avec succès. Redirection vers la connexion…
            </p>
            <Link to="/login" state={{ resetOk: true }} className="login-form__link-btn btn-login">
              Se connecter maintenant
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="app-form login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="new-password" className="form-label-inline">
                <FiLock className="icon" aria-hidden />
                Nouveau mot de passe
              </label>
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label-inline">
                <FiLock className="icon" aria-hidden />
                Confirmer
              </label>
              <PasswordInput
                id="confirm-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <motion.button
              type="submit"
              className="btn-login"
              disabled={loading || !token}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
            </motion.button>

            <p className="login-form__forgot">
              <Link to="/forgot-password">Renvoyer un lien</Link>
              {' · '}
              <Link to="/login">Connexion</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
