// backend/src/models/ScheduledTelegramMessage.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const ScheduledTelegramMessage = sequelize.define('ScheduledTelegramMessage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    scheduledTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    chatIds: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    messageType: {
        type: DataTypes.ENUM('text', 'photo', 'document'),
        defaultValue: 'text'
    },
    mediaUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    repeat: {
        type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly', 'custom'),
        defaultValue: 'none',
    },
    customDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'sent', 'cancelled', 'error'),
        defaultValue: 'pending',
    },
    configId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'TelegramConfigs',
            key: 'id'
        }
    },
    jobId: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

export { ScheduledTelegramMessage };