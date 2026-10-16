import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Filter,
  DollarSign,
  Landmark,
  Building,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { loanService } from '../../services/loanService';
import { clientService } from '../../services/clientService';
import { Loan, LoanStage, Lender, LoanType, Client } from '../../types';
import {
  AU_LENDERS,
  LOAN_STAGES,
  LOAN_TYPES,
  STAGE_CONFIG,
  formatAUD,
  formatAUDCompact,
  formatDateAU,
} from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, Badge, Skeleton, EmptyState } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/NavigationTables';
import { Modal } from '../../components/ui/Overlays';
import { Input, Select } from '../../components/ui/Input';
import { LoanDetailDrawer } from './LoanDetailDrawer';

// KANBAN CARD
interface KanbanCardProps {
  loan: Loan;
  onClick: () => void;
  isOverlay?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ loan, onClick, isOverlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: loan.id,
    data: { loan },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all duration-150 cursor-grab active:cursor-grabbing select-none group ${
        isDragging ? 'opacity-40 shadow-none' : ''
      } ${isOverlay ? 'shadow-2xl border-teal-500 scale-105 rotate-1' : ''}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80">
          {loan.lender}
        </span>
        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {loan.daysInStage}d in stage
        </span>
      </div>

      <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
        {loan.clientName}
      </h4>

      <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
        <span className="text-sm font-black text-slate-900">{formatAUD(loan.amount)}</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            loan.lvr > 80 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {loan.lvr}% LVR
        </span>
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
        <span className="truncate">{loan.loanType}</span>
        <span className="font-medium text-slate-600 truncate">{loan.assignedBrokerName.split(' ')[0]}</span>
      </div>
    </div>
  );
};

// KANBAN COLUMN
interface KanbanColumnProps {
  stage: LoanStage;
  loans: Loan[];
  onCardClick: (loanId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, loans, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  });

  const stageStyle = STAGE_CONFIG[stage];
  const totalVolume = loans.reduce((acc, l) => acc + l.amount, 0);

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 flex flex-col rounded-2xl bg-slate-100/70 border transition-colors max-h-[calc(100vh-210px)] ${
        isOver ? 'border-teal-500 bg-teal-50/40' : 'border-slate-200/70'
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-slate-200/80 bg-white/70 backdrop-blur-xs rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${stageStyle.bg.replace('bg-', 'bg-teal-')}`} />
            <span className="text-xs font-bold text-slate-800 truncate">{stage}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
            {loans.length}
          </span>
        </div>
        <div className="text-[11px] font-bold text-slate-500 mt-1">
          {formatAUDCompact(totalVolume)}
        </div>
      </div>

      {/* Cards Scroll Area */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[140px]">
        {loans.map((loan) => (
          <KanbanCard key={loan.id} loan={loan} onClick={() => onCardClick(loan.id)} />
        ))}
        {loans.length === 0 && (
          <div className="h-28 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-center p-3">
            <p className="text-[11px] text-slate-400">No applications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const PipelineView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, currentUser } = useAuth();
  const { success, error } = useToast();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLender, setSelectedLender] = useState<string>('ALL');
  const [selectedLoanType, setSelectedLoanType] = useState<string>('ALL');

  // Drawer
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Add Loan Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLoanClient, setNewLoanClient] = useState('');
  const [newLoanAmount, setNewLoanAmount] = useState(850000);
  const [newLoanPropValue, setNewLoanPropValue] = useState(1100000);
  const [newLoanLender, setNewLoanLender] = useState<Lender>('CBA');
  const [newLoanType, setNewLoanType] = useState<LoanType>('Owner Occupied');
  const [newLoanStage, setNewLoanStage] = useState<LoanStage>('New Lead');

  // Drag and drop state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const loadPipeline = async () => {
    setIsLoading(true);
    try {
      const brokerFilter = role === 'broker' ? currentUser?.id : undefined;
      const [lns, cls] = await Promise.all([
        loanService.getAll({
          brokerId: brokerFilter,
          search: searchQuery,
          lender: selectedLender,
        }),
        clientService.getAll({ brokerId: brokerFilter }),
      ]);
      setLoans(lns);
      setClients(cls);
    } catch (err) {
      console.error(err);
      error('Failed to load pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, [role, currentUser, searchQuery, selectedLender]);

  // Check URL query param for loanId or createForClient
  useEffect(() => {
    const loanIdParam = searchParams.get('loanId');
    if (loanIdParam) {
      setSelectedLoanId(loanIdParam);
    }
    const createForClientParam = searchParams.get('createForClient');
    if (createForClientParam) {
      setNewLoanClient(createForClientParam);
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  // Filtered loans
  const filteredLoans = useMemo(() => {
    let result = loans;
    if (selectedLoanType !== 'ALL') {
      result = result.filter((l) => l.loanType === selectedLoanType);
    }
    return result;
  }, [loans, selectedLoanType]);

  const activeDragLoan = useMemo(() => {
    if (!activeDragId) return null;
    return loans.find((l) => l.id === activeDragId) || null;
  }, [activeDragId, loans]);

  // Handle Drag Start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  // Handle Drag End
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const loanId = String(active.id);
    const targetStage = String(over.id) as LoanStage;

    if (!LOAN_STAGES.includes(targetStage)) return;

    const currentLoan = loans.find((l) => l.id === loanId);
    if (!currentLoan || currentLoan.stage === targetStage) return;

    // Optimistic UI update
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, stage: targetStage, daysInStage: 0 } : l))
    );

    try {
      await loanService.updateStage(loanId, targetStage);
      success(
        'Stage Updated',
        `${currentLoan.clientName} moved to ${targetStage}.`
      );
    } catch (err) {
      error('Failed to update stage on server');
      await loadPipeline();
    }
  };

  const handleCreateLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === newLoanClient) || clients[0];
    if (!client) return;

    try {
      const newLoan = await loanService.create({
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        lender: newLoanLender,
        loanType: newLoanType,
        amount: newLoanAmount,
        propertyValue: newLoanPropValue,
        interestRate: 5.84,
        rateType: 'Variable',
        repaymentType: 'Principal & Interest',
        loanTermYears: 30,
        stage: newLoanStage,
        stageEnteredAt: new Date().toISOString(),
        assignedBrokerId: client.assignedBrokerId,
        assignedBrokerName: client.assignedBrokerName,
        applicationReference: `APX-${newLoanLender.slice(0, 3).toUpperCase()}-${Math.floor(202600 + Math.random() * 900)}`,
        commissionEst: Math.round(newLoanAmount * 0.0065),
        notes: `New loan application initiated for ${client.firstName} ${client.lastName}.`,
      });

      success('Loan Application Created', `Added ${newLoan.loanType} application with ${newLoan.lender}.`);
      setIsAddModalOpen(false);
      await loadPipeline();
    } catch (err) {
      error('Failed to create loan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Loan Pipeline</h1>
            <Badge variant="teal" size="sm">
              {filteredLoans.length} Deals
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Drag and drop applications across Australian credit assessment and settlement stages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle button */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Application
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card padded className="py-3.5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by client name, lender, or application reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            />
          </div>

          {/* Lender Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Lender:</span>
            <select
              value={selectedLender}
              onChange={(e) => setSelectedLender(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Lenders</option>
              {AU_LENDERS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Loan Purpose */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Type:</span>
            <select
              value={selectedLoanType}
              onChange={(e) => setSelectedLoanType(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Loan Types</option>
              {LOAN_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* KANBAN OR LIST VIEW */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-72 h-96 rounded-2xl shrink-0" />
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none">
            {LOAN_STAGES.map((stage) => {
              const stageLoans = filteredLoans.filter((l) => l.stage === stage);
              return (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  loans={stageLoans}
                  onCardClick={(id) => setSelectedLoanId(id)}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeDragLoan ? (
              <KanbanCard loan={activeDragLoan} onClick={() => {}} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* LIST VIEW */
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Client</TableHead>
              <TableHead>Lender & Purpose</TableHead>
              <TableHead>Amount & LVR</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Key Dates</TableHead>
              <TableHead>Broker</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.map((l) => (
              <TableRow key={l.id} onClick={() => setSelectedLoanId(l.id)}>
                <TableCell>
                  <span className="font-bold text-slate-900 block">{l.clientName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">Ref: {l.applicationReference}</span>
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {l.lender}
                    </span>
                    <span className="text-slate-500 ml-2">{l.loanType}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-extrabold text-slate-900 text-xs">{formatAUD(l.amount)}</span>
                  <span className="text-[11px] text-slate-400 block">{l.lvr}% LVR</span>
                </TableCell>
                <TableCell>
                  <Badge variant="slate" className={STAGE_CONFIG[l.stage].badgeClass} size="sm">
                    {l.stage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-[11px] text-slate-600">
                    {l.settlementDate && <div>Settlement: {l.settlementDate}</div>}
                    {l.financeClauseDate && <div>Finance Clause: {l.financeClauseDate}</div>}
                    {!l.settlementDate && !l.financeClauseDate && <span className="text-slate-400">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-slate-700">{l.assignedBrokerName}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLoanId(l.id);
                    }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Loan Detail Side Drawer */}
      <LoanDetailDrawer
        loanId={selectedLoanId}
        isOpen={Boolean(selectedLoanId)}
        onClose={() => {
          setSelectedLoanId(null);
          setSearchParams({});
        }}
        onUpdated={loadPipeline}
      />

      {/* Add New Loan Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Mortgage Application"
        description="Link a new borrowing request to an existing Australian client profile."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateLoanSubmit} className="space-y-4">
          <Select
            label="Client"
            value={newLoanClient}
            onChange={(e) => setNewLoanClient(e.target.value)}
            required
          >
            <option value="">Select a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.address.suburb}, {c.address.state})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Loan Amount ($ AUD)"
              type="number"
              value={newLoanAmount}
              onChange={(e) => setNewLoanAmount(Number(e.target.value))}
              required
            />
            <Input
              label="Estimated Property Value ($)"
              type="number"
              value={newLoanPropValue}
              onChange={(e) => setNewLoanPropValue(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Lender"
              value={newLoanLender}
              onChange={(e) => setNewLoanLender(e.target.value as any)}
            >
              {AU_LENDERS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>

            <Select
              label="Loan Purpose"
              value={newLoanType}
              onChange={(e) => setNewLoanType(e.target.value as any)}
            >
              {LOAN_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Starting Pipeline Stage"
              value={newLoanStage}
              onChange={(e) => setNewLoanStage(e.target.value as any)}
            >
              {LOAN_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!newLoanClient}>
              Create Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
