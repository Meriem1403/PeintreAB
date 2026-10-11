import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import {
  DEFAULT_ADMIN_TAB,
  adminTabPath,
  isFixedAdminTab,
  isValidAdminTab,
  rememberAdminTab,
} from '../constants/adminRoutes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLogOut,
  FiMail,
  FiExternalLink,
  FiImage,
  FiCalendar,
  FiSun,
  FiDroplet,
  FiUser,
  FiPhone,
  FiMenu,
  FiX,
  FiUsers,
  FiMaximize2,
  FiGrid,
  FiLayers,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useWorks } from '../contexts/WorksContext';
import { useGalleryCategories } from '../contexts/GalleryCategoriesContext';
import { contactsAPI } from '../utils/apiService';
import WorkForm from '../components/WorkForm';
import WorkList from '../components/WorkList';
import InboxAdmin, { isUnread } from '../components/InboxAdmin';
import ArtistInfoForm from '../components/ArtistInfoForm';
import ContactInfoForm from '../components/ContactInfoForm';
import HeroSettingsForm from '../components/HeroSettingsForm';
import ThemeSettingsForm from '../components/ThemeSettingsForm';
import SiteQrSettingsForm from '../components/SiteQrSettingsForm';
import VisitorsAdmin from '../components/VisitorsAdmin';
import TicketScannerAdmin from '../components/TicketScannerAdmin';
import GalleryCategoriesAdmin from '../components/GalleryCategoriesAdmin';
import './Admin.css';
import '../styles/adminTypography.css';
import '../styles/adminResponsive.css';

const SITE_NAV = [
  {
    section: 'Site',
    items: [
      { id: 'hero-settings', label: 'Accueil', icon: FiSun },
      { id: 'theme-settings', label: 'Couleurs', icon: FiDroplet },
      { id: 'artist-info', label: 'Artiste', icon: FiUser },
      { id: 'contact-info', label: 'Contact', icon: FiPhone },
      { id: 'site-qr', label: 'QR site', icon: FiGrid },
    ],
  },
  {
    section: 'Messages',
    items: [{ id: 'notifications', label: 'Boîte de réception', icon: FiMail }],
  },
  {
    section: 'Public',
    items: [
      { id: 'visiteurs', label: 'Visiteurs & billets', icon: FiUsers },
      { id: 'scan', label: 'Scan entrée', icon: FiMaximize2 },
    ],
  },
];

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab: tabParam } = useParams();
  const { logout } = useAuth();
  const { categories, getLabel, isEventsSlug } = useGalleryCategories();
  const gallerySlugs = useMemo(() => categories.map((c) => c.slug), [categories]);
  const galleryTabSet = useMemo(() => new Set(gallerySlugs), [gallerySlugs]);

  const activeTab =
    tabParam && isValidAdminTab(tabParam, gallerySlugs) ? tabParam : DEFAULT_ADMIN_TAB;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const { works } = useWorks();

  const nav = useMemo(() => {
    const galleryItems = [
      { id: 'onglets-galerie', label: 'Onglets galerie', icon: FiLayers },
      ...categories.map((cat) => ({
        id: cat.slug,
        label: cat.label,
        icon: isEventsSlug(cat.slug) ? FiCalendar : FiImage,
      })),
    ];
    return [{ section: 'Galerie', items: galleryItems }, ...SITE_NAV];
  }, [categories, isEventsSlug]);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevUnreadRef = useRef(null);
  const notifyPermissionRef = useRef(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  useEffect(() => {
    rememberAdminTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const loadContacts = useCallback(async (silent = false) => {
    try {
      if (!silent) setContactsLoading(true);
      const data = await contactsAPI.getAll();
      setContacts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
      if (!silent) setContacts([]);
    } finally {
      if (!silent) setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const poll = () => loadContacts(true);
    const interval = setInterval(poll, 20000);
    const onFocus = () => loadContacts(true);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadContacts]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadContacts(true);
    }
  }, [activeTab, loadContacts]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const unreadCount = contacts.filter(isUnread).length;

  useEffect(() => {
    if (contactsLoading || prevUnreadRef.current === null) {
      prevUnreadRef.current = unreadCount;
      return;
    }
    if (unreadCount > prevUnreadRef.current && notifyPermissionRef.current === 'granted') {
      const delta = unreadCount - prevUnreadRef.current;
      try {
        new Notification('PeintreAB — nouveau message', {
          body:
            delta === 1
              ? 'Un message vient d’arriver dans la boîte de réception.'
              : `${delta} nouveaux messages dans la boîte de réception.`,
          tag: 'peintreab-inbox',
        });
      } catch {
        /* ignore */
      }
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, contactsLoading]);

  const requestBrowserNotify = async () => {
    if (typeof Notification === 'undefined') {
      alert('Les notifications navigateur ne sont pas disponibles sur ce navigateur.');
      return;
    }
    const perm = await Notification.requestPermission();
    notifyPermissionRef.current = perm;
    if (perm === 'granted') {
      new Notification('Alertes activées', {
        body: 'Vous serez prévenu lors de nouveaux messages (admin ouvert).',
        tag: 'peintreab-inbox-setup',
      });
    }
  };

  const selectTab = (tabId) => {
    if (!isValidAdminTab(tabId, gallerySlugs)) return;
    setSidebarOpen(false);
    if (tabId !== activeTab) {
      navigate(adminTabPath(tabId));
    }
    if (tabId === 'notifications') loadContacts();
  };

  const activeMeta = nav.flatMap((g) => g.items).find((i) => i.id === activeTab);
  const isGalleryWorksTab = galleryTabSet.has(activeTab);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (
    tabParam &&
    categories.length > 0 &&
    !isFixedAdminTab(tabParam) &&
    !galleryTabSet.has(tabParam)
  ) {
    return <Navigate to={adminTabPath(gallerySlugs[0] || DEFAULT_ADMIN_TAB)} replace />;
  }

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          className="admin-sidebar-close"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        >
          <FiX />
        </button>
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-mark">AB</span>
          <div>
            <strong>Atelier</strong>
            <span>Gestion du site</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Administration">
          {nav.map((group) => (
            <div key={group.section} className="admin-sidebar-group">
              <p className="admin-sidebar-group-title">{group.section}</p>
              <ul>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const count =
                    galleryTabSet.has(item.id) ? works[item.id]?.length ?? 0 : null;
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
        <header
          className={`admin-page-header${
            isGalleryWorksTab ? '' : ' admin-page-header--no-cta'
          }`}
        >
          <div className="admin-page-header__bar">
            <button
              type="button"
              className="admin-main-menu"
              aria-label="Ouvrir le menu"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu />
            </button>
            <h1 className="admin-page-header__title">
              {activeMeta?.label ?? getLabel(activeTab) ?? 'Administration'}
            </h1>
          </div>
          <p className="admin-page-header__desc">
            {isGalleryWorksTab
              ? 'Ajoutez, modifiez ou réorganisez les œuvres visibles sur le site.'
              : activeTab === 'onglets-galerie'
                ? 'Créez, renommez et réordonnez les onglets de la galerie (Peintures, Croquis…).'
                : activeTab === 'notifications'
                ? 'Messages du site — demandes d’achat, page Contact et œuvres. Actualisation automatique toutes les 20 s.'
                : activeTab === 'visiteurs'
                  ? 'Aperçu, inscrits, contacts et emails — par événement.'
                  : activeTab === 'scan'
                    ? 'Contrôle des billets en plein écran — caméra ou saisie manuelle.'
                    : 'Paramètres et contenus éditoriaux.'}
          </p>
          {isGalleryWorksTab && (
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
          className={`admin-main-body${
            activeTab === 'visiteurs' || activeTab === 'scan' || activeTab === 'notifications'
              ? ' admin-main-body--wide'
              : ''
          }${
            activeTab === 'visiteurs' || activeTab === 'scan' ? ' admin-main-body--flush' : ''
          }`}
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
                <InboxAdmin
                  contacts={contacts}
                  onUpdate={loadContacts}
                  onEnableBrowserNotify={requestBrowserNotify}
                />
              )
            ) : activeTab === 'artist-info' ? (
              <ArtistInfoForm />
            ) : activeTab === 'contact-info' ? (
              <ContactInfoForm />
            ) : activeTab === 'hero-settings' ? (
              <HeroSettingsForm />
            ) : activeTab === 'theme-settings' ? (
              <ThemeSettingsForm />
            ) : activeTab === 'site-qr' ? (
              <SiteQrSettingsForm />
            ) : activeTab === 'visiteurs' ? (
              <VisitorsAdmin />
            ) : activeTab === 'scan' ? (
              <TicketScannerAdmin />
            ) : activeTab === 'onglets-galerie' ? (
              <GalleryCategoriesAdmin />
            ) : isGalleryWorksTab ? (
              <WorkList
                type={activeTab}
                onEdit={(work) => {
                  setEditingWork(work);
                  setIsFormOpen(true);
                }}
              />
            ) : (
              <div className="admin-loading">
                <p>Onglet inconnu.</p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {isFormOpen && isGalleryWorksTab && (
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
