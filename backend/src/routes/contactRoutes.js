import express from 'express';
import {
  createContact,
  getAllContacts,
  markContactAsRead,
} from '../controllers/contactController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Route publique pour envoyer un message
router.post('/', createContact);

// Routes protégées (admin seulement)
router.get('/', authenticateToken, getAllContacts);
router.put('/:id/read', authenticateToken, markContactAsRead);

export default router;
