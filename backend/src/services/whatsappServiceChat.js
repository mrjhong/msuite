import { whatsappManager } from "./whatsappManager.js";

export const getChatHistoryService = async ( contactId) => {
    try {
        const client = whatsappManager.getClient('cliente_one');
        if (!client) {
        throw new Error('Cliente no encontrado');
        }
    
        const chat = await client.getChatById(contactId);
        const messages = await chat.fetchMessages({ limit: 50 });
        
        return messages.map(message => ({
        id: message.id._serialized,
        senderId: message.from,
        content: message.body,
        createdAt: message.timestamp * 1000,
        }));
    } catch (error) {
        console.error('Error al obtener el historial de chat:', error);
        throw error;
    }
    }