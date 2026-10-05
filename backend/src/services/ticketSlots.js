import pool from '../config/database.js';

export async function fetchSlotsForWork(workId) {
  const result = await pool.query(
    `SELECT id, work_id, label, slot_date, capacity_mode, capacity, display_order
     FROM event_ticket_slots
     WHERE work_id = $1
     ORDER BY display_order ASC, id ASC`,
    [workId]
  );
  return result.rows;
}

export async function countRegistrationsForSlot(slotId) {
  const r = await pool.query(
    `SELECT COALESCE(SUM(COALESCE(party_size, 1)), 0)::int AS c FROM event_registrations
     WHERE slot_id = $1 AND status = 'confirmed'`,
    [slotId]
  );
  return r.rows[0].c;
}

export async function countRegistrationsLegacy(workId) {
  const r = await pool.query(
    `SELECT COALESCE(SUM(COALESCE(party_size, 1)), 0)::int AS c FROM event_registrations
     WHERE work_id = $1 AND status = 'confirmed' AND slot_id IS NULL`,
    [workId]
  );
  return r.rows[0].c;
}

export async function countAllEventRegistrations(workId) {
  const r = await pool.query(
    `SELECT COALESCE(SUM(COALESCE(party_size, 1)), 0)::int AS c FROM event_registrations
     WHERE work_id = $1 AND status = 'confirmed'`,
    [workId]
  );
  return r.rows[0].c;
}

export function mapSlotAvailability(slot, registered) {
  const unlimited = slot.capacity_mode === 'unlimited';
  const capacity = slot.capacity != null ? Number(slot.capacity) : null;
  const remaining =
    !unlimited && capacity != null ? Math.max(0, capacity - registered) : null;
  const full = !unlimited && capacity != null && registered >= capacity;
  return {
    id: slot.id,
    label: slot.label,
    slot_date: slot.slot_date,
    capacity_mode: slot.capacity_mode,
    capacity,
    registrations_count: registered,
    remaining,
    registration_open: unlimited || !full,
    unlimited,
  };
}

export async function getSlotsWithAvailability(workId) {
  const slots = await fetchSlotsForWork(workId);
  const enriched = [];
  for (const slot of slots) {
    const registered = await countRegistrationsForSlot(slot.id);
    enriched.push(mapSlotAvailability(slot, registered));
  }
  return enriched;
}

export async function replaceTicketSlots(workId, rawSlots) {
  const slots = Array.isArray(rawSlots) ? rawSlots : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM event_ticket_slots WHERE work_id = $1', [workId]);

    let order = 0;
    for (const row of slots) {
      const label = String(row.label || '').trim();
      if (!label) continue;

      const capacityMode = row.capacity_mode === 'unlimited' ? 'unlimited' : 'limited';
      let capacity = null;
      if (capacityMode === 'limited') {
        const parsed = parseInt(row.capacity, 10);
        if (!parsed || parsed < 1) {
          throw new Error(`Capacité invalide pour le créneau « ${label} »`);
        }
        capacity = parsed;
      }

      await client.query(
        `INSERT INTO event_ticket_slots (work_id, label, slot_date, capacity_mode, capacity, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          workId,
          label,
          row.slot_date || null,
          capacityMode,
          capacity,
          order++,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function migrateLegacyTicketToSlots(work) {
  const mode = work.ticket_mode || 'closed';
  if (mode === 'closed' || mode === 'open') return;

  const existing = await fetchSlotsForWork(work.id);
  if (existing.length > 0) return;

  let capacityMode = 'unlimited';
  let capacity = null;
  if (mode === 'limited' && work.ticket_capacity != null) {
    capacityMode = 'limited';
    capacity = Number(work.ticket_capacity);
  }

  await pool.query(
    `INSERT INTO event_ticket_slots (work_id, label, slot_date, capacity_mode, capacity, display_order)
     VALUES ($1, $2, $3, $4, $5, 0)`,
    [
      work.id,
      'Accès général',
      work.date_debut || null,
      capacityMode,
      capacity,
    ]
  );
  await pool.query(`UPDATE works SET ticket_mode = 'open', ticket_capacity = NULL WHERE id = $1`, [
    work.id,
  ]);
}
