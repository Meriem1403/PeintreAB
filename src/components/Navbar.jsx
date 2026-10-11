import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resolveAdminLinkPath } from '../constants/adminRoutes';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu,
  FiX,
  FiHome,
  FiImage,
  FiBookOpen,
  FiMail,
  FiSettings,
} from 'react-icons/fi';
import './Navbar.css';

const NAV_ICONS = {
  home: FiHome,
  gallery: FiImage,
  bio: FiBookOpen,
  contact: FiMail,
  admin: FiSettings,
};

const Navbar = () => {
  const location = useLocation();
  const { navLabels } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const adminPath = useMemo(() => resolveAdminLinkPath(location.pathname), [location.pathname]);

  const hideChrome =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password' ||
    location.pathname === '/configurer-email' ||
    location.pathname.startsWith('/billet') ||
    location.pathname === '/rejoindre';

  const navItems = useMemo(
    () => [
      { id: 'home', path: '/', label: navLabels.nav_label_home },
      { id: 'gallery', path: '/galerie', label: navLabels.nav_label_gallery },
      { id: 'bio', path: '/biographie', label: navLabels.nav_label_bio },
      { id: 'contact', path: '/contact', label: navLabels.nav_label_contact },
      { id: 'admin', path: adminPath, label: navLabels.nav_label_admin },
    ],
    [adminPath, navLabels]
  );

  const closeMenu = () => setMenuOpen(false);
  const isBiographiePage = location.pathname === '/biographie';

  const isItemActive = (item) => {
    if (item.id === 'gallery') {
      return location.pathname === '/galerie' || location.pathname.startsWith('/galerie/');
    }
    if (item.id === 'admin') {
      return location.pathname.startsWith('/admin');
    }
    return location.pathname === item.path;
  };

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  if (hideChrome) {
    return null;
  }

  return (
    <>
      <motion.nav
        className="navbar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`navbar-container ${isBiographiePage ? 'navbar-container--bio' : ''}`}>
          {!isBiographiePage && (
            <motion.div
              className="navbar-logo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" onClick={closeMenu}>
                Alexandre Bindl
              </Link>
            </motion.div>
          )}

          <button
            type="button"
            className="navbar-toggle"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>

          <ul className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
            {navItems.map((item) => {
              const isActive = isItemActive(item);
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className={isActive ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        className="underline"
                        layoutId="underline"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.button
              type="button"
              className="navbar-overlay"
              aria-label="Fermer le menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />
          )}
        </AnimatePresence>
      </motion.nav>

      <nav className="site-bottom-nav" aria-label="Navigation principale">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.id];
          const isActive = isItemActive(item);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`site-bottom-nav__item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon ? <Icon aria-hidden /> : null}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;
