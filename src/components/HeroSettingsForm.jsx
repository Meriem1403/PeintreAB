import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { siteSettingsAPI } from '../utils/apiService';
import { useWorks } from '../contexts/WorksContext';
import './HeroSettingsForm.css';

const HeroSettingsForm = ({ onUpdate }) => {
  const { works, loading: worksLoading } = useWorks();
  const [formData, setFormData] = useState({
    hero_image: '',
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          hero_image: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <h2>Image du Hero</h2>
      <p className="form-description">
        Choisissez l'image qui apparaîtra en arrière-plan de la section hero sur la page d'accueil.
      </p>

      <form onSubmit={handleSubmit} className="app-form">
        <div className="form-group">
          <label htmlFor="hero_image">URL de l'image</label>
          <input
            id="hero_image"
            name="hero_image"
            type="text"
            value={formData.hero_image}
            onChange={handleChange}
            placeholder="/images/peintures/nom-image.jpg"
            required
          />
          <small className="field-hint">
            Chemin relatif (ex. /images/peintures/image.jpg)
          </small>
        </div>

        <div className="form-group">
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
