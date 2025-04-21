import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import syncDB from './src/utils/db.js';
import authRoutes from './src/routes/authRoutes.js';
import messageRoutes from './src/routes/whatsappRoutes.js';
import emailRoutes from './src/routes/emailRoutes.js';
import { initializeSocket } from './src/sockets/whatsappSocket.js';
import { initializeWhatsAppClient } from './src/services/whatsappService.js';
import { restartPendingJobs } from './src/utils/jobs/scheduleWhatsapp.js';

// Configuración inicial
dotenv.config();
const PORT = process.env.PORT || 5000;

// Inicialización de Express
const app = express();
const server = createServer(app);

// Middlewares básicos
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Configurable por entorno
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', messageRoutes);
app.use('/api/email', emailRoutes); 

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Inicialización de servicios
const initializeApp = async () => {
  try {
    // Sincronizar base de datos
    await syncDB();
    
    // Inicializar WhatsApp client
    const whatsappClient = initializeWhatsAppClient();
    
    // Inicializar Socket.IO
    initializeSocket(server, whatsappClient);
    
    // Reiniciar jobs pendientes
    await restartPendingJobs();
    
    // Iniciar servidor
    server.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    process.exit(1);
  }
};

initializeApp();