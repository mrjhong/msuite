// backend/src/controllers/telegramController.js
import TelegramConfig from '../models/TelegramConfig.js';
import { ScheduledTelegramMessage } from '../models/ScheduledTelegramMessage.js';
import {
    initializeTelegramBot,
    sendTelegramMessage,
    sendTelegramPhoto,
    sendTelegramDocument,
    scheduleTelegramMessage,
    getScheduledTelegramMessages,
    cancelScheduledTelegramMessage,
    getTelegramChatInfo,
    telegramManager
} from '../services/telegramService.js';

// Configuraciones de Telegram
export const createTelegramConfig = async (req, res) => {
    try {
        const { name, botToken, botUsername, description, isDefault } = req.body;
        
        // Si es configuración por defecto, desactivar otras
        if (isDefault) {
            await TelegramConfig.update(
                { isDefault: false },
                { where: { userId: req.user.userId } }
            );
        }

        const config = await TelegramConfig.create({
            name,
            botToken,
            botUsername,
            description,
            isDefault,
            userId: req.user.userId
        });

        // Inicializar bot si es la configuración por defecto
        if (isDefault) {
            try {
                await initializeTelegramBot(config.id);
            } catch (error) {
                console.error('Error inicializando bot:', error);
                // No fallar la creación, pero marcar como inactivo
                await config.update({ isActive: false });
            }
        }

        res.status(201).json({
            success: true,
            data: {
                id: config.id,
                name: config.name,
                botUsername: config.botUsername,
                description: config.description,
                isDefault: config.isDefault,
                isActive: config.isActive
            }
        });
    } catch (error) {
        console.error('Error creating Telegram config:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando configuración de Telegram'
        });
    }
};

export const getTelegramConfigs = async (req, res) => {
    try {
        const configs = await TelegramConfig.findAll({
            where: { userId: req.user.userId },
            attributes: ['id', 'name', 'botUsername', 'description', 'isDefault', 'isActive', 'createdAt'],
            order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: configs
        });
    } catch (error) {
        console.error('Error fetching Telegram configs:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo configuraciones de Telegram'
        });
    }
};

export const updateTelegramConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, botToken, botUsername, description, isDefault } = req.body;

        const config = await TelegramConfig.findOne({
            where: { id, userId: req.user.userId }
        });

        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Configuración no encontrada'
            });
        }

        // Si se marca como default, desactivar otras
        if (isDefault && !config.isDefault) {
            await TelegramConfig.update(
                { isDefault: false },
                { where: { userId: req.user.userId } }
            );
        }

        await config.update({
            name,
            botToken,
            botUsername,
            description,
            isDefault
        });

        res.json({
            success: true,
            data: {
                id: config.id,
                name: config.name,
                botUsername: config.botUsername,
                description: config.description,
                isDefault: config.isDefault,
                isActive: config.isActive
            }
        });
    } catch (error) {
        console.error('Error updating Telegram config:', error);
        res.status(500).json({
            success: false,
            error: 'Error actualizando configuración de Telegram'
        });
    }
};

export const deleteTelegramConfig = async (req, res) => {
    try {
        const { id } = req.params;

        const config = await TelegramConfig.findOne({
            where: { id, userId: req.user.userId }
        });

        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Configuración no encontrada'
            });
        }

        // Detener bot si está activo
        try {
            await telegramManager.stopBot(id);
        } catch (error) {
            console.warn('Error deteniendo bot:', error);
        }

        await config.destroy();

        res.json({
            success: true,
            message: 'Configuración eliminada correctamente'
        });
    } catch (error) {
        console.error('Error deleting Telegram config:', error);
        res.status(500).json({
            success: false,
            error: 'Error eliminando configuración de Telegram'
        });
    }
};

// Envío de mensajes
export const sendTelegramMessageNow = async (req, res) => {
    try {
        const { chatIds, message, messageType = 'text', mediaUrl, configId } = req.body;

        if (!chatIds || chatIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Debe especificar al menos un chat'
            });
        }

        const results = [];

        for (const chatId of chatIds) {
            try {
                let result;
                
                switch (messageType) {
                    case 'photo':
                        result = await sendTelegramPhoto(chatId, mediaUrl, message, configId);
                        break;
                    case 'document':
                        result = await sendTelegramDocument(chatId, mediaUrl, message, configId);
                        break;
                    default:
                        result = await sendTelegramMessage(chatId, message, configId);
                }

                results.push({
                    chatId,
                    success: true,
                    messageId: result.message_id
                });
            } catch (error) {
                results.push({
                    chatId,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Mensajes procesados',
            results
        });
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        res.status(500).json({
            success: false,
            error: 'Error enviando mensaje de Telegram'
        });
    }
};

// Programación de mensajes
export const scheduleTelegramMessageController = async (req, res) => {
    try {
        const { userId } = req.user;
        const {
            chatIds,
            message,
            scheduledTime,
            repeat,
            customDays,
            messageType = 'text',
            mediaUrl,
            configId
        } = req.body;

        const scheduled = await scheduleTelegramMessage(
            userId,
            chatIds,
            message,
            new Date(scheduledTime),
            repeat,
            customDays,
            configId
        );

        res.json({
            success: true,
            message: 'Mensaje de Telegram programado correctamente',
            data: scheduled
        });
    } catch (error) {
        console.error('Error scheduling Telegram message:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getScheduledTelegramMessagesController = async (req, res) => {
    try {
        const { userId } = req.user;
        
        const messages = await getScheduledTelegramMessages(userId);
        
        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching scheduled Telegram messages:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const cancelScheduledTelegramMessageController = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        
        await cancelScheduledTelegramMessage(userId, id);
        
        res.json({
            success: true,
            message: 'Mensaje de Telegram cancelado correctamente'
        });
    } catch (error) {
        console.error('Error canceling scheduled Telegram message:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Información de chats
export const getTelegramChatInfoController = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { configId } = req.query;

        const chatInfo = await getTelegramChatInfo(chatId, configId);

        res.json({
            success: true,
            data: chatInfo
        });
    } catch (error) {
        console.error('Error getting Telegram chat info:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo información del chat'
        });
    }
};

// Test de configuración
export const testTelegramConfig = async (req, res) => {
    try {
        const { configId, testChatId } = req.body;

        if (!testChatId) {
            return res.status(400).json({
                success: false,
                error: 'Chat ID de prueba requerido'
            });
        }

        const testMessage = `🤖 Mensaje de prueba de configuración\n\n` +
                           `Fecha: ${new Date().toLocaleString()}\n` +
                           `Sistema: Telegram Mass`;

        await sendTelegramMessage(testChatId, testMessage, configId);

        res.json({
            success: true,
            message: 'Mensaje de prueba enviado correctamente'
        });
    } catch (error) {
        console.error('Error testing Telegram config:', error);
        res.status(500).json({
            success: false,
            error: 'Error enviando mensaje de prueba: ' + error.message
        });
    }
};