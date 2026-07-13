import { useState } from 'react';
import { TOKENS } from './tokens';
import { Alert } from './components';
import { useBreakpoint } from './hooks';
import { useTaxStore, taxYearStartToLabel, getAvailableTaxYears } from './store';
import { calculatePaye } from './tax-engine/paye';
import type { PayeInput, PayeResult, TaxRegion } from './tax-engine/types';
import { toPence, formatPounds } from './tax-engine/money';

export function CalculatorsView() {
  const selectedTaxYear = useTaxStore((s) => s.selectedTaxYear);
  const { isMobile } = useBreakpoint();
  const pageHeadingSize = isMobile ? "26px" : "36px";

  const [taxYearStart, setTaxYearStart] = useState<number>(selectedTaxYear);
  const [taxRegion, setTaxRegion] = useState<TaxRegion>('england');
  const [grossSalary, setGrossSalary] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const updateAndInvalidate = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setIsConfirmed(false);
  };

  let payeResult: PayeResult | null = null;
  let payeError: string | null = null;
  if (isConfirmed) {
    try {
      const input: PayeInput = {
        taxYear: taxYearStartToLabel(taxYearStart).replace('/', '-'),
        taxRegion,
        grossSalary: toPence(parseFloat(grossSalary) || 0),
      };
      payeResult = calculatePaye(input);
    } catch (err) {
      payeError = err instanceof Error ? err.message : 'Calculation failed.';
    }
  }

  return (
    <div className="calculators-view">
      <div className="mb-8">
        <h1 style={{ fontSize: pageHeadingSize, fontWeight: "800", color: TOKENS.colors.neutral[900], fontFamily: "Manrope, sans-serif" }}>
          Calculators
        </h1>
        <p style={{ color: TOKENS.colors.neutral[600], marginTop: "8px" }}>
          Standalone tools — not tied to your recorded income or expenses.
        </p>
      </div>

      <h2 className="text-xl font-bold mb-4">Net income (take-home pay) calculator</h2>

      <div className="mb-6 max-w-2xl">
        <Alert
          variant="warning"
          title="Prototype estimate only"
          description="This calculation uses the information and assumptions you provide and may not include all income, reliefs, adjustments or individual circumstances. It is not tax advice, is not HMRC-approved and must not be used by itself to complete or file a tax return. Check current GOV.UK guidance or consult a qualified tax professional."
        />
      </div>

      {!isConfirmed || payeError ? (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm max-w-2xl">
          <h3 className="font-bold text-lg mb-4 text-neutral-900">Your details</h3>
          <p className="text-sm text-neutral-600 mb-6">
            For UK employees (PAYE). Enter your gross annual salary to estimate your take-home pay.
          </p>

          {payeError && (
            <div className="mb-6">
              <Alert variant="error" title="Estimate unavailable" description={payeError} />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="paye-tax-year" className="block text-sm font-medium text-neutral-700 mb-1">Tax Year</label>
              <select
                id="paye-tax-year"
                value={taxYearStart}
                onChange={(e) => updateAndInvalidate(setTaxYearStart)(Number(e.target.value))}
                className="w-full p-2 border border-neutral-300 rounded focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                {getAvailableTaxYears().map((year) => (
                  <option key={year} value={year}>{taxYearStartToLabel(year)}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="paye-tax-region" className="block text-sm font-medium text-neutral-700 mb-1">Tax Region</label>
              <select
                id="paye-tax-region"
                value={taxRegion}
                onChange={(e) => updateAndInvalidate(setTaxRegion)(e.target.value as TaxRegion)}
                className="w-full p-2 border border-neutral-300 rounded focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                <option value="england">England</option>
                <option value="wales">Wales</option>
                <option value="ni">Northern Ireland</option>
                <option value="scotland">Scotland</option>
              </select>
            </div>

            <div>
              <label htmlFor="paye-gross-salary" className="block text-sm font-medium text-neutral-700 mb-1">Gross Annual Salary (£)</label>
              <input
                id="paye-gross-salary"
                type="number"
                min="0"
                step="0.01"
                value={grossSalary}
                onChange={(e) => updateAndInvalidate(setGrossSalary)(e.target.value)}
                placeholder="e.g. 35000"
                className="w-full p-2 border border-neutral-300 rounded focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsConfirmed(true)}
              className="mt-6 px-4 py-2 bg-neutral-900 text-white rounded font-medium hover:bg-black transition-colors"
            >
              Calculate
            </button>
          </div>
        </div>
      ) : payeResult ? (
        <div className="space-y-6 max-w-2xl">
          {payeResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 space-y-2">
              {payeResult.warnings.map((w, i) => <p key={i}>• {w}</p>)}
            </div>
          )}

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
            <h3 className="font-bold text-neutral-800 mb-4">Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Gross Salary</span>
                <span>£{formatPounds(payeResult.grossSalary)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Personal Allowance</span>
                <span className="text-green-600">− £{formatPounds(payeResult.personalAllowanceUsed)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Taxable Income</span>
                <span>£{formatPounds(payeResult.taxableIncome)}</span>
              </div>
              <div className="pt-2 border-t border-neutral-100 space-y-1">
                {payeResult.incomeTaxByBand.filter((b) => b.taxDue > 0).map((b) => (
                  <div key={b.name} className="flex justify-between text-neutral-600">
                    <span>{b.name} ({(b.rate * 100).toFixed(0)}%)</span>
                    <span>£{formatPounds(b.taxDue)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Income Tax Due</span>
                <span>£{formatPounds(payeResult.totalIncomeTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-neutral-900">
                <span>Class 1 National Insurance</span>
                <span>£{formatPounds(payeResult.class1NICs)}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-green-900">Estimated Net Income (Take-Home Pay)</h3>
              <p className="text-sm text-green-800 mt-1">Based on rules for {payeResult.taxYear}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-green-900 font-['Manrope']">£{formatPounds(payeResult.netIncome)}</div>
              <div className="text-sm text-green-800 font-medium mt-1">
                £{formatPounds(payeResult.monthlyNetIncome)}/month · Effective rate: {payeResult.effectiveRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
