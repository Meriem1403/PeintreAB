import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { PRIVACY_POLICY_VERSION, PRIVACY_SECTIONS } from '../constants/privacy';
import './Privacy.css';

const Privacy = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [location.pathname, reduceMotion]);

  const fadeIn = (delay = 0) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="privacy-page" key={location.pathname}>
      <header className="privacy-page__hero">
        <motion.div className="privacy-page__hero-inner" {...fadeIn(0.05)}>
          <p className="privacy-page__kicker">Transparence</p>
          <h1 className="privacy-page__title">Politique de confidentialité</h1>
          <p className="privacy-page__hero-lead">
            Résumé de l’usage de vos données sur ce site. Pour exercer vos droits ou poser une
            question, contactez l’artiste.
          </p>
          <p className="privacy-page__version">Version {PRIVACY_POLICY_VERSION}</p>
        </motion.div>
      </header>

      <div className="privacy-page__body">
        <motion.div className="privacy-page__layout" {...fadeIn(0.12)}>
          <nav className="privacy-page__toc" aria-label="Sommaire">
            <p className="privacy-page__toc-title">Sommaire</p>
            <ul>
              {PRIVACY_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="privacy-page__article">
            {PRIVACY_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="privacy-page__section">
                <h2>{section.title}</h2>
                {section.paragraphs?.map((p) => (
                  <p key={p.slice(0, 48)}>{p}</p>
                ))}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((item) => (
                      <li key={item.slice(0, 40)}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <aside className="privacy-page__contact-card">
              <h2>Contact &amp; droits</h2>
              <p>
                Pour accéder à vos données, les faire corriger ou supprimer, ou pour toute question
                relative à cette politique :
              </p>
              <Link to="/contact" className="brand-btn brand-btn--primary privacy-page__cta">
                Page Contact
              </Link>
              <p className="privacy-page__contact-note">
                Mentionnez « Données personnelles » dans votre message pour faciliter le traitement
                de votre demande.
              </p>
            </aside>
          </article>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
