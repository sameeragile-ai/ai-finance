import React, { useState } from 'react';
import {
  Settings,
  Building,
  ShieldCheck,
  Bell,
  Lock,
  User,
  RotateCcw,
  Save,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { storage } from '../../services/storage';
import { BusinessDetails } from '../../types';
import { Card, Badge } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/Overlays';

export const SettingsView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { success, error } = useToast();

  const [business, setBusiness] = useState<BusinessDetails>(() => storage.getBusinessDetails());
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userTitle, setUserTitle] = useState(currentUser?.title || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');
  const [aclNumber, setAclNumber] = useState(currentUser?.aclNumber || '');

  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser?.twoFactorEnabled ?? true);

  // Notification toggles
  const [notifyLodged, setNotifyLodged] = useState(true);
  const [notifySettlement, setNotifySettlement] = useState(true);
  const [notifyClauses, setNotifyClauses] = useState(true);

  // Reset modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const users = storage.getUsers();
    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        name: userName,
        title: userTitle,
        phone: userPhone,
        aclNumber,
        twoFactorEnabled,
      };
      storage.setUsers(users);
      success('Profile Updated', 'Broker profile credentials saved.');
    }
  };

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    storage.setBusinessDetails(business);
    success('Licence Details Saved', 'Australian Credit Licence & Aggregator information updated.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      error('Password too short', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Password mismatch', 'New passwords do not match.');
      return;
    }
    success('Password Changed', 'Your broker security password was updated.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleResetDemoData = () => {
    storage.resetAllToDefaults();
    success('Demo Data Reset', 'Restored 40 clients, 30 loans, 60 tasks, 25 documents, and 50 audit logs.');
    setIsResetConfirmOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Brokerage Settings</h1>
          <Badge variant="teal" size="sm">
            ASIC & NCCP Configured
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Manage representative profile, Australian Credit Licence (ACL) details, MFA security, and notification triggers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Broker Profile */}
        <Card padded>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <User className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">Broker Representative Profile</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            <Input
              label="Position Title"
              value={userTitle}
              onChange={(e) => setUserTitle(e.target.value)}
              required
            />
            <Input
              label="Direct Mobile (+61)"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              required
            />
            <Input
              label="Credit Representative / ACL Reference"
              value={aclNumber}
              onChange={(e) => setAclNumber(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button variant="primary" size="sm" type="submit" leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Card 2: Australian Business & ACL Details */}
        <Card padded>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Building className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">Australian Credit Licence & Aggregator</h2>
          </div>

          <form onSubmit={handleSaveBusiness} className="space-y-4">
            <Input
              label="Legal Entity / Company Name"
              value={business.companyName}
              onChange={(e) => setBusiness({ ...business, companyName: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Australian Business Number (ABN)"
                value={business.abn}
                onChange={(e) => setBusiness({ ...business, abn: e.target.value })}
                required
              />
              <Input
                label="Australian Credit Licence (ACL #)"
                value={business.aclNumber}
                onChange={(e) => setBusiness({ ...business, aclNumber: e.target.value })}
                required
              />
            </div>
            <Input
              label="Aggregator Panel"
              value={business.aggregator}
              onChange={(e) => setBusiness({ ...business, aggregator: e.target.value })}
              required
            />
            <Input
              label="Principal Office Address"
              value={business.address}
              onChange={(e) => setBusiness({ ...business, address: e.target.value })}
              required
            />

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={role !== 'admin'}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                {role === 'admin' ? 'Update Licence Details' : 'Admin Only (Locked)'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Card 3: Security & Password */}
        <Card padded>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Lock className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">Change Broker Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Demo@1234"
              required
            />
            <Input
              label="New Secure Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button variant="outline" size="sm" type="submit">
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* Card 4: 2FA & Notification Preferences */}
        <Card padded className="space-y-5">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</h2>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Mandatory MFA Login</span>
                <span className="text-[11px] text-slate-500">
                  Enforces 6-digit one-time code on every broker sign-in.
                </span>
              </div>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => {
                  setTwoFactorEnabled(e.target.checked);
                  success(
                    e.target.checked ? '2FA Enabled' : '2FA Disabled',
                    'Authentication security updated.'
                  );
                }}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Bell className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Compliance & Alert Triggers</h2>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span className="text-slate-700">Instant notification when application lodged</span>
                <input
                  type="checkbox"
                  checked={notifyLodged}
                  onChange={(e) => setNotifyLodged(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span className="text-slate-700">SMS reminder 48 hours prior to Finance Clause</span>
                <input
                  type="checkbox"
                  checked={notifyClauses}
                  onChange={(e) => setNotifyClauses(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span className="text-slate-700">PEXA settlement day congratulations dispatch</span>
                <input
                  type="checkbox"
                  checked={notifySettlement}
                  onChange={(e) => setNotifySettlement(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300"
                />
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Card 5: Demo Data Reset */}
      <Card padded className="border-rose-200/80 bg-rose-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" /> Reset Demo Mock Data
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Restores initial seed dataset: 40 Australian clients, 30 loans across 8 pipeline stages, 60 tasks, 25 documents, 4 users, and 50 audit log entries.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset All Mock Data
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDemoData}
        title="Reset All Mock Data to Default?"
        message="This will overwrite all local changes and re-populate the complete 40-client Australian mortgage dataset."
        confirmText="Yes, Reset Everything"
        variant="danger"
      />
    </div>
  );
};
