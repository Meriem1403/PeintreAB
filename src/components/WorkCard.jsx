import { motion } from 'framer-motion';
import { FaGripVertical } from 'react-icons/fa';
import './WorkCard.css';

const WorkCard = ({ work, type, onEdit, onDelete }) => {
  return (
    <div className="work-card">
      {work.image && (
        <div className="work-card-image">
          <img src={work.image} alt={work.titre} />
        </div>
      )}
      
      <div className="work-card-content">
        <div className="work-card-header">
          <div className="drag-handle">
            <FaGripVertical />
          </div>
          <h3>{work.titre}</h3>
        </div>
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

        <div className="work-card-actions" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-edit"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            draggable={false}
          >
            Modifier
          </button>
          <button
            className="btn-delete"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            draggable={false}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkCard;
