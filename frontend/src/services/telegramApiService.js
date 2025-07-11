// frontend/src/services/telegramApiService.js
import { middlewareRequest } from "../utils/middleware";

// Configuraciones de Telegram
export const apiCreateTelegramConfig = async (configData) => {
    return await middlewareRequest('post', 'telegram/configs', configData);
};

export const apiGetTelegramConfigs = async () => {
    return await middlewareRequest('get', 'telegram/configs');
};

export const apiUpdateTelegramConfig = async (configId, configData) => {
    return await middlewareRequest('put', `telegram/configs/${configId}`, configData);
};

export const apiDeleteTelegramConfig = async (configId) => {
    return await middlewareRequest('delete', `telegram/configs/${configId}`);
};

export const apiTestTelegramConfig = async (testData) => {
    return await middlewareRequest('post', 'telegram/configs/test', testData);
};

// Envío de mensajes
export const apiSendTelegramMessage = async (messageData) => {
    return await middlewareRequest('post', 'telegram/send-now', messageData);
};

// Mensajes programados
export const apiScheduleTelegramMessage = async (scheduleData) => {
    return await middlewareRequest('post', 'telegram/schedule/messages', scheduleData);
};

export const apiGetScheduledTelegramMessages = async () => {
    return await middlewareRequest('get', 'telegram/schedule/messages');
};

export const apiCancelScheduledTelegramMessage = async (messageId) => {
    return await middlewareRequest('delete', `telegram/schedule/messages/${messageId}`);
};

// Información de chats
export const apiGetTelegramChatInfo = async (chatId, configId = null) => {
    const query = configId ? `?configId=${configId}` : '';
    return await middlewareRequest('get', `telegram/chat/${chatId}${query}`);
};