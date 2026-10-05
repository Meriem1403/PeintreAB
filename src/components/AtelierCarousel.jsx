import { AnimatePresence, motion } from 'framer-motion';

const slideVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 48 : -48,
    scale: 0.98,
    filter: 'blur(10px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -48 : 48,
    scale: 0.98,
    filter: 'blur(8px)',
  }),
};

/**
 * Carrousel accueil Atelier — flèches, slide animé, zone pleine hauteur.
 */
const AtelierCarousel = ({
  canNavigate,
  onPrevious,
  onNext,
  slideKey,
  direction = 1,
  children,
  footer = null,
  ariaLabel = 'Carrousel',
}) => (
  <div className="atelier-carousel" aria-roledescription="carousel" aria-label={ariaLabel}>
    <div className="atelier-carousel__row">
      <div className="atelier-carousel__nav-slot">
        {canNavigate ? (
          <button
            type="button"
            className="atelier-carousel__nav"
            onClick={onPrevious}
            aria-label="Slide précédent"
          >
            ‹
          </button>
        ) : (
          <span className="atelier-carousel__nav-spacer" aria-hidden />
        )}
      </div>

      <div className="atelier-carousel__viewport">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slideKey}
            className="atelier-carousel__track"
            custom={direction}
            role="group"
            aria-live="polite"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="atelier-carousel__nav-slot">
        {canNavigate ? (
          <button
            type="button"
            className="atelier-carousel__nav"
            onClick={onNext}
            aria-label="Slide suivant"
          >
            ›
          </button>
        ) : (
          <span className="atelier-carousel__nav-spacer" aria-hidden />
        )}
      </div>
    </div>
    {footer}
  </div>
);

export default AtelierCarousel;
