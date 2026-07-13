// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import { ReportsView } from './ReportsView';
import { useTaxStore, currentTaxYearStart } from './store';
import { storageService } from './storage';

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  storageService.clearAllData();
  const year = currentTaxYearStart();
  useTaxStore.setState({ income: [], expenses: [], selectedTaxYear: year });
});

describe('ReportsView reconciliation', () => {
  it('summary KPIs reconcile with the underlying ledger for the selected tax year', () => {
    const year = currentTaxYearStart();
    useTaxStore.getState().addIncome({ date: `${year}-05-01`, source: 'Acme', category: 'Freelance', amount: '1000', status: 'received' });
    useTaxStore.getState().addIncome({ date: `${year}-06-01`, source: 'Beta', category: 'Freelance', amount: '500', status: 'pending' });
    useTaxStore.getState().addIncome({ date: `${year}-06-15`, source: 'Gamma', category: 'Freelance', amount: '200', status: 'overdue' });
    useTaxStore.getState().addExpense({ date: `${year}-05-10`, merchant: 'Amazon', category: 'Office costs', amount: '150' });
    useTaxStore.getState().setSelectedTaxYear(year);

    render(<ReportsView />);

    // Income received counts only the 'received' record (1000), not pending/overdue.
    expect(screen.getAllByText('£1000.00').length).toBeGreaterThan(0);
    // Expenses recorded.
    expect(screen.getAllByText('£150.00').length).toBeGreaterThan(0);
    // Recorded cash surplus = 1000 - 150 = 850.
    expect(screen.getAllByText('£850.00').length).toBeGreaterThan(0);
    // Outstanding (pending) and overdue income are tracked separately from "received".
    expect(screen.getAllByText('£500.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('£200.00').length).toBeGreaterThan(0);
    // Transaction counts reflect ALL income statuses, not just received.
    expect(screen.getAllByText('3 Income / 1 Expenses').length).toBeGreaterThan(0);
  });

  it('excludes records outside the selected tax year from the reconciliation', () => {
    const year = currentTaxYearStart();
    useTaxStore.getState().addIncome({ date: `${year}-05-01`, source: 'InYear', category: 'Freelance', amount: '100', status: 'received' });
    // 6 April is the tax-year boundary: one day before it falls in the PRIOR tax year.
    useTaxStore.getState().addIncome({ date: `${year}-04-05`, source: 'PriorYear', category: 'Freelance', amount: '9999', status: 'received' });
    useTaxStore.getState().setSelectedTaxYear(year);

    render(<ReportsView />);

    // Only the in-year record counts toward the current year's totals; the
    // prior-year record (dated one day before the 6 April boundary) is
    // excluded from this year's reconciliation entirely.
    expect(screen.getAllByText('£100.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1 Income / 0 Expenses').length).toBeGreaterThan(0);
  });

  it('past tax years summary shows independent, per-year counts without archiving records', () => {
    const year = currentTaxYearStart();
    useTaxStore.getState().addIncome({ date: `${year}-05-01`, source: 'Current', category: 'Freelance', amount: '300', status: 'received' });
    useTaxStore.getState().addIncome({ date: `${year - 1}-05-01`, source: 'LastYear', category: 'Freelance', amount: '750', status: 'received' });
    useTaxStore.getState().addExpense({ date: `${year - 1}-05-02`, merchant: 'Shop', category: 'Office costs', amount: '50' });
    useTaxStore.getState().setSelectedTaxYear(year);

    render(<ReportsView />);
    fireEvent.click(screen.getByRole('button', { name: 'Past Years' }));

    const priorYearHeading = screen.getByText(`${year - 1}/${String(year % 100).padStart(2, '0')}`);
    const card = priorYearHeading.closest('div.rounded-xl') as HTMLElement;
    expect(card).toBeTruthy();
    expect(within(card).getByText('Income Count').nextElementSibling?.textContent).toBe('1');
    expect(within(card).getByText('Expense Count').nextElementSibling?.textContent).toBe('1');
    expect(within(card).getByText('£750.00')).toBeTruthy();
    expect(within(card).getByText('£50.00')).toBeTruthy();
    expect(within(card).getByText('£700.00')).toBeTruthy(); // 750 - 50 surplus

    // "Open report" switches the selected tax year rather than creating a
    // separate immutable archive — the underlying records are unchanged.
    fireEvent.click(within(card).getByRole('button', { name: 'Open report →' }));
    expect(useTaxStore.getState().selectedTaxYear).toBe(year - 1);
    expect(useTaxStore.getState().income).toHaveLength(2);
  });
});
