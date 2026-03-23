/**
 * HowItWorks — 3-step architecture diagram for the landing page.
 *
 * Displays three glassmorphism cards with step numbers, icons, and
 * descriptions. Arrow connectors between steps. Uses CSS variables
 * for theming.
 */

const STEPS = [
  {
    number: 1,
    title: 'Employer Funds Contract',
    description:
      'The employer deploys a smart contract on Algorand and deposits PAYUSD salary tokens into the pool.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    number: 2,
    title: 'Salary Streams Every Second',
    description:
      'Salary accrues continuously based on the configured hourly rate. No manual payroll runs needed.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
  {
    number: 3,
    title: 'Withdraw Anytime',
    description:
      'Employees claim their accrued salary at any time with instant settlement. Fully transparent, on-chain.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
] as const;

/**
 * Arrow connector SVG between steps (horizontal on desktop, vertical on mobile).
 */
function StepArrow() {
  return (
    <div className="flex items-center justify-center">
      {/* Desktop: horizontal arrow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-6 h-6 text-text-light/30 hidden md:block"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </svg>
      {/* Mobile: vertical arrow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-6 h-6 text-text-light/30 md:hidden"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
      </svg>
    </div>
  );
}

/**
 * Three-step "How It Works" diagram for the landing page.
 */
export function HowItWorks() {
  return (
    <section className="w-full max-w-4xl mx-auto">
      <h2 className="font-heading text-2xl tracking-tight text-center mb-8 text-text-light">
        How It Works
      </h2>
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-3">
        {STEPS.map((step, index) => (
          <div key={step.number} className="contents">
            {/* Step card */}
            <div className="glass rounded-2xl p-6 flex-1 flex flex-col items-center text-center min-w-0 max-w-xs">
              {/* Step number */}
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-4">
                <span className="text-primary font-mono text-sm font-bold">
                  {step.number}
                </span>
              </div>

              {/* Icon */}
              <div className="text-stream-green mb-3">
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="font-heading text-lg tracking-tight text-text-light mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-text-light/60 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Arrow (not after last step) */}
            {index < STEPS.length - 1 && <StepArrow />}
          </div>
        ))}
      </div>
    </section>
  );
}
