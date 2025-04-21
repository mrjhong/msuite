import React, { useState } from 'react';
import { apiCreateEmailConfig } from '../../services/emailApiService';
import { FiSave } from 'react-icons/fi';
import { useGlobalContext } from '../../context/GlobalContext';

const EmailConfigForm = () => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useGlobalContext();


  const providers = [
    { value: '', label: 'Personalizado' },
    { value: 'gmail', label: 'Gmail' },
    { value: 'outlook', label: 'Outlook' },
    { value: 'office365', label: 'Office 365' },
    { value: 'yahoo', label: 'Yahoo' },
    { value: 'zoho', label: 'Zoho' },
  ];

  const handleProviderChange = (e) => {
    const selectedProvider = e.target.value;
    setProvider(selectedProvider);

    // Configuración automática para proveedores conocidos
    switch (selectedProvider) {
      case 'gmail':
        setHost('smtp.gmail.com');
        setPort(587);
        setSecure(false);
        break;
      case 'outlook':
        setHost('smtp-mail.outlook.com');
        setPort(587);
        setSecure(false);
        break;
      case 'office365':
        setHost('smtp.office365.com');
        setPort(587);
        setSecure(false);
        break;
      case 'yahoo':
        setHost('smtp.mail.yahoo.com');
        setPort(465);
        setSecure(true);
        break;
      case 'zoho':
        setHost('smtp.zoho.com');
        setPort(465);
        setSecure(true);
        break;
      default:
        // Reset para personalizado
        setHost('');
        setPort(587);
        setSecure(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await apiCreateEmailConfig({
        name,
        provider,
        host,
        port,
        secure,
        auth: {
          user: username,
          pass: password
        }
      });

      if (result.success) {
        showNotification('Configuración guardada exitosamente', 'success');
        setName('');
        setProvider('');
        setHost('');
        setPort(587);
        setSecure(false);
        setUsername('');
        setPassword('');
        alert('Configuración guardada exitosamente');
      } else {
        showNotification(result.error, 'error');
      }
    } catch (error) {
      showNotification('Error al guardar la configuración', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="p-6 w-full">
        <div className="flex-1 bg-white p-6 shadow-lg rounded-lg overflow-hidden h-full flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Configuración SMTP</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la configuración</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <select
                  value={provider}
                  onChange={handleProviderChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {providers.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servidor SMTP</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={secure}
                    onChange={(e) => setSecure(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Conexión segura (SSL/TLS)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isLoading ? 'Guardando...' : (
                    <>
                      <FiSave className="mr-2" />
                      Guardar Configuración
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

export default EmailConfigForm;