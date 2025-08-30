// frontend/src/components/whatsapp/SendMessage.js
import React, { useState, useRef } from 'react';
import { apiSendMessage, apiSendMessageWithFile } from '../../services/whatsappApiService';
import ContactList from './ContactList';
import { useGlobalContext } from '../../context/GlobalContext';
import { 
  FiPaperclip, 
  FiImage, 
  FiVideo, 
  FiFile, 
  FiMic, 
  FiX,
  FiSend,
  FiEye,
  FiDownload
} from 'react-icons/fi';

const SendMessage = () => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [sendMethod, setSendMethod] = useState('text'); // 'text', 'file', 'url'
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const { selectedContacts, selectedGroups, showNotification } = useGlobalContext();

  // Tipos de archivo soportados
  const supportedTypes = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    video: ['mp4', 'avi', 'mov', 'mkv', '3gp'],
    audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar']
  };

  const getFileType = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    for (const [type, extensions] of Object.entries(supportedTypes)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }
    return 'document';
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tamaño (64MB máximo para WhatsApp)
    if (file.size > 64 * 1024 * 1024) {
      showNotification('El archivo es demasiado grande. Máximo 64MB permitido.', 'error');
      return;
    }

    setSelectedFile(file);
    
    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setMediaUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedContacts.length === 0 && selectedGroups.length === 0) {
      showNotification('Selecciona al menos un contacto o grupo', 'warning');
      return;
    }

    if (!message.trim() && !selectedFile && !mediaUrl.trim()) {
      showNotification('Escribe un mensaje o selecciona un archivo', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (sendMethod === 'file' && selectedFile) {
        // Envío con archivo local
        const formData = new FormData();
        formData.append('media', selectedFile);
        formData.append('message', message);
        formData.append('contacts', JSON.stringify(selectedContacts));
        formData.append('groups', JSON.stringify(selectedGroups));

        response = await apiSendMessageWithFile(formData);
      } else if (sendMethod === 'url' && mediaUrl.trim()) {
        // Envío con URL de multimedia
        const mediaData = {
          url: mediaUrl.trim(),
          filename: mediaUrl.split('/').pop() || 'media_file'
        };

        response = await apiSendMessage({
          contacts: selectedContacts,
          groups: selectedGroups,
          message,
          mediaData
        });
      } else {
        // Envío solo texto
        response = await apiSendMessage({
          contacts: selectedContacts,
          groups: selectedGroups,
          message
        });
      }

      if (response.success) {
        showNotification('Mensaje enviado correctamente', 'success');
        setMessage('');
        removeFile();
        setSendMethod('text');
      } else {
        showNotification(response.error || 'Error al enviar el mensaje', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Error al enviar el mensaje', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFilePreview = () => {
    if (!selectedFile && !mediaUrl) return null;

    const file = selectedFile;
    const isImage = file?.type?.startsWith('image/') || mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isVideo = file?.type?.startsWith('video/') || mediaUrl.match(/\.(mp4|avi|mov|mkv|3gp)$/i);
    const isAudio = file?.type?.startsWith('audio/') || mediaUrl.match(/\.(mp3|wav|ogg|m4a|aac)$/i);

    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-700">
            {sendMethod === 'file' ? 'Archivo seleccionado' : 'Multimedia desde URL'}
          </h4>
          <button
            onClick={removeFile}
            className="text-red-500 hover:text-red-700 p-1"
            type="button"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {isImage && filePreview && (
            <img 
              src={filePreview} 
              alt="Preview" 
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          
          {isVideo && (
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiVideo className="h-8 w-8 text-blue-600" />
            </div>
          )}
          
          {isAudio && (
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
              <FiMic className="h-8 w-8 text-green-600" />
            </div>
          )}
          
          {!isImage && !isVideo && !isAudio && (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiFile className="h-8 w-8 text-gray-600" />
            </div>
          )}

          <div className="flex-1">
            <p className="font-medium text-sm text-gray-900">
              {file?.name || mediaUrl.split('/').pop()}
            </p>
            {file && (
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex">
      <div className="p-6 w-full">
        <div className="flex-1 bg-white p-6 shadow-lg rounded-lg overflow-hidden h-full">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Enviar Mensaje</h2>

          {/* Selector de método de envío */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de mensaje
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setSendMethod('text');
                  removeFile();
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  sendMethod === 'text' 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>📝</span>
                <span>Solo texto</span>
              </button>

              <button
                type="button"
                onClick={() => setSendMethod('file')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  sendMethod === 'file' 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FiPaperclip className="h-4 w-4" />
                <span>Subir archivo</span>
              </button>

              <button
                type="button"
                onClick={() => setSendMethod('url')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  sendMethod === 'url' 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FiEye className="h-4 w-4" />
                <span>Desde URL</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de archivo */}
            {sendMethod === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FiPaperclip className="h-4 w-4" />
                    <span>Seleccionar archivo</span>
                  </button>
                  <span className="text-sm text-gray-500">
                    Máximo 64MB - Imágenes, videos, audios, documentos
                  </span>
                </div>
              </div>
            )}

            {/* URL de multimedia */}
            {sendMethod === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del archivo multimedia
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            )}

            {/* Preview del archivo */}
            {renderFilePreview()}

            {/* Campo de mensaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {sendMethod !== 'text' ? 'Mensaje (opcional)' : 'Mensaje'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder={sendMethod !== 'text' ? 'Descripción o mensaje adicional...' : 'Escribe tu mensaje...'}
                required={sendMethod === 'text'}
              />
            </div>

            {/* Información de destinatarios */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Destinatarios seleccionados:</h4>
              <div className="text-sm text-blue-700">
                {selectedContacts.length > 0 && (
                  <p>📱 Contactos: {selectedContacts.length}</p>
                )}
                {selectedGroups.length > 0 && (
                  <p>👥 Grupos: {selectedGroups.length}</p>
                )}
                {selectedContacts.length === 0 && selectedGroups.length === 0 && (
                  <p className="text-orange-600">⚠️ No hay destinatarios seleccionados</p>
                )}
              </div>
            </div>

            {/* Botón de enviar */}
            <button
              type="submit"
              disabled={isLoading || (selectedContacts.length === 0 && selectedGroups.length === 0)}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <FiSend className="h-5 w-5" />
                  <span>Enviar Mensaje</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      <ContactList />
    </div>
  );
};

export default SendMessage;