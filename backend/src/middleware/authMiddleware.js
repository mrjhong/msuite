import jwt from 'jsonwebtoken';
import config from '../../config.js';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Verificar si el sistema necesita configuración inicial
    const userCount = await User.count();
    if (userCount === 0) {
      return res.status(503).json({ 
        error: 'Sistema no configurado',
        message: 'El sistema requiere configuración inicial',
        setupRequired: true,
        setupUrl: '/setup'
      });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Verificar que no tenga más de 10 horas
    const now = new Date().getTime() / 1000;
    if (decoded.exp < now) {
      return res.status(401).json({ error: 'Token expirado' });
    }

    // Verificar que el usuario aún existe
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    req.user = decoded;
    req.user.email = user.email;
    
    console.log('Usuario autenticado:', decoded);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    console.error('Error en authMiddleware:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};