import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCalendar, FaMapMarkerAlt, FaEuroSign, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './WorkDetailModal.css';

const WorkDetailModal = ({ work, isOpen, onClose, allWorks = [], currentIndex = 0, onNavigate }) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate && onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < allWorks.length - 1) {
        onNavigate && onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentIndex, allWorks.length, onNavigate, onClose]);

  if (!isOpen || !work) return null;

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allWorks.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && work && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="modal-container"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            key={work.id}
          >
            <button className="modal-close" onClick={onClose}>
              <FaTimes />
            </button>

            {hasPrevious && (
              <button className="modal-nav modal-nav-left" onClick={handlePrevious}>
                <FaChevronLeft />
              </button>
            )}

            {hasNext && (
              <button className="modal-nav modal-nav-right" onClick={handleNext}>
                <FaChevronRight />
              </button>
            )}

            {work.image && (
              <div className="modal-image">
                <img src={work.image} alt={work.titre} />
              </div>
            )}

            <div className="modal-content">
              <h2>{work.titre}</h2>
              
              {work.description && (
                <p className="modal-description">{work.description}</p>
              )}

              <div className="modal-info">
                {work.prix && (
                  <div className="info-item">
                    <FaEuroSign className="info-icon" />
                    <span className="info-label">Prix :</span>
                    <span className="info-value">{work.prix}€</span>
                  </div>
                )}

                {work.date && (
                  <div className="info-item">
                    <FaCalendar className="info-icon" />
                    <span className="info-label">Date :</span>
                    <span className="info-value">
                      {new Date(work.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {work.lieu && (
                  <div className="info-item">
                    <FaMapMarkerAlt className="info-icon" />
                    <span className="info-label">Lieu :</span>
                    <span className="info-value">{work.lieu}</span>
                  </div>
                )}

                {work.type && (
                  <div className="info-item">
                    <span className="info-label">Type :</span>
                    <span className="info-value info-type">
                      {work.type === 'peintures' ? 'Peinture' : 
                       work.type === 'croquis' ? 'Croquis' : 
                       'Événement'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkDetailModal;
