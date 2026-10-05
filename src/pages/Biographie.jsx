import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { artistAPI } from '../utils/apiService';
import { normalizeImageUrl } from '../utils/imageUrl';
import './Biographie.css';

const Biographie = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [photo, setPhoto] = useState('/images/accueil.jpg');
  const [biographie, setBiographie] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    loadArtistInfo();
  }, [location.pathname, reduceMotion]);

  const loadArtistInfo = async () => {
    try {
      setLoading(true);
      const data = await artistAPI.get();
      setPhoto(normalizeImageUrl(data.photo || '/images/accueil.jpg'));
      setBiographie(data.biographie || '');
    } catch (error) {
      console.error('Erreur lors du chargement des informations:', error);
    } finally {
      setLoading(false);
    }
  };

  const paragraphs = biographie
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const fadeIn = (delay = 0) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="bio-v2" key={location.pathname}>
      <div className="bio-v2__stage">
      <header className="bio-v2__banner">
        <img className="bio-v2__banner-img" src={photo} alt="Portrait d'Alexandre Bindl" />
        <div className="bio-v2__banner-scrim" aria-hidden="true" />
        <div className="bio-v2__banner-inner">
          <motion.p className="bio-v2__eyebrow" {...fadeIn(0.05)}>
            Parcours
          </motion.p>
          <motion.h1 className="bio-v2__name" {...fadeIn(0.1)}>
            Alexandre Bindl
          </motion.h1>
          <motion.p className="bio-v2__role" {...fadeIn(0.15)}>
            Artiste peintre
          </motion.p>
        </div>
      </header>

      <main className="bio-v2__main">
        {loading ? (
          <div className="bio-v2__loading" role="status">
            <div className="loading-spinner" aria-hidden="true" />
            <p>Chargement…</p>
          </div>
        ) : (
          <motion.article className="bio-v2__sheet" {...fadeIn(0.12)}>
            <div className="bio-v2__sheet-head">
              <h2 className="bio-v2__sheet-title">Biographie</h2>
              <p className="bio-v2__sheet-lead">À propos de l&apos;artiste</p>
            </div>

            <div className="bio-v2__prose">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => (
                  <p key={index} className="bio-v2__paragraph">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="bio-v2__empty">
                  Le texte biographique sera publié ici prochainement. En attendant, explorez les
                  œuvres en galerie.
                </p>
              )}
            </div>

            <footer className="bio-v2__foot">
              <Link to="/galerie" className="bio-v2__btn bio-v2__btn--fill">
                Galerie
              </Link>
              <Link to="/contact" className="bio-v2__btn bio-v2__btn--line">
                Contact
              </Link>
            </footer>
          </motion.article>
        )}
      </main>
      </div>
    </div>
  );
};

export default Biographie;
