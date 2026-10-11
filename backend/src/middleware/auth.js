import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/security.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Token d'authentification manquant" });
  }

  let secret;
  try {
    secret = getJwtSecret();
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: 'Configuration serveur invalide' });
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
    req.user = user;
    next();
  });
};
