# AlgoFlow -- Requirements Analysis & Gap Report

**Analyst:** Requirements Analyst (Maestro P0)
**Date:** 2026-03-23
**Project:** AlgoFlow -- Real-Time Programmable Payroll Infrastructure on Algorand
**Context:** Solo hackathon, 48h window. Judges: Demo > Innovation > Technical Depth > Presentation.

---

## 1. Explicitly Stated Requirements (Problem Statement)

The table below maps each verbatim requirement from the hackathon problem statement to the technical decisions captured in CLAUDE.md.

| # | Verbatim Requirement | Mapped Decision / Implementation | Coverage |
|---|----------------------|----------------------------------|----------|
| R1 | "Creation of tokenized payroll assets representing salary units" | ASA (Algorand Standard Asset) named "AlgoFlow USD" (PAYUSD), 6 decimals, created via `create(asset)` method. Total supply 1M tokens. | FULL |
| R2 | "Stateful smart contracts to manage payroll logic and payment scheduling" | ARC4 contract (`PayrollStream`) in Algorand Python with global state (employer, asset, total_employees, total_streamed, is_paused) and local state (salary_rate, stream_start, last_withdrawal, total_withdrawn, is_active). 14 ABI methods (9 MVP + 5 STRETCH, pre-audit; updated to 12 MVP + 2 STRETCH post-audit). | FULL |
| R3 | "Continuous or milestone-based salary streaming with instant settlement" | Math-based streaming: `rate * elapsed_time / 3600`. Accrual calculated on-chain at withdrawal. Frontend illusion via JS timer at 1s interval. Milestone-based payments addressed via `milestone_pay(employee, amount)` method (MVP, per A1 resolution). | FULL -- continuous streaming via math-based accrual; milestone-based via milestone_pay() method |
| R4 | "Secure account control mechanisms supporting delegated transaction authority" | Algorand Rekeying identified as "bombshell feature" for delegated authority. Clawback set to contract address for programmatic asset movement. Sender validation on all methods. | PARTIAL -- rekeying mentioned but no contract methods or flow designed yet |
| R5 | "Atomic transaction execution to ensure reliable and complete payment transfers" | `assign_group_id` for atomic groups. Multi-step operations (fund + register, withdraw + update) grouped atomically. Inner transactions for payouts. | FULL |
| R6 | "Dashboard displaying real-time salary accrual, transaction records, and account balances" | Two dashboards: EmployerPanel.tsx and EmployeePanel.tsx. StreamCounter.tsx for real-time accrual. TransactionHistory.tsx for records. | FULL |
| R7 | "Wallet integration for seamless asset storage and payroll interaction" | Pera Wallet via WalletConnect. useWallet.ts hook. WalletConnect.tsx component. Private keys never leave wallet app. | FULL |

---

## 2. Implicitly Required Features

These features are not mentioned in the problem statement but are technically necessary for a working system.

### 2.1 Blockchain Mechanics (Algorand-specific)

| # | Implicit Requirement | Rationale | Status in Design |
|---|---------------------|-----------|------------------|
| I1 | ASA opt-in by employee accounts | Algorand requires receivers to opt in to an ASA before they can hold it. Employees must opt in before first withdrawal. | NOT designed -- no opt-in flow for employees |
| I2 | ASA opt-in by contract account | Contract must hold salary tokens, requiring opt-in. | Covered -- `opt_in_asset()` method exists |
| I3 | Minimum balance funding for contract | Contract needs ALGO for MBR (minimum balance requirement) to hold state and ASA. | NOT explicitly designed -- no MBR calculation or funding step |
| I4 | Minimum balance funding for employee accounts | Employee accounts need ALGO for MBR to opt in to ASA and app. | NOT explicitly designed |
| I5 | Application opt-in by employees | Local state per employee requires application opt-in transaction. | NOT designed -- no app opt-in flow |
| I6 | Transaction fees for inner transactions | Contract needs ALGO balance to pay fees for inner transactions (withdrawals). | NOT explicitly addressed |
| I7 | ASA creation transaction | The salary ASA must be created before the contract is deployed. Requires a separate creation script or flow. | Partially covered in deploy scripts, but no frontend flow |
| I8 | Contract app creation transaction | Deploying the contract itself is a transaction. | Covered -- `algokit deploy` and deploy scripts |

### 2.2 Frontend / UX Requirements

| # | Implicit Requirement | Rationale | Status in Design |
|---|---------------------|-----------|------------------|
| I9 | Loading states for all async operations | Wallet connection, transaction signing, confirmation waiting, data fetching all need loading indicators. | NOT specified |
| I10 | Error state handling and display | Transaction rejection, insufficient funds, network errors, timeout -- all need user-facing messages. | Pattern defined in CLAUDE.md error handling section |
| I11 | Empty states | Dashboard before any employees, employee view before any accrual, transaction history with no transactions. | NOT specified |
| I12 | Success confirmation feedback | After withdrawal, registration, funding -- user needs confirmation with tx ID/link. | NOT specified |
| I13 | Network indicator | Show whether connected to LocalNet or Testnet. | NOT specified |
| I14 | Account balance display (ALGO) | Users need to see their ALGO balance for fee awareness. | NOT specified |
| I15 | Responsive design or viewport target | Demo will be on a specific screen. Need to decide viewport. | NOT specified |
| I16 | Role detection (employer vs employee) | Frontend must determine which dashboard to show based on connected wallet. | NOT designed -- how does the app know which role the user has? |

### 2.3 Data / State Management

| # | Implicit Requirement | Rationale | Status in Design |
|---|---------------------|-----------|------------------|
| I17 | Polling or subscription for state updates | Contract state changes when other users transact. Dashboard needs refresh mechanism. | NOT specified |
| I18 | Indexer queries for transaction history | TransactionHistory.tsx needs indexer queries filtered by app ID and note prefix. | Indexer client defined, but query patterns not designed |
| I19 | Local storage for recent connections | Wallet reconnection, last-used network, cached state. | NOT specified |

---

## 3. Ambiguities Requiring Clarification

1. **Milestone-based streaming**: The problem statement mentions "continuous or milestone-based salary streaming." The current design only covers continuous time-based streaming. Should milestone-based streaming (e.g., pay X tokens when deliverable Y is approved) be included in MVP or deferred entirely?

2. **Rekeying scope**: Rekeying is listed as a "bombshell feature." What specific use case is intended? Options: (a) Employer rekeys a funding account so the contract can auto-fund itself, (b) Employee rekeys to let a manager withdraw on their behalf, (c) Employer rekeys to a multi-sig for DAO governance. Which scenario is being demoed?

3. **Multi-employer / multi-contract**: Does the system support only one employer per deployed contract instance, or should one contract handle multiple employers? Current design is one employer per contract.

4. **Token type**: Is PAYUSD a stablecoin representation (1 PAYUSD = 1 USD), or a generic salary unit? This affects how amounts are displayed and narrated in the demo.

5. **Employee self-registration**: Can employees register themselves, or must the employer register them? Current design is employer-only registration. Should there be an invite/onboarding flow?

6. **Rate units**: Salary rate is "tokens per hour." Should the UI also support input as daily, monthly, or annual rate (with conversion)?

7. **Maximum employees**: Is there a practical cap? Local state requires per-account opt-in, and the contract has 64 global state slots and 16 local state slots. How many employees should the demo support?

8. **Contract upgradability**: Should the contract be upgradable, or is it immutable after deployment? Current design does not mention update/delete methods.

9. **Multiple salary tokens**: Can an employer stream different tokens to different employees, or is it one token per contract? Current design is one ASA per contract.

10. **Time zone handling**: Salary rates are per-hour in UTC (block timestamps). Does the frontend need time zone conversion for display?

---

## 4. Gaps -- Features Not Mentioned That Would Impress Judges

### 4.1 High-Impact Demo Features

| # | Gap | Why Judges Care | Effort |
|---|-----|-----------------|--------|
| G1 | Live on-chain verification links | Clicking a transaction opens Algorand Explorer (Allo.info or Pera Explorer) for the exact txn. Proves it is real, not mocked. | Low |
| G2 | Real-time streaming animation | A visible counter ticking up every second showing salary accruing. Creates the "wow" moment in demo. | Medium -- StreamCounter.tsx is planned |
| G3 | One-click demo reset | Script that tears down and redeploys everything for a clean demo run. Critical for live demo reliability. | Medium |
| G4 | Contract balance health indicator | Show how much runway (hours/days) remain before the contract runs out of tokens. Employers see this as a gauge. | Low |
| G5 | Batch registration | Register multiple employees in one atomic group. Shows technical depth with grouped transactions. | Medium |
| G6 | Export payroll report (CSV/PDF) | Downloadable audit trail. Addresses "transparent auditability" requirement directly. | Medium |
| G7 | QR code for employee onboarding | Employer generates QR code; employee scans to opt in and register. Impressive UX for demo. | High |

### 4.2 Technical Depth Signals

| # | Gap | Why Judges Care | Effort |
|---|-----|-----------------|--------|
| G8 | Contract test coverage report | Visible test suite with pass/fail counts. Shows engineering rigor. | Low |
| G9 | Event/log emission from contract | ARC-28 events for indexer-based notifications. Shows Algorand expertise. | Medium |
| G10 | Multi-asset streaming | Same contract streams different ASAs (e.g., base salary + bonus token). Shows contract flexibility. | High |
| G11 | Grace period / overdraft protection | Contract pauses streams automatically when balance is low instead of failing on withdrawal. | Medium |
| G12 | Rate change with retroactive settlement | When rate changes, contract auto-settles accrued at old rate before applying new rate. | Low -- already implied by `update_rate` design |

### 4.3 Presentation Polish

| # | Gap | Why Judges Care | Effort |
|---|-----|-----------------|--------|
| G13 | Architecture diagram in the app | An "About" or "How it Works" page showing the flow visually. | Low |
| G14 | Notification/toast system | Wallet events, transaction confirmations, errors shown as toasts. Professional feel. | Medium |
| G15 | Keyboard shortcuts | Quick actions for power-user feel during demo. | Low |

---

## 5. Contradictions and Conflicts

| # | Conflict | Details | Resolution |
|---|----------|---------|------------|
| C1 | [HISTORICAL — resolved] Method count evolved: 8 → 9 (milestone_pay added) → 12 (resume_stream, remove_employee, pause_all promoted per DEC-016). | Current state: 12 MVP methods, 2 STRETCH (resume_all, drain_funds). See CLAUDE.md and master-plan for authoritative lists. | RESOLVED. |
| C2 | "Two separate dashboards" vs role detection | The decision says two dashboards, but there is no mechanism to determine which one to show. Are they separate routes? Separate apps? Toggle? | Recommend: single app, two routes (`/employer`, `/employee`), auto-detected from wallet address matching `employer` global state. Manual toggle as fallback. |
| C3 | LocalNet for dev, Testnet for final demo | CLAUDE.md references Testnet with public Algonode endpoints. But live demo with Testnet depends on network availability. If Testnet is slow or down, demo fails. | Recommendation: develop on LocalNet, deploy to Testnet for final demo. Keep LocalNet as instant fallback. The automated demo script should work on both. |
| C4 | Pera Wallet on LocalNet | Pera Wallet (mobile) does not connect to LocalNet by default. Development with Pera requires Testnet or custom node configuration. | For LocalNet dev, use KMD-based signing (AlgoKit default accounts). Switch to Pera for Testnet demo. Frontend must support both signing methods. |
| C5 | "Algorand Rekeying for delegated transaction authority" vs no rekeying methods | Rekeying is listed as the "bombshell feature" but there are zero contract methods, zero frontend flows, and zero design details for rekeying. | Needs design. Recommend: demonstrate rekeying as a separate demo step where employer rekeys a sub-account to the contract, allowing the contract to auto-debit for funding. Or: employee rekeys to allow a third-party withdrawer. |

---

## 6. MVP vs STRETCH Classification

### Classification Criteria
- **MVP**: Must ship for a passing demo. Without it, the product does not function or the problem statement requirement is unmet.
- **STRETCH**: Impressive if present, but demo still works without it. Nice-to-have for judge scoring.

### Smart Contract

| Feature | Classification | Rationale |
|---------|---------------|-----------|
| `create(asset)` -- initialize contract | MVP | Core setup |
| `opt_in_asset()` -- contract opts into ASA | MVP | Required for contract to hold tokens |
| `fund(axfer)` -- deposit salary tokens | MVP | Required for streaming to work |
| `register_employee(account, rate)` -- register employee | MVP | Core payroll function |
| `withdraw()` -- employee claims accrued | MVP | Core payroll function |
| `get_accrued(account)` -- read accrued balance | MVP | Required for dashboard display |
| `update_rate(account, new_rate)` -- change salary | MVP | Listed as must-have |
| `pause_stream(account)` -- pause one stream | MVP | Listed as must-have |
| `resume_stream(account)` -- resume one stream | MVP | Promoted from STRETCH per DEC-016 (user-value audit). Irreversible pause was CRITICAL gap. |
| `remove_employee(account)` -- final payout + deregister | MVP | Promoted from STRETCH per DEC-016 (user-value audit). No off-boarding was CRITICAL gap. |
| `pause_all()` -- emergency pause | MVP | Promoted from STRETCH per DEC-016 (user-value audit). No emergency stop was CRITICAL gap. |
| `resume_all()` -- resume all | STRETCH | Inverse of pause_all |
| `drain_funds()` -- employer withdraws pool | STRETCH | Emergency/cleanup |
| Rekeying demonstration | STRETCH | "Bombshell feature" but no design exists; risky to attempt in MVP |
| `milestone_pay(employee, amount)` -- one-time milestone payment | MVP | User explicitly included per A1 resolution. Problem statement mentions "milestone-based." |
| Overdraft protection / auto-pause | MVP | Included per gap analysis G11 — prevents failed withdrawals |
| ARC-28 event emission | STRETCH | Technical depth signal |

### ASA / Token

| Feature | Classification | Rationale |
|---------|---------------|-----------|
| Create salary ASA (PAYUSD) | MVP | Mandatory for the system |
| Set contract as clawback address | MVP | Required for inner-transaction payouts |
| Employee ASA opt-in flow | MVP | Without this, employees cannot receive tokens |
| ASA metadata (name, unit, decimals) | MVP | Judges will inspect the asset |

### Frontend -- Employer Dashboard

| Feature | Classification | Rationale |
|---------|---------------|-----------|
| Wallet connection (Pera) | MVP | Required for any interaction |
| Fund contract with tokens | MVP | Core flow |
| Register new employee (address + rate) | MVP | Core flow |
| View list of registered employees | MVP | Core dashboard element |
| View contract balance | MVP | Required for fund management |
| Pause individual employee stream | MVP | Must-have method needs UI |
| Update employee salary rate | MVP | Must-have method needs UI |
| Remove employee | MVP | Promoted from STRETCH per DEC-016 (no off-boarding was CRITICAL gap) |
| Batch employee registration | MVP | Included for demo (3 employees in one atomic group) |
| Contract runway indicator (hours/days left) | MVP | Included per user-value audit recommendation |
| Export payroll report | STRETCH | Auditability polish |

### Frontend -- Employee Dashboard

| Feature | Classification | Rationale |
|---------|---------------|-----------|
| Wallet connection (Pera) | MVP | Shared component |
| Real-time accrual counter (StreamCounter) | MVP | The core visual "wow" factor |
| Withdraw accrued salary | MVP | Core employee action |
| View withdrawal history | MVP | Problem statement: "transaction records" |
| View salary rate and stream status | MVP | Basic information display |
| Explorer links for transactions | MVP | Already decided; proves on-chain reality |

### Frontend -- Shared / Infrastructure

| Feature | Classification | Rationale |
|---------|---------------|-----------|
| Dark theme with glassmorphism | MVP | Already decided as core aesthetic |
| Silk 3D background | MVP | Already decided |
| Spotlight cards | MVP | Already decided |
| Loading states for async operations | MVP | Without these, demo looks broken during waits |
| Error handling with user-friendly messages | MVP | Transactions can fail; must handle gracefully |
| Success confirmation with tx ID | MVP | Proves on-chain execution to judges |
| Network indicator (Testnet/LocalNet) | MVP | Judges need to know which network |
| Role detection / dashboard routing | MVP | Must know which view to show |
| Toast/notification system | MVP | Promoted — professional feel, confirms transactions to judges |
| Responsive design | STRETCH | Demo is on one screen |
| Keyboard shortcuts | STRETCH | Minor polish |
| Architecture / "How it Works" page | MVP | Promoted — landing page with architecture diagram |
| QR code onboarding | STRETCH | High effort, high wow |

### Scripts / Tooling

| Feature | Classification | Rationale |
|---------|---------------|-----------|
| Deployment script (LocalNet + Testnet) | MVP | Cannot demo without deployment |
| Account funding script | MVP | Test accounts need tokens |
| Automated demo script (fallback) | MVP | Already decided; insurance against live-demo failure |
| Demo reset script | MVP | Promoted — critical for reliable repeated demo runs |
| Test suite with coverage report | MVP | Promoted — shows engineering rigor to judges |

---

## 7. Recommended Functional Requirements List

Each requirement follows the format: **[Actor] can [capability]**. Tagged MVP or STRETCH.

### Smart Contract Layer

| # | Functional Requirement | Tag |
|---|----------------------|-----|
| FR-01 | [Employer] can deploy a new PayrollStream contract linked to a specific salary ASA | MVP |
| FR-02 | [Employer] can make the contract opt in to the salary ASA so it can hold tokens | MVP |
| FR-03 | [Employer] can fund the contract by depositing salary tokens via asset transfer | MVP |
| FR-04 | [Employer] can register a new employee with a wallet address and hourly token rate | MVP |
| FR-05 | [Employee] can withdraw all currently accrued salary tokens to their wallet | MVP |
| FR-06 | [Anyone] can query the accrued (unclaimed) balance for any registered employee | MVP |
| FR-07 | [Employer] can update an employee's hourly salary rate (settling accrued at old rate first) | MVP |
| FR-08 | [Employer] can pause an individual employee's salary stream | MVP |
| FR-09 | [Employer] can resume a paused employee's salary stream | MVP |
| FR-10 | [Employer] can remove an employee, triggering a final payout and deregistration | MVP |
| FR-11 | [Employer] can pause all streams simultaneously (emergency stop) | MVP |
| FR-12 | [Employer] can resume all streams after an emergency pause | STRETCH |
| FR-13 | [Employer] can drain remaining tokens from the contract back to their wallet | STRETCH |
| FR-14 | [Contract] automatically rejects unauthorized callers for employer-only methods | MVP |
| FR-15 | [Contract] automatically computes accrued salary using on-chain timestamps and rate math | MVP |
| FR-16 | [Contract] executes payouts via inner asset transfer transactions (no employee signature needed on asset side) | MVP |

### Token / ASA Layer

| # | Functional Requirement | Tag |
|---|----------------------|-----|
| FR-17 | [System] can create a salary ASA with configurable name, unit, decimals, and total supply | MVP |
| FR-18 | [System] sets the contract address as ASA clawback to enable programmatic transfers | MVP |
| FR-19 | [Employee] can opt in to the salary ASA to become eligible to receive tokens | MVP |
| FR-20 | [Employee] can opt in to the PayrollStream application to have local state allocated | MVP |

### Employer Dashboard

| # | Functional Requirement | Tag |
|---|----------------------|-----|
| FR-21 | [Employer] can connect their Pera Wallet to the employer dashboard | MVP |
| FR-22 | [Employer] can view the contract's current token balance and ALGO balance | MVP |
| FR-23 | [Employer] can fund the contract with a specified amount of salary tokens through the UI | MVP |
| FR-24 | [Employer] can register a new employee by entering their Algorand address and hourly rate | MVP |
| FR-25 | [Employer] can view a list of all registered employees with their rates, status, and accrued amounts | MVP |
| FR-26 | [Employer] can pause or update the rate of any individual employee from the list | MVP |
| FR-27 | [Employer] can see explorer links for every on-chain transaction performed | MVP |
| FR-28 | [Employer] can view a contract runway indicator showing estimated hours/days until funds are depleted | MVP |
| FR-29 | [Employer] can batch-register multiple employees in a single atomic transaction group | MVP |
| FR-30 | [Employer] can export a payroll summary report as CSV | STRETCH |

### Employee Dashboard

| # | Functional Requirement | Tag |
|---|----------------------|-----|
| FR-31 | [Employee] can connect their Pera Wallet to the employee dashboard | MVP |
| FR-32 | [Employee] can view a real-time streaming counter showing salary accruing per second | MVP |
| FR-33 | [Employee] can withdraw all accrued salary tokens with a single button press | MVP |
| FR-34 | [Employee] can view their withdrawal history with timestamps, amounts, and explorer links | MVP |
| FR-35 | [Employee] can view their current hourly rate and stream status (active/paused) | MVP |

### Shared Frontend

| # | Functional Requirement | Tag |
|---|----------------------|-----|
| FR-36 | [System] detects whether the connected wallet is the employer and routes to the correct dashboard | MVP |
| FR-37 | [System] displays loading indicators during wallet connection, transaction signing, and confirmation waiting | MVP |
| FR-38 | [System] displays user-friendly error messages for rejected transactions, insufficient funds, and network errors | MVP |
| FR-39 | [System] displays success confirmations with transaction ID and explorer link after every on-chain action | MVP |
| FR-40 | [System] shows a network badge indicating whether the app is connected to LocalNet or Testnet | MVP |

### DevOps / Demo

| # | Functional Requirement | Tag |
|---|----------------------|-----|
| FR-41 | [Developer] can deploy the full system (ASA + contract) to LocalNet or Testnet with a single script | MVP |
| FR-42 | [Developer] can fund test accounts with ALGO and salary tokens using a setup script | MVP |
| FR-43 | [Developer] can run an automated demo script that exercises the full create-fund-register-stream-withdraw flow as a fallback for live demo | MVP |
| FR-44 | [Developer] can run a demo reset script that tears down and redeploys for a clean state | MVP |

### Rekeying / Delegated Authority

| # | Functional Requirement | Tag |
|---|----------------------|-----|
| FR-45 | [Employer] can demonstrate Algorand rekeying by delegating transaction authority from a sub-account to the contract or another authorized address | STRETCH |

---

## 8. Summary Statistics

| Category | MVP | STRETCH | Total |
|----------|-----|---------|-------|
| Smart Contract | 10 | 5 | 15 |
| Token / ASA | 4 | 0 | 4 |
| Employer Dashboard | 6 | 3 | 9 |
| Employee Dashboard | 5 | 0 | 5 |
| Shared Frontend | 5 | 0 | 5 |
| DevOps / Demo | 3 | 1 | 4 |
| Rekeying | 0 | 1 | 1 |
| **TOTAL** | **42** | **5** | **47** |

> **Note:** Counts updated post-audit. resume_stream, remove_employee, pause_all promoted from STRETCH to MVP. milestone_pay added to MVP. See `ambiguity-resolutions.md` and `user-value-audit.md` for details.

### Critical Path (MVP):
1. Smart contract with 12 core methods + authorization + accrual math + inner transactions
2. ASA creation with clawback configuration
3. Employee ASA and app opt-in flows
4. Employer dashboard: connect, fund, register, view employees, pause, update rate
5. Employee dashboard: connect, stream counter, withdraw, history
6. Role detection and routing
7. Loading/error/success states
8. Deployment and demo scripts

### Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Pera Wallet does not work on LocalNet | Blocks all frontend dev until Testnet deploy | Use KMD signing for LocalNet dev; Pera for Testnet only |
| Rekeying complexity derails schedule | Burns hours on STRETCH feature at expense of MVP | Defer rekeying entirely; only attempt after all MVP is done |
| Algorand Python compiler bugs | Blocks contract development | Keep contracts simple; test each method immediately after writing |
| Testnet congestion during demo | Live demo fails | Automated demo script as fallback; LocalNet as backup |
| Employee opt-in UX friction | Demo flow requires extra steps | Pre-opt-in employees in setup script; show opt-in only if needed |
