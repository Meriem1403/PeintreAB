import { motion } from 'framer-motion';
import ArtistSectionTitle from './ArtistSectionTitle';
import HomeCarousel from './HomeCarousel';

/** Panneau plein écran — fond continu (aucun calque décoratif). */
const HomeExhibitionPanel = ({
  id,
  eyebrow,
  title,
  lead,
  actionLabel,
  actionTo,
  canNavigate,
  onPrevious,
  onNext,
  dotsFooter,
  onMouseEnter,
  onMouseLeave,
  children,
}) => (
  <motion.section
    id={id}
    className="home-panel home-panel--content"
    initial={false}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <div className="home-panel-frame">
      <header className="home-panel-head">
        <ArtistSectionTitle
          className="artist-section-title--home-panel"
          eyebrow={eyebrow}
          title={title}
          lead={lead}
          actionLabel={actionLabel}
          actionTo={actionTo}
        />
      </header>

      <HomeCarousel
        canNavigate={canNavigate}
        onPrevious={onPrevious}
        onNext={onNext}
        footer={dotsFooter}
      >
        {children}
      </HomeCarousel>
    </div>
  </motion.section>
);

export default HomeExhibitionPanel;
