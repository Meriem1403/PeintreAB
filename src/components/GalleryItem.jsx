import { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { normalizeImageUrl } from '../utils/imageUrl';

const formatExhibitDate = (item) => {
  if (!item) return null;
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  if (item.date_debut && item.date_fin) {
    const a = new Date(item.date_debut).toLocaleDateString('fr-FR', opts);
    const b = new Date(item.date_fin).toLocaleDateString('fr-FR', opts);
    return `${a} — ${b}`;
  }
  if (item.date_debut) {
    return new Date(item.date_debut).toLocaleDateString('fr-FR', opts);
  }
  if (item.date) {
    return new Date(item.date).toLocaleDateString('fr-FR', opts);
  }
  return null;
};

const GalleryItem = ({ item, index, onClick, refined = false }) => {
  const itemRef = useRef(null);
  const artRef = useRef(null);
  const animationRef = useRef(null);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = itemRef.current;
    if (!element) return;

    return () => {
      if (animationRef.current && typeof animationRef.current.kill === 'function') {
        animationRef.current.kill();
      }
    };
  }, [index]);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
  }, [item?.id, item?.image]);

  const imageSrc = item?.image ? normalizeImageUrl(item.image) : null;

  useEffect(() => {
    if (!refined || !imageSrc) return undefined;

    const syncFromCache = () => {
      const img = artRef.current;
      if (img?.complete && img.naturalWidth > 0) {
        setImageReady(true);
        setImageError(false);
      }
    };

    syncFromCache();
    const raf = requestAnimationFrame(syncFromCache);
    return () => cancelAnimationFrame(raf);
  }, [refined, imageSrc, item?.id, item?.image]);

  const handleClick = () => {
    if (onClick && item) {
      onClick(item);
    }
  };

  if (!item) {
    return null;
  }

  const exhibitDate = formatExhibitDate(item);
  const showPrice = item.prix && !item.is_sold;
  const showLieu = Boolean(item.lieu || item.adresse);
  const hasSecondaryFacts = showPrice || showLieu || item.is_sold;

  if (refined) {
    const enterDelay = reduceMotion ? 0 : Math.min(index * 0.045, 0.4);

    return (
      <motion.figure
        ref={itemRef}
        className={`galerie-exhibit featured-work-item ${item.is_sold ? 'galerie-exhibit--sold' : ''}`}
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay: enterDelay, ease: [0.22, 1, 0.36, 1] }}
        whileHover={
          reduceMotion
            ? undefined
            : {
                y: -6,
                scale: 1.015,
                transition: { type: 'spring', stiffness: 420, damping: 28 },
              }
        }
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Voir ${item.titre || 'œuvre'}`}
      >
        <div
          className={`item-image featured-work-image galerie-exhibit__media ${imageReady ? 'is-ready' : 'is-loading'} ${imageError ? 'is-error' : ''}`}
        >
          <div className="galerie-exhibit__spot" aria-hidden />
          {!imageReady && !imageError && <div className="galerie-exhibit__loader" aria-hidden />}
          {imageError && (
            <p className="galerie-exhibit__media-fallback" aria-hidden>
              Affiche indisponible
            </p>
          )}
          {imageSrc && !imageError && (
            <>
              <div className="galerie-exhibit__light galerie-exhibit__light--warm" aria-hidden />
              <div className="galerie-exhibit__light galerie-exhibit__light--cool" aria-hidden />
              <div className="galerie-exhibit__glint" aria-hidden />
              <motion.img
                ref={artRef}
                src={imageSrc}
                alt={item.titre || 'Œuvre'}
                loading="lazy"
                decoding="async"
                draggable={false}
                className={`galerie-exhibit__art ${imageReady ? 'is-loaded' : ''}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: imageReady ? 1 : 0, scale: 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                whileHover={
                  reduceMotion
                    ? undefined
                    : { scale: 1.03, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
                }
                onLoad={() => {
                  setImageReady(true);
                  setImageError(false);
                }}
                onError={() => {
                  setImageError(true);
                  setImageReady(false);
                }}
              />
            </>
          )}
          {!imageSrc && !imageError && (
            <p className="galerie-exhibit__media-fallback" aria-hidden>
              Sans visuel
            </p>
          )}
          <div className="image-overlay" />
          <div className={`availability-badge ${item.is_sold ? 'sold' : 'available'}`}>
            {item.is_sold ? 'Collection privée' : 'Disponible'}
          </div>
        </div>
        <figcaption className="galerie-exhibit__caption featured-work-info">
          <div className="galerie-exhibit__caption-main">
            <h3 className="galerie-exhibit__title">{item.titre || 'Sans titre'}</h3>
            {exhibitDate && <p className="galerie-exhibit__date">{exhibitDate}</p>}
            {item.description && (
              <p className="galerie-exhibit__description featured-work-excerpt">{item.description}</p>
            )}
          </div>
          {hasSecondaryFacts && (
            <ul className="galerie-exhibit__facts galerie-exhibit__facts--chips">
              {item.is_sold && (
                <li className="galerie-exhibit__chip galerie-exhibit__chip--muted">
                  Collection privée
                </li>
              )}
              {showPrice && (
                <li className="galerie-exhibit__chip galerie-exhibit__chip--price">{item.prix} €</li>
              )}
              {showLieu && (
                <li className="galerie-exhibit__chip">{item.lieu || item.adresse}</li>
              )}
            </ul>
          )}
          <div className="galerie-exhibit__caption-foot">
            <span className="galerie-exhibit__cta" aria-hidden>
              Voir l&apos;œuvre →
            </span>
          </div>
        </figcaption>
      </motion.figure>
    );
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
        transition: { duration: 0.3 },
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
      {imageSrc && (
        <div className="item-image">
          <img src={imageSrc} alt={item.titre || 'Œuvre'} loading="lazy" />
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
            {item.date && (
              <span className="item-date">{new Date(item.date).toLocaleDateString('fr-FR')}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GalleryItem;
