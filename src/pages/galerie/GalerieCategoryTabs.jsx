import { motion } from 'framer-motion';
import { GALLERY_CATEGORIES } from './useGaleriePage';

const GalerieCategoryTabs = ({ activeCategory, onCategoryChange }) => (
  <motion.div
    className="category-tabs"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    {GALLERY_CATEGORIES.map((cat) => (
      <motion.button
        key={cat.id}
        type="button"
        className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
        onClick={() => onCategoryChange(cat.id)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {cat.label}
      </motion.button>
    ))}
  </motion.div>
);

export default GalerieCategoryTabs;
