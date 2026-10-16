import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Role, User } from '../types';
import { storage } from '../services/storage';
import { auditService } from '../services/auditService';

interface AuthContextType {
  currentUser: User | null;
  role: Role;
  isAuthenticated: boolean;
  pending2FA: boolean;
  failedAttempts: number;
  isLockedOut: boolean;
  loginEmailAttempt: string;
  isSessionWarningOpen: boolean;
  sessionTimeoutCountdown: number;
  login: (email: string, pass: string) => { success: boolean; error?: string; require2FA?: boolean };
  verify2FA: (code: string) => { success: boolean; error?: string };
  cancel2FA: () => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  resetLockout: () => void;
  extendSession: () => void;
  requestPasswordReset: (email: string) => boolean;
  // Permissions
  canDelete: boolean;
  canManageUsers: boolean;
  canManageBackups: boolean;
  canExportData: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_FAILED_ATTEMPTS = 5;
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes inactivity
const COUNTDOWN_SECONDS = 30;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const users = storage.getUsers();
    const id = storage.getCurrentUserId();
    return users.find((u) => u.id === id) || users[0] || null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [pending2FA, setPending2FA] = useState<boolean>(false);
  const [loginEmailAttempt, setLoginEmailAttempt] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  // Inactivity timeout state
  const [isSessionWarningOpen, setIsSessionWarningOpen] = useState<boolean>(false);
  const [sessionTimeoutCountdown, setSessionTimeoutCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const lastActivityRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<any>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const extendSession = useCallback(() => {
    setIsSessionWarningOpen(false);
    setSessionTimeoutCountdown(COUNTDOWN_SECONDS);
    lastActivityRef.current = Date.now();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    if (currentUser) {
      auditService.log({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'logout',
        resource: 'Authentication System',
        details: 'User logged out of CRM session',
      });
    }
    setIsAuthenticated(false);
    setPending2FA(false);
    setIsSessionWarningOpen(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  }, [currentUser]);

  // Monitor user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserActivity = () => {
      if (!isSessionWarningOpen) {
        lastActivityRef.current = Date.now();
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    const checkInactivity = setInterval(() => {
      const timeSinceLast = Date.now() - lastActivityRef.current;
      if (timeSinceLast >= INACTIVITY_LIMIT_MS && !isSessionWarningOpen) {
        setIsSessionWarningOpen(true);
        setSessionTimeoutCountdown(COUNTDOWN_SECONDS);

        countdownIntervalRef.current = setInterval(() => {
          setSessionTimeoutCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              logout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(checkInactivity);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated, isSessionWarningOpen, logout]);

  const login = (email: string, pass: string) => {
    if (isLockedOut) {
      return { success: false, error: 'Account temporarily locked due to 5 failed attempts. Please reset password or contact your administrator.' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    const users = storage.getUsers();
    const matchedUser = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    // Default demo password is Demo@1234, or accept password for any known user email
    const isValidPass = pass === 'Demo@1234';

    if (!matchedUser || !isValidPass) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        setIsLockedOut(true);
        return {
          success: false,
          error: 'Security Lockout: 5 consecutive failed login attempts detected. Access blocked to protect client credit data.',
        };
      }
      return {
        success: false,
        error: `Invalid credentials. (${MAX_FAILED_ATTEMPTS - nextAttempts} attempts remaining before lockout)`,
      };
    }

    if (!matchedUser.active) {
      return { success: false, error: 'This broker account has been deactivated. Please contact your compliance manager.' };
    }

    // Passed password step, proceed to 2FA step
    setLoginEmailAttempt(trimmedEmail);
    setPending2FA(true);
    return { success: true, require2FA: true };
  };

  const verify2FA = (code: string) => {
    if (code !== '123456') {
      return { success: false, error: 'Invalid 6-digit authentication token. Please enter 123456.' };
    }

    const users = storage.getUsers();
    const matchedUser = users.find((u) => u.email.toLowerCase() === loginEmailAttempt) || users[0];

    setCurrentUser(matchedUser);
    storage.setCurrentUserId(matchedUser.id);
    setIsAuthenticated(true);
    setPending2FA(false);
    setFailedAttempts(0);
    lastActivityRef.current = Date.now();

    auditService.log({
      userId: matchedUser.id,
      userName: matchedUser.name,
      userRole: matchedUser.role,
      action: 'login',
      resource: 'Authentication System',
      details: 'Successful 2FA MFA verification',
    });

    return { success: true };
  };

  const cancel2FA = () => {
    setPending2FA(false);
  };

  const resetLockout = () => {
    setFailedAttempts(0);
    setIsLockedOut(false);
  };

  const requestPasswordReset = (email: string) => {
    resetLockout();
    return true;
  };

  const switchRole = (newRole: Role) => {
    const users = storage.getUsers();
    let targetUser: User | undefined;
    if (newRole === 'admin') {
      targetUser = users.find((u) => u.role === 'admin') || users[0];
    } else if (newRole === 'broker') {
      targetUser = users.find((u) => u.role === 'broker') || users[1];
    } else {
      targetUser = users.find((u) => u.role === 'assistant') || users[3];
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      storage.setCurrentUserId(targetUser.id);
      auditService.log({
        userId: targetUser.id,
        userName: targetUser.name,
        userRole: targetUser.role,
        action: 'login',
        resource: 'Role Switcher',
        details: `Switched active preview role to ${newRole.toUpperCase()} (${targetUser.name})`,
      });
    }
  };

  const role: Role = currentUser?.role || 'admin';
  const canDelete = role !== 'assistant';
  const canManageUsers = role === 'admin';
  const canManageBackups = role === 'admin';
  const canExportData = role === 'admin' || role === 'broker';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        pending2FA,
        failedAttempts,
        isLockedOut,
        loginEmailAttempt,
        isSessionWarningOpen,
        sessionTimeoutCountdown,
        login,
        verify2FA,
        cancel2FA,
        logout,
        switchRole,
        resetLockout,
        extendSession,
        requestPasswordReset,
        canDelete,
        canManageUsers,
        canManageBackups,
        canExportData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
