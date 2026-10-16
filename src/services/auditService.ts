import { AuditLog, Role } from '../types';
import { simulateDelay, storage } from './storage';

export const auditService = {
  async log(params: {
    userId: string;
    userName: string;
    userRole: Role;
    action: AuditLog['action'];
    resource: string;
    details: string;
  }): Promise<AuditLog> {
    const logs = storage.getAuditLogs();
    const newEntry: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      resource: params.resource,
      details: params.details,
      ipAddress: '103.217.166.42',
    };
    logs.unshift(newEntry);
    storage.setAuditLogs(logs);
    return newEntry;
  },

  async getAll(): Promise<AuditLog[]> {
    await simulateDelay(120);
    return storage.getAuditLogs();
  },
};
