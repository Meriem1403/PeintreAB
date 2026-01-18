import pool from '../config/database.js';

export const getAllWorks = async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM works';
    const params = [];

    if (type) {
      query += ' WHERE type = $1';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
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

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'œuvre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createWork = async (req, res) => {
  try {
    const { type, titre, description, prix, image, date, lieu, is_sold, is_featured } = req.body;

    if (!type || !titre) {
      return res.status(400).json({ error: 'Type et titre sont requis' });
    }

    const result = await pool.query(
      `INSERT INTO works (type, titre, description, prix, image, date, lieu, is_sold, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        type, 
        titre, 
        description || null, 
        prix || null, 
        image || null, 
        date || null, 
        lieu || null,
        is_sold || false,
        is_featured || false
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création de l\'œuvre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, description, prix, image, date, lieu, is_sold, is_featured } = req.body;

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
      params.push(image || null);
    }
    if (date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      params.push(date || null);
    }
    if (lieu !== undefined) {
      updates.push(`lieu = $${paramIndex++}`);
      params.push(lieu || null);
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

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const whereClause = `WHERE id = $${paramIndex++}`;
    params.push(id);

    const query = `UPDATE works SET ${updates.join(', ')} ${whereClause} RETURNING *`;
    
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Œuvre non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'œuvre:', error);
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
