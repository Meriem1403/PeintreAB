import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronRight, FaMapMarkerAlt } from 'react-icons/fa';
import ParticlesBackground from '../components/ParticlesBackground';
import HomeExhibitionPanel from '../components/HomeExhibitionPanel';
import { useWorks } from '../contexts/WorksContext';
import { siteSettingsAPI } from '../utils/apiService';
import { normalizeImageUrl } from '../utils/imageUrl';
import '../styles/home-panels.css';
import './Home.css';

const workCategoryLabel = (category) => (category === 'croquis' ? 'Croquis' : 'Peinture');

const getWorksPerView = (width) => {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  return 3;
};

const getEventsPerView = (width) => {
  if (width < 640) return 1;
  if (width < 900) return 2;
  if (width < 1200) return 3;
  return 4;
};

const Home = () => {
  const homeRef = useRef(null);
  const heroRef = useRef(null);
  const animationRef = useRef(null);
  const { works, loading } = useWorks();
  const navigate = useNavigate();
  const [featuredWorks, setFeaturedWorks] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [heroImage, setHeroImage] = useState('/images/peintures/2025-2-le-cours.jpg');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isEventPaused, setIsEventPaused] = useState(false);
  const [worksPerView, setWorksPerView] = useState(() => getWorksPerView(window.innerWidth));
  const [eventsPerView, setEventsPerView] = useState(() => getEventsPerView(window.innerWidth));
  const carouselIntervalRef = useRef(null);
  const eventCarouselIntervalRef = useRef(null);

  useEffect(() => {
    // Ne pas utiliser GSAP pour éviter les fuites mémoire
    // Utiliser uniquement Framer Motion qui gère mieux les cleanup
    return () => {
      // Cleanup: tuer les animations GSAP si elles existent
      if (animationRef.current && typeof animationRef.current.kill === 'function') {
        animationRef.current.kill();
      }
    };
  }, []);

  // Hauteur navbar → scroll-padding / sections (variable globale pour le snap CSS)
  useEffect(() => {
    const measureNav = () => {
      const nav = document.querySelector('.navbar');
      const navPx = nav ? nav.offsetHeight : 76;
      const offset = `${navPx}px`;
      const panelH = `calc(100dvh - ${navPx}px)`;
      document.documentElement.style.setProperty('--home-nav-offset', offset);
      document.documentElement.style.setProperty('--home-panel-h', panelH);
      homeRef.current?.style.setProperty('--home-nav-offset', offset);
      homeRef.current?.style.setProperty('--home-panel-h', panelH);
    };

    measureNav();
    const nav = document.querySelector('.navbar');
    const navObserver = nav ? new ResizeObserver(measureNav) : null;
    if (nav && navObserver) navObserver.observe(nav);

    return () => navObserver?.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => {
      setWorksPerView(getWorksPerView(window.innerWidth));
      setEventsPerView(getEventsPerView(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setCurrentIndex((i) => {
      const max = Math.max(0, featuredWorks.length - worksPerView);
      return Math.min(i, max);
    });
  }, [worksPerView, featuredWorks.length]);

  useEffect(() => {
    setCurrentEventIndex((i) => {
      const max = Math.max(0, featuredEvents.length - eventsPerView);
      return Math.min(i, max);
    });
  }, [eventsPerView, featuredEvents.length]);

  // Charger l'image du hero depuis les paramètres du site
  useEffect(() => {
    const loadHeroImage = async () => {
      try {
        const settings = await siteSettingsAPI.get();
        if (settings.hero_image) {
          setHeroImage(normalizeImageUrl(settings.hero_image));
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'image du hero:', error);
      }
    };
    loadHeroImage();
  }, []);

  // Filtrer les œuvres mises en avant (peintures et croquis uniquement)
  useEffect(() => {
    if (!loading && works) {
      const featured = [];
      const events = [];
      // Parcourir toutes les catégories pour trouver les œuvres featured
      Object.keys(works).forEach(category => {
        if (Array.isArray(works[category])) {
          works[category].forEach(work => {
            if (work.is_featured) {
              if (category === 'evenements') {
                events.push({ ...work, category });
              } else {
                featured.push({ ...work, category });
              }
            }
          });
        }
      });
      
      // Trier par display_order (croissant), puis par created_at (décroissant) si display_order est identique
      const sortByDisplayOrder = (a, b) => {
        const orderA = a.display_order !== undefined && a.display_order !== null ? a.display_order : 999999;
        const orderB = b.display_order !== undefined && b.display_order !== null ? b.display_order : 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
      };
      
      setFeaturedWorks(featured.sort(sortByDisplayOrder));
      setFeaturedEvents(events.sort(sortByDisplayOrder));
    }
  }, [works, loading]);

  const worksMaxIndex = Math.max(0, featuredWorks.length - worksPerView);
  const eventsMaxIndex = Math.max(0, featuredEvents.length - eventsPerView);
  const worksPageCount = Math.max(1, Math.ceil(featuredWorks.length / worksPerView));
  const eventsPageCount = Math.max(1, Math.ceil(featuredEvents.length / eventsPerView));

  // Défilement automatique du carrousel des œuvres
  useEffect(() => {
    if (featuredWorks.length <= worksPerView || isPaused) return;

    carouselIntervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex >= worksMaxIndex ? 0 : prevIndex + 1));
    }, 4000);

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [featuredWorks.length, isPaused, worksPerView, worksMaxIndex]);

  // Défilement automatique du carrousel des événements
  useEffect(() => {
    if (featuredEvents.length <= eventsPerView || isEventPaused) return;

    eventCarouselIntervalRef.current = setInterval(() => {
      setCurrentEventIndex((prevIndex) => (prevIndex >= eventsMaxIndex ? 0 : prevIndex + 1));
    }, 4000);

    return () => {
      if (eventCarouselIntervalRef.current) {
        clearInterval(eventCarouselIntervalRef.current);
      }
    };
  }, [featuredEvents.length, isEventPaused, eventsPerView, eventsMaxIndex]);

  const getVisibleWorks = () => {
    if (featuredWorks.length <= worksPerView) return featuredWorks;
    return featuredWorks.slice(currentIndex, currentIndex + worksPerView);
  };

  const getVisibleEvents = () => {
    if (featuredEvents.length <= eventsPerView) return featuredEvents;
    return featuredEvents.slice(currentEventIndex, currentEventIndex + eventsPerView);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex <= 0 ? worksMaxIndex : prevIndex - 1));
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Reprendre après 10 secondes
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex >= worksMaxIndex ? 0 : prevIndex + 1));
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Reprendre après 10 secondes
  };

  const handleEventPrevious = () => {
    setCurrentEventIndex((prevIndex) => (prevIndex <= 0 ? eventsMaxIndex : prevIndex - 1));
    setIsEventPaused(true);
    setTimeout(() => setIsEventPaused(false), 10000);
  };

  const handleEventNext = () => {
    setCurrentEventIndex((prevIndex) => (prevIndex >= eventsMaxIndex ? 0 : prevIndex + 1));
    setIsEventPaused(true);
    setTimeout(() => setIsEventPaused(false), 10000);
  };

  const handleWorkClick = (work, category) => {
    const workId = work.id || work.titre?.replace(/\s+/g, '-').toLowerCase();
    navigate(`/galerie/${category}/${workId}`, { state: { work } });
  };

  return (
    <div className="home" ref={homeRef}>
      <div className="hero-section home-panel">
        <div className="hero-artwork-bg">
          <div className="artwork-image" style={{ backgroundImage: `url(${heroImage})` }} />
        </div>
        <ParticlesBackground />
        <motion.div
          ref={heroRef}
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
          Galerie d'Artiste
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
              const element = document.getElementById('featured-works');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
              }
            }}
          >
            Découvrir la sélection
          </motion.a>
        </motion.div>
        </motion.div>
      </div>

      {/* Section événements mis en avant */}
      {featuredEvents.length > 0 && (
        <HomeExhibitionPanel
          id="featured-events"
          eyebrow="Agenda"
          title="Événements"
          lead="Expositions, vernissages et moments de rencontre autour de la peinture."
          actionLabel="Tous les événements"
          actionTo="/galerie"
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
                  whileHover={{ y: -3 }}
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

      {/* Section œuvres mises en avant - Carrousel */}
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
                  whileHover={{ y: -3 }}
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

export default Home;
