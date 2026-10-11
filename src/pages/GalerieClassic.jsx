import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { galleryPath } from '../constants/galleryRoutes';
import { useGalleryCategories } from '../contexts/GalleryCategoriesContext';
import GalerieCategoryTabs from './galerie/GalerieCategoryTabs';
import GalerieClassicBody from './galerie/GalerieClassicBody';
import { useGaleriePage } from './galerie/useGaleriePage';
import Seo from '../components/Seo';
import './Galerie.css';

const GalerieClassic = () => {
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

  if (invalidCategory) {
    return <Navigate to={galleryPath(defaultSlug)} replace />;
  }

  const categoryMeta = galleryCategories.find((c) => c.id === activeCategory);
  const categoryLabel = categoryMeta?.label || activeCategory;

  return (
    <div className="galerie">
      <Seo
        title={`${categoryLabel} — Galerie`}
        description={
          activeCategoryLead ||
          `Découvrez la collection ${categoryLabel} d’Alexandre Bindl, artiste peintre.`
        }
        path={`/galerie/${activeCategory}`}
      />
      <motion.div
        className="galerie-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Galerie</h1>
        <p>Explorez la collection</p>
      </motion.div>

      <GalerieCategoryTabs
        categories={galleryCategories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

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
        isEventCategory={isEventsSlug(activeCategory)}
      />
    </div>
  );
};

export default GalerieClassic;
