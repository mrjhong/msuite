// backend/src/controllers/whatsappController.js
import { 
  addScheduledActionService, 
  cancelScheduledActionService, 
  cancelScheduledMessageService, 
  getContactsAndGroups, 
  getScheduledActionsService, 
  getScheduledMessagesService, 
  scheduleMessageService, 
  sendMessageService,
  validateMediaFile
} from '../services/whatsappService.js';
import { getChatHistoryService } from '../services/whatsappServiceChat.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'temp');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('📁 Directorio temp creado:', uploadPath);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    console.log('📝 Nombre de archivo generado:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 64 * 1024 * 1024, // 64MB límite de WhatsApp
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Validando archivo:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    try {
      validateMediaFile(file.originalname, file.size || 0);
      cb(null, true);
    } catch (error) {
      console.error('❌ Error validando archivo:', error.message);
      cb(new Error(error.message), false);
    }
  }
});

export const sendMessageNow = async (req, res) => {
  const { userId } = req.user;
  const { contacts, groups, message, mediaData } = req.body;

  try {
    const allChats = [...(contacts || []), ...(groups || [])];
    
    for (const chat of allChats) {
      await sendMessageService(userId, chat, message, mediaData);
    }

    res.json({ success: true, message: 'Mensaje enviado correctamente' });
  } catch (error) {
    console.error('Error en sendMessageNow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendMessageWithFile = async (req, res) => {
  const { userId } = req.user;
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
    }

    // Parsear los datos del formulario
    const contacts = req.body.contacts ? JSON.parse(req.body.contacts) : [];
    const groups = req.body.groups ? JSON.parse(req.body.groups) : [];
    const message = req.body.message || '';

    console.log('📁 Archivo recibido:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Preparar datos de multimedia con la ruta local
    const mediaData = {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      localPath: req.file.path // Usar localPath en lugar de url o base64
    };

    const allChats = [...contacts, ...groups];
    
    if (allChats.length === 0) {
      // Limpiar archivo si no hay destinatarios
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'No hay destinatarios especificados' });
    }
    
    for (const chat of allChats) {
      await sendMessageService(userId, chat, message, mediaData);
    }

    // Limpiar archivo temporal después de enviar
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Archivo temporal eliminado:', req.file.path);
    }

    res.json({ success: true, message: 'Mensaje con archivo enviado correctamente' });
  } catch (error) {
    console.error('Error en sendMessageWithFile:', error);
    
    // Limpiar archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Archivo temporal eliminado por error:', req.file.path);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
};


export const scheduleMessageWithFile = async (req, res) => {
  const { userId } = req.user;
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
    }

    // Parsear los datos del formulario
    const contacts = req.body.contacts ? JSON.parse(req.body.contacts) : [];
    const groups = req.body.groups ? JSON.parse(req.body.groups) : [];
    const message = req.body.message || '';
    const scheduledTime = req.body.scheduledTime;
    const repeat = req.body.repeat || 'none';
    const customDays = req.body.customDays || null;

    console.log('📁 Archivo recibido para programación:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      scheduledTime
    });

    // Validar fecha programada
    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate < new Date()) {
      // Limpiar archivo si la fecha es inválida
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        error: 'La fecha programada debe ser en el futuro' 
      });
    }

    // Crear una copia permanente del archivo para el mensaje programado
    const permanentDir = path.join(process.cwd(), 'scheduled_media');
    if (!fs.existsSync(permanentDir)) {
      fs.mkdirSync(permanentDir, { recursive: true });
    }

    const permanentFileName = `scheduled_${Date.now()}_${req.file.originalname}`;
    const permanentPath = path.join(permanentDir, permanentFileName);
    
    // Copiar archivo a directorio permanente
    fs.copyFileSync(req.file.path, permanentPath);
    
    // Limpiar archivo temporal original
    fs.unlinkSync(req.file.path);

    // Preparar datos de multimedia con la ruta permanente
    const mediaData = {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      localPath: permanentPath, // Usar ruta permanente
      isScheduled: true // Marcar como archivo programado
    };

    // Programar el mensaje
    const scheduled = await scheduleMessageService(
      userId,
      contacts,
      groups,
      message,
      scheduledDate,
      repeat,
      customDays,
      mediaData
    );

    res.json({
      success: true,
      message: 'Mensaje con archivo programado correctamente',
      scheduled
    });
  } catch (error) {
    console.error('Error en scheduleMessageWithFile:', error);
    
    // Limpiar archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Archivo temporal eliminado por error:', req.file.path);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
};

export const scheduleMessage = async (req, res) => {
  const { userId } = req.user;
  const { contacts, groups, message, scheduledTime, repeat, customDays, mediaData } = req.body;

  try {
    const scheduled = await scheduleMessageService(
      userId,
      contacts || [],
      groups || [],
      message,
      new Date(scheduledTime),
      repeat,
      customDays,
      mediaData
    );

    res.json({
      success: true,
      message: 'Mensaje programado correctamente',
      scheduled
    });
  } catch (error) {
    console.error('Error en scheduleMessage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getScheduledMessages = async (req, res) => {
  const { userId } = req.user;
  
  try {
    const messages = await getScheduledMessagesService(userId);
    
    // Parsear mediaData si existe
    const processedMessages = messages.map(msg => {
      const messageObj = msg.toJSON();
      if (messageObj.mediaData) {
        try {
          messageObj.mediaData = JSON.parse(messageObj.mediaData);
        } catch (error) {
          console.error('Error parsing mediaData:', error);
          messageObj.mediaData = null;
        }
      }
      return messageObj;
    });
    
    res.json({ 
      success: true, 
      data: processedMessages 
    });
  } catch (error) {
    console.error('Error en getScheduledMessages:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const cancelScheduledMessage = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  
  try {
    await cancelScheduledMessageService(userId, id);
    res.json({ 
      success: true, 
      message: 'Mensaje cancelado correctamente' 
    });
  } catch (error) {
    console.error('Error en cancelScheduledMessage:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const scheduleAction = async (req, res) => {
  const { userId } = req.user;
  const { contacts, groups, message, trigger } = req.body;
  
  try {
    await addScheduledActionService(trigger, contacts || [], groups || [], message);
    res.json({ 
      success: true, 
      message: 'Acción programada correctamente', 
      scheduled: { contacts, groups, message, trigger } 
    });
  } catch (error) {
    console.error('Error en scheduleAction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getScheduledActions = async (req, res) => {
  const { userId } = req.user;
  
  try {
    const actions = await getScheduledActionsService(userId);
    res.json({ 
      success: true, 
      data: actions 
    });
  } catch (error) {
    console.error('Error en getScheduledActions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const cancelScheduledAction = async (req, res) => {
  const { id } = req.params;
  
  try {
    await cancelScheduledActionService(id);
    res.json({ 
      success: true, 
      message: 'Acción cancelada correctamente' 
    });
  } catch (error) {
    console.error('Error en cancelScheduledAction:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const getChatHistory = async (req, res) => {
  const { contactId } = req.body;

  try {
    const chatHistory = await getChatHistoryService(contactId);
    res.json({ success: true, chatHistory });
  } catch (error) {
    console.error('Error en getChatHistory:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getContacts = async (req, res) => {
  const { userId } = req.user;
  
  try {
    const { contacts, groups } = await getContactsAndGroups(userId);
    res.json({ success: true, contacts, groups });
  } catch (error) {
    console.error('Error en getContacts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Middleware para subida de archivos
export const uploadMiddleware = upload.single('media');
// Middleware para subida de archivos en mensajes programados
export const uploadScheduleMiddleware = upload.single('media');