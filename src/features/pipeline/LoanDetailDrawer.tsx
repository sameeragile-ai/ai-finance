import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Building,
  DollarSign,
  Calendar,
  Percent,
  CheckCircle2,
  FileCheck,
  Trash2,
  Save,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Loan, LoanStage, Lender, LoanType } from '../../types';
import { loanService } from '../../services/loanService';
import { documentService } from '../../services/documentService';
import { AU_LENDERS, LOAN_STAGES, LOAN_TYPES, formatAUD, calculateLVR, formatDateAU } from '../../lib/formatters';
import { Drawer, ConfirmDialog } from '../../components/ui/Overlays';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/MiscUI';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

interface LoanDetailDrawerProps {
  loanId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const LoanDetailDrawer: React.FC<LoanDetailDrawerProps> = ({
  loanId,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const navigate = useNavigate();
  const { canDelete } = useAuth();
  const { success, error } = useToast();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docChecklist, setDocChecklist] = useState<any[]>([]);

  // Editable fields
  const [amount, setAmount] = useState<number>(0);
  const [propertyValue, setPropertyValue] = useState<number>(0);
  const [lender, setLender] = useState<Lender>('CBA');
  const [loanType, setLoanType] = useState<LoanType>('Owner Occupied');
  const [stage, setStage] = useState<LoanStage>('New Lead');
  const [interestRate, setInterestRate] = useState<number>(5.94);
  const [rateType, setRateType] = useState<Loan['rateType']>('Variable');
  const [repaymentType, setRepaymentType] = useState<Loan['repaymentType']>('Principal & Interest');
  const [financeClauseDate, setFinanceClauseDate] = useState<string>('');
  const [settlementDate, setSettlementDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    async function loadLoan() {
      if (!loanId || !isOpen) return;
      setIsLoading(true);
      try {
        const l = await loanService.getById(loanId);
        if (l) {
          setLoan(l);
          setAmount(l.amount);
          setPropertyValue(l.propertyValue);
          setLender(l.lender);
          setLoanType(l.loanType);
          setStage(l.stage);
          setInterestRate(l.interestRate);
          setRateType(l.rateType);
          setRepaymentType(l.repaymentType);
          setFinanceClauseDate(l.financeClauseDate || '');
          setSettlementDate(l.settlementDate || '');
          setNotes(l.notes || '');

          const chk = await documentService.getLoanChecklist(l.clientId, l.id);
          setDocChecklist(chk);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLoan();
  }, [loanId, isOpen]);

  const liveLVR = calculateLVR(amount, propertyValue);

  const handleSave = async () => {
    if (!loan) return;
    setIsSaving(true);
    try {
      await loanService.update(loan.id, {
        amount,
        propertyValue,
        lender,
        loanType,
        stage,
        interestRate,
        rateType,
        repaymentType,
        financeClauseDate: financeClauseDate || undefined,
        settlementDate: settlementDate || undefined,
        notes,
      });
      success('Loan Application Updated', `Details saved for ${loan.clientName}.`);
      onUpdated();
      onClose();
    } catch (err) {
      error('Failed to update loan application');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!loan) return;
    await loanService.delete(loan.id);
    success('Loan Application Deleted', 'The deal was removed from pipeline.');
    setIsDeleteOpen(false);
    onUpdated();
    onClose();
  };

  if (!loan) return null;

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={loan.clientName}
        subtitle={`Application Reference: ${loan.applicationReference} • Broker: ${loan.assignedBrokerName}`}
        width="xl"
      >
        <div className="space-y-6">
          {/* Top Quick Status Pill & Client Shortcut */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm">
                {stage}
              </Badge>
              <span className="text-xs text-slate-600">
                In this stage for <span className="font-bold text-slate-900">{loan.daysInStage} days</span>
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/clients/${loan.clientId}`);
              }}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              View Client File
            </Button>
          </div>

          {/* Loan Pipeline Stage Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Pipeline Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as LoanStage)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              {LOAN_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Financial Amounts & LVR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Loan Amount ($ AUD)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
            <Input
              label="Security Property Value ($)"
              type="number"
              value={propertyValue}
              onChange={(e) => setPropertyValue(Number(e.target.value))}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Calculated LVR
              </label>
              <div
                className={`px-3.5 py-2.5 rounded-xl border text-sm font-black flex items-center justify-between ${
                  liveLVR > 80
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                <span>{liveLVR}%</span>
                <span className="text-[10px] font-semibold">
                  {liveLVR > 80 ? 'LMI Required' : 'Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Lender and Loan Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Accredited Lender"
              value={lender}
              onChange={(e) => setLender(e.target.value as Lender)}
            >
              {AU_LENDERS.map((lend) => (
                <option key={lend} value={lend}>
                  {lend}
                </option>
              ))}
            </Select>

            <Select
              label="Loan Purpose / Type"
              value={loanType}
              onChange={(e) => setLoanType(e.target.value as LoanType)}
            >
              {LOAN_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
            </Select>
          </div>

          {/* Interest Rate & Repayments */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Interest Rate (% p.a.)"
              type="number"
              step="0.01"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
            />
            <Select
              label="Rate Structure"
              value={rateType}
              onChange={(e) => setRateType(e.target.value as any)}
            >
              <option value="Variable">Variable</option>
              <option value="Fixed 1 Year">Fixed 1 Year</option>
              <option value="Fixed 2 Years">Fixed 2 Years</option>
              <option value="Fixed 3 Years">Fixed 3 Years</option>
              <option value="Fixed 5 Years">Fixed 5 Years</option>
              <option value="Split">Split (Fixed + Var)</option>
            </Select>
            <Select
              label="Repayment Type"
              value={repaymentType}
              onChange={(e) => setRepaymentType(e.target.value as any)}
            >
              <option value="Principal & Interest">Principal & Interest</option>
              <option value="Interest Only">Interest Only</option>
            </Select>
          </div>

          {/* Critical Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Finance Clause Date (DD/MM/YYYY)"
              value={financeClauseDate}
              onChange={(e) => setFinanceClauseDate(e.target.value)}
              placeholder="e.g. 28/10/2026"
            />
            <Input
              label="Settlement Target Date (DD/MM/YYYY)"
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
              placeholder="e.g. 15/11/2026"
            />
          </div>

          {/* Upfront Broking Commission Estimate */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-700 block">Upfront Commission Estimate</span>
              <span className="text-[11px] text-slate-500">Based on standard 0.65% aggregator schedule</span>
            </div>
            <span className="text-sm font-extrabold text-teal-800">
              {formatAUD(loan.commissionEst)}
            </span>
          </div>

          {/* Required Documents Checklist for this loan */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-teal-700" /> Compliance Document Checklist
            </h4>
            <div className="space-y-1.5">
              {docChecklist.map((item) => (
                <div
                  key={item.category}
                  className="p-2 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-800">{item.category}</span>
                  <Badge
                    variant={
                      item.status === 'Verified'
                        ? 'emerald'
                        : item.status === 'Pending Review'
                        ? 'amber'
                        : 'slate'
                    }
                    size="sm"
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Broker File Notes */}
          <Textarea
            label="Underwriting & Assessor Notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record bank conditions, credit assessor queries, and valuation notes..."
          />

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {canDelete ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Deal
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Loan Details
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Loan Application?"
        message={`Are you sure you want to delete this ${loan.loanType} application with ${loan.lender}?`}
        confirmText="Yes, Delete Deal"
        variant="danger"
      />
    </>
  );
};
