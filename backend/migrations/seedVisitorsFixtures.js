import { randomUUID } from 'crypto';
import pool from '../src/config/database.js';
import { fetchSlotsForWork, replaceTicketSlots } from '../src/services/ticketSlots.js';

const SLOT_TEMPLATES = [
  [
    { label: 'Jour 1 — vernissage', slot_date: '', capacity_mode: 'limited', capacity: 10 },
    { label: 'Jour 2', slot_date: '', capacity_mode: 'limited', capacity: 25 },
    { label: 'Jour 3', slot_date: '', capacity_mode: 'unlimited', capacity: '' },
  ],
  [
    { label: 'Samedi', slot_date: '', capacity_mode: 'limited', capacity: 15 },
    { label: 'Dimanche', slot_date: '', capacity_mode: 'limited', capacity: 30 },
  ],
  [
    { label: 'Accès général', slot_date: '', capacity_mode: 'limited', capacity: 40 },
  ],
];

const FIXTURE_VISITORS = [
  {
    email: 'marie.dubois@example.com',
    first_name: 'Marie',
    last_name: 'Dubois',
    phone: '06 12 34 56 78',
    marketing_opt_in: true,
  },
  {
    email: 'jean.martin@example.com',
    first_name: 'Jean',
    last_name: 'Martin',
    phone: null,
    marketing_opt_in: false,
  },
  {
    email: 'sophie.bernard@example.com',
    first_name: 'Sophie',
    last_name: 'Bernard',
    phone: '07 98 76 54 32',
    marketing_opt_in: true,
  },
  {
    email: 'lucas.petit@example.com',
    first_name: 'Lucas',
    last_name: 'Petit',
    phone: null,
    marketing_opt_in: false,
  },
  {
    email: 'camille.roux@example.com',
    first_name: 'Camille',
    last_name: 'Roux',
    phone: '06 11 22 33 44',
    marketing_opt_in: true,
  },
  {
    email: 'thomas.leroy@example.com',
    first_name: 'Thomas',
    last_name: 'Leroy',
    phone: null,
    marketing_opt_in: false,
  },
  {
    email: 'emma.moreau@example.com',
    first_name: 'Emma',
    last_name: 'Moreau',
    phone: '06 55 44 33 22',
    marketing_opt_in: true,
  },
  {
    email: 'pierre.garnier@example.com',
    first_name: 'Pierre',
    last_name: 'Garnier',
    phone: null,
    marketing_opt_in: false,
  },
];

/** Indices de visiteurs inscrits par événement (0-based dans FIXTURE_VISITORS) */
const REGISTRATIONS_BY_EVENT_INDEX = [
  [0, 1, 2, 3],
  [0, 2, 4, 5, 6],
  [1, 3, 5, 7],
];

const seedVisitorsFixtures = async () => {
  const force = process.argv.includes('--force');

  try {
    const countRes = await pool.query('SELECT COUNT(*)::int AS c FROM visitors');
    if (countRes.rows[0].c > 0 && !force) {
      console.log(
        `✅ ${countRes.rows[0].c} visiteur(s) déjà en base. Utilisez: npm run seed:visitors -- --force`
      );
      return;
    }

    if (force) {
      console.log('🔄 Suppression des inscriptions et visiteurs de démo…');
      await pool.query('DELETE FROM event_registrations');
      await pool.query('DELETE FROM visitors');
    }

    const eventsRes = await pool.query(
      `SELECT id, titre FROM works WHERE type = 'evenements' ORDER BY id ASC LIMIT 3`
    );
    if (eventsRes.rows.length === 0) {
      console.log('⚠️ Aucun événement en base — créez des événements avant les fixtures visiteurs.');
      return;
    }

    console.log('🌱 Insertion des visiteurs de démonstration…');
    const visitorIds = [];

    for (const v of FIXTURE_VISITORS) {
      const result = await pool.query(
        `INSERT INTO visitors (
          email, first_name, last_name, phone, marketing_opt_in,
          marketing_consent_at, privacy_policy_version, updated_at
        ) VALUES ($1, $2, $3, $4, $5,
          CASE WHEN $5 THEN CURRENT_TIMESTAMP - (random() * interval '30 days') ELSE NULL END,
          '2025-01', CURRENT_TIMESTAMP - (random() * interval '14 days'))
        RETURNING id`,
        [v.email, v.first_name, v.last_name, v.phone, v.marketing_opt_in]
      );
      visitorIds.push(result.rows[0].id);
    }

    for (let evIdx = 0; evIdx < eventsRes.rows.length; evIdx += 1) {
      const work = eventsRes.rows[evIdx];
      const visitorIndexes = REGISTRATIONS_BY_EVENT_INDEX[evIdx] || REGISTRATIONS_BY_EVENT_INDEX[0];
      const slotTemplate = SLOT_TEMPLATES[evIdx] || SLOT_TEMPLATES[0];

      await pool.query(`UPDATE works SET ticket_mode = 'open', ticket_capacity = NULL WHERE id = $1`, [
        work.id,
      ]);
      await replaceTicketSlots(work.id, slotTemplate);
      const slots = await fetchSlotsForWork(work.id);

      console.log(`   → ${work.titre} (${visitorIndexes.length} inscriptions, ${slots.length} créneaux)`);

      for (let regIdx = 0; regIdx < visitorIndexes.length; regIdx += 1) {
        const vi = visitorIndexes[regIdx];
        const visitorId = visitorIds[vi];
        if (!visitorId || !slots.length) continue;
        const slot = slots[regIdx % slots.length];
        try {
          await pool.query(
            `INSERT INTO event_registrations (work_id, visitor_id, slot_id, ticket_code, status, created_at)
             VALUES ($1, $2, $3, $4, 'confirmed', CURRENT_TIMESTAMP - (random() * interval '10 days'))`,
            [work.id, visitorId, slot.id, randomUUID()]
          );
        } catch {
          /* ignore duplicate */
        }
      }
    }

    console.log('✅ Fixtures visiteurs terminées.');
  } catch (error) {
    console.error('❌ seedVisitorsFixtures:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seedVisitorsFixtures();
