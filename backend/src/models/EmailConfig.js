import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import { encrypt, decrypt } from '../utils/crypto.js'; // Asegúrate de tener un módulo de cifrad
const EmailConfig = sequelize.define('EmailConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    provider: {
        type: DataTypes.STRING,
        allowNull: false
    },
    host: {
        type: DataTypes.STRING,
        allowNull: false
    },
    port: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    secure: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    auth: {
        type: DataTypes.TEXT, // Almacenaremos el auth encriptado como JSON
        allowNull: false,
        get() {
            const encrypted = this.getDataValue('auth');
            return encrypted ? JSON.parse(decrypt(encrypted)) : null;
        },
        set(value) {
            this.setDataValue('auth', encrypt(JSON.stringify(value)));
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
});


export default EmailConfig;