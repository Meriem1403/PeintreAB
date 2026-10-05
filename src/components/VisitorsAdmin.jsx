import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiExternalLink,
  FiMail,
  FiMapPin,
  FiMaximize2,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiUserCheck,
  FiUsers,
  FiTrendingUp,
  FiEdit3,
} from 'react-icons/fi';
import { eventsAPI } from '../utils/apiService';
import { useWorks } from '../contexts/WorksContext';
import { formatDurationLabel, isEventPast } from '../utils/eventDates';
import { adminTabPath } from '../constants/adminRoutes';
import '../styles/adminEventShell.css';
import AdminPagination from './AdminPagination';
import { ADMIN_PAGE_SIZES, paginate } from '../utils/adminPagination';
import './VisitorsAdmin.css';

const TABS = [
  { id: 'contacts', label: 'Base visiteurs' },
  { id: 'overview', label: 'Aperçu expo' },
  { id: 'guests', label: 'Inscrits' },
  { id: 'marketing', label: 'Email' },
];

const ticketsForRegistration = (r) => {
  const list = Array.isArray(r.tickets) ? r.tickets.filter((t) => t?.ticket_code) : [];
  if (list.length > 0) return list;
  if (r.ticket_code) return [{ ticket_code: r.ticket_code, ticket_index: 1 }];
  return [];
};

const registrationScanState = (r) => {
  const links = ticketsForRegistration(r);
  const total = Number(r.tickets_total) || Number(r.party_size) || links.length || 1;
  let checked = Number(r.tickets_checked_in);
  if (Number.isNaN(checked)) {
    const fromTickets = links.filter((t) => t.checked_in_at).length;
    checked = fromTickets > 0 ? fromTickets : r.checked_in_at ? 1 : 0;
  }
  return { total, checked, complete: checked >= total && total > 0 };
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const slotDateParts = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace(/\.$/, '');
  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).replace(/\.$/, '');
  return {
    weekday,
    day: d.toLocaleDateString('fr-FR', { day: 'numeric' }),
    month,
    year: d.getFullYear(),
  };
};

const initials = (first, last) =>
  `${(first || '?').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();

const GUEST_TICKETS_INLINE_MAX = 4;

const GuestTickets = ({ ticketLinks }) => {
  if (!ticketLinks.length) return null;

  const renderPill = (t, multi) => (
    <Link
      key={t.ticket_code}
      className={`vdash-guest__ticket-pill ${t.checked_in_at ? 'is-scanned' : ''}`}
      to={`/billet/${t.ticket_code}`}
      target="_blank"
      rel="noopener noreferrer"
      title={
        t.checked_in_at
          ? `Billet ${t.ticket_index || ''} — déjà scanné`
          : `Ouvrir le billet ${t.ticket_index || ''} (QR)`
      }
    >
      {multi ? `#${t.ticket_index || '?'}` : 'QR'}
      <FiExternalLink aria-hidden />
    </Link>
  );

  if (ticketLinks.length === 1) {
    const t = ticketLinks[0];
    return (
      <div className="vdash-guest__tickets">
        <Link
          className="vdash-guest__ticket vdash-guest__ticket--primary"
          to={`/billet/${t.ticket_code}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Billet QR
          <FiExternalLink aria-hidden />
        </Link>
      </div>
    );
  }

  const scanned = ticketLinks.filter((t) => t.checked_in_at).length;

  if (ticketLinks.length <= GUEST_TICKETS_INLINE_MAX) {
    return (
      <div className="vdash-guest__tickets">
        <p className="vdash-guest__tickets-meta">
          <span>{ticketLinks.length} billets</span>
          {scanned > 0 && (
            <span>
              {scanned}/{ticketLinks.length} scanné{ticketLinks.length > 1 ? 's' : ''}
            </span>
          )}
        </p>
        <div className="vdash-guest__tickets-grid">{ticketLinks.map((t) => renderPill(t, true))}</div>
      </div>
    );
  }

  return (
    <div className="vdash-guest__tickets">
      <div className="vdash-guest__tickets-bar">
        <div className="vdash-guest__tickets-meta">
          <span className="vdash-guest__tickets-count">{ticketLinks.length} billets</span>
          {scanned > 0 && (
            <span className="vdash-guest__tickets-scan">
              {scanned}/{ticketLinks.length} scannés
            </span>
          )}
        </div>
        <Link
          className="vdash-guest__ticket vdash-guest__ticket--primary vdash-guest__ticket--sm"
          to={`/billet/${ticketLinks[0].ticket_code}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Billet 1
          <FiExternalLink aria-hidden />
        </Link>
      </div>
      <details className="vdash-guest__tickets-details">
        <summary>Voir les {ticketLinks.length} billets</summary>
        <div className="vdash-guest__tickets-grid vdash-guest__tickets-grid--dense">
          {ticketLinks.map((t) => renderPill(t, true))}
        </div>
      </details>
    </div>
  );
};

const AttendanceRing = ({ checked, total }) => {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="vdash-ring" aria-label={`${pct} % des inscrits sont entrés`}>
      <svg viewBox="0 0 120 120" className="vdash-ring__svg">
        <circle className="vdash-ring__track" cx="60" cy="60" r={r} />
        <circle
          className="vdash-ring__fill"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="vdash-ring__center">
        <span className="vdash-ring__pct">{pct}%</span>
        <span className="vdash-ring__caption">présents</span>
      </div>
    </div>
  );
};

const VisitorsAdmin = () => {
  const { works } = useWorks();
  const events = works.evenements || [];
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteStatus, setInviteStatus] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [slotFilter, setSlotFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('contacts');
  const [guestSearch, setGuestSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [guestsPage, setGuestsPage] = useState(1);
  const [contactsPage, setContactsPage] = useState(1);

  const selectedEvent = useMemo(
    () => events.find((ev) => String(ev.id) === String(selectedEventId)),
    [events, selectedEventId]
  );

  const eventDuration = useMemo(() => {
    if (!selectedEvent?.date_debut) return null;
    return formatDurationLabel(selectedEvent.date_debut, selectedEvent.date_fin);
  }, [selectedEvent]);

  const marketingStats = useMemo(() => {
    const optIn = visitors.filter((v) => v.marketing_opt_in).length;
    return { contacts: visitors.length, optIn };
  }, [visitors]);

  const eventStats = useMemo(() => {
    const total = registrations.length;
    const checkedIn = registrations.reduce((sum, r) => {
      const { checked } = registrationScanState(r);
      return sum + checked;
    }, 0);
    const ticketsTotal = registrations.reduce((sum, r) => {
      const { total: t } = registrationScanState(r);
      return sum + t;
    }, 0);
    const optInHere = registrations.filter((r) => r.marketing_opt_in).length;
    const unassignedSlot = registrations.filter((r) => !r.slot_id).length;
    let capacityTotal = null;
    let remaining = null;
    let registeredOnSlots = total;
    if (ticketInfo?.uses_slots && ticketInfo.slots?.length) {
      const limited = ticketInfo.slots.filter((s) => !s.unlimited && s.capacity != null);
      if (limited.length > 0) {
        capacityTotal = limited.reduce((sum, s) => sum + Number(s.capacity), 0);
        registeredOnSlots = limited.reduce(
          (sum, s) => sum + Number(s.registrations_count || 0),
          0
        );
        remaining = Math.max(0, capacityTotal - registeredOnSlots);
      }
    } else if (ticketInfo && !ticketInfo.unlimited && ticketInfo.capacity != null) {
      capacityTotal = Number(ticketInfo.capacity);
      remaining =
        ticketInfo.remaining != null ? ticketInfo.remaining : capacityTotal - total;
      registeredOnSlots = total;
    }
    const presencePct =
      ticketsTotal > 0 ? Math.round((checkedIn / ticketsTotal) * 100) : total > 0 ? 0 : 0;
    const fillPct =
      capacityTotal != null && capacityTotal > 0
        ? Math.min(100, Math.round((registeredOnSlots / capacityTotal) * 100))
        : null;
    const fullSlots =
      ticketInfo?.slots?.filter((s) => !s.unlimited && !s.registration_open).length ?? 0;
    return {
      total,
      ticketsTotal,
      checkedIn,
      notScanned: Math.max(0, ticketsTotal - checkedIn),
      optInHere,
      unassignedSlot,
      capacityTotal,
      remaining,
      registeredOnSlots,
      presencePct,
      fillPct,
      fullSlots,
      slotCount: ticketInfo?.slots?.length ?? 0,
    };
  }, [registrations, ticketInfo]);

  const slotBreakdown = useMemo(() => {
    if (!ticketInfo?.uses_slots || !ticketInfo.slots?.length) return [];
    return ticketInfo.slots.map((slot) => {
      const slotRegs = registrations.filter((r) => String(r.slot_id) === String(slot.id));
      const checkedIn = slotRegs.reduce((sum, r) => sum + registrationScanState(r).checked, 0);
      const count = Number(slot.registrations_count ?? slotRegs.length);
      const capacity = slot.unlimited ? null : Number(slot.capacity);
      const fill =
        capacity != null && capacity > 0 ? Math.min(100, Math.round((count / capacity) * 100)) : null;
      const remaining =
        capacity != null ? Math.max(0, capacity - count) : null;
      return {
        ...slot,
        count,
        checkedIn,
        waiting: count - checkedIn,
        remaining,
        fill,
      };
    });
  }, [ticketInfo, registrations]);

  const slotsTotals = useMemo(() => {
    if (!slotBreakdown.length) return null;
    return slotBreakdown.reduce(
      (acc, slot) => {
        acc.registered += slot.count;
        acc.checkedIn += slot.checkedIn;
        if (!slot.unlimited && slot.capacity != null) {
          acc.capacity += Number(slot.capacity);
          acc.remaining += slot.remaining ?? 0;
        }
        return acc;
      },
      { registered: 0, checkedIn: 0, capacity: 0, remaining: 0 }
    );
  }, [slotBreakdown]);

  const openGuestsForSlot = (slotId) => {
    setSlotFilter(slotId === 'all' ? 'all' : String(slotId));
    setActiveTab('guests');
  };

  const loadVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventsAPI.listVisitors();
      setVisitors(data);
    } catch (err) {
      console.error(err);
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisitors();
  }, [loadVisitors]);

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(String(events[0].id));
    }
  }, [events, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) {
      setRegistrations([]);
      setTicketInfo(null);
      return;
    }
    setSlotFilter('all');
    setGuestSearch('');
    setGuestsPage(1);
    (async () => {
      setRegsLoading(true);
      try {
        const [data, info] = await Promise.all([
          eventsAPI.listRegistrations(selectedEventId),
          eventsAPI.getTicketInfo(selectedEventId),
        ]);
        setRegistrations(data);
        setTicketInfo(info);
      } catch (err) {
        console.error(err);
        setRegistrations([]);
        setTicketInfo(null);
      } finally {
        setRegsLoading(false);
      }
    })();
  }, [selectedEventId]);

  const filteredRegistrations = useMemo(() => {
    let list = registrations;
    if (slotFilter !== 'all') {
      list = list.filter((r) => String(r.slot_id) === String(slotFilter));
    }
    const q = guestSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.slot_label || '').toLowerCase().includes(q)
    );
  }, [registrations, slotFilter, guestSearch]);

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter(
      (v) =>
        `${v.first_name} ${v.last_name}`.toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q)
    );
  }, [visitors, contactSearch]);

  useEffect(() => {
    setGuestsPage(1);
  }, [slotFilter, guestSearch]);

  useEffect(() => {
    setContactsPage(1);
  }, [contactSearch]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredRegistrations.length / ADMIN_PAGE_SIZES.guests)
    );
    if (guestsPage > totalPages) setGuestsPage(totalPages);
  }, [filteredRegistrations.length, guestsPage]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredContacts.length / ADMIN_PAGE_SIZES.contacts)
    );
    if (contactsPage > totalPages) setContactsPage(totalPages);
  }, [filteredContacts.length, contactsPage]);

  const guestsPagination = useMemo(
    () => paginate(filteredRegistrations, guestsPage, ADMIN_PAGE_SIZES.guests),
    [filteredRegistrations, guestsPage]
  );

  const contactsPagination = useMemo(
    () => paginate(filteredContacts, contactsPage, ADMIN_PAGE_SIZES.contacts),
    [filteredContacts, contactsPage]
  );

  const handleInvite = async () => {
    if (!selectedEventId) return;
    setInviteStatus(null);
    setInviting(true);
    try {
      const res = await eventsAPI.inviteOptedIn(selectedEventId, {
        message: inviteMsg || undefined,
      });
      setInviteStatus(res.message);
    } catch (err) {
      setInviteStatus(err.message || 'Échec envoi');
    } finally {
      setInviting(false);
    }
  };

  const registrationStatusLabel = ticketInfo?.event_ended
    ? 'Terminé'
    : ticketInfo?.registration_open
      ? 'Inscriptions ouvertes'
      : 'Inscriptions fermées';

  const statusClass = ticketInfo?.event_ended
    ? 'is-muted'
    : ticketInfo?.registration_open
      ? 'is-open'
      : 'is-closed';

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
        <p>Chargement du tableau de bord…</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="vdash vdash--empty">
        <div className="vdash-empty">
          <FiCalendar size={48} strokeWidth={1.1} />
          <h2>Aucun événement</h2>
          <p>Créez une exposition pour suivre billets et entrées.</p>
          <Link to={adminTabPath('evenements')} className="adb-btn adb-btn--primary">
            Créer un événement
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vdash adb-shell">
      <header
        className="adb-cover"
        style={
          selectedEvent?.image
            ? { '--adb-cover-url': `url("${selectedEvent.image}")` }
            : undefined
        }
      >
        <div className="adb-cover__inner">
          <div className="adb-cover__row">
            <div>
              <label htmlFor="vdash-event-select" className="adb-sr-only">
                Événement
              </label>
              <select
                id="vdash-event-select"
                className="adb-event-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titre}
                    {isEventPast(ev.date_fin) ? ' (terminé)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <nav className="vdash-tabs" aria-label="Sections du tableau de bord">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`vdash-tabs__btn ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.id === 'guests' && eventStats.total > 0 && (
                    <span className="vdash-tabs__badge">{eventStats.total}</span>
                  )}
                  {tab.id === 'contacts' && marketingStats.contacts > 0 && (
                    <span className="vdash-tabs__badge">{marketingStats.contacts}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {selectedEvent && (
            <div className="adb-cover__main">
              <div>
                <span className={`adb-badge adb-badge--${statusClass}`}>
                  {registrationStatusLabel}
                </span>
                <h2 className="adb-cover__title">{selectedEvent.titre}</h2>
                {eventDuration && (
                  <p className="adb-cover__meta">
                    <FiCalendar aria-hidden />
                    {eventDuration.range}
                    <span className="adb-dot">·</span>
                    {eventDuration.dayWord}
                  </p>
                )}
                {selectedEvent.lieu && (
                  <p className="adb-cover__meta">
                    <FiMapPin aria-hidden />
                    {selectedEvent.lieu}
                  </p>
                )}
              </div>
              <div className="adb-cover__actions">
                <Link
                  to={`/galerie/evenements/${selectedEvent.id}`}
                  className="adb-btn adb-btn--ghost"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Site public
                  <FiExternalLink aria-hidden />
                </Link>
                <Link
                  to={`${adminTabPath('scan')}?event=${selectedEvent.id}`}
                  className="adb-btn adb-btn--ghost"
                >
                  <FiMaximize2 aria-hidden />
                  Scanner
                </Link>
                <Link to={adminTabPath('evenements')} className="adb-btn adb-btn--ghost">
                  Quotas
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="vdash-body">
        {activeTab === 'overview' && (
          <div className="vdash-overview">
            <div className="vdash-metric-row" aria-label="Indicateurs clés">
              <article className="vdash-metric">
                <span className="vdash-metric__icon" aria-hidden>
                  <FiUsers />
                </span>
                <div>
                  <span className="vdash-metric__value">{eventStats.total}</span>
                  <span className="vdash-metric__label">Inscriptions confirmées</span>
                </div>
              </article>
              <article className="vdash-metric vdash-metric--ok">
                <span className="vdash-metric__icon" aria-hidden>
                  <FiUserCheck />
                </span>
                <div>
                  <span className="vdash-metric__value">
                    {eventStats.checkedIn}
                    <small>{eventStats.total > 0 ? `${eventStats.presencePct} %` : ''}</small>
                  </span>
                  <span className="vdash-metric__label">Entrées scannées</span>
                </div>
              </article>
              <article className="vdash-metric vdash-metric--wait">
                <span className="vdash-metric__icon" aria-hidden>
                  <FiTrendingUp />
                </span>
                <div>
                  <span className="vdash-metric__value">
                    {eventStats.capacityTotal != null ? (
                      <>
                        {eventStats.registeredOnSlots}
                        <small> / {eventStats.capacityTotal}</small>
                      </>
                    ) : (
                      'Illimité'
                    )}
                  </span>
                  <span className="vdash-metric__label">
                    {eventStats.fillPct != null
                      ? `Places réservées (${eventStats.fillPct} % du quota)`
                      : 'Capacité'}
                  </span>
                </div>
              </article>
              <article className="vdash-metric">
                <span className="vdash-metric__icon" aria-hidden>
                  <FiCalendar />
                </span>
                <div>
                  <span className="vdash-metric__value">{eventStats.slotCount || '—'}</span>
                  <span className="vdash-metric__label">
                    {eventStats.fullSlots > 0
                      ? `Créneaux · ${eventStats.fullSlots} complet(s)`
                      : 'Créneaux ouverts'}
                  </span>
                </div>
              </article>
            </div>

            <div className="vdash-overview__split">
              <div className="vdash-overview__col">
              <section className="vdash-surface vdash-surface--presence">
                <header className="vdash-surface__head">
                  <div>
                    <h3>Entrée & présence</h3>
                    <p>
                      {eventStats.notScanned} billet{eventStats.notScanned !== 1 ? 's' : ''} à
                      scanner · {eventStats.remaining != null ? `${eventStats.remaining} place${eventStats.remaining !== 1 ? 's' : ''} encore disponibles au total` : 'quota illimité'}
                    </p>
                  </div>
                  <Link
                    to={`${adminTabPath('scan')}?event=${selectedEventId}`}
                    className="vdash-surface__action"
                  >
                    Ouvrir le scan
                  </Link>
                </header>

                <div className="vdash-presence-body">
                  <AttendanceRing checked={eventStats.checkedIn} total={eventStats.total} />
                  <div className="vdash-presence-stats">
                    <div className="vdash-presence-stat">
                      <span className="vdash-presence-stat__n">{eventStats.checkedIn}</span>
                      <span className="vdash-presence-stat__l">Présents</span>
                    </div>
                    <div className="vdash-presence-stat vdash-presence-stat--muted">
                      <span className="vdash-presence-stat__n">{eventStats.notScanned}</span>
                      <span className="vdash-presence-stat__l">Non scannés</span>
                    </div>
                    <div className="vdash-presence-stat">
                      <span className="vdash-presence-stat__n">{eventStats.optInHere}</span>
                      <span className="vdash-presence-stat__l">Opt-in (cet expo)</span>
                    </div>
                  </div>
                </div>

                {eventStats.fillPct != null && (
                  <div className="vdash-capacity-block">
                    <div className="vdash-capacity-block__labels">
                      <span>Remplissage global</span>
                      <span>
                        {eventStats.registeredOnSlots} / {eventStats.capacityTotal} places
                      </span>
                    </div>
                    <div className="vdash-capacity-block__bar">
                      <span style={{ width: `${eventStats.fillPct}%` }} />
                    </div>
                  </div>
                )}

                {eventStats.unassignedSlot > 0 && (
                  <p className="vdash-overview-note">
                    {eventStats.unassignedSlot} inscription
                    {eventStats.unassignedSlot !== 1 ? 's' : ''} sans créneau assigné (legacy ou
                    import).
                  </p>
                )}

                <footer className="vdash-surface__foot">
                  <button type="button" className="vdash-link-btn" onClick={() => openGuestsForSlot('all')}>
                    Voir tous les inscrits
                  </button>
                </footer>
              </section>

              <section className="vdash-surface vdash-surface--marketing vdash-surface--marketing-stack">
                <div className="vdash-marketing-grid">
                  <div className="vdash-marketing-block">
                    <h3>Consentement marketing</h3>
                    <p className="vdash-marketing-lead">
                      <strong>{eventStats.optInHere}</strong> sur {eventStats.total} inscrit
                      {eventStats.total !== 1 ? 's' : ''} à cette expo
                      {eventStats.total > 0
                        ? ` (${Math.round((eventStats.optInHere / eventStats.total) * 100)} %)`
                        : ''}
                    </p>
                    {eventStats.total > 0 && (
                      <div className="vdash-capacity-block__bar vdash-capacity-block__bar--thin">
                        <span
                          style={{
                            width: `${Math.round((eventStats.optInHere / eventStats.total) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="vdash-marketing-block">
                    <h3>Base contacts</h3>
                    <p className="vdash-marketing-lead">
                      <strong>{marketingStats.optIn}</strong> invitables · {marketingStats.contacts}{' '}
                      contacts
                    </p>
                    <button
                      type="button"
                      className="vdash-btn vdash-btn--soft"
                      onClick={() => setActiveTab('contacts')}
                    >
                      Voir les contacts
                    </button>
                  </div>
                  <div className="vdash-marketing-block vdash-marketing-block--cta">
                    <h3>Invitation email</h3>
                    <p>Message aux opt-in pour « {selectedEvent?.titre} ».</p>
                    <button
                      type="button"
                      className="vdash-btn vdash-btn--soft"
                      onClick={() => setActiveTab('marketing')}
                    >
                      <FiMail aria-hidden />
                      Rédiger l&apos;email
                    </button>
                  </div>
                </div>
              </section>
              </div>

              <section className="vdash-surface vdash-surface--slots">
                <header className="vdash-surface__head">
                  <div>
                    <h3>Planning & quotas</h3>
                    <p>
                      {slotBreakdown.length > 0
                        ? 'Cliquez sur un jour pour filtrer la liste des inscrits.'
                        : 'Répartition par jour de l’exposition.'}
                    </p>
                  </div>
                  <Link
                    to={adminTabPath('evenements')}
                    className="vdash-btn vdash-btn--soft vdash-schedule__edit"
                  >
                    <FiEdit3 aria-hidden />
                    Créneaux
                  </Link>
                </header>

                {regsLoading ? (
                  <p className="vdash-muted">Chargement…</p>
                ) : slotBreakdown.length === 0 ? (
                  <p className="vdash-muted">
                    Billetterie sans créneaux par jour — quota unique sur l&apos;événement.
                  </p>
                ) : (
                  <div className="vdash-schedule">
                    {slotsTotals && slotsTotals.capacity > 0 && (
                      <div className="vdash-schedule__summary">
                        <span>
                          <strong>{slotsTotals.registered}</strong> inscrits au total
                        </span>
                        <span>
                          <strong>{slotsTotals.checkedIn}</strong> entrés
                        </span>
                        <span>
                          <strong>{slotsTotals.remaining}</strong> places libres
                        </span>
                        <span className="vdash-schedule__summary-muted">
                          {slotsTotals.registered} / {slotsTotals.capacity} places
                        </span>
                      </div>
                    )}

                    <div className="vdash-schedule__table" role="table" aria-label="Planning par jour">
                      <div className="vdash-schedule__row vdash-schedule__row--head" role="row">
                        <span role="columnheader">Jour</span>
                        <span role="columnheader">Statut</span>
                        <span role="columnheader" className="vdash-schedule__num">
                          Inscrits
                        </span>
                        <span role="columnheader" className="vdash-schedule__num">
                          Entrés
                        </span>
                        <span role="columnheader" className="vdash-schedule__num">
                          Libres
                        </span>
                        <span role="columnheader">Remplissage</span>
                      </div>

                      <ul className="vdash-schedule__body">
                        {slotBreakdown.map((slot) => {
                          const parts = slotDateParts(slot.slot_date);
                          const isFull = !slot.unlimited && !slot.registration_open;
                          const free = slot.unlimited
                            ? null
                            : slot.remaining ?? Math.max(0, Number(slot.capacity) - slot.count);
                          return (
                            <li key={slot.id} role="none">
                              <button
                                type="button"
                                role="row"
                                className={`vdash-schedule__row vdash-schedule__row--data ${
                                  isFull ? 'is-full' : ''
                                }`}
                                onClick={() => openGuestsForSlot(slot.id)}
                                title={`Voir les inscrits — ${slot.label}`}
                              >
                                <span className="vdash-schedule__day" role="cell">
                                  {parts ? (
                                    <>
                                      <time
                                        dateTime={slot.slot_date}
                                        className="vdash-schedule__date"
                                      >
                                        <span className="vdash-schedule__date-wd">{parts.weekday}</span>
                                        <span className="vdash-schedule__date-d">{parts.day}</span>
                                        <span className="vdash-schedule__date-my">
                                          <span className="vdash-schedule__date-m">{parts.month}</span>
                                          <span className="vdash-schedule__date-y">{parts.year}</span>
                                        </span>
                                      </time>
                                      <span className="vdash-schedule__label-wrap">
                                        <span className="vdash-schedule__label">{slot.label}</span>
                                      </span>
                                    </>
                                  ) : (
                                    <span className="vdash-schedule__label-wrap">
                                      <span className="vdash-schedule__label">{slot.label}</span>
                                    </span>
                                  )}
                                </span>

                                <span className="vdash-schedule__status-wrap" role="cell">
                                  <span
                                    className={`vdash-schedule__status ${
                                      isFull ? 'is-full' : 'is-open'
                                    }`}
                                  >
                                    {isFull ? 'Complet' : 'Ouvert'}
                                  </span>
                                </span>

                                <span className="vdash-schedule__num" role="cell">
                                  {slot.count}
                                </span>
                                <span className="vdash-schedule__num" role="cell">
                                  {slot.checkedIn}
                                </span>
                                <span className="vdash-schedule__num" role="cell">
                                  {slot.unlimited ? '∞' : free}
                                </span>

                                <div className="vdash-schedule__metrics-mobile" aria-hidden>
                                  <span>
                                    <strong>{slot.count}</strong> inscrit{slot.count !== 1 ? 's' : ''}
                                  </span>
                                  <span>
                                    <strong>{slot.checkedIn}</strong> entré{slot.checkedIn !== 1 ? 's' : ''}
                                  </span>
                                  <span>
                                    {slot.unlimited ? (
                                      <>Quota illimité</>
                                    ) : (
                                      <>
                                        <strong>{free}</strong> libre{free !== 1 ? 's' : ''}
                                      </>
                                    )}
                                  </span>
                                </div>

                                <span className="vdash-schedule__fill" role="cell">
                                  {slot.unlimited ? (
                                    <span className="vdash-schedule__fill-label">Sans quota</span>
                                  ) : (
                                    <>
                                      <div className="vdash-schedule__bar">
                                        <span style={{ width: `${slot.fill ?? 0}%` }} />
                                      </div>
                                      <span className="vdash-schedule__fill-label">
                                        {slot.count} / {slot.capacity}
                                      </span>
                                    </>
                                  )}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === 'guests' && (
          <section className="vdash-panel">
            <div className="vdash-toolbar">
              <div className="vdash-search">
                <FiSearch aria-hidden />
                <input
                  type="search"
                  placeholder="Nom, email ou créneau…"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  aria-label="Rechercher un inscrit"
                />
              </div>
              {ticketInfo?.uses_slots && ticketInfo.slots?.length > 0 && (
                <div className="vdash-chips vdash-chips--scroll" role="group" aria-label="Filtrer par créneau">
                  <button
                    type="button"
                    className={`vdash-chip ${slotFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setSlotFilter('all')}
                  >
                    Tous
                  </button>
                  {ticketInfo.slots.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`vdash-chip ${String(slotFilter) === String(s.id) ? 'is-active' : ''}`}
                      onClick={() => setSlotFilter(String(s.id))}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {regsLoading ? (
              <p className="vdash-muted vdash-panel__center">Chargement des inscrits…</p>
            ) : filteredRegistrations.length === 0 ? (
              <div className="vdash-empty vdash-empty--sm">
                <FiUsers size={40} strokeWidth={1.2} />
                <p>Aucun inscrit{guestSearch || slotFilter !== 'all' ? ' pour ce filtre' : ''}.</p>
              </div>
            ) : (
              <>
              <ul className="vdash-guest-grid">
                {guestsPagination.pageItems.map((r) => {
                  const scan = registrationScanState(r);
                  const ticketLinks = ticketsForRegistration(r);
                  return (
                  <li key={r.id} className="vdash-guest">
                    <div className="vdash-guest__top">
                      <div className="vdash-guest__avatar" aria-hidden>
                        {initials(r.first_name, r.last_name)}
                      </div>
                      <div className="vdash-guest__body">
                        <div className="vdash-guest__row">
                          <span className="vdash-guest__name">
                            {r.first_name} {r.last_name}
                          </span>
                          {scan.complete ? (
                            <span className="vdash-tag vdash-tag--ok">Entré</span>
                          ) : scan.checked > 0 ? (
                            <span className="vdash-tag vdash-tag--ok">
                              {scan.checked}/{scan.total} scanné{scan.total > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="vdash-tag vdash-tag--wait">Non scanné</span>
                          )}
                        </div>
                        <a className="vdash-guest__email" href={`mailto:${r.email}`}>
                          {r.email}
                        </a>
                        <div className="vdash-guest__meta">
                          {ticketInfo?.uses_slots && r.slot_label && (
                            <span className="vdash-guest__slot">{r.slot_label}</span>
                          )}
                          <span>Inscrit le {formatDateTime(r.created_at)}</span>
                          {r.marketing_opt_in && (
                            <span className="vdash-tag vdash-tag--opt">Opt-in</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <GuestTickets ticketLinks={ticketLinks} />
                  </li>
                );
                })}
              </ul>
              <AdminPagination
                page={guestsPagination.safePage}
                totalPages={guestsPagination.totalPages}
                total={guestsPagination.total}
                from={guestsPagination.from}
                to={guestsPagination.to}
                onPageChange={setGuestsPage}
                itemLabel="inscrits"
                ariaLabel="Pagination des inscrits"
              />
              </>
            )}
          </section>
        )}

        {activeTab === 'contacts' && (
          <section className="vdash-panel">
            <div className="vdash-toolbar vdash-toolbar--spread">
              <div className="vdash-search">
                <FiSearch aria-hidden />
                <input
                  type="search"
                  placeholder="Rechercher un contact…"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  aria-label="Rechercher un contact"
                />
              </div>
              <button type="button" className="vdash-btn vdash-btn--soft" onClick={loadVisitors}>
                <FiRefreshCw aria-hidden />
                Actualiser
              </button>
            </div>
            <p className="vdash-panel__intro">
              Tous les contacts enregistrés via la billetterie, <strong>tous événements confondus</strong>.
              Le consentement marketing est enregistré séparément.
            </p>

            {filteredContacts.length === 0 ? (
              <div className="vdash-empty vdash-empty--sm">
                <FiUsers size={40} strokeWidth={1.2} />
                <p>Aucun contact.</p>
              </div>
            ) : (
              <>
              <ul className="vdash-guest-grid vdash-guest-grid--contacts">
                {contactsPagination.pageItems.map((v) => (
                  <li key={v.id} className="vdash-guest vdash-guest--contact">
                    <div className="vdash-guest__avatar" aria-hidden>
                      {initials(v.first_name, v.last_name)}
                    </div>
                    <div className="vdash-guest__body">
                      <span className="vdash-guest__name">
                        {v.first_name} {v.last_name}
                      </span>
                      <a className="vdash-guest__email" href={`mailto:${v.email}`}>
                        {v.email}
                      </a>
                      <div className="vdash-guest__meta">
                        <span>
                          {v.registrations_count} inscription
                          {v.registrations_count !== 1 ? 's' : ''}
                        </span>
                        <span>Màj {formatDate(v.updated_at)}</span>
                        {v.marketing_opt_in ? (
                          <span className="vdash-tag vdash-tag--opt">Opt-in</span>
                        ) : (
                          <span className="vdash-tag vdash-tag--muted">Sans opt-in</span>
                        )}
                      </div>
                      {Array.isArray(v.events) && v.events.length > 0 && (
                        <ul className="vdash-guest__events">
                          {v.events.map((ev) => (
                            <li key={ev.work_id}>
                              <span>{ev.titre}</span>
                              {ev.date_fin && (
                                <span className="vdash-guest__events-date">
                                  {formatDate(ev.date_fin)}
                                  {isEventPast(ev.date_fin) ? ' · terminé' : ''}
                                </span>
                              )}
                              <span className="vdash-guest__events-count">
                                {ev.registrations_count} billet
                                {ev.registrations_count !== 1 ? 's' : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <AdminPagination
                page={contactsPagination.safePage}
                totalPages={contactsPagination.totalPages}
                total={contactsPagination.total}
                from={contactsPagination.from}
                to={contactsPagination.to}
                onPageChange={setContactsPage}
                itemLabel="contacts"
                ariaLabel="Pagination des contacts"
              />
              </>
            )}
          </section>
        )}

        {activeTab === 'marketing' && (
          <section className="vdash-email" aria-labelledby="vdash-email-title">
            <header className="vdash-email__head">
              <div className="vdash-email__title-row">
                <span className="vdash-email__icon" aria-hidden>
                  <FiMail />
                </span>
                <div>
                  <h3 id="vdash-email-title" className="vdash-email__title">
                    Invitation par email
                  </h3>
                  <p className="vdash-email__subtitle">
                    Envoi aux contacts opt-in (toute la base). Le lien mène vers l&apos;exposition
                    sélectionnée ci-dessus
                    {selectedEvent?.titre ? (
                      <>
                        {' '}
                        — <strong className="vdash-email__event-inline">{selectedEvent.titre}</strong>
                      </>
                    ) : null}
                    .
                  </p>
                </div>
              </div>
              <div className="vdash-email__audience" aria-label="Nombre de destinataires">
                <span className="vdash-email__audience-value">{marketingStats.optIn}</span>
                <span className="vdash-email__audience-label">opt-in</span>
              </div>
            </header>

            <div className="vdash-email__composer app-form">
              <div className="form-group vdash-email__field">
                <label htmlFor="invite-msg">Message personnalisé (optionnel)</label>
                <textarea
                  id="invite-msg"
                  rows={6}
                  value={inviteMsg}
                  onChange={(e) => setInviteMsg(e.target.value)}
                  placeholder="Ex. : nous avons hâte de vous accueillir pour le vernissage…"
                  className="vdash-email__textarea"
                />
                <p className="vdash-email__field-hint">
                  Ce texte s&apos;ajoute au modèle d&apos;email ; laissez vide pour l&apos;invitation
                  standard.
                </p>
              </div>

              <div className="vdash-email__actions form-actions">
                <button
                  type="button"
                  className="btn-submit vdash-email__submit"
                  onClick={handleInvite}
                  disabled={!selectedEventId || inviting || marketingStats.optIn === 0}
                >
                  <FiSend aria-hidden />
                  <span>
                    {inviting
                      ? 'Envoi en cours…'
                      : `Envoyer à ${marketingStats.optIn} opt-in`}
                  </span>
                </button>
              </div>

              {inviteStatus && (
                <p
                  className={`vdash-status vdash-email__status ${
                    inviteStatus.toLowerCase().includes('échec') ? 'is-error' : ''
                  }`}
                  role="status"
                >
                  {inviteStatus}
                </p>
              )}
              {marketingStats.optIn === 0 && (
                <p className="vdash-email__empty vdash-muted">
                  Aucun contact opt-in pour le moment — activez le consentement marketing à
                  l&apos;inscription.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default VisitorsAdmin;
