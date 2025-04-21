import jwt from 'jsonwebtoken';
import config from '../../config.js';

export const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // Añade el payload del token (incluyendo userId) a la solicitud
    //verificar que no tenga mas de 10 horas
    const now = new Date().getTime() / 1000;
    if (decoded.exp < now) {
      return res.status(401).json({ error: 'Token expirado' });
    }

    console.log('Usuario autenticado:', decoded);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};