import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import { authAPI } from '../utils/apiService';
import Seo from '../components/Seo';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setDone(true);
    } catch (err) {
      setError(err.message || 'Impossible d’envoyer la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Seo title="Mot de passe oublié" path="/forgot-password" noIndex />
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-card-header">
          <h1>Mot de passe oublié</h1>
          <p>Un lien de réinitialisation sera envoyé par e-mail si le compte existe.</p>
        </div>

        {done ? (
          <div className="login-form">
            <p className="login-form__success">
              Si un compte existe pour cet e-mail, un message vient d’être envoyé. Vérifiez votre
              boîte de réception (et les indésirables).
            </p>
            <Link to="/login" className="btn-login login-form__link-btn">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="app-form login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label-inline">
                <FiMail className="icon" aria-hidden />
                E-mail administrateur
              </label>
              <input
                type="email"
                id="forgot-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@gmail.com"
                autoComplete="username"
                required
              />
            </div>

            <motion.button
              type="submit"
              className="btn-login"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </motion.button>

            <p className="login-form__forgot">
              <Link to="/login">Retour à la connexion</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
