import express from 'express';
import {
  changePassword,
  forgotPassword,
  login,
  resetPassword,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLoginLimiter, authResetLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/login', authLoginLimiter, login);
router.post('/forgot-password', authResetLimiter, forgotPassword);
router.post('/reset-password', authResetLimiter, resetPassword);
router.post('/change-password', authenticateToken, changePassword);

export default router;
