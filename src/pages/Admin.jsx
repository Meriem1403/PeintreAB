import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLogOut,
  FiMail,
  FiExternalLink,
  FiImage,
  FiEdit3,
  FiCalendar,
  FiSun,
  FiDroplet,
  FiUser,
  FiPhone,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useWorks } from '../contexts/WorksContext';
import { contactsAPI } from '../utils/apiService';
import WorkForm from '../components/WorkForm';
import WorkList from '../components/WorkList';
import ContactList from '../components/ContactList';
import ArtistInfoForm from '../components/ArtistInfoForm';
import ContactInfoForm from '../components/ContactInfoForm';
import HeroSettingsForm from '../components/HeroSettingsForm';
import ThemeSettingsForm from '../components/ThemeSettingsForm';
import './Admin.css';

const NAV = [
  {
    section: 'Galerie',
    items: [
      { id: 'peintures', label: 'Peintures', icon: FiImage },
      { id: 'croquis', label: 'Croquis', icon: FiEdit3 },
      { id: 'evenements', label: 'Événements', icon: FiCalendar },
    ],
  },
  {
    section: 'Site',
    items: [
      { id: 'hero-settings', label: 'Accueil', icon: FiSun },
      { id: 'theme-settings', label: 'Couleurs', icon: FiDroplet },
      { id: 'artist-info', label: 'Artiste', icon: FiUser },
      { id: 'contact-info', label: 'Contact', icon: FiPhone },
    ],
  },
  {
    section: 'Messages',
    items: [{ id: 'notifications', label: 'Boîte de réception', icon: FiMail }],
  },
];

const GALLERY_TABS = new Set(['peintures', 'croquis', 'evenements']);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

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

  const unreadCount = contacts.filter((c) => !c.read).length;

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'notifications') loadContacts();
  };

  const activeMeta = NAV.flatMap((g) => g.items).find((i) => i.id === activeTab);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-mark">AB</span>
          <div>
            <strong>Atelier</strong>
            <span>Gestion du site</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Administration">
          {NAV.map((group) => (
            <div key={group.section} className="admin-sidebar-group">
              <p className="admin-sidebar-group-title">{group.section}</p>
              <ul>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const count =
                    GALLERY_TABS.has(item.id) ? works[item.id]?.length ?? 0 : null;
                  const badge = item.id === 'notifications' && unreadCount > 0 ? unreadCount : null;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`admin-sidebar-link ${activeTab === item.id ? 'is-active' : ''}`}
                        onClick={() => selectTab(item.id)}
                      >
                        <Icon className="admin-sidebar-link-icon" aria-hidden />
                        <span className="admin-sidebar-link-label">{item.label}</span>
                        {count !== null && <span className="admin-sidebar-count">{count}</span>}
                        {badge !== null && <span className="admin-sidebar-badge">{badge}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <Link to="/galerie" className="admin-sidebar-foot-link">
            <FiExternalLink aria-hidden />
            Galerie publique
          </Link>
          <button type="button" className="admin-sidebar-foot-btn" onClick={handleLogout}>
            <FiLogOut aria-hidden />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-main-header">
          <div>
            <h1>{activeMeta?.label ?? 'Administration'}</h1>
            <p>
              {GALLERY_TABS.has(activeTab)
                ? 'Ajoutez, modifiez ou réorganisez les œuvres visibles sur le site.'
                : 'Paramètres et contenus éditoriaux.'}
            </p>
          </div>
          {GALLERY_TABS.has(activeTab) && (
            <motion.button
              type="button"
              className="admin-main-cta"
              onClick={() => {
                setEditingWork(null);
                setIsFormOpen(true);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Nouvelle entrée
            </motion.button>
          )}
        </header>

        <motion.div
          className="admin-main-body"
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'notifications' ? (
              contactsLoading ? (
                <div className="admin-loading">
                  <div className="loading-spinner" />
                  <p>Chargement…</p>
                </div>
              ) : (
                <ContactList contacts={contacts} onUpdate={loadContacts} />
              )
            ) : activeTab === 'artist-info' ? (
              <ArtistInfoForm />
            ) : activeTab === 'contact-info' ? (
              <ContactInfoForm />
            ) : activeTab === 'hero-settings' ? (
              <HeroSettingsForm />
            ) : activeTab === 'theme-settings' ? (
              <ThemeSettingsForm />
            ) : (
              <WorkList
                type={activeTab}
                onEdit={(work) => {
                  setEditingWork(work);
                  setIsFormOpen(true);
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {isFormOpen && GALLERY_TABS.has(activeTab) && (
          <WorkForm
            type={activeTab}
            work={editingWork}
            onClose={() => {
              setIsFormOpen(false);
              setEditingWork(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
