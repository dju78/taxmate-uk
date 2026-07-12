import { describe, it, expect } from 'vitest';
import { storageService } from './storage';

// Helper: assert a Date matches given local calendar parts.
const expectDate = (date, year, month1Indexed, day) => {
  expect(date.getFullYear()).toBe(year);
  expect(date.getMonth()).toBe(month1Indexed - 1);
  expect(date.getDate()).toBe(day);
};

describe('getTaxYearStart / getTaxYearEnd / getNextTaxYearStart', () => {
  it('5 April belongs to the tax year that started the previous 6 April', () => {
    const ref = new Date(2026, 3, 5); // 5 April 2026
    expectDate(storageService.getTaxYearStart(ref), 2025, 4, 6);
    expectDate(storageService.getTaxYearEnd(ref), 2026, 4, 5);
    expectDate(storageService.getNextTaxYearStart(ref), 2026, 4, 6);
  });

  it('6 April starts a new tax year', () => {
    const ref = new Date(2026, 3, 6); // 6 April 2026
    expectDate(storageService.getTaxYearStart(ref), 2026, 4, 6);
    expectDate(storageService.getTaxYearEnd(ref), 2027, 4, 5);
    expectDate(storageService.getNextTaxYearStart(ref), 2027, 4, 6);
  });

  it('January belongs to the tax year that started the previous 6 April', () => {
    const ref = new Date(2026, 0, 15); // 15 January 2026
    expectDate(storageService.getTaxYearStart(ref), 2025, 4, 6);
    expectDate(storageService.getTaxYearEnd(ref), 2026, 4, 5);
  });

  it('5 April of the following year still closes the same tax year', () => {
    const ref = new Date(2027, 3, 5); // 5 April 2027
    expectDate(storageService.getTaxYearStart(ref), 2026, 4, 6);
    expectDate(storageService.getTaxYearEnd(ref), 2027, 4, 5);
  });

  it('6 April of the following year opens the next tax year', () => {
    const ref = new Date(2027, 3, 6); // 6 April 2027
    expectDate(storageService.getTaxYearStart(ref), 2027, 4, 6);
    expectDate(storageService.getTaxYearEnd(ref), 2028, 4, 5);
  });

  it('handles leap years correctly', () => {
    // 29 February 2024 falls in the 2023/24 tax year.
    const leapRef = new Date(2024, 1, 29); // 29 February 2024
    expectDate(storageService.getTaxYearStart(leapRef), 2023, 4, 6);
    expectDate(storageService.getTaxYearEnd(leapRef), 2024, 4, 5);

    // The 2023/24 tax year contains the leap day, and the tax year that
    // starts on a leap-day year opens correctly on 6 April.
    const leapStartRef = new Date(2024, 3, 6); // 6 April 2024
    expectDate(storageService.getTaxYearStart(leapStartRef), 2024, 4, 6);
    expectDate(storageService.getTaxYearEnd(leapStartRef), 2025, 4, 5);
  });
});

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD as a local date without UTC day shifting', () => {
    const d = storageService.parseLocalDate('2026-07-12');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // July (0-indexed)
    expect(d.getDate()).toBe(12);
  });

  it('returns a Date unchanged when already a Date', () => {
    const original = new Date(2026, 6, 12);
    expect(storageService.parseLocalDate(original)).toBe(original);
  });
});

describe('isInActiveTaxYear (exclusive upper boundary)', () => {
  const ref = new Date(2027, 2, 15); // 15 March 2027 -> tax year 2026/27

  it('includes a transaction dated 5 April at the very end of the year', () => {
    expect(storageService.isInActiveTaxYear('2027-04-05', ref)).toBe(true);
  });

  it('excludes a transaction dated 6 April (start of the next year)', () => {
    expect(storageService.isInActiveTaxYear('2027-04-06', ref)).toBe(false);
  });

  it('includes the first day of the tax year (6 April)', () => {
    expect(storageService.isInActiveTaxYear('2026-04-06', ref)).toBe(true);
  });

  it('excludes the last day of the previous tax year (5 April)', () => {
    expect(storageService.isInActiveTaxYear('2026-04-05', ref)).toBe(false);
  });
});

describe('getCompletedTaxMonths', () => {
  it('returns 0 on the first day of the tax year', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 3, 6))).toBe(0);
  });

  it('returns 1 after one completed tax month', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 4, 6))).toBe(1);
  });

  it('returns 2 mid-way through the third tax month', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 6, 3))).toBe(2);
  });

  it('returns 3 on 12 July 2026', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 6, 12))).toBe(3);
  });
});

describe('income metric separation', () => {
  const ref = new Date(2026, 6, 12); // 12 July 2026 -> tax year 2026/27
  const records = [
    { id: '1', date: '2026-05-10', amount: '2000', status: 'Received' },
    { id: '2', date: '2026-06-15', amount: '1000', status: 'Received' },
    { id: '3', date: '2026-07-01', amount: '500', status: 'Pending' },
    { id: '4', date: '2026-06-20', amount: '300', status: 'Overdue' },
    { id: '5', date: '2025-03-01', amount: '9999', status: 'Received' }, // prior tax year
  ];

  it('total received counts only Received in the active tax year', () => {
    expect(storageService.calculateTotalReceived(ref, records)).toBe(3000);
  });

  it('total invoiced counts every status in the active tax year', () => {
    expect(storageService.calculateTotalInvoiced(ref, records)).toBe(3800);
  });

  it('outstanding counts only Pending', () => {
    expect(storageService.calculateOutstanding(ref, records)).toBe(500);
  });

  it('overdue counts only Overdue', () => {
    expect(storageService.calculateOverdue(ref, records)).toBe(300);
  });

  it('does not treat pending or overdue entries as received', () => {
    const received = storageService.calculateTotalReceived(ref, records);
    const invoiced = storageService.calculateTotalInvoiced(ref, records);
    expect(received).toBeLessThan(invoiced);
    expect(invoiced - received).toBe(800); // 500 pending + 300 overdue
  });

  it('excludes prior-tax-year records', () => {
    // The £9999 prior-year record must not leak into the active tax year.
    expect(storageService.calculateTotalInvoiced(ref, records)).toBe(3800);
    expect(storageService.getIncomeInTaxYear(records, ref)).toHaveLength(4);
  });

  it('income this month excludes non-received entries', () => {
    // The only July entry is Pending, so received-this-month is 0.
    expect(storageService.calculateIncomeThisMonth(ref, records)).toBe(0);
  });

  it('average income = received / completed tax months', () => {
    // received 3000 / 3 completed tax months = 1000
    expect(storageService.calculateAverageMonthlyIncome(ref, records)).toBe(1000);
  });
});

describe('expense metrics', () => {
  const ref = new Date(2026, 6, 12); // 12 July 2026
  const records = [
    { id: '1', date: '2026-06-10', amount: '89.99', category: 'Supplies' },
    { id: '2', date: '2025-03-01', amount: '500', category: 'Travel' }, // prior tax year
  ];

  it('total expenses YTD excludes prior tax years', () => {
    expect(storageService.calculateTotalExpensesYTD(ref, records)).toBe(89.99);
  });

  it('average expenses = total / completed tax months, rounded to 2dp', () => {
    // 89.99 / 3 = 29.9966... -> 30.00
    expect(storageService.calculateAverageMonthlyExpenses(ref, records)).toBe(30);
  });
});

describe('currency rounding', () => {
  it('rounds floating-point sums to 2 decimal places', () => {
    const ref = new Date(2026, 6, 12);
    const records = [
      { id: '1', date: '2026-05-01', amount: '0.10', status: 'Received' },
      { id: '2', date: '2026-05-02', amount: '0.20', status: 'Received' },
    ];
    // 0.1 + 0.2 = 0.30000000000000004 without rounding
    expect(storageService.calculateTotalReceived(ref, records)).toBe(0.3);
  });

  it('roundCurrency collapses long decimals to 2dp', () => {
    expect(storageService.roundCurrency(89.99 / 3)).toBe(30);
    expect(storageService.roundCurrency(10 / 3)).toBe(3.33);
    expect(storageService.roundCurrency(2 / 3)).toBe(0.67);
  });
});
