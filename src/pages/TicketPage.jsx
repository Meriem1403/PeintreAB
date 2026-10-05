import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FaCalendarPlus, FaDownload, FaMapMarkedAlt, FaQrcode, FaShareAlt } from 'react-icons/fa';
import TicketPassCard from '../components/TicketPassCard';
import { eventsAPI } from '../utils/apiService';
import {
  downloadInvitationPdf,
  downloadTicketIcs,
  openMapsForTicket,
  shareTicket,
} from '../utils/ticketExport';
import './TicketPage.css';

const TicketPage = () => {
  const { code } = useParams();
  const location = useLocation();
  const registrationNotice = location.state?.fromRegistration ? location.state : null;
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [shareHint, setShareHint] = useState(null);
  useEffect(() => {
    if (!code) return;
    (async () => {
      try {
        const data = await eventsAPI.getTicket(code);
        setTicket(data);
      } catch (err) {
        setError(err.message || 'Billet introuvable');
      }
    })();
  }, [code]);

  useEffect(() => {
    const applyNavOffset = () => {
      const nav = document.querySelector('.navbar');
      const h = nav ? Math.ceil(nav.getBoundingClientRect().height) : 72;
      document.documentElement.style.setProperty('--ticket-nav-offset', `${h}px`);
    };
    applyNavOffset();
    window.addEventListener('resize', applyNavOffset);
    return () => window.removeEventListener('resize', applyNavOffset);
  }, []);

  if (error) {
    return (
      <main className="ticket-page ticket-page--error">
        <p>{error}</p>
        <Link to="/galerie/evenements">Retour à la galerie</Link>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="ticket-page">
        <p className="ticket-page__loading">Chargement du billet…</p>
      </main>
    );
  }

  const passes =
    ticket.tickets?.length > 0
      ? ticket.tickets.map((t) => ({
          ticket_code: t.ticket_code,
          qr_data_url: t.qr_data_url,
          event: ticket.event,
          slot: ticket.slot,
          guest: ticket.guest,
        }))
      : [
          {
            ticket_code: ticket.ticket_code,
            qr_data_url: ticket.qr_data_url,
            event: ticket.event,
            slot: ticket.slot,
            guest: ticket.guest,
          },
        ];

  const ticketsTotal = ticket.tickets_total || passes.length;
  const ticketUrl = `${window.location.origin}/billet/${ticket.ticket_code}`;
  const hasLocation = Boolean(ticket.event.lieu || ticket.event.adresse);
  const slug = (ticket.event.titre || 'expo').replace(/[^\w\-]+/gi, '-').slice(0, 32);

  const handleSaveQr = (pass, index) => {
    if (!pass?.qr_data_url) return;
    const a = document.createElement('a');
    a.href = pass.qr_data_url;
    a.download = `billet-${index}-${pass.ticket_code?.slice(0, 8) || 'expo'}.png`;
    a.click();
  };

  const handlePdfAll = async () => {
    setBusy('pdf');
    try {
      await downloadInvitationPdf({
        ticket,
        passes: ticket.tickets?.length ? ticket.tickets : passes,
        filename:
          ticketsTotal > 1 ? `invitations-${slug}.pdf` : `invitation-${slug}.pdf`,
      });
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy('share');
    setShareHint(null);
    try {
      const result = await shareTicket({ ...ticket, party_size: ticketsTotal }, ticketUrl);
      if (result === 'clipboard') {
        setShareHint('Lien copié — collez-le dans un message ou un rappel.');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="ticket-page">
      <div className="ticket-page__shell">
        {registrationNotice && (
          <p className="ticket-page__success" role="status">
            {registrationNotice.alreadyRegistered
              ? 'Vous étiez déjà inscrit — voici vos billets.'
              : registrationNotice.message || 'Inscription confirmée.'}
          </p>
        )}

        <section
          className="ticket-page__passes"
          data-multi={ticketsTotal > 1 ? 'true' : 'false'}
          aria-label="Vos billets"
        >
          <div className="ticket-page__passes-track">
            {passes.map((pass, i) => {
              const index = ticket.tickets?.[i]?.ticket_index ?? i + 1;
              return (
                <div key={pass.ticket_code} className="ticket-page__pass-slot">
                  <TicketPassCard pass={pass} ticketIndex={index} ticketsTotal={ticketsTotal} />
                </div>
              );
            })}
          </div>
        </section>

        <footer className="ticket-page__footer">
          <div className="ticket-page__actions">
            <button
              type="button"
              className="brand-btn brand-btn--primary ticket-page__btn--primary"
              onClick={handlePdfAll}
              disabled={busy === 'pdf'}
            >
              <FaDownload aria-hidden />
              {busy === 'pdf'
                ? 'PDF…'
                : ticketsTotal > 1
                  ? `Invitation PDF (${ticketsTotal} pages)`
                  : 'Invitation PDF'}
            </button>
            <button
              type="button"
              className="brand-btn brand-btn--secondary"
              onClick={() => downloadTicketIcs({ ...ticket, party_size: ticketsTotal })}
            >
              <FaCalendarPlus aria-hidden />
              Ajouter à l&apos;agenda
            </button>
            {hasLocation && (
              <button
                type="button"
                className="brand-btn brand-btn--secondary"
                onClick={() => openMapsForTicket(ticket)}
              >
                <FaMapMarkedAlt aria-hidden />
                Ouvrir dans Plans
              </button>
            )}
            {passes[0]?.qr_data_url && (
              <button
                type="button"
                className="brand-btn brand-btn--secondary"
                onClick={() =>
                  handleSaveQr(passes[0], ticket.tickets?.[0]?.ticket_index ?? 1)
                }
              >
                <FaQrcode aria-hidden />
                Enregistrer le QR
              </button>
            )}
            <button
              type="button"
              className="brand-btn brand-btn--secondary ticket-page__btn--wide"
              onClick={handleShare}
              disabled={busy === 'share'}
            >
              <FaShareAlt aria-hidden />
              {busy === 'share' ? 'Partage…' : 'Partager'}
            </button>
          </div>

          {shareHint && (
            <p className="ticket-page__share-hint" role="status">
              {shareHint}
            </p>
          )}

          {ticket.event.id ? (
            <Link to={`/galerie/evenements/${ticket.event.id}`} className="ticket-page__back">
              Voir l&apos;événement
            </Link>
          ) : (
            <Link to="/galerie/evenements" className="ticket-page__back">
              Galerie événements
            </Link>
          )}
        </footer>
      </div>
    </main>
  );
};

export default TicketPage;
