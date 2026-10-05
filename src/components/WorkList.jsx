import { useEffect, useState } from 'react';
import { useWorks } from '../contexts/WorksContext';
import WorkCard from './WorkCard';
import './WorkList.css';

const ITEMS_PER_PAGE = 12;

const WorkList = ({ type, onEdit }) => {
  const { works, removeWork, updateWork } = useWorks();
  const items = works[type] || [];
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragOverZone, setDragOverZone] = useState(null);
  const [page, setPage] = useState(1);

  const sortedItems = [...items].sort((a, b) => {
    const orderA = a.display_order !== undefined && a.display_order !== null ? a.display_order : 999999;
    const orderB = b.display_order !== undefined && b.display_order !== null ? b.display_order : 999999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB - dateA;
  });

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [type]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const clearDragState = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    setDragOverZone(null);
  };

  const applyReorder = async (sourceIndex, targetIndex) => {
    if (sourceIndex === targetIndex) {
      clearDragState();
      return;
    }

    try {
      const newItems = [...sortedItems];
      const [movedItem] = newItems.splice(sourceIndex, 1);
      const insertAt = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newItems.splice(insertAt, 0, movedItem);

      const updates = newItems.map((item, idx) => updateWork(type, item.id, { display_order: idx }));
      await Promise.all(updates);
      clearDragState();
    } catch (error) {
      console.error('❌ Erreur lors du déplacement:', error);
      clearDragState();
    }
  };

  const handleDragStart = (e, work, globalIndex) => {
    setDraggedItem({ work, index: globalIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    clearDragState();
  };

  const handleDragOver = (e, globalIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(null);
    setDragOverIndex(globalIndex);
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (!draggedItem) return;
    await applyReorder(draggedItem.index, targetIndex);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleZoneDragOver = (e, zone) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(null);
    setDragOverZone(zone);
  };

  const handleDropPreviousPage = async (e) => {
    e.preventDefault();
    if (!draggedItem || page <= 1) return;
    const targetIndex = startIndex - 1;
    await applyReorder(draggedItem.index, targetIndex);
    setPage((p) => Math.max(1, p - 1));
  };

  const handleDropNextPage = async (e) => {
    e.preventDefault();
    if (!draggedItem || page >= totalPages) return;
    const targetIndex = startIndex + pageItems.length;
    await applyReorder(draggedItem.index, targetIndex);
    setPage((p) => Math.min(totalPages, p + 1));
  };

  const handleDelete = async (work) => {
    const typeLabel = type === 'peintures' ? 'peinture' : type === 'croquis' ? 'croquis' : 'événement';
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer cette ${typeLabel} ?\n\n"${work.titre}"\n\nCette action est irréversible.`
    );

    if (confirmed) {
      try {
        await removeWork(type, work.id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Une erreur est survenue lors de la suppression.');
      }
    }
  };

  const isDragging = Boolean(draggedItem);
  const showPrevZone = isDragging && page > 1;
  const showNextZone = isDragging && page < totalPages;

  if (sortedItems.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucune œuvre pour le moment. Ajoutez-en une pour commencer !</p>
      </div>
    );
  }

  return (
    <div className="work-list-wrap">
      {showPrevZone && (
        <div
          className={`work-list-page-zone work-list-page-zone--prev ${dragOverZone === 'prev' ? 'is-active' : ''}`}
          onDragOver={(e) => handleZoneDragOver(e, 'prev')}
          onDragLeave={() => setDragOverZone(null)}
          onDrop={handleDropPreviousPage}
        >
          Déposer ici pour envoyer vers la page {page - 1}
        </div>
      )}

      <div className="work-list">
        {pageItems.map((work, indexOnPage) => {
          const globalIndex = startIndex + indexOnPage;
          return (
            <div
              key={work.id}
              draggable
              onDragStart={(e) => {
                if (e.target.closest('.work-card-actions')) {
                  e.preventDefault();
                  return;
                }
                handleDragStart(e, work, globalIndex);
              }}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, globalIndex)}
              onDrop={(e) => handleDrop(e, globalIndex)}
              onDragLeave={handleDragLeave}
              className={`work-list-item ${dragOverIndex === globalIndex ? 'drag-over' : ''} ${draggedItem?.index === globalIndex ? 'dragging' : ''}`}
            >
              <WorkCard
                work={work}
                type={type}
                onEdit={() => onEdit(work)}
                onDelete={() => handleDelete(work)}
              />
            </div>
          );
        })}
      </div>

      {showNextZone && (
        <div
          className={`work-list-page-zone work-list-page-zone--next ${dragOverZone === 'next' ? 'is-active' : ''}`}
          onDragOver={(e) => handleZoneDragOver(e, 'next')}
          onDragLeave={() => setDragOverZone(null)}
          onDrop={handleDropNextPage}
        >
          Déposer ici pour envoyer vers la page {page + 1}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="work-list-pagination" aria-label="Pagination des œuvres">
          <button
            type="button"
            className="work-list-pagination__btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </button>
          <span className="work-list-pagination__info">
            Page {page} sur {totalPages}
            <span className="work-list-pagination__count">
              ({sortedItems.length} œuvre{sortedItems.length > 1 ? 's' : ''})
              {isDragging && totalPages > 1 && (
                <span className="work-list-pagination__hint"> — glissez vers les zones en haut ou en bas pour changer de page</span>
              )}
            </span>
          </span>
          <button
            type="button"
            className="work-list-pagination__btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </button>
        </nav>
      )}
    </div>
  );
};

export default WorkList;
