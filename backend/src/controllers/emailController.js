import { compileAndSaveTemplate } from '../utils/templateEngine.js';
import EmailService from '../services/emailService.js';
import EmailTemplate from '../models/EmailTemplate.js';
import EmailConfig from '../models/EmailConfig.js';
import ScheduledEmail from '../models/ScheduledEmail.js';

export async function createTemplate(req, res) {
  try {
    const { name, subject, htmlContent } = req.body;
    
    // Compilar y guardar plantilla
    const filePath = await compileAndSaveTemplate(name, htmlContent);
    
    // Crear registro en DB
    await EmailTemplate.create({
      name,
      subject,
      filePath,
      userId: req.user.id
    });
    
    res.status(200).json({success:true, messagge: 'Template created successfully'});
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({success:false, error: 'Error creating template' });
  }
}

export async function getTemplates(req, res) {
  try {
    const templates = await EmailTemplate.findAll();
    res.status(200).json({success:true,data: templates});
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success:false,error: 'Error fetching templates' });
  }
}

export async function createConfig(req, res) {
  try {
    const { name, provider, host, port, secure, auth } = req.body;
    
    const config = await EmailConfig.create({
      name,
      provider,
      host,
      port,
      secure,
      auth,
      userId: req.user.id
    });
    
    res.status(201).json({success:true, config});
  } catch (error) {
    console.error('Error creating email config:', error);
    res.status(500).json({success:false, error: 'Error creating email configuration' });
  }
}

export async function getConfigs(req, res) {
  try {
    const configs = await EmailConfig.findAll();
    res.status(200).json({success:true,data: configs});
  } catch (error) {
    console.error('Error fetching email configs:', error);
    res.status(500).json({success:false, error: 'Error fetching email configurations' });
  }
}
export async function scheduleEmail(req, res) {
  try {
    const { templateId, configId, recipients, scheduleType, scheduledAt } = req.body;
    
    const emailJob = await ScheduledEmail.create({
      templateId,
      configId,
      recipients,
      scheduleType,
      scheduledAt: new Date(scheduledAt),
      userId: req.user.id
    });
    
    res.status(201).json({success:true,emailJob});
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({success:false, error: 'Error scheduling email' });
  }
}

export async function sendTestEmail(req, res) {
  try {
    const { configId, templateId, recipient } = req.body;
    
    const results = await EmailService.sendEmail({
      configId,
      templateId,
      recipients: [{ email: recipient }],
    });
    
    res.json({success:true,results:results[0]});
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({success:false, error: 'Error sending test email' });
  }
}
