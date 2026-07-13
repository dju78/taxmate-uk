# Phase 10A Implementation Plan: Sole-Trader Tax Estimate Engine v1

## 1. Overview and Scope

The Phase 10A tax engine is a pure TypeScript calculator that estimates Income Tax and Class 4 National Insurance for a single sole-trader business using cash-basis accounting in England, Wales, or Northern Ireland.

This document describes the code as implemented and outlines the required enhancements before merge approval.

## 2. GOV.UK / HMRC Source Matrix

Every rule, threshold, allowance, and eligibility restriction is derived from official sources:

| Element | Value / Rule | Official Source |
|---|---|---|
| **Personal Allowance** | £12,570 for 2024-25, 2025-26, 2026-27 | [Income Tax rates and Personal Allowances](https://www.gov.uk/income-tax-rates) |
| **Personal Allowance Taper** | £1 reduction for every £2 of adjusted net income over £100,000 | [Income Tax rates and Personal Allowances](https://www.gov.uk/income-tax-rates) |
| **Basic Rate Band** | 20% on £12,571 to £50,270 | [Income Tax rates and Personal Allowances](https://www.gov.uk/income-tax-rates) |
| **Higher Rate Band** | 40% on £50,271 to £125,140 | [Income Tax rates and Personal Allowances](https://www.gov.uk/income-tax-rates) |
| **Additional Rate Band**| 45% over £125,140 | [Income Tax rates and Personal Allowances](https://www.gov.uk/income-tax-rates) |
| **Trading Allowance** | £1,000 | [Tax-free allowances on property and trading income](https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income) |
| **Class 4 NICs (24/25)** | 6% between £12,570 and £50,270; 2% above £50,270 | [National Insurance rates and categories](https://www.gov.uk/national-insurance-rates-letters) |
| **Class 4 NICs (25/26+)**| *Assumed same as 24/25 until confirmed* | [National Insurance rates and categories](https://www.gov.uk/national-insurance-rates-letters) |
| **Rounding Rules** | Income Tax intermediate steps are not strictly rounded until final liability (or round down to nearest penny). HMRC Self Assessment rounds down to nearest pound for taxable income, but for this estimate, exact penny-rounding (down) is used for interim bands. | [HMRC Self Assessment Calculation Guide](https://www.gov.uk/government/publications/self-assessment-tax-calculation-guide-sa150) |
| **Cash Basis Accounting** | Income is recorded when received; expenses are recorded when paid. | [Cash basis accounting for businesses](https://www.gov.uk/simpler-income-tax-cash-basis) |

## 3. Eligibility Restrictions and Blocking

The engine and UI will explicitly block calculations and present a "Cannot provide estimate" warning if the user falls into unsupported categories:
1. **Scottish Taxpayers**: Scottish Income Tax bands differ.
2. **Other Income**: Employment, property, pensions, dividends, savings interest, capital gains, etc.
3. **Multiple Businesses / Partnerships**: Only single sole-traders are supported.
4. **Unsupported Years**: Unknown rule versions (e.g., pre-2024 or far future) will NEVER fall back to a default year. They will hard block.
5. **Excluded Parties (Trading Allowance)**: The trading allowance cannot be claimed if the income is from an employer or a connected party. (User must confirm).

## 4. Adjusted Net Income Assumptions

The engine currently assumes **Adjusted Net Income** equals the **Taxable Trading Profit**. 
- **Gift Aid**: Not supported. 
- **Pension Contributions**: Not supported.
*(We will add a disclaimer that if the user has Gift Aid or pension contributions, this estimate will not be accurate because it doesn't extend the basic rate band).*

## 5. UI Confirmations & Blocking

Before displaying the tax estimate, the Tax Preview tab will show a mandatory confirmation form:
- "I am a tax resident in England, Wales, or Northern Ireland (Not Scotland)."
- "My only source of income is this sole-trader business."
- "I do not have multiple businesses or partnerships."
- "My income is not from a connected party or employer (Trading Allowance eligibility)."
- "I understand this calculation does not account for Gift Aid or Pension contributions."

The estimate numbers will **not** be visible until all checkboxes are confirmed.

## 6. Storage Migration

- Existing expenses without a `taxTreatment` field will be automatically migrated to `taxTreatment: "needs-review"`.
- The UI will prompt the user to review these expenses before they are deducted against trading income.

## 7. Exact Rounding Rules

1. **Monetary Storage**: All amounts are scaled to integer pence (`* 100`) to prevent IEEE 754 precision issues.
2. **Taxable Income**: Rounded down to the nearest pound (HMRC standard) before applying tax bands.
3. **Tax Bands**: Tax within each band is calculated in pence and rounded down to the nearest penny.
4. **Class 4 NICs**: Calculated in pence, rounding down to the nearest penny for the final NICs total.
5. **Final Total**: The sum of Income Tax and Class 4 NICs is displayed in pounds and pence.

## 8. Source-Derived Golden Test Vectors

We will add the following golden vectors to `engine.test.ts`, derived manually from HMRC calculators:
- **Vector 1 (Basic Rate)**: £30,000 profit. 
  - Class 4: (£30,000 - £12,570) * 6% = £1,045.80. 
  - Income Tax: (£30,000 - £12,570) * 20% = £3,486.00.
  - Total = £4,531.80.
- **Vector 2 (Higher Rate)**: £60,000 profit.
  - Class 4: (£50,270 - £12,570) * 6% + (£60,000 - £50,270) * 2% = £2,262.00 + £194.60 = £2,456.60.
  - Income Tax: (£50,270 - £12,570) * 20% + (£60,000 - £50,270) * 40% = £7,540.00 + £3,892.00 = £11,432.00.
  - Total = £13,888.60.
- **Vector 3 (Tapered PA)**: £110,000 profit.
  - PA = £12,570 - (£10,000 / 2) = £7,570.
  - Taxable Income = £102,430.
  - Income Tax = (£50,270 - £7,570) * 20% + (£110,000 - £50,270) * 40% = £8,540 + £23,892 = £32,432.00.
  - Class 4: £2,262.00 + (£110,000 - £50,270) * 2% = £3,456.60.

## 9. Next Steps (Upon Plan Approval)

1. Implement `needs-review` migration in `storage.ts` and `store.ts`.
2. Add the UI blocker / mandatory confirmations in `ReportsView.tsx` before revealing the tax preview.
3. Add the exact golden test vectors to `src/tax-engine/__tests__/engine.test.ts`.
4. Enforce strict fallback blocking in `registry.ts`.
5. Expand Playwright coverage for the blocked states and confirmation flow.
6. Run the complete clean baseline and produce the required audit summary (SHA, PR URL, Diffs, Test summaries).
