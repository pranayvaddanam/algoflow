import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';

import { WalletConnect } from './components/WalletConnect';
import { Landing } from './components/Landing';
import { EmployerDashboard } from './components/EmployerDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { useContractState } from './hooks/useContractState';
import { useAlgoFlowWallet } from './hooks/useWallet';

/**
 * Employer dashboard page.
 * Shows WalletConnect prompt if not connected.
 * Auto-switches KMD account to the employer address if available.
 * Shows access denied if no matching account found.
 * Renders the full EmployerDashboard when authorized.
 */
function EmployerPage() {
  const { isConnected, activeAddress } = useAlgoFlowWallet();
  const { activeWallet } = useWallet();
  const { contractState, isLoading } = useContractState();

  // Auto-switch to employer account if connected KMD has it
  useEffect(() => {
    if (!isConnected || !contractState?.employer || !activeWallet) return;
    if (activeAddress === contractState.employer) return; // already correct

    // Check if any account in the active wallet matches the employer
    const employerAccount = activeWallet.accounts.find(
      (acc) => acc.address === contractState.employer
    );
    if (employerAccount) {
      activeWallet.setActiveAccount(employerAccount.address);
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
        <p className="text-text-light/50 text-sm mb-4">
          Try disconnecting and reconnecting — KMD may have multiple accounts.
        </p>
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
 * Redirects to employer dashboard if connected as employer.
 * Renders the full EmployeeDashboard when authorized.
 */
function EmployeePage() {
  const { isConnected, activeAddress } = useAlgoFlowWallet();
  const { contractState, isLoading } = useContractState();

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

  const isEmployer = contractState !== null && activeAddress === contractState.employer;

  if (isEmployer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
        <h1 className="font-heading text-4xl tracking-tight mb-4">
          Employee Dashboard
        </h1>
        <p className="text-text-light/70">
          You are connected as the employer.
        </p>
        <a href="/employer" className="mt-6 text-stream-green hover:underline">
          Go to Employer Dashboard
        </a>
      </div>
    );
  }

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
      {/* NetworkBadge fallback for non-Landing pages without their own header badge */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/employer" element={<EmployerPage />} />
        <Route path="/employee" element={<EmployeePage />} />
      </Routes>
    </>
  );
}
