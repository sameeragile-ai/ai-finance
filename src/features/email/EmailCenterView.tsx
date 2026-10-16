import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mail,
  Send,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Eye,
  AlertCircle,
  Copy,
  Plus,
} from 'lucide-react';
import { emailService } from '../../services/emailService';
import { clientService } from '../../services/clientService';
import { loanService } from '../../services/loanService';
import { EmailLog, EmailTemplate, Client, Loan } from '../../types';
import { formatDateTimeAU, formatAUD } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, Badge, Skeleton, EmptyState } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/NavigationTables';
import { Modal } from '../../components/ui/Overlays';
import { Input, Select, Textarea } from '../../components/ui/Input';

export const EmailCenterView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sentLogs, setSentLogs] = useState<EmailLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'sent' | 'templates'>('sent');

  // Compose Modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    searchParams.get('clientId') || ''
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-1');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Preview Modal
  const [previewLog, setPreviewLog] = useState<EmailLog | null>(null);

  const loadEmailData = async () => {
    setIsLoading(true);
    try {
      const [tmpls, logs, cls, lns] = await Promise.all([
        emailService.getTemplates(),
        emailService.getSentLogs(),
        clientService.getAll(),
        loanService.getAll(),
      ]);
      setTemplates(tmpls);
      setSentLogs(logs);
      setClients(cls);
      setLoans(lns);

      if (!selectedClientId && cls.length > 0) {
        setSelectedClientId(cls[0].id);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load email data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmailData();
  }, []);

  // Check if open compose directly
  useEffect(() => {
    const cid = searchParams.get('clientId');
    if (cid) {
      setSelectedClientId(cid);
      setIsComposeOpen(true);
    }
  }, [searchParams]);

  // Update preview when template or client changes
  useEffect(() => {
    if (!selectedTemplateId || !selectedClientId) return;
    const tmpl = templates.find((t) => t.id === selectedTemplateId);
    const client = clients.find((c) => c.id === selectedClientId);
    const clientLoan = loans.find((l) => l.clientId === selectedClientId);

    if (tmpl && client) {
      const vars: Record<string, string> = {
        client_first_name: client.firstName,
        client_last_name: client.lastName,
        lender: clientLoan ? clientLoan.lender : 'Commonwealth Bank (CBA)',
        loan_amount: clientLoan ? formatAUD(clientLoan.amount) : '$850,000.00',
        loan_type: clientLoan ? clientLoan.loanType : 'Owner Occupied Home Loan',
        broker_name: currentUser?.name || 'Sarah Jenkins',
        broker_title: currentUser?.title || 'Principal Broker',
      };

      setEmailSubject(emailService.renderTemplate(tmpl.subject, vars));
      setEmailBody(emailService.renderTemplate(tmpl.body, vars));
    }
  }, [selectedTemplateId, selectedClientId, templates, clients, loans, currentUser]);

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    setIsSending(true);
    try {
      await emailService.sendEmail({
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        recipientEmail: client.email,
        subject: emailSubject,
        body: emailBody,
        templateId: selectedTemplateId,
      });

      success('Email Dispatched via Mailgun', `Delivered to ${client.email}`);
      setIsComposeOpen(false);
      await loadEmailData();
    } catch (err) {
      error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Email & Disclosures</h1>
            <Badge variant="teal" size="sm">
              Mailgun Ready
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated Australian mortgage compliance disclosures, document requests, and milestone notices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'sent' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sent Communications ({sentLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'templates' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Templates ({templates.length})
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsComposeOpen(true)}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Compose Email
          </Button>
        </div>
      </div>

      {/* Main Tab 1: Sent Emails Log */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>Recipient & Subject</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Mailgun Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sentLogs.map((log) => (
                <TableRow key={log.id} onClick={() => setPreviewLog(log)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs truncate max-w-md">
                          {log.subject}
                        </span>
                        <span className="text-[11px] text-slate-400">{log.recipientEmail}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-semibold text-slate-800">{log.clientName}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDateTimeAU(log.sentAt)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        log.status === 'Opened'
                          ? 'teal'
                          : log.status === 'Delivered'
                          ? 'emerald'
                          : log.status === 'Sent'
                          ? 'slate'
                          : 'rose'
                      }
                      size="sm"
                    >
                      {log.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewLog(log);
                      }}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Main Tab 2: Email Templates Manager */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} padded hoverLift className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="teal" size="sm">
                    {tmpl.category}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {tmpl.id}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{tmpl.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>

                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-mono whitespace-pre-wrap line-clamp-4">
                  {tmpl.body}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Merge tags: {'{{client_first_name}}'}, {'{{lender}}'}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplateId(tmpl.id);
                    setIsComposeOpen(true);
                  }}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Use Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Compose Email Modal with Live Preview */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Client Communication"
        description="Select a template and preview automated merge fields before sending."
        maxWidth="2xl"
      >
        <form onSubmit={handleSendEmailSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Select Template"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>

            <Select
              label="Target Client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Subject Line"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            required
          />

          <Textarea
            label="Message Body (Live Preview with Merge Tags Replaced)"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={8}
            required
          />

          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Mailgun Webhook tracking enabled for Delivery and Open events.</span>
            </div>
            <span className="font-semibold text-[11px]">Best Interests Duty Logged</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsComposeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSending}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send Communication
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Email Modal */}
      <Modal
        isOpen={Boolean(previewLog)}
        onClose={() => setPreviewLog(null)}
        title={previewLog?.subject}
        description={`To: ${previewLog?.recipientEmail} • Sent: ${formatDateTimeAU(previewLog?.sentAt)}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans max-h-96 overflow-y-auto">
            {previewLog?.body}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Delivery Status: <strong className="text-emerald-700">{previewLog?.status}</strong>
            </span>
            <Button variant="outline" size="sm" onClick={() => setPreviewLog(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
