import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWorks } from '../contexts/WorksContext';
import FormSwitch from './FormSwitch';
import ImageDropzone from './ImageDropzone';
import './WorkForm.css';

const WorkForm = ({ type, work, onClose }) => {
  const { addWork, updateWork } = useWorks();
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    image: '',
    date: '',
    date_debut: '',
    date_fin: '',
    lieu: '',
    adresse: '',
    is_sold: false,
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (work) {
      const formatDate = (dateValue) => {
        if (!dateValue) return '';
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateValue;
        }
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setFormData({
        titre: work.titre || '',
        description: work.description || '',
        prix: work.prix || '',
        image: work.image || '',
        date: formatDate(work.date),
        date_debut: formatDate(work.date_debut),
        date_fin: formatDate(work.date_fin),
        lieu: work.lieu || '',
        adresse: work.adresse || '',
        is_sold: work.is_sold || false,
        is_featured: work.is_featured || false,
      });
    }
  }, [work]);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (work) {
        await updateWork(type, work.id, formData);
      } else {
        await addWork(type, formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const uploadFolder = type === 'evenements' ? 'evenements' : type;

  const featuredHint =
    type === 'evenements'
      ? 'Visible dans « Prochains rendez-vous » sur l’accueil'
      : 'Visible dans « En lumière » sur l’accueil';

  return (
    <motion.div
      className="form-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="form-modal form-modal--wide"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="form-modal-header">
          <h2>
            {work ? 'Modifier' : 'Ajouter'}{' '}
            {type === 'peintures' ? 'une peinture' : type === 'croquis' ? 'un croquis' : 'un événement'}
          </h2>
          <button type="button" className="form-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="app-form form-modal-body">
          <div className="form-block">
            <h3 className="form-block-title">Informations</h3>

            <div className="form-group">
              <label htmlFor="work-titre">Titre *</label>
              <input
                id="work-titre"
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                placeholder="Titre de l'œuvre"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="work-description">Description</label>
              <textarea
                id="work-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Technique, dimensions, contexte…"
              />
            </div>

            {type !== 'evenements' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="work-prix">Prix (€)</label>
                  <input
                    id="work-prix"
                    type="number"
                    name="prix"
                    value={formData.prix}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="1200"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="work-date">Date</label>
                  <input
                    id="work-date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {type === 'evenements' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="work-date-debut">Début *</label>
                    <input
                      id="work-date-debut"
                      type="date"
                      name="date_debut"
                      value={formData.date_debut}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="work-date-fin">Fin *</label>
                    <input
                      id="work-date-fin"
                      type="date"
                      name="date_fin"
                      value={formData.date_fin}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="work-lieu">Lieu</label>
                  <input
                    id="work-lieu"
                    type="text"
                    name="lieu"
                    value={formData.lieu}
                    onChange={handleChange}
                    placeholder="Galerie, musée…"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="work-adresse">Adresse *</label>
                  <input
                    id="work-adresse"
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Adresse complète"
                    required
                  />
                  <small className="field-hint">Utilisée pour le lien Google Maps</small>
                </div>
              </>
            )}
          </div>

          <div className="form-block">
            <h3 className="form-block-title">Visibilité</h3>
            <div className="form-switch-stack">
              {type !== 'evenements' && (
                <FormSwitch
                  id="work-is-sold"
                  name="is_sold"
                  checked={formData.is_sold}
                  onChange={handleChange}
                  label="Collection privée"
                  description="Masque le prix et indique que l’œuvre n’est plus disponible"
                />
              )}
              <FormSwitch
                id="work-is-featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                label="Mettre en avant"
                description={featuredHint}
              />
            </div>
          </div>

          <div className="form-block">
            <ImageDropzone
              label="Visuel"
              folder={uploadFolder}
              value={formData.image}
              onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
            />
          </div>

          <div className="form-actions">
            <motion.button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Annuler
            </motion.button>
            <motion.button
              type="submit"
              className="btn-submit"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              {saving ? 'Enregistrement…' : work ? 'Enregistrer' : 'Créer'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default WorkForm;
