import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadImageMiddleware } from '../middleware/upload.js';
import { uploadImage } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/image', authenticateToken, (req, res, next) => {
  uploadImageMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Erreur upload' });
    }
    next();
  });
}, uploadImage);

export default router;
