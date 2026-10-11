import express from 'express';
import {
  listGalleryCategories,
  createGalleryCategory,
  updateGalleryCategory,
  reorderGalleryCategories,
  deleteGalleryCategory,
} from '../controllers/galleryCategoryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listGalleryCategories);
router.post('/', authenticateToken, createGalleryCategory);
router.put('/reorder', authenticateToken, reorderGalleryCategories);
router.put('/:id', authenticateToken, updateGalleryCategory);
router.delete('/:id', authenticateToken, deleteGalleryCategory);

export default router;
