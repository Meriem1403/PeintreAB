import express from 'express';
import {
  createContact,
  getAllContacts,
  markContactAsRead,
  replyContact,
  deleteContact,
} from '../controllers/contactController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Route publique pour envoyer un message
router.post('/', createContact);

// Routes protégées (admin seulement)
router.get('/', authenticateToken, getAllContacts);
router.put('/:id/read', authenticateToken, markContactAsRead);
router.post('/:id/reply', authenticateToken, replyContact);
router.delete('/:id', authenticateToken, deleteContact);

export default router;
