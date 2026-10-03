const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

/** Formats an integer cent amount, e.g. 1850 -> "$18.50". */
export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

/**
 * Splits a cent amount evenly across `count` people. Leftover cents go to the
 * first people in the list so the shares always sum to the original amount.
 */
export function splitEvenly(cents: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor(cents / count)
  const remainder = cents - base * count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}

/** Parses a dollar input such as "18.5" into cents; blank or invalid input is 0. */
export function parseDollarsToCents(input: string): number {
  const dollars = Number.parseFloat(input)
  return Number.isFinite(dollars) ? Math.round(dollars * 100) : 0
}
