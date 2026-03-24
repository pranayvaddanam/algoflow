import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';

import { WalletConnect } from './components/WalletConnect';
import { Landing } from './components/Landing';
import { EmployerDashboard } from './components/EmployerDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { Silk } from './components/Silk';
import { useContractState } from './hooks/useContractState';
import { useAlgoFlowWallet } from './hooks/useWallet';
import { shortenAddress, cn } from './lib/utils';

/**
 * Employer dashboard page.
 * Shows WalletConnect prompt if not connected.
 * Auto-switches KMD account to the employer address if available.
 * Shows account selector if auto-switch fails.
 * Renders the full EmployerDashboard when authorized.
 */
function EmployerPage() {
  const { isConnected, activeAddress } = useAlgoFlowWallet();
  const { activeWallet } = useWallet();
  const { contractState, isLoading, error } = useContractState();
  const [isSwitching, setIsSwitching] = useState(false);

  // Auto-switch to employer account if connected KMD has it
  useEffect(() => {
    if (!isConnected || !contractState?.employer || !activeWallet) return;
    if (activeAddress === contractState.employer) {
      setIsSwitching(false);
      return;
    }

    // Check if any account in the active wallet matches the employer
    const employerAccount = activeWallet.accounts.find(
      (acc) => acc.address === contractState.employer
    );
    if (employerAccount) {
      setIsSwitching(true);
      activeWallet.setActiveAccount(employerAccount.address);
    } else {
      setIsSwitching(false);
    }
  }, [isConnected, activeAddress, contractState?.employer, activeWallet]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
        <h1 className="font-heading text-4xl tracking-tight mb-4">
          Employer Dashboard
        </h1>
        <p className="text-text-light/70 mb-6">
          Connect your wallet to access the employer dashboard.
        </p>
        <WalletConnect />
      </div>
    );
  }

  if (isLoading || isSwitching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-text-light/30 border-t-stream-green rounded-full animate-spin" />
          <p className="text-text-light/70">
            {isSwitching ? 'Switching to employer account...' : 'Loading contract state...'}
          </p>
        </div>
      </div>
    );
  }

  // Show API errors instead of masking them as "Access Denied"
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
        <h1 className="font-heading text-4xl tracking-tight mb-4 text-accent">
          Contract Error
        </h1>
        <p className="text-text-light/70 mb-2">
          Failed to load contract state.
        </p>
        <p className="text-accent/80 text-sm font-mono mb-4 max-w-md text-center">
          {error}
        </p>
        <p className="text-text-light/50 text-sm mb-4">
          Check that LocalNet is running and APP_ID in .env is correct.
        </p>
      </div>
    );
  }

  const isEmployer = contractState !== null && activeAddress === contractState.employer;

  if (!isEmployer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
        <h1 className="font-heading text-4xl tracking-tight mb-4">
          Access Denied
        </h1>
        <p className="text-text-light/70 mb-2">
          Your connected address is not the contract employer.
        </p>
        <p className="text-text-light/40 text-sm font-mono mb-1">
          You: {activeAddress}
        </p>
        {contractState?.employer && (
          <p className="text-text-light/40 text-sm font-mono mb-4">
            Employer: {contractState.employer}
          </p>
        )}

        {/* Account selector — lets user manually switch if auto-switch failed */}
        {activeWallet && activeWallet.accounts.length > 1 && (
          <div className="mb-4">
            <p className="text-text-light/50 text-sm mb-2">
              Select an account:
            </p>
            <div className="flex flex-col gap-1">
              {activeWallet.accounts.map((acc) => {
                const isCurrent = acc.address === activeAddress;
                const isEmployerAddr = acc.address === contractState?.employer;
                return (
                  <button
                    key={acc.address}
                    type="button"
                    onClick={() => activeWallet.setActiveAccount(acc.address)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-mono transition-colors flex items-center',
                      isCurrent
                        ? 'bg-primary/20 text-stream-green border border-stream-green/30'
                        : isEmployerAddr
                          ? 'bg-[--accent]/10 text-text-light hover:bg-[--accent]/20 border border-[--accent]/30'
                          : 'bg-text-light/5 text-text-light/70 hover:bg-text-light/10'
                    )}
                  >
                    {shortenAddress(acc.address)}
                    {isEmployerAddr ? (
                      <span className="inline-flex items-center gap-1 ml-2 rounded-full bg-[--accent]/15 px-2 py-0.5 text-[10px] font-semibold text-[--accent] border border-[--accent]/25">
                        Employer
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 ml-2 rounded-full bg-[--stream-green]/15 px-2 py-0.5 text-[10px] font-semibold text-[--stream-green] border border-[--stream-green]/25">
                        Employee
                      </span>
                    )}
                    {isCurrent && (
                      <span className="ml-2 text-xs text-text-light/50">(active)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <a href="/employee" className="text-stream-green hover:underline">
          Go to Employee Dashboard
        </a>
      </div>
    );
  }

  return <EmployerDashboard />;
}

/**
 * Employee dashboard page.
 * Shows WalletConnect prompt if not connected.
 * Shows loading/error states.
 * Renders the full EmployeeDashboard directly — the dashboard has its own
 * unified header with navigation tabs and integrated account switcher.
 */
function EmployeePage() {
  const { isConnected } = useAlgoFlowWallet();
  const { isLoading, error } = useContractState();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
        <h1 className="font-heading text-4xl tracking-tight mb-4">
          Employee Dashboard
        </h1>
        <p className="text-text-light/70 mb-6">
          Connect your wallet to view your accrued salary.
        </p>
        <WalletConnect />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-text-light/30 border-t-stream-green rounded-full animate-spin" />
          <p className="text-text-light/70">Loading contract state...</p>
        </div>
      </div>
    );
  }

  // Show API errors
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
        <h1 className="font-heading text-4xl tracking-tight mb-4 text-accent">
          Contract Error
        </h1>
        <p className="text-text-light/70 mb-2">
          Failed to load contract state.
        </p>
        <p className="text-accent/80 text-sm font-mono mb-4 max-w-md text-center">
          {error}
        </p>
        <p className="text-text-light/50 text-sm mb-4">
          Check that LocalNet is running and APP_ID in .env is correct.
        </p>
      </div>
    );
  }

  // EmployeeDashboard handles all states: employer-connected, not-registered, active employee.
  // It has its own unified header with nav tabs and account switcher.
  return <EmployeeDashboard />;
}

/**
 * Root application component with route definitions.
 *
 * Routes:
 *   /          - Landing page
 *   /employer  - Employer dashboard
 *   /employee  - Employee dashboard
 *
 * NetworkBadge is rendered on all pages via the layout wrapper in
 * EmployerPage/EmployeePage headers and the Landing component header.
 */
export function App() {
  return (
    <>
      {/* Three.js procedural 3D animated background */}
      <Silk speed={0.3} opacity={0.4} />

      {/* NetworkBadge fallback for non-Landing pages without their own header badge */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/employer" element={<EmployerPage />} />
        <Route path="/employee" element={<EmployeePage />} />
      </Routes>
    </>
  );
}
