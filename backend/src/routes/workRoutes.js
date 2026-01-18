import express from 'express';
import {
  getAllWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
} from '../controllers/workController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes publiques
router.get('/', getAllWorks);
router.get('/:id', getWorkById);

// Routes protégées (admin seulement)
router.post('/', authenticateToken, createWork);
router.put('/:id', authenticateToken, updateWork);
router.delete('/:id', authenticateToken, deleteWork);

export default router;
