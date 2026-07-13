// UK Self Assessment key deadlines. General guidance only — dates can vary by
// circumstance (e.g. HMRC-issued notice to file), so this is not tax advice.

export type DeadlineKind = 'registration' | 'filing' | 'payment' | 'payment-on-account';

export interface Deadline {
  id: string;
  kind: DeadlineKind;
  title: string;
  date: string; // YYYY-MM-DD (local)
  taxYearLabel: string; // e.g. "2025/26"
  description: string;
}

const iso = (year: number, month1: number, day: number): string =>
  `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// All Self Assessment deadlines for the tax year that ENDS on 5 April `endYear`.
export function deadlinesForTaxYearEnding(endYear: number): Deadline[] {
  const label = `${endYear - 1}/${String(endYear % 100).padStart(2, '0')}`;
  return [
    {
      id: `registration-${endYear}`,
      kind: 'registration',
      title: 'Register for Self Assessment',
      date: iso(endYear, 10, 5), // 5 October after the tax year ends
      taxYearLabel: label,
      description: `If ${label} is your first year needing a tax return, register with HMRC by 5 October ${endYear}.`,
    },
    {
      id: `filing-${endYear}`,
      kind: 'filing',
      title: 'File online tax return',
      date: iso(endYear + 1, 1, 31), // 31 January after the tax year ends
      taxYearLabel: label,
      description: `Submit your ${label} Self Assessment return online by 31 January ${endYear + 1}.`,
    },
    {
      id: `payment-${endYear}`,
      kind: 'payment',
      title: 'Pay tax owed',
      date: iso(endYear + 1, 1, 31),
      taxYearLabel: label,
      description: `Pay any ${label} tax owed (balancing payment and first payment on account) by 31 January ${endYear + 1}.`,
    },
    {
      id: `poa-${endYear}`,
      kind: 'payment-on-account',
      title: 'Second payment on account',
      date: iso(endYear + 1, 7, 31), // 31 July
      taxYearLabel: label,
      description: `If you make payments on account, the second instalment for ${label} is due by 31 July ${endYear + 1}.`,
    },
  ];
}

// Every deadline on or after `today`, sorted soonest-first.
export function getUpcomingDeadlines(today: Date = new Date()): Deadline[] {
  const y = today.getFullYear();
  const all: Deadline[] = [];
  for (let endYear = y - 1; endYear <= y + 2; endYear++) {
    all.push(...deadlinesForTaxYearEnding(endYear));
  }
  const cutoff = startOfDay(today).getTime();
  return all
    .filter((d) => new Date(d.date + 'T00:00:00').getTime() >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getNextDeadline(today: Date = new Date()): Deadline | null {
  return getUpcomingDeadlines(today)[0] ?? null;
}

// Whole days from `today` until the deadline (0 = due today).
export function daysUntil(deadline: Deadline, today: Date = new Date()): number {
  const target = new Date(deadline.date + 'T00:00:00').getTime();
  const from = startOfDay(today).getTime();
  return Math.round((target - from) / 86_400_000);
}
