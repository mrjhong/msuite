# MSuite - Plataforma de Automatización Multicanal

## 📘 Documentación Técnica

---

### 📑 Índice

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Componentes Clave](#componentes-clave)
- [Configuración e Instalación](#configuración-e-instalación)
- [Flujos de Trabajo](#flujos-de-trabajo)
- [Seguridad](#seguridad)
- [Dependencias Técnicas](#dependencias-técnicas)
- [Estructura de Archivos](#estructura-de-archivos)
- [Próximas Mejoras](#próximas-mejoras)

---

## 📌 Descripción General

**MSuite** es una plataforma de automatización de comunicaciones multicanal que permite:

- Envío programado de mensajes por WhatsApp
- Distribución masiva de correos electrónicos
- Gestión de contactos, plantillas y campañas
- Automatización de tareas repetitivas de comunicación

**Objetivo:** Simplificar y optimizar las comunicaciones empresariales a través de canales digitales clave como WhatsApp y correo electrónico.

---

## ✨ Características Principales

### WhatsApp Automation
- Conexión con WhatsApp Web vía `whatsapp-web.js`
- Mensajes programados y personalizados

### Email Marketing
- Editor de plantillas HTML con vista previa
- Múltiples configuraciones SMTP
- Programación de correos con personalización

### Funciones Comunes
- Autenticación JWT
- Sistema de notificaciones en tiempo real (Socket.io)
- Programación de tareas recurrentes
- Interfaz responsive para escritorio y móvil

---

## 🧱 Arquitectura del Sistema

- **Frontend:** React.js + TailwindCSS
- **Backend:** Node.js + Express
- **Base de datos:** MySQL + Sequelize ORM
- **WebSockets:** Socket.io
- **Autenticación:** JWT

### Diagrama General

![imagen](https://github.com/user-attachments/assets/b930f78d-a8f2-4bb0-a4cb-803bbd215c2e)

![imagen](https://github.com/user-attachments/assets/12746401-c718-4fef-ba85-e3597d9ff1a1)


---

## 🧩 Componentes Clave

### Backend
- `authController.js`: Registro y login de usuarios
- `emailController.js`: Gestión de emails y plantillas
- `whatsappController.js`: Conexión y mensajes vía WhatsApp Web
- `authMiddleware.js`: Verificación de tokens JWT
- `whatsappSocket.js`: Comunicación en tiempo real

### Frontend
- `EmailTemplateEditor`: Editor de plantillas HTML seguras
- `ChatModule`: Vista de conversaciones de WhatsApp
- `ScheduledActions`: Gestión de mensajes o emails programados
- `GlobalContext`: Estado compartido (React Context API)

---

## ⚙️ Configuración e Instalación

### 🔧 Requisitos

- Node.js v18+
- MySQL 5.7 o superior
- NPM o Yarn
- Cuenta de WhatsApp conectada a WhatsApp Web

### 📥 Instalación

```bash
# Clona el repositorio
git clone https://github.com/usuario/msuite.git
cd msuite

# Backend
cd backend
npm install
npm start

# Frontend (en otra terminal)
cd frontend
npm install
npm start

# Backend variables de entorno
PORT=5000 //puerto en que se va a correr el backend
DB_HOST=192.168.0.6 // url base de datos
DB_USER=sa //usuario base de datos
DB_PASS=12345678 // password base de datos
DB_NAME=whatsapp.mass.sender // base de datos
JWT_SECRET=secret // llave secreta jwt
CRYPTO_SECRET=WERKPC9IBCXGF7HL4HD85P6W3BRPU1NO // clave random de encryptacion

# Frontend variables de entorno
REACT_APP_URL_SOCKET=http://localhost:5000 // url socket
REACT_APP_URL_API=http://localhost:5000/api //url api

🔁 Flujos de Trabajo
1. Crear un Usuario

Para poder acceder a la plataforma es necesario registrarse a través del endpoint:

POST http://localhost:3000/auth/register

Body:

{
  "email": "1@1.com",
  "password": "12345"
}

2. Envío de Mensajes por WhatsApp

    Iniciar sesión con el QR de WhatsApp Web

    Seleccionar contacto o grupo

    Elegir plantilla o escribir mensaje

    Programar envío (fecha/hora)

    MSuite lo envía automáticamente

3. Campaña de Correo Electrónico

    Crear plantilla HTML

    Configurar SMTP

    Importar lista de destinatarios

    Programar envío

    MSuite ejecuta y reporta los resultados

🔐 Seguridad
Medidas Implementadas

    JWT con expiración

    Cifrado AES-256 para contraseñas SMTP

    Sanitización de HTML (DOMPurify)

    Middleware CSRF (en endpoints sensibles)

    Rate limiting

Buenas Prácticas

    No almacenar credenciales en el repositorio

    Hash de contraseñas con bcrypt

    Validación de entrada robusta

    Logs de actividades importantes

🧰 Dependencias Técnicas
Backend

    express: Framework web

    sequelize: ORM para MySQL

    socket.io: Comunicación en tiempo real

    nodemailer: Envío de correos

    whatsapp-web.js: Control de WhatsApp Web

Frontend

    react

    tailwindcss

    framer-motion: Animaciones suaves

    react-icons

    react-simple-code-editor

🗂️ Estructura de Archivos

backend/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   ├── sockets/
│   └── utils/
├── storagehtml/
├── config.js
└── server.js

frontend/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   └── App.js

🚧 Próximas Mejoras

    Dashboard de estadísticas

    Administración de múltiples cuentas WhatsApp

    Reportes descargables (Excel/PDF)

    Integración con Telegram o SMS

    Gestión avanzada de campañas y A/B testing

💬 Contacto

Para dudas o colaboración: [correo@empresa.com]


