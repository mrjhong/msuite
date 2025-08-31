// frontend/src/components/whatsapp/ScheduleMessage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ContactList from './ContactList';
import { apiCancelScheduledMessage, apiGetScheduledMessages, apiScheduleMessage, apiScheduleMessageWithFile } from '../../services/whatsappApiService';
import { useGlobalContext } from '../../context/GlobalContext';
import DatePicker from 'react-datepicker';
import { 
  FiCalendar, 
  FiClock, 
  FiPaperclip, 
  FiImage, 
  FiVideo, 
  FiFile, 
  FiX, 
  FiEye,
  FiTrash2,
  FiPlay
} from 'react-icons/fi';

const ScheduleMessage = () => {
  const { selectedContacts, selectedGroups, showNotification } = useGlobalContext();
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 2);
  return now;});
  const [repeat, setRepeat] = useState('none');
  const [customDays, setCustomDays] = useState(1);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sendMethod, setSendMethod] = useState('text'); // 'text', 'file', 'url'
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState(false);
  const fileInputRef = useRef(null);

   // Tipos de archivo soportados
  const supportedTypes = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    video: ['mp4', 'avi', 'mov', 'mkv', '3gp'],
    audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar']
  };


  const stableShowNotification = useCallback((message, type) => {
    if (error === false) {
      showNotification(message, type);
    }
  }, [showNotification, error]);

  useEffect(() => {
    const fetchScheduledMessages = async () => {
      try {
        const response = await apiGetScheduledMessages();
        if (response && response.success) {
          setScheduledMessages(response.data);
        }
      } catch (err) {
        setError(true);
        stableShowNotification('Error al obtener mensajes programados', 'error');
        console.error(err);
      }
    };

    fetchScheduledMessages();
  }, [stableShowNotification]);

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

    if (!message.trim() && sendMethod === 'text') {
      showNotification('Debes escribir un mensaje', 'warning');
      return;
    }

    if (sendMethod === 'url' && !mediaUrl.trim()) {
      showNotification('Debes proporcionar una URL de multimedia', 'warning');
      return;
    }

    if (sendMethod === 'file' && !selectedFile) {
      showNotification('Debes seleccionar un archivo', 'warning');
      return;
    }

    try {
      let mediaData = null;
      let response;
      if (sendMethod === 'url' && mediaUrl.trim()) {
        mediaData = {
          url: mediaUrl.trim(),
          filename: mediaUrl.split('/').pop() || 'media_file'
        };
        response = await apiScheduleMessage(mediaData);
      } else if (sendMethod === 'file' && selectedFile) {
        // Convertir archivo a base64 para almacenamiento
        const formData = new FormData();
        formData.append('media', selectedFile);
        formData.append('message', message);
        formData.append('scheduledTime', scheduledTime.toISOString());
        formData.append('repeat', repeat);
        if (repeat === 'custom') {
          formData.append('customDays', customDays);
        }
        formData.append('contacts', JSON.stringify(selectedContacts));
        formData.append('groups', JSON.stringify(selectedGroups));
        response = await apiScheduleMessageWithFile(formData);
      }

      

      if (response.success === false) {
        showNotification('Error al programar el mensaje', 'error');
        return;
      }

      setScheduledMessages([...scheduledMessages, response.scheduled]);
      showNotification('Mensaje programado correctamente', 'success');
      
      // Reset form
      setMessage('');
      removeFile();
      setSendMethod('text');
      setScheduledTime(new Date());
      setRepeat('none');
      setCustomDays(1);
    } catch (err) {
      console.error(err);
      showNotification('Error al programar el mensaje', 'error');
    }
  };

  const handleCancelMessage = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar este mensaje programado?')) {
      try {
        const response = await apiCancelScheduledMessage(id);
        if (response.success) {
          setScheduledMessages(scheduledMessages.filter((scheduled) => scheduled.id !== id));
          showNotification('Mensaje cancelado correctamente', 'success');
        } else {
          showNotification('Error al cancelar el mensaje', 'error');
        }
      } catch (err) {
        console.error(err);
        showNotification('Error al cancelar el mensaje', 'error');
      }
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
              <FiPlay className="h-8 w-8 text-green-600" />
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

  const renderMediaPreview = (mediaData) => {
    if (!mediaData) return null;

    const isImage = mediaData.mimetype?.startsWith('image/') || mediaData.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isVideo = mediaData.mimetype?.startsWith('video/') || mediaData.url?.match(/\.(mp4|avi|mov|mkv|3gp)$/i);
    const isAudio = mediaData.mimetype?.startsWith('audio/') || mediaData.url?.match(/\.(mp3|wav|ogg|m4a|aac)$/i);

    return (
      <div className="flex items-center space-x-2 mt-2 p-2 bg-gray-50 rounded">
        {isImage && <FiImage className="h-4 w-4 text-blue-500" />}
        {isVideo && <FiVideo className="h-4 w-4 text-purple-500" />}
        {isAudio && <FiPlay className="h-4 w-4 text-green-500" />}
        {!isImage && !isVideo && !isAudio && <FiFile className="h-4 w-4 text-gray-500" />}
        <span className="text-sm text-gray-600 truncate">
          📎 {mediaData.filename || 'Archivo multimedia'}
        </span>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="p-6 w-full">
        <div className="flex-1 bg-white p-6 shadow-lg rounded-lg overflow-hidden h-full flex flex-col">
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Programar Mensaje</h3>

            {/* Selector de tipo de mensaje */}
            <div className="mb-4">
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
                  <span>Con archivo</span>
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

            {/* Selector de archivo */}
            {sendMethod === 'file' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo
                </label>
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
              </div>
            )}

            {/* URL de multimedia */}
            {sendMethod === 'url' && (
              <div className="mb-4">
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
            <div className="relative mb-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                rows="2"
                placeholder=" "
                required={sendMethod === 'text'}
              />
              <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">
                {sendMethod !== 'text' ? 'Mensaje (opcional)' : 'Mensaje'}
              </label>
            </div>

            {/* Sección de programación */}
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Fecha y Hora:</label>
                <DatePicker
                  selected={scheduledTime}
                  onChange={(date) => setScheduledTime(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  popperClassName="z-50"
                  popperPlacement="auto"
                  minDate={new Date()} // No permitir fechas pasadas}
                  required
                  locale="es"
                  timeCaption="Hora"
                />
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Repetir:</label>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showAdvanced ? 'Ocultar opciones' : 'Mostrar opciones'}
                  </button>
                </div>

                {showAdvanced && (
                  <div className="space-y-2 pl-2">
                    {[
                      { value: 'none', label: 'No repetir' },
                      { value: 'daily', label: 'Diariamente' },
                      { value: 'weekly', label: 'Semanalmente' },
                      { value: 'monthly', label: 'Mensualmente' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`repeat-${option.value}`}
                          name="repeat"
                          value={option.value}
                          checked={repeat === option.value}
                          onChange={() => setRepeat(option.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`repeat-${option.value}`} className="text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="repeat-custom"
                        name="repeat"
                        value="custom"
                        checked={repeat === 'custom'}
                        onChange={() => setRepeat('custom')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="repeat-custom" className="text-sm text-gray-700">Cada</label>
                      <input
                        type="number"
                        min="1"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        className="w-16 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={repeat !== 'custom'}
                      />
                      <span className="text-sm text-gray-700">días</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition flex items-center justify-center space-x-2"
            >
              <FiCalendar className="h-5 w-5" />
              <span>Programar Mensaje</span>
            </button>
          </form>

          {/* Lista de mensajes programados */}
          <div className="mt-4 bg-white p-4 rounded-lg shadow-sm flex-1 overflow-y-auto max-h-[400px]">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Mensajes Programados</h3>
            {scheduledMessages.length > 0 ? (
              <div className="space-y-4">
                {scheduledMessages.map((scheduled) => (
                  <div key={scheduled.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-300">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <p className="text-gray-700">
                          <strong>Mensaje:</strong>
                          <span className="block truncate mt-1" style={{ maxWidth: '30rem' }}>
                            {scheduled.message || 'Sin mensaje de texto'}
                          </span>
                        </p>
                        
                        {/* Mostrar información de multimedia */}
                        {scheduled.mediaData && renderMediaPreview(scheduled.mediaData)}
                        
                        <div className="mt-2 space-y-1">
                          <p className="text-gray-500 text-sm">
                            <FiClock className="inline h-4 w-4 mr-1" />
                            <strong>Fecha:</strong> {new Date(scheduled.scheduledTime).toLocaleString()}
                          </p>
                          {scheduled.repeat !== 'none' && (
                            <p className="text-gray-500 text-sm">
                              <strong>Repetición:</strong> {scheduled.repeat === 'custom'
                                ? `Cada ${scheduled.customDays} días`
                                : scheduled.repeat.charAt(0).toUpperCase() + scheduled.repeat.slice(1)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelMessage(scheduled.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium ml-4 flex items-center space-x-1"
                      >
                        <FiTrash2 className="h-4 w-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No hay mensajes programados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ContactList />
    </div>
  );
};

export default ScheduleMessage;