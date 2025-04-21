import React, { useState, } from 'react';
import { apiSendMessage } from '../../services/whatsappApiService';
import ContactList from './ContactList';
import { useGlobalContext } from '../../context/GlobalContext';

const SendMessage = () => {
  const [message, setMessage] = useState('');
  const { selectedContacts, selectedGroups ,showNotification} = useGlobalContext();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await apiSendMessage({ contacts: selectedContacts, groups: selectedGroups, message });
    if (response.failure) {
      showNotification('Error al enviar el mensaje', 'error');
      return;
    }
    showNotification('Mensaje enviado', 'success');
  };

  return (
    <div className="flex">
      {/* Sección de Mensajes - Izquierda */}
      <div className="p-6 w-full" >
        <div className="flex-1 bg-white p-6 shadow-md rounded-lg overflow-hidden h-full">
          <h2 className="text-2xl font-semibold mb-4">Enviar Mensaje</h2>

          {/* Campo de mensaje */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Mensaje</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="5"
              required
            />
          </div>

          {/* Botón de enviar */}
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition"
            onClick={handleSubmit}
          >
            Enviar
          </button>
        </div>
      </div>
      <ContactList />
    </div>
  );
};

export default SendMessage;