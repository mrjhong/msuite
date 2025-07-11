// backend/src/models/TelegramConfig.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import { encrypt, decrypt } from '../utils/crypto.js';

const TelegramConfig = sequelize.define('TelegramConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    botToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const encrypted = this.getDataValue('botToken');
            return encrypted ? decrypt(encrypted) : null;
        },
        set(value) {
            this.setDataValue('botToken', encrypt(value));
        }
    },
    botUsername: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
});

export default TelegramConfig;

