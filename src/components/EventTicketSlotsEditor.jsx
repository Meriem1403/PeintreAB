import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import FormSwitch from './FormSwitch';
import { emptySlot } from '../utils/eventDates';
import './EventTicketSlotsEditor.css';

const EventTicketSlotsEditor = ({
  enabled,
  onEnabledChange,
  slots,
  onChange,
  duration,
  datesValid,
}) => {
  const [sameQuotaAllDays, setSameQuotaAllDays] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});

  const updateSlot = (index, patch) => {
    onChange(slots.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const applyCapacityToAll = (patch) => {
    onChange(slots.map((s) => ({ ...s, ...patch })));
  };

  const toggleDayExpanded = (index) => {
    setExpandedDays((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleUniformToggle = (on) => {
    setSameQuotaAllDays(on);
    if (on && slots.length > 0) {
      applyCapacityToAll({
        capacity_mode: slots[0].capacity_mode || 'limited',
        capacity: slots[0].capacity_mode === 'unlimited' ? '' : slots[0].capacity ?? '',
      });
      setExpandedDays({});
    }
  };

  const handleUniformCapacityChange = (patch) => {
    applyCapacityToAll(patch);
  };

  const addSlot = () => onChange([...slots, emptySlot()]);

  const removeSlot = (index) => {
    if (slots.length <= 1) return;
    onChange(slots.filter((_, i) => i !== index));
    setExpandedDays((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const templateMode = slots[0]?.capacity_mode || 'limited';
  const templateCapacity = slots[0]?.capacity ?? '';

  const showDayCapacity = (index) => !sameQuotaAllDays || Boolean(expandedDays[index]);

  return (
    <div className="event-slots-editor">
      <div className="form-group">
        <label htmlFor="work-ticket-mode">Inscriptions en ligne</label>
        <select
          id="work-ticket-mode"
          value={enabled ? 'open' : 'closed'}
          onChange={(e) => onEnabledChange(e.target.value === 'open')}
          disabled={!datesValid}
        >
          <option value="closed">Fermées</option>
          <option value="open">Ouvertes (billets par créneau / jour)</option>
        </select>
        <small className="field-hint">
          {datesValid
            ? 'Un créneau est généré par jour entre début et fin (modifiable ci-dessous).'
            : 'Renseignez d’abord les dates de début et de fin.'}
        </small>
      </div>

      {enabled && datesValid && duration && (
        <p className="event-slots-editor__sync">
          {duration.days} créneau{duration.days > 1 ? 'x' : ''} — {duration.dayWord}
        </p>
      )}

      {enabled && datesValid && (
        <>
          <FormSwitch
            id="slot-uniform-toggle"
            name="slot_uniform"
            checked={sameQuotaAllDays}
            onChange={(e) => handleUniformToggle(e.target.checked)}
            label="Même places / quota pour tous les jours"
            description="Valeur globale appliquée à chaque jour ; vous pouvez ajuster un jour via « Personnaliser »."
          />

          {sameQuotaAllDays && (
            <div className="event-slots-editor__uniform-fields event-slots-editor__capacity-line">
              <div className="form-group">
                <label htmlFor="slot-uniform-mode">Places (tous les jours)</label>
                <select
                  id="slot-uniform-mode"
                  value={templateMode}
                  onChange={(e) =>
                    handleUniformCapacityChange({
                      capacity_mode: e.target.value,
                      capacity: e.target.value === 'unlimited' ? '' : templateCapacity,
                    })
                  }
                >
                  <option value="limited">Nombre limité</option>
                  <option value="unlimited">Illimité</option>
                </select>
              </div>
              {templateMode === 'limited' ? (
                <div className="form-group">
                  <label htmlFor="slot-uniform-cap">Quota (tous les jours) *</label>
                  <input
                    id="slot-uniform-cap"
                    type="number"
                    min="1"
                    value={templateCapacity}
                    onChange={(e) => handleUniformCapacityChange({ capacity: e.target.value })}
                    placeholder="10"
                    required={enabled}
                  />
                </div>
              ) : (
                <div className="event-slots-editor__capacity-spacer" aria-hidden />
              )}
            </div>
          )}

          <div className="event-slots-editor__list">
            <div className="event-slots-editor__list-head">
              <span>Créneaux</span>
              <button type="button" className="event-slots-editor__add" onClick={addSlot}>
                <FiPlus aria-hidden />
                Ajouter
              </button>
            </div>

            {slots.map((slot, index) => (
              <div key={`${slot.slot_date}-${index}`} className="event-slots-editor__row">
                <div className="event-slots-editor__row-main">
                  <div className="form-group">
                    <label htmlFor={`slot-label-${index}`}>Libellé *</label>
                    <input
                      id={`slot-label-${index}`}
                      type="text"
                      value={slot.label}
                      onChange={(e) => updateSlot(index, { label: e.target.value })}
                      placeholder="Jour 1 — vernissage"
                      required={enabled}
                    />
                  </div>
                  <div className="form-group form-group--date">
                    <label htmlFor={`slot-date-${index}`}>Date</label>
                    <div className="form-date-shell">
                      <input
                        id={`slot-date-${index}`}
                        type="date"
                        value={slot.slot_date || ''}
                        onChange={(e) => updateSlot(index, { slot_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {sameQuotaAllDays && !expandedDays[index] && (
                  <button
                    type="button"
                    className="event-slots-editor__expand"
                    onClick={() => toggleDayExpanded(index)}
                  >
                    <FiChevronDown aria-hidden />
                    Personnaliser places / quota pour ce jour
                  </button>
                )}

                {sameQuotaAllDays && expandedDays[index] && (
                  <button
                    type="button"
                    className="event-slots-editor__expand event-slots-editor__expand--open"
                    onClick={() => toggleDayExpanded(index)}
                  >
                    <FiChevronUp aria-hidden />
                    Replier (quota global pour ce jour)
                  </button>
                )}

                <div
                  className={`event-slots-editor__capacity-line ${
                    !showDayCapacity(index) ? 'event-slots-editor__capacity-line--collapsed' : ''
                  }`}
                >
                  {showDayCapacity(index) ? (
                    <>
                      <div className="form-group">
                        <label htmlFor={`slot-mode-${index}`}>Places</label>
                        <select
                          id={`slot-mode-${index}`}
                          value={slot.capacity_mode}
                          onChange={(e) =>
                            updateSlot(index, {
                              capacity_mode: e.target.value,
                              capacity: e.target.value === 'unlimited' ? '' : slot.capacity,
                            })
                          }
                        >
                          <option value="limited">Nombre limité</option>
                          <option value="unlimited">Illimité</option>
                        </select>
                      </div>
                      {slot.capacity_mode === 'limited' ? (
                        <div className="form-group">
                          <label htmlFor={`slot-cap-${index}`}>Quota *</label>
                          <input
                            id={`slot-cap-${index}`}
                            type="number"
                            min="1"
                            value={slot.capacity}
                            onChange={(e) => updateSlot(index, { capacity: e.target.value })}
                            placeholder="10"
                            required={enabled && slot.capacity_mode === 'limited'}
                          />
                        </div>
                      ) : (
                        <div className="event-slots-editor__capacity-spacer" aria-hidden />
                      )}
                    </>
                  ) : (
                    <p className="event-slots-editor__capacity-collapsed">Quota global appliqué</p>
                  )}

                  <button
                    type="button"
                    className="event-slots-editor__remove"
                    onClick={() => removeSlot(index)}
                    disabled={slots.length <= 1}
                    aria-label="Supprimer ce créneau"
                    title="Supprimer ce jour"
                  >
                    <FiTrash2 aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {enabled && (
        <small className="field-hint">
          Les billets sont envoyés par email avec QR code (aucun fichier sur le serveur).
        </small>
      )}
    </div>
  );
};

export default EventTicketSlotsEditor;
