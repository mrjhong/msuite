// backend/src/middleware/setupMiddleware.js
import User from '../models/User.js';

export const setupMiddleware = async (req, res, next) => {
  try {
    // Solo en desarrollo o si está explícitamente habilitado
    const isSetupEnabled = process.env.ALLOW_SETUP === 'true' || process.env.NODE_ENV !== 'production';
    
    if (!isSetupEnabled) {
      return res.status(404).send('<h1>404 - Página no encontrada</h1>');
    }

    // Verificar si ya existe al menos un usuario
    const userCount = await User.count();
    
    // Si es una petición POST y ya hay usuarios, denegar
    if (req.method === 'POST' && userCount > 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Configuración no disponible' 
      });
    }

    // Para rutas GET, permitir continuar (el controller manejará la lógica)
    next();
  } catch (error) {
    console.error('Error en setupMiddleware:', error);
    res.status(500).send('<h1>Error interno del servidor</h1>');
  }
};