import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useWorks } from '../contexts/WorksContext';
import GalleryItem from '../components/GalleryItem';
import './Galerie.css';

const ITEMS_PER_PAGE = 12;

const Galerie = () => {
  const [activeCategory, setActiveCategory] = useState('peintures');
  const [currentPage, setCurrentPage] = useState(1);
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
    if (!Array.isArray(categoryItems)) {
      return [];
    }
    // Trier par display_order (croissant), puis par created_at (décroissant) si display_order est identique
    return [...categoryItems].sort((a, b) => {
      const orderA = a.display_order !== undefined && a.display_order !== null ? a.display_order : 999999;
      const orderB = b.display_order !== undefined && b.display_order !== null ? b.display_order : 999999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // Si display_order est identique, trier par date de création (plus récent en premier)
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });
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
      setCurrentPage(1); // Réinitialiser à la page 1 lors du changement de catégorie
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Calculer la pagination
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, endIndex);

  // Réinitialiser à la page 1 si la page actuelle est supérieure au nombre total de pages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Afficher toutes les pages si moins de maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Afficher les pages avec ellipses
      if (currentPage <= 3) {
        // Début : 1, 2, 3, 4, ..., dernière
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Fin : 1, ..., avant-dernière, dernière-2, dernière-1, dernière
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Milieu : 1, ..., page-1, page, page+1, ..., dernière
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
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
            <>
              {paginatedItems.map((item, index) => {
                if (!item) return null;
                return (
                  <GalleryItem 
                    key={`${item.id || 'item'}-${activeCategory}-${startIndex + index}`} 
                    item={item} 
                    index={startIndex + index}
                    onClick={handleWorkClick}
                  />
                );
              }).filter(Boolean)}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {!loading && items.length > 0 && totalPages > 1 && (
        <motion.div
          className="pagination"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Page précédente"
          >
            <FaChevronLeft />
          </button>

          <div className="pagination-numbers">
            {getPageNumbers().map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={page}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Page suivante"
          >
            <FaChevronRight />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Galerie;
