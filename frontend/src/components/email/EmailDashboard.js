import React, { useState } from 'react';
import { 
  FiMail, 
  FiSettings, 
  FiSend, 
  FiCalendar,
  FiEdit3,
  FiList,
  FiArrowLeft,
  FiPlus
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import EmailConfigForm from './EmailConfigForm';
import EmailScheduler from './EmailScheduler';
import EmailTestSender from './EmailTestSender';
import EmailTemplateEditor from './EmailTemplateEditor';
import EmailTemplateList from './EmailTemplateList';

const EmailDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: FiList },
    { id: 'templates', name: 'Plantillas', icon: FiEdit3 },
    { id: 'newTemplate', name: 'Nueva Plantilla', icon: FiPlus },
    { id: 'config', name: 'Configuración SMTP', icon: FiSettings },
    { id: 'schedule', name: 'Programar Correo', icon: FiCalendar },
    { id: 'test', name: 'Envío de Prueba', icon: FiSend },
  ];

  const stats = [
    { 
      name: 'Plantillas Activas', 
      value: '12', 
      change: '+2', 
      changeType: 'positive',
      icon: FiEdit3,
      color: 'purple'
    },
    { 
      name: 'Correos Enviados', 
      value: '1,205', 
      change: '+18%', 
      changeType: 'positive',
      icon: FiSend,
      color: 'blue'
    },
    { 
      name: 'Configuraciones SMTP', 
      value: '3', 
      change: '0', 
      changeType: 'neutral',
      icon: FiSettings,
      color: 'green'
    },
    { 
      name: 'Programados', 
      value: '8', 
      change: '+3', 
      changeType: 'positive',
      icon: FiCalendar,
      color: 'orange'
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'templates':
        return <EmailTemplateList />;
      case 'newTemplate':
        return <EmailTemplateEditor />;
      case 'config':
        return <EmailConfigForm />;
      case 'schedule':
        return <EmailScheduler />;
      case 'test':
        return <EmailTestSender />;
      default:
        return (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard de Email</h1>
                <p className="text-gray-600 mt-2">
                  Gestiona todas tus comunicaciones por correo electrónico
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <button 
                  onClick={() => setActiveTab('newTemplate')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <FiPlus className="h-5 w-5" />
                  Nueva Plantilla
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const colorClasses = {
                  purple: 'bg-purple-100 text-purple-600',
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600',
                  orange: 'bg-orange-100 text-orange-600'
                };

                return (
                  <motion.div
                    key={stat.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        {stat.change !== '0' && (
                          <div className="flex items-center mt-2">
                            <span className={`text-sm font-medium ${
                              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stat.change}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tabs.slice(1).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all group"
                    >
                      <Icon className="h-8 w-8 text-gray-600 group-hover:text-purple-600 mb-2" />
                      <h3 className="font-medium text-gray-900 group-hover:text-purple-600">
                        {tab.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {tab.id === 'templates' && 'Ver y gestionar plantillas'}
                        {tab.id === 'newTemplate' && 'Crear nueva plantilla'}
                        {tab.id === 'config' && 'Configurar servidor SMTP'}
                        {tab.id === 'schedule' && 'Programar envíos'}
                        {tab.id === 'test' && 'Enviar correo de prueba'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h2>
              <div className="space-y-4">
                {[
                  { action: 'Plantilla creada', name: 'Newsletter Enero', time: 'Hace 2 horas', type: 'create' },
                  { action: 'Correo enviado', name: 'Prueba de configuración', time: 'Hace 4 horas', type: 'send' },
                  { action: 'Configuración actualizada', name: 'SMTP Gmail', time: 'Hace 1 día', type: 'update' },
                  { action: 'Correo programado', name: 'Promoción mensual', time: 'Hace 2 días', type: 'schedule' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'create' ? 'bg-green-100 text-green-600' :
                      activity.type === 'send' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'update' ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {activity.type === 'create' && <FiPlus className="h-4 w-4" />}
                      {activity.type === 'send' && <FiSend className="h-4 w-4" />}
                      {activity.type === 'update' && <FiSettings className="h-4 w-4" />}
                      {activity.type === 'schedule' && <FiCalendar className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.name}</p>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiMail className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Email Mass</h2>
              <p className="text-sm text-gray-600">Sistema de correos</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-purple-100 text-purple-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>

        {activeTab !== 'dashboard' && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default EmailDashboard;