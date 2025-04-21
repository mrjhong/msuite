import React, { useState, useEffect, useRef,useMemo,useCallback } from 'react';
import { debounce } from 'lodash';
import ContactList from './ContactList';
import { useGlobalContext } from '../../context/GlobalContext';
import { getChatHistory } from '../../services/whatsappMsgService';
import {initSocket} from '../../services/socket';

const ChatModule = () => {
  const socket = initSocket();
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const {  selectedContacts, selectedGroups,showNotification } = useGlobalContext();

  const messagesEndRef = useRef(null);

  // Función memoizada con useCallback para estabilizar la referencia
  const fetchChatHistory = useCallback(async (contact) => {
    if (!contact) return;
  
    try {
      const response = await getChatHistory({ contactId: contact });
      if (response.success) {
        setMessages(response.chatHistory);
      } else {
        showNotification('Error al cargar el historial de chat', 'error');
      }
    } catch (error) {
      console.error('Error al obtener el historial de chat:', error);
      showNotification('Error al cargar el historial de chat', 'error');
    }
  }, [ showNotification, setMessages]); // Todas las dependencias necesarias

  // Debounce memoizado que solo se recrea cuando fetchChatHistory cambia
  const debouncedFetchChatHistory = useMemo(
    () => debounce(fetchChatHistory, 300),
    [fetchChatHistory] // Dependencia estabilizada por useCallback
  );
  
  
  useEffect(() => {
    // Determinar el contacto/grupo seleccionado
    const contact = selectedContacts.length > 0 
      ? selectedContacts[0] 
      : selectedGroups.length > 0 
        ? selectedGroups[0] 
        : null;

    setSelectedContact(contact);
    debouncedFetchChatHistory(contact);

    // Limpieza al desmontar o cambiar dependencias
    return () => {
      debouncedFetchChatHistory.cancel();
    };
  }, [selectedContacts, selectedGroups, debouncedFetchChatHistory]);


  // Configurar listeners del socket
  useEffect(() => {
    if (!socket) return;


    socket.on('message_received', (message) => {
      if (message.senderId === selectedContact?.id || message.recipientId === selectedContact?.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('message_sent', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('message_received');
      socket.off('message_sent');
    };
  }, [socket, selectedContacts, selectedGroups, selectedContact]);

  // Auto-scroll al recibir nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact || !socket) return;

    socket.emit('message_sent', {
      chatId: selectedContact,
      message: newMessage,
    
    }, (response) => {
      if (response.success) {
        setNewMessage('');
      } else {
        alert(`Error: ${response.error}`);
      }
    });
  };



  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel de contactos (versión modificada para selección individual) */}

      <ContactList

      />


      {/* Área de mensajes */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Encabezado del chat */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-semibold">{selectedContact.name}</h2>
            </div>

            {/* Lista de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.id.includes('true') ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.id.includes('true')
                      ? 'bg-teal-950 text-white'
                      : 'bg-gray-200 text-gray-800'}`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para nuevo mensaje */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  onClick={handleSendMessage}
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Selecciona un contacto o grupo para comenzar a chatear</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatModule;