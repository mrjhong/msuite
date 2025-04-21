import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const ScheduledAction = sequelize.define('ScheduledAction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    trigger: {
        type: DataTypes.ENUM('group_join', 'group_leave', 'new_message'),
        allowNull: false,
    },
    contacts: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    groups: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    timestamps: true,
    paranoid: true // Soft delete
});

export default ScheduledAction;