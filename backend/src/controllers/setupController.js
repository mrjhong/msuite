// backend/src/controllers/setupController.js
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const showSetupPage = async (req, res) => {
  try {
    // Verificar si ya existe al menos un usuario
    const userCount = await User.count();
    
    if (userCount > 0) {
      // Si ya hay usuarios, mostrar página de "no autorizado"
      const notFoundHtml = fs.readFileSync(
        path.join(__dirname, '../views/not-found.html'), 
        'utf8'
      );
      return res.status(404).send(notFoundHtml);
    }

    // Si no hay usuarios, mostrar formulario de setup
    const setupHtml = fs.readFileSync(
      path.join(__dirname, '../views/setup.html'), 
      'utf8'
    );
    res.send(setupHtml);
  } catch (error) {
    console.error('Error en showSetupPage:', error);
    res.status(500).send('<h1>Error interno del servidor</h1>');
  }
};

export const createFirstUser = async (req, res) => {
  try {
    // Verificar si ya existe al menos un usuario
    const userCount = await User.count();
    
    if (userCount > 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Ya existe un usuario en el sistema. No se pueden crear más usuarios.' 
      });
    }

    const { email, password, confirmPassword } = req.body;

    // Validaciones
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son obligatorios'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Las contraseñas no coinciden'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'El formato del email no es válido'
      });
    }

    // Crear el usuario
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ 
      email: email.toLowerCase().trim(), 
      password: hashedPassword 
    });

    console.log(`✅ Usuario administrador creado: ${email}`);
    
    res.json({
      success: true,
      message: 'Usuario creado exitosamente. Ya puedes acceder al sistema.',
      redirectUrl: '/'
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Este email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const checkSetupStatus = async (req, res) => {
  try {
    const userCount = await User.count();
    res.json({
      setupRequired: userCount === 0,
      userCount
    });
  } catch (error) {
    console.error('Error checking setup status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};