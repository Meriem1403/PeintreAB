import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink, FiX } from 'react-icons/fi';
import { galleryPath, workDetailPath } from '../constants/galleryRoutes';
import { useGalleryCategories } from '../contexts/GalleryCategoriesContext';
import { ITEMS_PER_PAGE } from '../pages/galerie/useGaleriePage';
import GalerieClassicBody from '../pages/galerie/GalerieClassicBody';
import ModalPortal from './ModalPortal';
import '../pages/Galerie.css';
import '../pages/galerie-editorial.css';
import './GalleryOrderPreviewModal.css';

const getPageNumbers = (currentPage, totalPages) => {
  const pages = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i);
    pages.push('ellipsis');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1);
    pages.push('ellipsis');
    for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('ellipsis');
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push('ellipsis');
    pages.push(totalPages);
  }

  return pages;
};

/**
 * Aperçu de la grille publique (ordre d’affichage) sans quitter l’admin.
 */
const GalleryOrderPreviewModal = ({ type, items = [], onClose }) => {
  const { getLabel, isEventsSlug, categories } = useGalleryCategories();
  const [currentPage, setCurrentPage] = useState(1);
  const label = getLabel(type) || type;
  const slugs = useMemo(() => categories.map((c) => c.slug), [categories]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [type, items.length]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleWorkClick = (work) => {
    if (!work?.id) return;
    const href = workDetailPath(type, work.id, slugs);
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <ModalPortal>
      <div className="gallery-order-preview" role="dialog" aria-modal="true" aria-labelledby="gallery-order-preview-title">
        <button
          type="button"
          className="gallery-order-preview__backdrop"
          aria-label="Fermer l’aperçu"
          onClick={onClose}
        />
        <motion.div
          className="gallery-order-preview__panel"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <header className="gallery-order-preview__header">
            <div>
              <p className="gallery-order-preview__kicker">Aperçu galerie</p>
              <h2 id="gallery-order-preview-title">{label}</h2>
              <p className="gallery-order-preview__lead">
                Ordre tel que le visiteur le voit sur {galleryPath(type, slugs)} — {items.length}{' '}
                entrée{items.length > 1 ? 's' : ''}.
              </p>
            </div>
            <div className="gallery-order-preview__actions">
              <a
                href={galleryPath(type, slugs)}
                className="gallery-order-preview__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiExternalLink aria-hidden />
                Ouvrir la page
              </a>
              <button
                type="button"
                className="gallery-order-preview__close"
                onClick={onClose}
                aria-label="Fermer"
              >
                <FiX aria-hidden />
              </button>
            </div>
          </header>

          <div className="gallery-order-preview__body galerie gallery-v2__galerie">
            <GalerieClassicBody
              activeCategory={type}
              loading={false}
              items={items}
              paginatedItems={paginatedItems}
              startIndex={startIndex}
              currentPage={currentPage}
              totalPages={totalPages}
              onWorkClick={handleWorkClick}
              onPageChange={setCurrentPage}
              getPageNumbers={() => getPageNumbers(currentPage, totalPages)}
              refinedCards
              isEventCategory={isEventsSlug(type)}
            />
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default GalleryOrderPreviewModal;
