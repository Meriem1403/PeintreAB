import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticlesBackground from '../components/ParticlesBackground';
import { artistAPI } from '../utils/apiService';
import './Biographie.css';

const Biographie = () => {
  const location = useLocation();
  const [photo, setPhoto] = useState('/images/accueil.jpg');
  const [biographie, setBiographie] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadArtistInfo();
  }, [location.pathname]);

  const loadArtistInfo = async () => {
    try {
      setLoading(true);
      const data = await artistAPI.get();
      setPhoto(data.photo || '/images/accueil.jpg');
      setBiographie(data.biographie || '');
    } catch (error) {
      console.error('Erreur lors du chargement des informations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="biographie" key={location.pathname}>
      <ParticlesBackground containerId="particles-container-biographie" particleColor="#C6AC8F" />
      <motion.div
        className="biographie-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="biographie-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>Biographie</h1>
        </motion.div>

        {loading ? (
          <div className="biographie-loading">
            <div className="loading-spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : (
          <motion.div
            className="biographie-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="biographie-main">
              <motion.div
                className="biographie-image-wrapper"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              >
                <div className="image-frame">
                  <div className="frame-decoration frame-top-left"></div>
                  <div className="frame-decoration frame-top-right"></div>
                  <div className="frame-decoration frame-bottom-left"></div>
                  <div className="frame-decoration frame-bottom-right"></div>
                  <div className="biographie-image-container">
                    <motion.img
                      src={photo}
                      alt="Alexandre Bindl"
                      className="biographie-image"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                    />
                    <div className="image-overlay"></div>
                    <div className="image-shine"></div>
                  </div>
                </div>
                <motion.div
                  className="biographie-signature"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <div className="signature-line"></div>
                  <p>Alexandre Bindl</p>
                  <span className="signature-title">Artiste Peintre</span>
                </motion.div>
              </motion.div>

              <motion.div
                className="biographie-text-wrapper"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              >
                <motion.div
                  className="biographie-intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  <div className="intro-decoration">
                    <div className="intro-line"></div>
                    <div className="intro-dot"></div>
                  </div>
                  <h2>À propos de l'artiste</h2>
                  <div className="intro-decoration">
                    <div className="intro-dot"></div>
                    <div className="intro-line"></div>
                  </div>
                </motion.div>
                <div className="biographie-text">
                  {biographie.split('\n\n').map((paragraph, index) => (
                    <motion.div
                      key={index}
                      className="text-block"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.15, duration: 0.6 }}
                    >
                      <div className="text-indicator"></div>
                      <p>{paragraph}</p>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  className="biographie-footer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                >
                  <div className="footer-line"></div>
                  <p className="footer-quote">"L'art est la plus belle des expressions"</p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Biographie;
