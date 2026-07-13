// Local-only diagnostic log. Deliberately separate from storage.ts so it can
// never be accidentally included in the user-facing backup/export bundle —
// this stores technical events for debugging, not financial data.

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface DiagnosticEntry {
  timestamp: string;
  code: string;
  feature: string;
  severity: DiagnosticSeverity;
}

const DIAGNOSTIC_LOG_KEY = 'taxmate_diagnostic_log';
const DIAGNOSTIC_LOG_SCHEMA_VERSION = 1;
const MAX_ENTRIES = 100;

interface DiagnosticLogFile {
  schemaVersion: number;
  entries: DiagnosticEntry[];
}

const EMPTY_LOG: DiagnosticLogFile = { schemaVersion: DIAGNOSTIC_LOG_SCHEMA_VERSION, entries: [] };

// Diagnostics must never be able to break the app it's meant to help debug —
// any corruption resets to an empty log rather than throwing.
const readLog = (): DiagnosticLogFile => {
  try {
    const raw = localStorage.getItem(DIAGNOSTIC_LOG_KEY);
    if (!raw) return { ...EMPTY_LOG };
    const parsed = JSON.parse(raw) as DiagnosticLogFile;
    if (!parsed || !Array.isArray(parsed.entries)) return { ...EMPTY_LOG };
    return parsed;
  } catch {
    return { ...EMPTY_LOG };
  }
};

const writeLog = (log: DiagnosticLogFile): void => {
  try {
    localStorage.setItem(DIAGNOSTIC_LOG_KEY, JSON.stringify(log));
  } catch {
    // ignore — logging must never throw into a caller's error path
  }
};

export const diagnosticsService = {
  getEntries: (): DiagnosticEntry[] => readLog().entries,

  logEvent: (code: string, feature: string, severity: DiagnosticSeverity = 'info'): void => {
    const log = readLog();
    const entry: DiagnosticEntry = { timestamp: new Date().toISOString(), code, feature, severity };
    const entries = [...log.entries, entry].slice(-MAX_ENTRIES);
    writeLog({ schemaVersion: DIAGNOSTIC_LOG_SCHEMA_VERSION, entries });
  },

  clearLog: (): void => {
    writeLog({ ...EMPTY_LOG });
  },

  exportAsJSON: (): string => JSON.stringify(readLog(), null, 2),
};
