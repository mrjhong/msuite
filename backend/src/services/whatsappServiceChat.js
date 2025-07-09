// backend/src/services/whatsappServiceChat.js
import whatsappManager from "./whatsappManager.js";

export const getChatHistoryService = async (contactId) => {
    try {
        if (!whatsappManager.isClientReady()) {
            throw new Error('Cliente WhatsApp no está listo');
        }
    
        const chat = await whatsappManager.getChatById(contactId);
        const messages = await chat.fetchMessages({ limit: 50 });
        
        return messages.map(message => ({
            id: message.id._serialized,
            senderId: message.from,
            content: message.body,
            createdAt: message.timestamp * 1000,
        }));
    } catch (error) {
        console.error('❌ Error al obtener el historial de chat:', error);
        throw new Error('Error al obtener historial: ' + error.message);
    }
};    