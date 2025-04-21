import { middlewareRequest } from "../utils/middleware";

export const apiCreateEmailTemplate = async (templateData) => {
    return await middlewareRequest('post', 'email/templates', templateData);
  };
  
  export const apiCreateEmailConfig = async (configData) => {
    return await middlewareRequest('post', 'email/configs', configData);
  };
  
  export const apiScheduleEmail = async (scheduleData) => {
    return await middlewareRequest('post', 'email/schedule', scheduleData);
  };
  
  export const apiSendTestEmail = async (testData) => {
    return await middlewareRequest('post', 'email/test', testData);
  };
  
  export const apiGetEmailTemplates = async () => {
    return await middlewareRequest('get', 'email/templates');
  };
  
  export const apiGetEmailConfigs = async () => {
    return await middlewareRequest('get', 'email/configs');
  };
  