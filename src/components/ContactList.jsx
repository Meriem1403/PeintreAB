import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaEnvelopeOpen, FaReply, FaTrash } from 'react-icons/fa';
import { FiMail } from 'react-icons/fi';
import { contactsAPI } from '../utils/apiService';
import ReplyModal from './ReplyModal';
import './ContactList.css';

const ContactList = ({ contacts, onUpdate }) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleMarkAsRead = async (contactId) => {
    try {
      await contactsAPI.markAsRead(contactId);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contact:', error);
      alert('Erreur lors de la mise à jour du message');
    }
  };

  const handleReply = (contact) => {
    setReplyingTo(contact);
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return;
    }

    try {
      setDeletingId(contactId);
      await contactsAPI.delete(contactId);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la suppression du contact:', error);
      alert('Erreur lors de la suppression du message');
    } finally {
      setDeletingId(null);
    }
  };

  const handleReplySuccess = () => {
    setReplyingTo(null);
    onUpdate();
  };

  if (contacts.length === 0) {
    return (
      <div className="admin-empty">
        <FiMail size={48} />
        <p>Aucun message pour le moment</p>
      </div>
    );
  }

  return (
    <>
      <div className="contacts-list">
        {contacts.map((contact) => (
          <motion.div
            key={contact.id}
            className={`contact-item ${!contact.read ? 'unread' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="contact-header">
              <div className="contact-header-left">
                {!contact.read ? (
                  <FaEnvelope className="contact-icon unread-icon" />
                ) : (
                  <FaEnvelopeOpen className="contact-icon" />
                )}
                <div>
                  <h3>{contact.name}</h3>
                  <p className="contact-email">{contact.email}</p>
                </div>
              </div>
              <div className="contact-actions">
                {!contact.read && (
                  <button
                    className="action-btn mark-read-btn"
                    onClick={() => handleMarkAsRead(contact.id)}
                    title="Marquer comme lu"
                  >
                    Marquer comme lu
                  </button>
                )}
                <button
                  className="action-btn reply-btn"
                  onClick={() => handleReply(contact)}
                  title="Répondre"
                >
                  <FaReply /> Répondre
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(contact.id)}
                  disabled={deletingId === contact.id}
                  title="Supprimer"
                >
                  <FaTrash /> {deletingId === contact.id ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
            
            {contact.work_titre && (
              <div className="contact-work-ref">
                <strong>Œuvre concernée:</strong> {contact.work_titre}
                {contact.work_prix && !contact.is_sold && (
                  <span className="work-ref-price"> ({contact.work_prix}€)</span>
                )}
              </div>
            )}
            
            {contact.subject && (
              <div className="contact-subject">
                <strong>Sujet:</strong> {contact.subject}
              </div>
            )}
            
            <div className="contact-message">
              {contact.message}
            </div>
            
            <div className="contact-date">
              {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {replyingTo && (
          <ReplyModal
            contact={replyingTo}
            onClose={() => setReplyingTo(null)}
            onSuccess={handleReplySuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ContactList;
