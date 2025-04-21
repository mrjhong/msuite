import { middlewareRequest } from "../utils/middleware";


export const getChatHistory = async (data) => {
  return await middlewareRequest('post', 'whatsapp/chats/getchat', data);
}


