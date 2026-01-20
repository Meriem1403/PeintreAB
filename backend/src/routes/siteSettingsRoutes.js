import express from 'express';
import {
  getSiteSettings,
  updateSiteSettings,
} from '../controllers/siteSettingsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getSiteSettings);
router.put('/', authenticateToken, updateSiteSettings);

export default router;
