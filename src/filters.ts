import { storageService } from './storage';

export type IncomeStatusFilter = 'all' | 'received' | 'pending' | 'overdue';

export interface IncomeFilterState {
  status: IncomeStatusFilter;
  dateFrom: string; // YYYY-MM-DD or ''
  dateTo: string; // YYYY-MM-DD or ''
  source: string; // 'all' or an exact source
  category: string; // 'all' or an exact category
}

export interface ExpenseFilterState {
  dateFrom: string;
  dateTo: string;
  category: string;
}

export const defaultIncomeFilters: IncomeFilterState = {
  status: 'all',
  dateFrom: '',
  dateTo: '',
  source: 'all',
  category: 'all',
};

export const defaultExpenseFilters: ExpenseFilterState = {
  dateFrom: '',
  dateTo: '',
  category: 'all',
};

const inDateRange = (date: string, from: string, to: string): boolean => {
  const d = storageService.parseLocalDate(date).getTime();
  if (from && d < storageService.parseLocalDate(from).getTime()) return false;
  if (to && d > storageService.parseLocalDate(to).getTime()) return false;
  return true;
};

export function filterIncomeRecords<T extends { date: string; status?: string; source?: string; category?: string }>(
  records: T[],
  f: IncomeFilterState
): T[] {
  return records.filter((r) => {
    if (f.status !== 'all' && storageService.normaliseIncomeStatus(r.status) !== f.status) return false;
    if (f.source !== 'all' && (r.source ?? '') !== f.source) return false;
    if (f.category !== 'all' && (r.category ?? '') !== f.category) return false;
    if (!inDateRange(r.date, f.dateFrom, f.dateTo)) return false;
    return true;
  });
}

export function filterExpenseRecords<T extends { date: string; category?: string }>(
  records: T[],
  f: ExpenseFilterState
): T[] {
  return records.filter((r) => {
    if (f.category !== 'all' && (r.category ?? '') !== f.category) return false;
    if (!inDateRange(r.date, f.dateFrom, f.dateTo)) return false;
    return true;
  });
}

// Unique, sorted, non-empty values (for populating filter dropdowns).
export const uniqueSorted = (values: (string | undefined)[]): string[] =>
  Array.from(new Set(values.filter((v): v is string => !!v))).sort();

export const isIncomeFilterActive = (f: IncomeFilterState): boolean =>
  f.status !== 'all' || !!f.dateFrom || !!f.dateTo || f.source !== 'all' || f.category !== 'all';

export const isExpenseFilterActive = (f: ExpenseFilterState): boolean =>
  !!f.dateFrom || !!f.dateTo || f.category !== 'all';
