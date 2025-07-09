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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

// Middleware para servir archivos estáticos (las vistas HTML)
//app.use(express.static('src/views'));

// Rutas de setup (ANTES que las rutas protegidas)
app.use('/setup', setupRoutes);

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', messageRoutes);
app.use('/api/email', emailRoutes); 


app.get('/', async (req, res) => {
  try {
    const userCount = await User.count();
    
    if (userCount === 0) {
      // Si no hay usuarios, redirigir al setup
      return res.redirect('/setup');
    }
    // const success = fs.readFileSync(
    //         path.join(__dirname, './src/views/success.html'), 
    //         'utf8'
    //       );
    // return res.status(404).send(success);
          
  } catch (error) {
    console.error('Error al contar usuarios:', error);
    res.status(500).send('Error interno del servidor');
  }
});

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