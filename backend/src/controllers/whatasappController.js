import { addScheduledActionService, cancelScheduledActionService, cancelScheduledMessageService, getContactsAndGroups, getScheduledActionsService, getScheduledMessagesService, scheduleMessageService, sendMessageService } from '../services/whatsappService.js';
import { getChatHistoryService } from '../services/whatsappServiceChat.js';

export const sendMessageNow = async (req, res) => {
  const { userId } = req.user; // Asume que el ID del usuario está en el token JWT
  const { contacts, message } = req.body;

  try {
    for (const contact of contacts) {
      await sendMessageService(userId, contact, message);
    }

    res.json({ success: true, message: 'Mensaje enviado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const scheduleMessage = async (req, res) => {
  const { userId } = req.user;
  const { contacts, groups, message, scheduledTime, repeat, customDays } = req.body;

  try {
    const scheduled = await scheduleMessageService(
      userId,
      contacts,
      groups,
      message,
      new Date(scheduledTime),
      repeat,
      customDays
    );

    res.json({
      success: true,
      message: 'Mensaje programado correctamente',
      scheduled
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getScheduledMessages = async (req, res) => {
  const { userId } = req.user;
  
  try {
    const messages = await getScheduledMessagesService(userId);
    res.json({ 
      success: true, 
      data: messages 
    });
  } catch (error) {
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
    await addScheduledActionService(trigger, contacts, groups, message);
    res.json({ success: true, message: 'Accion programada correctamente', scheduled: { contacts, groups, message, trigger } });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export const getScheduledActions = async (req, res) => {
  const { userId } = req.user;
  
  try {
      const actions = await getScheduledActionsService(userId);
      res.json({ 
          success: true, 
          data: actions 
      });
  } catch (error) {
      console.error('Error fetching actions:', error);
      res.status(500).json({ 
          success: false, 
          error: error.message 
      });
  }
};

export const cancelScheduledAction = async (req, res) => {
  const { id } = req.params;
  
  try {
      await cancelScheduledActionService( id);
      res.json({ 
          success: true, 
          message: 'Acción cancelada correctamente' 
      });
  } catch (error) {
      console.error('Error canceling action:', error);
      res.status(500).json({ 
          success: false, 
          error: error.message 
      });
  }
};

export const getChatHistory = async (req, res) => {
 
  const { contactId } = req.body;

  try {
    const chatHistory = await getChatHistoryService( contactId);
    res.json({ success: true, chatHistory });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


export const getContacts = async (req, res) => {
  const { userId } = req.user;
  try {
    const { contacts, groups } = await getContactsAndGroups(userId);
    res.json({ success: true, contacts, groups });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error.message });
  }
};

