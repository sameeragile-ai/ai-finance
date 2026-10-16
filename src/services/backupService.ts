import { BackupPoint } from '../types';
import { simulateDelay, storage } from './storage';

export interface SystemHealthStatus {
  status: 'Operational' | 'Degraded' | 'Maintenance';
  databaseLatencyMs: number;
  encryptionStatus: 'AES-256 Enabled';
  storageUsedMB: number;
  storageMaxMB: number;
  lastBackupTime: string;
  nextScheduledBackup: string;
  uptimePercentage: number;
  recentErrors: { id: string; timestamp: string; service: string; message: string; severity: 'Low' | 'Medium' | 'High' }[];
}

export const backupService = {
  async getBackups(): Promise<BackupPoint[]> {
    await simulateDelay(120);
    return storage.getBackups();
  },

  async createBackup(notes: string, userName: string): Promise<BackupPoint> {
    await simulateDelay(350);
    const backups = storage.getBackups();
    const newBackup: BackupPoint = {
      id: `bkp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sizeMB: Number((48 + Math.random() * 2).toFixed(1)),
      status: 'Healthy',
      createdBy: `${userName} (Manual)`,
      notes: notes || 'Manual system snapshot before schema or data review.',
    };
    backups.unshift(newBackup);
    storage.setBackups(backups);
    return newBackup;
  },

  async restoreBackup(backupId: string): Promise<boolean> {
    await simulateDelay(600); // simulated snapshot restore
    const backups = storage.getBackups();
    const backup = backups.find((b) => b.id === backupId);
    if (!backup) return false;
    return true;
  },

  async getSystemHealth(): Promise<SystemHealthStatus> {
    await simulateDelay(100);
    const backups = storage.getBackups();
    const lastBackup = backups[0]?.timestamp || new Date().toISOString();
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(4, 0, 0, 0);

    return {
      status: 'Operational',
      databaseLatencyMs: 14,
      encryptionStatus: 'AES-256 Enabled',
      storageUsedMB: 142.8,
      storageMaxMB: 5120.0,
      lastBackupTime: lastBackup,
      nextScheduledBackup: nextDate.toISOString(),
      uptimePercentage: 99.98,
      recentErrors: [
        {
          id: 'err-1',
          timestamp: '2026-10-15T18:22:10.000Z',
          service: 'CoreLogic Property Valuation Webhook',
          message: 'Rate limit soft threshold reached (429). Retried after 3000ms successfully.',
          severity: 'Low',
        },
        {
          id: 'err-2',
          timestamp: '2026-10-14T09:14:00.000Z',
          service: 'Equifax Credit Score Gateway',
          message: 'Gateway transient timeout on single query. Fallback cache resolved.',
          severity: 'Low',
        },
      ],
    };
  },
};
