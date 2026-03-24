 AlgoFlow — Judge Talking Points

    30-Second Elevator Pitch

    "AlgoFlow is a real-time payroll streaming platform on Algorand. Employers fund a
    smart contract with salary tokens, and employees earn money every second — not
    every two weeks. They can withdraw anytime with instant settlement. Think of it
    like Sablier or Superfluid, but built natively on Algorand with sub-cent fees and
    3-second finality."

    ---
    The Idea (Why This Matters)

    Problem: Traditional payroll is batched (biweekly/monthly). Workers wait weeks for
    money they've already earned. DAOs and remote teams need programmable, transparent,
     continuous compensation.

    Solution: AlgoFlow streams salary tokens continuously using math-based accrual. No
    transactions every second — the contract calculates what's owed on withdrawal using
     rate × elapsed_time / 3600. Employees withdraw whenever they want, the contract
    computes the exact amount, and sends tokens via inner transactions.

    Algorand advantage: Native ASAs (no ERC-20 overhead), ~3.3s finality, $0.001 fees,
    atomic transaction groups, and inner transactions for trustless payouts.

    ---
    Features — From Two Perspectives

    Employer (Raj the DAO Treasury Manager)

    - Connect wallet → deploy payroll contract
    - Create PAYUSD salary token (stablecoin analog, $1 = 1 PAYUSD)
    - Fund the contract pool with tokens
    - Register employees with hourly rates ($100/hr, $75/hr, etc.)
    - Live employee list — see everyone's rate, status, real-time accrued amount
    - Pause/resume individual streams (e.g., employee on leave)
    - Update rates with automatic settlement at old rate
    - Send one-time milestone bonus payments
    - Emergency pause — freeze all streams instantly
    - Contract health panel — pool balance, runway indicator, low-fund warnings
    - Remove employees with automatic final payout

    Employee (Alice the Remote Contractor)

    - Connect wallet → see salary streaming in real-time (counter ticking every second)
    - One-click withdrawal — claim everything earned so far, instantly
    - Transaction history with Algorand explorer links
    - Rate display in multiple units: $/hr, $/day, $/week, $/month
    - Status badges (Active, Paused, rate change notifications)

    Safety Features

    - Overdraft protection — if pool runs low, sends what's available and auto-pauses
    - Minimum withdrawal — prevents spam (0.001 PAYUSD minimum)
    - Authorization — every method validates the caller (employer vs employee)
    - Atomic transactions — multi-step operations all succeed or all fail

    ---
    Progress — What's Built Today

    Backend (COMPLETE ✅)

    - Smart contract: 12 ABI methods, fully implemented in Algorand Python (algopy)
      - create, opt_in_asset, fund, register_employee, withdraw, get_accrued,
    update_rate, pause_stream, resume_stream, remove_employee, milestone_pay, pause_all
    - 37 passing tests (33 unit + 4 integration) running against real LocalNet
    - Deployment scripts: One command deploys everything (token + contract + clawback +
     funding)
    - Account setup script: Registers 3 test employees at different rates
    - Contract deployed and verified on LocalNet with live streaming

    Frontend (SCAFFOLD DONE, IMPLEMENTATION STARTING)

    - React 19 + TypeScript + Vite + Tailwind CSS v4 — project scaffolded, builds clean
    - Type definitions, utility functions, Algod client setup — all done
    - Three placeholder routes: / (landing), /employer, /employee
    - Sprint 2 (in progress): Building the full Employer Dashboard — wallet connection,
     forms, employee list, health panel

    Not Built Yet

    - Employer Dashboard UI components (Sprint 2 — starting now)
    - Employee Dashboard + streaming counter (Sprint 3)
    - Landing page with "How It Works" diagram (Sprint 3)
    - Testnet deployment + Pera Wallet + design polish (Sprint 4)

    ---
    Tomorrow's Plan

    - Today remaining: Complete Employer Dashboard (wallet connect, fund form, register
     form, employee list with live management, milestone payments, emergency controls)
    - Tomorrow morning: Employee Dashboard with the signature real-time streaming
    counter (the "wow" demo moment), withdrawal flow, transaction history
    - Tomorrow afternoon: Landing page, shared UX (loading states, toasts, error
    handling), demo scripts
    - Tomorrow evening: Deploy to Algorand Testnet, design polish (dark glassmorphism
    theme, 3D animated background), demo rehearsal

    ---
    Workflow Architecture (How the Build is Structured)

    We use Maestro, an AI orchestration system that structures work like a software
    team:

    1. Planning Phase (completed): Generated 44 planning artifacts — PRD with 47
    functional requirements, architecture doc with 9 ADRs, data model, screen map with
    wireframes, sprint plan
    2. Execution Phase (in progress): 5 sprints, 22 stories
      - Sprint 0 ✅ — Scaffold (AlgoKit + React project setup)
      - Sprint 1 ✅ — Smart contract (all 12 methods + tests + deploy scripts)
      - Sprint 2 🔄 — Employer Dashboard (wallet + forms + management)
      - Sprint 3 — Employee Dashboard + landing page + demo scripts
      - Sprint 4 — Testnet deploy + design polish + stretch goals

    Each sprint has stories with acceptance criteria. Each story gets assigned to an AI
     agent that implements, tests, and reports back. Quality gates verify compilation,
    tests, and type checks between waves.

    Key metric: Sprint 0+1 produced 37 passing tests across 3,600+ lines of
    implementation code — all verified against real Algorand LocalNet.

    ---
    Tech Stack (Quick Reference)

    ┌─────────────────┬───────────────────────────────────────────────────┐
    │      Layer      │                       Tech                        │
    ├─────────────────┼───────────────────────────────────────────────────┤
    │ Smart Contracts │ Algorand Python (algopy) → AVM bytecode           │
    ├─────────────────┼───────────────────────────────────────────────────┤
    │ Token           │ PAYUSD (ASA, 6 decimals, $1 stablecoin analog)    │
    ├─────────────────┼───────────────────────────────────────────────────┤
    │ SDK             │ py-algorand-sdk + algokit-utils                   │
    ├─────────────────┼───────────────────────────────────────────────────┤
    │ Frontend        │ React 19, TypeScript, Vite, Tailwind CSS 4        │
    ├─────────────────┼───────────────────────────────────────────────────┤
    │ Wallet          │ @txnlab/use-wallet-react (KMD + Pera)             │
    ├─────────────────┼───────────────────────────────────────────────────┤
    │ Design          │ Dark theme, glassmorphism, Three.js 3D background │
    ├─────────────────┼───────────────────────────────────────────────────┤
    │ Testing         │ pytest (contract), 37 tests passing               │
    ├─────────────────┼───────────────────────────────────────────────────┤
    │ Network         │ LocalNet (dev) → Testnet (demo)                   │
    └─────────────────┴───────────────────────────────────────────────────┘
