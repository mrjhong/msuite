import React, { useState, useEffect, useCallback } from 'react';
import ContactList from './ContactList';
import { useGlobalContext } from '../../context/GlobalContext';
import { 
  apiScheduleAction, 
  apiGetScheduledActions,
  apiCancelScheduledAction 
} from '../../services/whatsappApiService';

const ScheduledActions = () => {
    const { selectedContacts, selectedGroups } = useGlobalContext();
    const [message, setMessage] = useState('');
    const [scheduledActions, setScheduledActions] = useState([]);
    const [trigger, setTrigger] = useState('group_join');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { setBlurContacts, blurContacts } = useGlobalContext();

    // Memoized fetch function
    const fetchScheduledActions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiGetScheduledActions();
            setScheduledActions(response.data);
            setError(null);
        } catch (err) {
            setError('Error al cargar acciones programadas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load actions on mount
    useEffect(() => {
        fetchScheduledActions();
    }, [fetchScheduledActions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!message.trim()) {
            setError('Debes ingresar un mensaje');
            return;
        }
        
        if (!blurContacts && selectedContacts.length === 0 && selectedGroups.length === 0) {
            setError('Debes seleccionar al menos un contacto o grupo o activar "Cualquiera"');
            return;
        }

        try {
            setLoading(true);
            await apiScheduleAction({ 
                contacts: blurContacts ? [] : selectedContacts, 
                groups: blurContacts ? [] : selectedGroups, 
                message, 
                trigger 
            });
            
            // Refresh the list
            await fetchScheduledActions();
            setMessage('');
            setError(null);
        } catch (err) {
            setError('Error al programar la acción');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAction = async (actionId) => {
        try {
            setLoading(true);
            await apiCancelScheduledAction(actionId);
            await fetchScheduledActions();
        } catch (err) {
            setError('Error al cancelar la acción');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatTrigger = (trigger) => {
        const triggers = {
            'group_join': 'Cuando alguien se une',
            'group_leave': 'Cuando alguien sale',
            'new_message': 'Al recibir mensaje'
        };
        return triggers[trigger] || trigger;
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="p-6 w-full">
                <div className="flex-1 bg-white p-6 shadow-lg rounded-lg overflow-hidden h-full flex flex-col">
                    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Acciones Programadas</h3>
                        
                        {error && (
                            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <div className="relative mb-4">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                                rows="2"
                                placeholder=" "
                                disabled={loading}
                                required
                            />
                            <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">
                                Mensaje
                            </label>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Acción</label>
                            <select
                                value={trigger}
                                onChange={(e) => setTrigger(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                disabled={loading}
                            >
                                <option value="group_join">Cuando alguien se une al grupo</option>
                                <option value="group_leave">Cuando alguien deja el grupo</option>
                                <option value="new_message">Cuando se recibe un mensaje</option>
                            </select>
                        </div>

                        {trigger === 'new_message' && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Destinatarios</label>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            checked={blurContacts}
                                            onChange={() => setBlurContacts(true)}
                                            className="form-radio h-4 w-4 text-blue-600"
                                            disabled={loading}
                                        />
                                        <span className="ml-2">Cualquiera</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            checked={!blurContacts}
                                            onChange={() => setBlurContacts(false)}
                                            className="form-radio h-4 w-4 text-blue-600"
                                            disabled={loading}
                                        />
                                        <span className="ml-2">Solo seleccionados</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? 'Procesando...' : 'Programar Acción'}
                        </button>
                    </form>

                    <div className="mt-4 bg-white p-4 rounded-lg shadow-sm flex-1 overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Acciones Activas</h3>
                        
                        {loading ? (
                            <p className="text-center text-gray-500">Cargando...</p>
                        ) : scheduledActions.length === 0 ? (
                            <p className="text-gray-500 text-center">No hay acciones programadas</p>
                        ) : (
                            <div className="space-y-3">
                                {scheduledActions.map((action) => (
                                    <div key={action.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-medium">{formatTrigger(action.trigger)}</p>
                                                <p className="text-sm text-gray-600 truncate">{action.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {action.contacts.length > 0 && `Contactos: ${action.contacts.length}`}
                                                    {action.groups.length > 0 && ` | Grupos: ${action.groups.length}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleCancelAction(action.id)}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                disabled={loading}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ContactList />
        </div>
    );
};

export default ScheduledActions;