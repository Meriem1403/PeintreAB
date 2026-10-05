import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import GalleryItem from '../../components/GalleryItem';

/**
 * Corps de la galerie — markup identique à l’historique de src/pages/Galerie.jsx (git HEAD).
 */
const GalerieClassicBody = ({
  activeCategory,
  loading,
  items,
  paginatedItems,
  startIndex,
  currentPage,
  totalPages,
  onWorkClick,
  onPageChange,
  getPageNumbers,
  refinedCards = false,
}) => (
  <>
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeCategory}-${loading ? 'loading' : 'loaded'}`}
        className={`galerie-grid ${refinedCards ? 'galerie-grid--exhibition' : ''}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <div className="empty-galerie">
            <div
              className="loading-spinner"
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e5e5e5',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem',
              }}
            />
            <p>Chargement des œuvres...</p>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="empty-galerie">
            <p>Aucune œuvre à afficher pour le moment.</p>
          </div>
        ) : (
          <>
            {paginatedItems
              .map((item, index) => {
                if (!item) return null;
                return (
                  <GalleryItem
                    key={`${item.id || 'item'}-${activeCategory}-${startIndex + index}`}
                    item={item}
                    index={startIndex + index}
                    onClick={onWorkClick}
                    refined={refinedCards}
                  />
                );
              })
              .filter(Boolean)}
          </>
        )}
      </motion.div>
    </AnimatePresence>

    {!loading && items.length > 0 && totalPages > 1 && (
      <motion.div
        className="pagination"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          className="pagination-button"
          onClick={() => onPageChange(currentPage - 1)}
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
                onClick={() => onPageChange(page)}
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
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
        >
          <FaChevronRight />
        </button>
      </motion.div>
    )}
  </>
);

export default GalerieClassicBody;
