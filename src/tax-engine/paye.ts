import { PayeInput, PayeResult } from './types';
import { getRulesForTaxYear } from './rules/registry';
import { validatePayeProfile } from './paye-validation';
import { calculateIncomeTax } from './income-tax';
import { calculateIncomeTaxForTaxCode } from './tax-code';
import { calculateClass1NIC } from './class1-nic';

export function calculatePaye(input: PayeInput): PayeResult {
  // 1. Validation
  validatePayeProfile({ taxRegion: input.taxRegion });

  // 2. Fetch Rules
  const rules = getRulesForTaxYear(input.taxYear);

  // 3. Pension contribution — assumed salary sacrifice, so it reduces the
  // amount assessed for both Income Tax and National Insurance below.
  const pensionContributionPercent = Math.min(10, Math.max(0, input.pensionContributionPercent ?? 0));
  const pensionContribution = Math.round((input.grossSalary * pensionContributionPercent) / 100);
  const pensionableSalary = input.grossSalary - pensionContribution;

  const taxCode = input.taxCode?.trim() ? input.taxCode.trim().toUpperCase() : undefined;

  // 4. Income Tax — the band/taper logic is income-source-agnostic, so the
  // same calculator used for sole-trader trading profit applies directly to
  // gross salary. An explicit tax code bypasses the standard PA + taper.
  const incomeTaxResult = taxCode
    ? calculateIncomeTaxForTaxCode(pensionableSalary, rules, taxCode)
    : calculateIncomeTax(pensionableSalary, rules);

  // 5. Employee Class 1 National Insurance
  const class1NICs = calculateClass1NIC(pensionableSalary, rules);

  // 6. Totals
  const totalDeductions = incomeTaxResult.totalIncomeTax + class1NICs + pensionContribution;
  const netIncome = Math.max(0, input.grossSalary - totalDeductions);
  const monthlyNetIncome = Math.round(netIncome / 12);
  const effectiveRate = input.grossSalary > 0 ? (totalDeductions / input.grossSalary) * 100 : 0;

  // 7. Warnings
  const warnings: string[] = [
    "This estimate does not account for student loan repayments or benefits-in-kind. Your actual take-home pay may differ.",
  ];
  if (!taxCode && pensionableSalary > rules.personalAllowanceTaperThreshold) {
    warnings.push("Your salary is above £100,000, so your Personal Allowance has been reduced.");
  }
  if (taxCode) {
    warnings.push(`Tax calculated using tax code ${taxCode} instead of the standard Personal Allowance rules.`);
  }
  if (pensionContributionPercent > 0) {
    warnings.push(
      `Assumes a salary sacrifice pension contribution of ${pensionContributionPercent}% of gross salary, reducing pay subject to Income Tax and National Insurance.`
    );
  }

  return {
    taxYear: rules.taxYear,
    grossSalary: input.grossSalary,
    taxCode,
    pensionContributionPercent,
    pensionContribution,

    personalAllowanceUsed: incomeTaxResult.personalAllowanceUsed,
    taxableIncome: incomeTaxResult.taxableIncome,

    incomeTaxByBand: incomeTaxResult.incomeTaxByBand,
    totalIncomeTax: incomeTaxResult.totalIncomeTax,

    class1NICs,

    netIncome,
    monthlyNetIncome,

    effectiveRate,

    calculationDate: new Date().toISOString(),
    ruleVersion: rules.ruleVersion,
    warnings,
  };
}
