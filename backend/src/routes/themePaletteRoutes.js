import express from 'express';
import {
  listThemePresets,
  createThemePreset,
  deleteThemePreset,
  listThemeHistory,
  deleteThemeHistoryEntry,
  clearThemeHistory,
} from '../controllers/themePaletteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/presets', listThemePresets);
router.post('/presets', createThemePreset);
router.delete('/presets/:id', deleteThemePreset);

router.get('/history', listThemeHistory);
router.delete('/history', clearThemeHistory);
router.delete('/history/:id', deleteThemeHistoryEntry);

export default router;
