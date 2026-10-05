import crypto from 'crypto';
import pool from '../config/database.js';
import { normalizeWork } from '../utils/imageUrl.js';
import { sendEventInvitation, sendEventTicketEmail } from '../services/emailService.js';
import { ticketQrDataUrl } from '../services/ticketQr.js';
import {
  countRegistrationsForSlot,
  countRegistrationsLegacy,
  countAllEventRegistrations,
  fetchSlotsForWork,
  getSlotsWithAvailability,
  mapSlotAvailability,
} from '../services/ticketSlots.js';
import {
  syncRegistrationTickets,
  listTicketsForRegistration,
  fetchTicketContextByCode,
} from '../services/registrationTickets.js';
import { isEventRegistrationClosed, isEventPast } from '../utils/eventDates.js';

const PRIVACY_VERSION = process.env.PRIVACY_POLICY_VERSION || '2026-03';

const isEventWork = (row) => row && row.type === 'evenements';

export function parseTicketCode(raw) {
  const s = String(raw || '').trim();
  const match = s.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );
  return match ? match[0].toLowerCase() : null;
}

async function fetchRegistrationByCode(ticketCode) {
  return fetchTicketContextByCode(ticketCode);
}

async function getEventOr404(id, res) {
  const result = await pool.query('SELECT * FROM works WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Événement introuvable' });
    return null;
  }
  const work = result.rows[0];
  if (!isEventWork(work)) {
    res.status(400).json({ error: 'Cette entrée n\'est pas un événement' });
    return null;
  }
  return work;
}

function legacyTicketPayload(work, registered) {
  const mode = work.ticket_mode || 'closed';
  const capacity = work.ticket_capacity != null ? Number(work.ticket_capacity) : null;
  const unlimited = mode === 'free_entry' || mode === 'unlimited';
  const open = mode !== 'closed';
  const remaining =
    mode === 'limited' && capacity != null ? Math.max(0, capacity - registered) : null;
  const full = mode === 'limited' && capacity != null && registered >= capacity;

  return {
    work_id: work.id,
    ticket_mode: mode,
    ticket_capacity: capacity,
    registrations_count: registered,
    registration_open: open && !full,
    remaining,
    unlimited,
    free_entry: mode === 'free_entry',
    uses_slots: false,
    slots: [],
  };
}

export const getEventTicketInfo = async (req, res) => {
  try {
    const work = await getEventOr404(req.params.workId, res);
    if (!work) return;

    const closedByDate = isEventPast(work);

    const slots = await getSlotsWithAvailability(work.id);
    if (slots.length > 0) {
      const anyOpen = slots.some((s) => s.registration_open);
      const registrationOpen =
        !isEventRegistrationClosed(work) && anyOpen;
      return res.json({
        work_id: work.id,
        ticket_mode: work.ticket_mode === 'closed' ? 'closed' : 'open',
        uses_slots: true,
        slots,
        registration_open: registrationOpen,
        event_ended: closedByDate,
        unlimited: false,
        free_entry: false,
      });
    }

    const registered = await countAllEventRegistrations(work.id);
    const legacy = legacyTicketPayload(work, registered);
    if (isEventRegistrationClosed(work)) {
      legacy.registration_open = false;
    }
    legacy.event_ended = closedByDate;
    res.json(legacy);
  } catch (error) {
    console.error('getEventTicketInfo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const registerForEvent = async (req, res) => {
  try {
    const workId = parseInt(req.params.workId, 10);
    const work = await getEventOr404(String(workId), res);
    if (!work) return;

    const mode = work.ticket_mode || 'closed';
    if (mode === 'closed') {
      return res.status(400).json({ error: 'Les inscriptions sont fermées pour cet événement' });
    }
    if (isEventRegistrationClosed(work)) {
      return res.status(400).json({
        error: isEventPast(work)
          ? 'Cet événement est terminé — inscriptions closes'
          : 'Les inscriptions sont fermées pour cet événement',
      });
    }

    const {
      email,
      first_name,
      last_name,
      phone,
      accept_privacy,
      marketing_opt_in,
      slot_id: slotIdRaw,
      party_size: partySizeRaw,
    } = req.body;

    let partySize = parseInt(partySizeRaw, 10);
    if (!partySize || partySize < 1) partySize = 1;
    if (partySize > 20) {
      return res.status(400).json({ error: 'Maximum 20 billets par inscription' });
    }

    if (!email || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, prénom et nom sont requis' });
    }
    if (!accept_privacy) {
      return res.status(400).json({ error: 'Vous devez accepter la politique de confidentialité' });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const slots = await fetchSlotsForWork(workId);
    let slotId = slotIdRaw != null ? parseInt(slotIdRaw, 10) : null;
    let slotMeta = null;

    if (slots.length > 0) {
      if (!slotId) {
        return res.status(400).json({ error: 'Veuillez choisir un créneau / jour' });
      }
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) {
        return res.status(400).json({ error: 'Créneau invalide' });
      }
      slotMeta = slot;
    } else {
      slotId = null;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const visitorUpsert = await client.query(
        `INSERT INTO visitors (email, first_name, last_name, phone, marketing_opt_in, marketing_consent_at, privacy_policy_version, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (email)
       DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         phone = COALESCE(EXCLUDED.phone, visitors.phone),
         marketing_opt_in = CASE WHEN EXCLUDED.marketing_opt_in THEN TRUE ELSE visitors.marketing_opt_in END,
         marketing_consent_at = CASE WHEN EXCLUDED.marketing_opt_in THEN COALESCE(visitors.marketing_consent_at, CURRENT_TIMESTAMP) ELSE visitors.marketing_consent_at END,
         privacy_policy_version = EXCLUDED.privacy_policy_version,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
        [
          emailNorm,
          String(first_name).trim(),
          String(last_name).trim(),
          phone ? String(phone).trim() : null,
          Boolean(marketing_opt_in),
          marketing_opt_in ? new Date() : null,
          PRIVACY_VERSION,
        ]
      );

      const visitor = visitorUpsert.rows[0];

      let existingQuery;
      let existingParams;
      if (slotId) {
        existingQuery = `SELECT * FROM event_registrations WHERE work_id = $1 AND visitor_id = $2 AND slot_id = $3`;
        existingParams = [workId, visitor.id, slotId];
      } else {
        existingQuery = `SELECT * FROM event_registrations WHERE work_id = $1 AND visitor_id = $2 AND slot_id IS NULL`;
        existingParams = [workId, visitor.id];
      }

      const existing = await client.query(existingQuery, existingParams);

      const previousSize =
        existing.rows.length > 0 ? Number(existing.rows[0].party_size) || 1 : 0;

      if (slotMeta) {
        const registered = await countRegistrationsForSlot(slotId);
        const availability = mapSlotAvailability(slotMeta, registered);
        const seatsAfter =
          registered - previousSize + partySize;
        if (!availability.unlimited && availability.capacity != null && seatsAfter > availability.capacity) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            error:
              availability.remaining != null && availability.remaining < partySize
                ? `Il reste ${Math.max(0, availability.remaining)} place(s) pour ce créneau`
                : 'Complet — plus de places pour ce créneau',
          });
        }
      } else {
        const registered = await countRegistrationsLegacy(workId);
        const legacy = legacyTicketPayload(work, registered);
        const seatsAfter = registered - previousSize + partySize;
        if (
          legacy.ticket_mode === 'limited' &&
          legacy.ticket_capacity != null &&
          seatsAfter > legacy.ticket_capacity
        ) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'Complet — plus de places disponibles' });
        }
        if (!legacy.registration_open && previousSize === 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'Complet — plus de places disponibles' });
        }
      }

      let registration;
      if (existing.rows.length > 0) {
        registration = existing.rows[0];
        if (partySize !== previousSize) {
          const upd = await client.query(
            `UPDATE event_registrations SET party_size = $1 WHERE id = $2 RETURNING *`,
            [partySize, registration.id]
          );
          registration = upd.rows[0];
        }
      } else {
        const ticketCode = crypto.randomUUID();
        const ins = await client.query(
          `INSERT INTO event_registrations (work_id, visitor_id, slot_id, ticket_code, status, party_size)
         VALUES ($1, $2, $3, $4, 'confirmed', $5)
         RETURNING *`,
          [workId, visitor.id, slotId, ticketCode, partySize]
        );
        registration = ins.rows[0];
      }

      let ticketRows;
      try {
        ticketRows = await syncRegistrationTickets(client, registration.id, partySize);
      } catch (syncErr) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: syncErr.message || 'Synchronisation des billets impossible' });
      }
      registration.ticket_code = ticketRows[0]?.ticket_code || registration.ticket_code;

      await client.query('COMMIT');

      const ticketCodes = ticketRows.map((t) => t.ticket_code);

      let emailSent = false;
      try {
        await sendEventTicketEmail({
          visitor,
          event: normalizeWork(work),
          ticketCode: registration.ticket_code,
          ticketCodes,
          slot: slotMeta,
          partySize: ticketRows.length,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('Email billet non envoyé:', mailErr.message);
      }

      res.status(201).json({
        message: emailSent
          ? 'Inscription enregistrée. Un email de confirmation vous a été envoyé.'
          : 'Inscription enregistrée. Email non envoyé — ouvrez vos billets en ligne (QR codes).',
        ticket_code: registration.ticket_code,
        ticket_codes: ticketCodes,
        tickets_count: ticketCodes.length,
        already_registered: existing.rows.length > 0,
        email_sent: emailSent,
      });
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('registerForEvent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

async function buildPublicTicketPayload(row) {
  const instances = await listTicketsForRegistration(null, row.registration_id);
  const tickets = await Promise.all(
    instances.map(async (t) => ({
      ticket_code: t.ticket_code,
      ticket_index: t.ticket_index,
      checked_in_at: t.checked_in_at,
      qr_data_url: await ticketQrDataUrl(t.ticket_code),
    }))
  );
  const current = tickets.find((t) => t.ticket_code === row.ticket_code) || tickets[0];
  return {
    ticket_code: current.ticket_code,
    ticket_index: current.ticket_index,
    tickets_total: tickets.length,
    tickets,
    status: row.status,
    qr_data_url: current.qr_data_url,
    party_size: tickets.length,
    event: {
      id: row.work_id,
      titre: row.event_titre,
      date_debut: row.date_debut,
      date_fin: row.date_fin,
      lieu: row.lieu,
      adresse: row.adresse,
    },
    slot: row.slot_label ? { label: row.slot_label, slot_date: row.slot_date } : null,
    guest: {
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
    },
  };
}

export const getPublicTicket = async (req, res) => {
  try {
    const { code } = req.params;
    const row = await fetchTicketContextByCode(code);
    if (!row) {
      const legacy = await pool.query(
        `SELECT er.id AS registration_id, er.ticket_code, er.status, er.work_id, er.party_size,
                w.titre AS event_titre, w.type AS event_type, w.date_debut, w.date_fin, w.lieu, w.adresse,
                v.first_name, v.last_name, v.email,
                s.label AS slot_label, s.slot_date AS slot_date
         FROM event_registrations er
         JOIN works w ON w.id = er.work_id
         JOIN visitors v ON v.id = er.visitor_id
         LEFT JOIN event_ticket_slots s ON s.id = er.slot_id
         WHERE er.ticket_code = $1`,
        [code]
      );
      if (legacy.rows.length === 0) {
        return res.status(404).json({ error: 'Billet introuvable' });
      }
      const reg = legacy.rows[0];
      await syncRegistrationTickets(pool, reg.registration_id, reg.party_size || 1);
      const refreshed = await fetchTicketContextByCode(code);
      if (!refreshed) {
        return res.status(404).json({ error: 'Billet introuvable' });
      }
      return res.json(await buildPublicTicketPayload(refreshed));
    }
    res.json(await buildPublicTicketPayload(row));
  } catch (error) {
    console.error('getPublicTicket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const listVisitors = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*,
        (SELECT COUNT(*)::int FROM event_registrations er
         WHERE er.visitor_id = v.id AND er.status = 'confirmed') AS registrations_count,
        COALESCE(
          (
            SELECT json_agg(row_to_json(ev) ORDER BY ev.last_registration DESC)
            FROM (
              SELECT w.id AS work_id,
                     w.titre,
                     w.date_debut,
                     w.date_fin,
                     COUNT(er.id)::int AS registrations_count,
                     MAX(er.created_at) AS last_registration
              FROM event_registrations er
              JOIN works w ON w.id = er.work_id
              WHERE er.visitor_id = v.id AND er.status = 'confirmed'
              GROUP BY w.id, w.titre, w.date_debut, w.date_fin
            ) ev
          ),
          '[]'::json
        ) AS events
       FROM visitors v
       ORDER BY v.updated_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('listVisitors:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const checkInTicket = async (req, res) => {
  try {
    const { code: rawCode, work_id: expectedWorkId } = req.body || {};
    const ticketCode = parseTicketCode(rawCode);
    if (!ticketCode) {
      return res.status(400).json({ error: 'Code billet invalide' });
    }

    const row = await fetchRegistrationByCode(ticketCode);
    if (!row) {
      return res.status(404).json({ error: 'Billet introuvable' });
    }
    if (row.event_type !== 'evenements') {
      return res.status(400).json({ error: 'Ce QR code ne correspond pas à un billet événement' });
    }
    if (row.status !== 'confirmed') {
      return res.status(400).json({ error: 'Billet non valide (statut annulé ou refusé)' });
    }

    if (expectedWorkId != null && expectedWorkId !== '') {
      const wid = parseInt(expectedWorkId, 10);
      if (wid && row.work_id !== wid) {
        return res.status(409).json({
          error: `Ce billet est pour « ${row.event_titre} », pas pour l'événement sélectionné`,
          registration: formatCheckInRow(row),
        });
      }
    }

    if (row.ticket_checked_in_at) {
      return res.json({
        message: 'Entrée déjà enregistrée pour ce billet',
        already_checked_in: true,
        registration: formatCheckInRow(row),
      });
    }

    const updated = await pool.query(
      `UPDATE event_registration_tickets
       SET checked_in_at = CURRENT_TIMESTAMP
       WHERE ticket_code = $1
       RETURNING checked_in_at`,
      [ticketCode]
    );
    row.ticket_checked_in_at = updated.rows[0].checked_in_at;

    res.json({
      message: 'Entrée enregistrée',
      already_checked_in: false,
      registration: formatCheckInRow(row),
    });
  } catch (error) {
    console.error('checkInTicket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

function formatCheckInRow(row) {
  const index = Number(row.ticket_index) || 1;
  const total = Number(row.party_size) || 1;
  return {
    id: row.registration_id,
    ticket_code: row.ticket_code,
    ticket_index: index,
    tickets_total: total,
    party_size: total,
    work_id: row.work_id,
    event_titre: row.event_titre,
    slot_label: row.slot_label,
    slot_date: row.slot_date,
    guest: {
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
    },
    registered_at: row.created_at,
    checked_in_at: row.ticket_checked_in_at,
  };
}

export const listEventRegistrations = async (req, res) => {
  try {
    const workId = parseInt(req.params.workId, 10);
    const result = await pool.query(
      `SELECT er.id, er.ticket_code, er.status, er.created_at, er.checked_in_at, er.slot_id,
              er.party_size,
              v.email, v.first_name, v.last_name, v.phone, v.marketing_opt_in,
              s.label AS slot_label, s.slot_date AS slot_date,
              s.capacity_mode AS slot_capacity_mode, s.capacity AS slot_capacity,
              COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'ticket_code', t.ticket_code,
                      'ticket_index', t.ticket_index,
                      'checked_in_at', t.checked_in_at
                    )
                    ORDER BY t.ticket_index
                  )
                  FROM event_registration_tickets t
                  WHERE t.registration_id = er.id
                ),
                '[]'::json
              ) AS tickets,
              (SELECT COUNT(*)::int FROM event_registration_tickets t
               WHERE t.registration_id = er.id) AS tickets_total,
              (SELECT COUNT(*)::int FROM event_registration_tickets t
               WHERE t.registration_id = er.id AND t.checked_in_at IS NOT NULL) AS tickets_checked_in
       FROM event_registrations er
       JOIN visitors v ON v.id = er.visitor_id
       LEFT JOIN event_ticket_slots s ON s.id = er.slot_id
       WHERE er.work_id = $1 AND er.status = 'confirmed'
       ORDER BY er.created_at DESC`,
      [workId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('listEventRegistrations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const inviteOptedInVisitors = async (req, res) => {
  try {
    const work = await getEventOr404(req.params.workId, res);
    if (!work) return;

    const { message } = req.body || {};
    const visitors = await pool.query(
      `SELECT * FROM visitors WHERE marketing_opt_in = TRUE ORDER BY email`
    );

    let sent = 0;
    let failed = 0;
    for (const visitor of visitors.rows) {
      try {
        await sendEventInvitation({ visitor, event: normalizeWork(work), customMessage: message });
        sent += 1;
      } catch {
        failed += 1;
      }
    }

    res.json({
      message: `Invitations envoyées : ${sent} succès, ${failed} échec(s)`,
      sent,
      failed,
      total: visitors.rows.length,
    });
  } catch (error) {
    console.error('inviteOptedInVisitors:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
