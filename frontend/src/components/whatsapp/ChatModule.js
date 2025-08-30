// frontend/src/components/whatsapp/ChatModule.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import ContactList from './ContactList';
import { useGlobalContext } from '../../context/GlobalContext';
import { getChatHistory } from '../../services/whatsappMsgService';
import { initSocket } from '../../services/socket';
import { 
  FiImage, 
  FiVideo, 
  FiFile, 
  FiMic, 
  FiMapPin, 
  FiUser, 
  FiDownload,
  FiPlay,
  FiPause
} from 'react-icons/fi';

const MessageMediaViewer = ({ media, message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const handleAudioPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!media) return null;

  // Error en multimedia
  if (media.error) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
        <FiFile className="h-5 w-5 text-red-500" />
        <span className="text-sm text-red-700">{media.error}</span>
      </div>
    );
  }

  // Imagen
  if (media.mimetype?.startsWith('image/')) {
    return (
      <div className="max-w-xs">
        {media.data ? (
          <img 
            src={`data:${media.mimetype};base64,${media.data}`}
            alt={media.filename}
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              // Abrir en modal o nueva ventana
              const newWindow = window.open();
              newWindow.document.write(`
                <img src="data:${media.mimetype};base64,${media.data}" style="max-width: 100%; height: auto;">
              `);
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-64 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <FiImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Imagen: {media.filename}</p>
              <p className="text-xs text-gray-400">{formatFileSize(media.size)}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Video
  if (media.mimetype?.startsWith('video/')) {
    return (
      <div className="max-w-xs">
        {media.data ? (
          <video 
            ref={videoRef}
            controls
            className="rounded-lg max-w-full h-auto"
            preload="metadata"
          >
            <source src={`data:${media.mimetype};base64,${media.data}`} type={media.mimetype} />
            Tu navegador no soporta videos.
          </video>
        ) : (
          <div className="flex items-center justify-center w-64 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <FiVideo className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Video: {media.filename}</p>
              <p className="text-xs text-gray-400">{formatFileSize(media.size)}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Audio
  if (media.mimetype?.startsWith('audio/')) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200 max-w-xs">
        {media.data ? (
          <>
            <button
              onClick={handleAudioPlayPause}
              className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              {isPlaying ? <FiPause className="h-5 w-5" /> : <FiPlay className="h-5 w-5 ml-1" />}
            </button>
            <audio
              ref={audioRef}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={`data:${media.mimetype};base64,${media.data}`} type={media.mimetype} />
            </audio>
          </>
        ) : (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <FiMic className="h-5 w-5 text-green-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{media.filename}</p>
          <p className="text-xs text-gray-500">{formatFileSize(media.size)}</p>
        </div>
      </div>
    );
  }

  // Documento
  return (
    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-xs">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
        <FiFile className="h-5 w-5 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{media.filename}</p>
        <p className="text-xs text-gray-500">{formatFileSize(media.size)}</p>
      </div>
      {media.data && (
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.href = `data:${media.mimetype};base64,${media.data}`;
            link.download = media.filename;
            link.click();
          }}
          className="flex-shrink-0 p-2 text-blue-500 hover:text-blue-700 transition-colors"
        >
          <FiDownload className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isFromMe = message.id.includes('true') || message.fromMe;
  
  const renderMessageContent = () => {
    // Mensaje con ubicación
    if (message.location) {
      return (
        <div className="flex items-center space-x-2">
          <FiMapPin className="h-4 w-4" />
          <div>
            <p className="text-sm font-medium">Ubicación compartida</p>
            {message.location.description && (
              <p className="text-xs opacity-75">{message.location.description}</p>
            )}
          </div>
        </div>
      );
    }

    // Mensaje con contacto
    if (message.contact) {
      return (
        <div className="flex items-center space-x-2">
          <FiUser className="h-4 w-4" />
          <div>
            <p className="text-sm font-medium">Contacto: {message.contact.name}</p>
          </div>
        </div>
      );
    }

    // Mensaje con multimedia
    if (message.hasMedia && message.media) {
      return (
        <div className="space-y-2">
          <MessageMediaViewer media={message.media} message={message} />
          {message.content && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    // Mensaje de texto normal
    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isFromMe
            ? 'bg-teal-600 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {renderMessageContent()}
        <p className="text-xs opacity-70 mt-1">
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

const ChatModule = () => {
  const socket = initSocket();
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { selectedContacts, selectedGroups, showNotification } = useGlobalContext();
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
  }, [showNotification, setMessages]);

  // Debounce memoizado que solo se recrea cuando fetchChatHistory cambia
  const debouncedFetchChatHistory = useMemo(
    () => debounce(fetchChatHistory, 300),
    [fetchChatHistory]
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
        showNotification(`Error: ${response.error}`, 'error');
      }
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel de contactos */}
      <ContactList />

      {/* Área de mensajes */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Encabezado del chat */}
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedContact.name || selectedContact}
              </h2>
              <p className="text-sm text-gray-500">
                {messages.length} mensajes cargados
              </p>
            </div>

            {/* Lista de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">💬</p>
                    <p>No hay mensajes en esta conversación</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble key={`${message.id}-${index}`} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para nuevo mensaje */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Enviar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Los archivos multimedia se mostrarán automáticamente en la conversación
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500 max-w-md">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Selecciona una conversación</h3>
              <p className="text-gray-400">
                Elige un contacto o grupo de la lista para comenzar a chatear y ver el historial de mensajes con soporte completo para multimedia.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatModule;