import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronRight, FaMapMarkerAlt } from 'react-icons/fa';
import ParticlesBackground from '../components/ParticlesBackground';
import GeometricBackground from '../components/GeometricBackground';
import HomeExhibitionPanel from '../components/HomeExhibitionPanel';
import { galleryPath } from '../constants/galleryRoutes';
import { normalizeImageUrl } from '../utils/imageUrl';
import { useHomeFeatured, workCategoryLabel } from './home/useHomeFeatured';
import '../styles/home-panels.css';
import './Home.css';

/** Ancienne page d'accueil (snap plein écran, carrousels, fond géométrique). */
const HomeClassic = () => {
  const animationRef = useRef(null);
  const {
    homeRef,
    heroImage,
    featuredWorks,
    featuredEvents,
    currentIndex,
    setCurrentIndex,
    currentEventIndex,
    setCurrentEventIndex,
    worksPerView,
    eventsPerView,
    worksMaxIndex,
    eventsMaxIndex,
    worksPageCount,
    eventsPageCount,
    setIsPaused,
    setIsEventPaused,
    getVisibleWorks,
    getVisibleEvents,
    handlePrevious,
    handleNext,
    handleEventPrevious,
    handleEventNext,
    handleWorkClick,
  } = useHomeFeatured({ measureNavForClassic: true });

  useEffect(() => {
    return () => {
      if (animationRef.current && typeof animationRef.current.kill === 'function') {
        animationRef.current.kill();
      }
    };
  }, []);

  return (
    <div className="home" ref={homeRef}>
      <div className="hero-section home-panel">
        <div className="hero-artwork-bg">
          <div className="artwork-image" style={{ backgroundImage: `url(${heroImage})` }} />
        </div>
        <GeometricBackground density="low" theme="dark" />
        <ParticlesBackground interactive density="normal" />
        <motion.div
          className="hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Galerie d&apos;Artiste
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Découvrez une collection unique de peintures et croquis
          </motion.p>
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <motion.a
              href="#featured-works"
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('featured-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Découvrir la sélection
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {featuredEvents.length > 0 && (
        <HomeExhibitionPanel
          id="featured-events"
          eyebrow="Agenda"
          title="Événements"
          lead="Expositions, vernissages et moments de rencontre autour de la peinture."
          actionLabel="Tous les événements"
          actionTo={galleryPath('evenements')}
          canNavigate={featuredEvents.length > eventsPerView}
          onPrevious={handleEventPrevious}
          onNext={handleEventNext}
          onMouseEnter={() => setIsEventPaused(true)}
          onMouseLeave={() => setIsEventPaused(false)}
          dotsFooter={
            featuredEvents.length > eventsPerView ? (
              <div className="home-carousel-dots">
                {Array.from({ length: eventsPageCount }).map((_, index) => {
                  const pageIndex = index * eventsPerView;
                  const isActive =
                    currentEventIndex >= pageIndex &&
                    currentEventIndex < pageIndex + eventsPerView;
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`home-carousel-dot${isActive ? ' is-active' : ''}`}
                      onClick={() => setCurrentEventIndex(Math.min(pageIndex, eventsMaxIndex))}
                      aria-label={`Page ${index + 1}`}
                    />
                  );
                })}
              </div>
            ) : null
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentEventIndex}-${eventsPerView}`}
              className="home-carousel-track featured-events-grid"
              style={{
                gridTemplateColumns: `repeat(${Math.min(eventsPerView, getVisibleEvents().length)}, minmax(0, 1fr))`,
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.32 }}
            >
              {getVisibleEvents().map((event) => (
                <motion.div
                  key={`${event.id}-${event.category}`}
                  className="featured-event-item"
                  onClick={() => handleWorkClick(event, event.category)}
                  transition={{ duration: 0.2 }}
                >
                  {event.image && (
                    <div className="featured-event-image">
                      <img src={normalizeImageUrl(event.image)} alt={event.titre} />
                      <div className="image-gradient" />
                      {(event.date_debut || event.date) && (
                        <div className="event-date-badge">
                          {event.date_debut && event.date_fin ? (
                            <>
                              {new Date(event.date_debut).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                              })}{' '}
                              -{' '}
                              {new Date(event.date_fin).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </>
                          ) : (
                            new Date(event.date_debut || event.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="featured-event-info">
                    <div className="event-category-tag">Événement</div>
                    <h3>{event.titre}</h3>
                    {event.lieu && (
                      <div className="event-location">
                        <FaMapMarkerAlt className="location-icon" />
                        <span className="location-text">{event.lieu}</span>
                      </div>
                    )}
                    {event.description && (
                      <p className="featured-event-description">{event.description}</p>
                    )}
                    <div className="event-cta">
                      <span>En savoir plus</span>
                      <FaChevronRight className="cta-arrow" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </HomeExhibitionPanel>
      )}

      {featuredWorks.length > 0 && (
        <HomeExhibitionPanel
          id="featured-works"
          eyebrow="Sélection"
          title="Œuvres choisies"
          lead="Un parcours intime parmi les toiles et croquis que l’artiste souhaite mettre en lumière."
          actionLabel="Entrer en galerie"
          actionTo="/galerie"
          canNavigate={featuredWorks.length > worksPerView}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          dotsFooter={
            featuredWorks.length > worksPerView ? (
              <div className="home-carousel-dots">
                {Array.from({ length: worksPageCount }).map((_, index) => {
                  const pageIndex = index * worksPerView;
                  const isActive =
                    currentIndex >= pageIndex && currentIndex < pageIndex + worksPerView;
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`home-carousel-dot${isActive ? ' is-active' : ''}`}
                      onClick={() => setCurrentIndex(Math.min(pageIndex, worksMaxIndex))}
                      aria-label={`Page ${index + 1}`}
                    />
                  );
                })}
              </div>
            ) : null
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${worksPerView}`}
              className="home-carousel-track featured-works-grid"
              style={{
                gridTemplateColumns: `repeat(${Math.min(worksPerView, getVisibleWorks().length)}, minmax(0, 1fr))`,
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.32 }}
            >
              {getVisibleWorks().map((work) => (
                <motion.div
                  key={`${work.id}-${work.category}`}
                  className="featured-work-item"
                  onClick={() => handleWorkClick(work, work.category)}
                  transition={{ duration: 0.2 }}
                >
                  {work.image && (
                    <div className="featured-work-image">
                      <img src={normalizeImageUrl(work.image)} alt={work.titre} />
                      <div className={`availability-badge ${work.is_sold ? 'sold' : 'available'}`}>
                        {work.is_sold ? 'Collection privée' : 'Disponible'}
                      </div>
                    </div>
                  )}
                  <div className="featured-work-info">
                    <span className="featured-work-category">{workCategoryLabel(work.category)}</span>
                    <h3>{work.titre}</h3>
                    {work.description && (
                      <p className="featured-work-excerpt">{work.description}</p>
                    )}
                    {(work.prix || work.is_sold) && (
                      <p className="featured-work-price">
                        {work.is_sold ? 'Collection privée' : `${work.prix} €`}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </HomeExhibitionPanel>
      )}
    </div>
  );
};

export default HomeClassic;
