import React, { useState, useEffect ,useCallback} from 'react';
import ContactList from './ContactList';
import { apiCancelScheduledMessage, apiGetScheduledMessages, apiScheduleMessage } from '../../services/whatsappApiService';
import { useGlobalContext } from '../../context/GlobalContext';
import DatePicker from 'react-datepicker';

const ScheduleMessage = () => {
  const { selectedContacts, selectedGroups ,showNotification} = useGlobalContext();
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [repeat, setRepeat] = useState('none');
  const [customDays, setCustomDays] = useState(1);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  //const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const stableShowNotification = useCallback((message, type) => {
    if (error === false){
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
      //finally {
      //   //setLoading(false);
      // }
    };

    fetchScheduledMessages();
  }, [stableShowNotification]);


  const handleSubmit = async (e) => {
    e.preventDefault();

    await apiScheduleMessage({
      contacts: selectedContacts,
      groups: selectedGroups,
      message,
      scheduledTime,
      repeat,
      customDays: repeat === 'custom' ? customDays : null
    }).then(response => {
      if (response.success === false) {
        showNotification('Error al programar el mensaje', 'error');
        return;
      }
      setScheduledMessages([...scheduledMessages, response.scheduled])
      showNotification('Mensaje programado correctamente', 'success');
    }
    ).catch(err => {
      console.error(err);
      showNotification('Error al programar el mensaje', 'error');
    }
    );
    setMessage('');
  };

  const handleCancelMesage = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar este mensaje programado?')) {
      try {
        const response = await apiCancelScheduledMessage(id);
        if (response.success) {
          setScheduledMessages(scheduledMessages.filter((scheduled) => scheduled.id !== id));
          alert('Mensaje cancelado correctamente');
        } else {
          alert('Error al cancelar el mensaje');
        }
      } catch (err) {
        console.error(err);
        alert('Error al cancelar el mensaje');
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="p-6 w-full">
        <div className="flex-1 bg-white p-6 shadow-lg rounded-lg overflow-hidden h-full flex flex-col">
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Programar Mensaje</h3>

            {/* Campo de mensaje */}
            <div className="relative mb-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                rows="2"
                placeholder=" "
                required
              />
              <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">
                Mensaje
              </label>
            </div>

            {/* Sección compacta de programación */}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    popperClassName="z-50" // Importante para el dropdown
                    popperPlacement="auto"
                    minDate={new Date()}
                    required
                    locale="es" // Si necesitas español
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
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="repeat-none"
                        name="repeat"
                        value="none"
                        checked={repeat === 'none'}
                        onChange={() => setRepeat('none')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="repeat-none" className="text-sm text-gray-700">No repetir</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="repeat-daily"
                        name="repeat"
                        value="daily"
                        checked={repeat === 'daily'}
                        onChange={() => setRepeat('daily')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="repeat-daily" className="text-sm text-gray-700">Diariamente</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="repeat-weekly"
                        name="repeat"
                        value="weekly"
                        checked={repeat === 'weekly'}
                        onChange={() => setRepeat('weekly')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="repeat-weekly" className="text-sm text-gray-700">Semanalmente</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="repeat-monthly"
                        name="repeat"
                        value="monthly"
                        checked={repeat === 'monthly'}
                        onChange={() => setRepeat('monthly')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="repeat-monthly" className="text-sm text-gray-700">Mensualmente</label>
                    </div>

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
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition"
            >
              Programar Mensaje
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
                      <div>
                        <p className="text-gray-700">
                          <strong>Mensaje:</strong>
                          <span className="block truncate" style={{ maxWidth: '30rem' }}>{scheduled.message}</span>
                        </p>
                        <p className="text-gray-500">
                          <strong>Fecha:</strong> {new Date(scheduled.scheduledTime).toLocaleString()}
                        </p>
                        {scheduled.repeat !== 'none' && (
                          <p className="text-gray-500">
                            <strong>Repetición:</strong> {scheduled.repeat === 'custom'
                              ? `Cada ${scheduled.customDays} días`
                              : scheduled.repeat.charAt(0).toUpperCase() + scheduled.repeat.slice(1)}
                          </p>
                        )}
                      </div>
                      <button
                         onClick={() => handleCancelMesage(scheduled.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      //disabled={loading}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No hay mensajes programados.</p>
            )}
          </div>
        </div>
      </div>
      <ContactList />
    </div>
  );
};

export default ScheduleMessage;