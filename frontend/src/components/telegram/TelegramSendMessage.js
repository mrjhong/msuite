import React, { useState, useEffect } from 'react';
import { 
  FiSend, 
  FiImage, 
  FiFile, 
  FiMessageSquare,
  FiUsers,
  FiPlus,
  FiX,
  FiCheck
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalContext } from '../../context/GlobalContext';

const TelegramSendMessage = () => {
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState('');
  const [chatIds, setChatIds] = useState(['']);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendResults, setSendResults] = useState([]);
  
  const { showNotification } = useGlobalContext();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      // Simulación de API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      setConfigs([
        {
          id: 1,
          name: 'Bot Principal',
          botUsername: '@mi_bot_principal',
          isDefault: true,
          isActive: true
        },
        {
          id: 2,
          name: 'Bot Secundario',
          botUsername: '@mi_bot_secundario',
          isDefault: false,
          isActive: true
        }
      ]);
      
      // Seleccionar configuración por defecto
      setSelectedConfig('1');
    } catch (error) {
      showNotification('Error al cargar configuraciones', 'error');
    }
  };

  const addChatId = () => {
    setChatIds(prev => [...prev, '']);
  };

  const removeChatId = (index) => {
    setChatIds(prev => prev.filter((_, i) => i !== index));
  };

  const updateChatId = (index, value) => {
    setChatIds(prev => prev.map((chat, i) => i === index ? value : chat));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validChatIds = chatIds.filter(id => id.trim());
    if (validChatIds.length === 0) {
      showNotification('Debe especificar al menos un Chat ID', 'warning');
      return;
    }

    if (!message.trim() && messageType === 'text') {
      showNotification('El mensaje no puede estar vacío', 'warning');
      return;
    }

    if ((messageType === 'photo' || messageType === 'document') && !mediaUrl.trim()) {
      showNotification('Debe especificar una URL de archivo', 'warning');
      return;
    }

    setLoading(true);
    setSendResults([]);

    try {
      // Simulación de envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock results
      const results = validChatIds.map(chatId => ({
        chatId,
        success: Math.random() > 0.2, // 80% success rate
        messageId: Math.floor(Math.random() * 10000),
        error: Math.random() > 0.8 ? 'Chat not found' : null
      }));

      setSendResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;
      
      if (errorCount === 0) {
        showNotification(`Mensajes enviados correctamente a ${successCount} chats`, 'success');
      } else {
        showNotification(`${successCount} enviados, ${errorCount} fallaron`, 'warning');
      }

      // Reset form on success
      if (errorCount === 0) {
        setMessage('');
        setMediaUrl('');
        setChatIds(['']);
      }

    } catch (error) {
      showNotification('Error enviando mensajes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const messageTypeOptions = [
    { value: 'text', label: 'Texto', icon: FiMessageSquare },
    { value: 'photo', label: 'Foto', icon: FiImage },
    { value: 'document', label: 'Documento', icon: FiFile }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="p-6 w-full">
        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiSend className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Enviar Mensaje de Telegram
                </h1>
                <p className="text-gray-600 mt-1">
                  Envía mensajes instantáneos a través de tus bots de Telegram
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
              
              {/* Configuration Selection */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuración del Bot
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Bot
                    </label>
                    <select
                      value={selectedConfig}
                      onChange={(e) => setSelectedConfig(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar configuración...</option>
                      {configs.map((config) => (
                        <option key={config.id} value={config.id}>
                          {config.name} {config.isDefault ? '(Por defecto)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Mensaje
                    </label>
                    <div className="flex gap-2">
                      {messageTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setMessageType(option.value)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                              messageType === option.value
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat IDs */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FiUsers className="h-5 w-5" />
                    Destinatarios
                  </h3>
                  <button
                    type="button"
                    onClick={addChatId}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                  >
                    <FiPlus className="h-4 w-4" />
                    Agregar Chat
                  </button>
                </div>

                <div className="space-y-3">
                  {chatIds.map((chatId, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={chatId}
                        onChange={(e) => updateChatId(index, e.target.value)}
                        placeholder="Chat ID, @username o número de teléfono"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {chatIds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChatId(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Puedes usar Chat IDs numéricos, usernames (@usuario) o números de teléfono
                </p>
              </div>

              {/* Message Content */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contenido del Mensaje
                </h3>

                {/* Media URL for photo/document */}
                {(messageType === 'photo' || messageType === 'document') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL del {messageType === 'photo' ? 'Archivo/Imagen' : 'Documento'}
                    </label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://ejemplo.com/archivo.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {/* Message Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {messageType === 'text' ? 'Mensaje' : 'Descripción/Caption (Opcional)'}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Escribe tu mensaje aquí..."
                    required={messageType === 'text'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Soporta formato HTML básico: &lt;b&gt;negrita&lt;/b&gt;, &lt;i&gt;cursiva&lt;/i&gt;, &lt;code&gt;código&lt;/code&gt;
                  </p>
                </div>
              </div>

              {/* Send Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-lg font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FiSend className="h-5 w-5" />
                      Enviar Mensaje
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Results */}
            <AnimatePresence>
              {sendResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-4xl mx-auto mt-8 bg-white border border-gray-200 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resultados del Envío
                  </h3>
                  <div className="space-y-3">
                    {sendResults.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className={`p-1 rounded-full ${
                          result.success ? 'bg-green-200' : 'bg-red-200'
                        }`}>
                          {result.success ? (
                            <FiCheck className="h-3 w-3 text-green-600" />
                          ) : (
                            <FiX className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">
                            {result.chatId}
                          </span>
                          {result.success ? (
                            <span className="text-sm text-green-600 ml-2">
                              Enviado (ID: {result.messageId})
                            </span>
                          ) : (
                            <span className="text-sm text-red-600 ml-2">
                              Error: {result.error}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramSendMessage;