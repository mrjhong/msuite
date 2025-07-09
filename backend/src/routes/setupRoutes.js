// backend/src/routes/setupRoutes.js
import express from 'express';
import { showSetupPage, createFirstUser, checkSetupStatus } from '../controllers/setupController.js';
import { setupMiddleware } from '../middleware/setupMiddleware.js';

const router = express.Router();

// Ruta para verificar si se necesita setup
router.get('/status', checkSetupStatus);

// Ruta para mostrar la página de setup (solo si no hay usuarios)
router.get('/', setupMiddleware, showSetupPage);

// Ruta para crear el primer usuario (solo si no hay usuarios)
router.post('/create-user', setupMiddleware, createFirstUser);

export default router;