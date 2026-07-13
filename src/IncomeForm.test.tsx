// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { IncomeForm } from './IncomeForm';
import { storageService } from './storage';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const fillCoreFields = async (date: string, source: string, amount: string) => {
  fireEvent.change(screen.getByLabelText(/Date/), { target: { value: date } });
  fireEvent.change(screen.getByLabelText(/Client or Income Source/), { target: { value: source } });
  fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: amount } });
};

describe('IncomeForm duplicate review flow', () => {
  it('shows the duplicate-review panel instead of submitting when a matching record already exists', async () => {
    storageService.addIncomeRecord({
      date: '2026-05-01',
      source: 'Acme Ltd',
      category: 'Client work',
      amount: '250.00',
      status: 'received',
    });
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<IncomeForm onSubmit={onSubmit} onCancel={onCancel} />);

    await fillCoreFields('2026-05-01', 'Acme Ltd', '250.00');
    fireEvent.click(screen.getByRole('button', { name: 'Add Income' }));

    expect(screen.getByText('Possible Duplicate Detected')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('"Review existing record" returns to the form without submitting', async () => {
    storageService.addIncomeRecord({
      date: '2026-05-01',
      source: 'Acme Ltd',
      category: 'Client work',
      amount: '250.00',
      status: 'received',
    });
    const onSubmit = vi.fn();
    render(<IncomeForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await fillCoreFields('2026-05-01', 'Acme Ltd', '250.00');
    fireEvent.click(screen.getByRole('button', { name: 'Add Income' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review existing record' }));

    expect(screen.queryByText('Possible Duplicate Detected')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add Income' })).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('"Save anyway" submits the form despite the duplicate warning', async () => {
    storageService.addIncomeRecord({
      date: '2026-05-01',
      source: 'Acme Ltd',
      category: 'Client work',
      amount: '250.00',
      status: 'received',
    });
    const onSubmit = vi.fn();
    render(<IncomeForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await fillCoreFields('2026-05-01', 'Acme Ltd', '250.00');
    fireEvent.click(screen.getByRole('button', { name: 'Add Income' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save anyway' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ source: 'Acme Ltd', amount: '250.00' });
  });

  it('"Cancel" from the duplicate panel calls onCancel without submitting', async () => {
    storageService.addIncomeRecord({
      date: '2026-05-01',
      source: 'Acme Ltd',
      category: 'Client work',
      amount: '250.00',
      status: 'received',
    });
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<IncomeForm onSubmit={onSubmit} onCancel={onCancel} />);

    await fillCoreFields('2026-05-01', 'Acme Ltd', '250.00');
    fireEvent.click(screen.getByRole('button', { name: 'Add Income' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('editing the matching record itself does not trigger the duplicate flow (edit-mode exclusion)', () => {
    const existing = storageService.addIncomeRecord({
      date: '2026-05-01',
      source: 'Acme Ltd',
      category: 'Client work',
      amount: '250.00',
      status: 'received',
    });
    const onSubmit = vi.fn();
    render(<IncomeForm initialData={existing} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Update Income' }));

    expect(screen.queryByText('Possible Duplicate Detected')).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('after returning via "Review existing record", changing the source no longer flags a duplicate on re-submit', async () => {
    storageService.addIncomeRecord({
      date: '2026-05-01',
      source: 'Acme Ltd',
      category: 'Client work',
      amount: '250.00',
      status: 'received',
    });
    const onSubmit = vi.fn();
    render(<IncomeForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await fillCoreFields('2026-05-01', 'Acme Ltd', '250.00');
    fireEvent.click(screen.getByRole('button', { name: 'Add Income' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review existing record' }));

    fireEvent.change(screen.getByLabelText(/Client or Income Source/), { target: { value: 'A Different Client' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Income' }));

    expect(screen.queryByText('Possible Duplicate Detected')).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
