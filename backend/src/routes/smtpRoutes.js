import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  tokenCompleteLimiter,
  tokenValidateLimiter,
} from '../middleware/rateLimit.js';
import {
  completeSmtpSetup,
  createSmtpSetupLink,
  getSmtpStatus,
  updateSmtpSettings,
  validateSmtpSetupToken,
} from '../controllers/smtpController.js';

const router = express.Router();

router.get('/status', authenticateToken, getSmtpStatus);
router.put('/', authenticateToken, updateSmtpSettings);
router.post('/setup-link', authenticateToken, createSmtpSetupLink);

router.get('/setup/:token', tokenValidateLimiter, validateSmtpSetupToken);
router.post('/setup/:token', tokenCompleteLimiter, completeSmtpSetup);

export default router;
