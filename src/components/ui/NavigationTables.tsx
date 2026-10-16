import React from 'react';
import { motion } from 'motion/react';

// TABLE
export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs ${className}`}>
      <table className="w-full text-left text-sm text-slate-700 divide-y divide-slate-100">{children}</table>
    </div>
  );
};

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <thead className={`bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}>{children}</thead>;
};

export const TableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}> = ({ children, className = '', onClick, hoverable = true }) => {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors border-b border-slate-100 last:border-b-0 ${
        hoverable ? 'hover:bg-slate-50/70' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <th className={`px-4 py-3.5 font-semibold text-slate-600 ${className}`}>{children}</th>;
};

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <tbody className={`divide-y divide-slate-100 ${className}`}>{children}</tbody>;
};

export const TableCell: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <td className={`px-4 py-3.5 text-slate-700 align-middle ${className}`}>{children}</td>;
};

// TABS
export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none ${
              isActive ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-xs rounded-full font-medium ${
                  isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-600 to-emerald-500"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
