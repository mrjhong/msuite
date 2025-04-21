import express from 'express';
import * as emailController from '../controllers/emailController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/templates', authMiddleware, emailController.createTemplate);
router.get('/templates', authMiddleware, emailController.getTemplates);

router.post('/configs', authMiddleware, emailController.createConfig);
router.get('/configs', authMiddleware, emailController.getConfigs);

router.post('/schedule', authMiddleware, emailController.scheduleEmail);
router.post('/test', authMiddleware, emailController.sendTestEmail);

export default router;