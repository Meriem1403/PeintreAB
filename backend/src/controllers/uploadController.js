import path from 'path';

const sanitizeFolder = (raw) => {
  const folder = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 48);
  return folder || 'uploads';
};

export const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu' });
  }

  const folder = sanitizeFolder(req.query.folder);
  const url = `/images/${folder}/${path.basename(req.file.filename)}`;

  res.status(201).json({ url });
};
