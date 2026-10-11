import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventsAPI } from '../utils/apiService';
import { PRIVACY_POLICY_PATH } from '../constants/privacy';
import './LeadCapturePage.css';

const LeadCapturePage = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('e') || searchParams.get('event') || '';

  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    accept_privacy: false,
    marketing_opt_in: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await eventsAPI.getLeadMeta(eventId || undefined);
        if (!cancelled) setMeta(data);
      } catch {
        if (!cancelled) {
          setMeta({
            title: 'Restons en contact',
            subtitle: 'Laissez vos coordonnées pour les prochains événements.',
            event: null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await eventsAPI.captureLead({
        ...form,
        event_id: eventId || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Envoi impossible. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="lead-capture">
        <p className="lead-capture__status">Chargement…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="lead-capture">
        <div className="lead-capture__card lead-capture__card--success">
          <p className="lead-capture__kicker">Merci</p>
          <h1>C’est enregistré</h1>
          <p>
            {form.marketing_opt_in
              ? 'Vous serez contacté pour les prochains événements.'
              : 'Vos coordonnées ont bien été prises en compte.'}
          </p>
          <Link to="/" className="lead-capture__home">
            Retour au site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-capture">
      <form className="lead-capture__card" onSubmit={onSubmit}>
        <p className="lead-capture__kicker">Contact</p>
        <h1>{meta?.title || 'Restons en contact'}</h1>
        <p className="lead-capture__lead">
          {meta?.subtitle ||
            'Quelques informations suffisent — on vous prévient pour les prochaines dates.'}
        </p>
        {meta?.event?.lieu && (
          <p className="lead-capture__place">{meta.event.lieu}</p>
        )}

        <div className="lead-capture__row">
          <label>
            Prénom *
            <input
              name="first_name"
              autoComplete="given-name"
              value={form.first_name}
              onChange={onChange}
              required
              enterKeyHint="next"
            />
          </label>
          <label>
            Nom *
            <input
              name="last_name"
              autoComplete="family-name"
              value={form.last_name}
              onChange={onChange}
              required
              enterKeyHint="next"
            />
          </label>
        </div>

        <label>
          Email *
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={onChange}
            required
            enterKeyHint="next"
          />
        </label>

        <label>
          Téléphone
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={onChange}
            placeholder="Optionnel"
            enterKeyHint="done"
          />
        </label>

        <label className="lead-capture__check">
          <input
            type="checkbox"
            name="marketing_opt_in"
            checked={form.marketing_opt_in}
            onChange={onChange}
          />
          <span>Je souhaite être informé des prochains événements</span>
        </label>

        <label className="lead-capture__check">
          <input
            type="checkbox"
            name="accept_privacy"
            checked={form.accept_privacy}
            onChange={onChange}
            required
          />
          <span>
            J’accepte la{' '}
            <Link to={PRIVACY_POLICY_PATH} target="_blank" rel="noreferrer">
              politique de confidentialité
            </Link>{' '}
            *
          </span>
        </label>

        {error && (
          <p className="lead-capture__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="lead-capture__submit" disabled={submitting}>
          {submitting ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
};

export default LeadCapturePage;
