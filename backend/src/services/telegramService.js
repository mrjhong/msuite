// backend/src/services/telegramService.js
import TelegramBot from 'node-telegram-bot-api';
import ScheduledTelegramMessage from '../models/ScheduledTelegramMessage.js';
import TelegramConfig from '../models/TelegramConfig.js';

class TelegramManager {
    constructor() {
        this.bots = new Map(); // Mapa de bots por configuración
        this.defaultBot = null;
        this.isInitialized = false;
    }

    async initializeBot(configId = null) {
        try {
            let config;
            
            if (configId) {
                config = await TelegramConfig.findByPk(configId);
            } else {
                config = await TelegramConfig.findOne({ where: { isDefault: true } });
            }

            if (!config) {
                throw new Error('No se encontró configuración de Telegram');
            }

            const botKey = configId || 'default';
            
            // Si el bot ya existe, devolverlo
            if (this.bots.has(botKey)) {
                return this.bots.get(botKey);
            }

            const bot = new TelegramBot(config.botToken, { 
                polling: {
                    interval: 1000,
                    autoStart: true,
                    params: {
                        timeout: 10
                    }
                }
            });

            // Configurar eventos básicos
            this._setupBotEvents(bot, config);

            this.bots.set(botKey, { bot, config });

            if (!configId || config.isDefault) {
                this.defaultBot = bot;
            }

            console.log(`✅ Bot de Telegram inicializado: ${config.name}`);
            return bot;

        } catch (error) {
            console.error('❌ Error inicializando bot de Telegram:', error);
            throw error;
        }
    }

    _setupBotEvents(bot, config) {
        bot.on('message', (msg) => {
            console.log(`📨 Mensaje recibido en bot ${config.name}:`, msg.text);
            // Aquí puedes agregar lógica para respuestas automáticas
        });

        bot.on('error', (error) => {
            console.error(`❌ Error en bot ${config.name}:`, error);
        });

        bot.on('polling_error', (error) => {
            console.error(`❌ Error de polling en bot ${config.name}:`, error);
        });
    }

    async sendMessage(chatId, message, configId = null) {
        try {
            const botKey = configId || 'default';
            const botData = this.bots.get(botKey);

            if (!botData) {
                throw new Error(`Bot no encontrado para configuración: ${botKey}`);
            }

            const result = await botData.bot.sendMessage(chatId, message, {
                parse_mode: 'HTML'
            });

            console.log(`✅ Mensaje enviado via Telegram a ${chatId}`);
            return result;

        } catch (error) {
            console.error(`❌ Error enviando mensaje de Telegram:`, error);
            throw error;
        }
    }

    async sendPhoto(chatId, photo, caption = '', configId = null) {
        try {
            const botKey = configId || 'default';
            const botData = this.bots.get(botKey);

            if (!botData) {
                throw new Error(`Bot no encontrado para configuración: ${botKey}`);
            }

            const result = await botData.bot.sendPhoto(chatId, photo, {
                caption: caption,
                parse_mode: 'HTML'
            });

            console.log(`✅ Foto enviada via Telegram a ${chatId}`);
            return result;

        } catch (error) {
            console.error(`❌ Error enviando foto de Telegram:`, error);
            throw error;
        }
    }

    async sendDocument(chatId, document, caption = '', configId = null) {
        try {
            const botKey = configId || 'default';
            const botData = this.bots.get(botKey);

            if (!botData) {
                throw new Error(`Bot no encontrado para configuración: ${botKey}`);
            }

            const result = await botData.bot.sendDocument(chatId, document, {
                caption: caption,
                parse_mode: 'HTML'
            });

            console.log(`✅ Documento enviado via Telegram a ${chatId}`);
            return result;

        } catch (error) {
            console.error(`❌ Error enviando documento de Telegram:`, error);
            throw error;
        }
    }

    async getChatInfo(chatId, configId = null) {
        try {
            const botKey = configId || 'default';
            const botData = this.bots.get(botKey);

            if (!botData) {
                throw new Error(`Bot no encontrado para configuración: ${botKey}`);
            }

            const chat = await botData.bot.getChat(chatId);
            return chat;

        } catch (error) {
            console.error(`❌ Error obteniendo info del chat:`, error);
            throw error;
        }
    }

    async getChatMembers(chatId, configId = null) {
        try {
            const botKey = configId || 'default';
            const botData = this.bots.get(botKey);

            if (!botData) {
                throw new Error(`Bot no encontrado para configuración: ${botKey}`);
            }

            const count = await botData.bot.getChatMemberCount(chatId);
            return { memberCount: count };

        } catch (error) {
            console.error(`❌ Error obteniendo miembros del chat:`, error);
            throw error;
        }
    }

    getBot(configId = null) {
        const botKey = configId || 'default';
        const botData = this.bots.get(botKey);
        return botData ? botData.bot : null;
    }

    getAllBots() {
        return Array.from(this.bots.values()).map(({ bot, config }) => ({
            bot,
            config: {
                id: config.id,
                name: config.name,
                isDefault: config.isDefault
            }
        }));
    }

    async stopBot(configId = null) {
        const botKey = configId || 'default';
        const botData = this.bots.get(botKey);
        
        if (botData) {
            await botData.bot.stopPolling();
            this.bots.delete(botKey);
            console.log(`🛑 Bot de Telegram detenido: ${botData.config.name}`);
        }
    }

    async stopAllBots() {
        for (const [key, { bot, config }] of this.bots) {
            await bot.stopPolling();
            console.log(`🛑 Bot detenido: ${config.name}`);
        }
        this.bots.clear();
        this.defaultBot = null;
    }
}

// Instancia única
export const telegramManager = new TelegramManager();

// Funciones de servicio
export const initializeTelegramBot = async (configId = null) => {
    return await telegramManager.initializeBot(configId);
};

export const sendTelegramMessage = async (chatId, message, configId = null) => {
    return await telegramManager.sendMessage(chatId, message, configId);
};

export const sendTelegramPhoto = async (chatId, photo, caption = '', configId = null) => {
    return await telegramManager.sendPhoto(chatId, photo, caption, configId);
};

export const sendTelegramDocument = async (chatId, document, caption = '', configId = null) => {
    return await telegramManager.sendDocument(chatId, document, caption, configId);
};

export const scheduleTelegramMessage = async (userId, chatIds, message, scheduledTime, repeat = 'none', customDays = null, configId = null) => {
    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate < new Date()) {
        throw new Error('La fecha programada debe ser en el futuro');
    }

    // Crear en base de datos
    const scheduledMessage = await ScheduledTelegramMessage.create({
        userId,
        chatIds,
        message,
        scheduledTime: scheduledDate,
        repeat,
        customDays,
        configId,
        status: 'pending'
    });

    // Programar el mensaje
    const scheduleJob = async (executionTime) => {
        const delay = executionTime - Date.now();
        
        const timeout = setTimeout(async () => {
            try {
                // Enviar mensajes a todos los chats
                await Promise.allSettled(
                    chatIds.map(chatId => sendTelegramMessage(chatId, message, configId))
                );
                
                // Actualizar estado
                await scheduledMessage.update({ status: 'sent' });
                console.log(`✅ Mensaje programado de Telegram enviado: ${scheduledMessage.id}`);
                
                // Programar siguiente ejecución si es recurrente
                if (repeat !== 'none') {
                    const nextExecution = getNextExecution(executionTime, repeat, customDays);
                    if (nextExecution) scheduleJob(nextExecution);
                }
            } catch (error) {
                await scheduledMessage.update({ status: 'error' });
                console.error('❌ Error enviando mensaje programado de Telegram:', error);
            }
        }, delay);

        return timeout;
    };

    await scheduleJob(scheduledDate.getTime());
    return scheduledMessage;
};

export const getScheduledTelegramMessages = async (userId) => {
    return await ScheduledTelegramMessage.findAll({
        where: { 
            userId,
            status: 'pending'
        },
        order: [['scheduledTime', 'ASC']]
    });
};

export const cancelScheduledTelegramMessage = async (userId, messageId) => {
    const message = await ScheduledTelegramMessage.findOne({
        where: {
            id: messageId,
            userId
        }
    });

    if (!message) {
        throw new Error('Mensaje no encontrado');
    }

    await message.update({ status: 'cancelled' });
    return message;
};

export const getTelegramChatInfo = async (chatId, configId = null) => {
    return await telegramManager.getChatInfo(chatId, configId);
};

export const getTelegramChatMembers = async (chatId, configId = null) => {
    return await telegramManager.getChatMembers(chatId, configId);
};

// Helper para calcular próxima ejecución
const getNextExecution = (lastExecution, repeat, customDays) => {
    const date = new Date(lastExecution);
    
    switch(repeat) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'custom':
            date.setDate(date.getDate() + parseInt(customDays));
            break;
        default:
            return null;
    }
    
    return date.getTime();
};

export default telegramManager;