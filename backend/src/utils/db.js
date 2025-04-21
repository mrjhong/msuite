import User from '../models/User.js';
import Contact from '../models/Contact.js';
import ScheduledMessage from '../models/ScheduledMessage.js';
import sequelize from '../models/index.js';

const syncDB = async () => {
  try {
    await sequelize.sync(); // Usa { force: true } solo en desarrollo
    console.log('Base de datos sincronizada');
  } catch (error) {
    console.error('Error sincronizando la base de datos:', error);
  }
};

export default syncDB;