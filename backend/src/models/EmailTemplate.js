import { DataTypes } from 'sequelize';
import sequelize from './index.js';


const EmailTemplate = sequelize.define('EmailTemplate', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    variables: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
});

export default EmailTemplate;
