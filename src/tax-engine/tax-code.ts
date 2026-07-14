import { TaxRules } from './types';
import { calculateIncomeTax, IncomeTaxResult } from './income-tax';

const L_CODE = /^(\d{1,4})L$/;
const K_CODE = /^K(\d{1,4})$/;

function getBandRate(rules: TaxRules, name: string): number {
  const band = rules.incomeTaxBands.find((b) => b.name === name);
  if (!band) {
    throw new Error(`Could not resolve rate for tax code band: ${name}`);
  }
  return band.rate;
}

function flatRateResult(grossSalary: number, rules: TaxRules, bandName: string): IncomeTaxResult {
  const rate = getBandRate(rules, bandName);
  const ratePercent = Math.round(rate * 100);
  const taxDue = Math.floor((grossSalary * ratePercent) / 100);
  return {
    personalAllowanceUsed: 0,
    taxableIncome: grossSalary,
    incomeTaxByBand: rules.incomeTaxBands.map((b) => ({
      name: b.name,
      rate: b.rate,
      taxableAmountInBand: b.name === bandName ? grossSalary : 0,
      taxDue: b.name === bandName ? taxDue : 0,
    })),
    totalIncomeTax: taxDue,
  };
}

function noTaxResult(grossSalary: number, rules: TaxRules): IncomeTaxResult {
  return {
    personalAllowanceUsed: grossSalary,
    taxableIncome: 0,
    incomeTaxByBand: rules.incomeTaxBands.map((b) => ({
      name: b.name,
      rate: b.rate,
      taxableAmountInBand: 0,
      taxDue: 0,
    })),
    totalIncomeTax: 0,
  };
}

/**
 * Applies an explicit UK tax code (e.g. "1257L", "BR", "D0", "D1", "0T",
 * "K475", "NT") instead of the standard Personal Allowance + taper rules.
 * L/K codes still use the normal progressive bands with a fixed allowance;
 * BR/D0/D1 tax the whole amount at a single flat rate (as HMRC does for a
 * second job / no-allowance code); NT applies no tax at all.
 */
export function calculateIncomeTaxForTaxCode(
  grossSalary: number,
  rules: TaxRules,
  taxCode: string
): IncomeTaxResult {
  const code = taxCode.trim().toUpperCase();

  if (code === 'NT') return noTaxResult(grossSalary, rules);
  if (code === 'BR') return flatRateResult(grossSalary, rules, 'Basic rate');
  if (code === 'D0') return flatRateResult(grossSalary, rules, 'Higher rate');
  if (code === 'D1') return flatRateResult(grossSalary, rules, 'Additional rate');
  if (code === '0T') return calculateIncomeTax(grossSalary, rules, 0);

  const kMatch = K_CODE.exec(code);
  if (kMatch) {
    const allowance = -(Number(kMatch[1]) * 10 + 9) * 100;
    return calculateIncomeTax(grossSalary, rules, allowance);
  }

  const lMatch = L_CODE.exec(code);
  if (lMatch) {
    const allowance = (Number(lMatch[1]) * 10 + 9) * 100;
    return calculateIncomeTax(grossSalary, rules, allowance);
  }

  throw new Error(
    `UNRECOGNISED_TAX_CODE: "${taxCode}" is not a recognised tax code (try e.g. 1257L, BR, D0, D1, 0T, K475 or NT).`
  );
}
