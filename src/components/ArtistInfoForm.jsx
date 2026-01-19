import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { artistAPI } from '../utils/apiService';
import './ArtistInfoForm.css';

const ArtistInfoForm = ({ onUpdate }) => {
  const [photo, setPhoto] = useState('');
  const [biographie, setBiographie] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadArtistInfo();
  }, []);

  const loadArtistInfo = async () => {
    try {
      setLoading(true);
      const data = await artistAPI.get();
      setPhoto(data.photo || '/images/accueil.jpg');
      setBiographie(data.biographie || '');
    } catch (err) {
      console.error('Erreur lors du chargement des informations:', err);
      setError('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess(false);
      
      await artistAPI.update({ photo, biographie });
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

  if (loading) {
    return (
      <div className="artist-info-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des informations...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="artist-info-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2>Informations artiste</h2>
      <p className="form-description">
        Gérez votre photo et votre biographie qui apparaissent sur la page Biographie.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="photo">Photo (chemin relatif)</label>
          <input
            id="photo"
            type="text"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="/images/accueil.jpg"
            required
          />
          <small>Exemple: /images/accueil.jpg (doit être dans le dossier public/images)</small>
          {photo && (
            <div className="photo-preview">
              <img src={photo} alt="Aperçu" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="biographie">Biographie</label>
          <textarea
            id="biographie"
            value={biographie}
            onChange={(e) => setBiographie(e.target.value)}
            rows={12}
            placeholder="Votre biographie..."
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            <FaCheckCircle /> Informations sauvegardées avec succès !
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

export default ArtistInfoForm;
