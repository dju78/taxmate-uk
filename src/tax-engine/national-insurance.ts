import { TaxRules } from './types';
import { roundPence } from './money';

export function calculateClass4NICs(
  taxableTradingProfit: number,
  rules: TaxRules
): number {
  if (taxableTradingProfit <= rules.class4NICs.lowerProfitsLimit) {
    return 0;
  }

  let totalNICs = 0;
  
  // NICs are charged on profit between Lower Profits Limit and Upper Profits Limit
  const mainRateProfit = Math.min(
    taxableTradingProfit - rules.class4NICs.lowerProfitsLimit,
    rules.class4NICs.upperProfitsLimit - rules.class4NICs.lowerProfitsLimit
  );

  if (mainRateProfit > 0) {
    totalNICs += roundPence(mainRateProfit * rules.class4NICs.mainRate);
  }

  // NICs are charged on profit above Upper Profits Limit
  if (taxableTradingProfit > rules.class4NICs.upperProfitsLimit) {
    const upperRateProfit = taxableTradingProfit - rules.class4NICs.upperProfitsLimit;
    totalNICs += roundPence(upperRateProfit * rules.class4NICs.upperRate);
  }

  return totalNICs;
}
