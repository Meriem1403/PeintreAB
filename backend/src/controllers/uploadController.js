import path from 'path';

const ALLOWED_FOLDERS = new Set(['peintures', 'croquis', 'evenements', 'uploads', 'artist']);

export const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu' });
  }

  const folder = ALLOWED_FOLDERS.has(req.query.folder) ? req.query.folder : 'uploads';
  const url = `/images/${folder}/${path.basename(req.file.filename)}`;

  res.status(201).json({ url });
};
