// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  useTaxStore,
  getAvailableTaxYears,
  taxYearStartToLabel,
  currentTaxYearStart,
} from './store';
import { storageService } from './storage';

describe('Phase 2: tax-year store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('offers exactly three tax years (current + two prior)', () => {
    expect(getAvailableTaxYears(2026)).toEqual([2026, 2025, 2024]);
  });

  it('labels a start year as a UK tax year (6 Apr -> 5 Apr)', () => {
    expect(taxYearStartToLabel(2026)).toBe('2026/27');
    expect(taxYearStartToLabel(2025)).toBe('2025/26');
    expect(taxYearStartToLabel(2024)).toBe('2024/25');
  });

  it('defaults to the tax year containing today', () => {
    expect(useTaxStore.getState().selectedTaxYear).toBe(currentTaxYearStart());
  });

  it('persists the selected tax year to localStorage', () => {
    useTaxStore.getState().setSelectedTaxYear(2025);
    expect(useTaxStore.getState().selectedTaxYear).toBe(2025);
    expect(localStorage.getItem('taxmate_selected_tax_year')).toBe('2025');
  });

  it('does not reset a saved selection (persistence survives a re-read)', () => {
    useTaxStore.getState().setSelectedTaxYear(2024);
    // Simulate a fresh read of the persisted preference.
    expect(Number(localStorage.getItem('taxmate_selected_tax_year'))).toBe(2024);
  });
});

describe('Phase 4: import / demo / clear (storage layer)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('rejects a structurally invalid backup and reports errors', () => {
    const r1 = storageService.validateImportData(null);
    expect(r1.ok).toBe(false);
    const r2 = storageService.validateImportData({ income: 'nope' });
    expect(r2.ok).toBe(false);
    const r3 = storageService.validateImportData({
      income: [{ date: 'bad', amount: '10x', status: 'weird' }],
    });
    expect(r3.ok).toBe(false);
    expect(r3.errors.length).toBeGreaterThan(0);
  });

  it('accepts a well-formed backup and normalises records', () => {
    const result = storageService.validateImportData({
      income: [{ date: '2026-05-01', amount: '100', status: 'Received', source: 'Acme' }],
      expenses: [{ date: '2026-05-02', amount: '20', merchant: 'Shop', category: 'Travel' }],
    });
    expect(result.ok).toBe(true);
    expect(result.income[0].status).toBe('received');
    expect(result.income).toHaveLength(1);
    expect(result.expenses).toHaveLength(1);
  });

  it('parseImportText reports invalid JSON without throwing', () => {
    const result = storageService.parseImportText('{ not json');
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/not valid JSON/i);
  });

  it('a FAILED import does not change existing data (validate does not write)', () => {
    storageService.addIncomeRecord({ date: '2026-05-01', amount: '500', status: 'received', source: 'Mine' });
    const before = storageService.getIncomeRecords();
    storageService.parseImportText('{ broken');
    storageService.validateImportData({ income: [{ date: 'bad' }] });
    expect(storageService.getIncomeRecords()).toEqual(before);
  });

  it('applyImport merges and skips duplicate ids (idempotent restore)', () => {
    const income = [{ id: 'imp1', date: '2026-05-01', source: 'A', category: 'Client work', amount: '100', status: 'received' as const }];
    const first = storageService.applyImport(income, []);
    expect(first.income).toBe(1);
    const second = storageService.applyImport(income, []); // same id -> skipped
    expect(second.income).toBe(0);
    expect(storageService.getIncomeRecords()).toHaveLength(1);
  });

  it('loadDemoData is idempotent and marks records isDemo', () => {
    const r1 = storageService.loadDemoData();
    expect(r1.income).toBeGreaterThan(0);
    expect(storageService.hasDemoData()).toBe(true);
    const r2 = storageService.loadDemoData();
    expect(r2.income).toBe(0); // already loaded
    expect(storageService.getIncomeRecords().every((r) => r.isDemo)).toBe(true);
  });

  it('removeDemoData removes only demo records, preserving user records', () => {
    storageService.addIncomeRecord({ date: '2026-05-01', amount: '999', status: 'received', source: 'Real User' });
    storageService.loadDemoData();
    const removed = storageService.removeDemoData();
    expect(removed.income).toBeGreaterThan(0);
    const left = storageService.getIncomeRecords();
    expect(left.some((r) => r.isDemo)).toBe(false);
    expect(left.some((r) => r.source === 'Real User')).toBe(true);
  });

  it('clearAllData removes everything', () => {
    storageService.addIncomeRecord({ date: '2026-05-01', amount: '10', status: 'received', source: 'X' });
    storageService.addExpenseRecord({ date: '2026-05-01', amount: '5', merchant: 'Y', category: 'Travel' });
    storageService.clearAllData();
    expect(storageService.getIncomeRecords()).toEqual([]);
    expect(storageService.getExpenseRecords()).toEqual([]);
  });
});
