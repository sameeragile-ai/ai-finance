import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  ShieldCheck,
  User,
  LogOut,
  Building,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/MiscUI';
import { Role } from '../../types';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu, onOpenCommandPalette }) => {
  const { currentUser, role, switchRole, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    {
      id: '1',
      title: 'Finance Clause Due Today',
      desc: 'Marcus Vance - CBA $1,250,000 (Mosman purchase)',
      time: '35m ago',
      icon: <Calendar className="w-4 h-4 text-amber-500" />,
    },
    {
      id: '2',
      title: 'Macquarie Formal Approval',
      desc: 'Georgia Kelly unconditional approval issued',
      time: '2h ago',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: '3',
      title: 'Missing BID Checklist item',
      desc: '2 clients require Best Interests Duty documentation check',
      time: '4h ago',
      icon: <AlertTriangle className="w-4 h-4 text-teal-500" />,
    },
  ];

  const handleRoleChange = (newRole: Role) => {
    switchRole(newRole);
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between w-full max-w-md px-3.5 py-2 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            <span className="truncate">Search clients, loans, tasks (Ctrl+K)...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right items: Role switcher, Notifications, User Menu */}
      <div className="flex items-center gap-3">
        {/* Role Pill Switcher */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Role:</span>
          {(['admin', 'broker', 'assistant'] as const).map((r) => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                role === r
                  ? 'bg-white text-teal-800 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-2">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  3 unread
                </span>
              </div>
              <div className="py-2 space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">{n.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{n.desc}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-700 to-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
              {currentUser?.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.name}
              </span>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wide">
                {role}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser?.email}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge variant="teal" size="sm">
                    {currentUser?.aclNumber}
                  </Badge>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> MFA Active
                  </span>
                </div>
              </div>

              {/* Mobile Role Switcher */}
              <div className="p-2 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Switch Active Role
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(['admin', 'broker', 'assistant'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`px-2 py-1 text-xs rounded-lg font-medium capitalize text-center ${
                        role === r
                          ? 'bg-teal-700 text-white font-bold'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
