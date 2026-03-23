/**
 * ExplorerLink — clickable link to view a transaction on Lora Explorer.
 *
 * Builds the URL based on the current network (testnet or localnet).
 * Opens in a new tab for safety.
 */

import { getNetwork } from '../lib/algorand';
import { getExplorerUrl } from '../lib/utils';

interface ExplorerLinkProps {
  /** Transaction ID to link to. */
  txId: string;

  /** Optional label text; defaults to truncated txId. */
  label?: string;
}

/**
 * Renders a link to view a transaction on Lora Explorer.
 *
 * Uses VITE_NETWORK to determine testnet or localnet URL.
 * Always opens in a new tab with noopener for security.
 */
export function ExplorerLink({ txId, label }: ExplorerLinkProps) {
  const network = getNetwork();
  const url = getExplorerUrl(txId, network);
  const displayLabel = label ?? `${txId.slice(0, 8)}...${txId.slice(-4)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-stream-green hover:underline text-sm font-mono"
    >
      <span>{displayLabel}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="w-3.5 h-3.5"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
    </a>
  );
}
