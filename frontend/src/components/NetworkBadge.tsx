/**
 * NetworkBadge — small indicator showing the connected Algorand network.
 *
 * Reads VITE_NETWORK environment variable:
 *   - "testnet" renders an amber badge
 *   - "localnet" renders a subtle gray/green badge
 *
 * Positioned in the top-right area of the header. Small and unobtrusive.
 */

import { getNetwork } from '../lib/algorand';
import { cn } from '../lib/utils';

/**
 * Renders a small network badge with the current network name.
 */
export function NetworkBadge() {
  const network = getNetwork();
  const isTestnet = network === 'testnet';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase',
        isTestnet
          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          : 'bg-stream-green/10 text-stream-green/70 border border-stream-green/20',
      )}
    >
      {isTestnet ? 'Testnet' : 'LocalNet'}
    </span>
  );
}
