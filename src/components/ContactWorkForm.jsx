import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import { contactsAPI } from '../utils/apiService';
import './ContactWorkForm.css';

const ContactWorkForm = ({ work, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await contactsAPI.create({
        name: formData.name,
        email: formData.email,
        subject: `Intérêt pour: ${work.titre}`,
        message: formData.message,
        work_id: work.id
      });
      
      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="form-modal-overlay contact-form-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="form-modal contact-form-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="form-modal-header contact-form-header">
          <h2>Cette œuvre m&apos;intéresse</h2>
          <button type="button" className="form-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        {work && (
          <div className="form-modal-aside contact-work-info">
            <h3>{work.titre}</h3>
            {work.prix && !work.is_sold && (
              <p className="work-price">Prix: {work.prix}€</p>
            )}
          </div>
        )}

        {success ? (
          <div className="contact-form-success">
            <p>
              <FaCheckCircle /> Votre message a été envoyé avec succès !
            </p>
            <p>Alexandre Bindl vous répondra dans les plus brefs délais.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="app-form form-modal-body contact-form">
            <div className="form-group">
              <label htmlFor="contact-name">Nom *</label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Votre nom"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-email">Email *</label>
              <input
                id="contact-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-message">Message *</label>
              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5"
                required
                placeholder="Votre message concernant cette œuvre..."
              />
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="form-actions">
              <motion.button
                type="button"
                onClick={onClose}
                className="btn-cancel"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Annuler
              </motion.button>
              <motion.button
                type="submit"
                className="btn-submit"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? 'Envoi...' : 'Envoyer'}
              </motion.button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ContactWorkForm;