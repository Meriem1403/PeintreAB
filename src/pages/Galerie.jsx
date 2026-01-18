import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorks } from '../contexts/WorksContext';
import GalleryItem from '../components/GalleryItem';
import './Galerie.css';

const Galerie = () => {
  const [activeCategory, setActiveCategory] = useState('peintures');
  const { works, loading } = useWorks();
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);
  const animationRef = useRef(null);

  // Réinitialiser les animations à chaque visite - avec cleanup
  useEffect(() => {
    // Ne pas utiliser GSAP pour éviter les fuites mémoire
    // Utiliser uniquement Framer Motion
    return () => {
      // Cleanup: tuer les animations GSAP si elles existent
      if (animationRef.current && typeof animationRef.current.kill === 'function') {
        animationRef.current.kill();
      }
    };
  }, [location.pathname]);

  const categories = [
    { id: 'peintures', label: 'Peintures' },
    { id: 'croquis', label: 'Croquis' },
    { id: 'evenements', label: 'Événements' }
  ];

  const items = useMemo(() => {
    if (!works || typeof works !== 'object') {
      return [];
    }
    const categoryItems = works[activeCategory] || [];
    return Array.isArray(categoryItems) ? categoryItems : [];
  }, [works, activeCategory]);

  const handleWorkClick = (work) => {
    if (!work) return;
    
    try {
      const workId = work.id || work.titre?.replace(/\s+/g, '-').toLowerCase();
      if (workId) {
        navigate(`/galerie/${activeCategory}/${workId}`, { state: { work } });
      }
    } catch (error) {
      console.error('❌ Erreur navigation:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    if (categoryId && categories.find(cat => cat.id === categoryId)) {
      setActiveCategory(categoryId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="galerie">
      <motion.div
        ref={headerRef}
        className="galerie-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Galerie</h1>
        <p>Explorez la collection</p>
      </motion.div>

      <motion.div
        className="category-tabs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            type="button"
            className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {cat.label}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeCategory}-${loading ? 'loading' : 'loaded'}`}
          className="galerie-grid"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <div className="empty-galerie">
              <div className="loading-spinner" style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid #e5e5e5', 
                borderTopColor: '#C6AC8F', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              <p>Chargement des œuvres...</p>
            </div>
          ) : !items || items.length === 0 ? (
            <div className="empty-galerie">
              <p>Aucune œuvre à afficher pour le moment.</p>
            </div>
          ) : (
            items.map((item, index) => {
              if (!item) return null;
              return (
                <GalleryItem 
                  key={`${item.id || 'item'}-${activeCategory}-${index}`} 
                  item={item} 
                  index={index}
                  onClick={handleWorkClick}
                />
              );
            }).filter(Boolean)
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Galerie;
