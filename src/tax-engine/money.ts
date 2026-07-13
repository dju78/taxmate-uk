/**
 * Decimal-safe monetary calculations using integer pence.
 */

export function toPence(pounds: number | string): number {
  const num = typeof pounds === 'string' ? parseFloat(pounds) : pounds;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function toPounds(pence: number): number {
  return pence / 100;
}

export function formatPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

/**
 * HMRC generally rounds down tax computations to the nearest penny unless otherwise specified.
 * We round to the nearest penny using Math.round to handle floating point artifacts from percentage math.
 * However, some specific HMRC steps truncate (floor). We provide floorPence for that.
 */
export function roundPence(value: number): number {
  return Math.round(value);
}

export function floorPence(value: number): number {
  return Math.floor(value);
}
