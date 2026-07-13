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

### 1. Reports and printing
Replace the current navigation label **Tax estimate** with **Reports**.
Inside Reports, use four simple tabs:
1. **Tax-year summary**
2. **Income status**
3. **Expense breakdown**
4. **Tax estimate preview**

The printed report must include:
- Tax year, Generation date and time
- Income received, Recorded expenses, Recorded cash surplus
- Outstanding and overdue income
- Transaction counts, Monthly summary
- Source and category breakdowns
- General-guidance disclaimer, Browser-local prototype disclaimer

Add a dedicated print stylesheet covering page breaks, hidden navigation, readable charts and A4 formatting.
*Note: Do not calculate tax liability. Keep the existing message that a complete tax estimate is unavailable. Every report must use the global selected tax year and reconcile with the dashboard and ledgers.*

### 2. Onboarding Design
Use a lightweight, optional **three-step onboarding flow**:
- **Step 1:** How TaxMate stores data (approved browser-storage disclosure).
- **Step 2:** Select your tax year (2026/27, 2025/26, 2024/25).
- **Step 3:** Choose how to begin (Start with an empty workspace OR Load demo data).

Requirements:
- Show onboarding only when saved onboarding version is missing/older AND user has not completed/skipped that version.
- Do not interrupt an established user merely because their list is empty.
- Store preferences: `onboardingVersion`, `onboardingCompleted`, `onboardingSkipped`, `completedAt`.
- Provide Skip. Do not require login/registration. Do not block access after dismissal.
- Allow onboarding to be reopened from Settings.

### 3. Sorting & Search
Use a visible **Sort by** dropdown rather than clickable table headers.

**Search behaviour:**
- Income: Source, Description, Category, Notes, Status
- Expense: Merchant, Description, Category, Notes, Payment method
- Case-insensitive, whitespace-trimmed, applied after filters and before sorting. Do not persist search phrase.

**Sorting rules:**
- Default: `date-desc`
- Income options: Date (newest/oldest), Amount (highest/lowest), Source (A-Z/Z-A), Status (overdue first)
- Expense options: Date (newest/oldest), Amount (highest/lowest), Merchant (A-Z/Z-A), Category (A-Z)
- Tie-breaker: Primary sort -> transaction date -> transaction ID.
- Processing order: `Selected tax year -> filters -> search -> sorting -> rendering`.
- Keep sorting state in Zustand and preferences. Do not alter charts/KPIs.

### 4. Data Resilience (Duplicates & Reminders)
- **Duplicate Detection**: Compare normalised type, local calendar date, amount, source/merchant, description/category. Exclude current record during edit. Show warning: "This transaction may already exist." Allow: Review existing, Save anyway, Cancel. (Duplicates during import remain a hard error, but content duplicates should be warnings).
- **Backup Reminders**: Trigger reminder when:
  1. >= 10 genuine user records AND no successful JSON export.
  2. > 30 days since last successful JSON export.
  - Store only `lastExportDate` on success. Demo-only records do not trigger reminders. Add 7-day snooze via `backupReminderSnoozedUntil`.

### 5. Tax-year archive access
Implement "Past tax years" through the existing global selector. Provide summary cards: Tax year, Income/Expense count, Income received, Recorded expenses, Recorded cash surplus, and Open report action. Records remain editable.

### 6. Improved import/export feedback
Add accessible progress/completion states for export, restore, merge, invalid import, cancelled import, duplicate warnings. Import preview shows what will be added, replaced, skipped, duplicate IDs, content duplicates, preferences, and selected tax year.

### 7. Phase 9B privacy safeguard
Diagnostic log stores only technical events (`timestamp`, `code`, `feature`, `severity`). Max ~100 entries. Provide export/clear actions.

## Verification Plan
### Automated Tests
- Reports reconciliation, Print-view content
- Search normalisation, Stable sorting, Invalid persisted sort recovery, Search + filter combinations
- Edit-mode duplicate exclusion, Save-anyway duplicate path
- Demo records excluded from reminders, Reminder snooze and reappearance, Export timestamps
- Past-tax-year summary, Import duplicate warnings
- Onboarding skip/completion/reopening, Onboarding version migration, Mobile and keyboard workflows.
