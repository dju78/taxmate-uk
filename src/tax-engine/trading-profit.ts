import { TaxRules, EstimateInput } from './types';

export interface TradingProfitResult {
  allowableExpenses: number; // in pence
  expensesNeedingReviewCount: number;
  expensesNeedingReviewTotal: number; // in pence
  deductionMethodUsed: "actual" | "trading-allowance";
  deductionAmount: number; // in pence
  taxableTradingProfit: number; // in pence
}

export function calculateTradingProfit(
  receivedTradingIncome: number,
  expenses: EstimateInput['expenses'],
  rules: TaxRules
): TradingProfitResult {
  let allowableExpenses = 0;
  let expensesNeedingReviewCount = 0;
  let expensesNeedingReviewTotal = 0;

  for (const expense of expenses) {
    if (expense.treatment === "allowable") {
      allowableExpenses += expense.amount;
    } else if (expense.treatment === "needs-review") {
      expensesNeedingReviewCount++;
      expensesNeedingReviewTotal += expense.amount;
    }
  }

  // The trading allowance can only be used up to the amount of income if income is less than the allowance.
  // Wait, no. The trading allowance is up to £1000. If your income is less than £1000, your profit is £0.
  // Actually, standard rule: deduction is the greater of actual allowable expenses or the trading allowance.
  // If trading allowance is used, the deduction cannot exceed the total income (profit cannot be negative from trading allowance).
  // Wait, HMRC rules: "If your income is £1,000 or less, you do not have to tell HMRC or pay tax."
  // "If your income is more than £1,000, you can deduct the £1,000 allowance instead of your actual expenses."
  // Even if income is < £1,000, you can use the allowance to reduce profit to 0. It cannot create a loss.
  // So deduction from allowance = min(receivedTradingIncome, tradingAllowance).
  // Wait, actual expenses CAN create a loss.
  // So if allowableExpenses > receivedTradingIncome, profit is negative (loss).
  
  // Let's implement the beneficial choice:
  let deductionMethodUsed: "actual" | "trading-allowance" = "actual";
  let deductionAmount = allowableExpenses;

  // You can only claim trading allowance to create a loss? No, trading allowance cannot create a loss.
  const maxTradingAllowanceDeduction = Math.min(receivedTradingIncome, rules.tradingAllowance);

  // If claiming the trading allowance is more beneficial (gives a lower profit):
  // Profit with actual = receivedTradingIncome - allowableExpenses
  // Profit with allowance = receivedTradingIncome - maxTradingAllowanceDeduction
  // The user wants the lower profit.
  // So we choose the max deduction!
  if (maxTradingAllowanceDeduction > allowableExpenses) {
    deductionMethodUsed = "trading-allowance";
    deductionAmount = maxTradingAllowanceDeduction;
  }

  const taxableTradingProfit = receivedTradingIncome - deductionAmount;

  return {
    allowableExpenses,
    expensesNeedingReviewCount,
    expensesNeedingReviewTotal,
    deductionMethodUsed,
    deductionAmount,
    taxableTradingProfit
  };
}
