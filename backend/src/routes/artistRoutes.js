import express from 'express';
import {
  getArtistInfo,
  updateArtistInfo,
} from '../controllers/artistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Route publique pour récupérer les informations
router.get('/', getArtistInfo);

// Route protégée (admin seulement) pour mettre à jour
router.put('/', authenticateToken, updateArtistInfo);

export default router;
