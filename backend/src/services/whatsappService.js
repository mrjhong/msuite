

import ScheduledMessage from '../models/ScheduledMessage.js';
import ScheduledAction from '../models/ScheduledAction.js';
import { cancelJob } from '../utils/jobs/scheduleWhatsapp.js';
import { removeActionListener } from '../utils/actionListeners.js';
import { whatsappManager } from './whatsappManager.js';




const userClients = new Map(); // Almacena las instancias de WhatsApp por usuario

export const initializeWhatsAppClient = () => {
  return whatsappManager.initializeClient("cliente_one");
};

export const getClientByUserId = (userId) => {
  return userClients.get(userId) || null;
};


export const sendMessageService = async (userId, chatId, message) => {
  const client = whatsappManager.getClient("cliente_one");
  if (!client) {
    throw new Error('WhatsApp client not initialized for this user');
  }

  try {

    await client.sendMessage(chatId, message);
    console.log(`Mensaje enviado a ${chatId}: ${message}`);
  } catch (error) {
    console.error(`Error al enviar mensaje a ${chatId}:`, error);
    throw new Error('Error enviando mensaje');
  }
};

// Service
export const scheduleMessageService = async (userId, contacts, groups, message, scheduledTime, repeat = 'none', customDays = null) => {
  const client = whatsappManager.getClient("cliente_one");
  if (!client) throw new Error('WhatsApp client not initialized for this user');

  const scheduledDate = new Date(scheduledTime);
  if (scheduledDate < new Date()) throw new Error('La fecha programada debe ser en el futuro');

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
        // Enviar mensajes
        await Promise.all([
          ...contacts.map(contact => sendMessageService(userId, contact, message)),
          ...groups.map(group => sendMessageService(userId, group, message))
        ]);
        
        // Actualizar estado
        await scheduledMessage.update({ status: 'sent' });
        
        // Programar siguiente ejecución si es recurrente
        if (repeat !== 'none') {
          const nextExecution = getNextExecution(executionTime, repeat, customDays);
          if (nextExecution) scheduleJob(nextExecution);
        }
      } catch (error) {
        await scheduledMessage.update({ status: 'error' });
        console.error('Error enviando mensaje programado:', error);
      }
    }, delay);

    return timeout;
  };

  // Iniciar el ciclo de programación
  await scheduleJob(scheduledDate.getTime());

  return scheduledMessage;
};

// Nueva función para obtener mensajes programados
export const getScheduledMessagesService = async (userId) => {
  return await ScheduledMessage.findAll({
    where: { 
      userId,
      status: 'pending' // Solo mostramos los pendientes
    },
    order: [['scheduledTime', 'ASC']] // Ordenamos por fecha más cercana
  });
};

// Función para cancelar mensaje programado
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

  // Cancelar el job programado
  cancelJob(messageId);

  // Actualizar estado en la base de datos
  await message.update({ status: 'cancelled' });

  return message;
};





export const addScheduledActionService = async (trigger, contacts, groups, message) => {
  const client = whatsappManager.getClient("cliente_one");
  if (!client) {
    throw new Error('WhatsApp client not initialized for this user');
  }
  const action = await ScheduledAction.create(
    { trigger, contacts, groups, message });
  return action;
};


export const getScheduledActionsService = async (userId) => {
  return await ScheduledAction.findAll({
      order: [['createdAt', 'DESC']]
  });
};

export const cancelScheduledActionService = async ( actionId) => {
  const action = await ScheduledAction.findOne({
      where: { id: actionId }
  });
  
  if (!action) {
      throw new Error('Acción no encontrada');
  }
  
  // Eliminar listener si es necesario
  await removeActionListener(actionId);
  
  await action.destroy();
  return action;
};





export const getContactsAndGroups = async (userId) => {
  const client = whatsappManager.getClient("cliente_one");
  if (!client) {
    throw new Error('WhatsApp client not initialized for this user');
  }

  try {
    const chats = await client.getChats();
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
    console.error(`Error al obtener contactos y grupos:`, error);
    throw new Error('Error al obtener contactos y grupos');
  }
};

// Helpers
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