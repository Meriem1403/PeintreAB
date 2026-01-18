import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWorks } from '../contexts/WorksContext';
import './WorkForm.css';

const WorkForm = ({ type, work, onClose }) => {
  const { addWork, updateWork } = useWorks();
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    image: '',
    date: '',
    lieu: '',
    is_sold: false,
    is_featured: false
  });

  useEffect(() => {
    if (work) {
      setFormData({
        titre: work.titre || '',
        description: work.description || '',
        prix: work.prix || '',
        image: work.image || '',
        date: work.date || '',
        lieu: work.lieu || '',
        is_sold: work.is_sold || false,
        is_featured: work.is_featured || false
      });
    }
  }, [work]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (work) {
      updateWork(type, work.id, formData);
    } else {
      addWork(type, formData);
    }
    onClose();
  };

  return (
    <motion.div
      className="form-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="form-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="form-header">
          <h2>{work ? 'Modifier' : 'Ajouter'} {type === 'peintures' ? 'une peinture' : type === 'croquis' ? 'un croquis' : 'un événement'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="work-form">
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          {type !== 'evenements' && (
            <div className="form-group">
              <label>Prix (€)</label>
              <input
                type="number"
                name="prix"
                value={formData.prix}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Champ date pour tous les types */}
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          {type === 'evenements' && (
            <div className="form-group">
              <label>Lieu</label>
              <input
                type="text"
                name="lieu"
                value={formData.lieu}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Champ is_sold pour peintures et croquis */}
          {type !== 'evenements' && (
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_sold"
                  checked={formData.is_sold}
                  onChange={handleChange}
                />
                <span>Œuvre vendue</span>
              </label>
            </div>
          )}

          {/* Champ is_featured pour tous les types */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
              />
              <span>Mettre en avant (apparaît sur la page d'accueil)</span>
            </label>
          </div>

          <div className="form-group">
            <label>Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            {formData.image && (
              <img src={formData.image} alt="Preview" className="image-preview" />
            )}
            <input
              type="text"
              name="image"
              placeholder="Ou URL de l'image"
              value={formData.image && !formData.image.startsWith('data:') ? formData.image : ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <motion.button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Annuler
            </motion.button>
            <motion.button
              type="submit"
              className="btn-submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {work ? 'Modifier' : 'Ajouter'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default WorkForm;
