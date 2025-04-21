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
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default ScheduledMessage;