import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  adminTabPath,
  DEFAULT_ADMIN_TAB,
  isValidAdminTab,
} from '../constants/adminRoutes';
import { FiUser, FiLock } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resolveRedirect = () => {
    const from = location.state?.from;
    if (!from || typeof from !== 'string') return adminTabPath(DEFAULT_ADMIN_TAB);
    if (from === '/admin') return adminTabPath(DEFAULT_ADMIN_TAB);
    if (from.startsWith('/admin/')) {
      const tab = from.slice('/admin/'.length).split(/[/?#]/)[0];
      return isValidAdminTab(tab) ? adminTabPath(tab) : adminTabPath(DEFAULT_ADMIN_TAB);
    }
    return from;
  };
  const redirectPath = resolveRedirect();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigate(redirectPath, { replace: true });
    } else {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-card-header">
          <h1>Espace Administration</h1>
          <p>Connectez-vous pour gérer la galerie</p>
        </div>

        <form onSubmit={handleSubmit} className="app-form login-form">
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
            <label htmlFor="username" className="form-label-inline">
              <FiUser className="icon" aria-hidden />
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre nom d'utilisateur"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label-inline">
              <FiLock className="icon" aria-hidden />
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
            />
          </div>

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
