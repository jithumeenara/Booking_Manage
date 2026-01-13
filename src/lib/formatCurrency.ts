/**
 * Format number with Indian comma separators
 * @param num - Number to format
 * @param decimalPlaces - Number of decimal places (default: 0)
 * @returns String with Indian comma format (e.g., 55,23,43,466.0)
 */
const formatIndianNumber = (num: number, decimalPlaces: number = 0): string => {
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Split into integer and decimal parts
  let integerPart = Math.floor(absNum);
  let decimalPart = '';

  if (decimalPlaces > 0) {
    const decimal = (absNum - integerPart).toFixed(decimalPlaces).substring(2);
    decimalPart = '.' + decimal;
  } else if (absNum % 1 !== 0) {
    // Keep original decimal if number has decimals
    decimalPart = '.' + absNum.toString().split('.')[1];
  }

  // Format integer part with Indian commas
  const numStr = integerPart.toString();
  let result = '';

  if (numStr.length <= 3) {
    result = numStr;
  } else {
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  return (isNegative ? '-' : '') + result + decimalPart;
};

/**
 * Format currency in Indian Rupee format
 * - Removes leading zeros
 * - Adds comma separators (e.g., ₹1,25,000)
 * - Handles null/undefined values
 * 
 * @param amount - The amount to format
 * @param showSymbol - Whether to include the ₹ symbol (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined, showSymbol: boolean = true, decimalPlaces: number = 0): string => {
  const value = amount || 0;

  // Always use manual Indian formatting for consistency
  const formatted = formatIndianNumber(value, decimalPlaces);

  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Calculate total revenue from bookings
 * Only includes bookings with status 'payment_completed'
 * 
 * @param bookings - Array of bookings
 * @returns Total revenue amount
 */
export const calculateRevenue = (bookings: Array<{ status?: string; total_bill_amount?: number | string | null }>): number => {
  return bookings
    .filter(b => b.status === 'payment_completed')
    .reduce((sum, b) => {
      // Convert to number to handle both string and number types
      const amount = Number(b.total_bill_amount) || 0;
      return sum + amount;
    }, 0);
};

/**
 * Example test cases for Indian number formatting:
 * 
 * formatCurrency(0) → "₹0"
 * formatCurrency(999) → "₹999"
 * formatCurrency(1000) → "₹1,000"
 * formatCurrency(12345) → "₹12,345"
 * formatCurrency(125000) → "₹1,25,000"
 * formatCurrency(1250000) → "₹12,50,000"
 * formatCurrency(50000000) → "₹5,00,00,000"
 * formatCurrency(552343466) → "₹55,23,43,466"
 * formatCurrency(552343466.0) → "₹55,23,43,466.0"
 */
