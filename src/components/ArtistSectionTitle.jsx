import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * En-tête de section accueil — galerie, alignement éditorial.
 */
const ArtistSectionTitle = ({
  title,
  lead,
  className = '',
  align = 'left',
  eyebrow,
  actionLabel,
  actionTo,
}) => (
  <motion.header
    className={`artist-section-title artist-section-title--${align} ${className}`.trim()}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
  >
    <div className="artist-section-title-main">
      {eyebrow && <p className="artist-section-title-eyebrow">{eyebrow}</p>}
      <h2 className="artist-section-title-text">{title}</h2>
      {lead && <p className="artist-section-title-lead">{lead}</p>}
    </div>
    {actionLabel && actionTo && (
      <Link to={actionTo} className="artist-section-title-action">
        {actionLabel}
      </Link>
    )}
  </motion.header>
);

export default ArtistSectionTitle;
