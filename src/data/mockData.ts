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
import { calculateLVR } from '../lib/formatters';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Sarah Jenkins',
    email: 'admin@demo.com',
    role: 'admin',
    phone: '+61 412 890 123',
    twoFactorEnabled: true,
    active: true,
    lastLogin: '2026-10-16T13:45:00.000Z',
    aclNumber: 'ACL #482910',
    title: 'Managing Director & Principal Broker',
  },
  {
    id: 'usr-2',
    name: 'Lachlan Reid',
    email: 'lachlan@demo.com',
    role: 'broker',
    phone: '+61 423 781 445',
    twoFactorEnabled: true,
    active: true,
    lastLogin: '2026-10-16T11:20:00.000Z',
    aclNumber: 'CR #512093',
    title: 'Senior Mortgage & Commercial Broker',
  },
  {
    id: 'usr-3',
    name: 'Maya Patel',
    email: 'maya@demo.com',
    role: 'broker',
    phone: '+61 434 567 890',
    twoFactorEnabled: true,
    active: true,
    lastLogin: '2026-10-16T09:15:00.000Z',
    aclNumber: 'CR #539821',
    title: 'Mortgage Broker & FHB Specialist',
  },
  {
    id: 'usr-4',
    name: 'Cooper Hayes',
    email: 'cooper@demo.com',
    role: 'assistant',
    phone: '+61 445 123 678',
    twoFactorEnabled: false,
    active: true,
    lastLogin: '2026-10-16T08:50:00.000Z',
    aclNumber: 'CR #548102',
    title: 'Credit Analyst & Loan Processing Officer',
  },
];

export const INITIAL_BUSINESS_DETAILS: BusinessDetails = {
  companyName: 'Apex Finance & Mortgage Broking Pty Ltd',
  abn: '74 612 849 203',
  aclNumber: '482910',
  aggregator: 'Connective Mortgage Aggregation Services',
  primaryPhone: '+61 2 8394 7700',
  primaryEmail: 'settlements@apexfinance.com.au',
  address: 'Level 14, 175 Pitt Street, Sydney NSW 2000',
  mfaEnforced: true,
  sessionTimeoutMinutes: 30,
};

// Seed 40 realistic Australian clients
const clientRawSeed = [
  { f: 'Marcus', l: 'Vance', s: 'Mosman', st: 'NSW', pc: '2088', emp: 'PAYG Permanent', role: 'Architect', inc: 240000, exp: 5800, brk: 0 },
  { f: 'Georgia', l: 'Kelly', s: 'Paddington', st: 'NSW', pc: '2021', emp: 'PAYG Permanent', role: 'Brand Director', inc: 195000, exp: 4200, brk: 1 },
  { f: 'Oliver', l: 'Brennan', s: 'South Yarra', st: 'VIC', pc: '3141', emp: 'Self Employed', role: 'Tech Consultant', inc: 285000, exp: 6400, brk: 2 },
  { f: 'Charlotte', l: 'Wong', s: 'Toorak', st: 'VIC', pc: '3142', emp: 'PAYG Permanent', role: 'Management Consultant', inc: 310000, exp: 7100, brk: 0 },
  { f: 'Jack', l: 'Holloway', s: 'New Farm', st: 'QLD', pc: '4005', emp: 'Contractor', role: 'Software Engineer', inc: 185000, exp: 3900, brk: 1 },
  { f: 'Amelia', l: 'Sinclair', s: 'Teneriffe', st: 'QLD', pc: '4005', emp: 'PAYG Permanent', role: 'Surgeon', inc: 420000, exp: 8500, brk: 2 },
  { f: 'Harrison', l: 'Clarke', s: 'Cottesloe', st: 'WA', pc: '6011', emp: 'Self Employed', role: 'Mining Geologist', inc: 260000, exp: 5200, brk: 0 },
  { f: 'Isabella', l: 'Dixon', s: 'Subiaco', st: 'WA', pc: '6008', emp: 'PAYG Permanent', role: 'Pharmacist', inc: 145000, exp: 3400, brk: 1 },
  { f: 'Liam', l: 'Gallagher', s: 'Glenelg', st: 'SA', pc: '5045', emp: 'PAYG Permanent', role: 'Civil Engineer', inc: 165000, exp: 3800, brk: 2 },
  { f: 'Mia', l: 'Thornton', s: 'Norwood', st: 'SA', pc: '5067', emp: 'PAYG Permanent', role: 'Marketing Lead', inc: 135000, exp: 3100, brk: 0 },
  { f: 'Thomas', l: 'Archer', s: 'Sandy Bay', st: 'TAS', pc: '7005', emp: 'Self Employed', role: 'Accountant', inc: 210000, exp: 4500, brk: 1 },
  { f: 'Grace', l: 'Farrell', s: 'Hobart', st: 'TAS', pc: '7000', emp: 'PAYG Permanent', role: 'Environmental Scientist', inc: 125000, exp: 2900, brk: 2 },
  { f: 'William', l: 'Fletcher', s: 'Braddon', st: 'ACT', pc: '2612', emp: 'PAYG Permanent', role: 'EL1 Public Servant', inc: 155000, exp: 3600, brk: 0 },
  { f: 'Ava', l: 'Morrison', s: 'Barton', st: 'ACT', pc: '2600', emp: 'PAYG Permanent', role: 'Policy Advisor', inc: 140000, exp: 3300, brk: 1 },
  { f: 'Noah', l: 'Stevens', s: 'Fannie Bay', st: 'NT', pc: '0820', emp: 'Contractor', role: 'Defence Contractor', inc: 175000, exp: 4100, brk: 2 },
  { f: 'Emily', l: 'Caldwell', s: 'Bondi', st: 'NSW', pc: '2026', emp: 'Self Employed', role: 'Interior Designer', inc: 190000, exp: 4800, brk: 0 },
  { f: 'Benjamin', l: 'Hart', s: 'Surry Hills', st: 'NSW', pc: '2010', emp: 'PAYG Permanent', role: 'Creative Director', inc: 220000, exp: 5100, brk: 1 },
  { f: 'Chloe', l: 'Navarro', s: 'Manly', st: 'NSW', pc: '2095', emp: 'PAYG Permanent', role: 'Physiotherapist', inc: 130000, exp: 3200, brk: 2 },
  { f: 'Lucas', l: 'Sutherland', s: 'Fitzroy', st: 'VIC', pc: '3065', emp: 'Self Employed', role: 'Restaurateur', inc: 270000, exp: 6200, brk: 0 },
  { f: 'Harper', l: 'Barrett', s: 'Carlton', st: 'VIC', pc: '3053', emp: 'PAYG Permanent', role: 'University Lecturer', inc: 148000, exp: 3500, brk: 1 },
  { f: 'Alexander', l: 'McMahon', s: 'Brighton', st: 'VIC', pc: '3186', emp: 'PAYG Permanent', role: 'Investment Banker', inc: 480000, exp: 9200, brk: 2 },
  { f: 'Ella', l: 'Donovan', s: 'Bulimba', st: 'QLD', pc: '4171', emp: 'PAYG Permanent', role: 'HR Manager', inc: 160000, exp: 3700, brk: 0 },
  { f: 'James', l: 'Finley', s: 'Paddington', st: 'QLD', pc: '4064', emp: 'Contractor', role: 'IT Security Analyst', inc: 195000, exp: 4400, brk: 1 },
  { f: 'Zoe', l: 'Castillo', s: 'West End', st: 'QLD', pc: '4101', emp: 'PAYG Permanent', role: 'Dentist', inc: 310000, exp: 6800, brk: 2 },
  { f: 'Daniel', l: 'Pritchard', s: 'Fremantle', st: 'WA', pc: '6160', emp: 'Self Employed', role: 'Commercial Builder', inc: 340000, exp: 7400, brk: 0 },
  { f: 'Ruby', l: 'Stafford', s: 'Mount Lawley', st: 'WA', pc: '6050', emp: 'PAYG Permanent', role: 'High School Principal', inc: 170000, exp: 3900, brk: 1 },
  { f: 'Ethan', l: 'Kovacs', s: 'Unley', st: 'SA', pc: '5061', emp: 'PAYG Permanent', role: 'Data Scientist', inc: 180000, exp: 4000, brk: 2 },
  { f: 'Matilda', l: 'Giles', s: 'Prospect', st: 'SA', pc: '5082', emp: 'PAYG Permanent', role: 'Speech Pathologist', inc: 128000, exp: 3000, brk: 0 },
  { f: 'Samuel', l: 'Vickers', s: 'Battery Point', st: 'TAS', pc: '7004', emp: 'Self Employed', role: 'Maritime Surveyor', inc: 225000, exp: 4900, brk: 1 },
  { f: 'Hannah', l: 'Blythe', s: 'Kingston', st: 'ACT', pc: '2604', emp: 'PAYG Permanent', role: 'Legal Counsel', inc: 205000, exp: 4600, brk: 2 },
  { f: 'Leo', l: 'Corbett', s: 'Nightcliff', st: 'NT', pc: '0810', emp: 'PAYG Permanent', role: 'Pilot', inc: 230000, exp: 5300, brk: 0 },
  { f: 'Sienna', l: 'Langley', s: 'Neutral Bay', st: 'NSW', pc: '2089', emp: 'PAYG Permanent', role: 'Management Accountant', inc: 175000, exp: 4100, brk: 1 },
  { f: 'Zachary', l: 'Marsh', s: 'Coogee', st: 'NSW', pc: '2034', emp: 'Contractor', role: 'Front-End Engineer', inc: 190000, exp: 4300, brk: 2 },
  { f: 'Lily', l: 'Monroe', s: 'Albert Park', st: 'VIC', pc: '3206', emp: 'Self Employed', role: 'Veterinary Clinic Owner', inc: 290000, exp: 6500, brk: 0 },
  { f: 'Logan', l: 'Whiting', s: 'Hawthorn', st: 'VIC', pc: '3122', emp: 'PAYG Permanent', role: 'Senior Actuary', inc: 320000, exp: 7000, brk: 1 },
  { f: 'Aria', l: 'Hensley', s: 'Ascot', st: 'QLD', pc: '4007', emp: 'PAYG Permanent', role: 'General Practitioner', inc: 360000, exp: 7600, brk: 2 },
  { f: 'Flynn', l: 'Mercer', s: 'Claremont', st: 'WA', pc: '6010', emp: 'PAYG Permanent', role: 'Financial Planner', inc: 215000, exp: 4700, brk: 0 },
  { f: 'Freya', l: 'Davenport', s: 'Stirling', st: 'SA', pc: '5152', emp: 'Self Employed', role: 'Landscape Architect', inc: 185000, exp: 4200, brk: 1 },
  { f: 'Sebastian', l: 'Rhodes', s: 'Double Bay', st: 'NSW', pc: '2028', emp: 'PAYG Permanent', role: 'Private Equity Director', inc: 550000, exp: 11000, brk: 2 },
  { f: 'Audrey', l: 'Sinclair', s: 'South Hobart', st: 'TAS', pc: '7004', emp: 'PAYG Permanent', role: 'Hospital Administrator', inc: 142000, exp: 3200, brk: 0 },
];

export const INITIAL_CLIENTS: Client[] = clientRawSeed.map((c, idx) => {
  const broker = INITIAL_USERS[c.brk];
  const id = `cl-${idx + 1}`;
  const phone = `+61 4${(10 + idx).toString().padStart(2, '0')} ${Math.floor(100 + idx * 17)} ${Math.floor(200 + idx * 19)}`;
  const email = `${c.f.toLowerCase()}.${c.l.toLowerCase()}@clientmail.com.au`;
  const isDeleted = idx === 39; // 1 soft-deleted client for restore feature testing
  const status: Client['status'] = isDeleted ? 'Archived' : idx % 5 === 0 ? 'Lead' : idx % 4 === 0 ? 'Settled' : 'Active';

  return {
    id,
    firstName: c.f,
    lastName: c.l,
    preferredName: idx % 3 === 0 ? c.f : undefined,
    email,
    phone,
    dateOfBirth: `${String(1 + (idx % 27)).padStart(2, '0')}/${String(1 + (idx % 12)).padStart(2, '0')}/${1980 + (idx % 20)}`,
    status,
    address: {
      street: `${12 + idx * 3} ${['Ocean St', 'Victoria Rd', 'George St', 'Queen St', 'King St', 'Park Ave'][idx % 6]}`,
      suburb: c.s,
      state: c.st as any,
      postcode: c.pc,
    },
    employment: {
      type: c.emp as any,
      employer: `${['Atlassian', 'Canva', 'Macquarie Group', 'BHP', 'Commonwealth Bank', 'Self-Employed Agency', 'St Vincent Hospital', 'RMIT University'][idx % 8]}`,
      occupation: c.role,
      yearsEmployed: 2 + (idx % 9),
    },
    financials: {
      annualIncome: c.inc,
      otherIncome: idx % 2 === 0 ? 15000 : 0,
      monthlyLivingExpenses: c.exp,
      totalAssets: Math.round(c.inc * 6.5 + idx * 80000),
      totalLiabilities: Math.round(c.inc * 3.8 + idx * 45000),
    },
    notes: `Client introduced via ${idx % 2 === 0 ? 'Real Estate Agent partner' : 'direct referral'}. Looking for competitive variable package with offset accounts.`,
    assignedBrokerId: broker.id,
    assignedBrokerName: broker.name,
    createdAt: new Date(2026, 0, 10 + (idx % 60)).toISOString(),
    updatedAt: new Date(2026, 9, 1 + (idx % 15)).toISOString(),
    isDeleted,
    deletedAt: isDeleted ? new Date(2026, 9, 14).toISOString() : undefined,
  };
});

// Seed 30 loans distributed across all pipeline stages:
// New Lead (4), Fact Find (4), Pre-Approval (4), Lodged (4), Conditional Approval (4), Unconditional (4), Settled (4), Lost (2)
const stageDistribution: { stage: Loan['stage']; count: number }[] = [
  { stage: 'New Lead', count: 4 },
  { stage: 'Fact Find', count: 4 },
  { stage: 'Pre-Approval', count: 4 },
  { stage: 'Lodged', count: 4 },
  { stage: 'Conditional Approval', count: 4 },
  { stage: 'Unconditional', count: 4 },
  { stage: 'Settled', count: 4 },
  { stage: 'Lost', count: 2 },
];

const lenderPool: Loan['lender'][] = [
  'CBA',
  'Macquarie',
  'ANZ',
  'Westpac',
  'NAB',
  'ING',
  'Bankwest',
  'Suncorp',
  'Pepper Money',
  'AMP',
];

const loanTypePool: Loan['loanType'][] = [
  'Owner Occupied',
  'Investment',
  'Refinance',
  'Construction',
  'First Home Buyer',
];

export const INITIAL_LOANS: Loan[] = [];
let currentClientIndex = 0;

stageDistribution.forEach(({ stage, count }) => {
  for (let i = 0; i < count; i++) {
    const loanIndex = INITIAL_LOANS.length + 1;
    const client = INITIAL_CLIENTS[currentClientIndex % (INITIAL_CLIENTS.length - 1)]; // exclude deleted
    currentClientIndex++;

    const propertyValue = 850000 + (loanIndex * 75000);
    const lvrTarget = [72, 78, 80, 85, 65, 88, 70][loanIndex % 7];
    const amount = Math.round((propertyValue * (lvrTarget / 100)) / 1000) * 1000;
    const lender = lenderPool[loanIndex % lenderPool.length];
    const loanType = loanTypePool[loanIndex % loanTypePool.length];
    const daysInStage = 2 + (loanIndex % 18);

    const baseYear = 2026;
    const financeClauseDate = stage === 'Conditional Approval' || stage === 'Lodged' 
      ? `28/10/${baseYear}` 
      : undefined;
    const settlementDate = stage === 'Unconditional' 
      ? `15/11/${baseYear}` 
      : stage === 'Settled' 
      ? `02/10/${baseYear}` 
      : undefined;

    INITIAL_LOANS.push({
      id: `ln-${loanIndex}`,
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      lender,
      loanType,
      amount,
      propertyValue,
      lvr: calculateLVR(amount, propertyValue),
      interestRate: Number((5.84 + (loanIndex % 5) * 0.15).toFixed(2)),
      rateType: loanIndex % 4 === 0 ? 'Fixed 2 Years' : 'Variable',
      repaymentType: loanType === 'Investment' && loanIndex % 2 === 0 ? 'Interest Only' : 'Principal & Interest',
      loanTermYears: 30,
      stage,
      stageEnteredAt: new Date(2026, 9, Math.max(1, 16 - daysInStage)).toISOString(),
      daysInStage,
      assignedBrokerId: client.assignedBrokerId,
      assignedBrokerName: client.assignedBrokerName,
      financeClauseDate,
      settlementDate,
      applicationReference: `APX-${lender.slice(0, 3).toUpperCase()}-${202600 + loanIndex}`,
      commissionEst: Math.round(amount * 0.0065), // 0.65% upfront broking commission
      notes: `${loanType} loan for purchase in ${client.address.suburb}. Broker notes: 100% offset feature required, pre-approval completed under standard verification.`,
      createdAt: new Date(2026, 7, 1 + loanIndex).toISOString(),
      updatedAt: new Date(2026, 9, 14).toISOString(),
    });
  }
});

// Seed 60 Tasks with categories, priorities, due dates, assignees
const taskSeedTemplates = [
  { t: 'Review primary ID & verify passport/licence', cat: 'Document Collection', pr: 'High', days: 0 },
  { t: 'Request updated 90-day bank statements', cat: 'Document Collection', pr: 'High', days: -1 },
  { t: 'Order upfront property valuation via CoreLogic', cat: 'Lender Follow-up', pr: 'High', days: 1 },
  { t: 'Follow up lender credit assessor on condition note', cat: 'Lender Follow-up', pr: 'High', days: 0 },
  { t: 'Verify self-employed tax return & Notice of Assessment', cat: 'Compliance', pr: 'Medium', days: 2 },
  { t: 'Conduct Best Interests Duty (BID) compliance review', cat: 'Compliance', pr: 'High', days: 3 },
  { t: 'Send Credit Proposal Disclosure (CPD) document', cat: 'Client Review', pr: 'Medium', days: -2 },
  { t: 'Phone client to explain conditional approval terms', cat: 'Client Review', pr: 'Medium', days: 0 },
  { t: 'Check formal approval letter against loan structure', cat: 'Settlement', pr: 'High', days: 4 },
  { t: 'Coordinate final inspection and settlement bookings', cat: 'Settlement', pr: 'High', days: 5 },
  { t: 'Post-settlement welcome call and gift pack dispatch', cat: 'Settlement', pr: 'Low', days: 7 },
  { t: 'Annual loan health review and repricing request', cat: 'Client Review', pr: 'Low', days: 10 },
];

export const INITIAL_TASKS: TaskItem[] = [];
for (let i = 0; i < 60; i++) {
  const template = taskSeedTemplates[i % taskSeedTemplates.length];
  const client = INITIAL_CLIENTS[i % (INITIAL_CLIENTS.length - 1)];
  const loan = INITIAL_LOANS[i % INITIAL_LOANS.length];
  const user = INITIAL_USERS[i % INITIAL_USERS.length];
  const isCompleted = i >= 42; // 18 completed tasks, 42 pending

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + template.days + (i % 6) - 2);
  const dueStr = dueDate.toISOString().split('T')[0];

  INITIAL_TASKS.push({
    id: `tsk-${i + 1}`,
    title: `${template.t} - ${client.firstName} ${client.lastName}`,
    description: `Related to ${loan.loanType} application with ${loan.lender}. Priority check for ${template.cat}.`,
    dueDate: dueStr,
    priority: (i % 5 === 0 ? 'High' : i % 3 === 0 ? 'Medium' : 'Low') as any,
    status: isCompleted ? 'Completed' : 'Pending',
    category: template.cat as any,
    assignedToId: user.id,
    assignedToName: user.name,
    linkedClientId: client.id,
    linkedClientName: `${client.firstName} ${client.lastName}`,
    linkedLoanId: loan.id,
    completedAt: isCompleted ? new Date(2026, 9, 14).toISOString() : undefined,
    createdAt: new Date(2026, 8, 15 + (i % 15)).toISOString(),
  });
}

// Seed 25 Documents
const docCategories: DocumentItem['category'][] = [
  'ID',
  'Payslips',
  'Bank Statements',
  'Tax Returns',
  'Contracts',
  'Compliance',
];

const docFileNames = [
  'Australian_Passport_Certified.pdf',
  'Drivers_Licence_Front_Back.pdf',
  'Payslip_Most_Recent_1.pdf',
  'Payslip_Consecutive_2.pdf',
  'CBA_Transaction_Statement_90Days.pdf',
  'Macquarie_Savings_Statement.pdf',
  'ATO_Notice_of_Assessment_2025.pdf',
  'ATO_Notice_of_Assessment_2024.pdf',
  'Contract_of_Sale_Signed.pdf',
  'Section_32_Vendor_Statement.pdf',
  'Best_Interests_Duty_BID_Assessment.pdf',
  'Credit_Guide_and_Quote_Signed.pdf',
  'PAYG_Payment_Summary_Group_Certificate.pdf',
  'Superannuation_Balance_Statement.pdf',
  'Rental_Appraisal_Letter.pdf',
  'Building_Inspection_Report.pdf',
  'Gift_Letter_Statutory_Declaration.pdf',
  'Company_Financials_Balance_Sheet.pdf',
  'Rates_Notice_Council.pdf',
  'Strata_Inspection_Report.pdf',
  'First_Home_Guarantee_Declaration.pdf',
  'Home_Insurance_Certificate_of_Currency.pdf',
  'Settlement_Statement_Adjustments.pdf',
  'Lender_Loan_Contract_Executed.pdf',
  'Discharge_Authority_Form.pdf',
];

export const INITIAL_DOCUMENTS: DocumentItem[] = docFileNames.map((name, idx) => {
  const client = INITIAL_CLIENTS[idx % (INITIAL_CLIENTS.length - 1)];
  const category = docCategories[idx % docCategories.length];
  const sizeBytes = Math.round(450000 + idx * 280000); // 450KB to 7.5MB
  const status: DocumentItem['status'] = idx % 7 === 0 ? 'Pending Review' : idx % 11 === 0 ? 'Rejected' : 'Verified';
  const uploader = INITIAL_USERS[idx % INITIAL_USERS.length];

  return {
    id: `doc-${idx + 1}`,
    clientId: client.id,
    clientName: `${client.firstName} ${client.lastName}`,
    loanId: INITIAL_LOANS[idx % INITIAL_LOANS.length].id,
    name,
    category,
    sizeBytes,
    fileType: 'application/pdf',
    uploadDate: new Date(2026, 8, 20 + (idx % 25)).toISOString(),
    status,
    uploadedBy: uploader.name,
    url: '#',
  };
});

// Seed 50 Audit Logs
const auditActions: AuditLog['action'][] = [
  'login',
  'view',
  'update',
  'create',
  'download',
  'delete',
  'view',
  'update',
];

const auditResources = [
  'Client: Marcus Vance',
  'Loan: ln-1 (CBA $1,250,000)',
  'Document: Australian_Passport_Certified.pdf',
  'Task: Order upfront property valuation',
  'Pipeline Kanban Board',
  'Credit Proposal Disclosure',
  'Best Interests Duty Notes',
  'Settlement Checklist: Georgia Kelly',
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = Array.from({ length: 50 }, (_, idx) => {
  const user = INITIAL_USERS[idx % INITIAL_USERS.length];
  const action = auditActions[idx % auditActions.length];
  const resource = auditResources[idx % auditResources.length];
  const logDate = new Date(Date.now() - (idx * 3600 * 1000 * 3.5)); // stepped back in time

  return {
    id: `aud-${idx + 1}`,
    timestamp: logDate.toISOString(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action,
    resource,
    details: `${action.toUpperCase()} performed on ${resource} from internal IP. Compliance checksum verified.`,
    ipAddress: `103.217.166.${10 + (idx % 80)}`,
  };
});

// Seed Email Templates
export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Initial Welcome & Document Request',
    category: 'Onboarding',
    description: 'Sent to new mortgage leads outlining required documents under NCCP Act.',
    subject: 'Welcome to Apex Finance - Getting Started on Your Home Loan, {{client_first_name}}',
    body: `Hi {{client_first_name}},\n\nThank you for choosing Apex Finance Broking for your upcoming {{loan_type}} application with {{lender}}.\n\nTo ensure we present the strongest possible application and comply with Australian Credit Regulations (BID), please provide the following items at your earliest convenience:\n\n1. Copy of Australian Passport or Driver's Licence (front & back)\n2. Your last two consecutive payslips\n3. 90 days of bank transaction statements showing your salary credits\n4. Your most recent ATO Notice of Assessment\n\nYou can securely upload these directly to your client portal or reply directly to this email.\n\nWarm regards,\n{{broker_name}}\n{{broker_title}}\nApex Finance Broking Pty Ltd | ACL #482910`,
  },
  {
    id: 'tmpl-2',
    name: 'Pre-Approval Congratulations',
    category: 'Milestones',
    description: 'Sent when conditional pre-approval is issued by the lender.',
    subject: 'Fantastic News! Your {{lender}} Pre-Approval is Approved, {{client_first_name}}',
    body: `Hi {{client_first_name}},\n\nGreat news! We have just received formal notification that your pre-approval for {{loan_amount}} with {{lender}} has been approved.\n\nKey Details:\n- Approved Limit: {{loan_amount}}\n- Expiry Date: 90 days from approval date\n- Subject to: Satisfactory property valuation on your chosen purchase.\n\nYou are now in a strong position to attend open homes and bid at auction with confidence. Remember to send us the contract of sale before signing wherever possible so we can double-check the finance clauses.\n\nHappy house hunting!\n\nBest regards,\n{{broker_name}}\nApex Finance Broking`,
  },
  {
    id: 'tmpl-3',
    name: 'Unconditional Formal Approval',
    category: 'Milestones',
    description: 'Sent when loan reaches Unconditional (Formal) Approval.',
    subject: 'Formal Unconditional Approval Confirmed - {{lender}}',
    body: `Hi {{client_first_name}},\n\nWe are delighted to confirm that {{lender}} has officially issued UNCONDITIONAL (Formal) Approval for your loan of {{loan_amount}}.\n\nAll lending conditions have been satisfied. The bank will now issue the formal loan agreement pack for your electronic signing.\n\nNext Steps:\n1. Keep an eye on your inbox for the DocuSign contract from {{lender}}.\n2. Review and execute the mortgage documents.\n3. We will coordinate directly with your conveyancer/solicitor for settlement.\n\nCongratulations on reaching this major milestone!\n\nCheers,\n{{broker_name}}\nApex Finance Broking`,
  },
  {
    id: 'tmpl-4',
    name: 'Settlement Day Congratulations',
    category: 'Settlement',
    description: 'Sent on settlement day once funds have been dispersed.',
    subject: 'Congratulations! Your Loan Has Settled Today! 🍾',
    body: `Dear {{client_first_name}},\n\nSettlement has officially taken place on PEXA! The funds have been disbursed and the keys are ready for collection.\n\nIt has been an absolute pleasure assisting you with your finance journey. Our ongoing commitment to you includes regular loan repricing reviews to ensure your rate remains competitive.\n\nPlease don't hesitate to reach out if you have any questions regarding your first repayment date or offset account setup.\n\nEnjoy your new property!\n\nWarmest regards,\n{{broker_name}} & The Apex Finance Team`,
  },
];

// Seed Sent Emails Log
export const INITIAL_SENT_EMAILS: EmailLog[] = [
  {
    id: 'eml-1',
    clientId: 'cl-1',
    clientName: 'Marcus Vance',
    recipientEmail: 'marcus.vance@clientmail.com.au',
    subject: 'Welcome to Apex Finance - Getting Started on Your Home Loan, Marcus',
    templateId: 'tmpl-1',
    body: 'Sent introductory pack and NCCP compliance disclosure form.',
    sentAt: '2026-10-14T02:30:00.000Z',
    status: 'Opened',
    openedAt: '2026-10-14T03:15:00.000Z',
  },
  {
    id: 'eml-2',
    clientId: 'cl-2',
    clientName: 'Georgia Kelly',
    recipientEmail: 'georgia.kelly@clientmail.com.au',
    subject: 'Fantastic News! Your Macquarie Pre-Approval is Approved, Georgia',
    templateId: 'tmpl-2',
    body: 'Pre-approval confirmation sent with 90-day expiry notice.',
    sentAt: '2026-10-15T05:10:00.000Z',
    status: 'Delivered',
  },
  {
    id: 'eml-3',
    clientId: 'cl-3',
    clientName: 'Oliver Brennan',
    recipientEmail: 'oliver.brennan@clientmail.com.au',
    subject: 'Document Request - ATO Notice of Assessment 2025',
    templateId: 'tmpl-1',
    body: 'Requested supplementary accountant declaration.',
    sentAt: '2026-10-16T08:00:00.000Z',
    status: 'Sent',
  },
  {
    id: 'eml-4',
    clientId: 'cl-4',
    clientName: 'Charlotte Wong',
    recipientEmail: 'charlotte.wong@clientmail.com.au',
    subject: 'Formal Unconditional Approval Confirmed - CBA',
    templateId: 'tmpl-3',
    body: 'Notified client of formal loan contracts issued.',
    sentAt: '2026-10-12T01:40:00.000Z',
    status: 'Opened',
    openedAt: '2026-10-12T02:00:00.000Z',
  },
];

// Backup points for Backup & Recovery module
export const INITIAL_BACKUPS: BackupPoint[] = [
  {
    id: 'bkp-1',
    timestamp: '2026-10-16T04:00:00.000Z',
    sizeMB: 48.6,
    status: 'Healthy',
    createdBy: 'Automated Daily Snapshot',
    notes: 'Full database snapshot, encrypted with AES-256 in Sydney AWS ap-southeast-2.',
  },
  {
    id: 'bkp-2',
    timestamp: '2026-10-15T04:00:00.000Z',
    sizeMB: 47.9,
    status: 'Healthy',
    createdBy: 'Automated Daily Snapshot',
    notes: 'Regular scheduled compliance backup prior to Q3 audit.',
  },
  {
    id: 'bkp-3',
    timestamp: '2026-10-14T11:22:00.000Z',
    sizeMB: 47.4,
    status: 'Completed',
    createdBy: 'Sarah Jenkins (Admin)',
    notes: 'Manual backup prior to bulk loan status reconciliation.',
  },
];

// Active sessions for Users & Security
export const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'ses-1',
    userId: 'usr-1',
    device: 'MacBook Pro 16" (macOS Sonoma)',
    browser: 'Chrome 130.0',
    ipAddress: '103.217.166.42',
    location: 'Sydney, NSW (Australia)',
    lastActive: 'Just now',
    isCurrent: true,
  },
  {
    id: 'ses-2',
    userId: 'usr-1',
    device: 'iPhone 16 Pro (iOS 18.1)',
    browser: 'Mobile Safari',
    ipAddress: '1.144.108.92',
    location: 'North Sydney, NSW',
    lastActive: '4 hours ago',
    isCurrent: false,
  },
  {
    id: 'ses-3',
    userId: 'usr-2',
    device: 'Windows 11 PC (Dell XPS 15)',
    browser: 'Firefox 131.0',
    ipAddress: '121.200.5.18',
    location: 'Melbourne, VIC',
    lastActive: '25 minutes ago',
    isCurrent: false,
  },
  {
    id: 'ses-4',
    userId: 'usr-3',
    device: 'iPad Air 5th Gen (iPadOS 18)',
    browser: 'Safari',
    ipAddress: '110.174.91.204',
    location: 'Brisbane, QLD',
    lastActive: '1 hour ago',
    isCurrent: false,
  },
];
