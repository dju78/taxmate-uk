// Shared strict validators for financial form inputs.

// A valid money amount: a non-negative decimal with up to 2 places, greater
// than zero. Rejects values like "100abc", "1e3", " ", "-5", "1.999".
export const isValidAmount = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  const s = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return false;
  return parseFloat(s) > 0;
};

// A valid YYYY-MM-DD calendar date (rejects "2026-02-30", "2026-13-01", etc.).
export const isValidDateString = (value) => {
  if (typeof value !== 'string') return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};
