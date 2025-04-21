import React, { useEffect, useState ,useCallback} from 'react';
import { initSocket } from '../services/socket'; 
import { QRCodeSVG } from 'qrcode.react';
import SendMessage from '../components/whatsapp/SendMessage';
import ScheduleMessage from '../components/whatsapp/ScheduleMessage';
import ScheduledActions from '../components/whatsapp/ScheduledActions';
import ChatModule from '../components/whatsapp/ChatModule';
import { useGlobalContext } from '../context/GlobalContext';
import EmailConfigForm from '../components/email/EmailConfigForm';
import EmailScheduler from '../components/email/EmailScheduler';
import EmailTestSender from '../components/email/EmailTestSender';
import EmailTemplateEditor from '../components/email/EmailTemplateEditor';

const Dashboard = () => {
  const [qrCode, setQrCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('send'); // Estado para manejar la pestaña activa
  const userId = localStorage.getItem('user'); // Asume que el ID del usuario está en el localStorage
  const {showNotification, setSingleSelect ,setSelectedContacts , setSelectedGroups} = useGlobalContext();


  const stableShowNotification = useCallback((message, type) => {
  if (!isConnected){
    showNotification(message, type);
  }
  }, [showNotification, isConnected]); // Dependencias vacías si showNotification no cambia

  useEffect(() => {
    if (!userId) return; // Si no hay userId, no ejecutar el efecto
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
      console.log('Error:' );
      if (error.login === false) {
        setIsConnected(false);
        setQrCode('');
        //eliminar el token
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // recargar la página
        window.location.reload();

      }
    }
    socket.on('qr', onQR);
    socket.on('ready', onReady);
    socket.on('connect_error', (err) => {
      if (err.message === 'NO_TOKEN_PROVIDED' || err.message === 'INVALID_TOKEN') {
        // Manejar error de autenticación
        localStorage.removeItem('token');
        window.location.reload();
      }
    });
    return () => {
      socket.off('qr', onQR); // Limpia listeners específicos
      socket.off('ready', onReady);
      socket.off('error', onError);
      socket.disconnect(); // Desconecta el socket al desmontar
    };
  }, [userId ,stableShowNotification]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Barra lateral */}
      <div className="bg-gray-900 w-64 p-4 shadow-md text-white h-screen">
        <h1 className="text-2xl font-bold mb-6 ">WhatsApp Mass</h1>
        <nav>
          <ul>
            <li
              className={`p-2 cursor-pointer rounded-lg mt-2 ${activeTab === 'send' ? 'bg-gray-600 text-white' : 'hover:bg-gray-500'}`}
              onClick={() => {setActiveTab('send');setSingleSelect(false);setSelectedGroups([]);setSelectedContacts([]);}}
            >
              Enviar Mensaje
            </li>
            <li
              className={`p-2 cursor-pointer rounded-lg mt-2 ${activeTab === 'schedule' ? 'bg-gray-600 text-white' : 'hover:bg-gray-500'}`}
              onClick={() => {setActiveTab('schedule');setSingleSelect(false);setSelectedGroups([]);setSelectedContacts([]);} }
            >
              Programar Mensaje
            </li>
            <li
              className={`p-2 cursor-pointer rounded-lg mt-2 ${activeTab === 'actions' ? 'bg-gray-600 text-white' : 'hover:bg-gray-500'}`}
              onClick={() => {setActiveTab('actions');setSingleSelect(false);setSelectedGroups([]);setSelectedContacts([])}}
            >
              Acciones Programadas
            </li>
            <li
              className={`p-2 cursor-pointer rounded-lg mt-2 ${activeTab === 'contacts' ? 'bg-gray-600 text-white' : 'hover:bg-gray-500'}`}
              onClick={() => {setActiveTab('chats');setSingleSelect(true);setSelectedGroups([]);setSelectedContacts([])}}
            >
              Mensajes
            </li>
          </ul>
        </nav>
        
        <h1 className="text-2xl font-bold my-6 ">Email Mass</h1>
        <nav>
          <ul>
            <li
              className={`p-2 cursor-pointer rounded-lg mt-2 ${activeTab === 'emailConfig' ? 'bg-gray-600 text-white' : 'hover:bg-gray-500'}`}
              onClick={() => {setActiveTab('emailConfig')}}
            >
              configuración SMTP
            </li>
          </ul>

          <ul>
            <li
              className={`p-2 cursor-pointer rounded-lg mt-2 ${activeTab === 'sheduleMail' ? 'bg-gray-600 text-white' : 'hover:bg-gray-500'}`}
              onClick={() => {setActiveTab('sheduleMail')}}
            >
              Programar Correo
            </li>
          </ul>

          <ul>
            <li
              className={`p-2 cursor-pointer rounded-lg mt-2 ${activeTab === 'testMail' ? 'bg-gray-600 text-white' : 'hover:bg-gray-500'}`}
              onClick={() => {setActiveTab('testMail')}}
            >
              Enviar Correo de Prueba
            </li>
          </ul>
          <ul>
            <li
              className={`p-2 cursor-pointer rounded-lg mt-2 ${activeTab === 'templateMail' ? 'bg-gray-600 text-white' : 'hover:bg-gray-500'}`}
              onClick={() => {setActiveTab('templateMail')}}
            >
              Plantillas
            </li>
          </ul>
        </nav>

        <div className="mt-4 bottom-4 left-4">
          
           {/* cerrar sesión */}
           <button
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="mt-8 p-2 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-500"
          >
            Cerrar sesión
            
          </button>

        </div>

      </div>

      {/* Área principal */}

      <div className="flex-1  max-h-screen">
        {!isConnected ? (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              {!qrCode
                ? "Validando conexión a WhatsApp"
                : "Escanea el código QR para iniciar sesión"}
            </h2>
            {qrCode && (
              <div>
                <QRCodeSVG value={qrCode} size={256} />
              </div>
            )}
          </div>
        ) : (
          <div>
            {activeTab === "send" && <SendMessage />}
            {activeTab === "schedule" && <ScheduleMessage />}
            {activeTab === "chats" && <ChatModule/>}
            {activeTab === "actions" && <ScheduledActions />}
            {activeTab === "emailConfig" && <EmailConfigForm/>}
            {activeTab === "sheduleMail" && <EmailScheduler/>}
            {activeTab === "testMail" && <EmailTestSender/>}
            {activeTab === "templateMail" && <EmailTemplateEditor/>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;