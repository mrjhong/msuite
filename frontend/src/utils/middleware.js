import axios from 'axios';

const urlApi = process.env.REACT_APP_API_URL;

export const middlewareRequest = async (method, url, data = null) => {
  const token = localStorage.getItem('token');

  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const response = data !== null && data !== undefined
      ? await axios[method](`${urlApi}/${url}`, data, config) // Métodos que envían data
      : await axios[method](`${urlApi}/${url}`, config); // Métodos que solo requieren configuración

    // Retornar solo si es 200
    if (response.status !== 200) {
      console.error('Error:', response.data);
      return { failure: true, error: response.data.error };
    }
    return response.data;
  } catch (error) {
    // Si el error es 401 (token inválido o expirado), redirigir al login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token'); // Eliminar el token inválido
      window.location.href = '/'; // Redirigir al login
    }
    return { failure: true, error: error.message };
  }
};