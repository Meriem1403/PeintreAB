import { forwardRef } from 'react';
import {
  formatExhibitionOnTicket,
  formatSlotOnTicket,
} from '../utils/eventDates';
import '../pages/TicketPage.css';

const TicketPassCard = forwardRef(function TicketPassCard(
  { pass, ticketIndex, ticketsTotal },
  ref
) {
  const exhibition = formatExhibitionOnTicket(pass.event.date_debut, pass.event.date_fin);
  const visitSlot = formatSlotOnTicket(pass.slot);
  const shortCode = pass.ticket_code?.slice(0, 8).toUpperCase();
  const hasLocation = Boolean(pass.event.lieu || pass.event.adresse);

  return (
    <article
      ref={ref}
      className="ticket-page__pass"
      aria-label={
        ticketsTotal > 1
          ? `Billet ${ticketIndex} sur ${ticketsTotal}`
          : 'Billet événement'
      }
    >
      <div className="ticket-page__pass-top">
        <p className="ticket-page__brand">Alexandre Bindl</p>
        <p className="ticket-page__kicker">
          {ticketsTotal > 1 ? `Billet ${ticketIndex} / ${ticketsTotal}` : "Billet d'entrée"}
        </p>
        <h1 className="ticket-page__title">{pass.event.titre}</h1>
      </div>

      <div className="ticket-page__perforation" aria-hidden>
        <span className="ticket-page__perforation-line" />
      </div>

      <div className="ticket-page__pass-body">
        <div className="ticket-page__meta-grid">
          <div className="ticket-page__meta ticket-page__meta--wide">
            <span className="ticket-page__meta-label">Invité</span>
            <span className="ticket-page__meta-value">
              {pass.guest.first_name} {pass.guest.last_name}
            </span>
          </div>

          {(visitSlot || exhibition) && (
            <div className="ticket-page__schedule">
              {visitSlot && (
                <div className="ticket-page__schedule-block ticket-page__schedule-block--visit">
                  <span className="ticket-page__schedule-label">Votre visite</span>
                  {visitSlot.dayLine && (
                    <p className="ticket-page__schedule-primary">{visitSlot.dayLine}</p>
                  )}
                  {visitSlot.title && (
                    <p className="ticket-page__schedule-secondary">{visitSlot.title}</p>
                  )}
                </div>
              )}
              {exhibition && (
                <div
                  className={`ticket-page__schedule-block ticket-page__schedule-block--expo${
                    visitSlot ? ' ticket-page__schedule-block--muted' : ''
                  }`}
                >
                  <span className="ticket-page__schedule-label">
                    {visitSlot ? "Durée de l'exposition" : 'Exposition'}
                  </span>
                  <p className="ticket-page__schedule-primary">{exhibition.range}</p>
                  <p className="ticket-page__schedule-badge">{exhibition.duration}</p>
                </div>
              )}
            </div>
          )}

          {hasLocation && (
            <div className="ticket-page__meta ticket-page__meta--wide">
              <span className="ticket-page__meta-label">Lieu</span>
              <span className="ticket-page__meta-value">
                {pass.event.lieu || pass.event.adresse}
              </span>
            </div>
          )}
        </div>

        {pass.qr_data_url && (
          <div className="ticket-page__qr-wrap">
            <img
              src={pass.qr_data_url}
              alt={`QR code billet ${ticketIndex}`}
              className="ticket-page__qr"
              loading="lazy"
              decoding="async"
            />
            <p className="ticket-page__code">N° {shortCode}</p>
          </div>
        )}

      </div>
    </article>
  );
});

export default TicketPassCard;
