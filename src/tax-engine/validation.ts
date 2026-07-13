import { UserProfile } from './types';

export function validateProfile(profile: UserProfile): void {
  if (profile.taxRegion === "scotland") {
    throw new Error("UNSUPPORTED_REGION: Scottish tax rules are not supported in this version.");
  }

  const unsupportedIncomeTypes = [
    { flag: profile.hasEmploymentIncome, name: "Employment income" },
    { flag: profile.hasPensionIncome, name: "Pension income" },
    { flag: profile.hasPropertyIncome, name: "Property income" },
    { flag: profile.hasDividends, name: "Dividends" },
    { flag: profile.hasSavingsInterest, name: "Savings interest" },
    { flag: profile.hasCapitalGains, name: "Capital gains" },
    { flag: profile.hasOtherTaxableIncome, name: "Other taxable income" },
  ];

  const blocked = unsupportedIncomeTypes.filter(t => t.flag).map(t => t.name);

  if (blocked.length > 0) {
    throw new Error(`UNSUPPORTED_INCOME: The estimate engine does not currently support: ${blocked.join(", ")}.`);
  }

  if (!profile.singleBusiness) {
    throw new Error("UNSUPPORTED_MULTIPLE_BUSINESSES: TaxMate currently only supports sole traders with a single business.");
  }
}
