import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import {
  DEFAULT_NAV_LABELS,
  NAV_LABEL_FIELDS,
  normalizeNavLabels,
} from '../constants/navLabels';
import { useTheme } from '../contexts/ThemeContext';
import { siteSettingsAPI } from '../utils/apiService';
import './HeroSettingsForm.css';
import './NavLabelsForm.css';

const NavLabelsForm = () => {
  const { refreshTheme } = useTheme();
  const [formData, setFormData] = useState(DEFAULT_NAV_LABELS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await siteSettingsAPI.get();
        if (!cancelled) setFormData(normalizeNavLabels(data));
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Impossible de charger les libellés du menu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const payload = normalizeNavLabels(formData);
      await siteSettingsAPI.update(payload);
      setFormData(payload);
      await refreshTheme();
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors de l’enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="hero-settings-loading">
        <p>Chargement des libellés…</p>
      </div>
    );
  }

  return (
    <motion.div
      className="hero-settings-form app-form-panel nav-labels-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <form className="app-form nav-labels-form" onSubmit={handleSubmit}>
        <ul className="nav-labels-list">
          {NAV_LABEL_FIELDS.map((field) => (
            <li className="nav-labels-list__item" key={field.key}>
              <div className="form-group">
                <label htmlFor={field.key}>
                  <span className="nav-labels-list__name">{DEFAULT_NAV_LABELS[field.key]}</span>
                  <span className="nav-labels-list__route">{field.routeHint}</span>
                </label>
                <input
                  id={field.key}
                  name={field.key}
                  type="text"
                  value={formData[field.key] || ''}
                  onChange={handleChange}
                  placeholder={DEFAULT_NAV_LABELS[field.key]}
                  maxLength={40}
                  required
                />
                <small className="field-hint">{field.hint}</small>
              </div>
            </li>
          ))}
        </ul>

        {error && <p className="form-error">{error}</p>}
        {success && (
          <p className="form-success" role="status">
            <FaCheckCircle aria-hidden /> Libellés enregistrés — le header est à jour.
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="brand-btn brand-btn--primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default NavLabelsForm;
