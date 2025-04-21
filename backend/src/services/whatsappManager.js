import pkg from 'whatsapp-web.js';

const { Client, LocalAuth } = pkg;
class WhatsAppManager {
    constructor() {
        this.clients = new Map();
    }

    initializeClient(userId) {
        if (this.clients.has(userId)) {
            console.log(`Cliente existente para el usuario ${userId}`);
            return this.clients.get(userId);
        }

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: userId }),
            puppeteer: {
                headless: true,
                executablePath: '/usr/bin/google-chrome-stable',
            },
        });


        this.clients.set(userId, client);
        client.initialize();

        return client;
    }

    getClient(userId) {
        return this.clients.get(userId) || null;
    }

    removeClient(userId) {
        const client = this.clients.get(userId);
        if (client) {
            client.destroy();
            this.clients.delete(userId);
        }
    }
}

// Singleton para manejar una única instancia global
export const whatsappManager = new WhatsAppManager();