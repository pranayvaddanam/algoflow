# SESSION HANDOFF -- AlgoFlow Planning to Execution

<!-- THIS IS THE AUTHORITATIVE HANDOFF DOCUMENT -->
<!-- The Maestro Executor MUST read this file FIRST at session start -->
<!-- Generated: 2026-03-23 -->
<!-- Pipeline: maestro-plan -->
<!-- Run ID: 2026-03-23-algoflow-planning -->

---

## Section 1: Pipeline Overview

| Field | Value |
|-------|-------|
| Pipeline Name | maestro-plan |
| Run ID | 2026-03-23-algoflow-planning |
| Project Name | AlgoFlow |
| Completion Timestamp | 2026-03-23 (planning complete, execution not started) |
| Overall Verdict | **PASS** -- all auditors passed, all quality gates passed |

### Phases Completed

| Phase | Name | Status | Quality Gate | Agents |
|-------|------|--------|-------------|--------|
| P0 | Research & Master Planning | Completed | 8/8 passed | 5 |
| P1 | Product Requirements Document | Completed | 8/8 passed | 4 |
| P2 | Architecture & Data Model | Completed | 5/5 passed | 2 |
| P3 | Screen Map & Wireframes | Completed | 4/4 passed | 1 |
| P4 | Sprint Planning | Completed | 3/3 passed | 1 |
| P5 | Readiness Audits | Completed | 17/17 passed | 3 auditors |

**Total agents spawned**: 13 (across P0-P4) + 3 auditors (P5) = 16
**Total artifacts produced**: 44 files, ~11,865 total lines
**Total quality checks passed**: 45/45

---

## Section 2: Project Summary

### What AlgoFlow Is

AlgoFlow is a decentralized payroll streaming platform built on the Algorand blockchain. Employers fund a smart contract with tokenized salary units (PAYUSD, an Algorand Standard Asset analogous to USDT), which stream continuously to employees -- accruing every second based on an hourly rate. Employees withdraw their accrued earnings at any time with instant settlement via inner transactions. The platform features a dual-dashboard frontend (employer and employee views), real-time streaming counter, milestone-based bonus payments, emergency pause controls, and full on-chain auditability. It is the first programmable payroll streaming protocol on Algorand, competing conceptually with Ethereum-based Sablier and Superfluid but leveraging Algorand's instant finality, sub-$0.001 fees, native ASAs, and atomic batch operations.

### Target Users

**Raj (DAO Treasury Manager)**: Manages treasury and contributor payments for a 50-person DAO. Needs to automate payments, reduce overhead, provide real-time visibility. High tech savviness. Key workflow: fund contract, register employees, monitor streams, manage rates, handle departures.

**Alice (Remote Contractor)**: Smart contract developer working for 2-3 DAOs. Wants continuous pay, instant withdrawal, earnings tracking. High tech savviness. Key workflow: connect wallet, view accrual, withdraw, check history, monitor rate changes.

### Hackathon Context

- **Event**: Infinova Hackathon -- Blockchain with Algorand track, Option 1
- **Build window**: 48 hours (treating as aggressive build window)
- **Team**: Solo builder, 1.5 years experience, medium-level engineer
- **First time with Algorand**: Never deployed a contract before
- **Judging priority**: Demo > Innovation > Technical Depth > Presentation (lowest)
- **Demo is the #1 priority**: Every design decision optimizes for a smooth, impressive 3-minute live demo
- **Fallback**: Automated Python demo script if live UI demo fails

---

## Section 3: Authoritative File Index

The executor MUST read these files at session start. This is NOT optional.

### Tier 1: Read FIRST (governance documents)

| # | File | Lines | Authority Level | Purpose |
|---|------|-------|----------------|---------|
| 1 | `orchestrator/runs/2026-03-23-algoflow-planning/SESSION-HANDOFF.md` | ~550 | **PRIMARY** -- this file | Handoff contract between planning and execution |
| 2 | `CLAUDE.md` | 623 | **PRIMARY** | Project conventions, coding standards, all mandatory rules |
| 3 | `sprints/sprint-plan.md` | 258 | **PRIMARY** | Sprint definitions, story lists, FR coverage matrix |
| 4 | `sprints/sprint-status.yaml` | 247 | **PRIMARY** | Story status tracker (update this as you complete stories) |

### Tier 2: Read BEFORE implementing each sprint

| # | File | Lines | Authority Level | Purpose |
|---|------|-------|----------------|---------|
| 5 | `docs/01-prd.md` | 1,089 | **AUTHORITATIVE** | Canonical FR definitions with acceptance criteria |
| 6 | `docs/02-architecture.md` | 1,335 | **AUTHORITATIVE** | Architecture, component hierarchy, ADRs |
| 7 | `docs/03-data-model.md` | 716 | **AUTHORITATIVE** | On-chain state schema, off-chain state, validation rules |
| 8 | `docs/04-screen-map.md` | 1,012 | **AUTHORITATIVE** | UI wireframes, component state tables, user flows |
| 9 | `docs/00-master-plan.md` | 644 | **REFERENCE** | Master plan (use for context, not as FR source) |

### Tier 3: Read BEFORE implementing each story

| # | Files | Total Lines | Purpose |
|---|-------|-------------|---------|
| 10-31 | `sprints/stories/STORY-{S}-{N}.md` (22 files) | 1,166 | Individual story specs with FRs, ACs, components |

### Tier 4: Research/Historical (read only if needed for context)

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 32 | `docs/research/technical-analysis.md` | 845 | Algorand Python, AlgoKit, algosdk reference |
| 33 | `docs/research/market-analysis.md` | 266 | Competitive landscape |
| 34 | `docs/research/requirements-gaps.md` | 349 | Requirements analysis (some counts historical) |
| 35 | `docs/research/ambiguity-resolutions.md` | 195 | Resolved ambiguities |
| 36 | `docs/research/user-value-audit.md` | 183 | User value scores |
| 37 | `docs/research/docs-sync-audit.md` | 369 | Documentation sync issues (all resolved) |
| 38-40 | `docs/prd-sections/*.md` | 1,088 | PRD sub-documents (canonical versions in 01-prd.md) |
| 41-43 | `docs/readiness/*.md` | 1,129 | P5 audit reports |
| 44 | `orchestrator/runs/.../telemetry.yaml` | 351 | Pipeline telemetry and decisions |

---

## Section 4: Current State Summary

All numbers in one place. These are the canonical counts.

### Contract Methods

| Type | Count | Methods |
|------|-------|---------|
| MVP (P0) | 12 | `create`, `opt_in_asset`, `fund`, `register_employee`, `withdraw`, `get_accrued`, `update_rate`, `pause_stream`, `resume_stream`, `remove_employee`, `milestone_pay`, `pause_all` |
| STRETCH (P1) | 2 | `resume_all`, `drain_funds` |
| **Total** | **14** | |

### Functional Requirements

| Category | P0 (MVP) | P1 (STRETCH) | Total |
|----------|----------|--------------|-------|
| CONTRACT | 14 | 3 | 17 |
| TOKEN | 4 | 0 | 4 |
| EMPLOYER | 9 | 1 | 10 |
| EMPLOYEE | 5 | 0 | 5 |
| SHARED | 7 | 0 | 7 |
| DEVOPS | 3 | 1 | 4 |
| **TOTAL** | **42** | **5** | **47** |

### Non-Functional Requirements

| Category | Count |
|----------|-------|
| PERF | 5 |
| SEC | 5 |
| REL | 4 |
| UX | 4 |
| BC | 5 |
| TEST | 4 |
| **TOTAL** | **27** |

### Sprints and Stories

| Metric | Value |
|--------|-------|
| Sprints | 5 (Sprint 0 through Sprint 4) |
| Total stories | 22 |
| Complexity: Small | 2 |
| Complexity: Medium | 8 |
| Complexity: Large | 12 |
| Total estimated hours | 33-42 |
| Acceptance criteria (total) | 159 |

### On-Chain State

| Type | Count |
|------|-------|
| Global state keys | 5 (employer, salary_asset, total_employees, total_streamed, is_paused) |
| Local state keys (per employee) | 5 (salary_rate, stream_start, last_withdrawal, total_withdrawn, is_active) |
| ASA properties | 5 (name, unit, decimals, supply, clawback) |
| Frontend routes | 3 (/, /employer, /employee) |
| Frontend components | 25+ (see 02-architecture.md for full list) |
| Frontend hooks | 4 (useWallet, usePayrollContract, useStreamAccrual, useContractState) |

---

## Section 5: Sprint Summary

### Sprint 0 -- Scaffold & Environment

| Field | Value |
|-------|-------|
| Goal | Establish development environment, project skeleton, verify LocalNet and compilation |
| Stories | STORY-0-001 (Project scaffold, M), STORY-0-002 (Frontend scaffold, M) |
| Estimated hours | 3-4 |
| FRs covered | None (infrastructure) |
| Key deliverables | AlgoKit project init, empty PayrollStream class compiles, React+Vite+Tailwind dev server running, .env.example, .gitignore, pytest runs |
| Exit criteria | (1) `algokit localnet start` healthy (2) Empty contract compiles (3) `npm run dev` renders placeholder (4) .env.example complete (5) .gitignore correct (6) pytest runs without import errors |
| Risk | LOW |

### Sprint 1 -- Smart Contract & Token Infrastructure

| Field | Value |
|-------|-------|
| Goal | Implement all 12 MVP contract methods, create PAYUSD token, deployment scripts, pytest suite |
| Stories | STORY-1-001 (Token, M), STORY-1-002 (Core contract, L), STORY-1-003 (Streaming engine, L), STORY-1-004 (Stream management, L), STORY-1-005 (Opt-in + deploy scripts, M) |
| Estimated hours | 10-12 |
| FRs covered | FR-CONTRACT-001 through 014, FR-TOKEN-001 through 004, FR-DEVOPS-001, FR-DEVOPS-002 (20 FRs) |
| Key deliverables | contract.py with 12 methods, deploy.py, fund_accounts.py, 12+ pytest tests, contract deployed on LocalNet with 3 employees streaming |
| Exit criteria | (1) 12 MVP methods implemented (2) Compiles successfully (3) pytest passes 12+ tests (4) Deploy script works on LocalNet (5) Fund script funds 3 employees (6) 3 employees streaming |
| Risk | MEDIUM -- Algorand Python compiler quirks with inner transactions |

### Sprint 2 -- Employer Dashboard

| Field | Value |
|-------|-------|
| Goal | Complete employer dashboard: wallet, fund, register, manage, milestone, emergency, health, checklist |
| Stories | STORY-2-001 (Frontend foundation, M), STORY-2-002 (Wallet + hooks, L), STORY-2-003 (Fund + register, L), STORY-2-004 (Employee list + management, L), STORY-2-005 (Milestone + emergency + health + checklist, L) |
| Estimated hours | 8-10 |
| FRs covered | FR-EMPLOYER-001 through 009 (9 FRs) |
| Key deliverables | Types, constants, algorand client, useWallet hook, usePayrollContract hook, FundForm, RegisterForm, EmployeeList, EmployeeRow, MilestonePayForm, EmergencyControls, ContractHealth, SetupChecklist |
| Exit criteria | (1) Wallet connects (KMD) (2) Fund contract works (3) Register single + batch (4) Employee list live (5) Pause/resume/update/remove (6) Milestone pay (7) Emergency pause-all (8) Health panel (9) Checklist (10) tsc --noEmit passes |
| Risk | MEDIUM -- wallet integration debugging |

### Sprint 3 -- Employee Dashboard, Landing, Shared UX, Demo

| Field | Value |
|-------|-------|
| Goal | Employee dashboard with streaming counter, landing page, shared UX, demo scripts |
| Stories | STORY-3-001 (StreamCounter + hook, L), STORY-3-002 (Employee dashboard, L), STORY-3-003 (Landing + routing, M), STORY-3-004 (Shared UX, L), STORY-3-005 (Demo scripts, M) |
| Estimated hours | 8-10 |
| FRs covered | FR-EMPLOYEE-001 through 005, FR-SHARED-001 through 007, FR-DEVOPS-003 (13 FRs) |
| Key deliverables | StreamCounter (1Hz tick), WithdrawButton, TransactionHistory, RateDisplay, StatusBadge, Landing, HowItWorks, RoleSelector, Toast, ExplorerLink, NetworkBadge, loading states, error handling, demo.py, reset.py |
| Exit criteria | (1) Counter ticks every second (2) Withdraw works (3) History with explorer links (4) Rate in $/hr, $/day, $/week, $/month (5) Landing page (6) Role routing (7) Loading spinners (8) Error messages (9) Success toasts (10) Network badge (11) demo.py 9-step flow (12) reset.py clean state |
| Risk | MEDIUM -- StreamCounter sync with on-chain state |

### Sprint 4 -- Polish, Testnet Deploy, Stretch Goals

| Field | Value |
|-------|-------|
| Goal | Deploy to Testnet, design polish, timezone handling, stretch features if time, demo rehearsal |
| Stories | STORY-4-001 (Testnet + Pera, M), STORY-4-002 (Design polish, L), STORY-4-003 (Timezone + rate polish, S), STORY-4-004 (Stretch: resume_all, drain_funds, CSV, M), STORY-4-005 (Demo rehearsal, S) |
| Estimated hours | 4-6 |
| FRs covered | FR-SHARED-007 (primary), FR-CONTRACT-015/016/017, FR-EMPLOYER-010, FR-DEVOPS-004 (all STRETCH) |
| Key deliverables | Testnet deployment, Pera Wallet connection, Silk 3D background, SpotlightCard, ShinyText, glassmorphism, timezone conversion, (stretch) resume_all, drain_funds |
| Exit criteria | (1) Contract on Testnet (2) Pera connects (3) Dark theme + effects (4) Local timezone display (5) Demo < 3 minutes (6) Zero crashes (7) STRETCH: resume_all + drain_funds if time |
| Risk | LOW-MEDIUM -- timebox design polish to 2 hours |

---

## Section 6: Architecture Summary

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Algorand Python (algopy) -- typed Python compiled to AVM bytecode |
| Tooling | AlgoKit CLI 2.10.2 |
| SDK | py-algorand-sdk (algosdk) |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 |
| 3D/Animation | Three.js (Silk), Motion (shimmer/transitions) |
| Wallet | @txnlab/use-wallet-react -- KMD (LocalNet) + Pera (Testnet) |
| Network (dev) | AlgoKit LocalNet (Docker) |
| Network (demo) | Algorand Testnet |
| Testing | pytest (contracts), Vitest (frontend) |

### Smart Contract: PayrollStream (ARC4Contract)

**12 MVP methods**: create, opt_in_asset, fund, register_employee, withdraw, get_accrued, update_rate, pause_stream, resume_stream, remove_employee, milestone_pay, pause_all

**2 STRETCH methods**: resume_all, drain_funds

**Global state** (5 keys): employer (Account), salary_asset (Asset), total_employees (UInt64), total_streamed (UInt64), is_paused (UInt64)

**Local state** (5 keys per employee): salary_rate (UInt64), stream_start (UInt64), last_withdrawal (UInt64), total_withdrawn (UInt64), is_active (UInt64)

**Streaming math**: `accrued = salary_rate * (current_timestamp - last_withdrawal) / 3600`
- Integer division only (no floats on AVM)
- salary_rate in base units (6 decimals) per hour
- Timestamps are Unix epoch seconds from Global.latest_timestamp

**Overdraft protection**: If contract balance < accrued, send available balance and set is_active = 0

### Frontend: 3 Routes

| Route | Page | Components |
|-------|------|-----------|
| `/` | Landing | Silk, HowItWorks, RoleSelector |
| `/employer` | Employer Dashboard | SetupChecklist, ContractHealth, EmployeeList, EmployeeRow, RegisterForm, FundForm, MilestonePayForm, EmergencyControls |
| `/employee` | Employee Dashboard | StreamCounter, WithdrawButton, RateDisplay, StatusBadge, TransactionHistory |

**Shared components**: WalletConnect, NetworkBadge, SpotlightCard, ShinyText, Toast, ExplorerLink

**Hooks**: useWallet, usePayrollContract, useStreamAccrual, useContractState

**Note**: 02-architecture.md is the authoritative component list (25+ components). CLAUDE.md lists only 10 (simplified overview).

### Wallet Architecture

```
@txnlab/use-wallet-react
  KMD Provider  --> LocalNet (localhost:4002, AlgoKit default token)
  Pera Provider --> Testnet (WalletConnect, ARC-0001 compliant)

useWallet() returns: activeAddress, providers, signTransactions, isConnected
```

Same hook for both networks. Zero code changes between LocalNet and Testnet.

### Role Detection

1. User connects wallet -> activeAddress available
2. Frontend queries contract global state for "employer" key
3. If activeAddress === employer -> redirect to /employer
4. Else -> redirect to /employee
5. Fallback: manual toggle on landing page

---

## Section 7: Key Conventions

These are extracted from CLAUDE.md. The full CLAUDE.md is 623 lines -- read it completely. Below are the most critical conventions.

### Contract Code

- ALL contracts MUST use Algorand Python (`algopy`). ZERO PyTeal. ZERO raw TEAL.
- Class: `class PayrollStream(ARC4Contract)`
- Methods: `@arc4.abimethod` decorators
- Helpers: `@algopy.subroutine` for internal functions
- Auth: ALWAYS validate `Txn.sender == self.employer` on employer methods
- Inner transactions: Use typed `itxn.AssetTransfer(...)` builders
- Errors: Use `assert` with clear messages

### SDK Code (algosdk)

- Client setup: Use environment variables, never hardcode
- Transactions: Use typed classes (AssetCreateTxn, AssetTransferTxn, etc.)
- Atomic groups: ALWAYS use `assign_group_id(txns)`
- Confirmation: ALWAYS call `wait_for_confirmation()` after send

### React/TypeScript

- Component order: imports, props type, function, hooks, state, derived, effects, handlers, render
- Naming: PascalCase components, camelCase hooks (use prefix), SCREAMING_SNAKE constants
- Addresses: ALWAYS truncate to `${addr.slice(0,6)}...${addr.slice(-4)}`
- Amounts: ALWAYS convert from base units: `baseUnits / Math.pow(10, decimals)`
- Event handlers: `handle` prefix (handleWithdraw, handleConnect)
- Boolean state: `is`/`has`/`can` prefix (isConnected, hasEmployees)

### File Naming

- Smart contracts: snake_case.py
- Tests: test_*.py
- React components: PascalCase.tsx
- Hooks: camelCase.ts with `use` prefix
- CSS: PascalCase.css matching component
- Utils/lib: camelCase.ts

### PAYUSD Display Rules

- 1 PAYUSD = $1.00 (stablecoin analog)
- Display with "$" prefix in UI
- 6 decimal places (1,000,000 base units = 1.000000 PAYUSD = $1.00)
- Multi-unit rate display: $/hr, $/day, $/week, $/month simultaneously

### Timezone Handling

- On-chain: Unix epoch seconds (UTC) from Global.latest_timestamp
- Frontend: Browser Intl API detects timezone
- Display: All times in local timezone (e.g., "Mar 23, 2026 11:30 AM IST")
- Cache: Timezone preference in localStorage

### Import Order

**Python**: (1) Standard library (2) Third-party (algosdk) (3) AlgoKit utils (4) Local project

**TypeScript**: (1) React/external (2) Local hooks/utils (3) Types (4) Styles

### Git Conventions

- Branch naming: feat/, fix/, docs/, test/ prefixes
- Commit messages: Present tense, imperative mood
- NEVER commit: .env, mnemonics, private keys, node_modules, __pycache__, .venv

---

## Section 8: Key Decisions

All 18 decisions made during planning. These are binding.

| DEC-ID | Decision | Impact |
|--------|----------|--------|
| DEC-001 | Use Algorand Python (algopy), not PyTeal | All contract code uses algopy imports. Zero tolerance for PyTeal. |
| DEC-002 | Use AlgoKit CLI for tooling | Scaffolding, compilation, deployment, localnet all via AlgoKit. |
| DEC-003 | React 19 + Vite + Tailwind for frontend | Best Algorand wallet ecosystem. Matches AlgoGate aesthetic. |
| DEC-004 | Frontend built AFTER smart contract infra | Contracts first (Sprint 0-1), then frontend (Sprint 2-4). |
| DEC-005 | Project name: AlgoFlow | Used everywhere. Do not rename. |
| DEC-006 | Two separate dashboards (employer + employee) | /employer and /employee routes. More impressive for judges. |
| DEC-007 | Dark theme with AlgoGate SDK aesthetic | Glassmorphism, spotlight cards, Silk 3D background, shimmer text. |
| DEC-008 | Automated demo script as fallback | scripts/demo.py runs full 9-step flow if live demo fails. |
| DEC-009 | Rekeying as bombshell STRETCH feature | Only attempt after ALL MVP complete. Sprint 4 STORY-4-004. |
| DEC-010 | LocalNet for dev, Testnet for final demo | Use LocalNet throughout development. Deploy to Testnet once in Sprint 4. |
| DEC-011 | Milestone payments in MVP | milestone_pay() is a P0 method. Problem statement mentions milestones. |
| DEC-012 | PAYUSD displayed as $1 stablecoin | Dollar signs in UI. "AlgoFlow USD", unit "PAYUSD", 6 decimals. |
| DEC-013 | @txnlab/use-wallet-react with KMD + Pera | Same useWallet() hook for both networks. Zero code changes. |
| DEC-014 | UTC on-chain, local time in frontend | Browser Intl API. All displayed times converted to local. |
| DEC-015 | Multi-unit rate display | $/hr, $/day, $/week, $/month shown simultaneously for employees. |
| DEC-016 | resume_stream, remove_employee, pause_all promoted to MVP | Was STRETCH. User value audit found CRITICAL gaps without them. Now P0. |
| DEC-017 | Low-fund warning + setup checklist added | User value audit recommendations. ContractHealth + SetupChecklist components. |
| DEC-018 | "New" badge for employee status changes | localStorage-based last-visit comparison. StatusBadge component. |

---

## Section 9: Risks and Mitigations

### Top 5 Risks for Execution

| # | Risk | L | I | Mitigation | Sprint |
|---|------|---|---|------------|--------|
| 1 | **Algorand Python compiler bugs** block contract development (inner transactions, local state patterns) | Med | High | Test each method immediately after writing. Do not batch-write. Use Context7 docs for algopy reference. Keep methods simple. | Sprint 1 |
| 2 | **Pera Wallet fails** during live demo | Med | High | KMD fallback available on LocalNet. Pre-connect wallet before demo. Test connection 5 minutes before presentation. | Sprint 4 |
| 3 | **Wallet integration debugging** delays Sprint 2 | Med | Med | Build wallet connection (STORY-2-002) FIRST in Sprint 2. Verify it works before building any forms. All forms depend on signing. | Sprint 2 |
| 4 | **Design polish expands unboundedly** | Med | Med | Timebox to 2 hours max. Port AlgoGate components (Silk, SpotlightCard, ShinyText) -- they are self-contained. Do not custom-design. | Sprint 4 |
| 5 | **Demo exceeds 3-minute window** | Med | Med | Practice the 9-step sequence at least twice (STORY-4-005). Use demo.py script for consistent timing. Cut bonus step if over time. | Sprint 4 |

### Additional Risks (Lower Priority)

| # | Risk | Mitigation |
|---|------|------------|
| 6 | MBR miscalculation | Fund accounts with 10 ALGO each in setup script |
| 7 | Testnet faucet limit (10 ALGO/day) | Deploy to Testnet once only, not iteratively |
| 8 | Indexer unavailable for tx history | Cache recent txns in frontend state; history is secondary for demo |
| 9 | Rekeying complexity derails schedule | STRETCH only. Only attempt after ALL MVP tested. |
| 10 | Contract opcode budget exceeded | Simple math ops, well within 700 budget. Monitor during testing. |

---

## Section 10: Startup Instructions for Executor

This is the exact sequence of actions for the next session. Follow it precisely.

### Phase A: Context Loading (MANDATORY -- do not skip)

```
Step 1: Read this file (SESSION-HANDOFF.md) -- you are doing this now
Step 2: Read CLAUDE.md (623 lines) -- ALL coding conventions, design system, project structure
Step 3: Read sprints/sprint-plan.md (258 lines) -- sprint definitions, FR coverage matrix
Step 4: Read sprints/sprint-status.yaml (247 lines) -- current status of all 22 stories
Step 5: Read ALL story files for Sprint 0:
        - sprints/stories/STORY-0-001.md (57 lines)
        - sprints/stories/STORY-0-002.md (56 lines)
```

### Phase B: Sprint 0 Execution

```
Step 6:  Update sprint-status.yaml: sprint-0 status -> "in_progress"
Step 7:  Update STORY-0-001 status -> "in_progress"
Step 8:  Execute STORY-0-001: Project scaffold and AlgoKit initialization
         - Initialize AlgoKit project
         - Create project directory structure per CLAUDE.md
         - Create empty PayrollStream(ARC4Contract) class
         - Verify compilation: algokit compile python
         - Set up .env.example with all required keys
         - Set up .gitignore
         - Verify: algokit localnet start (if Docker available)
         - Verify: pytest runs without import errors
Step 9:  Update STORY-0-001 status -> "completed"
Step 10: Update STORY-0-002 status -> "in_progress"
Step 11: Execute STORY-0-002: Frontend scaffold
         - Initialize React 19 + TypeScript + Vite project in frontend/
         - Install Tailwind CSS 4
         - Create placeholder pages for /, /employer, /employee
         - Verify: npm run dev starts and renders
Step 12: Update STORY-0-002 status -> "completed"
Step 13: Verify Sprint 0 exit criteria (all 6 criteria from sprint-plan.md)
Step 14: Update sprint-status.yaml: sprint-0 status -> "completed"
```

### Phase C: Sprint 1 Execution

```
Step 15: Read ALL story files for Sprint 1:
         - sprints/stories/STORY-1-001.md through STORY-1-005.md
Step 16: Read docs/02-architecture.md (contract section)
Step 17: Read docs/03-data-model.md (state schema)
Step 18: Update sprint-status.yaml: sprint-1 status -> "in_progress"
Step 19: Execute stories in order: STORY-1-001 -> 1-002 -> 1-003 -> 1-004 -> 1-005
         - Test each contract method IMMEDIATELY after writing
         - Do not batch-write methods
Step 20: Verify Sprint 1 exit criteria (all 6 criteria)
Step 21: Update sprint-status.yaml: sprint-1 status -> "completed"
```

### Phase D: Sprint 2 Execution

```
Step 22: Read ALL story files for Sprint 2
Step 23: Read docs/04-screen-map.md (employer dashboard sections)
Step 24: Execute stories: STORY-2-001 -> 2-002 -> 2-003 -> 2-004 -> 2-005
         - Build wallet connection FIRST (STORY-2-002) and verify before forms
Step 25: Verify Sprint 2 exit criteria (all 10 criteria)
```

### Phase E: Sprint 3 Execution

```
Step 26: Read ALL story files for Sprint 3
Step 27: Read docs/04-screen-map.md (employee dashboard + landing sections)
Step 28: Execute stories: STORY-3-001 -> 3-002 -> 3-003 -> 3-004 -> 3-005
         - StreamCounter is the "wow" moment -- get the 1Hz tick right
Step 29: Verify Sprint 3 exit criteria (all 12 criteria)
```

### Phase F: Sprint 4 Execution

```
Step 30: Read ALL story files for Sprint 4
Step 31: Execute stories: STORY-4-001 -> 4-002 -> 4-003 -> 4-004 -> 4-005
         - Deploy to Testnet FIRST (STORY-4-001)
         - Timebox design polish to 2 hours (STORY-4-002)
         - STRETCH features only if time permits (STORY-4-004)
         - Demo rehearsal is MANDATORY (STORY-4-005)
Step 32: Verify Sprint 4 exit criteria (all 7 criteria)
```

### Sprint Status Update Protocol

After EACH story completion:
1. Update `sprints/sprint-status.yaml` with story status = "completed"
2. Set `completed_at` timestamp
3. Note any blockers encountered

After EACH sprint completion:
1. Verify ALL exit criteria from sprint-plan.md
2. Update sprint status to "completed"
3. Note any deviations or issues

### Hard Gates -- DO NOT PROCEED Without These

| Gate | Condition | Blocks |
|------|-----------|--------|
| G1 | Empty PayrollStream compiles | Sprint 1 cannot start |
| G2 | All 12 MVP methods pass pytest | Sprint 2 cannot start |
| G3 | Wallet connects and signs transactions | Sprint 2 forms cannot work |
| G4 | Employer dashboard fully functional on LocalNet | Sprint 3 cannot start |
| G5 | Full app working on LocalNet with demo script | Sprint 4 cannot start |
| G6 | Contract deployed to Testnet | Demo rehearsal cannot happen |

### Environment Prerequisites

The following must be true before Sprint 0 begins:

| Prerequisite | Expected | Verified |
|-------------|----------|----------|
| Python | 3.14.3 | Yes (user confirmed) |
| Node.js | 22.14.0 | Yes (user confirmed) |
| AlgoKit CLI | 2.10.2 | Yes (user confirmed) |
| Docker | 29.2.1 | Yes (user confirmed) |
| Devfolio account | Ready | Yes (user confirmed) |

---

## IMPORTANT REMINDERS

1. **The PRD (01-prd.md) is the authoritative FR source.** Not the master plan's numbered list.

2. **The architecture doc (02-architecture.md) is the authoritative component list.** Not CLAUDE.md's simplified project structure.

3. **The sprint plan (sprint-plan.md) defines exit criteria.** Every sprint must pass all exit criteria before proceeding.

4. **Update sprint-status.yaml after every story and sprint completion.** This is the live tracker.

5. **Demo is the #1 priority.** Every decision should optimize for a smooth, impressive 3-minute demo.

6. **This is a first-time Algorand project.** Expect compiler quirks. Test immediately. Do not batch work.

7. **NEVER commit .env files or mnemonics.** All secrets in environment variables only.

8. **FR-SHARED-007 (glassmorphism) is split across Sprint 3 + Sprint 4.** Sprint 3 does foundational dark theme; Sprint 4 does the polish effects (Silk, SpotlightCard, ShinyText).

9. **The 4 "flagged" stories (STORY-2-001, STORY-4-001, STORY-4-003, STORY-4-005) are infrastructure/polish/quality-gate stories.** They do not directly implement new FRs but are necessary. Do not skip them.

10. **STRETCH features (Sprint 4, STORY-4-004) are OPTIONAL.** Only attempt after ALL MVP is complete, tested, and demo-ready. If time is tight, skip entirely.

---

## Section 11: Implementation-Aware Warnings

These were identified by the final pre-execution audit. They don't require document changes but the implementing agent MUST be aware of them.

### W2: Schema Allocation (Deployment-Critical)
The global state schema must be declared as `4 uints, 1 byte-slice` (not `5 uints, 0 byte-slices`). The `employer` field is an Account type which is stored as a byte-slice on the AVM. Getting this wrong will cause a deployment failure.

### W4: MBR Funding Sequence
The contract account must be funded with ALGO (for MBR + inner transaction fees) BEFORE calling `opt_in_asset()`. The deployment script must:
1. Deploy contract → get app address
2. Fund app address with ~1 ALGO (covers MBR for ASA opt-in + inner txn fees)
3. Call `opt_in_asset()`
4. Fund with PAYUSD tokens

### W5: Employee ASA Opt-In Enforcement
The contract cannot programmatically verify that an employee has opted into the salary ASA before registration. The `register_employee()` method sets local state but doesn't confirm the employee can receive tokens. If the employee hasn't opted in and a withdrawal is attempted, the inner AssetTransfer will fail.

**Mitigation:** The frontend should verify the employee's ASA opt-in status before allowing registration. The demo setup script pre-opts-in all test employees.

### W6: Inner Transaction Fee Pooling
Methods that emit inner transactions (withdraw, update_rate, pause_stream, milestone_pay, resume_stream, remove_employee) require the outer transaction group to cover the inner transaction fees. The frontend must set `fee = 2 * min_fee` on the outer application call transaction, or include a fee-funding PaymentTxn in the atomic group.

### W7: Paused Employee Rate Update + Resume Interaction
If an employer calls `update_rate()` on a paused employee, then later calls `resume_stream()`, the `last_withdrawal` timestamp set by `update_rate` may be stale (it was set at rate-update time, not resume time). The `resume_stream()` method should reset `last_withdrawal` to `Global.latest_timestamp` to prevent erroneous accrual for the paused period. Verify this is handled in the contract implementation and add explicit test coverage.

### W8: Integer Division Remainder Loss
The accrual formula `rate * elapsed / 3600` uses integer division. At small elapsed times or low rates, the remainder is lost. For example, `rate=1000, elapsed=1` gives `1000 * 1 / 3600 = 0` (not 0.277). This is expected AVM behavior and is acceptable — amounts only become meaningful after several seconds of elapsed time. The frontend counter should display the calculated amount even when it's 0, so users understand streaming has started.

---

## Section 12: Prerequisite Verification Results

Verified on 2026-03-23:

| Prerequisite | Version | Status |
|---|---|---|
| Python | 3.14.3 | PASS |
| AlgoKit CLI | 2.10.2 | PASS |
| Docker | 29.2.1 | PASS (daemon must be started before `algokit localnet start`) |
| Node.js | 22.14.0 | PASS |
| npm | 10.9.2 | PASS |
| Git | Installed | PASS |
| Disk space | 11 GB free | WARNING — 95% used, monitor during build |

**Docker Note:** The Docker daemon may not be running at session start. The executor should run `docker info` to verify, and if it fails, prompt the user to start Docker Desktop before proceeding with `algokit localnet start`.

**Disk Note:** Only 11 GB free. The AlgoKit localnet Docker images require ~2-3 GB. Monitor disk space during npm install and Docker pulls.

---

## Section 13: Quick Reference Card

For fast access during implementation:

```
PROJECT:    AlgoFlow
TOKEN:      PAYUSD (6 decimals, 1 PAYUSD = $1, analogous to USDT)
ASSET NAME: AlgoFlow USD
NOTE PREFIX: algoflow:
CONTRACT:   PayrollStream (ARC4Contract)
ROUTES:     / (landing), /employer, /employee

MVP METHODS (12):
  create, opt_in_asset, fund, register_employee,
  withdraw, get_accrued, update_rate, pause_stream,
  milestone_pay, resume_stream, remove_employee, pause_all

STRETCH METHODS (2):
  resume_all, drain_funds

SPRINTS:
  0: Scaffold (3-4h)     → algokit init, localnet, skeleton
  1: Contract (10-12h)   → 12 methods, ASA, tests, deploy
  2: Employer (8-10h)    → dashboard, fund, register, manage
  3: Employee (8-10h)    → counter, withdraw, history, demo
  4: Polish (4-6h)       → testnet, design, stretch

WALLET:
  LocalNet → KMD provider (no popup, instant signing)
  Testnet  → Pera Wallet provider (WalletConnect)
  Hook     → useWallet() from @txnlab/use-wallet-react

DESIGN:
  Theme    → Dark (#0a0f0d background)
  Cards    → Glassmorphism (blur 18px, rgba borders)
  Effects  → Silk 3D (Three.js), SpotlightCard, ShinyText
  Fonts    → Geist Variable (body), Fraunces Variable (headings)
  Colors   → #137636 primary, #f25f6c accent, #5dcaa5 stream-green

DEMO:
  3 employees, 9-step flow, under 3 minutes
  Fallback: python scripts/demo.py --network testnet
```

---

## End of Handoff

This document is the contract between the planning pipeline and the execution pipeline. The executor follows these instructions exactly. It does not improvise, skip steps, or override the sprint structure, hard gates, or requirements defined herein.

Planning verdict: **PASS**. Execution may begin.
