import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { FaChevronRight, FaMapMarkerAlt } from 'react-icons/fa';
import AtelierCarousel from '../components/AtelierCarousel';
import GeometricBackground from '../components/GeometricBackground';
import ParticlesBackground from '../components/ParticlesBackground';
import AtelierFooter from '../components/AtelierFooter';
import { galleryPath, workDetailPath } from '../constants/galleryRoutes';
import { canRegisterToEvent } from '../utils/eventDates';
import { normalizeImageUrl } from '../utils/imageUrl';
import { useHomeFeatured, workCategoryLabel } from './home/useHomeFeatured';
import { atelierScrollBehavior, useAtelierScrollSnap } from './home/useAtelierScrollSnap';
import { useHeroImageLuminance } from './home/useHeroImageLuminance';
import './home-atelier.css';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-5%' },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
};

const heroEase = [0.22, 1, 0.36, 1];

const AtelierDots = ({ pageCount, currentIndex, perView, maxIndex, onSelect }) => (
  <div className="atelier-carousel__dots" role="tablist" aria-label="Pages du carrousel">
    {Array.from({ length: pageCount }).map((_, index) => {
      const pageIndex = index * perView;
      const isActive = currentIndex >= pageIndex && currentIndex < pageIndex + perView;
      return (
        <button
          key={index}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`atelier-carousel__dot${isActive ? ' is-active' : ''}`}
          onClick={() => onSelect(Math.min(pageIndex, maxIndex))}
          aria-label={`Page ${index + 1}`}
        />
      );
    })}
  </div>
);

const HomeAtelier = () => {
  const rootRef = useRef(null);
  const [eventDirection, setEventDirection] = useState(1);
  const [workDirection, setWorkDirection] = useState(1);

  const {
    homeRef,
    heroImage,
    atelierHeroCopy,
    atelierSectionCopy,
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
    formatEventDate,
  } = useHomeFeatured({ measureNavForAtelier: true });

  const navigate = useNavigate();

  const goToEventRegistration = (event) => {
    if (!event?.id) return;
    navigate(`${workDetailPath('evenements', event.id)}?participer=1`, {
      state: { work: event },
    });
  };

  const setRefs = (node) => {
    homeRef.current = node;
    rootRef.current = node;
    if (node) {
      /* Recalcule la hauteur du hero dès que le conteneur existe */
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    }
  };

  useAtelierScrollSnap(rootRef);
  const heroIsLight = useHeroImageLuminance(heroImage);

  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    container: rootRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 0.5], ['0%', '12%']);

  const heroCopyContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.14,
        delayChildren: reduceMotion ? 0 : 0.2,
      },
    },
  };

  const heroCopyFade = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.01 : 0.75, ease: heroEase },
    },
  };

  const heroTitleLine = {
    hidden: {
      opacity: 0,
      y: reduceMotion ? 0 : 24,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.01 : 0.95, ease: heroEase },
    },
  };

  const onEventPrev = () => {
    setEventDirection(-1);
    handleEventPrevious();
  };
  const onEventNext = () => {
    setEventDirection(1);
    handleEventNext();
  };
  const onWorkPrev = () => {
    setWorkDirection(-1);
    handlePrevious();
  };
  const onWorkNext = () => {
    setWorkDirection(1);
    handleNext();
  };

  const scrollToId = (id) => {
    const root = rootRef.current;
    const panel = document.getElementById(id);
    if (!root || !panel) return;
    const behavior = atelierScrollBehavior();
    root.scrollTo({ top: panel.offsetTop, behavior });
  };

  const scrollToTop = () => {
    rootRef.current?.scrollTo({ top: 0, behavior: atelierScrollBehavior() });
  };

  const scrollToFooter = () => {
    const root = rootRef.current;
    const footer = document.getElementById('atelier-footer');
    if (!root || !footer) return;
    const rootTop = root.getBoundingClientRect().top;
    const footerTop = footer.getBoundingClientRect().top;
    root.scrollTo({
      top: root.scrollTop + (footerTop - rootTop),
      behavior: atelierScrollBehavior(),
    });
  };

  const visibleEvents = getVisibleEvents();
  const visibleWorks = getVisibleWorks();

  return (
    <div className="home-atelier" ref={setRefs}>
      <section
        className={`atelier-hero atelier-hero--viewport atelier-snap-panel${heroIsLight ? ' atelier-hero--bright-image' : ''}`}
      >
        <div className="atelier-grain atelier-grain--hero" aria-hidden="true" />
        <motion.div
          className="atelier-hero__image"
          style={{ backgroundImage: `url(${heroImage})`, y: heroImageY }}
        />
        <GeometricBackground density="medium" theme="dark" />
        <ParticlesBackground
          containerId="atelier-hero-particles"
          particleColor="#ffffff"
          density="normal"
          interactive
        />
        <div className="atelier-hero__inner">
          <motion.div
            className="atelier-hero__copy"
            variants={heroCopyContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.p className="atelier-eyebrow" variants={heroCopyFade}>
              {atelierHeroCopy.eyebrow}
            </motion.p>
            <h1 className="atelier-hero__title">
              <motion.span className="atelier-hero__title-line" variants={heroTitleLine}>
                {atelierHeroCopy.titleLine1}
              </motion.span>
              <motion.span
                className="atelier-hero__title-line atelier-hero__title-accent"
                variants={heroTitleLine}
              >
                {atelierHeroCopy.titleLine2Prefix}
                <em className="atelier-hero__title-em">{atelierHeroCopy.titleEmphasis}</em>
              </motion.span>
            </h1>
            <motion.p className="atelier-hero__lead" variants={heroCopyFade}>
              <span className="atelier-hero__lead-main">
                {atelierHeroCopy.leadPrefix}
                <span className="atelier-hero__lead-accent">{atelierHeroCopy.leadEmphasis}</span>
              </span>
              <span className="atelier-hero__lead-aside">{atelierHeroCopy.leadSuffix}</span>
            </motion.p>
            <motion.div className="atelier-hero__actions" variants={heroCopyFade}>
              {featuredWorks.length > 0 && (
                <button
                  type="button"
                  className="atelier-btn atelier-btn--light"
                  onClick={() => scrollToId('atelier-works')}
                >
                  Voir la sélection
                </button>
              )}
              {featuredEvents.length > 0 && (
                <button
                  type="button"
                  className="atelier-btn atelier-btn--ghost"
                  onClick={() => scrollToId('atelier-events')}
                >
                  Agenda
                </button>
              )}
              <Link to="/galerie" className="atelier-link atelier-link--light">
                Toute la galerie
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="atelier-hero__aside"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            aria-hidden="true"
          >
            <motion.span
              className="atelier-hero__scroll"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Défiler
            </motion.span>
            <span className="atelier-hero__rule" />
          </motion.div>
        </div>
      </section>

      {featuredEvents.length > 0 && (
        <section
          className="atelier-band atelier-band--events atelier-band--stage atelier-snap-panel"
          id="atelier-events"
        >
          <div className="atelier-wrap atelier-wrap--wide atelier-band__shell">
            <motion.header className="atelier-band__head" {...fadeUp}>
              <span className="atelier-band__index" aria-hidden="true">
                {atelierSectionCopy.events.index}
              </span>
              <div>
                <h2 className="atelier-band__title">{atelierSectionCopy.events.title}</h2>
                <p className="atelier-band__intro">{atelierSectionCopy.events.intro}</p>
              </div>
              <Link to={galleryPath('evenements')} className="atelier-link">
                Calendrier complet
              </Link>
            </motion.header>

            <div
              className="atelier-band__stage"
              onMouseEnter={() => setIsEventPaused(true)}
              onMouseLeave={() => setIsEventPaused(false)}
            >
              <AtelierCarousel
                ariaLabel="Événements à venir"
                canNavigate={featuredEvents.length > eventsPerView}
                onPrevious={onEventPrev}
                onNext={onEventNext}
                direction={eventDirection}
                slideKey={`ev-${currentEventIndex}-${eventsPerView}`}
                footer={
                  featuredEvents.length > eventsPerView ? (
                    <AtelierDots
                      pageCount={eventsPageCount}
                      currentIndex={currentEventIndex}
                      perView={eventsPerView}
                      maxIndex={eventsMaxIndex}
                      onSelect={setCurrentEventIndex}
                    />
                  ) : null
                }
              >
                <div
                  className="atelier-carousel__grid atelier-carousel__grid--events"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(eventsPerView, visibleEvents.length)}, minmax(0, 1fr))`,
                  }}
                >
                  {visibleEvents.map((event, i) => (
                    <motion.article
                      key={`${event.id}-${event.category}`}
                      className="atelier-event-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * i, duration: 0.45 }}
                    >
                      <div className="atelier-event-card__shell">
                        <button
                          type="button"
                          className="atelier-event-card__hit"
                          onClick={() => handleWorkClick(event, event.category)}
                        >
                          <div className="atelier-event-card__media">
                            {event.image ? (
                              <img src={normalizeImageUrl(event.image)} alt="" loading="lazy" />
                            ) : (
                              <span className="atelier-event-card__placeholder" />
                            )}
                            {formatEventDate(event) && (
                              <span className="atelier-event-card__date">{formatEventDate(event)}</span>
                            )}
                          </div>
                          <div className="atelier-event-card__body">
                            <span className="atelier-event-card__tag">Événement</span>
                            <h3>{event.titre}</h3>
                            {event.lieu && (
                              <p className="atelier-event-card__place">
                                <FaMapMarkerAlt aria-hidden />
                                {event.lieu}
                              </p>
                            )}
                            {event.description && (
                              <p className="atelier-event-card__excerpt">{event.description}</p>
                            )}
                            <span className="atelier-event-card__cta">
                              En savoir plus
                              <FaChevronRight aria-hidden />
                            </span>
                          </div>
                        </button>
                        {canRegisterToEvent(event) && (
                          <div className="atelier-event-card__footer">
                            <button
                              type="button"
                              className="atelier-event-card__participate"
                              onClick={() => goToEventRegistration(event)}
                            >
                              Je participe
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.article>
                  ))}
                </div>
              </AtelierCarousel>
            </div>
          </div>
        </section>
      )}

      {featuredWorks.length > 0 && (
        <section
          className="atelier-band atelier-band--works atelier-band--stage atelier-snap-panel"
          id="atelier-works"
        >
          <div className="atelier-wrap atelier-wrap--wide atelier-band__shell">
            <motion.header className="atelier-band__head" {...fadeUp}>
              <span className="atelier-band__index" aria-hidden="true">
                {atelierSectionCopy.works.index}
              </span>
              <div>
                <h2 className="atelier-band__title">{atelierSectionCopy.works.title}</h2>
                <p className="atelier-band__intro">{atelierSectionCopy.works.intro}</p>
              </div>
              <Link to="/galerie" className="atelier-link">
                Entrer en galerie
              </Link>
            </motion.header>

            <div
              className="atelier-band__stage"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <AtelierCarousel
                ariaLabel="Œuvres mises en avant"
                canNavigate={featuredWorks.length > worksPerView}
                onPrevious={onWorkPrev}
                onNext={onWorkNext}
                direction={workDirection}
                slideKey={`wk-${currentIndex}-${worksPerView}`}
                footer={
                  featuredWorks.length > worksPerView ? (
                    <AtelierDots
                      pageCount={worksPageCount}
                      currentIndex={currentIndex}
                      perView={worksPerView}
                      maxIndex={worksMaxIndex}
                      onSelect={setCurrentIndex}
                    />
                  ) : null
                }
              >
                <div
                  className="atelier-carousel__grid atelier-carousel__grid--works"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(worksPerView, visibleWorks.length)}, minmax(0, 1fr))`,
                  }}
                >
                  {visibleWorks.map((work, i) => (
                    <motion.article
                      key={`${work.id}-${work.category}`}
                      className="atelier-work-card"
                      initial={{ opacity: 0, y: 24, rotate: workDirection > 0 ? 0.6 : -0.6 }}
                      animate={{ opacity: 1, y: 0, rotate: 0 }}
                      transition={{ delay: 0.1 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -6, transition: { duration: 0.25 } }}
                    >
                      <button
                        type="button"
                        className="atelier-work-card__hit"
                        onClick={() => handleWorkClick(work, work.category)}
                      >
                        <div className="atelier-work-card__media">
                          {work.image && (
                            <img src={normalizeImageUrl(work.image)} alt={work.titre} loading="lazy" />
                          )}
                          <span
                            className={`atelier-work-card__badge ${work.is_sold ? 'is-private' : ''}`}
                          >
                            {work.is_sold ? 'Collection privée' : 'Disponible'}
                          </span>
                        </div>
                        <div className="atelier-work-card__body">
                          <span className="atelier-work-card__category">
                            {workCategoryLabel(work.category)}
                          </span>
                          <h3>{work.titre}</h3>
                          {work.description && (
                            <p className="atelier-work-card__excerpt">{work.description}</p>
                          )}
                          {(work.prix || work.is_sold) && (
                            <p className="atelier-work-card__price">
                              {work.is_sold ? 'Collection privée' : `${work.prix} €`}
                            </p>
                          )}
                        </div>
                      </button>
                    </motion.article>
                  ))}
                </div>
              </AtelierCarousel>
            </div>
          </div>
        </section>
      )}

      <AtelierFooter onBackToTop={scrollToTop} onGoToFooter={scrollToFooter} />
    </div>
  );
};

export default HomeAtelier;
