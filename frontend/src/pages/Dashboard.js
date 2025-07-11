import React, { useEffect, useState, useCallback } from 'react';
import { initSocket } from '../services/socket'; 
import { QRCodeSVG } from 'qrcode.react';
import SendMessage from '../components/whatsapp/SendMessage';
import ScheduleMessage from '../components/whatsapp/ScheduleMessage';
import ScheduledActions from '../components/whatsapp/ScheduledActions';
import ChatModule from '../components/whatsapp/ChatModule';
import { useGlobalContext } from '../context/GlobalContext';
import EmailDashboard from '../components/email/EmailDashboard';
import TelegramConfigForm from '../components/telegram/TelegramConfigForm';
import TelegramSendMessage from '../components/telegram/TelegramSendMessage';

const Dashboard = () => {
  const [qrCode, setQrCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeSection, setActiveSection] = useState('whatsapp'); // whatsapp, email, telegram
  const [activeTab, setActiveTab] = useState('send'); // Estado para manejar la pestaña activa
  const userId = localStorage.getItem('user'); // Asume que el ID del usuario está en el localStorage
  const {showNotification, setSingleSelect, setSelectedContacts, setSelectedGroups} = useGlobalContext();

  const stableShowNotification = useCallback((message, type) => {
    if (!isConnected){
      showNotification(message, type);
    }
  }, [showNotification, isConnected]);

  useEffect(() => {
    if (!userId) return;
    const socket = initSocket(); 
    socket.emit('initializeWhatsApp', userId);
    
    const onQR = (qr) => {
      setQrCode(qr);
      setIsConnected(false);
    };
    
    const onReady = () => {
      setIsConnected(true);
      setQrCode('');
      stableShowNotification('Conectado a WhatsApp', 'success');
    };
    
    const onError = (error) => {
      console.log('Error:', error);
      if (error.login === false) {
        setIsConnected(false);
        setQrCode('');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.reload();
      }
    }
    
    socket.on('qr', onQR);
    socket.on('ready', onReady);
    socket.on('connect_error', (err) => {
      if (err.message === 'NO_TOKEN_PROVIDED' || err.message === 'INVALID_TOKEN') {
        localStorage.removeItem('token');
        window.location.reload();
      }
    });
    
    return () => {
      socket.off('qr', onQR);
      socket.off('ready', onReady);
      socket.off('error', onError);
      socket.disconnect();
    };
  }, [userId, stableShowNotification]);

  const sections = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Mass',
      icon: '💬',
      color: 'from-green-500 to-green-600',
      tabs: [
        { id: 'send', name: 'Enviar Mensaje', icon: '📤' },
        { id: 'schedule', name: 'Programar Mensaje', icon: '⏰' },
        { id: 'actions', name: 'Acciones Programadas', icon: '🤖' },
        { id: 'chats', name: 'Mensajes', icon: '💬' },
      ]
    },
    {
      id: 'email',
      name: 'Email Mass',
      icon: '📧',
      color: 'from-purple-500 to-purple-600',
      tabs: []
    },
    {
      id: 'telegram',
      name: 'Telegram Mass',
      icon: '✈️',
      color: 'from-blue-500 to-blue-600',
      tabs: [
        { id: 'telegramConfig', name: 'Configuración', icon: '⚙️' },
        { id: 'telegramSend', name: 'Enviar Mensaje', icon: '📤' },
        { id: 'telegramSchedule', name: 'Programar Mensaje', icon: '⏰' },
      ]
    }
  ];

  const resetSelection = () => {
    setSingleSelect(false);
    setSelectedGroups([]);
    setSelectedContacts([]);
  };

  const renderContent = () => {
    if (activeSection === 'email') {
      return <EmailDashboard />;
    }

    if (activeSection === 'telegram') {
      switch (activeTab) {
        case 'telegramConfig':
          return <TelegramConfigForm />;
        case 'telegramSend':
          return <TelegramSendMessage />;
        case 'telegramSchedule':
          return <div className="p-6 text-center text-gray-500">Programación de Telegram en desarrollo</div>;
        default:
          return <TelegramConfigForm />;
      }
    }

    // WhatsApp content
    if (!isConnected) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              {!qrCode
                ? "🔄 Validando conexión a WhatsApp"
                : "📱 Escanea el código QR para iniciar sesión"}
            </h2>
            {qrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <QRCodeSVG value={qrCode} size={256} />
                </div>
              </div>
            )}
            <p className="text-gray-600 mt-4 text-sm">
              Abre WhatsApp en tu teléfono y escanea el código QR
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "send":
        return <SendMessage />;
      case "schedule":
        return <ScheduleMessage />;
      case "chats":
        return <ChatModule />;
      case "actions":
        return <ScheduledActions />;
      default:
        return <SendMessage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Modern Sidebar */}
      <div className="bg-white w-80 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MSuite</h1>
              <p className="text-sm text-gray-500">Centro de Comunicaciones</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.id} className="p-4">
              {/* Section Header */}
              <button
                onClick={() => {
                  setActiveSection(section.id);
                  if (section.tabs.length > 0) {
                    setActiveTab(section.tabs[0].id);
                  }
                  resetSelection();
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 mb-3 ${
                  activeSection === section.id
                    ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-2xl">{section.icon}</span>
                <div className="text-left flex-1">
                  <div className="font-semibold">{section.name}</div>
                  <div className={`text-xs ${
                    activeSection === section.id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    Sistema de mensajería
                  </div>
                </div>
              </button>

              {/* Section Tabs */}
              {activeSection === section.id && section.tabs.length > 0 && (
                <div className="space-y-1 ml-4">
                  {section.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (section.id === 'whatsapp') {
                          if (tab.id === 'chats') {
                            setSingleSelect(true);
                          } else {
                            setSingleSelect(false);
                          }
                          setSelectedGroups([]);
                          setSelectedContacts([]);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span className="text-sm">{tab.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {/* Connection Status */}
          {activeSection === 'whatsapp' && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              <span className="text-sm text-gray-600">
                WhatsApp: {isConnected ? 'Conectado' : 'Conectando...'}
              </span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="w-full p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <span>🚪</span>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;