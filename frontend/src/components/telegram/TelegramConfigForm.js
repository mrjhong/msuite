import React, { useState, useEffect } from 'react';
import { 
  FiSave, 
  FiSend, 
  FiCheck, 
  FiX, 
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSettings
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalContext } from '../../context/GlobalContext';

const TelegramConfigForm = () => {
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    botToken: '',
    botUsername: '',
    description: '',
    isDefault: false
  });
  
  const [testData, setTestData] = useState({
    configId: '',
    testChatId: ''
  });

  const { showNotification } = useGlobalContext();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      // Simulación de API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setConfigs([
        {
          id: 1,
          name: 'Bot Principal',
          botUsername: '@mi_bot_principal',
          description: 'Bot principal para comunicaciones',
          isDefault: true,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      showNotification('Error al cargar configuraciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulación de API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (editingConfig) {
        // Update
        setConfigs(prev => prev.map(config => 
          config.id === editingConfig.id 
            ? { ...config, ...formData, updatedAt: new Date().toISOString() }
            : config
        ));
        showNotification('Configuración actualizada correctamente', 'success');
      } else {
        // Create
        const newConfig = {
          id: Date.now(),
          ...formData,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        setConfigs(prev => [...prev, newConfig]);
        showNotification('Configuración creada correctamente', 'success');
      }
      
      resetForm();
    } catch (error) {
      showNotification('Error al guardar configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (configId) => {
    if (!testData.testChatId) {
      showNotification('Ingresa un Chat ID para la prueba', 'warning');
      return;
    }

    setTestLoading(configId);
    
    try {
      // Simulación de API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification('Mensaje de prueba enviado correctamente', 'success');
    } catch (error) {
      showNotification('Error enviando mensaje de prueba', 'error');
    } finally {
      setTestLoading(null);
    }
  };

  const handleDelete = async (configId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta configuración?')) {
      return;
    }

    try {
      setConfigs(prev => prev.filter(config => config.id !== configId));
      showNotification('Configuración eliminada correctamente', 'success');
    } catch (error) {
      showNotification('Error eliminando configuración', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      botToken: '',
      botUsername: '',
      description: '',
      isDefault: false
    });
    setEditingConfig(null);
    setShowForm(false);
  };

  const startEdit = (config) => {
    setFormData({
      name: config.name,
      botToken: '••••••••••••••••••••',
      botUsername: config.botUsername,
      description: config.description,
      isDefault: config.isDefault
    });
    setEditingConfig(config);
    setShowForm(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="p-6 w-full">
        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FiSettings className="text-blue-600" />
                  Configuración de Telegram
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona tus bots de Telegram para envío de mensajes automatizados
                </p>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                Nueva Configuración
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-50 rounded-xl p-6 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingConfig ? 'Editar Configuración' : 'Nueva Configuración'}
                    </h2>
                    <button
                      onClick={resetForm}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la Configuración *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bot Principal"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username del Bot
                      </label>
                      <input
                        type="text"
                        value={formData.botUsername}
                        onChange={(e) => setFormData(prev => ({ ...prev, botUsername: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="@mi_bot"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Token del Bot *
                      </label>
                      <input
                        type="password"
                        value={formData.botToken}
                        onChange={(e) => setFormData(prev => ({ ...prev, botToken: e.target.value }))}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Obtén el token de @BotFather en Telegram
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descripción opcional de la configuración"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Establecer como configuración por defecto
                        </span>
                      </label>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <FiSave className="h-4 w-4" />
                        )}
                        {editingConfig ? 'Actualizar' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Configurations List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Configuraciones Existentes ({configs.length})
              </h3>

              {loading && configs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando configuraciones...</p>
                </div>
              ) : configs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <FiSettings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay configuraciones
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Crea tu primera configuración de Telegram para comenzar
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <FiPlus className="h-4 w-4" />
                    Crear Primera Configuración
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {configs.map((config) => (
                    <motion.div
                      key={config.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {config.name}
                            </h4>
                            {config.isDefault && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Por defecto
                              </span>
                            )}
                          </div>
                          {config.botUsername && (
                            <p className="text-sm text-gray-600 mt-1">
                              {config.botUsername}
                            </p>
                          )}
                          {config.description && (
                            <p className="text-sm text-gray-500 mt-2">
                              {config.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            config.isActive ? 'bg-green-400' : 'bg-gray-300'
                          }`} />
                          <span className="text-xs text-gray-500">
                            {config.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>

                      {/* Test Section */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Probar Configuración
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={testData.configId === config.id ? testData.testChatId : ''}
                            onChange={(e) => setTestData({ 
                              configId: config.id, 
                              testChatId: e.target.value 
                            })}
                            placeholder="Chat ID o @username"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <button
                            onClick={() => handleTest(config.id)}
                            disabled={testLoading === config.id}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {testLoading === config.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <FiSend className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          Creado: {new Date(config.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(config)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEdit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramConfigForm;