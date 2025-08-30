// backend/src/services/whatsappServiceChat.js
import whatsappManager from "./whatsappManager.js";
import { getMediaInfoFromMessage } from "./whatsappService.js";

export const getChatHistoryService = async (contactId) => {
    try {
        if (!whatsappManager.isClientReady()) {
            throw new Error('Cliente WhatsApp no está listo');
        }
    
        const chat = await whatsappManager.getChatById(contactId);
        const messages = await chat.fetchMessages({ limit: 50 });
        
        // Procesar mensajes con multimedia
        const processedMessages = await Promise.all(
            messages.map(async (message) => {
                const baseMessage = {
                    id: message.id._serialized,
                    senderId: message.from,
                    content: message.body,
                    createdAt: message.timestamp * 1000,
                    type: message.type || 'chat',
                    hasMedia: message.hasMedia,
                    fromMe: message.fromMe
                };

                // Agregar información de multimedia si existe
                if (message.hasMedia) {
                    try {
                        const mediaInfo = await getMediaInfoFromMessage(message);
                        if (mediaInfo) {
                            baseMessage.media = {
                                mimetype: mediaInfo.mimetype,
                                filename: mediaInfo.filename,
                                size: mediaInfo.size,
                                // Solo incluir datos en base64 para archivos pequeños (menos de 1MB)
                                data: mediaInfo.size < 1024 * 1024 ? mediaInfo.data : null,
                                hasPreview: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaInfo.mimetype)
                            };
                        }
                    } catch (error) {
                        console.error('❌ Error obteniendo multimedia:', error);
                        baseMessage.media = {
                            error: 'Error cargando multimedia',
                            mimetype: 'unknown'
                        };
                    }
                }

                // Información adicional según el tipo de mensaje
                switch (message.type) {
                    case 'location':
                        baseMessage.location = {
                            latitude: message.location?.latitude,
                            longitude: message.location?.longitude,
                            description: message.location?.description
                        };
                        break;
                    case 'vcard':
                        baseMessage.contact = {
                            name: message.vCards?.[0]?.displayName,
                            vcard: message.vCards?.[0]?.vcard
                        };
                        break;
                    case 'document':
                        baseMessage.document = {
                            filename: message.filename,
                            mimetype: message.mimetype,
                            pageCount: message.pageCount
                        };
                        break;
                    case 'sticker':
                        baseMessage.sticker = {
                            mimetype: message.mimetype
                        };
                        break;
                }

                return baseMessage;
            })
        );
        
        return processedMessages;
    } catch (error) {
        console.error('❌ Error al obtener el historial de chat:', error);
        throw new Error('Error al obtener historial: ' + error.message);
    }
};