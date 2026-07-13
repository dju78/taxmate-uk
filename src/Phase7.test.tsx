// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DeadlineTracker } from './DeadlineTracker';
import { IncomeForm } from './IncomeForm';
import { ExpenseForm } from './ExpenseForm';
import { ChartFigure } from './ChartFigure';

afterEach(cleanup);

describe('DeadlineTracker', () => {
  it('renders the next key deadline and a general-guidance disclaimer', () => {
    render(<DeadlineTracker today={new Date(2026, 6, 13)} />);
    const section = screen.getByRole('region', { name: 'Next key deadlines' });
    expect(section).toBeTruthy();
    expect(screen.getByText('Next key deadline')).toBeTruthy();
    // The soonest deadline (31 July) is flagged "Next".
    expect(screen.getByText('Next')).toBeTruthy();
    expect(screen.getByText(/not personal tax advice/i)).toBeTruthy();
  });
});

describe('IncomeForm accessibility (migrated to TSX)', () => {
  it('every field has a hard-linked label, including Description and Notes', () => {
    render(<IncomeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Date *')).toBeTruthy();
    expect(screen.getByLabelText('Client or Income Source *')).toBeTruthy();
    expect(screen.getByLabelText('Description')).toBeTruthy();
    expect(screen.getByLabelText('Category *')).toBeTruthy();
    expect(screen.getByLabelText('Amount (£) *')).toBeTruthy();
    expect(screen.getByLabelText('Status *')).toBeTruthy();
    expect(screen.getByLabelText('Notes')).toBeTruthy();
  });

  it('shows connected error messages on invalid submit', () => {
    render(<IncomeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.submit(screen.getByRole('button', { name: 'Add Income' }).closest('form')!);
    const source = screen.getByLabelText('Client or Income Source *');
    expect(source.getAttribute('aria-invalid')).toBe('true');
    const describedBy = source.getAttribute('aria-describedby');
    expect(describedBy).toBe('income-source-error');
    expect(document.getElementById(describedBy!)?.getAttribute('role')).toBe('alert');
  });
});

describe('ExpenseForm accessibility (Payment Method + Notes wired)', () => {
  it('links labels for Category, Payment Method and Notes', () => {
    render(<ExpenseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Category *')).toBeTruthy();
    expect(screen.getByLabelText('Payment Method *')).toBeTruthy();
    expect(screen.getByLabelText('Notes')).toBeTruthy();
  });
});

describe('ChartFigure accessibility', () => {
  it('renders a figure with a caption and a screen-reader data table', () => {
    render(
      <ChartFigure
        title="Income vs expenses"
        subtitle="2026/27"
        axisLabel="Amount by month"
        columns={['Received', 'Expenses']}
        rows={[{ label: 'May', values: [100, 20] }]}
      >
        <div>bars</div>
      </ChartFigure>
    );
    const fig = screen.getByRole('figure', { name: /Income vs expenses/ });
    expect(fig).toBeTruthy();
    // The SR data table carries the exact numbers.
    const table = fig.querySelector('table');
    expect(table).toBeTruthy();
    expect(table!.textContent).toContain('£100.00');
    expect(table!.textContent).toContain('£20.00');
    // Column + row headers exist.
    expect(fig.querySelector('th[scope="col"]')).toBeTruthy();
    expect(fig.querySelector('th[scope="row"]')).toBeTruthy();
  });
});
