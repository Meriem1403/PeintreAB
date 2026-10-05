import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getEventTicketInfo,
  registerForEvent,
  getPublicTicket,
  listVisitors,
  listEventRegistrations,
  inviteOptedInVisitors,
  checkInTicket,
} from '../controllers/eventController.js';

const router = express.Router();

router.get('/tickets/:code', getPublicTicket);

router.post('/admin/tickets/check-in', authenticateToken, checkInTicket);
router.get('/admin/visitors', authenticateToken, listVisitors);
router.get('/admin/:workId/registrations', authenticateToken, listEventRegistrations);
router.post('/admin/:workId/invite-opted-in', authenticateToken, inviteOptedInVisitors);

router.get('/:workId/ticket-info', getEventTicketInfo);
router.post('/:workId/register', registerForEvent);

export default router;
