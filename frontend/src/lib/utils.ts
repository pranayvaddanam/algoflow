/**
 * Utility functions for the AlgoFlow frontend.
 */

import { ASSET_DECIMALS, ADDRESS_DISPLAY_LENGTH } from './constants';

/**
 * Convert base units to a formatted token amount string.
 *
 * @param baseUnits - Amount in base units (e.g., 1_000_000 for 1.000000 tokens)
 * @param decimals - Number of decimal places (defaults to ASSET_DECIMALS = 6)
 * @returns Formatted string with the specified decimal places
 *
 * @example
 * formatTokenAmount(1_500_000) // "1.500000"
 * formatTokenAmount(0)         // "0.000000"
 */
export function formatTokenAmount(
  baseUnits: number,
  decimals: number = ASSET_DECIMALS,
): string {
  return (baseUnits / Math.pow(10, decimals)).toFixed(decimals);
}

/**
 * Truncate an Algorand address for display.
 *
 * @param addr - Full 58-character Algorand address
 * @returns Truncated address in the format "ABCDEF...WXYZ"
 *
 * @example
 * shortenAddress("ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ56") // "ABC123...Z56"
 */
export function shortenAddress(addr: string): string {
  if (addr.length <= ADDRESS_DISPLAY_LENGTH * 2) {
    return addr;
  }
  return `${addr.slice(0, ADDRESS_DISPLAY_LENGTH)}...${addr.slice(-ADDRESS_DISPLAY_LENGTH + 2)}`;
}

/**
 * Conditionally join CSS class names, filtering out falsy values.
 *
 * @param classes - Class names, undefined, or false values
 * @returns Joined class string with falsy values removed
 *
 * @example
 * cn("base", isActive && "active", undefined, "always") // "base active always"
 * cn("base", false, "end") // "base end"
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
