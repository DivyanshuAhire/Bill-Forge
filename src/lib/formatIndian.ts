/**
 * Indian Number System formatting utilities.
 *
 * Numeric:  10,00,000  instead of  1,000,000
 * Words:    Ten Lakh   instead of  One Million
 */

// ── Numeric formatting (Indian comma grouping) ──────────────────────────────

/**
 * Format a number using the Indian grouping system.
 * e.g. 1234567.89 → "12,34,567.89"
 */
export function formatIndianNumber(num: number, decimals = 2): string {
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");

  // Handle negative numbers
  const isNegative = intPart.startsWith("-");
  const absInt = isNegative ? intPart.slice(1) : intPart;

  let formatted: string;
  if (absInt.length <= 3) {
    formatted = absInt;
  } else {
    // Last 3 digits stay as-is; remaining digits are grouped in pairs from right
    const last3 = absInt.slice(-3);
    const remaining = absInt.slice(0, -3);
    const pairs = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    formatted = `${pairs},${last3}`;
  }

  const sign = isNegative ? "-" : "";
  return decPart !== undefined ? `${sign}${formatted}.${decPart}` : `${sign}${formatted}`;
}

/**
 * Format a currency amount with ₹ / Rs prefix and Indian grouping.
 */
export function formatIndianCurrency(amount: number, decimals = 2): string {
  return `Rs ${formatIndianNumber(amount, decimals)}`;
}

// ── Words conversion (Indian denomination) ──────────────────────────────────

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigitWords(n: number): string {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? " " + ones[o] : "");
}

function threeDigitWords(n: number): string {
  if (n === 0) return "";
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let result = "";
  if (h) result += ones[h] + " Hundred";
  if (rem) result += (h ? " " : "") + twoDigitWords(rem);
  return result;
}

/**
 * Convert a whole number to words using Indian denominations.
 * Supports up to 99,99,99,99,999 (99 Arab).
 *
 * Example: 1050000 → "Ten Lakh Fifty Thousand"
 */
export function indianNumberToWords(num: number): string {
  if (num === 0) return "Zero";
  if (num < 0) return "Minus " + indianNumberToWords(-num);

  num = Math.round(num);

  // Split into groups following the Indian system:
  //   Ones/Hundreds (last 3 digits), Thousands (next 2), Lakh (next 2), Crore (next 2), Arab (next 2)
  const groups: { divisor: number; label: string }[] = [
    { divisor: 1_00_00_00_000, label: "Arab" },
    { divisor: 1_00_00_000, label: "Crore" },
    { divisor: 1_00_000, label: "Lakh" },
    { divisor: 1_000, label: "Thousand" },
  ];

  let remaining = num;
  const parts: string[] = [];

  for (const { divisor, label } of groups) {
    const groupValue = Math.floor(remaining / divisor);
    if (groupValue > 0) {
      parts.push(twoDigitWords(groupValue) + " " + label);
      remaining %= divisor;
    }
  }

  // The last 3 digits
  if (remaining > 0) {
    parts.push(threeDigitWords(remaining));
  }

  return parts.join(" ");
}
