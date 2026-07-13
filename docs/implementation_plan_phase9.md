# Phase 9: Local Product Polish & Data Resilience

Phase 8 established a robust testing, layout, and CI foundation. Phase 9 focuses entirely on offline product polish, data resilience, reporting, and accessibility. 

> [!IMPORTANT]
> As requested, **Phase 9 will NOT include login, registration, authentication, cloud accounts, or a backend database.** TaxMate UK will remain a strictly browser-local prototype.

## Proposed Scope

### 1. Offline Product Polish & Onboarding
- **Onboarding Tour/Welcome Modal**: Introduce first-time users to the prototype's core features (e.g., adding transactions, tax year isolation, local storage). Track completion via a `hasSeenOnboarding` flag in `localStorage`.
- **Empty States & Transitions**: Enhance empty states with better illustrations and clear calls-to-action. Add subtle micro-animations for interactions (e.g., toast notifications, modal fade-ins).
- **Simulated Saving Indicators**: Display brief, non-blocking visual feedback (e.g., "Saved locally") when transactions are added, ensuring the user feels their data is secure even though synchronous `localStorage` is instantaneous.

### 2. Data Resilience & Import/Export
- **Duplicate Detection**: Add a check when saving an income/expense to warn the user if an identical transaction (same amount, date, description, and category) already exists.
- **Backup Reminders**: Track `lastExportDate` in local storage. If > 30 days have passed since the last export (and the ledger is not empty), display a prominent but dismissible reminder to export data on the Dashboard.
- **Improved Import Workflows**: Add an intermediate "Preview" step during JSON/CSV import, showing a summary (e.g., "You are about to merge 15 Income records and 3 Expense records. Proceed?") before modifying the ledger.
- **Robust Validation**: Harden `localStorage` reading to gracefully handle corrupted JSON or schema mismatches.

### 3. Reporting & Performance
- **Advanced Reports**: Create a dedicated "Reports" view or expand the Dashboard to show category breakdowns (e.g., a pie/bar chart of expenses by category) and month-over-month comparisons.
- **Transaction Search & Sorting**:
  - **Search**: Add a text input to filter the transaction list by description.
  - **Sort**: Allow users to sort transactions by Date (newest/oldest) or Amount (highest/lowest).
- **Performance**: Implement `useMemo` and `useCallback` for chart data calculations and filters to prevent unnecessary re-renders.

### 4. Accessibility (a11y)
- **Comprehensive ARIA**: Ensure all new charts, modals, and sorting controls are fully screen-reader accessible.
- **Focus Management**: Guarantee keyboard navigation flows logically through the new onboarding modal, search inputs, and import preview screens.

---

## Open Questions

> [!WARNING]
> Please review the following design questions before I begin execution:

1. **Reports View**: Should the new category breakdowns and charts be placed directly on the main Dashboard, or should they live in a separate "Reports" tab/page?
2. **Onboarding**: Should the onboarding be a simple welcome modal, or a multi-step guided tour?
3. **Sorting Default**: Should the default transaction sort order remain strictly chronological (newest first)?

## Verification Plan

### Automated Tests
- Playwright E2E tests for the Onboarding modal (verifying it only shows once).
- Unit/E2E tests for duplicate detection logic.
- E2E tests for Search and Sorting functionality.
- E2E tests for the Import Preview flow.

### Manual Verification
- Verify micro-animations and simulated saving indicators feel native and premium.
- Test keyboard navigation and screen reader output for the new Reports and Search features.
