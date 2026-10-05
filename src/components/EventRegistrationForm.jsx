import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../utils/apiService';
import { PRIVACY_POLICY_PATH, PRIVACY_POLICY_SUMMARY } from '../constants/privacy';
import FormSwitch from './FormSwitch';
import '../styles/forms.css';
import './EventRegistrationForm.css';

const formatSlotDate = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const slotAvailabilityLabel = (slot) => {
  if (!slot.registration_open) return 'Complet';
  if (slot.unlimited) return 'Illimité';
  if (slot.remaining != null) return `${slot.remaining} / ${slot.capacity}`;
  return 'Disponible';
};

const EventRegistrationForm = ({ eventId, eventTitle, inModal = false, onClose, hideTitle = false }) => {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [form, setForm] = useState({
    slot_id: '',
    party_size: 1,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    accept_privacy: false,
    marketing_opt_in: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingInfo(true);
        const data = await eventsAPI.getTicketInfo(eventId);
        if (!cancelled) setInfo(data);
      } catch {
        if (!cancelled) setInfo(null);
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const usesSlots = info?.uses_slots && info.slots?.length > 0;
  const openSlots = useMemo(
    () => (usesSlots ? info.slots.filter((s) => s.registration_open) : []),
    [usesSlots, info]
  );

  const maxPartySize = useMemo(() => {
    const cap = 20;
    if (!info || info.ticket_mode === 'closed') return cap;
    if (usesSlots && form.slot_id) {
      const slot = info.slots?.find((s) => String(s.id) === String(form.slot_id));
      if (!slot) return cap;
      if (slot.unlimited) return cap;
      if (slot.remaining != null) return Math.min(cap, Math.max(1, slot.remaining));
      return cap;
    }
    if (!usesSlots && info.remaining != null) {
      return Math.min(cap, Math.max(1, info.remaining));
    }
    return cap;
  }, [info, usesSlots, form.slot_id]);

  useEffect(() => {
    setForm((prev) =>
      prev.party_size > maxPartySize ? { ...prev, party_size: maxPartySize } : prev
    );
  }, [maxPartySize]);

  useEffect(() => {
    if (!usesSlots || openSlots.length !== 1) return;
    setForm((prev) =>
      prev.slot_id ? prev : { ...prev, slot_id: String(openSlots[0].id) }
    );
  }, [usesSlots, openSlots]);

  if (!loadingInfo && (!info || info.ticket_mode === 'closed')) {
    return (
      <p className="event-registration__warn">
        Les inscriptions ne sont pas disponibles pour cet événement.
      </p>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitch = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
    if (name === 'accept_privacy' && checked) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.accept_privacy) {
      setError('Activez le consentement données pour continuer.');
      return;
    }
    if (usesSlots && !form.slot_id) {
      setError('Choisissez un jour de visite.');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        ...form,
        slot_id: form.slot_id ? parseInt(form.slot_id, 10) : undefined,
        party_size: form.party_size,
      };
      const res = await eventsAPI.register(eventId, body);
      const code = res.ticket_code;
      if (!code) {
        setError('Inscription enregistrée mais billet introuvable — contactez l’organisateur.');
        return;
      }
      onClose?.();
      const count = res.tickets_count || res.ticket_codes?.length || 1;
      const emailOk = res.email_sent !== false;
      let notice =
        count > 1
          ? `${count} billets générés — un QR code par personne.`
          : 'Inscription confirmée.';
      if (emailOk) {
        notice +=
          count > 1
            ? ' Une copie a été envoyée par email.'
            : ' Vérifiez votre boîte mail (et les spams).';
      } else {
        notice += ' Aucun email n’a pu être envoyé — conservez cette page ou le lien billet.';
      }

      navigate(`/billet/${code}`, {
        replace: false,
        state: {
          fromRegistration: true,
          message: notice,
          alreadyRegistered: res.already_registered,
          emailSent: emailOk,
        },
      });
    } catch (err) {
      setError(err.message || 'Inscription impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const closed = info && !info.registration_open;

  return (
    <section
      className={`event-registration exhibition-registration${inModal ? ' event-registration--modal' : ''}`}
      aria-labelledby={hideTitle ? undefined : 'event-registration-title'}
    >
      {!hideTitle && !inModal && (
        <h2 id="event-registration-title" className="event-registration__title">
          Réserver ma place
        </h2>
      )}

      {loadingInfo ? (
        <div className="event-registration__loading">
          <span className="event-registration__spinner" aria-hidden />
          <p>Chargement des créneaux…</p>
        </div>
      ) : (
        <>
          {closed ? (
            <p className="event-registration__warn">
              {info?.event_ended
                ? 'Cet événement est terminé — inscriptions closes.'
                : 'Inscriptions closes (complet ou non ouvertes).'}
            </p>
          ) : (
            <form className="event-registration__form" onSubmit={handleSubmit} noValidate>
              {usesSlots && (
                <fieldset className="event-registration__block">
                  <legend className="event-registration__legend">1. Jour de visite</legend>
                  <div className="event-registration__slots" role="radiogroup" aria-label="Créneau">
                    {info.slots.map((slot) => {
                      const disabled = !slot.registration_open;
                      const selected = String(form.slot_id) === String(slot.id);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={disabled}
                          className={`event-registration__day ${selected ? 'is-selected' : ''} ${
                            disabled ? 'is-disabled' : ''
                          }`}
                          onClick={() =>
                            setForm((prev) => ({ ...prev, slot_id: String(slot.id) }))
                          }
                          aria-pressed={selected}
                        >
                          <span className="event-registration__day-label">{slot.label}</span>
                          {slot.slot_date && (
                            <span className="event-registration__day-date">
                              {formatSlotDate(slot.slot_date)}
                            </span>
                          )}
                          <span
                            className={`event-registration__day-cap ${
                              disabled ? 'is-full' : ''
                            }`}
                          >
                            {slotAvailabilityLabel(slot)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {!usesSlots && info && (
                <p className="event-registration__meta">
                  {info.unlimited || info.free_entry
                    ? 'Entrée libre — inscrivez-vous pour recevoir votre billet.'
                    : info.remaining != null
                      ? `${info.remaining} place(s) restante(s).`
                      : null}
                </p>
              )}

              <fieldset className="event-registration__block">
                <legend className="event-registration__legend">
                  {usesSlots ? '2. Nombre de billets' : '1. Nombre de billets'}
                </legend>
                <div className="event-registration__qty">
                  <button
                    type="button"
                    className="brand-btn brand-btn--primary brand-btn--icon event-registration__qty-btn"
                    aria-label="Retirer un billet"
                    disabled={form.party_size <= 1}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        party_size: Math.max(1, prev.party_size - 1),
                      }))
                    }
                  >
                    −
                  </button>
                  <div className="event-registration__qty-value">
                    <span className="event-registration__qty-num">{form.party_size}</span>
                    <span className="event-registration__qty-label">
                      billet{form.party_size > 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="brand-btn brand-btn--primary brand-btn--icon event-registration__qty-btn"
                    aria-label="Ajouter un billet"
                    disabled={form.party_size >= maxPartySize || (usesSlots && !form.slot_id)}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        party_size: Math.min(maxPartySize, prev.party_size + 1),
                      }))
                    }
                  >
                    +
                  </button>
                </div>
                {usesSlots && !form.slot_id && (
                  <p className="event-registration__qty-hint">Choisissez d&apos;abord un jour.</p>
                )}
                {maxPartySize < 20 && (usesSlots ? form.slot_id : true) && (
                  <p className="event-registration__qty-hint">
                    {maxPartySize === 1
                      ? '1 place disponible pour ce créneau.'
                      : `${maxPartySize} places disponibles pour ce créneau.`}
                  </p>
                )}
              </fieldset>

              <fieldset className="event-registration__block">
                <legend className="event-registration__legend">
                  {usesSlots ? '3. Vos coordonnées' : '2. Vos coordonnées'}
                </legend>
                <div className="event-registration__fields">
                  <div className="form-group">
                    <label htmlFor="reg-first_name">Prénom *</label>
                    <input
                      id="reg-first_name"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      required
                      autoComplete="given-name"
                      placeholder="Prénom"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-last_name">Nom *</label>
                    <input
                      id="reg-last_name"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      required
                      autoComplete="family-name"
                      placeholder="Nom"
                    />
                  </div>
                  <div className="form-group event-registration__field-full">
                    <label htmlFor="reg-email">Email *</label>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      placeholder="vous@exemple.fr"
                    />
                  </div>
                  <div className="form-group event-registration__field-full">
                    <label htmlFor="reg-phone">Téléphone (optionnel)</label>
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="event-registration__block event-registration__block--switches">
                <legend className="event-registration__legend">
                  {usesSlots ? '4. Consentements' : '3. Consentements'}
                </legend>
                <div className="form-switch-stack event-registration__switches">
                  <FormSwitch
                    id="reg-accept_privacy"
                    name="accept_privacy"
                    checked={form.accept_privacy}
                    onChange={handleSwitch}
                    label="J'accepte le traitement de mes données *"
                    description={
                      <>
                        {PRIVACY_POLICY_SUMMARY}{' '}
                        <Link to={PRIVACY_POLICY_PATH} className="event-registration__link">
                          Politique de confidentialité
                        </Link>
                        {' · '}
                        <Link to="/contact" className="event-registration__link">
                          Contact
                        </Link>
                      </>
                    }
                  />
                  <FormSwitch
                    id="reg-marketing_opt_in"
                    name="marketing_opt_in"
                    checked={form.marketing_opt_in}
                    onChange={handleSwitch}
                    label="Invitations aux prochains événements"
                    description="Email occasionnel — désinscription à tout moment."
                  />
                </div>
              </fieldset>

              {error && (
                <p className="event-registration__error" role="alert">
                  {error}
                </p>
              )}

              <div className="event-registration__actions">
                {onClose && (
                  <button
                    type="button"
                    className="brand-btn brand-btn--ghost-on-dark brand-btn--pill event-registration__cancel"
                    onClick={onClose}
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  className="brand-btn brand-btn--primary brand-btn--pill event-registration__submit"
                  disabled={submitting || (usesSlots && !form.slot_id)}
                >
                  {submitting ? 'Validation…' : 'Obtenir mon billet'}
                </button>
              </div>

              <p className="event-registration__footnote">
                Vous serez redirigé vers votre billet (QR code) — une copie est aussi envoyée par
                email{eventTitle ? ` pour « ${eventTitle} »` : ''}.
              </p>
            </form>
          )}
        </>
      )}
    </section>
  );
};

export default EventRegistrationForm;
