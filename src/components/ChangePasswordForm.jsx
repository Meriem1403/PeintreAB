import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/apiService';
import PasswordInput from './PasswordInput';
import '../pages/Login.css';

const ChangePasswordForm = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setMessage('Mot de passe mis à jour. Déconnexion…');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setTimeout(() => {
        logout();
        navigate('/login', { replace: true, state: { resetOk: true } });
      }, 900);
    } catch (err) {
      setError(err.message || 'Changement impossible');
      setLoading(false);
    }
  };

  return (
    <section className="smtp-card" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
        <FiLock aria-hidden />
        Mot de passe admin
      </h2>
      <p style={{ marginTop: 0, color: '#57534e', lineHeight: 1.5 }}>
        Après enregistrement vous serez déconnecté — reconnectez-vous avec le nouveau mot de
        passe.
      </p>

      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="error-message">{error}</div>}
        {message && (
          <p className="login-form__success" role="status">
            {message}
          </p>
        )}

        <div className="form-group">
          <label htmlFor="current-password">Mot de passe actuel</label>
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="admin-new-password">Nouveau mot de passe</label>
          <PasswordInput
            id="admin-new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="admin-confirm-password">Confirmer</label>
          <PasswordInput
            id="admin-confirm-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <button type="submit" className="btn-login" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </section>
  );
};

export default ChangePasswordForm;
