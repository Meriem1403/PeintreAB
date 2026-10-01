import { motion } from 'framer-motion';

const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className = '',
}) => (
  <motion.header
    className={`section-heading section-heading--${align} ${className}`.trim()}
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    {eyebrow && <span className="section-heading-eyebrow">{eyebrow}</span>}
    <h2 className="section-heading-title">{title}</h2>
    {subtitle && <p className="section-heading-subtitle">{subtitle}</p>}
  </motion.header>
);

export default SectionHeading;
