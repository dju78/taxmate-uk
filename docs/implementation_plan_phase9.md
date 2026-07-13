# Phase 9: Local Product Polish & Data Resilience

Phase 8 established a robust testing, layout, and CI foundation. Phase 9 focuses entirely on offline product polish, data resilience, reporting, and accessibility. 

> [!IMPORTANT]
> As requested, **Phase 9 will NOT include login, registration, authentication, cloud accounts, or a backend database.** TaxMate UK will remain a strictly browser-local prototype.

## Delivery Structure

To avoid an oversized release, Phase 9 is split into two parts:

### Phase 9A — Core offline usability
- Transaction search
- Sorting
- Duplicate detection
- Backup reminders
- Lightweight onboarding
- Reports and print views
- Improved import/export feedback
- Tax-year archive access

### Phase 9B — Quality and polish
- Accessibility audit
- Mobile refinements
- Performance optimisation
- Error boundaries
- Local diagnostic log
- Print stylesheet improvements
- Updated screenshots and documentation
- Expanded Playwright coverage

## Proposed Scope Details

### 1. Reports Design
Replace the current navigation label **Tax estimate** with **Reports**.
Inside Reports, use four simple tabs:
1. **Tax-year summary**
2. **Income status**
3. **Expense breakdown**
4. **Tax estimate preview**

The Reports section will include:
- Income received, Recorded expenses, Recorded cash surplus
- Outstanding income, Overdue income
- Monthly income and expense trend
- Income by source, Expenses by category
- Transaction counts, Data-quality notes
- Report generation date, Selected tax year

Provide actions: Print / Save as PDF, Export summary CSV, Export income CSV, Export expenses CSV, Export JSON backup.
*Note: Do not calculate tax liability. Keep the existing message that a complete tax estimate is unavailable. Every report must use the global selected tax year and reconcile with the dashboard and ledgers.*

### 2. Onboarding Design
Use a lightweight, optional **three-step onboarding flow**:
- **Step 1:** How TaxMate stores data (approved browser-storage disclosure).
- **Step 2:** Select your tax year (2026/27, 2025/26, 2024/25).
- **Step 3:** Choose how to begin (Start with an empty workspace OR Load demo data).

Requirements:
- Provide Skip. Do not require login/registration. Do not block access after dismissal.
- Allow onboarding to be reopened from Settings.
- Store `onboardingVersion` and completion status in preferences.
- Clearly label demo data and do not mix demo records silently with genuine records.

### 3. Sorting & Search
Use a visible **Sort by** dropdown rather than clickable table headers.

**Income sorting options:**
- Date — newest first (Default)
- Date — oldest first
- Amount — highest first
- Amount — lowest first
- Source — A to Z
- Source — Z to A
- Status — overdue first

**Expense sorting options:**
- Date — newest first (Default)
- Date — oldest first
- Amount — highest first
- Amount — lowest first
- Merchant — A to Z
- Merchant — Z to A
- Category — A to Z

The processing order must be: `Selected tax year -> filters -> search -> sorting -> rendering`.
Requirements: Keep sorting state in Zustand. Persist in application preferences. Use stable sorting with ID or creation time as tie-breaker. Reset invalid sort values safely. Do not apply ledger sorting to charts/KPIs. Announce active sort to screen-reader users.

### 4. Data Resilience (Duplicates & Reminders)
- **Duplicate Detection**: Show a warning (not an automatic block) when transaction type, date, amount, source/merchant, and description/category match. Show: "This transaction may already exist." Allow: Review existing record, Save anyway, Cancel. (Duplicate IDs during JSON import remain a hard validation issue).
- **Backup Reminders**: Show a dismissible reminder when either:
  1. The user has >= 10 records and has never exported a backup.
  2. > 30 days have passed since the last JSON export.
  Store only the `lastExportDate` in preferences. Do not imply a backup happened unless an export completed successfully.

## Verification Plan
### Automated Tests
- Playwright E2E tests for the Onboarding flow.
- Unit/E2E tests for duplicate detection warning logic.
- E2E tests for Search and Sorting functionality (Dropdowns).
- E2E tests for Backup Reminder visibility logic.

### Manual Verification
- Verify the Reports print views.
- Test keyboard navigation and screen reader output for the new Reports, Search, and Sort dropdowns.
