import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { DEFAULT_GALLERY_CATEGORY, galleryPath } from '../constants/galleryRoutes';
import GalerieCategoryTabs from './galerie/GalerieCategoryTabs';
import GalerieClassicBody from './galerie/GalerieClassicBody';
import { useGaleriePage } from './galerie/useGaleriePage';
import './Galerie.css';

const GalerieClassic = () => {
  const {
    activeCategory,
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
    return <Navigate to={galleryPath(DEFAULT_GALLERY_CATEGORY)} replace />;
  }

  return (
    <div className="galerie">
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
      />
    </div>
  );
};

export default GalerieClassic;
