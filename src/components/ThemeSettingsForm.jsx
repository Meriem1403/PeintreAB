import { useEffect, useState } from 'react';
import { siteSettingsAPI } from '../utils/apiService';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeSettingsForm.css';

const ThemeSettingsForm = () => {
  const { refreshTheme } = useTheme();
  const [formData, setFormData] = useState({
    primary_color: '#C6AC8F',
    accent_color: '#B89A7A',
    navbar_color: '#C6AC8F',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await siteSettingsAPI.get();
        setFormData({
          primary_color: data.primary_color || '#C6AC8F',
          accent_color: data.accent_color || '#B89A7A',
          navbar_color: data.navbar_color || '#C6AC8F',
        });
      } catch (error) {
        console.error('Erreur chargement couleurs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleColorChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await siteSettingsAPI.update(formData);
      await refreshTheme();
      setMessage('Couleurs mises à jour avec succès.');
    } catch (error) {
      console.error('Erreur sauvegarde couleurs:', error);
      setMessage('Erreur lors de la sauvegarde des couleurs.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="theme-settings-loading">Chargement des couleurs...</p>;
  }

  return (
    <form className="theme-settings-form app-form app-form-panel" onSubmit={handleSubmit}>
      <h2>Couleurs de l&apos;application</h2>
      <p className="theme-settings-intro app-form-intro">
        Ces couleurs sont appliquées sur tout le site (boutons, navigation, accents, particules).
      </p>

      <div className="theme-color-grid">
        <label className="theme-color-field">
          <span>Couleur principale</span>
          <input type="color" value={formData.primary_color} onChange={(e) => handleColorChange('primary_color', e.target.value)} />
          <input type="text" value={formData.primary_color} onChange={(e) => handleColorChange('primary_color', e.target.value)} />
        </label>

        <label className="theme-color-field">
          <span>Couleur accent (hover)</span>
          <input type="color" value={formData.accent_color} onChange={(e) => handleColorChange('accent_color', e.target.value)} />
          <input type="text" value={formData.accent_color} onChange={(e) => handleColorChange('accent_color', e.target.value)} />
        </label>

        <label className="theme-color-field">
          <span>Couleur navbar</span>
          <input type="color" value={formData.navbar_color} onChange={(e) => handleColorChange('navbar_color', e.target.value)} />
          <input type="text" value={formData.navbar_color} onChange={(e) => handleColorChange('navbar_color', e.target.value)} />
        </label>
      </div>

      <div className="theme-preview">
        <div className="theme-preview-card" style={{ borderColor: formData.primary_color }}>
          <button type="button" style={{ background: formData.primary_color }}>Bouton</button>
          <button type="button" style={{ background: formData.accent_color }}>Hover</button>
          <div className="theme-preview-navbar" style={{ background: formData.navbar_color }}>Navbar</div>
        </div>
      </div>

      {message && (
        <p
          className={`theme-settings-message ${message.includes('Erreur') ? 'error-message' : 'success-message'}`}
          role="status"
        >
          {message}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="theme-settings-save btn-save" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer les couleurs'}
        </button>
      </div>
    </form>
  );
};

export default ThemeSettingsForm;
