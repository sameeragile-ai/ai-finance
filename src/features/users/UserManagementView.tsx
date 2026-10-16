import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Edit2,
  Power,
  Laptop,
  Smartphone,
  Tablet,
  LogOut,
  Clock,
  History,
  Lock,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { auditService } from '../../services/auditService';
import { User, Role, ActiveSession, AuditLog } from '../../types';
import { formatDateTimeAU } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, Badge, Skeleton, EmptyState } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/NavigationTables';
import { Modal, ConfirmDialog } from '../../components/ui/Overlays';
import { Input, Select } from '../../components/ui/Input';

export const UserManagementView: React.FC = () => {
  const { role, currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-tabs: Users, Sessions, Audit Log
  const [subTab, setSubTab] = useState<'users' | 'sessions' | 'audit'>('users');

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('broker');
  const [invitePhone, setInvitePhone] = useState('+61 4');
  const [inviteAcl, setInviteAcl] = useState('CR #');
  const [inviteTitle, setInviteTitle] = useState('Mortgage Broker');
  const [isInviting, setIsInviting] = useState(false);

  // Edit Role Modal
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<Role>('broker');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [u, s, a] = await Promise.all([
        userService.getAll(),
        userService.getActiveSessions(),
        auditService.getAll(),
      ]);
      setUsers(u);
      setSessions(s);
      setAuditLogs(a);
    } catch (err) {
      console.error(err);
      error('Failed to load user management data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      await userService.invite({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        phone: invitePhone,
        aclNumber: inviteAcl,
        title: inviteTitle,
      });
      success('User Invited', `Invitation sent to ${inviteEmail}.`);
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      await loadData();
    } catch (err) {
      error('Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveRole = async () => {
    if (!userToEdit) return;
    await userService.update(userToEdit.id, { role: newRole });
    success('Role Updated', `${userToEdit.name} is now ${newRole}.`);
    setUserToEdit(null);
    await loadData();
  };

  const handleToggleActive = async (user: User) => {
    const updated = await userService.toggleActive(user.id);
    success(
      updated.active ? 'User Activated' : 'User Deactivated',
      `${user.name} status updated.`
    );
    await loadData();
  };

  const handleRevokeSession = async (sessionId: string) => {
    await userService.revokeSession(sessionId);
    success('Session Terminated', 'Remote device was signed out.');
    await loadData();
  };

  if (role !== 'admin') {
    return (
      <EmptyState
        icon={<Lock className="w-8 h-8 text-amber-600" />}
        title="Admin Access Required"
        description="The Users & Security section is restricted to Principal Brokers (Admin role) under Australian Credit Licence compliance."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Users & Security</h1>
            <Badge variant="teal" size="sm">
              ACL #482910 Compliance
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage authorized credit representatives, MFA enforcement, active sessions, and compliance audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setSubTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                subTab === 'users' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Brokers & Staff ({users.length})
            </button>
            <button
              onClick={() => setSubTab('sessions')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                subTab === 'sessions' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setSubTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                subTab === 'audit' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite User
          </Button>
        </div>
      </div>

      {/* Subtab 1: Users Table */}
      {subTab === 'users' && (
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>User / Representative</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>MFA / 2FA Status</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                      {u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{u.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {u.email} • {u.aclNumber}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      u.role === 'admin' ? 'teal' : u.role === 'broker' ? 'indigo' : 'amber'
                    }
                    size="sm"
                  >
                    {u.role.toUpperCase()}
                  </Badge>
                </TableCell>

                <TableCell>
                  {u.twoFactorEnabled ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Enabled (SMS & App)
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> Not Configured
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-600 font-mono">
                    {u.lastLogin !== 'Never' ? formatDateTimeAU(u.lastLogin) : 'Never'}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge variant={u.active ? 'emerald' : 'rose'} size="sm">
                    {u.active ? 'Active' : 'Deactivated'}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUserToEdit(u);
                        setNewRole(u.role);
                      }}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Role
                    </Button>
                    {u.id !== currentUser?.id && (
                      <Button
                        variant={u.active ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleActive(u)}
                        leftIcon={<Power className="w-3.5 h-3.5" />}
                      >
                        {u.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Subtab 2: Active Sessions */}
      {subTab === 'sessions' && (
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Device & Browser</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((ses) => (
              <TableRow key={ses.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                      {ses.device.includes('iPhone') || ses.device.includes('Android') ? (
                        <Smartphone className="w-4 h-4" />
                      ) : ses.device.includes('iPad') ? (
                        <Tablet className="w-4 h-4" />
                      ) : (
                        <Laptop className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{ses.device}</span>
                      <span className="text-[11px] text-slate-400">{ses.browser}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-mono text-slate-700">{ses.ipAddress}</span>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-600">{ses.location}</span>
                </TableCell>

                <TableCell>
                  {ses.isCurrent ? (
                    <Badge variant="emerald" size="sm">
                      Current Session
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-500">{ses.lastActive}</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  {!ses.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(ses.id)}
                      leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-600" />}
                    >
                      Sign Out
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Subtab 3: Audit Trail Log (50 Entries) */}
      {subTab === 'audit' && (
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Timestamp</TableHead>
              <TableHead>User & Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Compliance Checksum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.slice(0, 50).map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <span className="text-xs text-slate-600 font-mono">
                    {formatDateTimeAU(log.timestamp)}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-bold text-slate-900 text-xs block">{log.userName}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{log.userRole}</span>
                </TableCell>

                <TableCell>
                  <Badge variant="teal" size="sm">
                    {log.action.toUpperCase()}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-700 font-medium">{log.resource}</span>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-mono text-slate-500">{log.ipAddress}</span>
                </TableCell>

                <TableCell>
                  <span className="text-[11px] text-emerald-700 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ASIC/NCCP Valid
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Broker or Assistant"
        description="Add a new representative to your Australian Credit Licence portal."
        maxWidth="md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input
            label="Full Legal Name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="e.g. Liam Hemsworth"
            required
          />

          <Input
            label="Corporate Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="e.g. liam@apexfinance.com.au"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
            >
              <option value="admin">Admin (Principal Broker)</option>
              <option value="broker">Broker (Credit Representative)</option>
              <option value="assistant">Assistant (Loan Processing)</option>
            </Select>

            <Input
              label="Credit Rep (CR #)"
              value={inviteAcl}
              onChange={(e) => setInviteAcl(e.target.value)}
              placeholder="CR #589201"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Mobile (+61)"
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              required
            />
            <Input
              label="Position Title"
              value={inviteTitle}
              onChange={(e) => setInviteTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isInviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={Boolean(userToEdit)}
        onClose={() => setUserToEdit(null)}
        title="Update User Role & Access"
        description={`Modify permissions for ${userToEdit?.name}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Select
            label="Assigned Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            <option value="admin">Admin - Full access to all clients, loans, backups, and user settings</option>
            <option value="broker">Broker - Access restricted to own clients and pipeline</option>
            <option value="assistant">Assistant - Can view and edit files, cannot delete or manage users</option>
          </Select>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setUserToEdit(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRole}>
              Save Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
