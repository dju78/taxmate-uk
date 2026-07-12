// Storage service - abstraction layer for income and expense data persistence
// Currently uses localStorage; can be replaced with backend API

const INCOME_STORAGE_KEY = 'taxmate_income_records';
const EXPENSE_STORAGE_KEY = 'taxmate_expense_records';

// UK tax year runs 6 April -> 5 April (inclusive).
const TAX_YEAR_START_MONTH = 3; // April (0-indexed)
const TAX_YEAR_START_DAY = 6;

export const storageService = {
  // ---------------------------------------------------------------------------
  // Date helpers
  // ---------------------------------------------------------------------------

  // Parse a YYYY-MM-DD string as a LOCAL date (midnight local time).
  // Using `new Date('YYYY-MM-DD')` parses as UTC, which can shift the day
  // backwards for users west of UTC. This keeps the stored calendar date exact.
  parseLocalDate: (value) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        return new Date(year, month - 1, day);
      }
    }
    return new Date(value);
  },

  // Start of the UK tax year (6 April, local midnight) containing referenceDate.
  getTaxYearStart: (referenceDate = new Date()) => {
    const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const isOnOrAfterStart =
      ref.getMonth() > TAX_YEAR_START_MONTH ||
      (ref.getMonth() === TAX_YEAR_START_MONTH && ref.getDate() >= TAX_YEAR_START_DAY);
    const startYear = isOnOrAfterStart ? ref.getFullYear() : ref.getFullYear() - 1;
    return new Date(startYear, TAX_YEAR_START_MONTH, TAX_YEAR_START_DAY);
  },

  // Start of the NEXT tax year (6 April, local midnight). Used as an EXCLUSIVE
  // upper bound so transactions dated 5 April are always included.
  getNextTaxYearStart: (referenceDate = new Date()) => {
    const start = storageService.getTaxYearStart(referenceDate);
    return new Date(start.getFullYear() + 1, TAX_YEAR_START_MONTH, TAX_YEAR_START_DAY);
  },

  // Last day of the tax year (5 April, local midnight). Used for display/labels.
  getTaxYearEnd: (referenceDate = new Date()) => {
    const start = storageService.getTaxYearStart(referenceDate);
    return new Date(start.getFullYear() + 1, TAX_YEAR_START_MONTH, TAX_YEAR_START_DAY - 1);
  },

  // Whether a stored date falls in the active tax year (exclusive upper bound).
  isInActiveTaxYear: (dateValue, referenceDate = new Date()) => {
    const date = storageService.parseLocalDate(dateValue);
    const start = storageService.getTaxYearStart(referenceDate);
    const nextStart = storageService.getNextTaxYearStart(referenceDate);
    return date >= start && date < nextStart;
  },

  // Number of COMPLETED tax months since the tax year start.
  // A tax month runs from the 6th to the 5th. On 12 Jul (tax year from 6 Apr),
  // three tax months are complete (6 Apr-5 May, 6 May-5 Jun, 6 Jun-5 Jul).
  getCompletedTaxMonths: (referenceDate = new Date()) => {
    const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const start = storageService.getTaxYearStart(referenceDate);
    let months = (ref.getFullYear() - start.getFullYear()) * 12 + (ref.getMonth() - start.getMonth());
    if (ref.getDate() < start.getDate()) {
      months -= 1;
    }
    return Math.max(0, months);
  },

  // Round a monetary value to 2 decimal places (avoids float drift).
  roundCurrency: (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100,

  // ---------------------------------------------------------------------------
  // Income records
  // ---------------------------------------------------------------------------

  getIncomeRecords: () => {
    try {
      const data = localStorage.getItem(INCOME_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading income records:', error);
      return [];
    }
  },

  addIncomeRecord: (record) => {
    try {
      const records = storageService.getIncomeRecords();
      const newRecord = {
        id: Date.now().toString(),
        ...record,
        createdAt: new Date().toISOString(),
      };
      records.push(newRecord);
      localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(records));
      return newRecord;
    } catch (error) {
      console.error('Error adding income record:', error);
      throw new Error('Failed to save income record', { cause: error });
    }
  },

  updateIncomeRecord: (id, updates) => {
    try {
      const records = storageService.getIncomeRecords();
      const index = records.findIndex(r => r.id === id);
      if (index === -1) {
        throw new Error('Record not found');
      }
      records[index] = {
        ...records[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(records));
      return records[index];
    } catch (error) {
      console.error('Error updating income record:', error);
      throw new Error('Failed to update income record', { cause: error });
    }
  },

  deleteIncomeRecord: (id) => {
    try {
      const records = storageService.getIncomeRecords();
      const filtered = records.filter(r => r.id !== id);
      localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting income record:', error);
      throw new Error('Failed to delete income record', { cause: error });
    }
  },

  getIncomeRecord: (id) => {
    const records = storageService.getIncomeRecords();
    return records.find(r => r.id === id);
  },

  // Income records within the active tax year.
  getIncomeInTaxYear: (records, referenceDate = new Date()) => {
    const source = records || storageService.getIncomeRecords();
    return source.filter(r => storageService.isInActiveTaxYear(r.date, referenceDate));
  },

  // Sum income in the active tax year, optionally restricted to a status.
  sumIncome: (status, referenceDate = new Date(), records) => {
    const inYear = storageService.getIncomeInTaxYear(records, referenceDate);
    const total = inYear
      .filter(r => (status ? r.status === status : true))
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    return storageService.roundCurrency(total);
  },

  // Total invoiced = every income entry in the tax year (all statuses).
  calculateTotalInvoiced: (referenceDate = new Date(), records) =>
    storageService.sumIncome(null, referenceDate, records),

  // Total received = money actually collected (status "Received").
  calculateTotalReceived: (referenceDate = new Date(), records) =>
    storageService.sumIncome('Received', referenceDate, records),

  // Outstanding = invoiced but not yet due for chase (status "Pending").
  calculateOutstanding: (referenceDate = new Date(), records) =>
    storageService.sumIncome('Pending', referenceDate, records),

  // Overdue = past due and unpaid (status "Overdue").
  calculateOverdue: (referenceDate = new Date(), records) =>
    storageService.sumIncome('Overdue', referenceDate, records),

  // Backwards-compatible alias: "Total income YTD" reflects money received.
  calculateTotalIncomeYTD: (referenceDate = new Date(), records) =>
    storageService.calculateTotalReceived(referenceDate, records),

  // Received income in the current calendar month.
  calculateIncomeThisMonth: (referenceDate = new Date(), records) => {
    const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const source = records || storageService.getIncomeRecords();
    const total = source
      .filter(r => {
        const date = storageService.parseLocalDate(r.date);
        return (
          date.getFullYear() === ref.getFullYear() &&
          date.getMonth() === ref.getMonth() &&
          r.status === 'Received'
        );
      })
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    return storageService.roundCurrency(total);
  },

  // Average received income per COMPLETED tax month in the active tax year.
  calculateAverageMonthlyIncome: (referenceDate = new Date(), records) => {
    const received = storageService.calculateTotalReceived(referenceDate, records);
    const months = Math.max(1, storageService.getCompletedTaxMonths(referenceDate));
    return storageService.roundCurrency(received / months);
  },

  getIncomeByMonth: (records) => {
    const source = records || storageService.getIncomeRecords();
    const grouped = {};
    source
      .filter(r => r.status === 'Received')
      .forEach(r => {
        const date = storageService.parseLocalDate(r.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        grouped[monthKey] = storageService.roundCurrency((grouped[monthKey] || 0) + parseFloat(r.amount || 0));
      });
    return grouped;
  },

  getIncomeBySource: (records) => {
    const source = records || storageService.getIncomeRecords();
    const grouped = {};
    source
      .filter(r => r.status === 'Received')
      .forEach(r => {
        const key = r.source || 'Other';
        grouped[key] = storageService.roundCurrency((grouped[key] || 0) + parseFloat(r.amount || 0));
      });
    return grouped;
  },

  // ---------------------------------------------------------------------------
  // Expense records
  // ---------------------------------------------------------------------------

  getExpenseRecords: () => {
    try {
      const data = localStorage.getItem(EXPENSE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading expense records:', error);
      return [];
    }
  },

  addExpenseRecord: (record) => {
    try {
      const records = storageService.getExpenseRecords();
      const newRecord = {
        id: Date.now().toString(),
        ...record,
        createdAt: new Date().toISOString(),
      };
      records.push(newRecord);
      localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(records));
      return newRecord;
    } catch (error) {
      console.error('Error adding expense record:', error);
      throw new Error('Failed to save expense record', { cause: error });
    }
  },

  updateExpenseRecord: (id, updates) => {
    try {
      const records = storageService.getExpenseRecords();
      const index = records.findIndex(r => r.id === id);
      if (index === -1) {
        throw new Error('Record not found');
      }
      records[index] = {
        ...records[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(records));
      return records[index];
    } catch (error) {
      console.error('Error updating expense record:', error);
      throw new Error('Failed to update expense record', { cause: error });
    }
  },

  deleteExpenseRecord: (id) => {
    try {
      const records = storageService.getExpenseRecords();
      const filtered = records.filter(r => r.id !== id);
      localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting expense record:', error);
      throw new Error('Failed to delete expense record', { cause: error });
    }
  },

  getExpenseRecord: (id) => {
    const records = storageService.getExpenseRecords();
    return records.find(r => r.id === id);
  },

  getExpensesInTaxYear: (records, referenceDate = new Date()) => {
    const source = records || storageService.getExpenseRecords();
    return source.filter(r => storageService.isInActiveTaxYear(r.date, referenceDate));
  },

  calculateTotalExpensesYTD: (referenceDate = new Date(), records) => {
    const total = storageService
      .getExpensesInTaxYear(records, referenceDate)
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    return storageService.roundCurrency(total);
  },

  calculateExpensesThisMonth: (referenceDate = new Date(), records) => {
    const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const source = records || storageService.getExpenseRecords();
    const total = source
      .filter(r => {
        const date = storageService.parseLocalDate(r.date);
        return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();
      })
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    return storageService.roundCurrency(total);
  },

  // Average expenses per COMPLETED tax month in the active tax year.
  calculateAverageMonthlyExpenses: (referenceDate = new Date(), records) => {
    const total = storageService.calculateTotalExpensesYTD(referenceDate, records);
    const months = Math.max(1, storageService.getCompletedTaxMonths(referenceDate));
    return storageService.roundCurrency(total / months);
  },

  getExpensesByMonth: (records) => {
    const source = records || storageService.getExpenseRecords();
    const grouped = {};
    source.forEach(r => {
      const date = storageService.parseLocalDate(r.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped[monthKey] = storageService.roundCurrency((grouped[monthKey] || 0) + parseFloat(r.amount || 0));
    });
    return grouped;
  },

  getExpensesByCategory: (records) => {
    const source = records || storageService.getExpenseRecords();
    const grouped = {};
    source.forEach(r => {
      const category = r.category || 'Other';
      grouped[category] = storageService.roundCurrency((grouped[category] || 0) + parseFloat(r.amount || 0));
    });
    return grouped;
  },
};
