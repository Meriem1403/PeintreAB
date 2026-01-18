import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiMail } from 'react-icons/fi';
import { FaEnvelope, FaEnvelopeOpen } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useWorks } from '../contexts/WorksContext';
import { contactsAPI } from '../utils/apiService';
import WorkForm from '../components/WorkForm';
import WorkList from '../components/WorkList';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('peintures');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const { works, loading } = useWorks();
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  // Scroll en haut lors de l'ouverture de la page admin
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Charger les messages/contacts
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setContactsLoading(true);
      const data = await contactsAPI.getAll();
      setContacts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleMarkAsRead = async (contactId) => {
    try {
      await contactsAPI.markAsRead(contactId);
      setContacts(contacts.map(contact => 
        contact.id === contactId ? { ...contact, read: true } : contact
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contact:', error);
    }
  };

  const tabs = [
    { id: 'peintures', label: 'Peintures' },
    { id: 'croquis', label: 'Croquis' },
    { id: 'evenements', label: 'Événements' },
    { id: 'notifications', label: 'Notifications', icon: FiMail }
  ];

  const unreadCount = contacts.filter(c => !c.read).length;

  const handleAdd = () => {
    setEditingWork(null);
    setIsFormOpen(true);
  };

  const handleEdit = (work) => {
    setEditingWork(work);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWork(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin" key={location.pathname}>
      <motion.div
        className="admin-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        key={`header-${location.pathname}`}
      >
        <div className="admin-header-content">
          <div>
            <h1>Espace Administration</h1>
            <p>Gérez vos œuvres et événements</p>
          </div>
          <motion.button
            className="btn-logout"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiLogOut />
            Déconnexion
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="admin-tabs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        key={`tabs-${location.pathname}`}
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if (tab.id === 'notifications') {
                loadContacts();
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.id === 'notifications' ? (
              <>
                <FiMail /> Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
              </>
            ) : (
              `${tab.label} (${works[tab.id]?.length || 0})`
            )}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        className="admin-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        key={`content-${location.pathname}`}
      >
        <div className="admin-actions">
          <motion.button
            className="btn-add"
            onClick={handleAdd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            + Ajouter une œuvre
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'notifications' ? (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {contactsLoading ? (
                <div className="admin-loading">
                  <div className="loading-spinner"></div>
                  <p>Chargement des messages...</p>
                </div>
              ) : contacts.length === 0 ? (
                <div className="admin-empty">
                  <FiMail size={48} />
                  <p>Aucun message pour le moment</p>
                </div>
              ) : (
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
                        {!contact.read && (
                          <button
                            className="mark-read-btn"
                            onClick={() => handleMarkAsRead(contact.id)}
                            title="Marquer comme lu"
                          >
                            Marquer comme lu
                          </button>
                        )}
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
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`${activeTab}-${loading ? 'loading' : 'loaded'}-${location.pathname}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <WorkList type={activeTab} onEdit={handleEdit} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isFormOpen && (
          <WorkForm
            key={`form-${editingWork?.id || 'new'}`}
            type={activeTab}
            work={editingWork}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
