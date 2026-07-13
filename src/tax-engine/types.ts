export type TaxTreatment = "allowable" | "not-allowable" | "needs-review";

export type TaxRegion = "england" | "wales" | "ni" | "scotland";

export interface IncomeTaxBand {
  name: string;
  rate: number; // e.g. 0.20 for 20%
  min: number;  // in pence
  max: number | null; // in pence, null means unlimited
}

export interface Class4NICBand {
  rate: number; // e.g. 0.06 for 6%
  min: number;  // in pence
  max: number | null; // in pence
}

export interface TaxRules {
  taxYear: string;
  personalAllowance: number; // in pence
  personalAllowanceTaperThreshold: number; // in pence
  incomeTaxBands: IncomeTaxBand[];
  class4NICs: {
    lowerProfitsLimit: number; // in pence
    upperProfitsLimit: number; // in pence
    mainRate: number;
    upperRate: number;
  };
  tradingAllowance: number; // in pence
}

export interface UserProfile {
  taxRegion: TaxRegion;
  hasEmploymentIncome: boolean;
  hasPensionIncome: boolean;
  hasPropertyIncome: boolean;
  hasDividends: boolean;
  hasSavingsInterest: boolean;
  hasCapitalGains: boolean;
  hasOtherTaxableIncome: boolean;
}

export interface EstimateInput {
  taxYear: string;
  profile: UserProfile;
  receivedTradingIncome: number; // in pence
  expenses: {
    amount: number; // in pence
    treatment: TaxTreatment;
  }[];
}

export interface TaxBandResult {
  name: string;
  rate: number;
  taxableAmountInBand: number; // in pence
  taxDue: number; // in pence
}

export interface EstimateResult {
  taxYear: string;
  receivedTradingIncome: number; // in pence
  allowableExpenses: number; // in pence
  expensesNeedingReview: number; // count
  expensesNeedingReviewTotal: number; // in pence
  deductionMethodUsed: "actual" | "trading-allowance";
  deductionAmount: number; // in pence
  taxableTradingProfit: number; // in pence

  personalAllowanceUsed: number; // in pence
  taxableIncome: number; // in pence
  
  incomeTaxByBand: TaxBandResult[];
  totalIncomeTax: number; // in pence

  class4NICs: number; // in pence
  
  estimatedTotal: number; // in pence
  effectiveRate: number; // percentage (0-100)
  
  calculationDate: string;
  ruleVersion: string;
  warnings: string[];
}
