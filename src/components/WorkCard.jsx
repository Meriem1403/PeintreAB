import { FaExternalLinkAlt, FaGripVertical } from 'react-icons/fa';
import { workDetailPath } from '../constants/galleryRoutes';
import { useGalleryCategories } from '../contexts/GalleryCategoriesContext';
import './WorkCard.css';

const WorkCard = ({ work, type, onEdit, onDelete }) => {
  const { isEventsSlug } = useGalleryCategories();
  const isEvent = isEventsSlug(type);
  const previewHref = work?.id ? workDetailPath(type, work.id) : null;

  const openPreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!previewHref) return;
    window.open(previewHref, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="work-card">
      {work.image && (
        <div className="work-card-image">
          <img src={work.image} alt={work.titre} />
          {previewHref && (
            <button
              type="button"
              className="work-card-image__preview"
              onClick={openPreview}
              draggable={false}
            >
              <FaExternalLinkAlt aria-hidden />
              Aperçu
            </button>
          )}
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
          {!isEvent && work.prix && <span className="work-price">{work.prix}€</span>}
          {isEvent && (work.date_debut || work.date) && (
            <span className="work-date">
              {new Date(work.date_debut || work.date).toLocaleDateString('fr-FR')}
            </span>
          )}
          {isEvent && work.lieu && <span className="work-lieu">{work.lieu}</span>}
        </div>

        <div
          className="work-card-actions"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {previewHref && (
            <button
              type="button"
              className="btn-preview"
              onClick={openPreview}
              draggable={false}
              title="Ouvre la page publique dans un nouvel onglet (l’admin reste ouvert)"
            >
              <FaExternalLinkAlt aria-hidden />
              Aperçu
            </button>
          )}
          <button
            type="button"
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
            type="button"
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
