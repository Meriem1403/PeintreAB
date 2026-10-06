import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { PRIVACY_POLICY_PATH } from '../constants/privacy';
import { contactsAPI } from '../utils/apiService';
import '../styles/forms.css';
import './EventRegistrationForm.css';
import './ContactWorkForm.css';
import ModalPortal from './ModalPortal';

const INTENTS = [
  {
    id: 'purchase',
    label: 'Acquisition',
    hint: 'Achat ou réservation',
    placeholder:
      'Indiquez vos disponibilités, questions sur le paiement ou la remise de l’œuvre…',
  },
  {
    id: 'info',
    label: 'Informations',
    hint: 'Technique, dimensions, provenance',
    placeholder:
      'Technique, format, cadre, histoire de l’œuvre — posez vos questions librement.',
  },
  {
    id: 'visit',
    label: 'Visite atelier',
    hint: 'Rencontre ou viewing',
    placeholder:
      'Quels créneaux vous conviennent ? Souhaitez-vous voir l’œuvre en personne ?',
  },
  {
    id: 'other',
    label: 'Autre',
    hint: 'Exposition, reproduction…',
    placeholder: 'Décrivez votre projet ou votre demande.',
  },
];

const intentLabel = (id) => INTENTS.find((i) => i.id === id)?.label || 'Demande';

const ContactWorkForm = ({
  work,
  categoryLabel: workCategoryLabel,
  referenceLabel,
  priceLabel,
  imageUrl,
  onClose,
  onSuccess,
}) => {
  const [intent, setIntent] = useState('info');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
    prefer_phone: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const selectedIntent = useMemo(
    () => INTENTS.find((i) => i.id === intent) || INTENTS[1],
    [intent]
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const buildMessageBody = () => {
    const lines = [`Type de demande : ${intentLabel(intent)}`];
    const phone = formData.phone.trim();
    if (phone) lines.push(`Téléphone : ${phone}`);
    if (formData.prefer_phone && phone) lines.push('Préfère être contacté par téléphone.');
    lines.push('', formData.message.trim());
    return lines.join('\n');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const name = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();
    if (!name) {
      setError('Indiquez votre nom.');
      setLoading(false);
      return;
    }

    try {
      await contactsAPI.create({
        name,
        email: formData.email.trim(),
        subject: `Intérêt pour: ${work.titre} — ${intentLabel(intent)}`,
        message: buildMessageBody(),
        work_id: work.id,
      });

      setSuccess(true);
      onSuccess?.();
      setTimeout(() => onClose(), 2800);
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setError(err.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
    <motion.div
      className="exhibition-registration-overlay contact-work-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-work-dialog-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="exhibition-registration-dialog contact-work-dialog"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="exhibition-registration-dialog__head">
          <div>
            <p className="exhibition-registration-dialog__eyebrow">Galerie</p>
            <h2 id="contact-work-dialog-title">Cette œuvre m&apos;intéresse</h2>
          </div>
          <button
            type="button"
            className="exhibition-registration-dialog__close"
            aria-label="Fermer"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </header>

        <div className="exhibition-registration-dialog__body">
          {work && (
            <div className="contact-work-preview">
              {imageUrl ? (
                <div className="contact-work-preview__thumb">
                  <img src={imageUrl} alt="" loading="lazy" decoding="async" />
                </div>
              ) : null}
              <div className="contact-work-preview__meta">
                {workCategoryLabel && (
                  <span className="contact-work-preview__type">{workCategoryLabel}</span>
                )}
                <p className="contact-work-preview__title">{work.titre}</p>
                <div className="contact-work-preview__facts">
                  {priceLabel && (
                    <span className="contact-work-preview__fact">{priceLabel}</span>
                  )}
                  {referenceLabel && (
                    <span className="contact-work-preview__fact contact-work-preview__fact--muted">
                      {referenceLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {success ? (
            <div className="contact-work-success" role="status">
              <FaCheckCircle aria-hidden />
              <p className="contact-work-success__title">Message envoyé</p>
              <p className="contact-work-success__lead">
                Merci pour votre intérêt. Alexandre Bindl vous répondra personnellement, en général
                sous 48 h ouvrées.
              </p>
            </div>
          ) : (
            <section
              className="event-registration exhibition-registration contact-work-form"
              aria-label="Formulaire de contact pour l'œuvre"
            >
              <form className="event-registration__form" onSubmit={handleSubmit} noValidate>
                <fieldset className="event-registration__block">
                  <legend className="event-registration__legend">1. Votre demande</legend>
                  <div className="contact-work-intents" role="radiogroup" aria-label="Motif">
                    {INTENTS.map((item) => {
                      const selected = intent === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`contact-work-intent ${selected ? 'is-selected' : ''}`}
                          onClick={() => setIntent(item.id)}
                          aria-pressed={selected}
                        >
                          <span className="contact-work-intent__label">{item.label}</span>
                          <span className="contact-work-intent__hint">{item.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="event-registration__block">
                  <legend className="event-registration__legend">2. Vos coordonnées</legend>
                  <div className="event-registration__fields">
                    <div className="form-group">
                      <label htmlFor="cw-first">Prénom *</label>
                      <input
                        id="cw-first"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        autoComplete="given-name"
                        placeholder="Marie"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cw-last">Nom *</label>
                      <input
                        id="cw-last"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        autoComplete="family-name"
                        placeholder="Dupont"
                      />
                    </div>
                    <div className="form-group event-registration__field-full">
                      <label htmlFor="cw-email">Email *</label>
                      <input
                        id="cw-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        placeholder="vous@exemple.fr"
                      />
                    </div>
                    <div className="form-group event-registration__field-full">
                      <label htmlFor="cw-phone">Téléphone (optionnel)</label>
                      <input
                        id="cw-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        autoComplete="tel"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  </div>
                  {formData.phone.trim() && (
                    <label className="contact-work-pref">
                      <input
                        type="checkbox"
                        name="prefer_phone"
                        checked={formData.prefer_phone}
                        onChange={handleChange}
                      />
                      <span>Je préfère être rappelé(e) par téléphone</span>
                    </label>
                  )}
                </fieldset>

                <fieldset className="event-registration__block">
                  <legend className="event-registration__legend">3. Votre message</legend>
                  <div className="form-group">
                    <label htmlFor="cw-message" className="contact-work-sr-only">
                      Message
                    </label>
                    <textarea
                      id="cw-message"
                      name="message"
                      className="contact-work-textarea"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      required
                      minLength={8}
                      placeholder={selectedIntent.placeholder}
                    />
                  </div>
                  <p className="contact-work-privacy">
                    Vos informations servent uniquement à répondre à cette demande.{' '}
                    <Link to={PRIVACY_POLICY_PATH} onClick={onClose}>
                      Politique de confidentialité
                    </Link>
                    {' · '}
                    <Link to="/contact" onClick={onClose}>
                      Contact
                    </Link>
                  </p>
                </fieldset>

                {error && <p className="event-registration__error">{error}</p>}

                <div className="event-registration__actions">
                  <button
                    type="button"
                    className="brand-btn brand-btn--ghost-on-dark event-registration__cancel"
                    onClick={onClose}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="brand-btn brand-btn--primary brand-btn--block"
                    disabled={loading}
                  >
                    {loading ? 'Envoi…' : 'Envoyer ma demande'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </motion.div>
    </motion.div>
    </ModalPortal>
  );
};

export default ContactWorkForm;
