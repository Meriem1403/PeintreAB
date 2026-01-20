import { useState } from 'react';
import { useWorks } from '../contexts/WorksContext';
import WorkCard from './WorkCard';
import './WorkList.css';

const WorkList = ({ type, onEdit }) => {
  const { works, removeWork, updateWork } = useWorks();
  const items = works[type] || [];
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Trier les items par display_order pour affichage
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

  const handleDragStart = (e, work, index) => {
    setDraggedItem({ work, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    try {
      const sourceIndex = draggedItem.index;
      
      // Créer un nouveau tableau avec l'élément déplacé
      const newItems = [...sortedItems];
      const [movedItem] = newItems.splice(sourceIndex, 1);
      newItems.splice(targetIndex, 0, movedItem);

      // Réassigner les ordres de manière séquentielle (0, 1, 2, ...)
      const updates = newItems.map((item, idx) => 
        updateWork(type, item.id, { display_order: idx })
      );

      await Promise.all(updates);
      
      setDraggedItem(null);
      setDragOverIndex(null);
    } catch (error) {
      console.error('❌ Erreur lors du déplacement:', error);
      setDraggedItem(null);
      setDragOverIndex(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
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

  if (sortedItems.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucune œuvre pour le moment. Ajoutez-en une pour commencer !</p>
      </div>
    );
  }

  return (
    <div className="work-list">
      {sortedItems.map((work, index) => (
        <div
          key={work.id}
          draggable
          onDragStart={(e) => {
            // Ne pas démarrer le drag si on clique sur un bouton
            if (e.target.closest('.work-card-actions')) {
              e.preventDefault();
              return;
            }
            handleDragStart(e, work, index);
          }}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragLeave={handleDragLeave}
          className={`work-list-item ${dragOverIndex === index ? 'drag-over' : ''} ${draggedItem?.index === index ? 'dragging' : ''}`}
        >
          <WorkCard
            work={work}
            type={type}
            onEdit={() => onEdit(work)}
            onDelete={() => handleDelete(work)}
          />
        </div>
      ))}
    </div>
  );
};

export default WorkList;
