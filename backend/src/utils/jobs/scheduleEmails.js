import schedule from 'node-schedule';
import { ScheduledEmail } from '../../models/index.js';
import EmailService from '../../services/emailService.js';
import { Op } from 'sequelize';

export default class EmailScheduler {
  static init() {
    // Verificar correos pendientes al iniciar
    this.checkPendingEmails();

    // Programar verificación periódica
    schedule.scheduleJob('*/5 * * * *', () => this.checkPendingEmails());
  }

  static async checkPendingEmails() {
    try {
      const now = new Date();
      const pendingEmails = await ScheduledEmail.findAll({
        where: {
          status: 'pending',
          scheduledAt: { [Op.lte]: now }
        }
      });

      for (const emailJob of pendingEmails) {
        await this.processEmailJob(emailJob);
      }
    } catch (error) {
      console.error('Error checking pending emails:', error);
    }
  }

  static async processEmailJob(emailJob) {
    try {
      // Marcar como en proceso
      await emailJob.update({ status: 'processing' });

      // Enviar correo
      const results = await EmailService.sendEmail({
        configId: emailJob.configId,
        templateId: emailJob.templateId,
        recipients: emailJob.recipients
      
      });

      // Actualizar estado según resultado
      const allSent = results.every(r => r.status === 'sent');
      await emailJob.update({
        status: allSent ? 'sent' : 'failed',
        sentAt: new Date(),
        results: JSON.stringify(results)
      });

      // Programar siguiente ejecución si es recurrente
      if (emailJob.scheduleType !== 'once') {
        const nextDate = this.getNextScheduleDate(
          emailJob.scheduledAt,
          emailJob.scheduleType
        );

        await ScheduledEmail.create({
          ...emailJob.get({ plain: true }),
          id: undefined,
          status: 'pending',
          scheduledAt: nextDate,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error processing email job:', error);
      await emailJob.update({ status: 'failed' });
    }
  }

  static getNextScheduleDate(baseDate, scheduleType) {
    const date = new Date(baseDate);

    switch (scheduleType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        return null;
    }

    return date;
  }
}
