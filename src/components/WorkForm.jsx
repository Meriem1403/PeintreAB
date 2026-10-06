import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWorks } from '../contexts/WorksContext';
import FormSwitch from './FormSwitch';
import ImageDropzone from './ImageDropzone';
import EventTicketSlotsEditor from './EventTicketSlotsEditor';
import { worksAPI } from '../utils/apiService';
import {
  buildSlotsFromEventDates,
  emptySlot,
  formatDurationLabel,
  isEventPast,
} from '../utils/eventDates';
import './WorkForm.css';
import ModalPortal from './ModalPortal';

const formatDateField = (dateValue) => {
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
    ticket_mode: 'closed',
  });
  const [ticketSlots, setTicketSlots] = useState([emptySlot()]);
  const [registrationsOpen, setRegistrationsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const eventDuration = useMemo(() => {
    if (type !== 'evenements') return null;
    return formatDurationLabel(formData.date_debut, formData.date_fin);
  }, [type, formData.date_debut, formData.date_fin]);

  const eventEnded = useMemo(
    () => type === 'evenements' && isEventPast(formData.date_fin),
    [type, formData.date_fin]
  );

  useEffect(() => {
    if (work) {
      setFormData({
        titre: work.titre || '',
        description: work.description || '',
        prix: work.prix || '',
        image: work.image || '',
        date: formatDateField(work.date),
        date_debut: formatDateField(work.date_debut),
        date_fin: formatDateField(work.date_fin),
        lieu: work.lieu || '',
        adresse: work.adresse || '',
        is_sold: work.is_sold || false,
        is_featured: work.is_featured || false,
        ticket_mode: work.ticket_mode || 'closed',
      });
    }
  }, [work]);

  useEffect(() => {
    if (type !== 'evenements' || !work?.id) {
      if (type === 'evenements' && !work) {
        setTicketSlots([emptySlot()]);
        setRegistrationsOpen(false);
      }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const full = await worksAPI.getById(work.id);
        if (cancelled) return;
        const d1 = formatDateField(full.date_debut);
        const d2 = formatDateField(full.date_fin);
        const apiSlots = full.ticket_slots?.length
          ? full.ticket_slots.map((s) => ({
              label: s.label || '',
              slot_date: formatDateField(s.slot_date),
              capacity_mode: s.capacity_mode || 'limited',
              capacity: s.capacity ?? '',
            }))
          : [];
        setTicketSlots(
          d1 && d2 && d2 >= d1
            ? buildSlotsFromEventDates(d1, d2, apiSlots)
            : apiSlots.length
              ? apiSlots
              : [emptySlot()]
        );
        const past = isEventPast(d2);
        setRegistrationsOpen(full.ticket_mode !== 'closed' && !past);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [work?.id, type, work]);

  useEffect(() => {
    if (eventEnded) setRegistrationsOpen(false);
  }, [eventEnded]);

  const applyDateRangeToSlots = (debut, fin, previousSlots) => {
    if (!debut || !fin || fin < debut) return;
    setTicketSlots(buildSlotsFromEventDates(debut, fin, previousSlots));
  };

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    const nextValue = inputType === 'checkbox' ? checked : value;

    if (type === 'evenements' && (name === 'date_debut' || name === 'date_fin')) {
      setFormData((prev) => {
        const next = { ...prev, [name]: nextValue };
        setTicketSlots((prevSlots) => {
          const built = buildSlotsFromEventDates(next.date_debut, next.date_fin, prevSlots);
          return built;
        });
        if (name === 'date_fin' && isEventPast(nextValue)) {
          setRegistrationsOpen(false);
        }
        return next;
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const openRegs = registrationsOpen && !eventEnded;
      const payload = {
        ...formData,
        ticket_mode: type === 'evenements' ? (openRegs ? 'open' : 'closed') : 'closed',
        ticket_slots: type === 'evenements' && openRegs ? ticketSlots : [],
      };
      if (work) {
        await updateWork(type, work.id, payload);
      } else {
        await addWork(type, payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
      window.alert(err.message || 'Erreur lors de l’enregistrement');
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
    <ModalPortal>
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
                <div className="form-group form-group--date">
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
                  <div className="form-group form-group--date">
                    <label htmlFor="work-date-debut">Début *</label>
                    <div className="form-date-shell">
                      <input
                        id="work-date-debut"
                        type="date"
                        name="date_debut"
                        value={formData.date_debut}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group form-group--date">
                    <label htmlFor="work-date-fin">Fin *</label>
                    <div className="form-date-shell">
                      <input
                        id="work-date-fin"
                        type="date"
                        name="date_fin"
                        value={formData.date_fin}
                        onChange={handleChange}
                        min={formData.date_debut || undefined}
                        required
                      />
                    </div>
                  </div>
                </div>
                {eventDuration && (
                  <p className="work-form__duration" role="status">
                    Durée : <strong>{eventDuration.dayWord}</strong> ({eventDuration.range})
                  </p>
                )}
                {formData.date_debut &&
                  formData.date_fin &&
                  formData.date_fin < formData.date_debut && (
                    <p className="work-form__duration work-form__duration--error">
                      La date de fin doit être après le début.
                    </p>
                  )}
                {eventEnded && (
                  <p className="work-form__duration work-form__duration--warn">
                    Événement terminé — les inscriptions sont fermées automatiquement.
                  </p>
                )}
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
                <div className="form-block" style={{ marginTop: '1rem' }}>
                  <h3 className="form-block-title">Billetterie</h3>
                  <EventTicketSlotsEditor
                    enabled={registrationsOpen && !eventEnded}
                    onEnabledChange={(v) => !eventEnded && setRegistrationsOpen(v)}
                    slots={ticketSlots}
                    onChange={setTicketSlots}
                    duration={eventDuration}
                    datesValid={
                      Boolean(formData.date_debut && formData.date_fin) &&
                      formData.date_fin >= formData.date_debut
                    }
                  />
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
    </ModalPortal>
  );
};

export default WorkForm;
