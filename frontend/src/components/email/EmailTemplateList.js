import React, { useState, useEffect } from 'react';
import { 
  FiMail, 
  FiEye, 
  FiEdit3, 
  FiTrash2, 
  FiPlus, 
  FiSearch,
  FiCalendar,
  FiUser,
  FiFilter
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGetEmailTemplates } from '../../services/emailApiService';
import { useGlobalContext } from '../../context/GlobalContext';
import ModalPreview from '../ModalPreview';

const EmailTemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filterBy, setFilterBy] = useState('all');
  const { showNotification } = useGlobalContext();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiGetEmailTemplates();
      if (response.success) {
        setTemplates(response.data);
      } else {
        showNotification('Error al cargar plantillas', 'error');
      }
    } catch (error) {
      showNotification('Error al cargar plantillas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleEdit = (template) => {
    // Implementar edición
    showNotification('Función de edición en desarrollo', 'info');
  };

  const handleDelete = (template) => {
    // Implementar eliminación
    if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      showNotification('Función de eliminación en desarrollo', 'info');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="p-6 w-full">
          <div className="flex-1 bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="p-6 w-full">
        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FiMail className="text-purple-600" />
                  Plantillas de Email
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona y visualiza tus plantillas de correo electrónico
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Búsqueda */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar plantillas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>

                {/* Botón nueva plantilla */}
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap">
                  <FiPlus className="h-4 w-4" />
                  Nueva Plantilla
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiMail className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Filtradas</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredTemplates.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiFilter className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recientes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {templates.filter(t => {
                        const created = new Date(t.createdAt);
                        const week = new Date();
                        week.setDate(week.getDate() - 7);
                        return created > week;
                      }).length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiCalendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FiMail className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron plantillas' : 'No hay plantillas'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza creando tu primera plantilla de email'
                  }
                </p>
                {!searchTerm && (
                  <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto">
                    <FiPlus className="h-4 w-4" />
                    Crear Primera Plantilla
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 group"
                    >
                      {/* Card Header */}
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                              {template.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {template.subject}
                            </p>
                          </div>
                          <div className="ml-3 p-2 bg-purple-100 rounded-lg">
                            <FiMail className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <FiUser className="h-4 w-4" />
                            <span>ID: {template.id}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiCalendar className="h-4 w-4" />
                            <span>
                              {new Date(template.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreview(template)}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <FiEye className="h-4 w-4" />
                            Vista Previa
                          </button>

                          <button
                            onClick={() => handleEdit(template)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEdit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(template)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Última modificación: {new Date(template.updatedAt).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Activa
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Vista Previa */}
      <ModalPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        htmlContent={selectedTemplate?.htmlContent || ''}
        title={`Vista previa: ${selectedTemplate?.name || ''}`}
      />
    </div>
  );
};

export default EmailTemplateList;