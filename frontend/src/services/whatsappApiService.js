import { middlewareRequest } from "../utils/middleware";






export const apiGetContacts = async () => {
    return await middlewareRequest('get', 'contacts');
}

export const apiGetWhatsappContacts = async () => {
    return await middlewareRequest('get', 'whatsapp/contacts');
}

export const apiSendMessage = async (data) => {
    return await middlewareRequest('post', 'whatsapp/send-now', data);
}

//**************mensajes  programados */
export const apiScheduleMessage = async (data) => {
    return await middlewareRequest('post', 'whatsapp/schedule/messages', data);
}

export const apiGetScheduledMessages = async () => {
    return await middlewareRequest('get', 'whatsapp/schedule/messages');
};

export const apiCancelScheduledMessage = async (id) => {
    return await middlewareRequest('delete', `whatsapp/schedule/messages/${id}`);
};

//**************Acciones Programadas */
export const apiScheduleAction = async (data) => {
    return await middlewareRequest('post', 'whatsapp/schedule/actions', data);
}

export const apiGetScheduledActions = async () => {
    return await middlewareRequest('get', 'whatsapp/schedule/actions');
};

export const apiCancelScheduledAction = async (id) => {
    return await middlewareRequest('delete', `whatsapp/schedule/actions/${id}`);
}