/**
 * RoleSelector — role selection cards for the landing page.
 *
 * Displays two glassmorphism cards:
 *   - "I'm an Employer" (green primary, links to /employer)
 *   - "I'm an Employee" (outlined, links to /employee)
 *
 * If the wallet is not connected, clicking a card triggers the wallet
 * connection flow first, then navigates after successful connection.
 */

import { useNavigate } from 'react-router-dom';

import { useAlgoFlowWallet } from '../hooks/useWallet';
import { cn } from '../lib/utils';

/**
 * Two-card role selector for routing to employer or employee dashboards.
 */
export function RoleSelector() {
  const { isConnected } = useAlgoFlowWallet();
  const navigate = useNavigate();

  function handleSelect(role: 'employer' | 'employee') {
    if (!isConnected) {
      // Scroll to wallet connect section — the Landing page shows
      // the WalletConnect component. Focus user attention on connecting first.
      const walletSection = document.getElementById('wallet-connect-section');
      if (walletSection) {
        walletSection.scrollIntoView({ behavior: 'smooth' });
        walletSection.classList.add('ring-2', 'ring-stream-green', 'ring-offset-2', 'ring-offset-bg-dark');
        setTimeout(() => {
          walletSection.classList.remove('ring-2', 'ring-stream-green', 'ring-offset-2', 'ring-offset-bg-dark');
        }, 2000);
      }
      return;
    }

    navigate(role === 'employer' ? '/employer' : '/employee');
  }

  return (
    <section className="w-full max-w-2xl mx-auto">
      <h2 className="font-heading text-2xl tracking-tight text-center mb-6 text-text-light">
        Get Started
      </h2>

      {!isConnected && (
        <p className="text-center text-text-light/50 text-sm mb-6">
          Connect your wallet above to access the dashboards.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Employer card */}
        <button
          type="button"
          onClick={() => handleSelect('employer')}
          className={cn(
            'glass rounded-2xl p-6 text-left transition-all duration-200',
            'hover:border-primary/50 hover:bg-primary/5',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'group cursor-pointer',
          )}
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="font-heading text-xl tracking-tight text-text-light mb-2">
            I'm an Employer
          </h3>

          {/* Description */}
          <p className="text-sm text-text-light/50 leading-relaxed mb-4">
            Fund payroll contracts, register employees, manage salary streams, and send milestone payments.
          </p>

          {/* CTA */}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:text-stream-green transition-colors">
            Go to Dashboard
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        {/* Employee card */}
        <button
          type="button"
          onClick={() => handleSelect('employee')}
          className={cn(
            'glass rounded-2xl p-6 text-left transition-all duration-200',
            'hover:border-stream-green/50 hover:bg-stream-green/5',
            'focus:outline-none focus:ring-2 focus:ring-stream-green/50',
            'group cursor-pointer',
          )}
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-stream-green/10 border border-stream-green/20 flex items-center justify-center mb-4 group-hover:bg-stream-green/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-stream-green">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="font-heading text-xl tracking-tight text-text-light mb-2">
            I'm an Employee
          </h3>

          {/* Description */}
          <p className="text-sm text-text-light/50 leading-relaxed mb-4">
            View your real-time salary accrual, withdraw earnings instantly, and track your payment history.
          </p>

          {/* CTA */}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-stream-green group-hover:text-text-light transition-colors">
            View My Stream
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  );
}
