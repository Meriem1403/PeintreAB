import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const GalleryItem = ({ item, index, onClick }) => {
  const itemRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Ne pas utiliser GSAP ScrollTrigger pour éviter les fuites mémoire
    // Utiliser uniquement Framer Motion qui gère mieux les cleanup
    const element = itemRef.current;
    if (!element) return;

    // Cleanup function pour s'assurer qu'il n'y a pas de fuite
    return () => {
      // Nettoyer les animations GSAP si elles existent
      if (animationRef.current && typeof animationRef.current.kill === 'function') {
        animationRef.current.kill();
      }
    };
  }, [index]);

  const handleClick = () => {
    if (onClick && item) {
      onClick(item);
    }
  };

  if (!item) {
    return null;
  }

  return (
    <motion.div
      ref={itemRef}
      className="galerie-item"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.3 }
      }}
      style={{ position: 'relative', zIndex: 1 }}
      onHoverStart={(e) => {
        if (e.currentTarget) {
          e.currentTarget.style.zIndex = '10';
        }
      }}
      onHoverEnd={(e) => {
        if (e.currentTarget) {
          e.currentTarget.style.zIndex = '1';
        }
      }}
      onClick={handleClick}
    >
      {item.image && (
        <div className="item-image">
          <img 
            src={item.image} 
            alt={item.titre || 'Œuvre'}
            loading="lazy"
          />
          <div className="image-overlay" />
          <div className={`availability-badge ${item.is_sold ? 'sold' : 'available'}`}>
            {item.is_sold ? 'Collection privée' : 'Disponible'}
          </div>
        </div>
      )}
      <div className="item-overlay">
        <h3>{item.titre || 'Sans titre'}</h3>
        {item.description && <p>{item.description}</p>}
        {(item.prix || item.date) && (
          <div className="item-info">
            {item.prix && !item.is_sold && <span className="item-price">{item.prix}€</span>}
            {item.is_sold && <span className="item-sold">Collection privée</span>}
            {item.date && <span className="item-date">{new Date(item.date).toLocaleDateString('fr-FR')}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GalleryItem;
