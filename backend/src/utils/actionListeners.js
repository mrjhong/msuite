// backend/src/utils/actionListeners.js
import ScheduledAction from '../models/ScheduledAction.js';
import whatsappManager from '../services/whatsappManager.js';

// Cache para almacenar acciones y evitar consultas repetidas a la DB
const actionCache = new Map();
const CACHE_TTL = 30000; // 30 segundos

// Variables para gestión de listeners
let listenersInitialized = false;
const dailyMessages = {}; // Objeto para rastrear mensajes por día

// Limpiar caché periódicamente
setInterval(() => {
    actionCache.clear();
    console.log('🧹 Cache de acciones limpiado');
}, CACHE_TTL);

// Configurar listeners usando el manager optimizado
export const setupActionListeners = () => {
    if (listenersInitialized) {
        console.log('⚠️ Listeners ya inicializados, omitiendo...');
        return;
    }

    console.log('🎯 Configurando listeners de acciones...');

    // Group Join Listener
    whatsappManager.addListener('group_join', 'actions_group_join', async (notification) => {
        try {
            const actions = await getCachedActions('group_join');
            await processGroupActions(actions, notification.chatId, {
                participant: notification.id.user,
                event: 'join',
            });
        } catch (error) {
            console.error('❌ Error en group_join listener:', error);
            actionCache.delete('group_join');
        }
    });

    // Group Leave Listener
    whatsappManager.addListener('group_leave', 'actions_group_leave', async (notification) => {
        try {
            const actions = await getCachedActions('group_leave');
            await processGroupActions(actions, notification.chatId, {
                participant: notification.id.user,
                event: 'leave',
            });
        } catch (error) {
            console.error('❌ Error en group_leave listener:', error);
            actionCache.delete('group_leave');
        }
    });

    // Message Listener
    whatsappManager.addListener('message', 'actions_new_message', async (msg) => {
        try {
            if (msg.fromMe) return; // Ignorar mensajes enviados por el cliente
            
            const actions = await getCachedActions('new_message');
            await processMessageActions(actions, msg.from, {
                messageId: msg.id.id,
                body: msg.body,
            });
        } catch (error) {
            console.error('❌ Error en message listener:', error);
            actionCache.delete('new_message');
        }
    });

    listenersInitialized = true;
    console.log('✅ Listeners de acciones configurados correctamente');
};

// Obtener acciones desde la caché o la base de datos
const getCachedActions = async (cacheKey) => {
    if (actionCache.has(cacheKey)) {
        return actionCache.get(cacheKey);
    }
    
    const actions = await getActionsForTrigger(cacheKey);
    actionCache.set(cacheKey, actions);
    return actions;
};

// Obtener acciones desde la base de datos
const getActionsForTrigger = async (trigger) => {
    try {
        return await ScheduledAction.findAll({
            where: { trigger, isActive: true },
            attributes: ['id', 'message', 'contacts', 'groups', 'trigger'],
            order: [['createdAt', 'DESC']],
            raw: true,
        });
    } catch (error) {
        console.error(`❌ Error obteniendo acciones para ${trigger}:`, error);
        return [];
    }
};

// Procesar acciones para eventos de grupo
const processGroupActions = async (actions, chatId, metadata) => {
    if (!actions || actions.length === 0) return;

    const processingPromises = actions.map(async (action) => {
        try {
            if (!action.groups.length || action.groups.includes(chatId)) {
                const processedMessage = processMessageTemplate(action.message, metadata);
                
                if (!whatsappManager.isClientReady()) {
                    throw new Error('Cliente WhatsApp no está listo');
                }
                
                await whatsappManager.sendMessage(chatId, processedMessage);
                await logActionExecution(action.id, true);
                
                console.log(`✅ Acción ${action.id} ejecutada en grupo ${chatId}`);
            }
        } catch (error) {
            console.error(`❌ Error procesando acción ${action.id}:`, error);
            await logActionExecution(action.id, false, error.message);
        }
    });

    await Promise.allSettled(processingPromises);
};

// Verificar si es el primer mensaje del día
const isFirstMessageToday = (contactId) => {
    const today = new Date().toLocaleDateString();
    if (!dailyMessages[contactId] || dailyMessages[contactId].lastMessageDate !== today) {
        dailyMessages[contactId] = { lastMessageDate: today, processed: false };
        return true;
    }
    return !dailyMessages[contactId].processed;
};

// Procesar acciones para mensajes individuales
const processMessageActions = async (actions, contactId, metadata) => {
    if (!actions || actions.length === 0 || contactId.includes('@g.us')) return;
    if (!isFirstMessageToday(contactId)) return;

    const processingPromises = actions.map(async (action) => {
        try {
            const contacts = Array.isArray(action.contacts) ? action.contacts : JSON.parse(action.contacts || '[]');
            if (!contacts.length || contacts.includes(contactId)) {
                const processedMessage = processMessageTemplate(action.message, metadata);
                
                if (!whatsappManager.isClientReady()) {
                    throw new Error('Cliente WhatsApp no está listo');
                }
                
                await whatsappManager.sendMessage(contactId, processedMessage);
                dailyMessages[contactId].processed = true;
                await logActionExecution(action.id, true);
                
                console.log(`✅ Acción ${action.id} ejecutada para contacto ${contactId}`);
            }
        } catch (error) {
            console.error(`❌ Error procesando acción ${action.id}:`, error);
            await logActionExecution(action.id, false, error.message);
            dailyMessages[contactId].processed = false;
        }
    });

    await Promise.allSettled(processingPromises);
};

// Limpiar el registro diario a medianoche
const setupDailyCleanup = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeToMidnight = midnight - now;

    setTimeout(() => {
        Object.keys(dailyMessages).forEach((key) => delete dailyMessages[key]);
        console.log('🧹 Registro diario de mensajes limpiado');
        setupDailyCleanup(); // Programar el próximo cleanup
    }, timeToMidnight);
};

// Inicializar cleanup diario
setupDailyCleanup();

// Procesar plantillas en el mensaje
const processMessageTemplate = (message, metadata) => {
    if (!metadata) return message;
    return message
        .replace(/{participant}/g, metadata.participant || '')
        .replace(/{event}/g, metadata.event || '')
        .replace(/{message}/g, metadata.body || '')
        .replace(/{timestamp}/g, new Date().toLocaleString());
};

// Registrar ejecución de acciones
const logActionExecution = async (actionId, success, error = null) => {
    try {
        await ScheduledAction.update(
            {
                lastExecuted: new Date(),
                lastStatus: success ? 'success' : 'failed',
                lastError: error,
            },
            { where: { id: actionId } }
        );
    } catch (logError) {
        console.error('❌ Error registrando ejecución:', logError);
    }
};

// Eliminar listener específico
export const removeActionListener = async (actionId) => {
    try {
        await ScheduledAction.update({ isActive: false }, { where: { id: actionId } });
        actionCache.clear(); // Limpiar toda la caché
        console.log(`🗑️ Listener de acción ${actionId} removido`);
        return true;
    } catch (error) {
        console.error('❌ Error eliminando listener:', error);
        return false;
    }
};

// Inicializar listeners para un cliente
export const initializeActionListeners = (client) => {
    if (!client) {
        console.error('❌ Error: Cliente no proporcionado. No se pueden inicializar los listeners.');
        return;
    }
    
    setupActionListeners();
    console.log('🎯 Listeners de acciones inicializados correctamente');
};

// Función para limpiar todos los listeners (útil para testing o restart)
export const clearAllListeners = () => {
    whatsappManager.removeListener('group_join', 'actions_group_join');
    whatsappManager.removeListener('group_leave', 'actions_group_leave');
    whatsappManager.removeListener('message', 'actions_new_message');
    
    listenersInitialized = false;
    actionCache.clear();
    Object.keys(dailyMessages).forEach(key => delete dailyMessages[key]);
    
    console.log('🧹 Todos los listeners limpiados');
};