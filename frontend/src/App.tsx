import { Routes, Route } from 'react-router-dom';

import { WalletConnect } from './components/WalletConnect';
import { EmployerDashboard } from './components/EmployerDashboard';
import { useContractState } from './hooks/useContractState';
import { useAlgoFlowWallet } from './hooks/useWallet';

/**
 * Landing page with role selection links.
 */
function Landing() {
  const { isConnected } = useAlgoFlowWallet();
  const { contractState } = useContractState();
  const { activeAddress } = useAlgoFlowWallet();

  const isEmployer = isConnected
    && contractState !== null
    && activeAddress === contractState.employer;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
      <h1 className="font-heading text-5xl tracking-tight mb-4">
        AlgoFlow
      </h1>
      <p className="text-lg text-text-light/70 max-w-md text-center">
        Real-time payroll streaming on Algorand. Continuous salary accrual
        with instant settlement.
      </p>
      <div className="mt-6">
        <WalletConnect />
      </div>
      {isConnected && (
        <div className="mt-8 flex gap-4">
          <a
            href={isEmployer ? '/employer' : '/employer'}
            className="px-6 py-3 rounded-lg bg-primary text-text-light font-medium hover:bg-primary-dark transition-colors"
          >
            Employer Dashboard
          </a>
          <a
            href="/employee"
            className="px-6 py-3 rounded-lg border border-text-light/20 text-text-light font-medium hover:bg-text-light/10 transition-colors"
          >
            Employee Dashboard
          </a>
        </div>
      )}
      {!isConnected && (
        <p className="mt-8 text-text-light/50 text-sm">
          Connect your wallet to access the dashboards.
        </p>
      )}
    </div>
  );
}

/**
 * Employer dashboard page.
 * Shows WalletConnect prompt if not connected.
 * Shows access denied if connected address is not the employer.
 * Renders the full EmployerDashboard when authorized.
 */
function EmployerPage() {
  const { isConnected, activeAddress } = useAlgoFlowWallet();
  const { contractState, isLoading } = useContractState();

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
        <p className="text-text-light/70">Loading contract state...</p>
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
        <p className="text-text-light/70">
          Your connected address is not the contract employer.
        </p>
        <a href="/employee" className="mt-6 text-stream-green hover:underline">
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
        <p className="text-text-light/70">Loading contract state...</p>
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
      <h1 className="font-heading text-4xl tracking-tight mb-4">
        Employee Dashboard
      </h1>
      <p className="text-text-light/70">
        View accrued salary and withdraw earnings.
      </p>
      <div className="mt-6">
        <WalletConnect />
      </div>
      <a href="/" className="mt-6 text-stream-green hover:underline">
        Back to Home
      </a>
    </div>
  );
}

/**
 * Root application component with route definitions.
 *
 * Routes:
 *   /          - Landing page
 *   /employer  - Employer dashboard
 *   /employee  - Employee dashboard
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/employer" element={<EmployerPage />} />
      <Route path="/employee" element={<EmployeePage />} />
    </Routes>
  );
}
