import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  DollarSign,
  FileCheck,
  Plus,
  Send,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import { loanService } from '../../services/loanService';
import { documentService } from '../../services/documentService';
import { emailService } from '../../services/emailService';
import { auditService } from '../../services/auditService';
import { Client, Loan, DocumentItem, EmailLog, AuditLog } from '../../types';
import {
  formatAUD,
  formatDateAU,
  formatDateTimeAU,
  formatPhoneAU,
  STAGE_CONFIG,
} from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, Badge, Skeleton, EmptyState } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/NavigationTables';
import { Textarea } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/Overlays';
import { ClientModal } from './ClientModal';

export const ClientDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canDelete, currentUser, role } = useAuth();
  const { success, error } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docChecklist, setDocChecklist] = useState<any[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [timeline, setTimeline] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [clientNotes, setClientNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const loadClientData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const c = await clientService.getById(id);
      if (!c) {
        error('Client not found');
        navigate('/clients');
        return;
      }
      setClient(c);
      setClientNotes(c.notes || '');

      const [lns, docs, chk, eml, logs] = await Promise.all([
        loanService.getByClientId(id),
        documentService.getAll({ clientId: id }),
        documentService.getLoanChecklist(id),
        emailService.getSentLogs(id),
        auditService.getAll(),
      ]);

      setLoans(lns);
      setDocuments(docs);
      setDocChecklist(chk);
      setEmails(eml);
      setTimeline(logs.filter((l) => l.resource.includes(c.firstName) || l.details.includes(c.firstName)));
    } catch (err) {
      console.error(err);
      error('Failed to load client profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [id]);

  const handleSaveNotes = async () => {
    if (!client) return;
    setIsSavingNotes(true);
    try {
      await clientService.update(client.id, { notes: clientNotes });
      setClient((prev) => (prev ? { ...prev, notes: clientNotes } : null));
      success('Notes Saved', 'Broker fact-find notes updated successfully.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    await clientService.softDelete(client.id);
    success('Client Archived', `${client.firstName} ${client.lastName} moved to recently deleted.`);
    navigate('/clients');
  };

  if (isLoading || !client) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const netWorth = client.financials.totalAssets - client.financials.totalLiabilities;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'loans', label: 'Loans & Pipeline', badge: loans.length },
    { id: 'documents', label: 'Documents & Checklist', badge: documents.length },
    { id: 'notes', label: 'Fact-Find Notes' },
    { id: 'emails', label: 'Emails & Disclosures', badge: emails.length },
    { id: 'timeline', label: 'Activity Timeline', badge: timeline.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back button and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clients Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/email?clientId=${client.id}`)}
            leftIcon={<Send className="w-3.5 h-3.5 text-teal-600" />}
          >
            Compose Email
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit className="w-3.5 h-3.5 text-slate-600" />}
          >
            Edit Profile
          </Button>

          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteConfirmOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Client
            </Button>
          )}
        </div>
      </div>

      {/* Hero Client Summary Header Card */}
      <Card padded className="border-teal-200/50 bg-gradient-to-r from-teal-50/40 via-white to-slate-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-teal-900/10 shrink-0">
              {client.firstName[0]}
              {client.lastName[0]}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {client.firstName} {client.lastName}
                </h1>
                <Badge
                  variant={
                    client.status === 'Active'
                      ? 'emerald'
                      : client.status === 'Lead'
                      ? 'sky'
                      : client.status === 'Settled'
                      ? 'teal'
                      : 'slate'
                  }
                  size="sm"
                >
                  {client.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${client.email}`} className="hover:text-teal-700">
                    {client.email}
                  </a>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {formatPhoneAU(client.phone)}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {client.address.street}, {client.address.suburb} {client.address.state} {client.address.postcode}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Annual Income
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {formatAUD(client.financials.annualIncome)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Net Worth
              </span>
              <span className="text-base font-extrabold text-teal-800">
                {formatAUD(netWorth)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Assigned Broker
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {client.assignedBrokerName}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Financials & Balance Sheet */}
          <div className="lg:col-span-2 space-y-6">
            <Card padded>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-700" /> Financial Position & HEM Benchmark
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Base Income</span>
                  <span className="text-sm font-black text-slate-900">
                    {formatAUD(client.financials.annualIncome)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Other Income</span>
                  <span className="text-sm font-black text-slate-900">
                    {formatAUD(client.financials.otherIncome)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Monthly HEM Expenses</span>
                  <span className="text-sm font-black text-slate-900">
                    {formatAUD(client.financials.monthlyLivingExpenses)}
                  </span>
                </div>
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100">
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">Total Net Assets</span>
                  <span className="text-sm font-black text-teal-900">
                    {formatAUD(netWorth)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Total Declared Assets</span>
                  <div className="text-base font-bold text-slate-800">
                    {formatAUD(client.financials.totalAssets)}
                  </div>
                  <p className="text-[11px] text-slate-400">Includes property, superannuation, cash & vehicle</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Total Declared Liabilities</span>
                  <div className="text-base font-bold text-rose-700">
                    {formatAUD(client.financials.totalLiabilities)}
                  </div>
                  <p className="text-[11px] text-slate-400">Includes existing mortgages, credit cards & HECS</p>
                </div>
              </div>
            </Card>

            <Card padded>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-700" /> Employment & Verification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Employment Basis:</span>
                  <span className="font-bold text-slate-800 text-sm">{client.employment.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Employer:</span>
                  <span className="font-bold text-slate-800 text-sm">{client.employment.employer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Occupation / Role:</span>
                  <span className="font-bold text-slate-800 text-sm">{client.employment.occupation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Length in Current Role:</span>
                  <span className="font-bold text-slate-800 text-sm">{client.employment.yearsEmployed} years</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Col: Personal & Compliance Details */}
          <div className="space-y-6">
            <Card padded>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                Personal & Compliance
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Date of Birth:</span>
                  <span className="font-semibold text-slate-800">{client.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Broker:</span>
                  <span className="font-semibold text-slate-800">{client.assignedBrokerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Record Created:</span>
                  <span className="font-semibold text-slate-800">{formatDateAU(client.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Last Updated:</span>
                  <span className="font-semibold text-slate-800">{formatDateAU(client.updatedAt)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Loans */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Mortgage & Loan Applications ({loans.length})
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/pipeline?createForClient=${client.id}`)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Loan Application
            </Button>
          </div>

          {loans.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-6 h-6" />}
              title="No loans found for this client"
              description="Create a new loan application to start tracking it in the Kanban pipeline."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/pipeline?createForClient=${client.id}`)}
                >
                  Create First Loan
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loans.map((loan) => {
                const stageStyle = STAGE_CONFIG[loan.stage];
                return (
                  <Card key={loan.id} padded hoverLift className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                          {loan.lender}
                        </span>
                        <Badge variant="slate" className={stageStyle.badgeClass} size="sm">
                          {loan.stage}
                        </Badge>
                      </div>

                      <div className="text-xl font-black text-slate-900 mt-1">
                        {formatAUD(loan.amount)}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {loan.loanType} • Property: {formatAUD(loan.propertyValue)} (LVR: {loan.lvr}%)
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Interest Rate:</span>
                          <span className="font-bold text-slate-800">{loan.interestRate}% ({loan.rateType})</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Repayment:</span>
                          <span className="font-bold text-slate-800">{loan.repaymentType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">Ref: {loan.applicationReference}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/pipeline?loanId=${loan.id}`)}
                      >
                        View in Pipeline →
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Documents & Checklist */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Missing Document Checklist */}
          <Card padded>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-700" /> Credit Policy Document Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {docChecklist.map((item) => (
                <div
                  key={item.category}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    item.status === 'Verified'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : item.status === 'Pending Review'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{item.category}</span>
                    <span className="text-[11px] text-slate-500">{item.count} files uploaded</span>
                  </div>
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
          </Card>

          {/* Uploaded Documents List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Uploaded Files ({documents.length})</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/documents?clientId=${client.id}`)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Upload Document
              </Button>
            </div>

            {documents.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-6 h-6" />}
                title="No documents uploaded yet"
                description="Upload driver's licence, payslips, or bank statements for credit verification."
              />
            ) : (
              <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {doc.category} • Uploaded {formatDateAU(doc.uploadDate)} by {doc.uploadedBy}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        doc.status === 'Verified'
                          ? 'emerald'
                          : doc.status === 'Pending Review'
                          ? 'amber'
                          : 'rose'
                      }
                      size="sm"
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Fact-Find Notes */}
      {activeTab === 'notes' && (
        <Card padded className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">NCCP Best Interests Duty & Fact-Find Notes</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record customer goals, borrowing preferences, exit strategies, and credit interview minutes.
            </p>
          </div>

          <Textarea
            rows={10}
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="Type comprehensive notes here..."
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveNotes}
              isLoading={isSavingNotes}
            >
              Save Notes
            </Button>
          </div>
        </Card>
      )}

      {/* Tab 5: Emails */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Sent Client Communications</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/email?clientId=${client.id}`)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Compose New Email
            </Button>
          </div>

          {emails.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-6 h-6" />}
              title="No emails recorded for this client"
              description="Send automated template communications directly with live merge tags."
            />
          ) : (
            <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200">
              {emails.map((e) => (
                <div key={e.id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{e.subject}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{e.body}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Sent {formatDateTimeAU(e.sentAt)} to {e.recipientEmail}
                    </span>
                  </div>
                  <Badge
                    variant={
                      e.status === 'Opened'
                        ? 'teal'
                        : e.status === 'Delivered'
                        ? 'emerald'
                        : e.status === 'Sent'
                        ? 'slate'
                        : 'rose'
                    }
                    size="sm"
                  >
                    {e.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Activity Timeline */}
      {activeTab === 'timeline' && (
        <Card padded>
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Compliance & Activity Timeline
          </h3>
          <div className="space-y-4">
            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No audit records found for this client file.</p>
            ) : (
              timeline.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.userName} ({item.userRole})</span>
                      <span className="text-slate-400 text-[10px]">{formatDateTimeAU(item.timestamp)}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{item.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Edit Client Modal */}
      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        clientToEdit={client}
        onSave={async (data) => {
          await clientService.update(client.id, data);
          success('Client Updated', 'Client profile updated successfully.');
          await loadClientData();
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteClient}
        title="Move Client to Recycle Bin?"
        message={`Are you sure you want to delete ${client.firstName} ${client.lastName}? The client can still be recovered from Recently Deleted for 30 days.`}
        confirmText="Yes, Soft Delete"
        variant="danger"
      />
    </div>
  );
};
