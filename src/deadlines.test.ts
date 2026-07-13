import { describe, it, expect } from 'vitest';
import { deadlinesForTaxYearEnding, getUpcomingDeadlines, getNextDeadline, daysUntil } from './deadlines';

describe('Phase 7: Self Assessment deadlines', () => {
  it('produces the four key deadlines for a tax year ending 5 April', () => {
    const ds = deadlinesForTaxYearEnding(2026); // 2025/26 tax year
    const byKind = Object.fromEntries(ds.map((d) => [d.kind, d.date]));
    expect(ds).toHaveLength(4);
    expect(byKind.registration).toBe('2026-10-05');
    expect(byKind.filing).toBe('2027-01-31');
    expect(byKind.payment).toBe('2027-01-31');
    expect(byKind['payment-on-account']).toBe('2027-07-31');
    expect(ds.every((d) => d.taxYearLabel === '2025/26')).toBe(true);
  });

  it('getUpcomingDeadlines returns only future deadlines, soonest first', () => {
    const today = new Date(2026, 6, 13); // 13 July 2026
    const up = getUpcomingDeadlines(today);
    expect(up.length).toBeGreaterThan(0);
    // sorted ascending
    for (let i = 1; i < up.length; i++) {
      expect(up[i].date >= up[i - 1].date).toBe(true);
    }
    // none in the past
    expect(up.every((d) => d.date >= '2026-07-13')).toBe(true);
  });

  it('getNextDeadline on 13 July 2026 is the second payment on account (31 July)', () => {
    const next = getNextDeadline(new Date(2026, 6, 13));
    expect(next?.date).toBe('2026-07-31');
    expect(next?.kind).toBe('payment-on-account');
  });

  it('after 31 July the next deadline is the 5 October registration', () => {
    const next = getNextDeadline(new Date(2026, 7, 1)); // 1 Aug 2026
    expect(next?.date).toBe('2026-10-05');
    expect(next?.kind).toBe('registration');
  });

  it('a deadline on today counts as upcoming (due today)', () => {
    const today = new Date(2026, 9, 5); // 5 Oct 2026 = a registration deadline
    const next = getNextDeadline(today);
    expect(next?.date).toBe('2026-10-05');
    expect(daysUntil(next!, today)).toBe(0);
  });

  it('daysUntil computes whole days', () => {
    const today = new Date(2026, 6, 13);
    const next = getNextDeadline(today)!;
    expect(daysUntil(next, today)).toBe(18); // 13 -> 31 July
  });
});
