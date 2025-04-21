import { io } from 'socket.io-client';

let socket;
const urlsocket = process.env.REACT_APP_URL_SOCKET 
export const initSocket = () => {
  const token = localStorage.getItem('token');
  if (socket) socket.disconnect(); // Cierra la conexión anterior si existe

  socket = io(urlsocket, {
    auth: {
      token: token
    }
  });

  return socket;
};

