import express from 'express';
import {
    sendMessageNow, scheduleMessage, getContacts, scheduleAction,
    getScheduledMessages, cancelScheduledMessage,
    getScheduledActions,
    cancelScheduledAction,
    getChatHistory
} from '../controllers/whatasappController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-now', authMiddleware, sendMessageNow);

router.post('/schedule/messages', authMiddleware, scheduleMessage);
router.get('/schedule/messages', authMiddleware, getScheduledMessages);
router.delete('/schedule/messages/:id', authMiddleware, cancelScheduledMessage);

router.post('/schedule/actions', authMiddleware, scheduleAction);
router.get('/schedule/actions', authMiddleware, getScheduledActions);
router.delete('/schedule/actions/:id', authMiddleware, cancelScheduledAction);

router.get('/contacts', authMiddleware, getContacts);

router.post('/chats/getchat' , authMiddleware, getChatHistory)


export default router;