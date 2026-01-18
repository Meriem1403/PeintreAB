import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
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
      className="contact-form-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="contact-form-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="contact-form-header">
          <h2>Cette œuvre m'intéresse</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {work && (
          <div className="contact-work-info">
            <h3>{work.titre}</h3>
            {work.prix && !work.is_sold && (
              <p className="work-price">Prix: {work.prix}€</p>
            )}
          </div>
        )}

        {success ? (
          <div className="contact-form-success">
            <p>✅ Votre message a été envoyé avec succès !</p>
            <p>Alexandre Bindl vous répondra dans les plus brefs délais.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Votre nom"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre@email.com"
              />
            </div>

            <div className="form-group">
              <label>Message *</label>
              <textarea
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