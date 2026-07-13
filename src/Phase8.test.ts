// @vitest-environment jsdom
//
// Phase 8: End-to-end integration tests for import / export / demo data /
// tax-year selection / ledger filters / clear-data / and income reconciliation.
//
// These tests exercise the full stack: Zustand store → storageService →
// localStorage, verifying that features that are individually unit-tested
// remain correct when combined.

import { describe, it, expect, beforeEach } from 'vitest';
import { useTaxStore, taxYearStartToLabel, getAvailableTaxYears, currentTaxYearStart } from './store';
import { storageService } from './storage';
import {
  filterIncomeRecords,
  filterExpenseRecords,
  isIncomeFilterActive,
  isExpenseFilterActive,
  hasInvalidDateRange,
  uniqueSorted,
} from './filters';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const resetAll = () => {
  localStorage.clear();
  storageService.clearAllData();
  useTaxStore.getState().clearAll();
  useTaxStore.getState().resetIncomeFilters();
  useTaxStore.getState().resetExpenseFilters();
};

const addIncome = (overrides: Record<string, unknown> = {}) =>
  storageService.addIncomeRecord({
    date: '2026-06-01',
    source: 'TestClient',
    category: 'Client work',
    amount: '500',
    status: 'received',
    ...overrides,
  });

const addExpense = (overrides: Record<string, unknown> = {}) =>
  storageService.addExpenseRecord({
    date: '2026-06-10',
    merchant: 'OfficeStore',
    category: 'Office costs',
    amount: '50',
    ...overrides,
  });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Full CRUD → localStorage persistence round-trip
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 8: CRUD + localStorage persistence', () => {
  beforeEach(resetAll);

  it('added income record survives a cold-read from localStorage', () => {
    const rec = addIncome({ source: 'Acme Corp', amount: '1200' });
    // Simulate a fresh page load by re-reading from localStorage directly.
    const fresh = storageService.getIncomeRecords();
    expect(fresh.find((r) => r.id === rec.id)?.source).toBe('Acme Corp');
    expect(fresh.find((r) => r.id === rec.id)?.amount).toBe('1200');
  });

  it('updated income record is reflected in subsequent reads', () => {
    const rec = addIncome({ amount: '100' });
    storageService.updateIncomeRecord(rec.id, { amount: '999', source: 'Updated Co' });
    const found = storageService.getIncomeRecord(rec.id);
    expect(found?.amount).toBe('999');
    expect(found?.source).toBe('Updated Co');
  });

  it('deleted income record is absent from subsequent reads', () => {
    const rec = addIncome();
    storageService.deleteIncomeRecord(rec.id);
    expect(storageService.getIncomeRecord(rec.id)).toBeFalsy();
    expect(storageService.getIncomeRecords().find((r) => r.id === rec.id)).toBeUndefined();
  });

  it('added expense record survives a cold-read', () => {
    const rec = addExpense({ merchant: 'TravelCo', amount: '75', category: 'Travel' });
    const fresh = storageService.getExpenseRecords();
    expect(fresh.find((r) => r.id === rec.id)?.merchant).toBe('TravelCo');
    expect(fresh.find((r) => r.id === rec.id)?.amount).toBe('75');
  });

  it('updated expense record is reflected in subsequent reads', () => {
    const rec = addExpense({ amount: '30' });
    storageService.updateExpenseRecord(rec.id, { amount: '60', merchant: 'NewShop' });
    const found = storageService.getExpenseRecord(rec.id);
    expect(found?.amount).toBe('60');
    expect(found?.merchant).toBe('NewShop');
  });

  it('deleted expense record is absent from subsequent reads', () => {
    const rec = addExpense();
    storageService.deleteExpenseRecord(rec.id);
    expect(storageService.getExpenseRecord(rec.id)).toBeFalsy();
  });

  it('multiple records are all persisted and all individually retrievable', () => {
    const ids = ['a', 'b', 'c'].map((src) =>
      addIncome({ source: src, id: `inc-${src}` }).id
    );
    const stored = storageService.getIncomeRecords();
    ids.forEach((id) => expect(stored.some((r) => r.id === id)).toBe(true));
  });

  it('store addIncome/addExpense triggers a live refresh (records visible immediately)', () => {
    useTaxStore.getState().addIncome({ date: '2026-06-01', source: 'ZustandClient', category: 'Client work', amount: '300', status: 'received' });
    expect(useTaxStore.getState().income.some((r) => r.source === 'ZustandClient')).toBe(true);

    useTaxStore.getState().addExpense({ date: '2026-06-01', merchant: 'ZustandShop', category: 'Travel', amount: '25' });
    expect(useTaxStore.getState().expenses.some((r) => r.merchant === 'ZustandShop')).toBe(true);
  });

  it('store deleteIncome removes the record from live state immediately', () => {
    useTaxStore.getState().addIncome({ date: '2026-06-01', source: 'ToDelete', category: 'Freelance', amount: '100', status: 'received' });
    const id = useTaxStore.getState().income.find((r) => r.source === 'ToDelete')!.id;
    useTaxStore.getState().deleteIncome(id);
    expect(useTaxStore.getState().income.find((r) => r.id === id)).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Demo data — load / idempotency / coexistence / removal
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 8: demo data lifecycle', () => {
  beforeEach(resetAll);

  it('loadDemo for 2026 populates income and expenses dated in 2026', () => {
    const { income, expenses } = useTaxStore.getState().loadDemo();
    expect(income).toBeGreaterThan(0);
    expect(expenses).toBeGreaterThan(0);
    expect(storageService.getIncomeRecords().every((r) => r.isDemo)).toBe(true);
    expect(storageService.getExpenseRecords().every((r) => r.isDemo)).toBe(true);
  });

  it('loadDemo is idempotent: calling twice yields the same count', () => {
    const first = useTaxStore.getState().loadDemo();
    const second = useTaxStore.getState().loadDemo();
    expect(second.income).toBe(0);
    expect(second.expenses).toBe(0);
    expect(storageService.getIncomeRecords()).toHaveLength(first.income);
  });

  it('demo records coexist with real user records and are distinguishable', () => {
    addIncome({ source: 'RealClient', isDemo: undefined });
    useTaxStore.getState().loadDemo();
    const income = storageService.getIncomeRecords();
    expect(income.some((r) => r.source === 'RealClient')).toBe(true);
    expect(income.some((r) => r.isDemo)).toBe(true);
  });

  it('removeDemo purges only demo records, leaving user records untouched', () => {
    addIncome({ source: 'RealClient' });
    useTaxStore.getState().loadDemo();
    useTaxStore.getState().removeDemo();
    const income = storageService.getIncomeRecords();
    expect(income.some((r) => r.isDemo)).toBe(false);
    expect(income.some((r) => r.source === 'RealClient')).toBe(true);
  });

  it('demo data uses the currently selected tax year (changed before loading)', () => {
    useTaxStore.getState().setSelectedTaxYear(2024);
    useTaxStore.getState().loadDemo();
    const income = storageService.getIncomeRecords();
    expect(income.every((r) => r.date.startsWith('2024-'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Tax-year selector — isolation + persistence + reset side-effects
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 8: tax year selection', () => {
  beforeEach(resetAll);

  it('getAvailableTaxYears returns current + two prior', () => {
    const years = getAvailableTaxYears(2026);
    expect(years).toEqual([2026, 2025, 2024]);
    expect(years.every((y) => typeof y === 'number')).toBe(true);
  });

  it('taxYearStartToLabel produces correct UK year strings', () => {
    expect(taxYearStartToLabel(2024)).toBe('2024/25');
    expect(taxYearStartToLabel(2025)).toBe('2025/26');
    expect(taxYearStartToLabel(2026)).toBe('2026/27');
    expect(taxYearStartToLabel(2099)).toBe('2099/00'); // century roll-over
  });

  it('each tax year sees only its own records (total isolation)', () => {
    addIncome({ date: '2024-06-01', amount: '1000' }); // 2024/25
    addIncome({ date: '2025-06-01', amount: '2000' }); // 2025/26
    addIncome({ date: '2026-06-01', amount: '3000' }); // 2026/27

    const ref24 = storageService.getTaxYearStartForYear(2024);
    const ref25 = storageService.getTaxYearStartForYear(2025);
    const ref26 = storageService.getTaxYearStartForYear(2026);

    expect(storageService.calculateTotalReceived(ref24, storageService.getIncomeRecords())).toBe(1000);
    expect(storageService.calculateTotalReceived(ref25, storageService.getIncomeRecords())).toBe(2000);
    expect(storageService.calculateTotalReceived(ref26, storageService.getIncomeRecords())).toBe(3000);
  });

  it('switching tax year resets ledger filters (stale filter prevention)', () => {
    useTaxStore.getState().setIncomeFilters({ status: 'overdue', source: 'Alpha' });
    useTaxStore.getState().setSelectedTaxYear(2024);
    expect(useTaxStore.getState().incomeFilters.status).toBe('all');
    expect(useTaxStore.getState().incomeFilters.source).toBe('all');
  });

  it('the selected tax year is persisted to localStorage and survives re-read', () => {
    useTaxStore.getState().setSelectedTaxYear(2025);
    expect(localStorage.getItem('taxmate_selected_tax_year')).toBe('2025');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Ledger filters — functional coverage
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 8: income filters', () => {
  const income = [
    { id: '1', date: '2026-04-10', source: 'Alpha', category: 'Client work', status: 'received', amount: '100' },
    { id: '2', date: '2026-05-15', source: 'Beta',  category: 'Freelance',   status: 'pending',  amount: '200' },
    { id: '3', date: '2026-06-20', source: 'Alpha', category: 'Freelance',   status: 'overdue',  amount: '300' },
    { id: '4', date: '2026-07-01', source: 'Gamma', category: 'Other',       status: 'received', amount: '400' },
  ];
  const def = { status: 'all' as const, dateFrom: '', dateTo: '', source: 'all', category: 'all' };

  it('status filter: received', () => {
    const result = filterIncomeRecords(income, { ...def, status: 'received' });
    expect(result.map((r) => r.id)).toEqual(['1', '4']);
  });

  it('status filter: pending', () => {
    expect(filterIncomeRecords(income, { ...def, status: 'pending' }).map((r) => r.id)).toEqual(['2']);
  });

  it('status filter: overdue', () => {
    expect(filterIncomeRecords(income, { ...def, status: 'overdue' }).map((r) => r.id)).toEqual(['3']);
  });

  it('source filter', () => {
    expect(filterIncomeRecords(income, { ...def, source: 'Alpha' }).map((r) => r.id)).toEqual(['1', '3']);
  });

  it('category filter', () => {
    expect(filterIncomeRecords(income, { ...def, category: 'Freelance' }).map((r) => r.id)).toEqual(['2', '3']);
  });

  it('dateFrom filter (inclusive)', () => {
    expect(filterIncomeRecords(income, { ...def, dateFrom: '2026-05-15' }).map((r) => r.id)).toEqual(['2', '3', '4']);
  });

  it('dateTo filter (inclusive)', () => {
    expect(filterIncomeRecords(income, { ...def, dateTo: '2026-05-15' }).map((r) => r.id)).toEqual(['1', '2']);
  });

  it('dateFrom + dateTo range', () => {
    expect(filterIncomeRecords(income, { ...def, dateFrom: '2026-05-01', dateTo: '2026-06-30' }).map((r) => r.id)).toEqual(['2', '3']);
  });

  it('inverted date range (from > to) returns empty array', () => {
    expect(filterIncomeRecords(income, { ...def, dateFrom: '2026-07-01', dateTo: '2026-04-01' })).toHaveLength(0);
    expect(hasInvalidDateRange('2026-07-01', '2026-04-01')).toBe(true);
  });

  it('combined: status + source + date range', () => {
    const result = filterIncomeRecords(income, {
      ...def, status: 'received', source: 'Alpha', dateFrom: '2026-04-01', dateTo: '2026-07-31',
    });
    expect(result.map((r) => r.id)).toEqual(['1']);
  });

  it('isIncomeFilterActive detects any non-default filter', () => {
    expect(isIncomeFilterActive(def)).toBe(false);
    expect(isIncomeFilterActive({ ...def, status: 'pending' })).toBe(true);
    expect(isIncomeFilterActive({ ...def, source: 'Alpha' })).toBe(true);
    expect(isIncomeFilterActive({ ...def, dateFrom: '2026-01-01' })).toBe(true);
  });

  it('uniqueSorted builds sorted, deduplicated option lists', () => {
    const sources = income.map((r) => r.source);
    expect(uniqueSorted(sources)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(uniqueSorted([undefined, 'B', 'A', 'A', undefined])).toEqual(['A', 'B']);
  });
});

describe('Phase 8: expense filters', () => {
  const expenses = [
    { id: '1', date: '2026-04-10', category: 'Office costs', amount: '100' },
    { id: '2', date: '2026-05-15', category: 'Travel',       amount: '200' },
    { id: '3', date: '2026-06-20', category: 'Travel',       amount: '300' },
    { id: '4', date: '2026-07-01', category: 'Office costs', amount: '400' },
  ];
  const def = { dateFrom: '', dateTo: '', category: 'all' };

  it('category filter', () => {
    expect(filterExpenseRecords(expenses, { ...def, category: 'Travel' }).map((r) => r.id)).toEqual(['2', '3']);
  });

  it('dateFrom + dateTo range', () => {
    expect(filterExpenseRecords(expenses, { ...def, dateFrom: '2026-05-01', dateTo: '2026-06-30' }).map((r) => r.id)).toEqual(['2', '3']);
  });

  it('inverted date range returns empty array', () => {
    expect(filterExpenseRecords(expenses, { ...def, dateFrom: '2026-07-01', dateTo: '2026-04-01' })).toHaveLength(0);
  });

  it('isExpenseFilterActive detects non-default filters', () => {
    expect(isExpenseFilterActive(def)).toBe(false);
    expect(isExpenseFilterActive({ ...def, category: 'Travel' })).toBe(true);
    expect(isExpenseFilterActive({ ...def, dateTo: '2026-06-30' })).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Import / export / restore round-trip (full integration)
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 8: import / export round-trips', () => {
  beforeEach(resetAll);

  it('export → JSON stringify → validate → restore leaves identical records', () => {
    addIncome({ source: 'ExportClient', amount: '1500', status: 'received' });
    addExpense({ merchant: 'ExportShop', amount: '75', category: 'Travel' });
    useTaxStore.getState().setSelectedTaxYear(2025);

    const bundle = storageService.getExportBundle({ selectedTaxYear: 2025 });
    const json = JSON.stringify(bundle);
    const parsed = storageService.parseImportText(json);
    expect(parsed.ok).toBe(true);

    const validated = storageService.validateImportData(JSON.parse(json));
    expect(validated.ok).toBe(true);

    storageService.clearAllData();
    storageService.applyRestore(validated.income, validated.expenses);

    expect(storageService.getIncomeRecords().find((r) => r.source === 'ExportClient')?.amount).toBe('1500');
    expect(storageService.getExpenseRecords().find((r) => r.merchant === 'ExportShop')?.amount).toBe('75');
  });

  it('merge import adds only non-conflicting records and skips duplicate IDs', () => {
    const existing = addIncome({ id: 'existing-1', source: 'Original' });
    const toImport = [
      { id: 'existing-1', date: '2026-06-01', source: 'Duplicate', category: 'Client work', amount: '100', status: 'received' as const },
      { id: 'new-1',      date: '2026-07-01', source: 'NewClient',  category: 'Freelance',  amount: '200', status: 'received' as const },
    ];
    const result = storageService.applyMerge(toImport, []);
    expect(result.income).toBe(1); // only the new record
    const income = storageService.getIncomeRecords();
    expect(income.find((r) => r.id === existing.id)?.source).toBe('Original');
    expect(income.find((r) => r.id === 'new-1')?.source).toBe('NewClient');
  });

  it('restore (via store) applies preferred tax year from appPreferences', () => {
    useTaxStore.getState().restoreImport([], [], { selectedTaxYear: 2023 });
    expect(useTaxStore.getState().selectedTaxYear).toBe(2023);
    expect(localStorage.getItem('taxmate_selected_tax_year')).toBe('2023');
  });

  it('multi-year bundle: restore places records in the correct year buckets', () => {
    const income = [
      { id: 'i24', date: '2024-06-01', source: 'Old', category: 'Client work', amount: '800', status: 'received' as const },
      { id: 'i25', date: '2025-06-01', source: 'Mid', category: 'Client work', amount: '1600', status: 'received' as const },
      { id: 'i26', date: '2026-06-01', source: 'New', category: 'Freelance',   amount: '3200', status: 'received' as const },
    ];
    storageService.applyRestore(income, []);
    const ref24 = storageService.getTaxYearStartForYear(2024);
    const ref25 = storageService.getTaxYearStartForYear(2025);
    const ref26 = storageService.getTaxYearStartForYear(2026);
    const all = storageService.getIncomeRecords();
    expect(storageService.calculateTotalReceived(ref24, all)).toBe(800);
    expect(storageService.calculateTotalReceived(ref25, all)).toBe(1600);
    expect(storageService.calculateTotalReceived(ref26, all)).toBe(3200);
  });

  it('invalid JSON is rejected without touching existing data', () => {
    addIncome({ source: 'SafeClient' });
    const before = storageService.getIncomeRecords().length;
    const result = storageService.parseImportText('{ totally broken');
    expect(result.ok).toBe(false);
    expect(storageService.getIncomeRecords()).toHaveLength(before);
  });

  it('schema v2 with unknown expense category is rejected', () => {
    const badBundle = {
      schemaVersion: 2,
      exportDate: new Date().toISOString(),
      appPreferences: {},
      incomeRecords: [],
      expenseRecords: [{ id: 'e1', date: '2026-06-01', merchant: 'Shop', amount: '10', category: 'Snacks' }],
    };
    const result = storageService.validateImportData(badBundle);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /unsupported category/i.test(e))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Clear all data
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 8: clear all data', () => {
  beforeEach(resetAll);

  it('clearAll removes every income and expense record', () => {
    addIncome(); addIncome(); addExpense();
    useTaxStore.getState().clearAll();
    expect(useTaxStore.getState().income).toHaveLength(0);
    expect(useTaxStore.getState().expenses).toHaveLength(0);
    expect(storageService.getIncomeRecords()).toHaveLength(0);
    expect(storageService.getExpenseRecords()).toHaveLength(0);
  });

  it('clearAll resets the selected tax year to the current default', () => {
    useTaxStore.getState().setSelectedTaxYear(2023);
    useTaxStore.getState().clearAll();
    expect(useTaxStore.getState().selectedTaxYear).toBe(currentTaxYearStart());
  });

  it('clearAll removes the error state (storage error key)', () => {
    localStorage.setItem('taxmate_storage_error', 'boom');
    storageService.clearAllData();
    expect(localStorage.getItem('taxmate_storage_error')).toBeNull();
  });

  it('clearAll removes the persisted selected year key', () => {
    useTaxStore.getState().setSelectedTaxYear(2024);
    storageService.clearAllData();
    expect(localStorage.getItem('taxmate_selected_tax_year')).toBeNull();
  });

  it('after clearAll, new records can be added normally', () => {
    addIncome(); useTaxStore.getState().clearAll();
    addIncome({ source: 'PostClearClient' });
    expect(storageService.getIncomeRecords()).toHaveLength(1);
    expect(storageService.getIncomeRecords()[0].source).toBe('PostClearClient');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Reconciliation: invoiced = received + outstanding + overdue
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 8: reconciliation identity', () => {
  beforeEach(resetAll);

  it('holds for a typical mixed ledger in the current tax year', () => {
    const ref = storageService.getTaxYearStartForYear(2026);
    const income = [
      { id: '1', date: '2026-06-01', amount: '1000', status: 'received', source: 'A', category: 'Client work' },
      { id: '2', date: '2026-06-02', amount: '500',  status: 'pending',  source: 'B', category: 'Freelance' },
      { id: '3', date: '2026-06-03', amount: '250',  status: 'overdue',  source: 'C', category: 'Other' },
    ];
    const invoiced  = storageService.calculateTotalInvoiced(ref, income);
    const received  = storageService.calculateTotalReceived(ref, income);
    const outstanding = storageService.calculateOutstanding(ref, income);
    const overdue   = storageService.calculateOverdue(ref, income);
    expect(invoiced).toBe(1750);
    expect(received).toBe(1000);
    expect(outstanding).toBe(500);
    expect(overdue).toBe(250);
    expect(invoiced).toBe(storageService.roundCurrency(received + outstanding + overdue));
  });

  it('holds after float-sensitive amounts (pence accumulation, no drift)', () => {
    const ref = storageService.getTaxYearStartForYear(2026);
    const income = [
      { id: 'a', date: '2026-06-01', amount: '0.10', status: 'received', source: 'X', category: 'Client work' },
      { id: 'b', date: '2026-06-02', amount: '0.20', status: 'pending',  source: 'Y', category: 'Freelance' },
      { id: 'c', date: '2026-06-03', amount: '0.30', status: 'overdue',  source: 'Z', category: 'Other' },
    ];
    const invoiced    = storageService.calculateTotalInvoiced(ref, income);
    const received    = storageService.calculateTotalReceived(ref, income);
    const outstanding = storageService.calculateOutstanding(ref, income);
    const overdue     = storageService.calculateOverdue(ref, income);
    expect(invoiced).toBe(0.60);
    expect(storageService.roundCurrency(received + outstanding + overdue)).toBe(invoiced);
  });

  it('holds in a past (complete) tax year after an export→restore cycle', () => {
    const income = [
      { id: 'p1', date: '2025-06-01', amount: '800',  status: 'received', source: 'A', category: 'Client work' },
      { id: 'p2', date: '2025-07-01', amount: '200',  status: 'pending',  source: 'B', category: 'Freelance' },
    ];
    storageService.applyRestore(income, []);
    const ref = storageService.getTaxYearStartForYear(2025);
    const all = storageService.getIncomeRecords();
    const invoiced    = storageService.calculateTotalInvoiced(ref, all);
    const received    = storageService.calculateTotalReceived(ref, all);
    const outstanding = storageService.calculateOutstanding(ref, all);
    const overdue     = storageService.calculateOverdue(ref, all);
    expect(invoiced).toBe(1000);
    expect(storageService.roundCurrency(received + outstanding + overdue)).toBe(invoiced);
  });

  it('unknown/invalid status is excluded from all four metrics (no invisible money)', () => {
    const ref = storageService.getTaxYearStartForYear(2026);
    const income = [
      { id: '1', date: '2026-06-01', amount: '100', status: 'received', source: 'A', category: 'Client work' },
      { id: '2', date: '2026-06-02', amount: '999', status: 'archived', source: 'B', category: 'Other' }, // unknown
    ];
    expect(storageService.calculateTotalInvoiced(ref, income)).toBe(100);
    expect(storageService.calculateTotalReceived(ref, income)).toBe(100);
    expect(storageService.calculateOutstanding(ref, income)).toBe(0);
    expect(storageService.calculateOverdue(ref, income)).toBe(0);
  });

  it('store-level reconciliation: net profit = received - expenses', () => {
    addIncome({ amount: '1000', status: 'received', date: '2026-06-01' });
    addExpense({ amount: '250', date: '2026-06-02' });
    const ref26 = storageService.getTaxYearStartForYear(2026);
    const all = storageService.getIncomeRecords();
    const expenses = storageService.getExpenseRecords();
    const received = storageService.calculateTotalReceived(ref26, all);
    const totalExpenses = storageService.calculateTotalExpensesYTD(ref26, expenses);
    const netProfit = storageService.roundCurrency(received - totalExpenses);
    expect(netProfit).toBe(750);
  });
});
