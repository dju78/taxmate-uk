import { useRef, useState, type ReactNode } from 'react';
import { storageService, type ImportValidationResult } from './storage';
import { useTaxStore, taxYearStartToLabel } from './store';
import { useDialog } from './hooks';

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useDialog(open, onClose) as unknown as React.RefObject<HTMLDivElement>;
  if (!open) return null;
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-dialog-title"
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="data-dialog-title" className="mb-3 text-lg font-bold text-neutral-900">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

const btnBase =
  'rounded-lg px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1';
const btnSecondary = `${btnBase} border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100`;
const btnPrimary = `${btnBase} bg-green-600 text-white hover:bg-green-700`;
const btnDanger = `${btnBase} bg-red-600 text-white hover:bg-red-700`;
const btnGhost = `${btnBase} bg-transparent text-neutral-700 hover:bg-neutral-100`;

export function DataAndBackup() {
  const income = useTaxStore((s) => s.income);
  const expenses = useTaxStore((s) => s.expenses);
  const selectedTaxYear = useTaxStore((s) => s.selectedTaxYear);
  const importData = useTaxStore((s) => s.importData);
  const loadDemo = useTaxStore((s) => s.loadDemo);
  const removeDemo = useTaxStore((s) => s.removeDemo);
  const clearAll = useTaxStore((s) => s.clearAll);

  const [preview, setPreview] = useState<ImportValidationResult | null>(null);
  const [showClear, setShowClear] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasDemo = income.some((r) => r.isDemo) || expenses.some((r) => r.isDemo);
  const flash = (m: string) => {
    setMessage(m);
    window.setTimeout(() => setMessage(null), 4000);
  };

  const stamp = () => new Date().toISOString().slice(0, 10);
  const handleExportJSON = () => {
    const bundle = storageService.getExportBundle({ selectedTaxYear });
    downloadFile(`taxmate-backup-${stamp()}.json`, JSON.stringify(bundle, null, 2), 'application/json');
  };
  const handleExportCSV = () => {
    const taxRef = storageService.getTaxYearStartForYear(selectedTaxYear);
    const yearTag = taxYearStartToLabel(selectedTaxYear).replace('/', '-');
    const inc = storageService.recordsToCSV(storageService.getIncomeInTaxYear(income, taxRef));
    const exp = storageService.recordsToCSV(storageService.getExpensesInTaxYear(expenses, taxRef));
    downloadFile(`taxmate-income-${yearTag}-${stamp()}.csv`, inc || 'No income records', 'text/csv');
    downloadFile(`taxmate-expenses-${yearTag}-${stamp()}.csv`, exp || 'No expense records', 'text/csv');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setPreview(storageService.parseImportText(text));
    // allow re-selecting the same file later
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!preview || !preview.ok) return;
    const result = importData(preview.income, preview.expenses);
    setPreview(null);
    flash(`Imported ${result.income} income and ${result.expenses} expense record(s). Existing data was kept.`);
  };

  const confirmClear = () => {
    clearAll();
    setShowClear(false);
    flash('All records were cleared from this browser.');
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-2 text-lg font-bold text-neutral-900">Data &amp; backup</h2>
      <p className="mb-4 text-sm text-neutral-600">
        Your records are stored only in this browser (localStorage). They are not sent to any server
        and may be lost if you clear your browser data or switch device. Export a backup regularly.
      </p>

      {message && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Export</h3>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btnSecondary} onClick={handleExportJSON}>
              Export JSON backup
            </button>
            <button type="button" className={btnSecondary} onClick={handleExportCSV}>
              Export CSV (selected tax year)
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Import</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button type="button" className={btnSecondary} onClick={() => fileInputRef.current?.click()}>
            Import JSON backup…
          </button>
          <p className="mt-2 text-xs text-neutral-500">
            You will see a preview and confirm before anything is imported. Existing records are kept.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Demo data</h3>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btnSecondary} onClick={() => flash(demoMsg(loadDemo()))} disabled={hasDemo}>
              Load demo data
            </button>
            {hasDemo && (
              <button type="button" className={btnSecondary} onClick={() => flash(removeMsg(removeDemo()))}>
                Remove demo data
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Demo records are labelled “Demo” and can be removed without affecting your own records.
          </p>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Danger zone</h3>
          <button type="button" className={btnDanger} onClick={() => setShowClear(true)}>
            Clear all data…
          </button>
        </div>
      </div>

      {/* Import preview / confirm */}
      <Dialog open={preview !== null} onClose={() => setPreview(null)} title="Import backup">
        {preview && preview.ok ? (
          <>
            <p className="text-sm text-neutral-700">
              This backup contains <strong>{preview.income.length}</strong> income and{' '}
              <strong>{preview.expenses.length}</strong> expense record(s).
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              These will be added to your existing data. Records whose id already exists are skipped,
              so nothing you already have is overwritten.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-700">
              This file cannot be imported. Your existing data has not been changed.
            </p>
            <ul className="mt-3 max-h-56 list-disc overflow-y-auto rounded-lg bg-neutral-50 p-3 pl-8 text-sm text-red-700">
              {preview?.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={btnGhost} onClick={() => setPreview(null)}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={confirmImport} disabled={!preview?.ok}>
            Import
          </button>
        </div>
      </Dialog>

      {/* Clear-all confirm */}
      <Dialog open={showClear} onClose={() => setShowClear(false)} title="Clear all data">
        <p className="text-sm text-neutral-700">
          This permanently deletes all <strong>{income.length}</strong> income and{' '}
          <strong>{expenses.length}</strong> expense record(s) stored in this browser. This cannot be
          undone. Export a backup first if you might need them.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={btnGhost} onClick={() => setShowClear(false)}>
            Cancel
          </button>
          <button type="button" className={btnDanger} onClick={confirmClear}>
            Clear all data
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function demoMsg(r: { income: number; expenses: number }): string {
  if (r.income === 0 && r.expenses === 0) return 'Demo data is already loaded.';
  return `Loaded ${r.income} demo income and ${r.expenses} demo expense record(s).`;
}
function removeMsg(r: { income: number; expenses: number }): string {
  return `Removed ${r.income} demo income and ${r.expenses} demo expense record(s). Your records were kept.`;
}
