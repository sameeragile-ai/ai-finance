import { AustralianState, Lender, LoanStage, LoanType, TaskPriority } from '../types';

export const AU_STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

export const AU_LENDERS: Lender[] = [
  'CBA',
  'Westpac',
  'ANZ',
  'NAB',
  'Macquarie',
  'ING',
  'Bankwest',
  'Pepper Money',
  'Suncorp',
  'AMP',
  'Liberty',
];

export const LOAN_TYPES: LoanType[] = [
  'Owner Occupied',
  'Investment',
  'Refinance',
  'Construction',
  'First Home Buyer',
];

export const LOAN_STAGES: LoanStage[] = [
  'New Lead',
  'Fact Find',
  'Pre-Approval',
  'Lodged',
  'Conditional Approval',
  'Unconditional',
  'Settled',
  'Lost',
];

export const STAGE_CONFIG: Record<
  LoanStage,
  { label: string; color: string; bg: string; border: string; badgeClass: string }
> = {
  'New Lead': {
    label: 'New Lead',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  'Fact Find': {
    label: 'Fact Find',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  'Pre-Approval': {
    label: 'Pre-Approval',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  'Lodged': {
    label: 'Lodged',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'Conditional Approval': {
    label: 'Conditional Approval',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  'Unconditional': {
    label: 'Unconditional',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  'Settled': {
    label: 'Settled',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  'Lost': {
    label: 'Lost',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  High: {
    label: 'High Priority',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  Medium: {
    label: 'Medium Priority',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  Low: {
    label: 'Low Priority',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

/**
 * Formats a number to Australian Currency AUD: $1,250,000.00
 */
export function formatAUD(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number to compact AUD: $1.25M or $450K
 */
export function formatAUDCompact(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0';
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${Math.round(amount / 1_000)}k`;
  }
  return formatAUD(amount);
}

/**
 * Formats Date to Australian format: DD/MM/YYYY
 */
export function formatDateAU(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      // In case string is already DD/MM/YYYY
      if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
        return dateInput;
      }
      return '—';
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

/**
 * Formats date and time to Australian format: DD/MM/YYYY, HH:mm
 */
export function formatDateTimeAU(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '—';
  }
}

/**
 * Formats Australian mobile phone numbers: +61 4XX XXX XXX
 */
export function formatPhoneAU(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('614') && cleaned.length >= 11) {
    return `+61 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
  }
  if (cleaned.startsWith('04') && cleaned.length >= 10) {
    return `+61 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
  }
  if (cleaned.startsWith('4') && cleaned.length >= 9) {
    return `+61 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
  }
  return phone;
}

/**
 * Calculates Loan to Value Ratio (LVR)
 */
export function calculateLVR(loanAmount: number, propertyValue: number): number {
  if (!propertyValue || propertyValue <= 0) return 0;
  return Number(((loanAmount / propertyValue) * 100).toFixed(1));
}

/**
 * Formats file size in bytes to readable string (e.g. 2.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
