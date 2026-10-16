import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../ui/Overlays';
import { Button } from '../ui/Button';
import { Clock, ShieldAlert } from 'lucide-react';

export const SessionTimeoutModal: React.FC = () => {
  const { isSessionWarningOpen, sessionTimeoutCountdown, extendSession, logout } = useAuth();

  if (!isSessionWarningOpen) return null;

  return (
    <Modal isOpen={isSessionWarningOpen} onClose={() => {}} maxWidth="sm">
      <div className="text-center space-y-4 py-2">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">Session Inactivity Warning</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Due to Australian Credit Privacy and security regulations, your session will automatically lock out in:
          </p>
        </div>

        <div className="py-2">
          <span className="text-3xl font-extrabold text-amber-600 font-mono">
            00:{String(sessionTimeoutCountdown).padStart(2, '0')}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">seconds remaining</p>
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <Button variant="outline" size="sm" onClick={logout}>
            Sign Out Now
          </Button>
          <Button variant="primary" size="sm" onClick={extendSession}>
            Extend My Session
          </Button>
        </div>
      </div>
    </Modal>
  );
};
