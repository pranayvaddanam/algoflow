/**
 * Client-side bonus payment tracker.
 *
 * Tracks milestone/bonus payments per employee in localStorage since
 * the contract's milestone_pay method does not update the employee's
 * local state (total_withdrawn). This allows the frontend to display
 * accurate "Lifetime Earned" figures that include both streaming
 * accrual and bonus payments.
 */

const BONUS_KEY_PREFIX = 'algoflow_bonus_';

/**
 * Record a bonus payment for an employee.
 * Adds the amount to the existing bonus total.
 */
export function addBonus(employeeAddress: string, amount: number): void {
  const key = `${BONUS_KEY_PREFIX}${employeeAddress}`;
  const current = getTotalBonuses(employeeAddress);
  try {
    localStorage.setItem(key, String(current + amount));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Get the cumulative bonus total for an employee.
 */
export function getTotalBonuses(employeeAddress: string): number {
  const key = `${BONUS_KEY_PREFIX}${employeeAddress}`;
  try {
    const stored = localStorage.getItem(key);
    return stored ? Number(stored) : 0;
  } catch {
    return 0;
  }
}
