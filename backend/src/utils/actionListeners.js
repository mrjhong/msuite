import ScheduledAction from '../models/ScheduledAction.js';

// Cache para almacenar acciones y evitar consultas repetidas a la DB
const actionCache = new Map();
const CACHE_TTL = 30000; // 30 segundos

// Limpiar caché periódicamente
setInterval(() => actionCache.clear(), CACHE_TTL);

// Configurar listeners genéricos
const setupListener = (client, eventName, cacheKey, processFunction) => {
    client.removeAllListeners(eventName); // Limpiar listeners antiguos
    client.on(eventName, async (notification) => {
        try {
            const actions = await getCachedActions(cacheKey);
            await processFunction(actions, notification, client);
        } catch (error) {
            console.error(`Error en ${eventName} listener:`, error);
            actionCache.delete(cacheKey); // Intento de recuperación
        }
    });
};

// Configurar todos los listeners
export const setupActionListeners = (client) => {
    console.log('Configurando listeners de acciones...');
    setupListener(client, 'group_join', 'group_join', async (actions, notification, client) => {
        await processGroupActions(actions, notification.chatId, client, {
            participant: notification.id.user,
            event: 'join',
        });
    });

    setupListener(client, 'group_leave', 'group_leave', async (actions, notification, client) => {
        await processGroupActions(actions, notification.chatId, client, {
            participant: notification.id.user,
            event: 'leave',
        });
    });

    setupListener(client, 'message', 'new_message', async (actions, msg, client) => {
        if (msg.fromMe) return; // Ignorar mensajes enviados por el cliente
        await processMessageActions(actions, msg.from, client, {
            messageId: msg.id.id,
            body: msg.body,
        });
    });
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
        console.error(`Error obteniendo acciones para ${trigger}:`, error);
        return [];
    }
};

// Procesar acciones para eventos de grupo
const processGroupActions = async (actions, chatId, client, metadata) => {
    if (!actions || actions.length === 0) return;

    const processingPromises = actions.map(async (action) => {
        try {
            if (!action.groups.length || action.groups.includes(chatId)) {
                const processedMessage = processMessageTemplate(action.message, metadata);
                await client.sendMessage(chatId, processedMessage);
                await logActionExecution(action.id, true); // Registrar éxito
            }
        } catch (error) {
            console.error(`Error procesando acción ${action.id}:`, error);
            await logActionExecution(action.id, false, error.message);
        }
    });

    await Promise.allSettled(processingPromises);
};

// Procesar acciones para mensajes individuales
const dailyMessages = {}; // Objeto para rastrear mensajes por día

const isFirstMessageToday = (contactId) => {
    const today = new Date().toLocaleDateString();
    if (!dailyMessages[contactId] || dailyMessages[contactId].lastMessageDate !== today) {
        dailyMessages[contactId] = { lastMessageDate: today, processed: false };
        return true;
    }
    return !dailyMessages[contactId].processed;
};

const processMessageActions = async (actions, contactId, client, metadata) => {
    if (!actions || actions.length === 0 || contactId.includes('@g.us')) return; // Ignorar grupos
    if (!isFirstMessageToday(contactId)) return;

    const processingPromises = actions.map(async (action) => {
        try {
            const contacts = Array.isArray(action.contacts) ? action.contacts : JSON.parse(action.contacts || '[]');
            if (!contacts.length || contacts.includes(contactId)) {
                const processedMessage = processMessageTemplate(action.message, metadata);
                await client.sendMessage(contactId, processedMessage);
                dailyMessages[contactId].processed = true; // Marcar como procesado
                await logActionExecution(action.id, true); // Registrar éxito
            }
        } catch (error) {
            console.error(`Error procesando acción ${action.id}:`, error);
            await logActionExecution(action.id, false, error.message);
            dailyMessages[contactId].processed = false; // Resetear estado
        }
    });

    await Promise.allSettled(processingPromises);
};

// Limpiar el registro diario a medianoche
const setupDailyCleanup = () => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Configurar a medianoche
    const timeToMidnight = midnight - new Date();

    setTimeout(() => {
        Object.keys(dailyMessages).forEach((key) => delete dailyMessages[key]);
        setupDailyCleanup(); // Programar el próximo cleanup
    }, timeToMidnight);
};
setupDailyCleanup(); // Iniciar el cleanup al cargar el módulo

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
        console.error('Error registrando ejecución:', logError);
    }
};

// Eliminar listener específico
export const removeActionListener = async (actionId) => {
    try {
        await ScheduledAction.update({ isActive: false }, { where: { id: actionId } });
        actionCache.clear(); // Limpiar toda la caché
        return true;
    } catch (error) {
        console.error('Error eliminando listener:', error);
        return false;
    }
};

// Inicializar listeners para un cliente
export const initializeActionListeners = (client) => {
    if (!client) {
        console.error('Error: Cliente no proporcionado. No se pueden inicializar los listeners.');
        return;
    }
    setupActionListeners(client);
    console.log('Listeners de acciones inicializados correctamente.');
};

// import ScheduledAction from '../models/ScheduledAction.js';

// // Cache para almacenar acciones y evitar consultas repetidas a la DB
// const actionCache = new Map();
// const CACHE_TTL = 30000; // 30 segundos

// // Limpiar caché periódicamente
// setInterval(() => {
//     actionCache.clear();
// }, CACHE_TTL);

// export const setupActionListeners = (client) => {
//     // Limpiar listeners antiguos para evitar duplicados
//     client.removeAllListeners('group_join');
//     client.removeAllListeners('group_leave');
//     client.removeAllListeners('message');

//     // Listener para cuando alguien se une a un grupo
//     client.on('group_join', async (notification) => {
//         try {
//             const cacheKey = `group_join`;
//             let actions = actionCache.get(cacheKey);
            
//             if (!actions) {
//                 actions = await getActionsForTrigger('group_join');
//                 actionCache.set(cacheKey, actions);
//             }

//             await processGroupActions(actions, notification.chatId, client, {
//                 participant: notification.id.user,
//                 event: 'join'
//             });
//         } catch (error) {
//             console.error('Error en group_join listener:', error);
//             // Intento de recuperación: limpiar caché para este trigger
//             actionCache.delete(`group_join`);
//         }
//     });

//     // Listener para cuando alguien sale de un grupo
//     client.on('group_leave', async (notification) => {
//         try {
//             const cacheKey = `group_leave`;
//             let actions = actionCache.get(cacheKey);
            
//             if (!actions) {
//                 actions = await getActionsForTrigger('group_leave');
//                 actionCache.set(cacheKey, actions);
//             }

//             await processGroupActions(actions, notification.chatId, client, {
//                 participant: notification.id.user,
//                 event: 'leave'
//             });
//         } catch (error) {
//             console.error('Error en group_leave listener:', error);
//             actionCache.delete(`group_leave`);
//         }
//     });

//     // Listener para nuevos mensajes
//     client.on('message', async (msg) => {
//         try {
//             console.log ('Nuevo mensaje recibido:', msg.body);
//             if (msg.fromMe) return;
            
//             const cacheKey = `new_message`;
//             let actions = actionCache.get(cacheKey);
            
//             if (!actions) {
//                 actions = await getActionsForTrigger('new_message');
//                 actionCache.set(cacheKey, actions);
//             }
     

//             await processMessageActions(actions, msg.from, client, {
//                 messageId: msg.id.id,
//                 body: msg.body
//             });
//         } catch (error) {
//             console.error('Error en message listener:', error);
//             actionCache.delete(`new_message`);
//         }
//     });
// };

// // Obtener acciones desde la base de datos
// const getActionsForTrigger = async (trigger) => {
//     try {
//         return await ScheduledAction.findAll({
//             where: { 
//                 trigger,
//                 isActive: true
//             },
//             attributes: ['id', 'message', 'contacts', 'groups', 'trigger'],
//             order: [['createdAt', 'DESC']],
//             raw: true
//         });
//     } catch (error) {
//         console.error(`Error obteniendo acciones para ${trigger}:`, error);
//         return [];
//     }
// };

// // Procesar acciones para eventos de grupo
// const processGroupActions = async (actions, chatId, client, metadata) => {
//     if (!actions || actions.length === 0) return;

//     const processingPromises = actions.map(async (action) => {
//         try {
//             // Verificar si la acción aplica a este grupo
//             const appliesToGroup = action.groups.length === 0 || 
//                                  action.groups.includes(chatId);
            
//             if (!appliesToGroup) return;

//             // Procesar plantillas de mensaje
//             const processedMessage = processMessageTemplate(
//                 action.message, 
//                 metadata
//             );

//             await client.sendMessage(chatId, processedMessage);
            
//             // Registrar éxito (opcional)
//             await logActionExecution(action.id, true);
//         } catch (error) {
//             console.error(`Error procesando acción ${action.id}:`, error);
//             await logActionExecution(action.id, false, error.message);
//         }
//     });

//     await Promise.allSettled(processingPromises);
// };

// // Procesar acciones para mensajes individuales
// // Objeto para rastrear mensajes por día
// const dailyMessages = {};

// // Función para verificar si es el primer mensaje del día
// const isFirstMessageToday = (contactId) => {
//     const today = new Date().toLocaleDateString(); // Formato local de fecha
    
//     if (!dailyMessages[contactId]) {
//         dailyMessages[contactId] = {
//             lastMessageDate: today,
//             processed: false
//         };
//         return true;
//     }
    
//     if (dailyMessages[contactId].lastMessageDate !== today) {
//         dailyMessages[contactId] = {
//             lastMessageDate: today,
//             processed: false
//         };
//         return true;
//     }
    
//     return !dailyMessages[contactId].processed;
// };

// const processMessageActions = async (actions, contactId, client, metadata) => {
//     if (!actions || actions.length === 0) return;
//     if (contactId.includes('@g.us')) return; // Ignorar grupos

//     // Verificar si es el primer mensaje del día
//     if (!isFirstMessageToday(contactId)) {
//         console.log(`No es el primer mensaje del día para ${contactId}`);
//         return;
//     }

//     const processingPromises = actions.map(async (action) => {
//         try {
//             // Convertir action.contacts a array si es necesario
//             const contacts = typeof action.contacts === 'string' ? 
//                            JSON.parse(action.contacts) : 
//                            action.contacts;
            
           
//             // Verificar si la acción aplica a este contacto
//             const appliesToContact = contacts.length === 0 || 
//                                    contacts.includes(contactId);
            
//             if (!appliesToContact) {
//                 console.log(`Acción ${action.id} no aplica a ${contactId}`);
//                 return;
//             }

//             // Procesar plantillas de mensaje
//             const processedMessage = processMessageTemplate(
//                 action.message, 
//                 metadata
//             );

//             console.log(`Enviando saludo diario a ${contactId}`);
//             await client.sendMessage(contactId, processedMessage);
            
//             // Marcar como procesado para hoy
//             dailyMessages[contactId].processed = true;
            
//             // Registrar éxito
//             await logActionExecution(action.id, true);
//         } catch (error) {
//             console.error(`Error procesando acción ${action.id}:`, error);
//             await logActionExecution(action.id, false, error.message);
            
//             // Resetear estado para reintentar
//             dailyMessages[contactId].processed = false;
//         }
//     });

//     await Promise.allSettled(processingPromises);
// };

// // Limpiar el registro diario a medianoche
// const setupDailyCleanup = () => {
//     const now = new Date();
//     const midnight = new Date(
//         now.getFullYear(),
//         now.getMonth(),
//         now.getDate() + 1, // Siguiente día
//         0, 0, 0, 0
//     );
    
//     const timeToMidnight = midnight - now;
    
//     setTimeout(() => {
//         // Limpiar todos los registros
//         Object.keys(dailyMessages).forEach(key => {
//             delete dailyMessages[key];
//         });
        
//         // Programar el próximo cleanup
//         setupDailyCleanup();
//     }, timeToMidnight);
// };

// // Iniciar el cleanup al cargar el módulo
// setupDailyCleanup();

// // Procesar plantillas en el mensaje
// const processMessageTemplate = (message, metadata) => {
//     if (!metadata) return message;
    
//     return message
//         .replace(/{participant}/g, metadata.participant || '')
//         .replace(/{event}/g, metadata.event || '')
//         .replace(/{message}/g, metadata.body || '')
//         .replace(/{timestamp}/g, new Date().toLocaleString());
// };

// // Registrar ejecución de acciones (opcional)
// const logActionExecution = async (actionId, success, error = null) => {
//     try {
//         await ScheduledAction.update(
//             { 
//                 lastExecuted: new Date(),
//                 lastStatus: success ? 'success' : 'failed',
//                 lastError: error
//             },
//             { where: { id: actionId } }
//         );
//     } catch (logError) {
//         console.error('Error registrando ejecución:', logError);
//     }
// };

// // Eliminar listener específico (cancelar acción)
// export const removeActionListener = async (actionId) => {
//     try {
//         // Actualizar en base de datos
//         await ScheduledAction.update(
//             { isActive: false },
//             { where: { id: actionId } }
//         );
        
//         // Limpiar caché para todos los triggers ya que no sabemos cuál era
//         actionCache.delete(`group_join`);
//         actionCache.delete(`group_leave`);
//         actionCache.delete(`new_message`);
        
//         return true;
//     } catch (error) {
//         console.error('Error eliminando listener:', error);
//         return false;
//     }
// };

// // Inicializar listeners para un cliente
// export const initializeActionListeners = (client) => {
//     if (!client) {
//         console.error('No se puede inicializar listeners sin cliente');
//         return;
//     }
    
//     setupActionListeners(client);
//     console.log(`Listeners de acciones inicializados para usuario`);
// };