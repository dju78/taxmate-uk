import type {
  IncomeFilterState,
  ExpenseFilterState,
  IncomeStatusFilter,
} from './filters';
import { isIncomeFilterActive, isExpenseFilterActive } from './filters';

const selectCls =
  'rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1';
const labelCls = 'flex flex-col gap-1 text-xs font-semibold text-neutral-500';
const resetCls =
  'rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-700 outline-none hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1';

const STATUS_TABS: { value: IncomeStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'received', label: 'Received' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

interface IncomeFiltersProps {
  filters: IncomeFilterState;
  onChange: (patch: Partial<IncomeFilterState>) => void;
  onReset: () => void;
  sources: string[];
  categories: string[];
}

export function IncomeFilters({ filters, onChange, onReset, sources, categories }: IncomeFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1">
        {STATUS_TABS.map((t) => {
          const active = filters.status === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange({ status: t.value })}
              className={
                'rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 ' +
                (active ? 'bg-green-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className={labelCls}>
          Source
          <select
            className={selectCls}
            value={filters.source}
            onChange={(e) => onChange({ source: e.target.value })}
          >
            <option value="all">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          Category
          <select
            className={selectCls}
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          From
          <input
            type="date"
            className={selectCls}
            value={filters.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
          />
        </label>
        <label className={labelCls}>
          To
          <input
            type="date"
            className={selectCls}
            value={filters.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
          />
        </label>
        {isIncomeFilterActive(filters) && (
          <button type="button" className={resetCls} onClick={onReset}>
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}

interface ExpenseFiltersProps {
  filters: ExpenseFilterState;
  onChange: (patch: Partial<ExpenseFilterState>) => void;
  onReset: () => void;
  categories: string[];
}

export function ExpenseFilters({ filters, onChange, onReset, categories }: ExpenseFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <label className={labelCls}>
        Category
        <select
          className={selectCls}
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className={labelCls}>
        From
        <input
          type="date"
          className={selectCls}
          value={filters.dateFrom}
          onChange={(e) => onChange({ dateFrom: e.target.value })}
        />
      </label>
      <label className={labelCls}>
        To
        <input
          type="date"
          className={selectCls}
          value={filters.dateTo}
          onChange={(e) => onChange({ dateTo: e.target.value })}
        />
      </label>
      {isExpenseFilterActive(filters) && (
        <button type="button" className={resetCls} onClick={onReset}>
          Reset filters
        </button>
      )}
    </div>
  );
}
