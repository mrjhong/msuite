import nodemailer from 'nodemailer';
import { renderTemplate } from '../utils/templateEngine.js';
import EmailConfig from '../models/EmailConfig.js'; 
import EmailTemplate from '../models/EmailTemplate.js';
class EmailService {
  static async getTransporter(configId) {
    const config = await EmailConfig.findByPk(configId);
    if (!config) throw new Error('Email configuration not found');
    
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });
  }

  static async sendEmail({ configId, templateId, recipients }) {
    try {
      const transporter = await this.getTransporter(configId);
      const template = await EmailTemplate.findByPk(templateId);
      
      if (!template) throw new Error('Template not found');
      
      const html = await renderTemplate(template.filePath);
      
      const results = [];
      for (const recipient of recipients) {
        const mailOptions = {
          from: transporter.options.auth.user,
          to: recipient.email,
          subject: template.subject,
          html: html
        };
        
        const result = await transporter.sendMail(mailOptions);
        results.push({
          email: recipient.email,
          status: 'sent',
          messageId: result.messageId
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

export default EmailService;
