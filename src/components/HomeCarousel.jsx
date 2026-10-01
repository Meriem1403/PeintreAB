/**
 * Carrousel accueil : flèches fixées de chaque côté du viewport de slides.
 */
const HomeCarousel = ({
  canNavigate,
  onPrevious,
  onNext,
  children,
  footer = null,
}) => (
  <div className="home-carousel">
    <div className="home-carousel-row">
      <div className="home-carousel-nav-slot home-carousel-nav-slot--prev">
        {canNavigate ? (
          <button
            type="button"
            className="home-carousel-nav"
            onClick={onPrevious}
            aria-label="Précédent"
          >
            ‹
          </button>
        ) : null}
      </div>

      <div className="home-carousel-viewport">{children}</div>

      <div className="home-carousel-nav-slot home-carousel-nav-slot--next">
        {canNavigate ? (
          <button
            type="button"
            className="home-carousel-nav"
            onClick={onNext}
            aria-label="Suivant"
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
    {footer}
  </div>
);

export default HomeCarousel;
