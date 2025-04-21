import React, { useState, useEffect } from 'react';
import { apiScheduleEmail, apiGetEmailTemplates, apiGetEmailConfigs } from '../../services/emailApiService';
import { FiCalendar, FiClock, FiMail, FiServer, FiUsers } from 'react-icons/fi';
import { useGlobalContext } from '../../context/GlobalContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const EmailScheduler = () => {
  const [templateId, setTemplateId] = useState('');
  const [configId, setConfigId] = useState('');
  const [recipients, setRecipients] = useState('');
  const [scheduleType, setScheduleType] = useState('once');
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [templates, setTemplates] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { showNotification } = useGlobalContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, configsRes] = await Promise.all([
          apiGetEmailTemplates(),
          apiGetEmailConfigs()
        ]);

        if (templatesRes.success) setTemplates(templatesRes.data);
        if (configsRes.success) setConfigs(configsRes.data);
      } catch (error) {
        showNotification('Error al cargar datos', 'error');
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [showNotification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const recipientsArray = recipients.split('\n')
        .map(r => r.trim())
        .filter(r => r)
        .map(email => ({ email }));

  

      const result = await apiScheduleEmail({
        templateId,
        configId,
        recipients: recipientsArray,
        scheduleType,
        scheduledAt
      });

      if (result.success) {
        showNotification('Correo programado exitosamente', 'success');
        // Reset form
        setTemplateId('');
        setConfigId('');
        setRecipients('');
        setScheduleType('once');
        setScheduledAt(new Date());
      } else {
        showNotification(result.error, 'error');
      }
    } catch (error) {
      showNotification('Error al programar el correo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="p-6 w-full">
        <div className="flex-1 bg-white p-6 shadow-lg rounded-lg overflow-hidden h-full flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Programar Correo Electrónico</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiMail className="mr-2" /> Plantilla de Correo
                  </label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccionar plantilla...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiServer className="mr-2" /> Configuración SMTP
                  </label>
                  <select
                    value={configId}
                    onChange={(e) => setConfigId(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccionar configuración...</option>
                    {configs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name} - {config.provider || 'Personalizado'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiUsers className="mr-2" /> Destinatarios (uno por línea)
                </label>
                <textarea
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="ejemplo1@dominio.com\nejemplo2@dominio.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiCalendar className="mr-2" /> Tipo de Programación
                  </label>
                  <select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="once">Una vez</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensualmente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiClock className="mr-2" /> Fecha y Hora
                  </label>


                  <DatePicker
                    selected={scheduledAt}
                    onChange={(date) => setScheduledAt(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    popperClassName="z-50" // Importante para el dropdown
                    popperPlacement="auto"
                    minDate={new Date()}
                    required
                    locale="es" // Si necesitas español
                    timeCaption="Hora"
                  />
                </div>
              </div>

             

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isLoading ? 'Programando...' : 'Programar Correo'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailScheduler;