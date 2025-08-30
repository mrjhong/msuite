// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import syncDB from './src/utils/db.js';
import authRoutes from './src/routes/authRoutes.js';
import messageRoutes from './src/routes/whatsappRoutes.js';
import emailRoutes from './src/routes/emailRoutes.js';
import setupRoutes from './src/routes/setupRoutes.js';
import { initializeSocket } from './src/sockets/whatsappSocket.js';
import { initializeWhatsAppClient } from './src/services/whatsappService.js';
import { restartPendingJobs } from './src/utils/jobs/scheduleWhatsapp.js';
import User from './src/models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import telegramRoutes from './src/routes/telegramRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración inicial
dotenv.config();
const PORT = process.env.PORT || 5000;

// Inicialización de Express
const app = express();
const server = createServer(app);

// Variable global para el estado de WhatsApp
let whatsappClientReady = false;

// Middlewares básicos
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de setup (ANTES que las rutas protegidas)
app.use('/api/setup', setupRoutes);

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', messageRoutes);
app.use('/api/email', emailRoutes); 
app.use('/api/telegram', telegramRoutes);

app.get('/', async (req, res) => {
  try {
    const userCount = await User.count();
    
    if (userCount === 0) {
      return res.redirect('/api/setup');
    }
    
    // Retornar información del estado del sistema
    res.json({
      status: 'Sistema configurado correctamente',
      whatsapp: whatsappClientReady ? 'Conectado' : 'Desconectado',
      users: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al contar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Health check endpoint mejorado
app.get('/health', async (req, res) => {
  try {
    // Verificar base de datos
    const userCount = await User.count();
    
    res.status(200).json({ 
      status: 'healthy',
      database: 'connected',
      whatsapp: whatsappClientReady ? 'ready' : 'not_ready',
      users: userCount,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Inicialización de servicios
const initializeApp = async () => {
  try {
    console.log('🚀 Iniciando aplicación...');
    
    // 1. Sincronizar base de datos
    console.log('📊 Sincronizando base de datos...');
    await syncDB();
    
    // 2. Inicializar Socket.IO (sin cliente WhatsApp aún)
    console.log('🔌 Inicializando Socket.IO...');
    initializeSocket(server);
    
    // 3. Inicializar WhatsApp client (asíncrono)
    console.log('📱 Inicializando cliente WhatsApp...');
    initializeWhatsAppClient()
      .then(() => {
        whatsappClientReady = true;
        console.log('✅ Cliente WhatsApp inicializado correctamente');
        
        // 4. Reiniciar jobs pendientes una vez que WhatsApp esté listo
        return restartPendingJobs();
      })
      .then(() => {
        console.log('📋 Jobs pendientes reiniciados');
      })
      .catch((error) => {
        console.error('❌ Error inicializando WhatsApp:', error);
        whatsappClientReady = false;
        // No fallar la aplicación, WhatsApp puede inicializarse después
      });
    
    // 5. Iniciar servidor
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📱 WhatsApp: ${whatsappClientReady ? 'Inicializado' : 'Inicializando...'}`);
    });
    
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    process.exit(1);
  }
};

// Manejo de señales del sistema para cierre limpio
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n📴 Recibida señal ${signal}. Cerrando aplicación...`);
  
  // Cerrar servidor HTTP
  server.close(() => {
    console.log('🔌 Servidor HTTP cerrado');
  });
  
  // Dar tiempo para que las conexiones se cierren
  setTimeout(() => {
    console.log('👋 Aplicación cerrada');
    process.exit(0);
  }, 5000);
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  // No salir del proceso, solo loggear
});

// Inicializar aplicación
initializeApp();