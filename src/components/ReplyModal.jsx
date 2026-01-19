import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import { contactsAPI } from '../utils/apiService';
import './ReplyModal.css';

const ReplyModal = ({ contact, onClose, onSuccess }) => {
  const [subject, setSubject] = useState(`Re: ${contact.subject || 'Votre message'}`);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Le message est requis');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess(false);
      await contactsAPI.reply(contact.id, {
        to: contact.email,
        subject,
        message,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la réponse:', err);
      setError(err.message || 'Erreur lors de l\'envoi de la réponse');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="reply-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="reply-modal-container"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="reply-modal-header">
            <h2>Répondre à {contact.name}</h2>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="reply-modal-info">
            <p><strong>De:</strong> {contact.email}</p>
            {contact.work_titre && (
              <p><strong>Œuvre concernée:</strong> {contact.work_titre}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="reply-modal-form">
            <div className="form-group">
              <label htmlFor="subject">Sujet</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                required
                placeholder="Votre réponse..."
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && (
              <div className="success-message">
                <FaCheckCircle /> Réponse envoyée avec succès !
              </div>
            )}

            <div className="reply-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={sending}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-send"
                disabled={sending || success || !message.trim()}
              >
                {sending ? 'Envoi...' : success ? 'Envoyé' : 'Envoyer la réponse'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReplyModal;
