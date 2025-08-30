// backend/src/routes/whatsappRoutes.js
import express from 'express';
import {
    sendMessageNow, 
    sendMessageWithFile,
    scheduleMessage, 
    getContacts, 
    scheduleAction,
    getScheduledMessages, 
    cancelScheduledMessage,
    getScheduledActions,
    cancelScheduledAction,
    getChatHistory,
    uploadMiddleware
} from '../controllers/whatsappController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Envío inmediato
router.post('/send-now', authMiddleware, sendMessageNow);

// Envío con archivo
router.post('/send-with-file', authMiddleware, uploadMiddleware, sendMessageWithFile);

// Mensajes programados
router.post('/schedule/messages', authMiddleware, scheduleMessage);
router.get('/schedule/messages', authMiddleware, getScheduledMessages);
router.delete('/schedule/messages/:id', authMiddleware, cancelScheduledMessage);

// Acciones programadas
router.post('/schedule/actions', authMiddleware, scheduleAction);
router.get('/schedule/actions', authMiddleware, getScheduledActions);
router.delete('/schedule/actions/:id', authMiddleware, cancelScheduledAction);

// Contactos y grupos
router.get('/contacts', authMiddleware, getContacts);

// Historial de chat
router.post('/chats/getchat', authMiddleware, getChatHistory);

export default router;