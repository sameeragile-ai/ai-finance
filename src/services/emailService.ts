import { EmailLog, EmailTemplate } from '../types';
import { simulateDelay, storage } from './storage';

export const emailService = {
  async getTemplates(): Promise<EmailTemplate[]> {
    await simulateDelay(100);
    return storage.getTemplates();
  },

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    await simulateDelay(150);
    const list = storage.getTemplates();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Template not found');
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    storage.setTemplates(list);
    return updated;
  },

  async getSentLogs(clientId?: string): Promise<EmailLog[]> {
    await simulateDelay(120);
    let list = storage.getSentEmails();
    if (clientId) {
      list = list.filter((e) => e.clientId === clientId);
    }
    return list;
  },

  async sendEmail(emailData: {
    clientId: string;
    clientName: string;
    recipientEmail: string;
    subject: string;
    body: string;
    templateId?: string;
  }): Promise<EmailLog> {
    await simulateDelay(300);
    const list = storage.getSentEmails();
    const newLog: EmailLog = {
      id: `eml-${Date.now()}`,
      ...emailData,
      sentAt: new Date().toISOString(),
      status: 'Delivered', // Mailgun simulated delivery
    };
    list.unshift(newLog);
    storage.setSentEmails(list);
    return newLog;
  },

  renderTemplate(templateText: string, variables: Record<string, string>): string {
    let rendered = templateText;
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, val || '');
    }
    return rendered;
  },
};
