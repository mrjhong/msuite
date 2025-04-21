import { DataTypes } from 'sequelize';
import sequelize from './index.js';


const ScheduledEmail = sequelize.define('ScheduledEmail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    recipients: {
        type: DataTypes.JSON,
        allowNull: false
    },
    scheduleType: {
        type: DataTypes.ENUM('once', 'daily', 'weekly', 'monthly'),
        defaultValue: 'once'
    },
    scheduledAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed'),
        defaultValue: 'pending'
    },
    templateId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'EmailTemplates',
            key: 'id'
        }
    },
    configId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'EmailConfigs',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
});

export default ScheduledEmail;
