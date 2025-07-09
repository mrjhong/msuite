import { Server } from 'socket.io';
import whatsappManager from '../services/whatsappManager.js';
import jwt from 'jsonwebtoken';
import config from '../../config.js';
import { initializeActionListeners } from '../utils/actionListeners.js';

// Mapa para almacenar sockets conectados
const connectedSockets = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false
    }
  });

  // Middleware de autenticación
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('❌ No token provided');
      return next(new Error('NO_TOKEN_PROVIDED'));
    }
  
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      socket.user = payload;
      next();
    } catch (err) {
      console.log('❌ Invalid token');
      return next(new Error('INVALID_TOKEN'));
    }
  });

  // Configurar listeners de WhatsApp una sola vez
  setupWhatsAppGlobalListeners();

  io.on('connection', (socket) => {
    console.log(`✅ Socket conectado: ${socket.id} (Usuario: ${socket.user.userId})`);
    connectedSockets.set(socket.id, { socket, user: socket.user });

    // Manejar inicialización de WhatsApp
    socket.on('initializeWhatsApp', async (userId) => {
      try {
        console.log(`🚀 Inicializando WhatsApp para usuario: ${userId}`);
        
        // Usar el cliente único
        const client = await whatsappManager.initializeClient();
        
        // Verificar estado actual
        if (whatsappManager.isClientReady()) {
          socket.emit('ready');
        } else {
          const state = await whatsappManager.getState();
          if (state === 'CONNECTED') {
            socket.emit('ready');
          }
        }
      } catch (error) {
        console.error('❌ Error en initializeWhatsApp:', error);
        socket.emit('error', { message: 'Error al inicializar WhatsApp' });
      }
    });

    // Manejar envío de mensajes
    socket.on('message_sent', async ({ chatId, message }) => {
      try {
        if (!whatsappManager.isClientReady()) {
          throw new Error('Cliente de WhatsApp no inicializado');
        }

        const sentMessage = await whatsappManager.sendMessage(chatId, message);
        
        const messageData = {
          id: sentMessage.id._serialized,
          senderId: sentMessage.from,
          content: sentMessage.body,
          createdAt: sentMessage.timestamp * 1000,
        };
        
        socket.emit('message_received', messageData);
      } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error enviando mensaje: ' + error.message });
      }
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log(`❌ Socket desconectado: ${socket.id}`);
      connectedSockets.delete(socket.id);
    });

    socket.on('error', (error) => {
      console.error(`❌ Error en socket ${socket.id}:`, error);
    });
  });

  return io;
};

// Configurar listeners globales de WhatsApp (una sola vez)
const setupWhatsAppGlobalListeners = () => {
  // QR Code
  whatsappManager.addListener('qr', 'socket_qr', (qr) => {
    console.log('📱 QR Code generado, enviando a todos los sockets');
    broadcastToAllSockets('qr', qr);
  });

  // Cliente listo
  whatsappManager.addListener('ready', 'socket_ready', () => {
    console.log('✅ WhatsApp listo, notificando a todos los sockets');
    broadcastToAllSockets('ready');
    
    // Inicializar listeners de acciones
    const client = whatsappManager.getClient();
    if (client) {
      initializeActionListeners(client);
    }
  });

  // Error de autenticación
  whatsappManager.addListener('auth_failure', 'socket_auth_error', (error) => {
    console.error('❌ Error de autenticación WhatsApp:', error);
    broadcastToAllSockets('auth_error', { error: error.message });
  });

  // Desconexión
  whatsappManager.addListener('disconnected', 'socket_disconnected', (reason) => {
    console.log('📱 WhatsApp desconectado:', reason);
    broadcastToAllSockets('disconnected', { reason });
  });

  // Mensajes entrantes
  whatsappManager.addListener('message', 'socket_message', (message) => {
    try {
      const messageData = {
        id: message.id._serialized,
        senderId: message.from,
        content: message.body,
        createdAt: message.timestamp * 1000,
      };
      
      broadcastToAllSockets('message_received', messageData);
    } catch (error) {
      console.error('❌ Error procesando mensaje entrante:', error);
    }
  });
};

// Función para enviar mensajes a todos los sockets conectados
const broadcastToAllSockets = (event, data = null) => {
  connectedSockets.forEach(({ socket }) => {
    try {
      socket.emit(event, data);
    } catch (error) {
      console.error(`❌ Error enviando ${event} a socket ${socket.id}:`, error);
    }
  });
};

// Función para obtener sockets conectados (útil para debugging)
export const getConnectedSocketsCount = () => {
  return connectedSockets.size;
};

// Función para enviar mensaje a un usuario específico
export const sendToUser = (userId, event, data) => {
  connectedSockets.forEach(({ socket, user }) => {
    if (user.userId === userId) {
      socket.emit(event, data);
    }
  });
};