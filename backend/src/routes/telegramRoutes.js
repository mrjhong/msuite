// backend/src/routes/telegramRoutes.js
import express from 'express';
import {
    createTelegramConfig,
    getTelegramConfigs,
    updateTelegramConfig,
    deleteTelegramConfig,
    sendTelegramMessageNow,
    scheduleTelegramMessageController,
    getScheduledTelegramMessagesController,
    cancelScheduledTelegramMessageController,
    getTelegramChatInfoController,
    testTelegramConfig
} from '../controllers/telegramController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configuraciones
router.post('/configs', authMiddleware, createTelegramConfig);
router.get('/configs', authMiddleware, getTelegramConfigs);
router.put('/configs/:id', authMiddleware, updateTelegramConfig);
router.delete('/configs/:id', authMiddleware, deleteTelegramConfig);
router.post('/configs/test', authMiddleware, testTelegramConfig);

// Envío inmediato
router.post('/send-now', authMiddleware, sendTelegramMessageNow);

// Mensajes programados
router.post('/schedule/messages', authMiddleware, scheduleTelegramMessageController);
router.get('/schedule/messages', authMiddleware, getScheduledTelegramMessagesController);
router.delete('/schedule/messages/:id', authMiddleware, cancelScheduledTelegramMessageController);

// Información de chats
router.get('/chat/:chatId', authMiddleware, getTelegramChatInfoController);

export default router;