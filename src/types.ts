// Shared domain types for TaxMate UK.

export type IncomeStatus = 'received' | 'pending' | 'overdue';

// HMRC-style self-employment expense categories (approved enum).
export type ExpenseCategory =
  | 'Office costs'
  | 'Travel'
  | 'Car and van expenses'
  | 'Rent, rates, power and insurance'
  | 'Phone, internet and postage'
  | 'Financial costs'
  | 'Staff costs'
  | 'Goods for resale'
  | 'Advertising and marketing'
  | 'Professional fees'
  | 'Other business expenses';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Office costs',
  'Travel',
  'Car and van expenses',
  'Rent, rates, power and insurance',
  'Phone, internet and postage',
  'Financial costs',
  'Staff costs',
  'Goods for resale',
  'Advertising and marketing',
  'Professional fees',
  'Other business expenses',
];

export interface IncomeRecord {
  id: string;
  date: string; // YYYY-MM-DD (local)
  source: string;
  description?: string;
  category: string;
  amount: string; // kept as a string as entered; summed in integer pence
  status: IncomeStatus | string;
  notes?: string;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD (local)
  merchant: string;
  description?: string;
  category: string;
  amount: string;
  paymentMethod?: string;
  notes?: string;
  isDemo?: boolean;
  // Future-ready fields (in the data model but hidden from the UI this
  // milestone). No calculation treats recorded expenses as tax-deductible.
  allowableType?: 'allowable' | 'non-allowable';
  paymentStatus?: 'paid' | 'unpaid';
  businessUsePercentage?: number;
  expenseType?: 'capital' | 'revenue';
  isReimbursed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type TransactionRecord = IncomeRecord | ExpenseRecord;

// Minimal shapes the pure calculators read from (so tests and callers can pass
// partial records without needing every display field).
export interface IncomeCalcRecord {
  id?: string;
  date: string;
  amount?: string | number;
  status?: string;
  source?: string;
}

export interface ExpenseCalcRecord {
  id?: string;
  date: string;
  amount?: string | number;
  category?: string;
}

export interface ExportPreferences {
  selectedTaxYear?: number;
  [key: string]: unknown;
}

// Approved backup schema.
export interface ExportBundle {
  schemaVersion: number;
  exportDate: string;
  appPreferences: ExportPreferences;
  incomeRecords: IncomeRecord[];
  expenseRecords: ExpenseRecord[];
}
