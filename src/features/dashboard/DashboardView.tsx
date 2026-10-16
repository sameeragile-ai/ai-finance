import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Building2,
  CheckCircle,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Filter,
  CheckSquare,
  FileCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { loanService } from '../../services/loanService';
import { clientService } from '../../services/clientService';
import { taskService } from '../../services/taskService';
import { auditService } from '../../services/auditService';
import { Client, Loan, TaskItem, AuditLog } from '../../types';
import { formatAUD, formatAUDCompact, formatDateAU, STAGE_CONFIG } from '../../lib/formatters';
import { Card, Badge, Counter, Skeleton } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';

export const DashboardView: React.FC = () => {
  const { role, currentUser } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const brokerFilter = role === 'broker' ? currentUser?.id : undefined;
        const [l, c, t, a] = await Promise.all([
          loanService.getAll({ brokerId: brokerFilter }),
          clientService.getAll({ brokerId: brokerFilter }),
          taskService.getAll({ assignedToId: role === 'broker' ? currentUser?.id : undefined }),
          auditService.getAll(),
        ]);
        setLoans(l);
        setClients(c);
        setTasks(t);
        setAuditLogs(a.slice(0, 8));
      } catch (err) {
        console.error('Failed loading dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [role, currentUser]);

  // Calculations
  const activeLoans = useMemo(
    () => loans.filter((l) => l.stage !== 'Settled' && l.stage !== 'Lost'),
    [loans]
  );

  const totalPipelineValue = useMemo(
    () => activeLoans.reduce((sum, l) => sum + l.amount, 0),
    [activeLoans]
  );

  const settledThisMonth = useMemo(() => {
    return loans.filter((l) => l.stage === 'Settled');
  }, [loans]);

  const settledValueThisMonth = useMemo(
    () => settledThisMonth.reduce((sum, l) => sum + l.amount, 0),
    [settledThisMonth]
  );

  const conversionRate = useMemo(() => {
    const totalFinished = loans.filter((l) => l.stage === 'Settled' || l.stage === 'Lost').length;
    if (totalFinished === 0) return 87.5;
    return Number(((settledThisMonth.length / totalFinished) * 100).toFixed(1));
  }, [loans, settledThisMonth]);

  const todayStr = new Date().toISOString().split('T')[0];
  const tasksDueToday = useMemo(
    () => tasks.filter((t) => t.status === 'Pending' && t.dueDate <= todayStr),
    [tasks, todayStr]
  );

  // Chart Data: Pipeline by stage
  const stageData = useMemo(() => {
    const stages = [
      'New Lead',
      'Fact Find',
      'Pre-Approval',
      'Lodged',
      'Conditional Approval',
      'Unconditional',
      'Settled',
    ] as const;

    return stages.map((st) => {
      const stageLoans = loans.filter((l) => l.stage === st);
      const totalAmount = stageLoans.reduce((acc, l) => acc + l.amount, 0);
      return {
        stage: st.replace('Conditional Approval', 'Cond. App.').replace('Unconditional', 'Uncond.'),
        fullName: st,
        value: totalAmount,
        count: stageLoans.length,
      };
    });
  }, [loans]);

  // Chart Data: 12 Month Settlements
  const settlementsTrend = [
    { month: 'Nov 25', volume: 3800000, deals: 4 },
    { month: 'Dec 25', volume: 5200000, deals: 6 },
    { month: 'Jan 26', volume: 4100000, deals: 5 },
    { month: 'Feb 26', volume: 6400000, deals: 7 },
    { month: 'Mar 26', volume: 7200000, deals: 8 },
    { month: 'Apr 26', volume: 5900000, deals: 6 },
    { month: 'May 26', volume: 8100000, deals: 9 },
    { month: 'Jun 26', volume: 9400000, deals: 11 },
    { month: 'Jul 26', volume: 6800000, deals: 7 },
    { month: 'Aug 26', volume: 7600000, deals: 8 },
    { month: 'Sep 26', volume: 8900000, deals: 10 },
    { month: 'Oct 26', volume: settledValueThisMonth || 6450000, deals: 7 },
  ];

  // Chart Data: Lender share
  const lenderData = useMemo(() => {
    const map: Record<string, number> = {};
    loans.forEach((l) => {
      map[l.lender] = (map[l.lender] || 0) + l.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [loans]);

  const LENDER_COLORS = ['#0F766E', '#0284C7', '#6366F1', '#F59E0B', '#10B981', '#8B5CF6'];

  // Key Dates (Finance Clauses & Settlements)
  const keyDates = useMemo(() => {
    const list: { title: string; client: string; type: 'Finance Clause' | 'Settlement'; date: string; amount: number; lender: string }[] = [];
    loans.forEach((l) => {
      if (l.financeClauseDate && l.stage !== 'Settled' && l.stage !== 'Lost') {
        list.push({
          title: `Finance Clause Expiry`,
          client: l.clientName,
          type: 'Finance Clause',
          date: l.financeClauseDate,
          amount: l.amount,
          lender: l.lender,
        });
      }
      if (l.settlementDate && l.stage !== 'Lost') {
        list.push({
          title: `Property Settlement`,
          client: l.clientName,
          type: 'Settlement',
          date: l.settlementDate,
          amount: l.amount,
          lender: l.lender,
        });
      }
    });
    return list.slice(0, 5);
  }, [loans]);

  const handleToggleTask = async (taskId: string) => {
    const updated = await taskService.toggleComplete(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    success('Task completed', 'Follow up item updated successfully.');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              G&apos;day, {currentUser?.name.split(' ')[0]}
            </h1>
            <Badge variant="teal" size="sm">
              {role === 'admin' ? 'Brokerage Overview' : `${currentUser?.name} Portfolio`}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Australian credit market summary • RBA Cash Rate 4.35% • Active broking pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pipeline')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Kanban Board
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/clients')}
            leftIcon={<Building2 className="w-4 h-4" />}
          >
            Add New Client
          </Button>
        </div>
      </div>

      {/* 5 KPI CARDS with Signature Hero Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* HERO CARD: Pipeline Value */}
        <div className="sm:col-span-2 lg:col-span-2 rounded-2xl bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-600 p-5 text-white shadow-lg shadow-teal-950/15 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
            <DollarSign className="w-48 h-48" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Total Active Pipeline
              </span>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                {activeLoans.length} active applications
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">
              {formatAUD(totalPipelineValue)}
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-white/20 flex items-center justify-between text-xs text-teal-100">
            <span>Avg Deal Size: {formatAUDCompact(activeLoans.length ? totalPipelineValue / activeLoans.length : 0)}</span>
            <span className="font-semibold text-emerald-200">Across 8 Stages</span>
          </div>
        </div>

        {/* KPI 2: Active Applications */}
        <Card padded hoverLift className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Loans
              </span>
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              <Counter value={activeLoans.length} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
            <span className="font-semibold text-teal-600">8 Pre-Approvals</span> pending search
          </p>
        </Card>

        {/* KPI 3: Settlements This Month */}
        <Card padded hoverLift className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Settled (Month)
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {formatAUDCompact(settledValueThisMonth)}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
            <span className="font-semibold text-emerald-600">{settledThisMonth.length} deals</span> settled via PEXA
          </p>
        </Card>

        {/* KPI 4: Conversion Rate & Tasks */}
        <Card padded hoverLift className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tasks Due Today
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              <Counter value={tasksDueToday.length} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
            Conversion: <span className="font-semibold text-teal-700">{conversionRate}%</span>
          </p>
        </Card>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Pipeline Value by Stage */}
        <Card padded className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pipeline Value by Stage (AUD)</h2>
              <p className="text-xs text-slate-500">Live distribution of deals through credit assessment stages</p>
            </div>
            <Badge variant="teal" size="sm">
              Live Pipeline
            </Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tickFormatter={(val) => formatAUDCompact(val)}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(val: any) => [formatAUD(Number(val)), 'Total Volume']}
                  labelFormatter={(lbl) => `Stage: ${lbl}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                />
                <Bar dataKey="value" fill="#0F766E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Top Lenders */}
        <Card padded>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Lenders by Volume</h2>
              <p className="text-xs text-slate-500">Market share across active applications</p>
            </div>
          </div>
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lenderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {lenderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={LENDER_COLORS[index % LENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatAUDCompact(Number(val)), 'Volume']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {lenderData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: LENDER_COLORS[idx % LENDER_COLORS.length] }}
                />
                <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{formatAUDCompact(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 12-MONTH SETTLEMENTS TREND AREA CHART */}
      <Card padded>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Monthly Settlements (Past 12 Months)</h2>
            <p className="text-xs text-slate-500">
              Historical settled loan volume in AUD (settled on PEXA electronic exchange)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Yearly Total: $79.8M
            </span>
          </div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={settlementsTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="settlementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tickFormatter={(val) => formatAUDCompact(val)} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any) => [formatAUD(Number(val)), 'Settlement Volume']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#0F766E"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#settlementGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 3-COLUMN BOTTOM SECTION: Tasks Due, Key Dates, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COL 1: Upcoming & Today's Tasks */}
        <Card padded className="flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-slate-900">Broker Tasks</h2>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              View All ({tasks.filter((t) => t.status === 'Pending').length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-80">
            {tasks.slice(0, 5).map((t) => (
              <div key={t.id} className="py-2.5 flex items-start gap-3 group">
                <input
                  type="checkbox"
                  checked={t.status === 'Completed'}
                  onChange={() => handleToggleTask(t.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold ${
                      t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Due: <span className="font-medium text-slate-700">{formatDateAU(t.dueDate)}</span> • {t.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* COL 2: Key Settlement & Finance Clause Dates */}
        <Card padded className="flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Key Deadlines</h2>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
              Critical Clauses
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-80">
            {keyDates.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={item.type === 'Finance Clause' ? 'amber' : 'emerald'} size="sm">
                      {item.type}
                    </Badge>
                    <span className="text-xs font-bold text-slate-800">{item.client}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {item.lender} • {formatAUD(item.amount)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-900">{item.date}</span>
                  <span className="block text-[10px] text-slate-400">PEXA / Contract</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* COL 3: Recent Activity / Compliance Feed */}
        <Card padded className="flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Audit & Activity Log</h2>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => navigate('/users')}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1"
              >
                All Logs →
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-80">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{log.userName}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 truncate">{log.resource}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="slate" size="sm">
                    {log.action.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono truncate">{log.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
