import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt } from 'react-icons/fa';
import ParticlesBackground from '../components/ParticlesBackground';
import { useWorks } from '../contexts/WorksContext';
import './Home.css';

const Home = () => {
  const heroRef = useRef(null);
  const animationRef = useRef(null);
  const { works, loading } = useWorks();
  const navigate = useNavigate();
  const [featuredWorks, setFeaturedWorks] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isEventPaused, setIsEventPaused] = useState(false);
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
      setFeaturedWorks(featured);
      setFeaturedEvents(events);
    }
  }, [works, loading]);

  // Défilement automatique du carrousel des œuvres
  useEffect(() => {
    if (featuredWorks.length <= 3 || isPaused) return;

    carouselIntervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = Math.max(0, featuredWorks.length - 3);
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 4000); // Change toutes les 4 secondes

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [featuredWorks.length, isPaused]);

  // Défilement automatique du carrousel des événements
  useEffect(() => {
    if (featuredEvents.length <= 4 || isEventPaused) return;

    eventCarouselIntervalRef.current = setInterval(() => {
      setCurrentEventIndex((prevIndex) => {
        const maxIndex = Math.max(0, featuredEvents.length - 4);
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 4000);

    return () => {
      if (eventCarouselIntervalRef.current) {
        clearInterval(eventCarouselIntervalRef.current);
      }
    };
  }, [featuredEvents.length, isEventPaused]);

  const getVisibleWorks = () => {
    if (featuredWorks.length <= 3) return featuredWorks;
    return featuredWorks.slice(currentIndex, currentIndex + 3);
  };

  const getVisibleEvents = () => {
    if (featuredEvents.length <= 4) return featuredEvents;
    return featuredEvents.slice(currentEventIndex, currentEventIndex + 4);
  };

  const getEventsGridColumns = () => {
    if (featuredEvents.length === 1) return '1fr';
    if (featuredEvents.length === 2) return 'repeat(2, 1fr)';
    if (featuredEvents.length === 3) return 'repeat(3, 1fr)';
    return 'repeat(4, 1fr)';
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, featuredWorks.length - 3);
      return prevIndex <= 0 ? maxIndex : prevIndex - 1;
    });
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Reprendre après 10 secondes
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, featuredWorks.length - 3);
      return prevIndex >= maxIndex ? 0 : prevIndex + 1;
    });
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Reprendre après 10 secondes
  };

  const handleEventPrevious = () => {
    setCurrentEventIndex((prevIndex) => {
      const maxIndex = Math.max(0, featuredEvents.length - 4);
      return prevIndex <= 0 ? maxIndex : prevIndex - 1;
    });
    setIsEventPaused(true);
    setTimeout(() => setIsEventPaused(false), 10000);
  };

  const handleEventNext = () => {
    setCurrentEventIndex((prevIndex) => {
      const maxIndex = Math.max(0, featuredEvents.length - 4);
      return prevIndex >= maxIndex ? 0 : prevIndex + 1;
    });
    setIsEventPaused(true);
    setTimeout(() => setIsEventPaused(false), 10000);
  };

  const handleWorkClick = (work, category) => {
    const workId = work.id || work.titre?.replace(/\s+/g, '-').toLowerCase();
    navigate(`/galerie/${category}/${workId}`, { state: { work } });
  };

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-artwork-bg">
          <div className="artwork-image" style={{ backgroundImage: 'url(/images/peintures/2025-2-le-cours.jpg)' }} />
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
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            Voir les œuvres à l'honneur
          </motion.a>
        </motion.div>
        </motion.div>
      </div>

      {/* Section événements mis en avant */}
      {featuredEvents.length > 0 && (
        <motion.section
          id="featured-events"
          className="featured-events"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          onMouseEnter={() => setIsEventPaused(true)}
          onMouseLeave={() => setIsEventPaused(false)}
        >
          <div className="featured-events-container">
              <motion.div
                className="featured-events-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="events-header-decoration">
                  <div className="decoration-line"></div>
                  <div className="decoration-dot"></div>
                </div>
                <h2 className="featured-events-title">Événements à venir</h2>
                <div className="events-header-decoration">
                  <div className="decoration-dot"></div>
                  <div className="decoration-line"></div>
                </div>
              </motion.div>
              
              <motion.p
                className="featured-events-intro-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Découvrez les prochaines expositions et rendez-vous artistiques
              </motion.p>
              
              <div className="carousel-wrapper">
                {featuredEvents.length > 4 && (
                  <button
                    className="carousel-button carousel-button-left"
                    onClick={handleEventPrevious}
                    aria-label="Précédent"
                  >
                    <FaChevronLeft />
                  </button>
                )}

                <div className="carousel-container">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentEventIndex}
                      className="featured-events-grid"
                      style={{ gridTemplateColumns: getEventsGridColumns() }}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.5 }}
                    >
                      {getVisibleEvents().map((event, index) => (
                        <motion.div
                          key={`${event.id}-${event.category}`}
                          className="featured-event-item"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                          whileHover={{ y: -10, transition: { duration: 0.3 } }}
                          onClick={() => handleWorkClick(event, event.category)}
                        >
                          <div className="event-card-overlay"></div>
                          {event.image && (
                            <div className="featured-event-image">
                              <img src={event.image} alt={event.titre} />
                              <div className="image-gradient"></div>
                            {(event.date_debut || event.date) && (
                              <div className="event-date-badge">
                                {event.date_debut && event.date_fin ? (
                                  <>
                                    {new Date(event.date_debut).toLocaleDateString('fr-FR', { 
                                      day: 'numeric',
                                      month: 'short'
                                    })} - {new Date(event.date_fin).toLocaleDateString('fr-FR', { 
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </>
                                ) : (
                                  new Date(event.date_debut || event.date).toLocaleDateString('fr-FR', { 
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
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
                </div>

                {featuredEvents.length > 4 && (
                  <button
                    className="carousel-button carousel-button-right"
                    onClick={handleEventNext}
                    aria-label="Suivant"
                  >
                    <FaChevronRight />
                  </button>
                )}
              </div>

              {featuredEvents.length > 4 && (
                <div className="carousel-indicators">
                  {Array.from({ length: Math.ceil(featuredEvents.length / 4) }).map((_, index) => {
                    const pageIndex = index * 4;
                    const maxIndex = Math.max(0, featuredEvents.length - 4);
                    const isActive = currentEventIndex >= pageIndex && currentEventIndex < pageIndex + 4 && 
                                   (currentEventIndex === pageIndex || currentEventIndex <= maxIndex);
                    return (
                      <button
                        key={index}
                        className={`carousel-indicator ${isActive ? 'active' : ''}`}
                        onClick={() => setCurrentEventIndex(Math.min(pageIndex, maxIndex))}
                        aria-label={`Page ${index + 1}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
        </motion.section>
      )}

      {/* Section œuvres mises en avant - Carrousel */}
      {featuredWorks.length > 0 && (
        <motion.section
          id="featured-works"
          className="featured-works"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <ParticlesBackground containerId="particles-container-featured" particleColor="#C6AC8F" />
          <div className="featured-works-container">
            <div className="featured-works-header">
              <div className="works-header-decoration">
                <div className="decoration-line"></div>
                <div className="decoration-dot"></div>
              </div>
              <h2 className="featured-works-title">Œuvres à l'honneur</h2>
              <div className="works-header-decoration">
                <div className="decoration-dot"></div>
                <div className="decoration-line"></div>
              </div>
            </div>
            
            <div className="carousel-wrapper">
              {featuredWorks.length > 3 && (
                <button
                  className="carousel-button carousel-button-left"
                  onClick={handlePrevious}
                  aria-label="Précédent"
                >
                  <FaChevronLeft />
                </button>
              )}

              <div className="carousel-container">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    className="featured-works-grid"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    {getVisibleWorks().map((work) => (
                      <motion.div
                        key={`${work.id}-${work.category}`}
                        className="featured-work-item"
                        whileHover={{ scale: 1.05, y: -5 }}
                        onClick={() => handleWorkClick(work, work.category)}
                      >
                        {work.image && (
                          <div className="featured-work-image">
                            <img src={work.image} alt={work.titre} />
                            <div className={`availability-badge ${work.is_sold ? 'sold' : 'available'}`}>
                              {work.is_sold ? 'Vendu' : 'Disponible'}
                            </div>
                          </div>
                        )}
                        <div className="featured-work-info">
                          <h3>{work.titre}</h3>
                          {work.prix && !work.is_sold && (
                            <p className="featured-work-price">{work.prix}€</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

                {featuredWorks.length > 3 && (
                  <button
                    className="carousel-button carousel-button-right"
                    onClick={handleNext}
                    aria-label="Suivant"
                  >
                    <FaChevronRight />
                  </button>
                )}
              </div>

              {featuredWorks.length > 3 && (
                <div className="carousel-indicators">
                  {Array.from({ length: Math.ceil(featuredWorks.length / 3) }).map((_, index) => {
                    const pageIndex = index * 3;
                    const maxIndex = Math.max(0, featuredWorks.length - 3);
                    const isActive = currentIndex >= pageIndex && currentIndex < pageIndex + 3 && 
                                   (currentIndex === pageIndex || currentIndex <= maxIndex);
                    return (
                      <button
                        key={index}
                        className={`carousel-indicator ${isActive ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(Math.min(pageIndex, maxIndex))}
                        aria-label={`Page ${index + 1}`}
                      />
                    );
                  })}
                </div>
              )}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default Home;
