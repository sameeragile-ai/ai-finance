export type Role = 'admin' | 'broker' | 'assistant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  active: boolean;
  lastLogin: string;
  aclNumber: string; // Australian Credit Licence / Credit Representative #
  title: string;
}

export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

export type EmploymentType = 'PAYG Permanent' | 'PAYG Casual' | 'Self Employed' | 'Contractor' | 'Retired';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  phone: string;
  dateOfBirth: string; // DD/MM/YYYY
  status: 'Lead' | 'Active' | 'Settled' | 'Archived';
  address: {
    street: string;
    suburb: string;
    state: AustralianState;
    postcode: string;
  };
  employment: {
    type: EmploymentType;
    employer: string;
    occupation: string;
    yearsEmployed: number;
  };
  financials: {
    annualIncome: number;
    otherIncome: number;
    monthlyLivingExpenses: number;
    totalAssets: number;
    totalLiabilities: number;
  };
  notes: string;
  assignedBrokerId: string;
  assignedBrokerName: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export type Lender =
  | 'CBA'
  | 'Westpac'
  | 'ANZ'
  | 'NAB'
  | 'Macquarie'
  | 'ING'
  | 'Bankwest'
  | 'Pepper Money'
  | 'Suncorp'
  | 'AMP'
  | 'Liberty';

export type LoanType =
  | 'Owner Occupied'
  | 'Investment'
  | 'Refinance'
  | 'Construction'
  | 'First Home Buyer';

export type LoanStage =
  | 'New Lead'
  | 'Fact Find'
  | 'Pre-Approval'
  | 'Lodged'
  | 'Conditional Approval'
  | 'Unconditional'
  | 'Settled'
  | 'Lost';

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  lender: Lender;
  loanType: LoanType;
  amount: number;
  propertyValue: number;
  lvr: number; // percentage
  interestRate: number; // e.g. 5.94
  rateType: 'Variable' | 'Fixed 1 Year' | 'Fixed 2 Years' | 'Fixed 3 Years' | 'Fixed 5 Years' | 'Split';
  repaymentType: 'Principal & Interest' | 'Interest Only';
  loanTermYears: number;
  stage: LoanStage;
  stageEnteredAt: string;
  daysInStage: number;
  assignedBrokerId: string;
  assignedBrokerName: string;
  financeClauseDate?: string; // DD/MM/YYYY
  settlementDate?: string; // DD/MM/YYYY
  applicationReference: string;
  commissionEst: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory =
  | 'ID'
  | 'Payslips'
  | 'Bank Statements'
  | 'Tax Returns'
  | 'Contracts'
  | 'Compliance';

export interface DocumentItem {
  id: string;
  clientId: string;
  clientName: string;
  loanId?: string;
  name: string;
  category: DocumentCategory;
  sizeBytes: number;
  fileType: string;
  uploadDate: string;
  status: 'Verified' | 'Pending Review' | 'Rejected';
  uploadedBy: string;
  url?: string;
}

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskCategory =
  | 'Document Collection'
  | 'Lender Follow-up'
  | 'Client Review'
  | 'Compliance'
  | 'Settlement';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: 'Pending' | 'Completed';
  category: TaskCategory;
  assignedToId: string;
  assignedToName: string;
  linkedClientId?: string;
  linkedClientName?: string;
  linkedLoanId?: string;
  completedAt?: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  category: string;
}

export interface EmailLog {
  id: string;
  clientId: string;
  clientName: string;
  recipientEmail: string;
  subject: string;
  templateId?: string;
  body: string;
  sentAt: string;
  status: 'Sent' | 'Delivered' | 'Opened' | 'Failed';
  openedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: 'login' | 'logout' | 'view' | 'create' | 'update' | 'delete' | 'download' | 'restore' | 'export';
  resource: string;
  details: string;
  ipAddress: string;
}

export interface BackupPoint {
  id: string;
  timestamp: string;
  sizeMB: number;
  status: 'Healthy' | 'Completed' | 'Warning';
  createdBy: string;
  notes: string;
}

export interface ActiveSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface BusinessDetails {
  companyName: string;
  abn: string;
  aclNumber: string;
  aggregator: string;
  primaryPhone: string;
  primaryEmail: string;
  address: string;
  mfaEnforced: boolean;
  sessionTimeoutMinutes: number;
}
