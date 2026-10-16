import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  Filter,
  ArrowUpDown,
  Mail,
  Phone,
  RotateCcw,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building,
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import { Client, AustralianState } from '../../types';
import { AU_STATES, formatAUD, formatDateAU, formatPhoneAU } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, Badge, Skeleton, EmptyState } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/NavigationTables';
import { ConfirmDialog } from '../../components/ui/Overlays';
import { ClientModal } from './ClientModal';
import { RecentlyDeletedModal } from './RecentlyDeletedModal';

export const ClientsView: React.FC = () => {
  const navigate = useNavigate();
  const { role, currentUser, canDelete } = useAuth();
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'income' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRecentlyDeletedOpen, setIsRecentlyDeletedOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const brokerFilter = role === 'broker' ? currentUser?.id : undefined;
      const list = await clientService.getAll({
        brokerId: brokerFilter,
        search: searchQuery,
        state: selectedState,
        status: selectedStatus,
      });
      setClients(list);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [role, currentUser, searchQuery, selectedState, selectedStatus]);

  // Sort
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortField === 'income') {
        comparison = a.financials.annualIncome - b.financials.annualIncome;
      } else if (sortField === 'created') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [clients, sortField, sortOrder]);

  // Paginated
  const totalPages = Math.ceil(sortedClients.length / pageSize) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedClients.slice(start, start + pageSize);
  }, [sortedClients, currentPage, pageSize]);

  const toggleSort = (field: 'name' | 'income' | 'created') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    await clientService.softDelete(clientToDelete.id);
    success('Client Archived', `${clientToDelete.firstName} ${clientToDelete.lastName} moved to recently deleted.`);
    setClientToDelete(null);
    await loadClients();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clients Directory</h1>
            <Badge variant="teal" size="sm">
              {clients.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Australian mortgage clients, borrowing power, and NCCP compliance fact-finds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRecentlyDeletedOpen(true)}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-600" />}
          >
            Recently Deleted
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Client
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padded className="py-3.5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or Australian suburb (e.g. Bondi, Mosman)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            />
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All States</option>
              {AU_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Settled">Settled</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Clients Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : paginatedClients.length === 0 ? (
        <EmptyState
          icon={<Building className="w-8 h-8" />}
          title="No clients match your filter criteria"
          description="Try clearing your search query or reset the Australian state filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedState('ALL');
                setSelectedStatus('ALL');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <span>Client Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </TableHead>
                <TableHead>Contact & Suburb</TableHead>
                <TableHead>Employment</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('income')}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <span>Annual Income</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Broker</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => navigate(`/clients/${c.id}`)}
                  className="group"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        {c.firstName[0]}
                        {c.lastName[0]}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block group-hover:text-teal-700 transition-colors">
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="text-[11px] text-slate-400">DOB: {c.dateOfBirth}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <div className="text-slate-800 font-medium">{c.email}</div>
                      <div className="text-slate-400">
                        {c.address.suburb}, {c.address.state} {c.address.postcode} • {formatPhoneAU(c.phone)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 block">{c.employment.occupation}</span>
                      <span className="text-slate-400 text-[11px]">{c.employment.type} ({c.employment.employer})</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-extrabold text-slate-900 text-xs">
                      {formatAUD(c.financials.annualIncome)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Exp: {formatAUD(c.financials.monthlyLivingExpenses)}/mo
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        c.status === 'Active'
                          ? 'emerald'
                          : c.status === 'Lead'
                          ? 'sky'
                          : c.status === 'Settled'
                          ? 'teal'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {c.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-semibold text-slate-700">
                      {c.assignedBrokerName}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        title="View Full Profile"
                        onClick={() => navigate(`/clients/${c.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canDelete && (
                        <button
                          title="Delete Client"
                          onClick={() => setClientToDelete(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, sortedClients.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{sortedClients.length}</span> clients
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="px-3 py-1 font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <ClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={async (newClient) => {
          await clientService.create(newClient);
          success('Client Created', `${newClient.firstName} ${newClient.lastName} has been added.`);
          await loadClients();
        }}
      />

      {/* Recently Deleted Modal */}
      <RecentlyDeletedModal
        isOpen={isRecentlyDeletedOpen}
        onClose={() => setIsRecentlyDeletedOpen(false)}
        onRestored={loadClients}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(clientToDelete)}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Move Client to Recycle Bin?"
        message={`Are you sure you want to delete ${clientToDelete?.firstName} ${clientToDelete?.lastName}? All associated data can be restored from the Recently Deleted panel.`}
        confirmText="Yes, Soft Delete"
        variant="danger"
      />
    </div>
  );
};
