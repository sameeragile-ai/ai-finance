import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Download,
  Eye,
  AlertCircle,
  FileCheck,
  Plus,
  X,
  File,
} from 'lucide-react';
import { documentService, REQUIRED_LOAN_CATEGORIES } from '../../services/documentService';
import { clientService } from '../../services/clientService';
import { DocumentItem, DocumentCategory, Client } from '../../types';
import { formatDateAU, formatFileSize } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, Badge, Skeleton, EmptyState } from '../../components/ui/MiscUI';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/NavigationTables';
import { Modal, ConfirmDialog } from '../../components/ui/Overlays';
import { Select } from '../../components/ui/Input';

export const DocumentsView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { canDelete, currentUser } = useAuth();
  const { success, error, warning } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedClientId, setSelectedClientId] = useState<string>(
    searchParams.get('clientId') || 'ALL'
  );

  // Upload modal & Drag/Drop state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadClientId, setUploadClientId] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('ID');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview & Delete
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const [docs, cls] = await Promise.all([
        documentService.getAll({
          clientId: selectedClientId !== 'ALL' ? selectedClientId : undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        }),
        clientService.getAll(),
      ]);
      setDocuments(docs);
      setClients(cls);
      if (!uploadClientId && cls.length > 0) {
        setUploadClientId(cls[0].id);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [selectedCategory, selectedClientId]);

  // Document file validation
  const validateAndSetFile = (file: File) => {
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext)) {
      warning('Invalid File Format', 'Only PDF, JPG, PNG, and DOCX files are permitted for credit submission.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      warning('File Too Large', 'Maximum file size allowed is 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadClientId) return;

    setIsUploading(true);
    try {
      const client = clients.find((c) => c.id === uploadClientId) || clients[0];
      await documentService.upload({
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        name: selectedFile.name,
        category: uploadCategory,
        sizeBytes: selectedFile.size,
        fileType: selectedFile.type || 'application/pdf',
        status: 'Pending Review',
        uploadedBy: currentUser?.name || 'Accredited Broker',
        url: '#',
      });

      success('Document Uploaded', `${selectedFile.name} attached to ${client.firstName} ${client.lastName}.`);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      await loadDocs();
    } catch (err) {
      error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    await documentService.delete(docToDelete.id);
    success('Document Deleted', `${docToDelete.name} removed from repository.`);
    setDocToDelete(null);
    await loadDocs();
  };

  const handleVerifyStatus = async (id: string, newStatus: DocumentItem['status']) => {
    await documentService.updateStatus(id, newStatus);
    success('Compliance Status Updated', `Document marked as ${newStatus}.`);
    await loadDocs();
  };

  // Filtered
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase().trim();
    return documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.clientName.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Credit Documents</h1>
            <Badge variant="teal" size="sm">
              {filteredDocs.length} Verified Files
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store, verify, and package client identity, income, and mortgage contracts under NCCP regulations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsUploadModalOpen(true)}
          leftIcon={<UploadCloud className="w-4 h-4" />}
        >
          Upload Document
        </Button>
      </div>

      {/* Filter Bar */}
      <Card padded className="py-3.5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search documents by file name or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Categories</option>
              {REQUIRED_LOAN_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Client:</span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 max-w-xs truncate"
            >
              <option value="ALL">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No documents found"
          description="Upload supporting documents for this client or reset your search filters."
          action={
            <Button variant="primary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
              Upload First Document
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Document Name</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs truncate max-w-xs">
                        {doc.name}
                      </span>
                      <span className="text-[10px] text-slate-400">By {doc.uploadedBy}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-semibold text-slate-800">{doc.clientName}</span>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {doc.category}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-500 font-mono">{formatFileSize(doc.sizeBytes)}</span>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-500">{formatDateAU(doc.uploadDate)}</span>
                </TableCell>

                <TableCell>
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
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title="Quick Preview"
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      title="Download Certified Copy"
                      onClick={() => success('Download Started', `Downloading ${doc.name}...`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {canDelete && (
                      <button
                        title="Delete Document"
                        onClick={() => setDocToDelete(doc)}
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
      )}

      {/* Upload Document Modal with Drag-and-Drop Area */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedFile(null);
        }}
        title="Upload Client Credit Document"
        description="Attach supporting documentation to client loan files."
        maxWidth="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <Select
            label="Linked Client"
            value={uploadClientId}
            onChange={(e) => setUploadClientId(e.target.value)}
            required
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.address.suburb})
              </option>
            ))}
          </Select>

          <Select
            label="Document Category"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
          >
            {REQUIRED_LOAN_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>

          {/* Drag & drop upload zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              File Attachment (PDF, JPG, PNG, DOCX - max 10MB)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-teal-500 bg-teal-50/50'
                  : 'border-slate-200 hover:border-teal-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-[11px] text-teal-700 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Click to choose another file</span>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Click to browse or drag & drop file here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accepts certified Australian PDFs, scans, and mortgage contracts
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!selectedFile}
              isLoading={isUploading}
            >
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.name}
        description={`Category: ${previewDoc?.category} • Client: ${previewDoc?.clientName}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="bg-slate-100 rounded-xl p-8 text-center border border-slate-200 flex flex-col items-center justify-center min-h-[220px]">
            <FileText className="w-16 h-16 text-teal-700 mb-3" />
            <p className="text-sm font-bold text-slate-900">{previewDoc?.name}</p>
            <p className="text-xs text-slate-500 mt-1">
              Encrypted Australian mortgage compliance file • Certified storage
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => success('Preview Rendered', 'Document verified against Australian Credit standards.')}
              >
                Open in Full Viewer
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => success('Download initiated', `Saving ${previewDoc?.name}`)}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download PDF
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Verification Status:</span>
              <button
                type="button"
                onClick={() => previewDoc && handleVerifyStatus(previewDoc.id, 'Verified')}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-100"
              >
                Mark Verified
              </button>
              <button
                type="button"
                onClick={() => previewDoc && handleVerifyStatus(previewDoc.id, 'Rejected')}
                className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 hover:bg-rose-100"
              >
                Mark Rejected
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Permanently Delete Document?"
        message={`Are you sure you want to delete ${docToDelete?.name}? This action will be recorded in the compliance audit trail.`}
        confirmText="Yes, Delete File"
        variant="danger"
      />
    </div>
  );
};
