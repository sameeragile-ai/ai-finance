import {
  INITIAL_AUDIT_LOGS,
  INITIAL_BACKUPS,
  INITIAL_BUSINESS_DETAILS,
  INITIAL_CLIENTS,
  INITIAL_DOCUMENTS,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_LOANS,
  INITIAL_SESSIONS,
  INITIAL_SENT_EMAILS,
  INITIAL_TASKS,
  INITIAL_USERS,
} from '../data/mockData';
import {
  ActiveSession,
  AuditLog,
  BackupPoint,
  BusinessDetails,
  Client,
  DocumentItem,
  EmailLog,
  EmailTemplate,
  Loan,
  TaskItem,
  User,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'apex_crm_users_v1',
  CLIENTS: 'apex_crm_clients_v1',
  LOANS: 'apex_crm_loans_v1',
  TASKS: 'apex_crm_tasks_v1',
  DOCUMENTS: 'apex_crm_documents_v1',
  AUDIT_LOGS: 'apex_crm_audit_logs_v1',
  TEMPLATES: 'apex_crm_templates_v1',
  SENT_EMAILS: 'apex_crm_sent_emails_v1',
  BACKUPS: 'apex_crm_backups_v1',
  SESSIONS: 'apex_crm_sessions_v1',
  BUSINESS: 'apex_crm_business_v1',
  CURRENT_USER_ID: 'apex_crm_current_user_id',
};

// Simulated network latency
export const simulateDelay = (ms: number = 180): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Failed to parse ${key} from localStorage`, err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage`, err);
  }
}

export const storage = {
  getUsers: (): User[] => loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS),
  setUsers: (data: User[]) => saveToStorage(STORAGE_KEYS.USERS, data),

  getClients: (): Client[] => loadFromStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS),
  setClients: (data: Client[]) => saveToStorage(STORAGE_KEYS.CLIENTS, data),

  getLoans: (): Loan[] => loadFromStorage(STORAGE_KEYS.LOANS, INITIAL_LOANS),
  setLoans: (data: Loan[]) => saveToStorage(STORAGE_KEYS.LOANS, data),

  getTasks: (): TaskItem[] => loadFromStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS),
  setTasks: (data: TaskItem[]) => saveToStorage(STORAGE_KEYS.TASKS, data),

  getDocuments: (): DocumentItem[] => loadFromStorage(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS),
  setDocuments: (data: DocumentItem[]) => saveToStorage(STORAGE_KEYS.DOCUMENTS, data),

  getAuditLogs: (): AuditLog[] => loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  setAuditLogs: (data: AuditLog[]) => saveToStorage(STORAGE_KEYS.AUDIT_LOGS, data),

  getTemplates: (): EmailTemplate[] => loadFromStorage(STORAGE_KEYS.TEMPLATES, INITIAL_EMAIL_TEMPLATES),
  setTemplates: (data: EmailTemplate[]) => saveToStorage(STORAGE_KEYS.TEMPLATES, data),

  getSentEmails: (): EmailLog[] => loadFromStorage(STORAGE_KEYS.SENT_EMAILS, INITIAL_SENT_EMAILS),
  setSentEmails: (data: EmailLog[]) => saveToStorage(STORAGE_KEYS.SENT_EMAILS, data),

  getBackups: (): BackupPoint[] => loadFromStorage(STORAGE_KEYS.BACKUPS, INITIAL_BACKUPS),
  setBackups: (data: BackupPoint[]) => saveToStorage(STORAGE_KEYS.BACKUPS, data),

  getSessions: (): ActiveSession[] => loadFromStorage(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS),
  setSessions: (data: ActiveSession[]) => saveToStorage(STORAGE_KEYS.SESSIONS, data),

  getBusinessDetails: (): BusinessDetails =>
    loadFromStorage(STORAGE_KEYS.BUSINESS, INITIAL_BUSINESS_DETAILS),
  setBusinessDetails: (data: BusinessDetails) => saveToStorage(STORAGE_KEYS.BUSINESS, data),

  getCurrentUserId: (): string => loadFromStorage(STORAGE_KEYS.CURRENT_USER_ID, 'usr-1'),
  setCurrentUserId: (id: string) => saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, id),

  resetAllToDefaults: () => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(INITIAL_LOANS));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(INITIAL_EMAIL_TEMPLATES));
    localStorage.setItem(STORAGE_KEYS.SENT_EMAILS, JSON.stringify(INITIAL_SENT_EMAILS));
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(INITIAL_BACKUPS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(INITIAL_BUSINESS_DETAILS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, JSON.stringify('usr-1'));
  },
};
