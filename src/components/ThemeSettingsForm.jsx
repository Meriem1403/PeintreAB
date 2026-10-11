import { useCallback, useEffect, useState } from 'react';
import { FiBookmark, FiClock, FiTrash2 } from 'react-icons/fi';
import { siteSettingsAPI, themePalettesAPI } from '../utils/apiService';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeSettingsForm.css';

const DEFAULT_COLORS = {
  primary_color: '#C6AC8F',
  accent_color: '#B89A7A',
  navbar_color: '#C6AC8F',
};

const formatWhen = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ThemeSettingsForm = () => {
  const { refreshTheme } = useTheme();
  const [formData, setFormData] = useState(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [presets, setPresets] = useState([]);
  const [history, setHistory] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  const loadPalettes = useCallback(async () => {
    try {
      const [presetRows, historyRows] = await Promise.all([
        themePalettesAPI.listPresets(),
        themePalettesAPI.listHistory(),
      ]);
      setPresets(Array.isArray(presetRows) ? presetRows : []);
      setHistory(Array.isArray(historyRows) ? historyRows : []);
    } catch (error) {
      console.error('Erreur chargement palettes:', error);
    }
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await siteSettingsAPI.get();
        setFormData({
          primary_color: data.primary_color || DEFAULT_COLORS.primary_color,
          accent_color: data.accent_color || DEFAULT_COLORS.accent_color,
          navbar_color: data.navbar_color || DEFAULT_COLORS.navbar_color,
        });
        await loadPalettes();
      } catch (error) {
        console.error('Erreur chargement couleurs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [loadPalettes]);

  const handleColorChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyPalette = (palette) => {
    setFormData({
      primary_color: palette.primary_color,
      accent_color: palette.accent_color,
      navbar_color: palette.navbar_color,
    });
    setMessage('Palette chargée dans le formulaire — cliquez sur « Enregistrer les couleurs » pour l’appliquer au site.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await siteSettingsAPI.update(formData);
      await refreshTheme();
      await loadPalettes();
      setMessage('Couleurs mises à jour avec succès. Entrée ajoutée à l’historique.');
    } catch (error) {
      console.error('Erreur sauvegarde couleurs:', error);
      setMessage(error.message || 'Erreur lors de la sauvegarde des couleurs.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreset = async () => {
    setSavingPreset(true);
    setMessage('');
    try {
      await themePalettesAPI.createPreset({
        name: presetName.trim() || `Palette ${new Date().toLocaleDateString('fr-FR')}`,
        ...formData,
      });
      setPresetName('');
      await loadPalettes();
      setMessage('Palette enregistrée dans vos favoris.');
    } catch (error) {
      setMessage(error.message || 'Impossible d’enregistrer la palette.');
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = async (id) => {
    if (!window.confirm('Supprimer cette palette favorite ?')) return;
    try {
      await themePalettesAPI.deletePreset(id);
      await loadPalettes();
    } catch (error) {
      setMessage(error.message || 'Suppression impossible.');
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await themePalettesAPI.deleteHistory(id);
      await loadPalettes();
    } catch (error) {
      setMessage(error.message || 'Suppression impossible.');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Effacer tout l’historique des couleurs ?')) return;
    try {
      await themePalettesAPI.clearHistory();
      await loadPalettes();
      setMessage('Historique effacé.');
    } catch (error) {
      setMessage(error.message || 'Impossible d’effacer l’historique.');
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
        Enregistrez des palettes favorites pour les réutiliser, et consultez l’historique des
        changements appliqués au site.
      </p>

      <div className="theme-color-grid">
        <label className="theme-color-field">
          <span>Couleur principale</span>
          <input
            type="color"
            value={formData.primary_color}
            onChange={(e) => handleColorChange('primary_color', e.target.value)}
          />
          <input
            type="text"
            value={formData.primary_color}
            onChange={(e) => handleColorChange('primary_color', e.target.value)}
          />
        </label>

        <label className="theme-color-field">
          <span>Couleur accent (hover)</span>
          <input
            type="color"
            value={formData.accent_color}
            onChange={(e) => handleColorChange('accent_color', e.target.value)}
          />
          <input
            type="text"
            value={formData.accent_color}
            onChange={(e) => handleColorChange('accent_color', e.target.value)}
          />
        </label>

        <label className="theme-color-field">
          <span>Couleur navbar</span>
          <input
            type="color"
            value={formData.navbar_color}
            onChange={(e) => handleColorChange('navbar_color', e.target.value)}
          />
          <input
            type="text"
            value={formData.navbar_color}
            onChange={(e) => handleColorChange('navbar_color', e.target.value)}
          />
        </label>
      </div>

      <div className="theme-preview">
        <div className="theme-preview-card" style={{ borderColor: formData.primary_color }}>
          <button type="button" style={{ background: formData.primary_color }}>
            Bouton
          </button>
          <button type="button" style={{ background: formData.accent_color }}>
            Hover
          </button>
          <div className="theme-preview-navbar" style={{ background: formData.navbar_color }}>
            Navbar
          </div>
        </div>
      </div>

      <div className="theme-preset-save">
        <label className="theme-preset-save__field">
          <span>Nom de la palette (optionnel)</span>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="ex. Beige chaud, Automne…"
            maxLength={120}
          />
        </label>
        <button
          type="button"
          className="theme-palette-btn theme-palette-btn--soft"
          onClick={handleSavePreset}
          disabled={savingPreset}
        >
          <FiBookmark aria-hidden />
          {savingPreset ? 'Enregistrement…' : 'Enregistrer dans mes palettes'}
        </button>
      </div>

      {message && (
        <p
          className={`theme-settings-message ${message.includes('Erreur') || message.includes('Impossible') ? 'error-message' : 'success-message'}`}
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

      <section className="theme-palette-section" aria-labelledby="theme-presets-title">
        <div className="theme-palette-section__head">
          <h3 id="theme-presets-title">
            <FiBookmark aria-hidden /> Mes palettes
          </h3>
          <span className="theme-palette-section__hint">Cliquez pour charger dans le formulaire</span>
        </div>
        {presets.length === 0 ? (
          <p className="theme-palette-empty">Aucune palette favorite pour l’instant.</p>
        ) : (
          <ul className="theme-palette-list">
            {presets.map((preset) => (
              <li key={preset.id} className="theme-palette-card">
                <button
                  type="button"
                  className="theme-palette-card__main"
                  onClick={() => applyPalette(preset)}
                >
                  <span className="theme-palette-swatches" aria-hidden>
                    <i style={{ background: preset.primary_color }} />
                    <i style={{ background: preset.accent_color }} />
                    <i style={{ background: preset.navbar_color }} />
                  </span>
                  <span className="theme-palette-card__meta">
                    <strong>{preset.name}</strong>
                    <small>{formatWhen(preset.created_at)}</small>
                  </span>
                </button>
                <button
                  type="button"
                  className="theme-palette-card__delete"
                  onClick={() => handleDeletePreset(preset.id)}
                  aria-label={`Supprimer ${preset.name}`}
                >
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="theme-palette-section" aria-labelledby="theme-history-title">
        <div className="theme-palette-section__head">
          <h3 id="theme-history-title">
            <FiClock aria-hidden /> Historique des couleurs appliquées
          </h3>
          {history.length > 0 && (
            <button type="button" className="theme-palette-link" onClick={handleClearHistory}>
              Tout effacer
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="theme-palette-empty">
            L’historique se remplit à chaque fois que vous enregistrez de nouvelles couleurs sur le
            site.
          </p>
        ) : (
          <ul className="theme-palette-list">
            {history.map((entry) => (
              <li key={entry.id} className="theme-palette-card">
                <button
                  type="button"
                  className="theme-palette-card__main"
                  onClick={() => applyPalette(entry)}
                >
                  <span className="theme-palette-swatches" aria-hidden>
                    <i style={{ background: entry.primary_color }} />
                    <i style={{ background: entry.accent_color }} />
                    <i style={{ background: entry.navbar_color }} />
                  </span>
                  <span className="theme-palette-card__meta">
                    <strong>Appliqué le {formatWhen(entry.created_at)}</strong>
                    <small>
                      {entry.primary_color} · {entry.accent_color} · {entry.navbar_color}
                    </small>
                  </span>
                </button>
                <button
                  type="button"
                  className="theme-palette-card__delete"
                  onClick={() => handleDeleteHistory(entry.id)}
                  aria-label="Supprimer cette entrée"
                >
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </form>
  );
};

export default ThemeSettingsForm;
