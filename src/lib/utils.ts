import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate financial year based on date (April to March cycle)
 * @param date - The date to calculate financial year from
 * @returns Financial year string in format "YYYY-YY" (e.g., "2025-26")
 */
export function getFinancialYear(date: Date): string {
  const month = date.getMonth(); // 0-indexed (0 = January, 3 = April)
  const year = date.getFullYear();
  
  // If month is April (3) or later, FY is current year to next year
  // If month is before April (Jan-Mar), FY is previous year to current year
  if (month >= 3) {
    // April to December: FY starts this year
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    // January to March: FY started last year
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

/**
 * Get current financial year
 * @returns Current financial year string in format "YYYY-YY"
 */
export function getCurrentFinancialYear(): string {
  return getFinancialYear(new Date());
}
