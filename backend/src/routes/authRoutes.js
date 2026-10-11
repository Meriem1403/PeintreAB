import express from 'express';
import { forgotPassword, login, resetPassword } from '../controllers/authController.js';
import { authLoginLimiter, authResetLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/login', authLoginLimiter, login);
router.post('/forgot-password', authResetLimiter, forgotPassword);
router.post('/reset-password', authResetLimiter, resetPassword);

export default router;
