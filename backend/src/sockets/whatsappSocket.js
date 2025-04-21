import { Server } from 'socket.io';
import { whatsappManager } from '../services/whatsappManager.js';
import jwt from 'jsonwebtoken';
import config from '../../config.js';
import { initializeActionListeners } from '../utils/actionListeners.js';
//import qrcode from 'qrcode-terminal';
// Mapa para almacenar clientes conectados
const connectedClients = new Map();

export const initializeSocket = (server, whatsappClient) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
      skipMiddlewares: false
    }
  });

  //middleware para verificar la autenticación

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('No token provided');
      return next(new Error('NO_TOKEN_PROVIDED')); // Envía un error específico
      
    }
  
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      socket.user = payload;
      next();
    } catch (err) {
      return next(new Error('INVALID_TOKEN')); // Envía un error específico
    }
  });


  // Eventos de conexión
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    connectedClients.set(socket.id, { socket });

    // Manejar inicialización de WhatsApp
    socket.on('initializeWhatsApp', async (userId) => {
      try {
        console.log(`*************Inicializando WhatsApp para el usuario:, ${userId}
          ********************************************
          ********************************************
          ********************************************`);
          
        connectedClients.set(socket.id, { ...connectedClients.get(socket.id), userId });

        // Configurar listeners de WhatsApp
        setupWhatsAppListeners(socket, whatsappClient);

        // Verificar estado actual
        const state = await whatsappClient.getState();
        if (state) {
          socket.emit('ready');
        }
      } catch (error) {
        console.error('Error en initializeWhatsApp:', error);
        socket.emit('error', { message: 'Error al inicializar WhatsApp' });
      }
    });


    socket.on('message_sent', async ({ chatId, message }) => {
      try {
        const client = whatsappManager.getClient('cliente_one');
        if (!client) {
          throw new Error('Cliente de WhatsApp no inicializado');
        }

        const messagesend = await client.sendMessage(chatId, message);
        // mostrar por consola el objeto messagesend
        const bodyMessage = {
          id: messagesend.id._serialized,
          senderId: messagesend.from,
          content: messagesend.body,
          createdAt: messagesend.timestamp * 1000,
        }
        socket.emit('message_received', bodyMessage);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error enviando mensaje' });
      }
    }
    );

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
      connectedClients.delete(socket.id);
    });

    // Manejar errores
    socket.on('error', (error) => {
      console.error('Error en socket:', error);
    });


    whatsappClient.on('message', async (message) => {
      try {
        const msg = message;
        const bodyMessage = {
          id: msg.id._serialized,
          senderId: msg.from,
          content: msg.body,
          createdAt: msg.timestamp * 1000,
        }
        socket.emit('message_received', bodyMessage);
      } catch (error) {
        console.log('Error al recibir mensaje:', error);
      }
    }
    );
  });

  return io;
};

// Configurar listeners de WhatsApp para el socket
const setupWhatsAppListeners = (socket, whatsappClient) => {
  //client.on('qr', qr => qrcode.generate(qr, { small: true }));
  const qrListener = (qr) => {
    console.log('QR recibido');
    socket.emit('qr', qr);
  };

  const readyListener = () => {
    console.log('WhatsApp listo');
    initializeActionListeners(whatsappClient)
    socket.emit('ready');
  };

  const authFailureListener = (error) => {
    console.error(' *Error de autenticación : ', error);
    socket.emit('auth_error', { error: error.message });
  };

  const disconnectedListener = (reason) => {
    console.log('WhatsApp desconectado:', reason);
    socket.emit('disconnected', { reason });
  };

  // Agregar listeners
  whatsappClient.on('qr', qrListener);
  whatsappClient.on('ready', readyListener);
  whatsappClient.on('auth_failure', authFailureListener);
  whatsappClient.on('disconnected', disconnectedListener);

  // Limpiar listeners cuando el socket se desconecta
  socket.on('disconnect', () => {
    whatsappClient.off('qr', qrListener);
    whatsappClient.off('ready', readyListener);
    whatsappClient.off('auth_failure', authFailureListener);
    whatsappClient.off('disconnected', disconnectedListener);
  });
};