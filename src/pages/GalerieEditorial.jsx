import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { galleryPath } from '../constants/galleryRoutes';
import { useGalleryCategories } from '../contexts/GalleryCategoriesContext';
import GalerieClassicBody from './galerie/GalerieClassicBody';
import { useGaleriePage } from './galerie/useGaleriePage';
import Seo from '../components/Seo';
import './Galerie.css';
import './galerie-editorial.css';

const GalerieEditorial = () => {
  const reduceMotion = useReducedMotion();
  const { defaultSlug, isEventsSlug } = useGalleryCategories();
  const {
    activeCategory,
    activeCategoryLead,
    galleryCategories,
    currentPage,
    loading,
    items,
    paginatedItems,
    startIndex,
    totalPages,
    handleWorkClick,
    handleCategoryChange,
    handlePageChange,
    getPageNumbers,
    invalidCategory,
  } = useGaleriePage();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeCategory, reduceMotion]);

  if (invalidCategory) {
    return <Navigate to={galleryPath(defaultSlug)} replace />;
  }

  const categoryMeta = galleryCategories.find((c) => c.id === activeCategory);
  const categoryLabel = categoryMeta?.label || activeCategory;
  const galeriePath = `/galerie/${activeCategory}`;

  return (
    <div className="gallery-v2">
      <Seo
        title={`${categoryLabel} — Galerie`}
        description={
          activeCategoryLead ||
          `Découvrez la collection ${categoryLabel} d’Alexandre Bindl, artiste peintre.`
        }
        path={galeriePath}
      />
      <div className="gallery-v2__intro">
        <header className="gallery-v2__hero">
          <div className="gallery-v2__hero-inner">
            <p className="gallery-v2__kicker">Collection</p>
            <h1 className="gallery-v2__title">Galerie</h1>
            <p className="gallery-v2__lead">{activeCategoryLead}</p>
          </div>
          <div className="gallery-v2__hero-grain" aria-hidden />
        </header>

        <div className="gallery-v2__nav-wrap">
          <nav className="gallery-v2__nav" aria-label="Catégories de la galerie">
            {galleryCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`gallery-v2__nav-pill ${activeCategory === cat.id ? 'is-active' : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
                aria-current={activeCategory === cat.id ? 'true' : undefined}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="galerie gallery-v2__galerie">
        <GalerieClassicBody
          activeCategory={activeCategory}
          loading={loading}
          items={items}
          paginatedItems={paginatedItems}
          startIndex={startIndex}
          currentPage={currentPage}
          totalPages={totalPages}
          onWorkClick={handleWorkClick}
          onPageChange={handlePageChange}
          getPageNumbers={getPageNumbers}
          refinedCards
          isEventCategory={isEventsSlug(activeCategory)}
        />
      </div>
    </div>
  );
};

export default GalerieEditorial;
