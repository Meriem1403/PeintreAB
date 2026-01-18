import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ParticlesBackground from '../components/ParticlesBackground';
import { useWorks } from '../contexts/WorksContext';
import './Home.css';

const Home = () => {
  const heroRef = useRef(null);
  const animationRef = useRef(null);
  const { works, loading } = useWorks();
  const navigate = useNavigate();
  const [featuredWorks, setFeaturedWorks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselIntervalRef = useRef(null);

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

  // Filtrer les œuvres mises en avant
  useEffect(() => {
    if (!loading && works) {
      const featured = [];
      // Parcourir toutes les catégories pour trouver les œuvres featured
      Object.keys(works).forEach(category => {
        if (Array.isArray(works[category])) {
          works[category].forEach(work => {
            if (work.is_featured) {
              featured.push({ ...work, category });
            }
          });
        }
      });
      setFeaturedWorks(featured);
    }
  }, [works, loading]);

  // Défilement automatique du carrousel
  useEffect(() => {
    if (featuredWorks.length <= 4 || isPaused) return;

    carouselIntervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = Math.max(0, featuredWorks.length - 4);
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 4000); // Change toutes les 4 secondes

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [featuredWorks.length, isPaused]);

  const getVisibleWorks = () => {
    if (featuredWorks.length <= 4) return featuredWorks;
    return featuredWorks.slice(currentIndex, currentIndex + 4);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, featuredWorks.length - 4);
      return prevIndex <= 0 ? maxIndex : prevIndex - 1;
    });
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Reprendre après 10 secondes
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, featuredWorks.length - 4);
      return prevIndex >= maxIndex ? 0 : prevIndex + 1;
    });
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Reprendre après 10 secondes
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
            <h2 className="featured-works-title">Œuvres à l'honneur</h2>
            
            <div className="carousel-wrapper">
              {featuredWorks.length > 4 && (
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

              {featuredWorks.length > 4 && (
                <button
                  className="carousel-button carousel-button-right"
                  onClick={handleNext}
                  aria-label="Suivant"
                >
                  <FaChevronRight />
                </button>
              )}
            </div>

            {featuredWorks.length > 4 && (
              <div className="carousel-indicators">
                {Array.from({ length: Math.ceil(featuredWorks.length / 4) }).map((_, index) => {
                  const pageIndex = index * 4;
                  const maxIndex = Math.max(0, featuredWorks.length - 4);
                  const isActive = currentIndex >= pageIndex && currentIndex < pageIndex + 4 && 
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
