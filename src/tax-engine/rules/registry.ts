import { TaxRules } from '../types';
import { rules2024_25 } from './2024-25';
import { rules2025_26 } from './2025-26';
import { rules2026_27 } from './2026-27';

export const ruleRegistry: Record<string, TaxRules> = {
  "2024-25": rules2024_25,
  "2025-26": rules2025_26,
  "2026-27": rules2026_27,
};

export function getRulesForTaxYear(taxYear: string): TaxRules {
  const rules = ruleRegistry[taxYear];
  if (!rules) {
    throw new Error(`Unsupported tax year for estimation: ${taxYear}`);
  }
  return rules;
}
