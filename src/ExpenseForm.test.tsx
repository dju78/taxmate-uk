// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExpenseForm } from './ExpenseForm';
import { storageService } from './storage';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const fillCoreFields = (date: string, merchant: string, amount: string) => {
  fireEvent.change(screen.getByLabelText(/Date/), { target: { value: date } });
  fireEvent.change(screen.getByLabelText(/Merchant or Vendor/), { target: { value: merchant } });
  fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: amount } });
};

describe('ExpenseForm duplicate review flow', () => {
  it('shows the duplicate-review panel instead of submitting when a matching record already exists', () => {
    storageService.addExpenseRecord({
      date: '2026-05-03',
      merchant: 'Amazon',
      category: 'Office costs',
      amount: '89.99',
    });
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fillCoreFields('2026-05-03', 'Amazon', '89.99');
    fireEvent.click(screen.getByRole('button', { name: 'Add Expense' }));

    expect(screen.getByText('Possible Duplicate Detected')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('"Review existing record" returns to the form without submitting', () => {
    storageService.addExpenseRecord({
      date: '2026-05-03',
      merchant: 'Amazon',
      category: 'Office costs',
      amount: '89.99',
    });
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fillCoreFields('2026-05-03', 'Amazon', '89.99');
    fireEvent.click(screen.getByRole('button', { name: 'Add Expense' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review existing record' }));

    expect(screen.queryByText('Possible Duplicate Detected')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add Expense' })).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('"Save anyway" submits the form despite the duplicate warning', () => {
    storageService.addExpenseRecord({
      date: '2026-05-03',
      merchant: 'Amazon',
      category: 'Office costs',
      amount: '89.99',
    });
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fillCoreFields('2026-05-03', 'Amazon', '89.99');
    fireEvent.click(screen.getByRole('button', { name: 'Add Expense' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save anyway' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ merchant: 'Amazon', amount: '89.99' });
  });

  it('"Cancel" from the duplicate panel calls onCancel without submitting', () => {
    storageService.addExpenseRecord({
      date: '2026-05-03',
      merchant: 'Amazon',
      category: 'Office costs',
      amount: '89.99',
    });
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    fillCoreFields('2026-05-03', 'Amazon', '89.99');
    fireEvent.click(screen.getByRole('button', { name: 'Add Expense' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('editing the matching record itself does not trigger the duplicate flow (edit-mode exclusion)', () => {
    const existing = storageService.addExpenseRecord({
      date: '2026-05-03',
      merchant: 'Amazon',
      category: 'Office costs',
      amount: '89.99',
    });
    const onSubmit = vi.fn();
    render(<ExpenseForm initialData={existing} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Update Expense' }));

    expect(screen.queryByText('Possible Duplicate Detected')).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
