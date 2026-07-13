import { useTaxStore } from './store';
import { storageService } from './storage';
import { useState, useEffect } from 'react';
import { Button } from './components';

export function BackupReminderBanner() {
  const income = useTaxStore((s) => s.income);
  const expenses = useTaxStore((s) => s.expenses);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const prefs = storageService.getAppPreferences();
    const now = new Date();

    if (prefs.backupReminderSnoozedUntil) {
      const snoozedUntil = new Date(prefs.backupReminderSnoozedUntil);
      if (now < snoozedUntil) {
        setShow(false);
        return;
      }
    }

    const totalNonDemo = 
      income.filter(r => !r.isDemo).length + 
      expenses.filter(r => !r.isDemo).length;

    if (totalNonDemo < 5) {
      setShow(false);
      return;
    }

    if (prefs.lastExportDate) {
      const lastExport = new Date(prefs.lastExportDate);
      const daysSinceExport = (now.getTime() - lastExport.getTime()) / (1000 * 3600 * 24);
      if (daysSinceExport < 30) {
        setShow(false);
        return;
      }
    }

    setShow(true);
  }, [income, expenses]);

  const handleSnooze = () => {
    // Snooze for 7 days
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 7);
    storageService.setAppPreferences({ backupReminderSnoozedUntil: snoozeUntil.toISOString() });
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="alert"
      className="border-b border-blue-300 bg-blue-50 px-4 py-3 text-blue-900 sm:px-6"
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 text-lg leading-none">💾</span>
          <div>
            <p className="text-sm font-bold">Backup recommended</p>
            <p className="text-sm">
              You have recorded several transactions but haven't exported a backup recently. 
              Remember that data is only stored in this browser. Go to Settings to export a backup.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSnooze}>
            Remind me later
          </Button>
        </div>
      </div>
    </div>
  );
}
