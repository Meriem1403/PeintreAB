import { motion } from 'framer-motion';
import './WorkCard.css';

const WorkCard = ({ work, type, onEdit, onDelete }) => {
  return (
    <motion.div
      className="work-card"
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {work.image && (
        <div className="work-card-image">
          <img src={work.image} alt={work.titre} />
        </div>
      )}
      
      <div className="work-card-content">
        <h3>{work.titre}</h3>
        {work.description && <p className="work-description">{work.description}</p>}
        
        <div className="work-card-info">
          {type !== 'evenements' && work.prix && (
            <span className="work-price">{work.prix}€</span>
          )}
          {type === 'evenements' && work.date && (
            <span className="work-date">{new Date(work.date).toLocaleDateString('fr-FR')}</span>
          )}
          {type === 'evenements' && work.lieu && (
            <span className="work-lieu">{work.lieu}</span>
          )}
        </div>

        <div className="work-card-actions">
          <motion.button
            className="btn-edit"
            onClick={onEdit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Modifier
          </motion.button>
          <motion.button
            className="btn-delete"
            onClick={onDelete}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Supprimer
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default WorkCard;
