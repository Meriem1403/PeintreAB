import pool from '../config/database.js';
import { normalizeImageUrl, normalizeWork } from '../utils/imageUrl.js';
import { fetchSlotsForWork, replaceTicketSlots } from '../services/ticketSlots.js';
import { isEventPast } from '../utils/eventDates.js';

export const getAllWorks = async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM works';
    const params = [];

    if (type) {
      query += ' WHERE type = $1';
      params.push(type);
    }

    query += ' ORDER BY COALESCE(display_order, 999999) ASC, created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(normalizeWork));
  } catch (error) {
    console.error('Erreur lors de la récupération des œuvres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getWorkById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM works WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Œuvre non trouvée' });
    }

    const work = normalizeWork(result.rows[0]);
    if (work.type === 'evenements') {
      work.ticket_slots = await fetchSlotsForWork(work.id);
    }
    res.json(work);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'œuvre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createWork = async (req, res) => {
  try {
    const {
      type,
      titre,
      description,
      prix,
      image,
      date,
      date_debut,
      date_fin,
      lieu,
      adresse,
      is_sold,
      is_featured,
      display_order,
      ticket_mode,
      ticket_capacity,
      ticket_slots,
    } = req.body;

    if (!type || !titre) {
      return res.status(400).json({ error: 'Type et titre sont requis' });
    }

    let eventTicketMode =
      type === 'evenements' ? ticket_mode || 'closed' : 'closed';
    if (type === 'evenements' && isEventPast({ date_fin: date_fin || date_debut })) {
      eventTicketMode = 'closed';
    }
    if (type === 'evenements' && eventTicketMode === 'open') {
      const slots = Array.isArray(ticket_slots) ? ticket_slots : [];
      const valid = slots.filter((s) => String(s.label || '').trim());
      if (valid.length === 0) {
        return res.status(400).json({
          error: 'Ajoutez au moins un créneau (jour) avec un libellé pour ouvrir les inscriptions',
        });
      }
    }

    // Si display_order n'est pas fourni, utiliser le max + 1 pour cette catégorie
    let finalDisplayOrder = display_order;
    if (finalDisplayOrder === undefined || finalDisplayOrder === null || finalDisplayOrder === '') {
      const maxOrderResult = await pool.query(
        'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM works WHERE type = $1',
        [type]
      );
      finalDisplayOrder = maxOrderResult.rows[0].next_order;
    } else {
      finalDisplayOrder = parseInt(finalDisplayOrder, 10);
    }

    const result = await pool.query(
      `INSERT INTO works (type, titre, description, prix, image, date, date_debut, date_fin, lieu, adresse, is_sold, is_featured, display_order, ticket_mode, ticket_capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        type,
        titre,
        description || null,
        prix || null,
        normalizeImageUrl(image) || null,
        date || null,
        date_debut || null,
        date_fin || null,
        lieu || null,
        adresse || null,
        is_sold || false,
        is_featured || false,
        finalDisplayOrder,
        eventTicketMode,
        null,
      ]
    );

    const created = result.rows[0];
    try {
      if (type === 'evenements') {
        if (eventTicketMode === 'open') {
          await replaceTicketSlots(created.id, ticket_slots);
        } else {
          await replaceTicketSlots(created.id, []);
        }
      }
    } catch (slotErr) {
      await pool.query('DELETE FROM works WHERE id = $1', [created.id]);
      return res.status(400).json({ error: slotErr.message || 'Créneaux invalides' });
    }

    const work = normalizeWork(created);
    if (type === 'evenements') {
      work.ticket_slots = await fetchSlotsForWork(work.id);
    }
    res.status(201).json(work);
  } catch (error) {
    console.error('Erreur lors de la création de l\'œuvre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateWork = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre,
      description,
      prix,
      image,
      date,
      date_debut,
      date_fin,
      lieu,
      adresse,
      is_sold,
      is_featured,
      display_order,
      ticket_mode,
      ticket_capacity,
      ticket_slots,
    } = req.body;
    console.log('🔄 Mise à jour œuvre:', { id, adresse, lieu, date_debut, date_fin });

    const existingWork = await pool.query('SELECT type FROM works WHERE id = $1', [id]);
    if (existingWork.rows.length === 0) {
      return res.status(404).json({ error: 'Œuvre non trouvée' });
    }
    const workType = existingWork.rows[0].type;

    if (workType === 'evenements' && ticket_mode === 'open') {
      const slots = Array.isArray(ticket_slots) ? ticket_slots : [];
      const valid = slots.filter((s) => String(s.label || '').trim());
      if (valid.length === 0) {
        return res.status(400).json({
          error: 'Ajoutez au moins un créneau (jour) avec un libellé pour ouvrir les inscriptions',
        });
      }
    }

    // Construire la requête SQL dynamiquement pour gérer les booléens correctement
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (titre !== undefined) {
      updates.push(`titre = $${paramIndex++}`);
      params.push(titre);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description || null);
    }
    if (prix !== undefined) {
      updates.push(`prix = $${paramIndex++}`);
      params.push(prix || null);
    }
    if (image !== undefined) {
      updates.push(`image = $${paramIndex++}`);
      params.push(normalizeImageUrl(image) || null);
    }
    if (date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      params.push(date || null);
    }
    if (date_debut !== undefined) {
      updates.push(`date_debut = $${paramIndex++}`);
      params.push(date_debut || null);
    }
    if (date_fin !== undefined) {
      updates.push(`date_fin = $${paramIndex++}`);
      params.push(date_fin || null);
    }
    if (lieu !== undefined) {
      updates.push(`lieu = $${paramIndex++}`);
      params.push(lieu || null);
    }
    if (adresse !== undefined) {
      updates.push(`adresse = $${paramIndex++}`);
      params.push(adresse || null);
    }
    // Gérer explicitement les booléens
    if (is_sold !== undefined) {
      updates.push(`is_sold = $${paramIndex++}`);
      params.push(is_sold === true || is_sold === 'true');
    }
    if (is_featured !== undefined) {
      updates.push(`is_featured = $${paramIndex++}`);
      params.push(is_featured === true || is_featured === 'true');
    }
    if (display_order !== undefined && display_order !== null && display_order !== '') {
      updates.push(`display_order = $${paramIndex++}`);
      params.push(parseInt(display_order, 10));
    }
    if (ticket_mode !== undefined) {
      updates.push(`ticket_mode = $${paramIndex++}`);
      params.push(ticket_mode || 'closed');
    }
    if (ticket_capacity !== undefined) {
      updates.push(`ticket_capacity = $${paramIndex++}`);
      const cap = ticket_capacity === '' || ticket_capacity == null ? null : parseInt(ticket_capacity, 10);
      params.push(cap != null && !Number.isNaN(cap) ? cap : null);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const whereClause = `WHERE id = $${paramIndex++}`;
    params.push(id);

    const query = `UPDATE works SET ${updates.join(', ')} ${whereClause} RETURNING *`;
    console.log('📝 Requête SQL:', query);
    console.log('📝 Paramètres:', params);
    
    const result = await pool.query(query, params);
    console.log('✅ Œuvre mise à jour:', { id: result.rows[0].id, adresse: result.rows[0].adresse });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Œuvre non trouvée' });
    }

    let savedRow = result.rows[0];
    if (workType === 'evenements' && isEventPast(savedRow)) {
      await pool.query(`UPDATE works SET ticket_mode = 'closed' WHERE id = $1`, [id]);
      savedRow = (await pool.query('SELECT * FROM works WHERE id = $1', [id])).rows[0];
    } else if (workType === 'evenements' && ticket_mode !== undefined) {
      if (ticket_mode === 'open') {
        await replaceTicketSlots(id, ticket_slots || []);
      } else if (ticket_mode === 'closed') {
        await replaceTicketSlots(id, []);
      }
    }

    const work = normalizeWork(savedRow);
    if (workType === 'evenements') {
      work.ticket_slots = await fetchSlotsForWork(id);
    }
    res.json(work);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'œuvre:', error);
    if (error.message?.includes('Capacité invalide')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteWork = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM works WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Œuvre non trouvée' });
    }

    res.json({ message: 'Œuvre supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'œuvre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
