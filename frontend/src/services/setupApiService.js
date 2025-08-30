// frontend/src/services/setupApiService.js
import axios from 'axios';

const urlApi = process.env.REACT_APP_URL_API;

export const apiCheckSetupStatus = async () => {
  try {
    const response = await axios.get(`${urlApi}/setup/status`);
    return response.data;
  } catch (error) {
    console.error('Error checking setup status:', error);
    return { 
      setupRequired: true, 
      userCount: 0,
      error: error.message 
    };
  }
};

export const apiCreateFirstUser = async (userData) => {
  try {
    const response = await axios.post(`${urlApi}/setup/create-user`, userData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return { 
        success: false, 
        error: error.response.data.error 
      };
    }
    return { 
      success: false, 
      error: 'Error de conexión' 
    };
  }
};