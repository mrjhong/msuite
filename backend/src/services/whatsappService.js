// backend/src/services/whatsappService.js
import ScheduledMessage from '../models/ScheduledMessage.js';
import ScheduledAction from '../models/ScheduledAction.js';
import { cancelJob } from '../utils/jobs/scheduleWhatsapp.js';
import { removeActionListener } from '../utils/actionListeners.js';
import whatsappManager from './whatsappManager.js';

// Inicializar el cliente único
export const initializeWhatsAppClient = async () => {
  try {
    console.log('🚀 Inicializando cliente WhatsApp único...');
    const client = await whatsappManager.initializeClient();
    return client;
  } catch (error) {
    console.error('❌ Error inicializando WhatsApp:', error);
    throw error;
  }
};

// Obtener el cliente (ya no necesitamos userId)
export const getWhatsAppClient = () => {
  return whatsappManager.getClient();
};

// Verificar si el cliente está listo
export const isWhatsAppReady = () => {
  return whatsappManager.isClientReady();
};

export const sendMessageService = async (userId, chatId, message) => {
  try {
    if (!whatsappManager.isClientReady()) {
      throw new Error('WhatsApp client not ready');
    }

    await whatsappManager.sendMessage(chatId, message);
    console.log(`✅ Mensaje enviado a ${chatId}: ${message}`);
  } catch (error) {
    console.error(`❌ Error al enviar mensaje a ${chatId}:`, error);
    throw new Error('Error enviando mensaje: ' + error.message);
  }
};

export const scheduleMessageService = async (userId, contacts, groups, message, scheduledTime, repeat = 'none', customDays = null) => {
  if (!whatsappManager.isClientReady()) {
    throw new Error('WhatsApp client not ready');
  }

  const scheduledDate = new Date(scheduledTime);
  if (scheduledDate < new Date()) {
    throw new Error('La fecha programada debe ser en el futuro');
  }

  // Crear en base de datos
  const scheduledMessage = await ScheduledMessage.create({
    userId,
    contacts,
    groups,
    message,
    scheduledTime: scheduledDate,
    repeat,
    customDays,
    status: 'pending'
  });

  // Programar el mensaje
  const scheduleJob = async (executionTime) => {
    const delay = executionTime - Date.now();
    
    const timeout = setTimeout(async () => {
      try {
        // Verificar que el cliente siga listo
        if (!whatsappManager.isClientReady()) {
          console.warn('⚠️ Cliente no listo, reintentando en 30 segundos...');
          setTimeout(() => scheduleJob(executionTime + 30000), 30000);
          return;
        }

        // Enviar mensajes
        const allChats = [...contacts, ...groups];
        await Promise.allSettled(
          allChats.map(chatId => sendMessageService(userId, chatId, message))
        );
        
        // Actualizar estado
        await scheduledMessage.update({ status: 'sent' });
        console.log(`✅ Mensaje programado enviado: ${scheduledMessage.id}`);
        
        // Programar siguiente ejecución si es recurrente
        if (repeat !== 'none') {
          const nextExecution = getNextExecution(executionTime, repeat, customDays);
          if (nextExecution) scheduleJob(nextExecution);
        }
      } catch (error) {
        await scheduledMessage.update({ status: 'error' });
        console.error('❌ Error enviando mensaje programado:', error);
      }
    }, delay);

    return timeout;
  };

  // Iniciar el ciclo de programación
  await scheduleJob(scheduledDate.getTime());
  return scheduledMessage;
};

export const getScheduledMessagesService = async (userId) => {
  return await ScheduledMessage.findAll({
    where: { 
      userId,
      status: 'pending'
    },
    order: [['scheduledTime', 'ASC']]
  });
};

export const cancelScheduledMessageService = async (userId, messageId) => {
  const message = await ScheduledMessage.findOne({
    where: {
      id: messageId,
      userId
    }
  });

  if (!message) {
    throw new Error('Mensaje no encontrado');
  }

  cancelJob(messageId);
  await message.update({ status: 'cancelled' });
  return message;
};

export const addScheduledActionService = async (trigger, contacts, groups, message) => {
  if (!whatsappManager.isClientReady()) {
    throw new Error('WhatsApp client not ready');
  }
  
  const action = await ScheduledAction.create({
    trigger, 
    contacts, 
    groups, 
    message 
  });
  
  return action;
};

export const getScheduledActionsService = async (userId) => {
  return await ScheduledAction.findAll({
    where: { isActive: true },
    order: [['createdAt', 'DESC']]
  });
};

export const cancelScheduledActionService = async (actionId) => {
  const action = await ScheduledAction.findOne({
    where: { id: actionId }
  });
  
  if (!action) {
    throw new Error('Acción no encontrada');
  }
  
  await removeActionListener(actionId);
  await action.destroy();
  return action;
};

export const getContactsAndGroups = async (userId) => {
  if (!whatsappManager.isClientReady()) {
    throw new Error('WhatsApp client not ready');
  }

  try {
    const chats = await whatsappManager.getChats();
    
    return {
      contacts: chats
        .filter((chat) => chat.id.server.includes('c.us'))
        .map((contact) => ({
          id: contact.id._serialized,
          name: contact.name || contact.id.user,
          phone: contact.id.user,
        })),
      groups: chats
        .filter((chat) => chat.id.server.includes('g.us'))
        .map((group) => ({
          id: group.id._serialized,
          name: group.name,
        })),
    };
  } catch (error) {
    console.error(`❌ Error al obtener contactos y grupos:`, error);
    throw new Error('Error al obtener contactos y grupos: ' + error.message);
  }
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