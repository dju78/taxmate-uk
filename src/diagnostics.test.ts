import { describe, it, expect, beforeEach } from 'vitest';
import { diagnosticsService } from './diagnostics';

beforeEach(() => localStorage.clear());

describe('diagnosticsService', () => {
  it('starts empty', () => {
    expect(diagnosticsService.getEntries()).toEqual([]);
  });

  it('appends entries with timestamp, code, feature and severity', () => {
    diagnosticsService.logEvent('IMPORT_SUCCESS', 'import', 'info');
    const entries = diagnosticsService.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].code).toBe('IMPORT_SUCCESS');
    expect(entries[0].feature).toBe('import');
    expect(entries[0].severity).toBe('info');
    expect(typeof entries[0].timestamp).toBe('string');
  });

  it('defaults severity to info when not specified', () => {
    diagnosticsService.logEvent('SCHEMA_MIGRATION', 'storage');
    expect(diagnosticsService.getEntries()[0].severity).toBe('info');
  });

  it('caps at 100 entries, dropping the oldest first (FIFO)', () => {
    for (let i = 0; i < 105; i++) {
      diagnosticsService.logEvent(`EVENT_${i}`, 'test');
    }
    const entries = diagnosticsService.getEntries();
    expect(entries).toHaveLength(100);
    expect(entries[0].code).toBe('EVENT_5');
    expect(entries[99].code).toBe('EVENT_104');
  });

  it('clearLog empties all entries', () => {
    diagnosticsService.logEvent('IMPORT_SUCCESS', 'import');
    diagnosticsService.clearLog();
    expect(diagnosticsService.getEntries()).toEqual([]);
  });

  it('resets to an empty log instead of throwing on corrupted storage', () => {
    localStorage.setItem('taxmate_diagnostic_log', 'not valid json{{{');
    expect(diagnosticsService.getEntries()).toEqual([]);
    diagnosticsService.logEvent('IMPORT_SUCCESS', 'import');
    expect(diagnosticsService.getEntries()).toHaveLength(1);
  });

  it('exportAsJSON produces valid, readable JSON of the log', () => {
    diagnosticsService.logEvent('EXPORT_SUCCESS', 'export');
    const json = diagnosticsService.exportAsJSON();
    const parsed = JSON.parse(json);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].code).toBe('EXPORT_SUCCESS');
  });
});
