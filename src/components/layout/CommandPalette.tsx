import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Users, Landmark, CheckSquare, FileText, Settings, ArrowRight, X } from 'lucide-react';
import { storage } from '../../services/storage';
import { formatAUD } from '../../lib/formatters';

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const clients = storage.getClients().filter((c) => !c.isDeleted);
  const loans = storage.getLoans();
  const tasks = storage.getTasks().filter((t) => t.status === 'Pending');

  const q = query.toLowerCase().trim();

  const filteredClients = q
    ? clients.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.address.suburb.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const filteredLoans = q
    ? loans.filter(
        (l) =>
          l.clientName.toLowerCase().includes(q) ||
          l.lender.toLowerCase().includes(q) ||
          l.applicationReference.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const filteredTasks = q
    ? tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search clients, loans, tasks, lenders (e.g. CBA, Mosman, Fact Find)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-4 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded ml-2">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {!query && (
            <div className="p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Quick Navigation
              </p>
              <div className="space-y-1">
                {[
                  { label: 'Loan Pipeline Kanban', path: '/pipeline', icon: <Landmark className="w-4 h-4 text-teal-600" /> },
                  { label: 'Client Directory (40 Clients)', path: '/clients', icon: <Users className="w-4 h-4 text-emerald-600" /> },
                  { label: 'Tasks & Follow-ups', path: '/tasks', icon: <CheckSquare className="w-4 h-4 text-amber-600" /> },
                  { label: 'Compliance Documents', path: '/documents', icon: <FileText className="w-4 h-4 text-sky-600" /> },
                  { label: 'Brokerage Settings & ACL Details', path: '/settings', icon: <Settings className="w-4 h-4 text-slate-600" /> },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && (
            <div className="space-y-4 p-2">
              {filteredClients.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Clients
                  </p>
                  <div className="space-y-1">
                    {filteredClients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect(`/clients/${c.id}`)}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-teal-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                            {c.firstName[0]}
                            {c.lastName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {c.firstName} {c.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {c.address.suburb}, {c.address.state} • {c.phone}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-teal-700 font-medium">View Profile →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredLoans.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Loans & Applications
                  </p>
                  <div className="space-y-1">
                    {filteredLoans.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => handleSelect(`/pipeline?loanId=${l.id}`)}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {l.clientName} — {l.lender} ({formatAUD(l.amount)})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {l.loanType} • Stage: <span className="font-medium text-slate-700">{l.stage}</span> • Ref: {l.applicationReference}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredTasks.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Tasks
                  </p>
                  <div className="space-y-1">
                    {filteredTasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelect('/tasks')}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 transition-colors"
                      >
                        <p className="text-xs text-slate-700 truncate">{t.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">Due {t.dueDate}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredClients.length === 0 && filteredLoans.length === 0 && filteredTasks.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No clients, loans, or tasks found matching &quot;{query}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
