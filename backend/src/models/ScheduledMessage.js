// backend/src/models/ScheduledMessage.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const ScheduledMessage = sequelize.define('ScheduledMessage', {
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
  contacts: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  groups: {
    type: DataTypes.JSON,
    allowNull: false,
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
  jobId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Nuevo campo para multimedia
  mediaData: {
    type: DataTypes.TEXT, // JSON como string
    allowNull: true,
    comment: 'Datos de multimedia en formato JSON'
  },
  // Nuevo campo para tipo de mensaje
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'document'),
    defaultValue: 'text',
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default ScheduledMessage;