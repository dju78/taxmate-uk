// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Dashboard from './App';
import { useTaxStore, currentTaxYearStart } from './store';
import { storageService } from './storage';
import { CURRENT_ONBOARDING_VERSION } from './OnboardingModal';

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  storageService.clearAllData();
  // Prevent the first-run onboarding modal from covering the dashboard.
  storageService.setAppPreferences({ onboardingCompleted: true, onboardingVersion: CURRENT_ONBOARDING_VERSION });
  const year = currentTaxYearStart();
  useTaxStore.setState({ income: [], expenses: [], selectedTaxYear: year, incomeSearch: '', expenseSearch: '' });
});

describe('accessible result-count announcements', () => {
  it('the income "Showing X of Y records" status updates live as the user searches', () => {
    const year = currentTaxYearStart();
    useTaxStore.getState().addIncome({ date: `${year}-05-01`, source: 'Acme Ltd', category: 'Client work', amount: '100', status: 'received' });
    useTaxStore.getState().addIncome({ date: `${year}-05-02`, source: 'Beta Co', category: 'Freelance', amount: '200', status: 'received' });

    render(<Dashboard />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Income' })[0]);

    const status = screen.getByText(/Showing \d+ of \d+ records/);
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('Showing 2 of 2 records');

    fireEvent.change(screen.getByPlaceholderText('Search records...'), { target: { value: 'Acme' } });

    expect(status.textContent).toBe('Showing 1 of 2 records');
  });

  it('the expense "Showing X of Y records" status updates live as the user searches', () => {
    const year = currentTaxYearStart();
    useTaxStore.getState().addExpense({ date: `${year}-05-01`, merchant: 'Amazon', category: 'Office costs', amount: '50' });
    useTaxStore.getState().addExpense({ date: `${year}-05-02`, merchant: 'Shell', category: 'Travel', amount: '30' });

    render(<Dashboard />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Expenses' })[0]);

    const status = screen.getByText(/Showing \d+ of \d+ records/);
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('Showing 2 of 2 records');

    fireEvent.change(screen.getByPlaceholderText('Search records...'), { target: { value: 'Amazon' } });

    expect(status.textContent).toBe('Showing 1 of 2 records');
  });
});
