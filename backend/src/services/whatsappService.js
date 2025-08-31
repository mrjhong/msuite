// backend/src/services/whatsappService.js
import ScheduledMessage from '../models/ScheduledMessage.js';
import ScheduledAction from '../models/ScheduledAction.js';
import { cancelJob } from '../utils/jobs/scheduleWhatsapp.js';
import { removeActionListener } from '../utils/actionListeners.js';
import whatsappManager from './whatsappManager.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio para archivos temporales
const TEMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Tipos de archivo soportados
const SUPPORTED_MEDIA_TYPES = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  video: ['mp4', 'avi', 'mov', 'mkv', '3gp'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar']
};

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

// Obtener el cliente
export const getWhatsAppClient = () => {
  return whatsappManager.getClient();
};

// Verificar si el cliente está listo
export const isWhatsAppReady = () => {
  return whatsappManager.isClientReady();
};

// Función para descargar archivos desde URL
const downloadFile = async (url, filename) => {
  const filePath = path.join(TEMP_DIR, filename);
  
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000 // 30 segundos timeout
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('❌ Error descargando archivo:', error);
    throw new Error('Error al descargar el archivo desde la URL');
  }
};

// Función para obtener el tipo de archivo
const getFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  
  for (const [type, extensions] of Object.entries(SUPPORTED_MEDIA_TYPES)) {
    if (extensions.includes(extension)) {
      return type;
    }
  }
  
  return 'document'; // Por defecto como documento
};

// Función para limpiar archivos temporales
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Archivo temporal eliminado:', filePath);
    }
  } catch (error) {
    console.warn('⚠️ Error eliminando archivo temporal:', error);
  }
};

// Enviar mensaje con soporte multimedia
export const sendMessageService = async (userId, chatId, message, mediaData = null) => {
  try {
    if (!whatsappManager.isClientReady()) {
      throw new Error('WhatsApp client not ready');
    }

    console.log('📤 Enviando mensaje a:', chatId, 'con mediaData:', mediaData);

    // Si hay multimedia
    if (mediaData) {
      let media;
      let tempFilePath = null;

      try {
        if (mediaData.localPath) {
          // Archivo local subido
          console.log('📁 Procesando archivo local:', mediaData.localPath);
          
          if (!fs.existsSync(mediaData.localPath)) {
            throw new Error(`Archivo no encontrado: ${mediaData.localPath}`);
          }
          
          media = MessageMedia.fromFilePath(mediaData.localPath);
          console.log('✅ Media creado desde archivo local');
          
        } else if (mediaData.url) {
          // Descargar desde URL
          console.log('🌐 Descargando desde URL:', mediaData.url);
          const filename = `temp_${Date.now()}_${mediaData.filename || 'file'}`;
          tempFilePath = await downloadFile(mediaData.url, filename);
          media = MessageMedia.fromFilePath(tempFilePath);
          console.log('✅ Media creado desde URL descargada');
          
        } else if (mediaData.base64) {
          // Crear desde base64
          console.log('📄 Procesando base64 data');
          media = new MessageMedia(mediaData.mimetype, mediaData.base64, mediaData.filename);
          console.log('✅ Media creado desde base64');
          
        } else {
          throw new Error('No se encontró fuente de datos multimedia válida (localPath, url, o base64)');
        }

        // Configurar opciones adicionales
        const options = {};
        
        if (message && message.trim()) {
          options.caption = message;
        }

        if (mediaData.filename) {
          const fileType = getFileType(mediaData.filename);
          options.sendMediaAsDocument = fileType === 'document';
          console.log('📋 Tipo de archivo detectado:', fileType);
        }

        console.log('📨 Enviando multimedia con opciones:', options);
        
        // Enviar multimedia
        const result = await whatsappManager.sendMessage(chatId, media, options);
        console.log('✅ Multimedia enviado exitosamente a', chatId);
        
        return result;
        
      } finally {
        // Limpiar archivo temporal si se descargó desde URL
        if (tempFilePath) {
          cleanupTempFile(tempFilePath);
        }
      }
    } else {
      // Enviar solo mensaje de texto
      console.log('💬 Enviando mensaje de texto a', chatId);
      const result = await whatsappManager.sendMessage(chatId, message);
      console.log('✅ Mensaje de texto enviado exitosamente a', chatId);
      return result;
    }
  } catch (error) {
    console.error(`❌ Error al enviar mensaje a ${chatId}:`, error);
    throw new Error('Error enviando mensaje: ' + error.message);
  }
};

// Programar mensaje con soporte multimedia
export const scheduleMessageService = async (userId, contacts, groups, message, scheduledTime, repeat = 'none', customDays = null, mediaData ) => {
  if (!whatsappManager.isClientReady()) {
    throw new Error('WhatsApp client not ready');
  }

  const scheduledDate = new Date(scheduledTime);
  if (scheduledDate < new Date()) {
    throw new Error('La fecha programada debe ser en el futuro');
  }

  // Crear en base de datos (agregar campo para multimedia)
  const scheduledMessage = await ScheduledMessage.create({
    userId,
    contacts,
    groups,
    message,
    scheduledTime: scheduledDate,
    repeat,
    customDays,
    status: 'pending',
    mediaData: mediaData ? JSON.stringify(mediaData) : null
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

        // Obtener datos multimedia si existen
        let parsedMediaData = null;
        if (scheduledMessage.mediaData) {
          try {
            parsedMediaData = JSON.parse(scheduledMessage.mediaData);
          } catch (error) {
            console.error('❌ Error parseando mediaData:', error);
          }
        }

        // Enviar mensajes
        const allChats = [...contacts, ...groups];
        await Promise.allSettled(
          allChats.map(chatId => sendMessageService(userId, chatId, message, parsedMediaData))
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

// Obtener mensajes programados
export const getScheduledMessagesService = async (userId) => {
  return await ScheduledMessage.findAll({
    where: { 
      userId,
      status: 'pending'
    },
    order: [['scheduledTime', 'ASC']]
  });
};

// Cancelar mensaje programado
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

// Funciones para acciones programadas (sin cambios)
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

// Obtener contactos y grupos
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

// Función para obtener información de multimedia de un mensaje
export const getMediaInfoFromMessage = async (message) => {
  try {
    if (!message.hasMedia) {
      return null;
    }

    const media = await message.downloadMedia();
    
    return {
      mimetype: media.mimetype,
      data: media.data,
      filename: media.filename || `media_${Date.now()}`,
      size: media.data ? Buffer.byteLength(media.data, 'base64') : 0
    };
  } catch (error) {
    console.error('❌ Error obteniendo información de multimedia:', error);
    return null;
  }
};

// Función para validar archivos multimedia
export const validateMediaFile = (filename, size) => {
  const maxSize = 64 * 1024 * 1024; // 64MB límite de WhatsApp
  
  if (size > maxSize) {
    throw new Error('El archivo es demasiado grande. Máximo 64MB permitido.');
  }

  const extension = filename.split('.').pop().toLowerCase();
  const allSupportedExtensions = Object.values(SUPPORTED_MEDIA_TYPES).flat();
  
  if (!allSupportedExtensions.includes(extension)) {
    throw new Error(`Tipo de archivo no soportado: .${extension}`);
  }

  return true;
};

// Agregar estas funciones a whatsappService.js

// Función para limpiar archivos programados expirados
export const cleanupExpiredScheduledFiles = async () => {
  try {
    const scheduledDir = path.join(process.cwd(), 'scheduled_media');
    if (!fs.existsSync(scheduledDir)) return;

    // Obtener mensajes programados cancelados o enviados hace más de 24 horas
    const expiredMessages = await ScheduledMessage.findAll({
      where: {
        status: ['sent', 'cancelled', 'error'],
        updatedAt: {
          [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas atrás
        }
      }
    });

    for (const message of expiredMessages) {
      if (message.mediaData) {
        try {
          const mediaData = JSON.parse(message.mediaData);
          if (mediaData.localPath && mediaData.isScheduled && fs.existsSync(mediaData.localPath)) {
            fs.unlinkSync(mediaData.localPath);
            console.log('🗑️ Archivo programado expirado eliminado:', mediaData.localPath);
          }
        } catch (error) {
          console.warn('⚠️ Error limpiando archivo expirado:', error);
        }
      }
    }

    // Eliminar registros de base de datos de mensajes muy antiguos
    await ScheduledMessage.destroy({
      where: {
        status: ['sent', 'cancelled', 'error'],
        updatedAt: {
          [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 días atrás
        }
      }
    });

    console.log('✅ Limpieza de archivos programados completada');
  } catch (error) {
    console.error('❌ Error en limpieza de archivos programados:', error);
  }
};

// Programar limpieza automática cada 6 horas
setInterval(cleanupExpiredScheduledFiles, 6 * 60 * 60 * 1000);

// Función mejorada para cancelar mensaje programado
export const cancelScheduledMessageServiceImproved = async (userId, messageId) => {
  const message = await ScheduledMessage.findOne({
    where: {
      id: messageId,
      userId
    }
  });

  if (!message) {
    throw new Error('Mensaje no encontrado');
  }

  // Cancelar job programado
  cancelJob(messageId);
  
  // Limpiar archivo si existe
  if (message.mediaData) {
    try {
      const mediaData = JSON.parse(message.mediaData);
      if (mediaData.localPath && mediaData.isScheduled && fs.existsSync(mediaData.localPath)) {
        fs.unlinkSync(mediaData.localPath);
        console.log('🗑️ Archivo programado eliminado al cancelar:', mediaData.localPath);
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando archivo al cancelar:', error);
    }
  }
  
  await message.update({ status: 'cancelled' });
  return message;
};