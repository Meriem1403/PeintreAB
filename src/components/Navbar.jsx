import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resolveAdminLinkPath } from '../constants/adminRoutes';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const adminPath = useMemo(() => resolveAdminLinkPath(location.pathname), [location.pathname]);

  const navItems = [
    { path: '/', label: 'Accueil' },
    { path: '/galerie', label: 'Galerie' },
    { path: '/biographie', label: 'Biographie' },
    { path: '/contact', label: 'Contact' },
    { path: adminPath, label: 'Admin' },
  ];

  const closeMenu = () => setMenuOpen(false);
  const isBiographiePage = location.pathname === '/biographie';

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
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
            const isActive =
              item.path === '/galerie'
                ? location.pathname === '/galerie' || location.pathname.startsWith('/galerie/')
                : item.label === 'Admin'
                  ? location.pathname.startsWith('/admin')
                  : location.pathname === item.path;
            return (
              <li key={item.label === 'Admin' ? 'admin' : item.path}>
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
  );
};

export default Navbar;
