import { DocumentCategory, DocumentItem } from '../types';
import { simulateDelay, storage } from './storage';

export const REQUIRED_LOAN_CATEGORIES: DocumentCategory[] = [
  'ID',
  'Payslips',
  'Bank Statements',
  'Tax Returns',
  'Contracts',
  'Compliance',
];

export const documentService = {
  async getAll(options: { clientId?: string; loanId?: string; category?: string } = {}): Promise<DocumentItem[]> {
    await simulateDelay(150);
    let docs = storage.getDocuments();

    if (options.clientId) {
      docs = docs.filter((d) => d.clientId === options.clientId);
    }
    if (options.loanId) {
      docs = docs.filter((d) => d.loanId === options.loanId);
    }
    if (options.category && options.category !== 'ALL') {
      docs = docs.filter((d) => d.category === options.category);
    }

    return docs;
  },

  async getById(id: string): Promise<DocumentItem | null> {
    await simulateDelay(100);
    const docs = storage.getDocuments();
    return docs.find((d) => d.id === id) || null;
  },

  async upload(doc: Omit<DocumentItem, 'id' | 'uploadDate'>): Promise<DocumentItem> {
    await simulateDelay(250);
    const docs = storage.getDocuments();
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString(),
    };
    docs.unshift(newDoc);
    storage.setDocuments(docs);
    return newDoc;
  },

  async delete(id: string): Promise<boolean> {
    await simulateDelay(150);
    const docs = storage.getDocuments();
    const filtered = docs.filter((d) => d.id !== id);
    if (filtered.length === docs.length) return false;
    storage.setDocuments(filtered);
    return true;
  },

  async updateStatus(id: string, status: DocumentItem['status']): Promise<DocumentItem> {
    await simulateDelay(150);
    const docs = storage.getDocuments();
    const doc = docs.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.status = status;
    storage.setDocuments(docs);
    return doc;
  },

  async getLoanChecklist(clientId: string, loanId?: string) {
    await simulateDelay(100);
    const allDocs = storage.getDocuments().filter((d) => d.clientId === clientId);

    return REQUIRED_LOAN_CATEGORIES.map((category) => {
      const docsInCat = allDocs.filter((d) => d.category === category);
      const isVerified = docsInCat.some((d) => d.status === 'Verified');
      const isPending = docsInCat.some((d) => d.status === 'Pending Review');
      return {
        category,
        count: docsInCat.length,
        status: isVerified ? 'Verified' : isPending ? 'Pending Review' : docsInCat.length > 0 ? 'Uploaded' : 'Missing',
        documents: docsInCat,
      };
    });
  },
};
