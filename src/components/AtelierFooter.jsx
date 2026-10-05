import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaFacebook, FaInstagram, FaGlobe, FaPhone } from 'react-icons/fa';
import { contactInfoAPI } from '../utils/apiService';

const defaultContact = {
  facebook: {
    name: 'Alexandre Bindl - Artiste Peintre',
    url: 'https://www.facebook.com/AlexandreBindlArtistePeintre',
  },
  instagram: {
    name: 'Alexandre_Bindl',
    url: 'https://www.instagram.com/Alexandre_Bindl',
  },
  website: {
    name: 'www.alexandre-bindl.fr',
    url: 'http://www.alexandre-bindl.fr',
  },
  email: 'alexandre.bindl@gmail.com',
  phone: '06 32 00 12 28',
};

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-5%' },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
};

const footerNameContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.08 },
  },
};

const footerNamePart = {
  hidden: { opacity: 0, y: '0.35em' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
  },
};

const footerNameRule = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 1.05, delay: 0.15, ease: [0.22, 1, 0.36, 1] },
  },
};

const AtelierFooter = ({ onBackToTop, onGoToFooter }) => {
  const [contact, setContact] = useState(defaultContact);

  useEffect(() => {
    let cancelled = false;
    contactInfoAPI
      .get()
      .then((data) => {
        if (cancelled) return;
        setContact({
          facebook: {
            name: data.facebook_name || defaultContact.facebook.name,
            url: data.facebook_url || defaultContact.facebook.url,
          },
          instagram: {
            name: data.instagram_name || defaultContact.instagram.name,
            url: data.instagram_url || defaultContact.instagram.url,
          },
          website: {
            name: data.website_name || defaultContact.website.name,
            url: data.website_url || defaultContact.website.url,
          },
          email: data.email || defaultContact.email,
          phone: data.phone || defaultContact.phone,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer className="atelier-footer" id="atelier-footer">
      <div className="atelier-footer__glow atelier-footer__glow--left" aria-hidden="true" />
      <div className="atelier-footer__glow atelier-footer__glow--right" aria-hidden="true" />
      <div className="atelier-footer__rule" aria-hidden="true" />

      <div className="atelier-wrap atelier-footer__inner">
        <motion.div className="atelier-footer__hero" {...fade}>
          <p className="atelier-footer__kicker">Atelier · Peinture & croquis</p>
          <motion.h2
            className="atelier-footer__name"
            variants={footerNameContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-8%' }}
          >
            <motion.span className="atelier-footer__name-word" variants={footerNamePart}>
              Alexandre
            </motion.span>
            <motion.span
              className="atelier-footer__name-word atelier-footer__name-word--bindl"
              variants={footerNamePart}
            >
              Bindl
            </motion.span>
            <motion.span
              className="atelier-footer__name-rule"
              variants={footerNameRule}
              aria-hidden="true"
            />
          </motion.h2>
          <blockquote className="atelier-footer__quote">
            « La peinture, c&apos;est le silence qui prend forme. »
          </blockquote>
          <Link to="/contact" className="atelier-footer__cta">
            Écrire à l&apos;artiste
          </Link>
        </motion.div>

        <div className="atelier-footer__columns">
          <motion.div className="atelier-footer__col" {...fade} transition={{ delay: 0.08 }}>
            <h3 className="atelier-footer__heading">Parcours</h3>
            <nav className="atelier-footer__links" aria-label="Navigation du site">
              <Link to="/galerie">Galerie</Link>
              <Link to="/biographie">Biographie</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/confidentialite">Confidentialité</Link>
            </nav>
          </motion.div>

          <motion.div className="atelier-footer__col" {...fade} transition={{ delay: 0.14 }}>
            <h3 className="atelier-footer__heading">Sur cette page</h3>
            <nav className="atelier-footer__links" aria-label="Sections de l'accueil">
              <button type="button" onClick={() => scrollToSection('atelier-events')}>
                Agenda
              </button>
              <button type="button" onClick={() => scrollToSection('atelier-works')}>
                Sélection
              </button>
              <button type="button" onClick={onBackToTop}>
                Hero
              </button>
              <button type="button" onClick={onGoToFooter}>
                Pied de page
              </button>
            </nav>
          </motion.div>

          <motion.div className="atelier-footer__col atelier-footer__col--contact" {...fade} transition={{ delay: 0.2 }}>
            <h3 className="atelier-footer__heading">Contact</h3>
            <ul className="atelier-footer__contact-list">
              <li>
                <a href={`mailto:${contact.email}`}>
                  <FaEnvelope aria-hidden />
                  <span>{contact.email}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                  <FaPhone aria-hidden />
                  <span>{contact.phone}</span>
                </a>
              </li>
            </ul>
            <div className="atelier-footer__social" aria-label="Réseaux sociaux">
              <a href={contact.facebook.url} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href={contact.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href={contact.website.url} target="_blank" rel="noopener noreferrer" aria-label="Site web">
                <FaGlobe />
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div className="atelier-footer__bar" {...fade} transition={{ delay: 0.26 }}>
          <p className="atelier-footer__copy">
            © {new Date().getFullYear()} Alexandre Bindl — Tous droits réservés
          </p>
          <button type="button" className="atelier-footer__top" onClick={onBackToTop}>
            Retour en haut ↑
          </button>
        </motion.div>
      </div>
    </footer>
  );
};

export default AtelierFooter;
