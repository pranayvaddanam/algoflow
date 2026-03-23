import { Routes, Route } from 'react-router-dom';

/**
 * Placeholder landing page.
 * Will be replaced with the full landing page in Sprint 2.
 */
function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
      <h1 className="font-heading text-5xl tracking-tight mb-4">
        AlgoFlow
      </h1>
      <p className="text-lg text-text-light/70 max-w-md text-center">
        Real-time payroll streaming on Algorand. Continuous salary accrual
        with instant settlement.
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/employer"
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
    </div>
  );
}

/**
 * Placeholder employer dashboard.
 * Will be replaced with EmployerDashboard component in Sprint 2.
 */
function EmployerPlaceholder() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
      <h1 className="font-heading text-4xl tracking-tight mb-4">
        Employer Dashboard
      </h1>
      <p className="text-text-light/70">
        Manage employees, fund payroll, and monitor streams.
      </p>
      <a href="/" className="mt-6 text-stream-green hover:underline">
        Back to Home
      </a>
    </div>
  );
}

/**
 * Placeholder employee dashboard.
 * Will be replaced with EmployeeDashboard component in Sprint 2.
 */
function EmployeePlaceholder() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-text-light">
      <h1 className="font-heading text-4xl tracking-tight mb-4">
        Employee Dashboard
      </h1>
      <p className="text-text-light/70">
        View accrued salary and withdraw earnings.
      </p>
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
      <Route path="/employer" element={<EmployerPlaceholder />} />
      <Route path="/employee" element={<EmployeePlaceholder />} />
    </Routes>
  );
}
