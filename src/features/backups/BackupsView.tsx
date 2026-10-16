import React, { useState, useEffect } from 'react';
import {
  DatabaseBackup,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  HardDrive,
  Lock,
  Server,
  Activity,
  Calendar,
  Clock,
} from 'lucide-react';
import { backupService, SystemHealthStatus } from '../../services/backupService';
import { BackupPoint } from '../../types';
import { formatDateTimeAU } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, Badge, Skeleton, EmptyState } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/NavigationTables';
import { ConfirmDialog } from '../../components/ui/Overlays';

export const BackupsView: React.FC = () => {
  const { role, currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [backups, setBackups] = useState<BackupPoint[]>([]);
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Backup Animation
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  // Restore
  const [restorePointToConfirm, setRestorePointToConfirm] = useState<BackupPoint | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bkps, hlt] = await Promise.all([
        backupService.getBackups(),
        backupService.getSystemHealth(),
      ]);
      setBackups(bkps);
      setHealth(hlt);
    } catch (err) {
      console.error(err);
      error('Failed to load backup status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunManualBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          finishBackup();
          return 100;
        }
        return prev + 15;
      });
    }, 120);
  };

  const finishBackup = async () => {
    try {
      await backupService.createBackup(
        'Manual on-demand snapshot by Principal Broker.',
        currentUser?.name || 'Sarah Jenkins'
      );
      success('Backup Completed', 'Full database snapshot secured in AWS ap-southeast-2 (Sydney).');
      await loadData();
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restorePointToConfirm) return;
    setIsRestoring(true);
    try {
      await backupService.restoreBackup(restorePointToConfirm.id);
      success('System Restored', `Rollback completed to snapshot ${restorePointToConfirm.id}.`);
      setRestorePointToConfirm(null);
      await loadData();
    } catch (err) {
      error('Restore failed');
    } finally {
      setIsRestoring(false);
    }
  };

  if (role !== 'admin') {
    return (
      <EmptyState
        icon={<Lock className="w-8 h-8 text-amber-600" />}
        title="Admin Access Required"
        description="The Backups & Recovery module is restricted to Principal Brokers."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Backups & Disaster Recovery</h1>
            <Badge variant="emerald" size="sm">
              Operational • 99.98% Uptime
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated daily snapshots, AES-256 encryption, and point-in-time recovery for Australian credit compliance.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleRunManualBackup}
          isLoading={isBackingUp}
          leftIcon={<Play className="w-3.5 h-3.5" />}
        >
          {isBackingUp ? `Backing Up (${backupProgress}%)` : 'Run Backup Now'}
        </Button>
      </div>

      {/* Manual Backup Progress Bar */}
      {isBackingUp && (
        <Card padded className="border-teal-200 bg-teal-50/50">
          <div className="flex items-center justify-between text-xs font-bold text-teal-900 mb-2">
            <span>Creating Encrypted Snapshot...</span>
            <span>{backupProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-teal-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-150"
              style={{ width: `${backupProgress}%` }}
            />
          </div>
        </Card>
      )}

      {/* System Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padded className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">System Status</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">All Systems Normal</div>
          <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            Database latency: {health?.databaseLatencyMs || 14}ms
          </p>
        </Card>

        <Card padded className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Last Backup</span>
            <span className="p-1 rounded-md bg-teal-50 text-teal-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2 font-mono">
            {formatDateTimeAU(health?.lastBackupTime)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            Automated snapshot (Sydney ap-southeast-2)
          </p>
        </Card>

        <Card padded className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Next Scheduled</span>
            <span className="p-1 rounded-md bg-sky-50 text-sky-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2 font-mono">
            {formatDateTimeAU(health?.nextScheduledBackup)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            Daily cron snapshot at 04:00 AEST
          </p>
        </Card>

        <Card padded className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Storage Used</span>
            <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <HardDrive className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {health?.storageUsedMB} MB <span className="text-xs font-normal text-slate-400">/ 5GB</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            {health?.encryptionStatus}
          </p>
        </Card>
      </div>

      {/* Restore Points Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Available Restore Points</h2>
          <span className="text-xs text-slate-500">30-day retention schedule</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Snapshot ID</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Archive Size</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.map((bkp) => (
              <TableRow key={bkp.id}>
                <TableCell>
                  <span className="text-xs font-mono font-bold text-slate-900">{bkp.id}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-600 font-mono">
                    {formatDateTimeAU(bkp.timestamp)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-600 font-mono">{bkp.sizeMB} MB</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-800 font-medium">{bkp.createdBy}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500 truncate max-w-sm block">
                    {bkp.notes}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRestorePointToConfirm(bkp)}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-teal-600" />}
                  >
                    Restore
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* System Error Log Panel */}
      <Card padded>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">System Gateway Diagnostic Log</h3>
          </div>
          <Badge variant="slate" size="sm">
            CoreLogic / Equifax / PEXA API
          </Badge>
        </div>

        <div className="space-y-2">
          {health?.recentErrors.map((err) => (
            <div
              key={err.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-bold text-slate-800">{err.service}:</span>{' '}
                <span className="text-slate-600">{err.message}</span>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                  {formatDateTimeAU(err.timestamp)}
                </span>
              </div>
              <Badge variant="amber" size="sm">
                Recovered
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(restorePointToConfirm)}
        onClose={() => setRestorePointToConfirm(null)}
        onConfirm={handleConfirmRestore}
        title="Restore Database Snapshot?"
        message={`Are you sure you want to rollback to snapshot ${restorePointToConfirm?.id} created on ${formatDateTimeAU(
          restorePointToConfirm?.timestamp
        )}? Current live changes made after this point will be replaced.`}
        confirmText="Yes, Execute Rollback"
        variant="warning"
        isLoading={isRestoring}
      />
    </div>
  );
};
