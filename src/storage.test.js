import { describe, it, expect } from 'vitest';
import { storageService, INCOME_STATUS } from './storage';

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

describe('getCompletedTaxMonths (first-month boundaries)', () => {
  it('returns 0 on 6 April (first day of the tax year)', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 3, 6))).toBe(0);
  });

  it('returns 0 on 30 April (still inside the first tax month)', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 3, 30))).toBe(0);
  });

  it('returns 0 on 5 May (last day before the first tax month closes)', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 4, 5))).toBe(0);
  });

  it('returns 1 on 6 May (first tax month complete)', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 4, 6))).toBe(1);
  });

  it('returns 2 mid-way through the third tax month', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 6, 3))).toBe(2);
  });

  it('returns 3 on 12 July 2026', () => {
    expect(storageService.getCompletedTaxMonths(new Date(2026, 6, 12))).toBe(3);
  });

  it('getFirstAverageAvailableDate is 6 May of the tax year', () => {
    expectDate(storageService.getFirstAverageAvailableDate(new Date(2026, 3, 20)), 2026, 5, 6);
  });
});

describe('average is unavailable (null) before the first tax month closes', () => {
  const incomeRecords = [{ id: '1', date: '2026-04-10', amount: '1000', status: 'received' }];
  const expenseRecords = [{ id: '1', date: '2026-04-10', amount: '89.99' }];

  it('income average is null on 6 April', () => {
    expect(storageService.calculateAverageMonthlyIncome(new Date(2026, 3, 6), incomeRecords)).toBeNull();
  });

  it('income average is null on 5 May', () => {
    expect(storageService.calculateAverageMonthlyIncome(new Date(2026, 4, 5), incomeRecords)).toBeNull();
  });

  it('income average becomes a number on 6 May', () => {
    expect(storageService.calculateAverageMonthlyIncome(new Date(2026, 4, 6), incomeRecords)).toBe(1000);
  });

  it('expense average is null on 30 April and a number on 6 May', () => {
    expect(storageService.calculateAverageMonthlyExpenses(new Date(2026, 3, 30), expenseRecords)).toBeNull();
    expect(storageService.calculateAverageMonthlyExpenses(new Date(2026, 4, 6), expenseRecords)).toBe(89.99);
  });
});

describe('income status normalisation', () => {
  const ref = new Date(2026, 6, 12); // 12 July 2026
  const records = [
    { id: '1', date: '2026-05-10', amount: '100', status: 'Received' },
    { id: '2', date: '2026-05-11', amount: '200', status: 'received' },
    { id: '3', date: '2026-05-12', amount: '400', status: 'RECEIVED' },
    { id: '4', date: '2026-05-13', amount: '50', status: ' Pending ' },
  ];

  it('treats Received / received / RECEIVED as the same status', () => {
    expect(storageService.calculateTotalReceived(ref, records)).toBe(700);
  });

  it('trims and lowercases surrounding whitespace/case for other statuses', () => {
    expect(storageService.calculateOutstanding(ref, records)).toBe(50);
  });

  it('normaliseIncomeStatus maps variants to canonical constants', () => {
    expect(storageService.normaliseIncomeStatus('  OverDUE ')).toBe(INCOME_STATUS.OVERDUE);
    expect(storageService.normaliseIncomeStatus(undefined)).toBe('');
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
  it('sums 0.10 + 0.20 exactly as 0.30 (integer-pence accumulation)', () => {
    const ref = new Date(2026, 6, 12);
    const records = [
      { id: '1', date: '2026-05-01', amount: '0.10', status: 'Received' },
      { id: '2', date: '2026-05-02', amount: '0.20', status: 'Received' },
    ];
    // 0.1 + 0.2 = 0.30000000000000004 with naive float addition
    expect(storageService.calculateTotalReceived(ref, records)).toBe(0.3);
  });

  it('accumulates many 1p amounts without float drift', () => {
    const ref = new Date(2026, 6, 12);
    // 1001 records of £0.01 each = £10.01 exactly.
    const records = Array.from({ length: 1001 }, (_, i) => ({
      id: String(i),
      date: '2026-05-01',
      amount: '0.01',
      status: 'Received',
    }));
    expect(storageService.calculateTotalReceived(ref, records)).toBe(10.01);
  });

  it('toPence converts pounds to integer pence', () => {
    expect(storageService.toPence('89.99')).toBe(8999);
    expect(storageService.toPence('0.1')).toBe(10);
    expect(storageService.toPence('')).toBe(0);
  });

  it('roundCurrency collapses long decimals to 2dp', () => {
    expect(storageService.roundCurrency(89.99 / 3)).toBe(30);
    expect(storageService.roundCurrency(10 / 3)).toBe(3.33);
    expect(storageService.roundCurrency(2 / 3)).toBe(0.67);
  });
});
