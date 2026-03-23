/**
 * Landing page — entry point for AlgoFlow.
 *
 * Layout (per 04-screen-map.md):
 *   - Header: "AlgoFlow" title, NetworkBadge, WalletConnect
 *   - Hero: tagline + subtitle
 *   - HowItWorks: 3-step architecture diagram
 *   - RoleSelector: employer / employee cards
 *   - Footer: attribution
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAlgoFlowWallet } from '../hooks/useWallet';
import { useContractState } from '../hooks/useContractState';
import { WalletConnect } from './WalletConnect';
import { NetworkBadge } from './NetworkBadge';
import { HowItWorks } from './HowItWorks';
import { RoleSelector } from './RoleSelector';

/**
 * Landing page component with auto-routing based on wallet address.
 *
 * When a wallet connects and the address matches the contract employer,
 * the user is automatically routed to /employer. Otherwise they can
 * choose their role manually via the RoleSelector cards.
 */
export function Landing() {
  const { isConnected, activeAddress } = useAlgoFlowWallet();
  const { contractState } = useContractState();
  const navigate = useNavigate();

  // Auto-route: if connected and employer, redirect to /employer
  useEffect(() => {
    if (
      isConnected &&
      contractState !== null &&
      activeAddress !== null &&
      activeAddress === contractState.employer
    ) {
      navigate('/employer');
    }
  }, [isConnected, contractState, activeAddress, navigate]);

  return (
    <div className="min-h-screen flex flex-col text-text-light">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-dark/80 backdrop-blur-[18px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <h1 className="font-heading text-xl tracking-tight">
            AlgoFlow
          </h1>
          <div className="flex items-center gap-3">
            <NetworkBadge />
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-6 py-12 gap-16">
        {/* Hero */}
        <section className="text-center max-w-2xl">
          <h2 className="font-heading text-5xl sm:text-6xl tracking-tight mb-4">
            AlgoFlow
          </h2>
          <p className="text-lg sm:text-xl text-text-light/70 leading-relaxed">
            Real-time payroll streaming on Algorand. Continuous salary accrual
            with instant settlement.
          </p>
        </section>

        {/* Wallet connect prompt (when disconnected) */}
        {!isConnected && (
          <div id="wallet-connect-section" className="rounded-2xl transition-all duration-300">
            <WalletConnect />
          </div>
        )}

        {/* How It Works */}
        <HowItWorks />

        {/* Role Selector */}
        <RoleSelector />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-xs text-text-light/30">
          Built on Algorand &middot; Infinova Hackathon 2026
        </p>
      </footer>
    </div>
  );
}
