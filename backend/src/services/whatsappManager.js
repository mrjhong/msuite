// backend/src/services/whatsappManager.js
import pkg from 'whatsapp-web.js';
import { broadcastToAllSockets } from '../sockets/whatsappSocket.js';

const { Client, LocalAuth } = pkg;

class WhatsAppManager {
    constructor() {
        this.client = null;
        this.isInitializing = false;
        this.isReady = false;
        this.connectionPromise = null;
        this.listeners = new Map(); // Para gestionar listeners dinámicos
    }

    async initializeClient() {
        // Si ya existe una instancia lista, devolverla
        if (this.client && this.isReady) {
            console.log('✅ Cliente WhatsApp ya existe y está listo');
            return this.client;
        }

        // Si ya se está inicializando, esperar a que termine
        if (this.isInitializing && this.connectionPromise) {
            console.log('⏳ Cliente WhatsApp ya se está inicializando, esperando...');
            return this.connectionPromise;
        }

        // Marcar como inicializando y crear la promesa
        this.isInitializing = true;
        this.connectionPromise = this._createClient();

        try {
            await this.connectionPromise;
            return this.client;
        } catch (error) {
            this.isInitializing = false;
            this.connectionPromise = null;
            throw error;
        }
    }

    async _createClient() {
        console.log('🚀 Creando nueva instancia de WhatsApp...');

        // Limpiar cliente anterior si existe
        if (this.client) {
            await this._destroyClient();
        }

        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: 'main_client' }),
            puppeteer: {
                headless: true,
                executablePath: '/usr/bin/google-chrome-stable',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            },
        });

        // Configurar listeners básicos
        this._setupBasicListeners();

        // Inicializar y esperar conexión
        this.client.initialize();

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout: WhatsApp no se conectó en 60 segundos'));
            }, 60000);

            this.client.once('ready', () => {
                clearTimeout(timeout);
                this.isReady = true;
                this.isInitializing = false;
                console.log('✅ WhatsApp Client listo');
                resolve(this.client);
            });

            this.client.once('auth_failure', (error) => {
                clearTimeout(timeout);
                this.isInitializing = false;
                console.error('❌ Error de autenticación:', error);
                reject(error);
            });

            this.client.once('disconnected', (reason) => {
                clearTimeout(timeout);
                this.isReady = false;
                this.isInitializing = false;
                console.log('📱 WhatsApp desconectado:', reason);
                // No rechazar aquí, manejar reconexión
            });
        });
    }

    _setupBasicListeners() {
        this.client.on('qr', (qr) => {
            this.isReady = false;
            console.log('📱 QR Code generado 1');
            broadcastToAllSockets('qr', qr);
            this._notifyListeners('qr', qr);
        });

        this.client.on('ready', () => {
            this.isReady = true;
            console.log('✅ Cliente listo para usar');
            this._notifyListeners('ready');
        });

        this.client.on('auth_failure', (error) => {
            this.isReady = false;
            console.error('❌ Fallo de autenticación:', error);
            this._notifyListeners('auth_failure', error);
        });

        this.client.on('disconnected', (reason) => {
            this.isReady = false;
            console.log('📱 Desconectado:', reason);
            this._notifyListeners('disconnected', reason);
            
            // Auto-reconexión después de 5 segundos
            setTimeout(() => {
                if (!this.isInitializing) {
                    console.log('🔄 Intentando reconectar...');
                    this.reconnect();
                }
            }, 5000);
        });

        this.client.on('message', (message) => {
            this._notifyListeners('message', message);
        });

        this.client.on('group_join', (notification) => {
            this._notifyListeners('group_join', notification);
        });

        this.client.on('group_leave', (notification) => {
            this._notifyListeners('group_leave', notification);
        });
    }

    // Gestión de listeners dinámicos
    addListener(event, id, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Map());
        }
        this.listeners.get(event).set(id, callback);
    }

    removeListener(event, id) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(id);
        }
    }

    _notifyListeners(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((callback, id) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en listener ${id} para evento ${event}:`, error);
                }
            });
        }
    }

    async reconnect() {
        console.log('🔄 Iniciando reconexión...');
        this.isInitializing = false;
        this.connectionPromise = null;
        await this.initializeClient();
    }

    async _destroyClient() {
        if (this.client) {
            try {
                await this.client.destroy();
                console.log('🗑️ Cliente anterior destruido');
            } catch (error) {
                console.error('Error destruyendo cliente:', error);
            }
        }
        this.client = null;
        this.isReady = false;
        this.listeners.clear();
    }

    getClient() {
        return this.client;
    }

    isClientReady() {
        return this.isReady && this.client;
    }

    async getState() {
        if (!this.client) return null;
        try {
            return await this.client.getState();
        } catch (error) {
            console.error('Error obteniendo estado:', error);
            return null;
        }
    }

    // Métodos de conveniencia
    async sendMessage(chatId, message) {
        if (!this.isClientReady()) {
            throw new Error('Cliente WhatsApp no está listo');
        }
        return await this.client.sendMessage(chatId, message);
    }

    async getChats() {
        if (!this.isClientReady()) {
            throw new Error('Cliente WhatsApp no está listo');
        }
        return await this.client.getChats();
    }

    async getChatById(chatId) {
        if (!this.isClientReady()) {
            throw new Error('Cliente WhatsApp no está listo');
        }
        return await this.client.getChatById(chatId);
    }
}

// Exportar instancia única (Singleton)
export const whatsappManager = new WhatsAppManager();
export default whatsappManager;