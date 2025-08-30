// backend/src/middleware/authMiddleware.js - Mejorado
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

    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de acceso requerido',
        message: 'Debes proporcionar un token de autorización válido'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Verificar que el usuario aún existe
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(401).json({ 
          error: 'Usuario no válido',
          message: 'El usuario asociado al token no existe'
        });
      }

      req.user = decoded;
      req.user.email = user.email;
      
      console.log('✅ Usuario autenticado:', decoded);
      next();
      
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Token inválido',
          message: 'El token de autorización no es válido'
        });
      } else {
        throw jwtError;
      }
    }
    
  } catch (error) {
    console.error('❌ Error en authMiddleware:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Error en el sistema de autenticación'
    });
  }
};