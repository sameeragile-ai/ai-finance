import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GitPullRequest,
  FileCheck,
  CheckSquare,
  Mail,
  ShieldAlert,
  DatabaseBackup,
  Settings,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Shield,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/MiscUI';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { role, currentUser, switchRole } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Clients', path: '/clients', icon: Users },
    { label: 'Loan Pipeline', path: '/pipeline', icon: GitPullRequest },
    { label: 'Documents', path: '/documents', icon: FileCheck },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Email Center', path: '/email', icon: Mail },
    ...(role === 'admin'
      ? [
          { label: 'Users & Security', path: '/users', icon: ShieldAlert, adminOnly: true },
          { label: 'Backups & Health', path: '/backups', icon: DatabaseBackup, adminOnly: true },
        ]
      : []),
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const roleBadges: Record<string, { label: string; variant: 'teal' | 'indigo' | 'amber' }> = {
    admin: { label: 'Principal Broker', variant: 'teal' },
    broker: { label: 'Loan Writer', variant: 'indigo' },
    assistant: { label: 'Loan Officer', variant: 'amber' },
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-700 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-900/10 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                  Apex <span className="text-teal-700 font-semibold">CRM</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">
                  AU Mortgage Broking
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-700 to-emerald-600 text-white shadow-sm shadow-teal-900/15'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User preview and quick role toggle info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser?.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser?.aclNumber}</p>
                </div>
                <Badge variant={roleBadges[role]?.variant || 'slate'} size="sm">
                  {role.toUpperCase()}
                </Badge>
              </div>

              {/* Quick switcher buttons */}
              <div className="pt-1.5 flex items-center justify-between border-t border-slate-200/60 text-[10px] text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[9px]">Preview:</span>
                <div className="flex gap-1">
                  {(['admin', 'broker', 'assistant'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => switchRole(r)}
                      className={`px-1.5 py-0.5 rounded capitalize font-medium transition-colors ${
                        role === r
                          ? 'bg-teal-700 text-white font-bold'
                          : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {r.slice(0, 4)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                title={`${currentUser?.name} (${role})`}
                className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                {role[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
