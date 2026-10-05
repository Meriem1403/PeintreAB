import express from 'express';
import {
  getSiteSettings,
  updateSiteSettings,
  getWebsiteQr,
} from '../controllers/siteSettingsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getSiteSettings);
router.get('/website-qr', authenticateToken, getWebsiteQr);
router.put('/', authenticateToken, updateSiteSettings);

export default router;
