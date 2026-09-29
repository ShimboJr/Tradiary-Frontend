/**
 * utils/format.js
 * Centralized date/currency formatting using the user's settings.
 * All formatting goes through here — no hardcoded locales or $ symbols.
 */

// ── Currency ──────────────────────────────────────────────────────────────────

/**
 * Format a numeric amount as currency.
 * @param {number} amount
 * @param {string} currency  ISO 4217 code (e.g. "USD", "EUR", "GBP")
 * @param {object} opts      Intl.NumberFormat options overrides
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'USD', opts = {}) {
  if (amount === null || amount === undefined) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...opts,
    }).format(amount);
  } catch {
    // Fallback if currency code is invalid
    return `${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`;
  }
}

/**
 * Format currency showing sign explicitly (+/-).
 */
export function formatPnL(amount, currency = 'USD') {
  if (amount === null || amount === undefined) return '—';
  const formatted = formatCurrency(Math.abs(amount), currency);
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Format a compact number (e.g. 1500 → "1.5K").
 */
export function formatCompact(num) {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

// ── Dates ─────────────────────────────────────────────────────────────────────

/**
 * Format a date using the user's timezone.
 * @param {string|Date} date
 * @param {string} timezone  IANA timezone (e.g. "America/New_York"). Defaults to UTC.
 * @param {object} opts      Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(date, timezone = 'UTC', opts = {}) {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
      ...opts,
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleDateString();
  }
}

/**
 * Format a date + time using the user's timezone.
 */
export function formatDateTime(date, timezone = 'UTC') {
  return formatDate(date, timezone, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format as "Mon DD" (e.g. "Sep 29") for compact display.
 */
export function formatShortDate(date, timezone = 'UTC') {
  return formatDate(date, timezone, { month: 'short', day: 'numeric' });
}

/**
 * Format as "YYYY-MM-DD" for input[type=date] values.
 */
export function formatInputDate(date, timezone = 'UTC') {
  if (!date) return '';
  try {
    const d = new Date(date);
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      timeZone: timezone,
    }).formatToParts(d);
    const get = (t) => parts.find(p => p.type === t)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}

// ── Numbers ───────────────────────────────────────────────────────────────────

/**
 * Format a percentage (e.g. 0.623 → "62.3%").
 */
export function formatPercent(ratio, decimals = 1) {
  if (ratio === null || ratio === undefined) return '—';
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/**
 * Format a ratio (e.g. 1.95 → "1.95R").
 */
export function formatR(r, decimals = 2) {
  if (r === null || r === undefined) return '—';
  const sign = r >= 0 ? '+' : '';
  return `${sign}${r.toFixed(decimals)}R`;
}
