import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const slideVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 28 : -28,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -28 : 28,
  }),
};

/**
 * Carrousel accueil Atelier — flèches, slide animé.
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
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="atelier-carousel" aria-roledescription="carousel" aria-label={ariaLabel}>
      <div className="atelier-carousel__row">
        <div className="atelier-carousel__nav-slot atelier-carousel__nav-slot--prev">
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
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={slideKey}
              className="atelier-carousel__track"
              custom={direction}
              role="group"
              aria-live="polite"
              variants={reduceMotion ? undefined : slideVariants}
              initial={reduceMotion ? false : 'enter'}
              animate="center"
              exit={reduceMotion ? undefined : 'exit'}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="atelier-carousel__nav-slot atelier-carousel__nav-slot--next">
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
};

export default AtelierCarousel;
