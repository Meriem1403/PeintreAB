import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFacebook, FaInstagram, FaGlobe, FaEnvelope, FaPhone } from 'react-icons/fa';
import ParticlesBackground from '../components/ParticlesBackground';
import './Contact.css';

const Contact = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const contactInfo = {
    facebook: {
      name: 'Alexandre Bindl - Artiste Peintre',
      url: 'https://www.facebook.com/AlexandreBindlArtistePeintre'
    },
    instagram: {
      name: 'Alexandre_Bindl',
      url: 'https://www.instagram.com/Alexandre_Bindl'
    },
    website: {
      name: 'www.alexandre-bindl.fr',
      url: 'http://www.alexandre-bindl.fr'
    },
    email: 'alexandre.bindl@gmail.com',
    phone: '06 32 00 12 28'
  };

  return (
    <div className="contact" key={location.pathname}>
      <ParticlesBackground containerId="particles-container-contact" particleColor="#C6AC8F" />
      <motion.div
        className="contact-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="contact-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>Contact</h1>
        </motion.div>

        <motion.div
          className="contact-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="contact-intro">N'hésitez pas à me contacter pour toute question ou demande concernant mes œuvres</p>
          <div className="contact-grid">
            {/* Réseaux sociaux */}
            <motion.div
              className="contact-card social-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="card-header">
                <h2>Réseaux sociaux</h2>
                <div className="header-line"></div>
              </div>
              <div className="card-content">
                <a
                  href={contactInfo.facebook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link facebook-link"
                >
                  <FaFacebook className="contact-icon" />
                  <div className="link-content">
                    <span className="link-label">Facebook</span>
                    <span className="link-value">{contactInfo.facebook.name}</span>
                  </div>
                </a>
                <a
                  href={contactInfo.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link instagram-link"
                >
                  <FaInstagram className="contact-icon" />
                  <div className="link-content">
                    <span className="link-label">Instagram</span>
                    <span className="link-value">{contactInfo.instagram.name}</span>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* Site internet */}
            <motion.div
              className="contact-card website-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="card-header">
                <h2>Site internet</h2>
                <div className="header-line"></div>
              </div>
              <div className="card-content">
                <a
                  href={contactInfo.website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link website-link"
                >
                  <FaGlobe className="contact-icon" />
                  <div className="link-content">
                    <span className="link-value">{contactInfo.website.name}</span>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* Contact direct */}
            <motion.div
              className="contact-card direct-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="card-header">
                <h2>Contact direct</h2>
                <div className="header-line"></div>
              </div>
              <div className="card-content">
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="contact-link email-link"
                >
                  <FaEnvelope className="contact-icon" />
                  <div className="link-content">
                    <span className="link-label">Email</span>
                    <span className="link-value">{contactInfo.email}</span>
                  </div>
                </a>
                <a
                  href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                  className="contact-link phone-link"
                >
                  <FaPhone className="contact-icon" />
                  <div className="link-content">
                    <span className="link-label">Téléphone</span>
                    <span className="link-value">{contactInfo.phone}</span>
                  </div>
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Contact;
