import { calculateLVR } from '../lib/formatters';
import { Loan, LoanStage } from '../types';
import { simulateDelay, storage } from './storage';

export interface LoanFilterOptions {
  brokerId?: string;
  stage?: LoanStage | 'ALL';
  lender?: string;
  search?: string;
}

export const loanService = {
  async getAll(options: LoanFilterOptions = {}): Promise<Loan[]> {
    await simulateDelay(150);
    let list = storage.getLoans();

    if (options.brokerId) {
      list = list.filter((l) => l.assignedBrokerId === options.brokerId);
    }

    if (options.stage && options.stage !== 'ALL') {
      list = list.filter((l) => l.stage === options.stage);
    }

    if (options.lender && options.lender !== 'ALL') {
      list = list.filter((l) => l.lender === options.lender);
    }

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.clientName.toLowerCase().includes(q) ||
          l.lender.toLowerCase().includes(q) ||
          l.loanType.toLowerCase().includes(q) ||
          l.applicationReference.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getById(id: string): Promise<Loan | null> {
    await simulateDelay(100);
    const loans = storage.getLoans();
    return loans.find((l) => l.id === id) || null;
  },

  async getByClientId(clientId: string): Promise<Loan[]> {
    await simulateDelay(100);
    const loans = storage.getLoans();
    return loans.filter((l) => l.clientId === clientId);
  },

  async create(loanData: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'lvr' | 'daysInStage'>): Promise<Loan> {
    await simulateDelay(200);
    const loans = storage.getLoans();
    const lvr = calculateLVR(loanData.amount, loanData.propertyValue);

    const newLoan: Loan = {
      ...loanData,
      id: `ln-${Date.now()}`,
      lvr,
      daysInStage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    loans.unshift(newLoan);
    storage.setLoans(loans);
    return newLoan;
  },

  async update(id: string, updates: Partial<Loan>): Promise<Loan> {
    await simulateDelay(180);
    const loans = storage.getLoans();
    const index = loans.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Loan not found');

    const current = loans[index];
    const amount = updates.amount !== undefined ? updates.amount : current.amount;
    const propertyValue = updates.propertyValue !== undefined ? updates.propertyValue : current.propertyValue;
    const lvr = calculateLVR(amount, propertyValue);

    const updated: Loan = {
      ...current,
      ...updates,
      lvr,
      updatedAt: new Date().toISOString(),
    };

    loans[index] = updated;
    storage.setLoans(loans);
    return updated;
  },

  async updateStage(id: string, newStage: LoanStage): Promise<Loan> {
    await simulateDelay(120);
    const loans = storage.getLoans();
    const index = loans.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Loan not found');

    const current = loans[index];
    const updated: Loan = {
      ...current,
      stage: newStage,
      stageEnteredAt: new Date().toISOString(),
      daysInStage: 0,
      updatedAt: new Date().toISOString(),
    };

    loans[index] = updated;
    storage.setLoans(loans);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await simulateDelay(150);
    const loans = storage.getLoans();
    const filtered = loans.filter((l) => l.id !== id);
    if (filtered.length === loans.length) return false;
    storage.setLoans(filtered);
    return true;
  },
};
