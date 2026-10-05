import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { DEFAULT_ATELIER_HERO_COPY, DEFAULT_ATELIER_SECTION_COPY } from '../constants/atelierHeroCopy';
import { siteSettingsAPI } from '../utils/apiService';
import { useWorks } from '../contexts/WorksContext';
import ImageDropzone from './ImageDropzone';
import './HeroSettingsForm.css';

const HeroSettingsForm = ({ onUpdate }) => {
  const { works, loading: worksLoading } = useWorks();
  const [formData, setFormData] = useState({
    hero_image: '',
    ...DEFAULT_ATELIER_HERO_COPY,
    ...DEFAULT_ATELIER_SECTION_COPY,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);

  useEffect(() => {
    loadSiteSettings();
  }, []);

  useEffect(() => {
    if (!worksLoading && works) {
      loadAvailableImages();
    }
  }, [works, worksLoading]);

  const loadSiteSettings = async () => {
    try {
      setLoading(true);
      const data = await siteSettingsAPI.get();
      setFormData({
        hero_image: data.hero_image || '/images/peintures/2025-2-le-cours.jpg',
        atelier_hero_eyebrow: data.atelier_hero_eyebrow ?? DEFAULT_ATELIER_HERO_COPY.atelier_hero_eyebrow,
        atelier_hero_title_line1:
          data.atelier_hero_title_line1 ?? DEFAULT_ATELIER_HERO_COPY.atelier_hero_title_line1,
        atelier_hero_title_line2_prefix:
          data.atelier_hero_title_line2_prefix ?? DEFAULT_ATELIER_HERO_COPY.atelier_hero_title_line2_prefix,
        atelier_hero_title_emphasis:
          data.atelier_hero_title_emphasis ?? DEFAULT_ATELIER_HERO_COPY.atelier_hero_title_emphasis,
        atelier_hero_lead_prefix:
          data.atelier_hero_lead_prefix ?? DEFAULT_ATELIER_HERO_COPY.atelier_hero_lead_prefix,
        atelier_hero_lead_emphasis:
          data.atelier_hero_lead_emphasis ?? DEFAULT_ATELIER_HERO_COPY.atelier_hero_lead_emphasis,
        atelier_hero_lead_suffix:
          data.atelier_hero_lead_suffix ?? DEFAULT_ATELIER_HERO_COPY.atelier_hero_lead_suffix,
        atelier_events_index:
          data.atelier_events_index ?? DEFAULT_ATELIER_SECTION_COPY.atelier_events_index,
        atelier_events_title:
          data.atelier_events_title ?? DEFAULT_ATELIER_SECTION_COPY.atelier_events_title,
        atelier_events_intro:
          data.atelier_events_intro ?? DEFAULT_ATELIER_SECTION_COPY.atelier_events_intro,
        atelier_works_index:
          data.atelier_works_index ?? DEFAULT_ATELIER_SECTION_COPY.atelier_works_index,
        atelier_works_title:
          data.atelier_works_title ?? DEFAULT_ATELIER_SECTION_COPY.atelier_works_title,
        atelier_works_intro:
          data.atelier_works_intro ?? DEFAULT_ATELIER_SECTION_COPY.atelier_works_intro,
      });
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres du site:', err);
      setError('Erreur lors du chargement des paramètres du site');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableImages = () => {
    const images = [];
    const seenPaths = new Set();
    
    // Parcourir toutes les catégories pour collecter les images
    if (works && typeof works === 'object') {
      Object.keys(works).forEach(category => {
        if (Array.isArray(works[category])) {
          works[category].forEach(work => {
            if (work && work.image && work.image.trim() !== '') {
              const imagePath = work.image.trim();
              // Normaliser le chemin pour éviter les doublons
              const normalizedPath = imagePath.toLowerCase();
              if (!seenPaths.has(normalizedPath)) {
                seenPaths.add(normalizedPath);
                images.push({
                  path: imagePath,
                  title: work.titre || 'Sans titre',
                  category: category,
                });
              }
            }
          });
        }
      });
    }
    
    console.log('🖼️ Images disponibles pour le hero:', images.length);
    setAvailableImages(images);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (imagePath) => {
    setFormData((prev) => ({ ...prev, hero_image: imagePath }));
  };

  const handleHeroImageChange = (url) => {
    setFormData((prev) => ({ ...prev, hero_image: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hero_image?.trim()) {
      setError('Indiquez une URL ou téléversez une image pour le hero.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      await siteSettingsAPI.update(formData);
      setSuccess(true);

      if (onUpdate) {
        onUpdate();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading || worksLoading) {
    return (
      <div className="hero-settings-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="hero-settings-form app-form-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2>Accueil Atelier</h2>
      <p className="form-description">
        Textes et image de la page d&apos;accueil (variante Atelier).
      </p>

      <form onSubmit={handleSubmit} className="app-form">
        <h3 className="hero-settings-section-title">Texte du hero</h3>
        <p className="form-description hero-settings-section-desc">
          Les mots en doré sur le site (« couleur », « carnet ») correspondent aux champs « mot
          mis en avant » ci-dessous.
        </p>

        <div className="form-group">
          <label htmlFor="atelier_hero_eyebrow">Sur-titre (ligne dorée)</label>
          <input
            id="atelier_hero_eyebrow"
            name="atelier_hero_eyebrow"
            type="text"
            value={formData.atelier_hero_eyebrow}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row hero-settings-form-row">
          <div className="form-group">
            <label htmlFor="atelier_hero_title_line1">Titre — 1re ligne</label>
            <input
              id="atelier_hero_title_line1"
              name="atelier_hero_title_line1"
              type="text"
              value={formData.atelier_hero_title_line1}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="atelier_hero_title_line2_prefix">
              Titre — 2e ligne (avant le mot en avant, ex. « dans la »)
            </label>
            <input
              id="atelier_hero_title_line2_prefix"
              name="atelier_hero_title_line2_prefix"
              type="text"
              value={formData.atelier_hero_title_line2_prefix}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="atelier_hero_title_emphasis">Titre — mot en avant (2e ligne)</label>
          <input
            id="atelier_hero_title_emphasis"
            name="atelier_hero_title_emphasis"
            type="text"
            value={formData.atelier_hero_title_emphasis}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="atelier_hero_lead_prefix">Chapô — début de phrase</label>
          <textarea
            id="atelier_hero_lead_prefix"
            name="atelier_hero_lead_prefix"
            rows={3}
            value={formData.atelier_hero_lead_prefix}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row hero-settings-form-row">
          <div className="form-group">
            <label htmlFor="atelier_hero_lead_emphasis">Chapô — mot en avant</label>
            <input
              id="atelier_hero_lead_emphasis"
              name="atelier_hero_lead_emphasis"
              type="text"
              value={formData.atelier_hero_lead_emphasis}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="atelier_hero_lead_suffix">Chapô — fin (2e ligne)</label>
            <input
              id="atelier_hero_lead_suffix"
              name="atelier_hero_lead_suffix"
              type="text"
              value={formData.atelier_hero_lead_suffix}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <h3 className="hero-settings-section-title">Section Agenda (événements)</h3>
        <p className="form-description hero-settings-section-desc">
          Filigrane vertical, titre principal et texte d&apos;introduction au-dessus du carrousel
          d&apos;événements.
        </p>

        <div className="form-row hero-settings-form-row">
          <div className="form-group">
            <label htmlFor="atelier_events_index">Filigrane (décoratif)</label>
            <input
              id="atelier_events_index"
              name="atelier_events_index"
              type="text"
              value={formData.atelier_events_index}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="atelier_events_title">Titre de section</label>
            <input
              id="atelier_events_title"
              name="atelier_events_title"
              type="text"
              value={formData.atelier_events_title}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="atelier_events_intro">Introduction</label>
          <textarea
            id="atelier_events_intro"
            name="atelier_events_intro"
            rows={3}
            value={formData.atelier_events_intro}
            onChange={handleChange}
            required
          />
        </div>

        <h3 className="hero-settings-section-title">Section Sélection (œuvres)</h3>
        <p className="form-description hero-settings-section-desc">
          Même principe pour le carrousel des œuvres mises en avant.
        </p>

        <div className="form-row hero-settings-form-row">
          <div className="form-group">
            <label htmlFor="atelier_works_index">Filigrane (décoratif)</label>
            <input
              id="atelier_works_index"
              name="atelier_works_index"
              type="text"
              value={formData.atelier_works_index}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="atelier_works_title">Titre de section</label>
            <input
              id="atelier_works_title"
              name="atelier_works_title"
              type="text"
              value={formData.atelier_works_title}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="atelier_works_intro">Introduction</label>
          <textarea
            id="atelier_works_intro"
            name="atelier_works_intro"
            rows={3}
            value={formData.atelier_works_intro}
            onChange={handleChange}
            required
          />
        </div>

        <h3 className="hero-settings-section-title">Image de fond</h3>
        <div className="form-group">
          <label htmlFor="hero_image">URL ou chemin de l&apos;image</label>
          <input
            id="hero_image"
            name="hero_image"
            type="text"
            value={formData.hero_image}
            onChange={handleChange}
            placeholder="/images/peintures/nom-image.jpg"
          />
          <small className="field-hint">
            Chemin relatif (ex. /images/peintures/image.jpg) ou URL complète
          </small>
        </div>

        <ImageDropzone
          value={formData.hero_image}
          onChange={handleHeroImageChange}
          folder="uploads"
          label="Téléverser une image"
          hint="Glissez-déposez ou parcourez — PNG, JPG, WebP — 10 Mo max. L&apos;image est enregistrée sur le serveur."
        />

        <div className="form-group hero-settings-gallery-picker">
          <label>Ou sélectionner une image existante</label>
          <div className="image-selector">
            {worksLoading ? (
              <p className="selector-empty">Chargement des images…</p>
            ) : availableImages.length > 0 ? (
              <>
                <p className="selector-meta">
                  {availableImages.length} image{availableImages.length > 1 ? 's' : ''} disponible{availableImages.length > 1 ? 's' : ''}
                </p>
                <div className="image-grid">
                  {availableImages.slice(0, 30).map((img, index) => (
                    <div
                      key={`${img.path}-${index}`}
                      className={`image-option ${formData.hero_image === img.path ? 'selected' : ''}`}
                      onClick={() => handleImageSelect(img.path)}
                    >
                      <img src={img.path} alt={img.title} onError={(e) => {
                        console.error('Erreur de chargement image:', img.path);
                        e.target.style.display = 'none';
                      }} />
                      <div className="image-overlay">
                        <span className="image-title">{img.title}</span>
                        <span className="image-category">{img.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="selector-empty">
                Aucune image disponible. Ajoutez d&apos;abord des œuvres avec des images.
              </p>
            )}
          </div>
        </div>

        {formData.hero_image && (
          <div className="form-group">
            <label>Aperçu</label>
            <div className="hero-preview">
              <div
                className="preview-image"
                style={{ backgroundImage: `url(${formData.hero_image})` }}
              />
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            <FaCheckCircle /> Paramètres sauvegardés avec succès !
          </div>
        )}

        <div className="form-actions">
          <motion.button
            type="submit"
            className="btn-save"
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default HeroSettingsForm;
