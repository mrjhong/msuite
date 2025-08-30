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

export const apiSendMessageWithFile = async (formData) => {
    const urlApi = process.env.REACT_APP_URL_API;
    const token = localStorage.getItem('token');
    
    try {
        console.log('📤 Enviando archivo con FormData');
        
        // Log de los datos del formulario (sin mostrar el archivo)
        for (let [key, value] of formData.entries()) {
            if (key !== 'media') {
                console.log(`📋 ${key}:`, value);
            } else {
                console.log(`📁 media: [Archivo - ${value.name}, ${value.size} bytes]`);
            }
        }
        
        const response = await fetch(`${urlApi}/whatsapp/send-with-file`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // No establecer Content-Type, el navegador lo hará automáticamente para FormData
            },
            body: formData
        });
        
        console.log('📡 Respuesta del servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error del servidor:', errorData);
            return { failure: true, error: errorData.error || 'Error enviando archivo' };
        }
        
        const result = await response.json();
        console.log('✅ Respuesta exitosa:', result);
        return result;
    } catch (error) {
        console.error('❌ Error sending file:', error);
        return { failure: true, error: 'Error de conexión: ' + error.message };
    }
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