import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { analyticsLimiter } from '../middleware/rateLimit.js';
import { getSiteVisitStats, recordSiteVisit } from '../controllers/analyticsController.js';

const router = express.Router();

router.post('/visit', analyticsLimiter, recordSiteVisit);
router.get('/stats', authenticateToken, getSiteVisitStats);

export default router;
