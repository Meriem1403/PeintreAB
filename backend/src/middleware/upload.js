import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imageDirCandidates = [
  path.resolve(__dirname, '../../public/images'),
  path.resolve(__dirname, '../../../public/images'),
];
const IMAGES_ROOT =
  imageDirCandidates.find((dir) => fs.existsSync(path.dirname(dir))) ||
  imageDirCandidates[0];

const FIXED_FOLDERS = new Set(['peintures', 'croquis', 'evenements', 'uploads', 'artist']);

const sanitizeFolder = (raw) => {
  const folder = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 48);
  if (!folder) return 'uploads';
  if (FIXED_FOLDERS.has(folder) || /^[a-z0-9][a-z0-9-]{0,47}$/.test(folder)) {
    return folder;
  }
  return 'uploads';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = sanitizeFolder(req.query.folder);
    const dest = path.join(IMAGES_ROOT, folder);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 48) || 'image';
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'));
  }
};

export const uploadImageMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');
