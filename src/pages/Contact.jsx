import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FaCheckCircle,
  FaEnvelope,
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaPhone,
} from 'react-icons/fa';
import { contactInfoAPI, contactsAPI } from '../utils/apiService';
import './Contact.css';

const defaultContactInfo = {
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

const Contact = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [contactInfo, setContactInfo] = useState(defaultContactInfo);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    loadContactInfo();
  }, [location.pathname, reduceMotion]);

  const loadContactInfo = async () => {
    try {
      setLoading(true);
      const data = await contactInfoAPI.get();
      setContactInfo({
        facebook: {
          name: data.facebook_name || defaultContactInfo.facebook.name,
          url: data.facebook_url || defaultContactInfo.facebook.url,
        },
        instagram: {
          name: data.instagram_name || defaultContactInfo.instagram.name,
          url: data.instagram_url || defaultContactInfo.instagram.url,
        },
        website: {
          name: data.website_name || defaultContactInfo.website.name,
          url: data.website_url || defaultContactInfo.website.url,
        },
        email: data.email || defaultContactInfo.email,
        phone: data.phone || defaultContactInfo.phone,
      });
    } catch (err) {
      console.error('Erreur lors du chargement des informations de contact:', err);
    } finally {
      setLoading(false);
    }
  };

  const fadeIn = (delay = 0) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await contactsAPI.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || 'Message depuis la page Contact',
        message: formData.message.trim(),
      });
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || 'Impossible d\'envoyer le message. Réessayez plus tard.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-page" key={location.pathname}>
      <header className="contact-page__hero">
        <motion.div className="contact-page__hero-inner" {...fadeIn(0.05)}>
          <p className="contact-page__kicker">Dialogue</p>
          <h1 className="contact-page__title">Écrire à l&apos;artiste</h1>
          <p className="contact-page__hero-lead">
            Acquisition, exposition ou simple curiosité — chaque message est lu avec attention.
          </p>
        </motion.div>
      </header>

      <div className="contact-page__body">
        <motion.div className="contact-page__card" {...fadeIn(0.15)}>
          <section className="contact-page__form-block" aria-labelledby="contact-form-heading">
            <div className="contact-page__form-head">
              <h2 id="contact-form-heading">Votre message</h2>
              <p>Réponse personnelle dès que possible. Un accusé de réception vous est envoyé par email.</p>
            </div>

            {success ? (
              <div className="contact-page__success" role="status">
                <FaCheckCircle className="contact-page__success-icon" aria-hidden />
                <p className="contact-page__success-title">Message bien reçu</p>
                <p className="contact-page__success-text">
                  Merci pour votre confiance. Alexandre Bindl reviendra vers vous prochainement.
                </p>
                <button
                  type="button"
                  className="contact-page__btn contact-page__btn--ghost"
                  onClick={() => setSuccess(false)}
                >
                  Nouveau message
                </button>
              </div>
            ) : (
              <form className="contact-page__form" onSubmit={handleSubmit} noValidate>
                <div className="contact-page__form-row">
                  <div className="contact-page__field">
                    <label htmlFor="contact-page-name">Nom</label>
                    <input
                      id="contact-page-name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div className="contact-page__field">
                    <label htmlFor="contact-page-email">Email</label>
                    <input
                      id="contact-page-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div className="contact-page__field">
                  <label htmlFor="contact-page-subject">Objet</label>
                  <input
                    id="contact-page-subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Facultatif — ex. une œuvre, une date de vernissage…"
                  />
                </div>

                <div className="contact-page__field">
                  <label htmlFor="contact-page-message">Message</label>
                  <textarea
                    id="contact-page-message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Décrivez votre demande…"
                  />
                </div>

                {error && (
                  <p className="contact-page__error" role="alert">
                    {error}
                  </p>
                )}

                <button type="submit" className="contact-page__btn contact-page__btn--primary" disabled={sending}>
                  {sending ? 'Envoi en cours…' : 'Envoyer à l\'artiste'}
                </button>
              </form>
            )}
          </section>

          <aside className="contact-page__aside" aria-labelledby="contact-aside-heading">
            <h2 id="contact-aside-heading" className="contact-page__aside-title">
              Coordonnées
            </h2>
            <p className="contact-page__aside-lead">Autres moyens de me joindre ou de suivre le travail en cours.</p>

            {loading ? (
              <p className="contact-page__aside-loading">Chargement…</p>
            ) : (
              <>
                <div className="contact-page__direct">
                  <a href={`mailto:${contactInfo.email}`} className="contact-page__direct-card">
                    <FaEnvelope aria-hidden />
                    <span className="contact-page__direct-label">Email</span>
                    <span className="contact-page__direct-value">{contactInfo.email}</span>
                  </a>
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                    className="contact-page__direct-card"
                  >
                    <FaPhone aria-hidden />
                    <span className="contact-page__direct-label">Téléphone</span>
                    <span className="contact-page__direct-value">{contactInfo.phone}</span>
                  </a>
                </div>

                <p className="contact-page__social-label">Réseaux & site</p>
                <div className="contact-page__social">
                  <a
                    href={contactInfo.website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-page__social-link"
                    title={contactInfo.website.name}
                  >
                    <FaGlobe aria-hidden />
                    <span>Site</span>
                  </a>
                  <a
                    href={contactInfo.facebook.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-page__social-link contact-page__social-link--fb"
                    title={contactInfo.facebook.name}
                  >
                    <FaFacebook aria-hidden />
                    <span>Facebook</span>
                  </a>
                  <a
                    href={contactInfo.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-page__social-link contact-page__social-link--ig"
                    title={contactInfo.instagram.name}
                  >
                    <FaInstagram aria-hidden />
                    <span>Instagram</span>
                  </a>
                </div>
              </>
            )}
          </aside>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
