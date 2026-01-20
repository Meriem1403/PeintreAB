import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiMail } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useWorks } from '../contexts/WorksContext';
import { contactsAPI } from '../utils/apiService';
import WorkForm from '../components/WorkForm';
import WorkList from '../components/WorkList';
import ContactList from '../components/ContactList';
import ArtistInfoForm from '../components/ArtistInfoForm';
import ContactInfoForm from '../components/ContactInfoForm';
import HeroSettingsForm from '../components/HeroSettingsForm';
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


  const tabs = [
    { id: 'peintures', label: 'Peintures' },
    { id: 'croquis', label: 'Croquis' },
    { id: 'evenements', label: 'Événements' },
    { id: 'hero-settings', label: 'Hero' },
    { id: 'artist-info', label: 'Informations artiste' },
    { id: 'contact-info', label: 'Contact' },
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
        </div>
        <motion.button
          className="btn-logout"
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FiLogOut />
          Déconnexion
        </motion.button>
      </motion.div>

      <div className="admin-tabs-wrapper">
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
              ) : tab.id === 'artist-info' || tab.id === 'contact-info' || tab.id === 'hero-settings' ? (
                tab.label
              ) : (
                `${tab.label} (${works[tab.id]?.length || 0})`
              )}
            </motion.button>
          ))}
        </motion.div>
        {activeTab !== 'artist-info' && activeTab !== 'contact-info' && activeTab !== 'notifications' && activeTab !== 'hero-settings' && (
          <motion.button
            className="btn-add"
            onClick={handleAdd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            + Ajouter une œuvre
          </motion.button>
        )}
      </div>

      <motion.div
        className="admin-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        key={`content-${location.pathname}`}
      >

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
              ) : (
                <ContactList contacts={contacts} onUpdate={loadContacts} />
              )}
            </motion.div>
          ) : activeTab === 'artist-info' ? (
            <motion.div
              key="artist-info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ArtistInfoForm />
            </motion.div>
          ) : activeTab === 'contact-info' ? (
            <motion.div
              key="contact-info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ContactInfoForm />
            </motion.div>
          ) : activeTab === 'hero-settings' ? (
            <motion.div
              key="hero-settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <HeroSettingsForm />
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
