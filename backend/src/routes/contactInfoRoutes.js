import express from 'express';
import {
  getContactInfo,
  updateContactInfo,
} from '../controllers/contactInfoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Route publique pour récupérer les informations
router.get('/', getContactInfo);

// Route protégée (admin seulement) pour mettre à jour
router.put('/', authenticateToken, updateContactInfo);

export default router;
