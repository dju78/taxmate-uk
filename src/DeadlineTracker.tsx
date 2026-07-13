import { getUpcomingDeadlines, daysUntil, type Deadline } from './deadlines';

const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const relative = (n: number) => {
  if (n === 0) return 'due today';
  if (n === 1) return 'due tomorrow';
  return `in ${n} days`;
};

function DeadlineRow({ deadline, next }: { deadline: Deadline; next: boolean }) {
  const n = daysUntil(deadline);
  const soon = n <= 30;
  return (
    <li className="flex items-start justify-between gap-3 border-t border-neutral-200 py-2 first:border-t-0">
      <div>
        <p className="text-sm font-semibold text-neutral-900">
          {deadline.title}
          {next && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
              Next
            </span>
          )}
        </p>
        <p className="text-xs text-neutral-500">{deadline.taxYearLabel} · {deadline.description}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-neutral-900">{formatDate(deadline.date)}</p>
        <p className={'text-xs font-medium ' + (soon ? 'text-amber-700' : 'text-neutral-500')}>{relative(n)}</p>
      </div>
    </li>
  );
}

export function DeadlineTracker({ today = new Date() }: { today?: Date }) {
  const upcoming = getUpcomingDeadlines(today).slice(0, 4);
  const nextId = upcoming[0]?.id;

  return (
    <section
      aria-label="Next key deadlines"
      className="rounded-2xl border border-neutral-200 bg-white p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-lg font-bold text-neutral-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Next key deadline
        </h3>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-neutral-600">No upcoming Self Assessment deadlines found.</p>
      ) : (
        <ul>
          {upcoming.map((d) => (
            <DeadlineRow key={d.id} deadline={d} next={d.id === nextId} />
          ))}
        </ul>
      )}

      <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
        General guidance for UK Self Assessment only — not personal tax advice. Your dates may differ
        (for example if HMRC issued a notice to file late). Always check GOV.UK.
      </p>
    </section>
  );
}
