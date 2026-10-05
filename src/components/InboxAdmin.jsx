import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiArchive,
  FiArrowLeft,
  FiBell,
  FiImage,
  FiInbox,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from 'react-icons/fi';
import { FaReply } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { contactsAPI } from '../utils/apiService';
import { normalizeImageUrl } from '../utils/imageUrl';
import ReplyModal from './ReplyModal';
import AdminPagination from './AdminPagination';
import { ADMIN_PAGE_SIZES, paginate } from '../utils/adminPagination';
import './InboxAdmin.css';

const FILTERS = [
  { id: 'all', label: 'Tous', shortLabel: 'Tous' },
  { id: 'unread', label: 'Non lus', shortLabel: 'Non lus' },
  { id: 'works', label: 'Œuvres', shortLabel: 'Œuvres' },
  { id: 'site', label: 'Page contact', shortLabel: 'Contact' },
];

const COMPACT_INBOX_MQ = '(max-width: 1024px)';

const isUnread = (c) => c.is_read === false || c.read === false || (!c.is_read && !c.read);

const formatWhen = (value) =>
  new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatListTime = (value) => {
  const d = new Date(value);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const contactInitials = (name) => {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || '?').toUpperCase();
};

const sourceKind = (c) => (c.work_id ? 'work' : 'site');

const parseIntent = (subject) => {
  if (!subject) return null;
  const m = subject.match(/—\s*(.+)$/);
  return m ? m[1].trim() : null;
};

const workTypeLabel = (type) => {
  if (type === 'peintures') return 'Peinture';
  if (type === 'croquis') return 'Croquis';
  if (type === 'evenements') return 'Événement';
  return null;
};

const InboxAdmin = ({ contacts, onUpdate, onEnableBrowserNotify }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [busyRead, setBusyRead] = useState(null);
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(COMPACT_INBOX_MQ).matches : false
  );
  const [mobilePane, setMobilePane] = useState('list');
  const [listPage, setListPage] = useState(1);

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_INBOX_MQ);
    const sync = () => setIsCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!isCompact) setMobilePane('list');
  }, [isCompact]);

  const stats = useMemo(() => {
    const unread = contacts.filter(isUnread).length;
    const works = contacts.filter((c) => c.work_id).length;
    return { total: contacts.length, unread, works };
  }, [contacts]);

  const filterCounts = useMemo(
    () => ({
      all: contacts.length,
      unread: contacts.filter(isUnread).length,
      works: contacts.filter((c) => c.work_id).length,
      site: contacts.filter((c) => !c.work_id).length,
    }),
    [contacts]
  );

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter === 'unread') list = list.filter(isUnread);
    else if (filter === 'works') list = list.filter((c) => c.work_id);
    else if (filter === 'site') list = list.filter((c) => !c.work_id);

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.subject || '').toLowerCase().includes(q) ||
        (c.message || '').toLowerCase().includes(q) ||
        (c.work_titre || '').toLowerCase().includes(q)
    );
  }, [contacts, filter, search]);

  useEffect(() => {
    setListPage(1);
  }, [filter, search]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZES.inbox));
    if (listPage > totalPages) setListPage(totalPages);
  }, [filtered.length, listPage]);

  const listPagination = useMemo(
    () => paginate(filtered, listPage, ADMIN_PAGE_SIZES.inbox),
    [filtered, listPage]
  );

  const selected = useMemo(
    () => contacts.find((c) => c.id === selectedId) || null,
    [contacts, selectedId]
  );

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (isCompact) return;
    if (!selectedId || !filtered.some((c) => c.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId, isCompact]);

  const markRead = useCallback(
    async (contactId) => {
      const c = contacts.find((x) => x.id === contactId);
      if (!c || !isUnread(c)) return;
      setBusyRead(contactId);
      try {
        await contactsAPI.markAsRead(contactId);
        onUpdate(true);
      } catch (err) {
        console.error(err);
      } finally {
        setBusyRead(null);
      }
    },
    [contacts, onUpdate]
  );

  const selectMessage = (contact) => {
    setSelectedId(contact.id);
    markRead(contact.id);
    if (isCompact) setMobilePane('detail');
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    setDeletingId(contactId);
    try {
      await contactsAPI.delete(contactId);
      if (selectedId === contactId) setSelectedId(null);
      onUpdate(true);
    } catch (err) {
      console.error(err);
      alert('Impossible de supprimer le message.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadList = contacts.filter(isUnread);
    if (unreadList.length === 0) return;
    try {
      await Promise.all(unreadList.map((c) => contactsAPI.markAsRead(c.id)));
      onUpdate(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="inbox-empty">
        <div className="inbox-empty__icon" aria-hidden>
          <FiInbox size={36} strokeWidth={1.15} />
        </div>
        <h2>Boîte vide</h2>
        <p>Les demandes depuis le site (page Contact ou « Cette œuvre m&apos;intéresse ») apparaîtront ici.</p>
        <Link to="/contact" className="inbox-empty__link" target="_blank" rel="noopener noreferrer">
          Voir la page Contact publique
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="inbox">
        <div className="inbox-metrics">
          <div className="inbox-metric">
            <span className="inbox-metric__icon" aria-hidden>
              <FiMail />
            </span>
            <div>
              <span className="inbox-metric__value">{stats.total}</span>
              <span className="inbox-metric__label">Messages reçus</span>
            </div>
          </div>
          <div className={`inbox-metric ${stats.unread > 0 ? 'inbox-metric--pulse' : ''}`}>
            <span className="inbox-metric__icon inbox-metric__icon--alert" aria-hidden>
              <FiBell />
            </span>
            <div>
              <span className="inbox-metric__value">{stats.unread}</span>
              <span className="inbox-metric__label">Non lus</span>
            </div>
          </div>
          <div className="inbox-metric">
            <span className="inbox-metric__icon inbox-metric__icon--work" aria-hidden>
              <FiImage />
            </span>
            <div>
              <span className="inbox-metric__value">{stats.works}</span>
              <span className="inbox-metric__label">Liés à une œuvre</span>
            </div>
          </div>
          <div className="inbox-metrics__actions">
            {onEnableBrowserNotify &&
              typeof Notification !== 'undefined' &&
              Notification.permission !== 'granted' && (
              <button type="button" className="inbox-tool-btn" onClick={onEnableBrowserNotify}>
                <FiBell aria-hidden />
                Alertes
              </button>
            )}
            {stats.unread > 0 && (
              <button type="button" className="inbox-tool-btn" onClick={handleMarkAllRead}>
                <FiArchive aria-hidden />
                Tout lu
              </button>
            )}
            <button type="button" className="inbox-tool-btn inbox-tool-btn--ghost" onClick={() => onUpdate(true)}>
              <FiRefreshCw aria-hidden />
              Actualiser
            </button>
          </div>
        </div>

        <div
          className={`inbox-panel${isCompact && mobilePane === 'detail' ? ' inbox-panel--mobile-detail' : ''}`}
        >
          <aside className="inbox-pane inbox-pane--list">
            <div className="inbox-pane__head">
              <h2 className="inbox-pane__title">Messages</h2>
              <span className="inbox-pane__count">
                {listPagination.total}
                {listPagination.totalPages > 1
                  ? ` · p. ${listPagination.safePage}/${listPagination.totalPages}`
                  : ''}
              </span>
            </div>

            <div className="inbox-pane__tools">
              <div className="inbox-search">
                <FiSearch aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  aria-label="Rechercher dans la boîte"
                />
              </div>
              <div className="inbox-segment" role="tablist" aria-label="Filtrer les messages">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.id}
                    className={`inbox-segment__btn ${filter === f.id ? 'is-active' : ''}`}
                    onClick={() => setFilter(f.id)}
                  >
                    <span className="inbox-segment__label inbox-segment__label--full">{f.label}</span>
                    <span className="inbox-segment__label inbox-segment__label--short">{f.shortLabel}</span>
                    <span className="inbox-segment__badge">{filterCounts[f.id]}</span>
                  </button>
                ))}
              </div>
            </div>

            <ul className="inbox-list" aria-label="Liste des messages">
              {filtered.length === 0 ? (
                <li className="inbox-list__empty">Aucun message pour ce filtre.</li>
              ) : (
                listPagination.pageItems.map((c) => {
                  const unread = isUnread(c);
                  const intent = parseIntent(c.subject);
                  const active = c.id === selectedId;
                  const kind = sourceKind(c);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`inbox-row ${unread ? 'is-unread' : ''} ${active ? 'is-active' : ''}`}
                        onClick={() => selectMessage(c)}
                      >
                        <span className="inbox-row__avatar" aria-hidden>
                          {contactInitials(c.name)}
                          {unread && <span className="inbox-row__avatar-dot" />}
                        </span>
                        <span className="inbox-row__main">
                          <span className="inbox-row__top">
                            <span className="inbox-row__name">{c.name}</span>
                            <time className="inbox-row__time" dateTime={c.created_at}>
                              {formatListTime(c.created_at)}
                            </time>
                          </span>
                          <span className="inbox-row__subject">
                            {c.subject || 'Sans sujet'}
                          </span>
                          <span className="inbox-row__preview">
                            {(c.message || '').split('\n')[0].slice(0, 100)}
                          </span>
                          <span className="inbox-row__tags">
                            <span className={`inbox-tag inbox-tag--${kind}`}>
                              {kind === 'work' ? 'Œuvre' : 'Contact'}
                            </span>
                            {intent && <span className="inbox-tag inbox-tag--intent">{intent}</span>}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            <AdminPagination
              page={listPagination.safePage}
              totalPages={listPagination.totalPages}
              total={listPagination.total}
              from={listPagination.from}
              to={listPagination.to}
              onPageChange={setListPage}
              itemLabel="messages"
              ariaLabel="Pagination des messages"
            />
          </aside>

          <article className="inbox-pane inbox-pane--detail" aria-live="polite">
            {!selected ? (
              <div className="inbox-detail__placeholder">
                <FiInbox size={40} strokeWidth={1.1} aria-hidden />
                <p>Sélectionnez un message dans la liste.</p>
              </div>
            ) : (
              <>
                <header className="inbox-detail__head">
                  {isCompact && (
                    <button
                      type="button"
                      className="inbox-detail__back"
                      onClick={() => setMobilePane('list')}
                    >
                      <FiArrowLeft aria-hidden />
                      Messages
                    </button>
                  )}
                  <div className="inbox-detail__head-row">
                    <div className="inbox-detail__identity">
                      <span className="inbox-detail__avatar" aria-hidden>
                        {contactInitials(selected.name)}
                      </span>
                      <div className="inbox-detail__meta">
                        <div className="inbox-detail__meta-top">
                          <h2 className="inbox-detail__subject">{selected.subject || 'Sans sujet'}</h2>
                          <span className={`inbox-detail__pill inbox-detail__pill--${sourceKind(selected)}`}>
                            {sourceKind(selected) === 'work' ? 'Demande œuvre' : 'Page contact'}
                          </span>
                        </div>
                        <p className="inbox-detail__from">
                          <strong>{selected.name}</strong>
                          <span className="inbox-detail__sep">·</span>
                          <a href={`mailto:${selected.email}`}>{selected.email}</a>
                        </p>
                        <time className="inbox-detail__date" dateTime={selected.created_at}>
                          Reçu le {formatWhen(selected.created_at)}
                        </time>
                      </div>
                    </div>
                    <div className="inbox-detail__actions">
                      <button
                        type="button"
                        className="brand-btn brand-btn--primary"
                        onClick={() => setReplyingTo(selected)}
                      >
                        <FaReply aria-hidden />
                        Répondre
                      </button>
                      <button
                        type="button"
                        className="inbox-detail__icon-btn"
                        onClick={() => handleDelete(selected.id)}
                        disabled={deletingId === selected.id}
                        aria-label="Supprimer le message"
                        title="Supprimer"
                      >
                        <FiTrash2 aria-hidden />
                      </button>
                    </div>
                  </div>
                </header>

                {selected.work_titre && (
                  <div className="inbox-detail__work">
                    {selected.work_image && (
                      <img
                        src={normalizeImageUrl(selected.work_image)}
                        alt=""
                        className="inbox-detail__work-img"
                      />
                    )}
                    <div className="inbox-detail__work-body">
                      <span className="inbox-detail__work-kicker">
                        {workTypeLabel(selected.work_type) || 'Œuvre'}
                      </span>
                      <p className="inbox-detail__work-title">{selected.work_titre}</p>
                      {selected.work_prix && !selected.is_sold && (
                        <p className="inbox-detail__work-price">{selected.work_prix} €</p>
                      )}
                      {selected.work_id && (
                        <Link
                          to={`/galerie/${selected.work_type || 'peintures'}/${selected.work_id}`}
                          className="inbox-detail__work-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Voir sur le site →
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <div className="inbox-detail__body">
                  <p className="inbox-detail__body-label">Message</p>
                  <div className="inbox-detail__message">{selected.message}</div>
                </div>

                {isUnread(selected) && (
                  <p className="inbox-detail__read-hint">
                    {busyRead === selected.id ? 'Marquage…' : 'Non lu — synchronisation…'}
                  </p>
                )}
              </>
            )}
          </article>
        </div>
      </div>

      {replyingTo && (
        <ReplyModal
          contact={replyingTo}
          onClose={() => setReplyingTo(null)}
          onSuccess={() => {
            setReplyingTo(null);
            onUpdate(true);
          }}
        />
      )}
    </>
  );
};

export { isUnread };
export default InboxAdmin;
