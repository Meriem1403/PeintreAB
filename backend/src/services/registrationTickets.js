import crypto from 'crypto';
import pool from '../config/database.js';

export async function listTicketsForRegistration(client, registrationId) {
  const db = client || pool;
  const result = await db.query(
    `SELECT id, registration_id, ticket_code, ticket_index, checked_in_at, created_at
     FROM event_registration_tickets
     WHERE registration_id = $1
     ORDER BY ticket_index ASC`,
    [registrationId]
  );
  return result.rows;
}

/** Assure exactement `targetSize` billets (1 QR chacun). */
export async function syncRegistrationTickets(client, registrationId, targetSize) {
  const size = Math.max(1, Math.min(20, Number(targetSize) || 1));
  const existing = await client.query(
    `SELECT id, ticket_code, ticket_index, checked_in_at
     FROM event_registration_tickets
     WHERE registration_id = $1
     ORDER BY ticket_index ASC
     FOR UPDATE`,
    [registrationId]
  );

  const rows = existing.rows;
  if (rows.length < size) {
    for (let i = rows.length + 1; i <= size; i += 1) {
      await client.query(
        `INSERT INTO event_registration_tickets (registration_id, ticket_code, ticket_index)
         VALUES ($1, $2, $3)`,
        [registrationId, crypto.randomUUID(), i]
      );
    }
  } else if (rows.length > size) {
    const toRemove = rows.filter((r) => r.ticket_index > size);
    for (const row of toRemove) {
      if (row.checked_in_at) {
        throw new Error('Impossible de retirer un billet déjà scanné à l’entrée');
      }
      await client.query('DELETE FROM event_registration_tickets WHERE id = $1', [row.id]);
    }
  }

  const tickets = await listTicketsForRegistration(client, registrationId);
  const primary = tickets[0]?.ticket_code;
  if (primary) {
    await client.query(
      `UPDATE event_registrations SET ticket_code = $1 WHERE id = $2`,
      [primary, registrationId]
    );
  }
  return tickets;
}

export async function fetchTicketContextByCode(ticketCode) {
  const result = await pool.query(
    `SELECT t.id AS ticket_instance_id, t.ticket_code, t.ticket_index, t.checked_in_at AS ticket_checked_in_at,
            er.id AS registration_id, er.status, er.created_at, er.party_size, er.checked_in_at,
            er.work_id, er.slot_id,
            w.titre AS event_titre, w.type AS event_type, w.date_debut, w.date_fin, w.lieu, w.adresse,
            v.first_name, v.last_name, v.email, v.phone,
            s.label AS slot_label, s.slot_date AS slot_date
     FROM event_registration_tickets t
     JOIN event_registrations er ON er.id = t.registration_id
     JOIN works w ON w.id = er.work_id
     JOIN visitors v ON v.id = er.visitor_id
     LEFT JOIN event_ticket_slots s ON s.id = er.slot_id
     WHERE t.ticket_code = $1`,
    [ticketCode]
  );
  return result.rows[0] || null;
}
