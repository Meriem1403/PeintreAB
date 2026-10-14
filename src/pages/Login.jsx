import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  adminTabPath,
  DEFAULT_ADMIN_TAB,
  isValidAdminTab,
} from '../constants/adminRoutes';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import Seo from '../components/Seo';
import './Login.css';

const safeAdminRedirect = (from) => {
  if (!from || typeof from !== 'string') return adminTabPath(DEFAULT_ADMIN_TAB);
  if (from === '/admin') return adminTabPath(DEFAULT_ADMIN_TAB);
  if (from.startsWith('/admin/')) {
    const tab = from.slice('/admin/'.length).split(/[/?#]/)[0];
    return isValidAdminTab(tab) ? adminTabPath(tab) : adminTabPath(DEFAULT_ADMIN_TAB);
  }
  return adminTabPath(DEFAULT_ADMIN_TAB);
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = safeAdminRedirect(location.state?.from);
  const resetOk = Boolean(location.state?.resetOk);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const result = await login(email.trim(), password);
    if (result?.ok) {
      navigate(redirectPath, { replace: true });
    } else {
      setError(result?.error || 'Identifiants incorrects');
    }
  };

  return (
    <div className="login-page">
      <Seo title="Connexion admin" path="/login" noIndex />
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-card-header">
          <h1>Espace Administration</h1>
          <p>Connectez-vous avec votre e-mail Gmail</p>
        </div>

        <form onSubmit={handleSubmit} className="app-form login-form">
          {resetOk && !error && (
            <p className="login-form__success">
              Mot de passe mis à jour. Connectez-vous avec votre e-mail.
            </p>
          )}
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label-inline">
              <FiMail className="icon" aria-hidden />
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@gmail.com"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label-inline">
              <FiLock className="icon" aria-hidden />
              Mot de passe
            </label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
              </button>
            </div>
          </div>

          <p className="login-form__forgot">
            <Link to="/forgot-password">Mot de passe oublié ?</Link>
          </p>

          <motion.button
            type="submit"
            className="btn-login"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Se connecter
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
