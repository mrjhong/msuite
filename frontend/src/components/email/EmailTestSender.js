import React, { useState, useEffect } from 'react';

import { apiSendTestEmail, apiGetEmailTemplates, apiGetEmailConfigs } from '../../services/emailApiService';
import { FiMail, FiSend } from 'react-icons/fi';
import { useGlobalContext } from '../../context/GlobalContext';

const EmailTestSender = () => {
    const [templateId, setTemplateId] = useState('');
    const [configId, setConfigId] = useState('');
    const [recipient, setRecipient] = useState('');
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
           

            const result = await apiSendTestEmail({
                templateId,
                configId,
                recipient
                
            });

            if (result.success) {
                showNotification('Correo de prueba enviado exitosamente', 'success');
            } else {
                showNotification(result.error, 'error');
            }
        } catch (error) {
            showNotification('Error al enviar correo de prueba', 'error');
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
                    <h2 className="text-2xl font-bold mb-4">Enviar Correo de Prueba</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-6">
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
                                    <FiMail className="mr-2" /> Configuración SMTP
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo de destino
                                </label>
                                <input
                                    type="email"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="destinatario@ejemplo.com"
                                />
                            </div>

                       

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Enviando...' : (
                                        <>
                                            <FiSend className="mr-2" />
                                            Enviar Prueba
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EmailTestSender;