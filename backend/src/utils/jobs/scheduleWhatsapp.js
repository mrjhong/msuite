import { scheduleJob, cancelJob as nodeScheduleCancelJob } from 'node-schedule';
import ScheduledMessage from '../../models/ScheduledMessage.js';
import { sendMessageService } from '../../services/whatsappService.js';

const activeJobs = new Map();

export const scheduleMessageJob = async (messageId, executionTime, callback) => {
  const job = scheduleJob(executionTime, async () => {
    try {
      await callback();
      activeJobs.delete(messageId);
    } catch (error) {
      console.error(`Error ejecutando job ${messageId}:`, error);
    }
  });

  activeJobs.set(messageId, job);
  return job;
};

export const cancelJob = (messageId) => {
  const job = activeJobs.get(messageId);
  if (job) {
    nodeScheduleCancelJob(job);
    activeJobs.delete(messageId);
  }
};

// Función para reiniciar jobs al iniciar el servidor
export const restartPendingJobs = async () => {
  const pendingMessages = await ScheduledMessage.findAll({
    where: { status: 'pending' }
  });

  for (const message of pendingMessages) {
    if (new Date(message.scheduledTime) > new Date()) {
      const job = await scheduleMessageJob(
        message.id,
        new Date(message.scheduledTime),
        async () => {
          try {
            await sendMessageService(
              message.userId,
              message.contacts,
              message.groups,
              message.message
            );
            await message.update({ status: 'sent' });
          } catch (error) {
            await message.update({ status: 'error' });
          }
        }
      );
      
      await message.update({ jobId: job.name });
    }
  }
};