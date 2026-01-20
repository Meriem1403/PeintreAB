import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { contactInfoAPI } from '../utils/apiService';
import './ContactInfoForm.css';

const ContactInfoForm = ({ onUpdate }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    facebook_name: '',
    facebook_url: '',
    instagram_name: '',
    instagram_url: '',
    website_name: '',
    website_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      setLoading(true);
      const data = await contactInfoAPI.get();
      setFormData({
        email: data.email || '',
        phone: data.phone || '',
        facebook_name: data.facebook_name || '',
        facebook_url: data.facebook_url || '',
        instagram_name: data.instagram_name || '',
        instagram_url: data.instagram_url || '',
        website_name: data.website_name || '',
        website_url: data.website_url || ''
      });
    } catch (err) {
      console.error('Erreur lors du chargement des informations:', err);
      setError('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess(false);
      
      await contactInfoAPI.update(formData);
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
      <div className="contact-info-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des informations...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="contact-info-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2>Informations de contact</h2>
      <p className="form-description">
        Gérez les informations de contact qui apparaissent sur la page Contact.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Contact direct</h3>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alexandre.bindl@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
              placeholder="06 32 00 12 28"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Réseaux sociaux</h3>
          <div className="form-group">
            <label htmlFor="facebook_name">Nom Facebook</label>
            <input
              id="facebook_name"
              name="facebook_name"
              type="text"
              value={formData.facebook_name}
              onChange={handleChange}
              placeholder="Alexandre Bindl - Artiste Peintre"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="facebook_url">URL Facebook</label>
            <input
              id="facebook_url"
              name="facebook_url"
              type="url"
              value={formData.facebook_url}
              onChange={handleChange}
              placeholder="https://www.facebook.com/AlexandreBindlArtistePeintre"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="instagram_name">Nom Instagram</label>
            <input
              id="instagram_name"
              name="instagram_name"
              type="text"
              value={formData.instagram_name}
              onChange={handleChange}
              placeholder="Alexandre_Bindl"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="instagram_url">URL Instagram</label>
            <input
              id="instagram_url"
              name="instagram_url"
              type="url"
              value={formData.instagram_url}
              onChange={handleChange}
              placeholder="https://www.instagram.com/Alexandre_Bindl"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Site internet</h3>
          <div className="form-group">
            <label htmlFor="website_name">Nom du site</label>
            <input
              id="website_name"
              name="website_name"
              type="text"
              value={formData.website_name}
              onChange={handleChange}
              placeholder="www.alexandre-bindl.fr"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="website_url">URL du site</label>
            <input
              id="website_url"
              name="website_url"
              type="url"
              value={formData.website_url}
              onChange={handleChange}
              placeholder="http://www.alexandre-bindl.fr"
              required
            />
          </div>
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

export default ContactInfoForm;
