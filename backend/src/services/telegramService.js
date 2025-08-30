// backend/src/services/telegramService.js
import TelegramBot from 'node-telegram-bot-api';
import { ScheduledTelegramMessage } from '../models/ScheduledTelegramMessage.js';
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

            console.log(`🤖 Inicializando bot de Telegram: ${config.name}`);
            
            const bot = new TelegramBot(config.botToken, { 
                polling: false // Deshabilitamos polling por defecto para evitar conflictos
            });

            // Verificar que el bot sea válido
            try {
                const me = await bot.getMe();
                console.log(`✅ Bot verificado: @${me.username} (${me.first_name})`);
                
                // Actualizar username si no estaba guardado
                if (!config.botUsername && me.username) {
                    await config.update({ botUsername: `@${me.username}` });
                }
            } catch (error) {
                throw new Error(`Bot token inválido o bot no accesible: ${error.message}`);
            }

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

    async sendMessage(chatId, message, configId = null) {
        try {
            const botKey = configId || 'default';
            let botData = this.bots.get(botKey);

            // Si no existe el bot, intentar inicializarlo
            if (!botData) {
                await this.initializeBot(configId);
                botData = this.bots.get(botKey);
            }

            if (!botData) {
                throw new Error(`Bot no encontrado para configuración: ${botKey}`);
            }

            // Limpiar el mensaje de caracteres no válidos
            const cleanMessage = message.replace(/[\u{10000}-\u{10FFFF}]/gu, ''); // Remover emojis complejos si causan problemas

            const result = await botData.bot.sendMessage(chatId, cleanMessage, {
                parse_mode: 'HTML'
            });

            console.log(`✅ Mensaje enviado via Telegram a ${chatId}`);
            return result;

        } catch (error) {
            console.error(`❌ Error enviando mensaje de Telegram:`, error);
            
            // Manejar errores específicos de Telegram
            if (error.code === 'ETELEGRAM') {
                const telegramError = error.response?.body?.description || error.message;
                throw new Error(`Error de Telegram: ${telegramError}`);
            }
            
            throw error;
        }
    }

    async sendPhoto(chatId, photo, caption = '', configId = null) {
        try {
            const botKey = configId || 'default';
            let botData = this.bots.get(botKey);

            if (!botData) {
                await this.initializeBot(configId);
                botData = this.bots.get(botKey);
            }

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
            
            if (error.code === 'ETELEGRAM') {
                const telegramError = error.response?.body?.description || error.message;
                throw new Error(`Error de Telegram: ${telegramError}`);
            }
            
            throw error;
        }
    }

    async sendDocument(chatId, document, caption = '', configId = null) {
        try {
            const botKey = configId || 'default';
            let botData = this.bots.get(botKey);

            if (!botData) {
                await this.initializeBot(configId);
                botData = this.bots.get(botKey);
            }

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
            
            if (error.code === 'ETELEGRAM') {
                const telegramError = error.response?.body?.description || error.message;
                throw new Error(`Error de Telegram: ${telegramError}`);
            }
            
            throw error;
        }
    }

    async getChatInfo(chatId, configId = null) {
        try {
            const botKey = configId || 'default';
            let botData = this.bots.get(botKey);

            if (!botData) {
                await this.initializeBot(configId);
                botData = this.bots.get(botKey);
            }

            if (!botData) {
                throw new Error(`Bot no encontrado para configuración: ${botKey}`);
            }

            const chat = await botData.bot.getChat(chatId);
            return chat;

        } catch (error) {
            console.error(`❌ Error obteniendo info del chat:`, error);
            
            if (error.code === 'ETELEGRAM') {
                const telegramError = error.response?.body?.description || error.message;
                throw new Error(`Error de Telegram: ${telegramError}`);
            }
            
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
            try {
                // Detener polling si estaba habilitado
                if (botData.bot.isPolling()) {
                    await botData.bot.stopPolling();
                }
            } catch (error) {
                console.warn('⚠️ Error deteniendo polling:', error);
            }
            
            this.bots.delete(botKey);
            console.log(`🛑 Bot de Telegram detenido: ${botData.config.name}`);
        }
    }

    async stopAllBots() {
        for (const [key, { bot, config }] of this.bots) {
            try {
                if (bot.isPolling()) {
                    await bot.stopPolling();
                }
            } catch (error) {
                console.warn(`⚠️ Error deteniendo bot ${config.name}:`, error);
            }
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
        
        if (delay <= 0) {
            // Ejecutar inmediatamente si la fecha ya pasó
            console.log(`⚡ Ejecutando mensaje programado inmediatamente: ${scheduledMessage.id}`);
            await executeScheduledMessage(scheduledMessage);
            return;
        }
        
        const timeout = setTimeout(async () => {
            await executeScheduledMessage(scheduledMessage);
        }, delay);

        // Guardar referencia del timeout (opcional, para cancelación)
        await scheduledMessage.update({ jobId: `timeout_${timeout}` });

        return timeout;
    };

    await scheduleJob(scheduledDate.getTime());
    return scheduledMessage;
};

// Función auxiliar para ejecutar mensajes programados
const executeScheduledMessage = async (scheduledMessage) => {
    try {
        console.log(`🚀 Ejecutando mensaje programado de Telegram: ${scheduledMessage.id}`);
        
        // Enviar mensajes a todos los chats
        const results = await Promise.allSettled(
            scheduledMessage.chatIds.map(chatId => 
                sendTelegramMessage(chatId, scheduledMessage.message, scheduledMessage.configId)
            )
        );
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const errorCount = results.length - successCount;
        
        // Actualizar estado
        await scheduledMessage.update({ 
            status: errorCount === 0 ? 'sent' : 'partially_sent'
        });
        
        console.log(`✅ Mensaje programado de Telegram enviado: ${successCount} exitosos, ${errorCount} errores`);
        
        // Programar siguiente ejecución si es recurrente
        if (scheduledMessage.repeat !== 'none') {
            const nextExecution = getNextExecution(
                scheduledMessage.scheduledTime.getTime(), 
                scheduledMessage.repeat, 
                scheduledMessage.customDays
            );
            
            if (nextExecution) {
                const newScheduled = await ScheduledTelegramMessage.create({
                    userId: scheduledMessage.userId,
                    chatIds: scheduledMessage.chatIds,
                    message: scheduledMessage.message,
                    scheduledTime: new Date(nextExecution),
                    repeat: scheduledMessage.repeat,
                    customDays: scheduledMessage.customDays,
                    configId: scheduledMessage.configId,
                    status: 'pending'
                });
                
                const delay = nextExecution - Date.now();
                setTimeout(() => executeScheduledMessage(newScheduled), delay);
            }
        }
    } catch (error) {
        await scheduledMessage.update({ status: 'error' });
        console.error('❌ Error enviando mensaje programado de Telegram:', error);
    }
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

export default telegramManager;;
