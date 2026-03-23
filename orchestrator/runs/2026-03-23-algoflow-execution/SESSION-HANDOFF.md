# SESSION HANDOFF — AlgoFlow Sprint 4 Execution

<!-- AUTHORITATIVE HANDOFF DOCUMENT -->
<!-- The next session's Maestro Executor MUST read this file FIRST -->
<!-- Generated: 2026-03-24 -->
<!-- Pipeline: maestro-execute -->
<!-- Run ID: 2026-03-23-algoflow-execution -->
<!-- Source session context: ~45% used of 1M context window -->

---

## Section 1: Pipeline State

| Field | Value |
|-------|-------|
| Pipeline | maestro-execute |
| Run ID | 2026-03-23-algoflow-execution |
| Session | 1 of N (continuation from planning session) |
| Sprints Completed | 0, 1, 2, 3 (4 of 5) |
| Sprint Remaining | Sprint 4 — Polish, Testnet Deploy & Stretch Goals |
| Total Tests | 37 (33 unit + 4 integration) — ALL PASSING |
| Frontend Components | 21 .tsx files |
| Hooks | 4 .ts files |
| Backend Scripts | 4 .py files (deploy, fund_accounts, demo, reset) |
| Contract Methods | 12 MVP implemented + tested |
| Git Commits | 18 on master branch |
| Latest Commit | b61b028 — Sprint 3 complete |
| Working Tree | CLEAN |

---

## Section 2: What Was Built (Sprint by Sprint)

### Sprint 0 — Scaffold & Environment (DONE)
- Python project: empty PayrollStream(ARC4Contract) skeleton, pyproject.toml, requirements.txt
- Frontend: React 19 + Vite + Tailwind v4, design tokens in @theme, types, utils, algorand client
- Infrastructure: .env/.env.example, .gitignore, .algokit.toml, Python venv
- **Gate passed**: Contract compiles, pytest runs, npm run dev starts, tsc 0 errors

### Sprint 1 — Smart Contract & Token Infrastructure (DONE)
- **contract.py** (380+ lines): All 12 MVP methods:
  - create, opt_in_asset, fund, register_employee
  - withdraw (with overdraft protection + min 1000 base unit check), get_accrued
  - update_rate, pause_stream, resume_stream, remove_employee, milestone_pay, pause_all
  - Internal: _calculate_accrued, _settle (with overdraft protection)
  - Bare opt_in method for employee app opt-in
- **deploy.py** (450+ lines): Full pipeline — ASA creation → contract deploy → clawback → fund → .env update
  - Network-aware: updates VITE_ALGOD_SERVER, VITE_INDEXER_SERVER, VITE_NETWORK for testnet
- **fund_accounts.py** (323 lines): Registers 3 employees (Alice $100/hr, Bob $75/hr, Charlie $50/hr)
- **Tests**: 33 unit tests + 4 integration tests = 37 total, ALL PASSING
  - Edge cases: zero rate, below minimum withdrawal, paused rate update, zero milestone, pause idempotence
- **Gate passed**: algokit compile clean, pytest 37/37, deploy + fund scripts work on LocalNet

### Sprint 2 — Employer Dashboard (DONE)
- **Wallet infrastructure**: WalletProvider (KMD + Pera via @txnlab/use-wallet-react v4.6.0)
  - KMD configured with `promptForPassword: async () => ''` (no browser password prompt)
  - useWallet.ts, useContractState.ts (5s polling), usePayrollContract.ts (10 ABI method callers)
- **Dashboard components** (11 total):
  - EmployerDashboard.tsx — two-column glassmorphism layout
  - FundForm.tsx — PAYUSD deposit with balance check
  - RegisterForm.tsx — single/batch (up to 3) with address validation
  - EmployeeList.tsx + EmployeeRow.tsx — live accrual counter, per-employee actions
  - StatusBadge.tsx — Active (green), Paused (amber), Paused Global (red)
  - ContractHealth.tsx — balance, runway bar (green/amber/red), burn rate, low-fund warning
  - MilestonePayForm.tsx — employee dropdown, amount, balance check
  - EmergencyControls.tsx — pause-all with two-step confirmation
  - SetupChecklist.tsx — 4-step onboarding (auto-hides on completion)
- **Audit fixes applied**: route ternary bug, setTimeout cleanup, useMemo, console.error logging, getAccrued without wallet
- **Gate passed**: tsc 0 errors, build passes, all routes HTTP 200

### Sprint 3 — Employee Dashboard, Landing, UX, Demo (DONE)
- **StreamCounter** — THE visual centerpiece: real-time salary ticker every 1 second
  - useStreamAccrual.ts: client-side math + 30s on-chain resync via get_accrued
  - Monospace stream-green display with CSS text-shadow glow, pulsing dot
  - Pause overlays (amber individual, red global)
- **EmployeeDashboard.tsx** — full layout: counter hero, withdraw button, rate display, transaction history
- **WithdrawButton.tsx** — state machine (idle/confirm/signing/success/error), min threshold, ref-tracked timers
- **TransactionHistory.tsx** — Indexer query with notePrefix filter, graceful fallback
- **RateDisplay.tsx** — $/hr, $/day, $/week, $/month + localStorage "New" badge
- **Landing.tsx** — hero, HowItWorks (3-step diagram), RoleSelector, auto role-routing
- **Shared UX**: Toast.tsx (provider + hook, auto-dismiss), ExplorerLink.tsx, NetworkBadge.tsx
- **Demo scripts**: demo.py (9-step flow), reset.py (clean state redeploy)
- **Gate passed**: tsc 0 errors, build passes

---

## Section 3: Sprint 4 Scope

### Sprint 4 — Polish, Testnet Deploy & Stretch Goals

| Field | Value |
|-------|-------|
| Stories | 5 (STORY-4-001 through STORY-4-005) |
| Estimated hours | 4-6 |
| Priority | P0 (core polish) + P1 (stretch) |
| Risk | LOW-MEDIUM |

### Stories

| ID | Title | Complexity | FRs |
|----|-------|-----------|-----|
| STORY-4-001 | Testnet deployment and Pera Wallet integration | M | Infrastructure |
| STORY-4-002 | Design polish: Silk background, spotlight cards, shimmer text, glassmorphism | L | FR-SHARED-007 |
| STORY-4-003 | Timezone handling and multi-unit rate display polish | S | Polish |
| STORY-4-004 | Stretch: resume_all, drain_funds, CSV export | M | FR-CONTRACT-015/016/017 |
| STORY-4-005 | Demo rehearsal, bug fixes, and final verification | S | Quality gate |

### Story Details

**STORY-4-001: Testnet Deployment + Pera Wallet**
- Deploy contract to Algorand Testnet using DEPLOYER_MNEMONIC
- Verify Pera Wallet connects on Testnet (WalletConnect popup)
- Update deploy.py for testnet VITE vars (already implemented!)
- Fund deployer with 10 ALGO from testnet faucet
- Test full flow on Testnet

**STORY-4-002: Design Polish**
- Silk.tsx — Three.js procedural 3D background (fragment shader with noise)
- SpotlightCard.tsx + SpotlightCard.css — mouse-following radial gradient
- ShinyText.tsx + ShinyText.css — shimmer gradient text animation
- Apply glassmorphism consistently across all cards
- Ensure dark theme (#0a0f0d) is visually polished

**STORY-4-003: Timezone & Rate Polish**
- All timestamps displayed in browser local timezone using Intl.DateTimeFormat
- Already partially implemented in TransactionHistory.tsx
- Verify RateDisplay multi-unit calculations are precise
- Minor UI polish

**STORY-4-004: STRETCH Features (only if time permits)**
- resume_all() contract method (inverse of pause_all)
- drain_funds() contract method (emergency withdrawal for employer)
- CSV export of transaction history
- These are OPTIONAL — skip entirely if time is tight

**STORY-4-005: Demo Rehearsal**
- Run demo.py on Testnet end-to-end
- Fix any bugs found
- Time the demo flow (must be < 3 minutes)
- Practice the 9-step sequence
- This is the final quality gate before submission

---

## Section 4: Current File Inventory

### Backend (Python)
```
smart_contracts/
  __init__.py
  payroll_stream/
    __init__.py
    contract.py              # 380+ lines — 12 MVP methods + 2 subroutines + bare opt_in
    deploy_config.py
    PayrollStream.approval.teal
    PayrollStream.clear.teal
    PayrollStream.arc56.json
  helpers/
    __init__.py
    build.py
    constants.py             # Token constants, MIN_WITHDRAWAL_AMOUNT

tests/
  __init__.py
  conftest.py                # Test fixtures (algod, accounts, ASA, app deployment)
  test_payroll_stream.py     # 33 unit tests across 12 test classes
  test_integration.py        # 4 end-to-end integration tests

scripts/
  deploy.py                  # Full deployment pipeline (ASA → contract → clawback → fund → .env)
  fund_accounts.py           # Register 3 employees at different rates
  demo.py                    # 9-step automated demo flow
  reset.py                   # Clean state redeploy
```

### Frontend (React/TypeScript)
```
frontend/src/
  main.tsx                   # WalletProvider + ToastProvider + BrowserRouter
  App.tsx                    # Routes: /, /employer, /employee + role detection
  index.css                  # Tailwind v4 @theme tokens + CSS custom properties
  vite-env.d.ts

  components/
    Landing.tsx              # Landing page: hero, HowItWorks, RoleSelector
    HowItWorks.tsx           # 3-step architecture diagram
    RoleSelector.tsx         # Employer/Employee role cards
    WalletConnect.tsx        # Wallet provider selection + connection
    NetworkBadge.tsx         # LocalNet/Testnet indicator
    Toast.tsx                # Toast notification system (provider + hook)
    ExplorerLink.tsx         # Lora Explorer URL builder

    EmployerDashboard.tsx    # Full employer view layout
    FundForm.tsx             # PAYUSD deposit form
    RegisterForm.tsx         # Single/batch employee registration
    EmployeeList.tsx         # Employee table
    EmployeeRow.tsx          # Per-employee row with actions
    StatusBadge.tsx          # Active/Paused/Global badge
    ContractHealth.tsx       # Balance, runway, burn rate
    MilestonePayForm.tsx     # Per-employee bonus payment
    EmergencyControls.tsx    # Pause-all button
    SetupChecklist.tsx       # 4-step onboarding wizard

    EmployeeDashboard.tsx    # Full employee view layout
    StreamCounter.tsx        # Real-time salary counter (THE wow moment)
    WithdrawButton.tsx       # One-click withdrawal
    TransactionHistory.tsx   # Past withdrawals with explorer links
    RateDisplay.tsx          # Multi-unit rate + "New" badge

  hooks/
    useWallet.ts             # Wallet connection state wrapper
    useContractState.ts      # Global + local state polling (5s)
    usePayrollContract.ts    # 10 ABI method callers
    useStreamAccrual.ts      # Client-side accrual tick (1s) + resync (30s)

  lib/
    algorand.ts              # Algod/Indexer clients + getAppId/getAssetId
    constants.ts             # STREAM_UPDATE_INTERVAL_MS, ASSET_DECIMALS, etc.
    utils.ts                 # formatTokenAmount, shortenAddress, getExplorerUrl, parseState
    PayrollStream.arc56.json # ARC56 contract spec (copy for TS import)

  types/
    index.ts                 # Employee, ContractState, PayrollConfig, etc.
```

---

## Section 5: Known Issues & Deferred Items

### Deferred to Sprint 4

| ID | Issue | Target Story |
|----|-------|-------------|
| F-12 | deploy.py no error recovery/checkpointing | STORY-4-005 |
| SUG-005 | resume_all UI in EmergencyControls | STORY-4-004 |
| SUG-006 | Silk.tsx 3D background on Landing | STORY-4-002 |
| SUG-007 | Integrate useToast into all form components | STORY-4-005 |
| LIM-009 | algosdk 1MB bundle — code-split | STORY-4-005 |

### Known Limitations (not bugs, documented behavior)

| ID | Description |
|----|-------------|
| AP-007 | Employee addresses tracked via localStorage (no on-chain list) |
| AP-008 | Batch registration sequential, not atomic |
| LIM-005 | LocalNet block timestamps same-second granularity |
| LIM-006 | Algorand requires self-opt-in — contract cannot opt-in employees |
| LIM-010 | RoleSelector wallet-gate uses scroll-to fallback |

---

## Section 5b: Drift Tracking & Process Enforcement (NEW)

### Drift Log
File: `orchestrator/runs/2026-03-23-algoflow-execution/drift-log.jsonl`
- Tracks every plan-vs-execution deviation quantitatively
- Fields: sprint, type, planned, actual, drift, severity, note
- **Sprint 4 executor MUST append entries for every wave**

### Meta Log
File: `orchestrator/runs/2026-03-23-algoflow-execution/meta-log.jsonl`
- Tracks executor behavior patterns across the session
- Categories: session_start, sprint_complete, audit_requested, drift_violation, user_feedback
- Used for cross-session learning

### Wave Verification Gate (MANDATORY for Sprint 4)
Before spawning EACH wave agent, the executor MUST:
1. Confirm wave number matches the user-approved plan
2. Confirm story assignment matches the plan
3. Log the check to drift-log.jsonl: `{"type":"wave_verification","wave":N,"plan_match":true/false}`
4. If plan_match is false → STOP. Ask user before proceeding.

### Drift Summary (Session 1)
| Sprint | Wave Drift | Severity | Detail |
|--------|-----------|----------|--------|
| 0 | 0 | NONE | 1/1 waves as planned |
| 1 | 0 | NONE | 2/2 waves as planned |
| 2 | 0 | NONE | 3/3 waves as planned |
| 3 | -1 | **HIGH** | 3 planned → 2 executed (Wave 2+3 merged) |

### Process Rules (Sprint 4 MUST enforce)
1. Wave count is a CONTRACT — never consolidate without user approval
2. NEVER use sed on YAML/JSON — always use Edit tool
3. Drift check before each wave spawn
4. Audit agents must READ actual code, not guess from patterns

### MANDATORY: Read Enforcement Protocol
**File**: `orchestrator/enforcement-protocol.md` (770+ lines, v2.1)
The Sprint 4 executor MUST read this file FULLY at session start. It defines:

**Core:**
- Section 0: Core Values — Process > Rules > Quality > Thoroughness > Speed
- Section 1: 5 Mandatory Hard Gates (A through E) — 35 total checkpoint items

**Logging:**
- Section 2: Post-Agent Completion Logging
- Section 3: Quality Check Logging
- Section 4: Sprint Completion Event
- Section 17: Enhanced Logging Parameters (v2 event schemas with findings, adherence, watchdog fields)

**Monitoring:**
- Section 5: SIT Agent Protocol (simplified)
- Section 12: Health Check System (8-point, GREEN/AMBER/RED)
- Section 15: Watchdog Agent — continuous 24-keyword scanning between waves
- Section 16: Agent Reporting Protocol — mandatory FINDING| output from every agent

**Analysis:**
- Section 7: Audit Calibration (14 core + 10 extended negative keywords)
- Section 9: Drift Measurement Framework with Sprint Drift Score
- Section 10: Qualitative Analysis (8 dimensions)
- Section 13: Multi-Perspective Analysis (Structural, Behavioral, Temporal, Forensic)
- Section 18: Sprint Analysis — structured post-sprint log review

**Enforcement:**
- Section 6: Wave Checkpoint Enforcement (50+ lines per wave)
- Section 8: Event Log Completeness Standard
- Section 14: Mid-Sprint Course Correction (AMBER/RED protocol)

Sprint 4 drift score target: < 30 (ACCEPTABLE)
Sprint 3 scored 70 (CRITICAL) — process discipline must recover

---

## Section 6: Anti-Patterns Registry (ENFORCE in Sprint 4)

These MUST be included in every Sprint 4 agent prompt:

| ID | Rule | Why |
|----|------|-----|
| AP-009 | ALL setTimeout/setInterval MUST use refs with cleanup on unmount | Memory leak prevention |
| LIM-007 | algosdk v3 uses bigint — use Number() only for display | Precision safety |
| AP-006 | Double-check all ternary conditions (both branches must differ) | Route bug caught in Sprint 2 |
| AP-010 | Toast timers use Map-tracked refs | Consistent with AP-009 |
| General | console.error in ALL catch blocks | Debug visibility |
| General | CSS variables only (--primary, --stream-green), no hardcoded hex | Design system compliance |
| General | Base units everywhere, formatTokenAmount() at render time | Consistent formatting |

---

## Section 7: Environment & Prerequisites

| Prerequisite | Status |
|---|---|
| Python 3.14.3 | Installed |
| Node.js 22.14.0 | Installed |
| AlgoKit CLI 2.10.2 | Installed |
| Docker 29.2.1 | Installed (must be running for LocalNet) |
| puyapy 5.7.1 | Installed in .venv |
| @txnlab/use-wallet-react | v4.6.0 |
| algosdk (JS) | v3.5.2 |
| algosdk (Python) | Latest via pip |
| LocalNet | Works (algokit localnet start) |
| Testnet faucet | https://bank.testnet.algorand.network/ |

### Effort Level (CRITICAL — read before starting)

The user runs `/effort max` at session start. This gives the main executor AND all spawned subagents maximum reasoning depth (Opus 4.6 only).

**Do NOT use "ultrathink" in agent prompts** — it overrides max DOWN to high.
**Gate A check A8** verifies `/effort max` is active before sprint starts.
**Spawned agents inherit** session effort — no per-agent config needed.
**Haiku agents** (watchdog) don't support max effort — acceptable for scanning.

### Critical Environment Notes

1. **Docker must be running** before `algokit localnet start`
2. **Python venv**: `source .venv/bin/activate` before any Python commands
3. **Frontend**: `cd frontend && npm run dev` for dev server
4. **KMD password**: Auto-configured as empty string (no browser prompt)
5. **.env**: LocalNet IDs may be stale after Docker restart — run `python scripts/deploy.py --network localnet` to refresh

---

## Section 8: Quality Metrics

| Metric | Value |
|--------|-------|
| Backend tests | 37/37 passing |
| TSC errors | 0 |
| Frontend build | Passes (~2.3s) |
| Contract compilation | Clean (puyapy 5.7.1) |
| Audit items open | 0 (13 of 15 fixed, 1 non-issue, 1 deferred to Sprint 4) |
| Anti-patterns discovered | 10 (AP-001 through AP-010) |
| Limitations documented | 10 (LIM-001 through LIM-010) |
| Suggestions logged | 7 (SUG-001 through SUG-007) |
| Learning log entries | 30+ across 3 sprints |

---

## Section 9: Git History

```
b61b028 feat: sprint-3 complete — employee dashboard, landing, UX, demo scripts
33cee99 fix: resolve all Sprint 2 audit items exhaustively
58d0c08 docs: Sprint 2 learning log + audit findings
c09bd57 fix: Sprint 2 audit — route ternary bug, types doc fix
0c902d3 docs: Sprint 2 complete — fix sprint-status, update all docs
117daa9 feat: sprint-2 wave 3 — health, milestone, emergency, checklist
ea361b3 feat: sprint-2 wave 2 — employer dashboard core components
a306967 feat: sprint-2 wave 1 — wallet hooks + contract interaction layer
f61607b docs: update all orchestration artifacts post-audit
6a0fe0b fix: resolve all remaining audit items
ffbb878 fix: audit remediation — min withdrawal, edge case tests, docs
f42fe0a docs: Sprint 2 risk resolution — verified API patterns
3ba4341 fix: sync docs after Sprint 1 completion audit
0797df0 feat: sprint-1 wave 2 complete — deploy scripts + integration tests
ad55f06 feat: sprint-1 wave 1 complete — all 12 contract methods + 28 tests
c19d110 feat: sprint-0 wave 1 complete — project scaffold
7afc795 Initial commit: Maestro planning artifacts
```

---

## Section 10: Sprint 4 Execution Instructions

### Phase A: Context Loading (MANDATORY)

```
Step 1: Read this SESSION-HANDOFF.md
Step 2: Read CLAUDE.md (full file)
Step 3: Read sprints/sprint-plan.md (Sprint 4 section)
Step 4: Read ALL Sprint 4 story files:
        - sprints/stories/STORY-4-001.md
        - sprints/stories/STORY-4-002.md
        - sprints/stories/STORY-4-003.md
        - sprints/stories/STORY-4-004.md
        - sprints/stories/STORY-4-005.md
Step 5: Read orchestrator/learning-log.md (anti-patterns to enforce)
Step 6: Read docs/04-screen-map.md (Sprint 4 design specs)
```

### Phase B: Sprint 4 Execution (Suggested Waves)

**Wave 1: Testnet Deployment (STORY-4-001)**
- Fund deployer account via testnet faucet
- Run `python scripts/deploy.py --network testnet`
- Verify Pera Wallet connects on Testnet
- Test basic flow (fund → register → withdraw)

**Wave 2: Design Polish (STORY-4-002 + STORY-4-003)**
- Create Silk.tsx (Three.js 3D background)
- Create SpotlightCard.tsx + CSS (mouse-follow gradient)
- Create ShinyText.tsx + CSS (shimmer animation)
- Apply to Landing page and dashboard cards
- Timezone polish in all timestamp displays

**Wave 3: Stretch + Demo Rehearsal (STORY-4-004 + STORY-4-005)**
- STRETCH (only if time): resume_all, drain_funds contract methods
- Run demo.py on Testnet — all 9 steps must pass
- Time the demo (< 3 minutes)
- Fix any bugs found
- Final quality gate

### Phase C: Post-Sprint

- Write execution-summary.md
- Update all docs
- Run final audit
- Prepare for hackathon submission

---

## Section 11: Design System Quick Reference

```
COLORS:
  --primary:       #137636  (buttons, headers, active states)
  --primary-dark:  #0d5427  (hover states)
  --accent:        #f25f6c  (alerts, warnings, emergency)
  --surface:       #fffdf8  (card backgrounds — use rgba(255,255,255,0.05) for dark)
  --bg-dark:       #0a0f0d  (page background)
  --text-primary:  #1a1a1a  (text on light surfaces)
  --text-light:    #f0f0f0  (text on dark surfaces)
  --stream-green:  #5dcaa5  (streaming counter, accrual, active indicators)

FONTS:
  Body:      "Geist Variable", system-ui
  Headings:  "Fraunces Variable", serif
  Monospace: ui-monospace, SFMono-Regular, Menlo

EFFECTS:
  Glassmorphism: rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-6 shadow-lg
  SpotlightCard: Mouse-following radial gradient via CSS custom properties (Sprint 4)
  ShinyText:     Gradient background-clip animation on key text (Sprint 4)
  Silk:          Three.js procedural 3D animation, fragment shader with noise (Sprint 4)
  StreamCounter: Smooth number interpolation, monospace, stream-green glow

PATTERNS:
  Heading: font-['Fraunces_Variable'] text-xl font-semibold text-[--text-light]
  Card:    rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[18px] p-6 shadow-lg
  Button:  rounded-lg bg-[--primary] px-4 py-2 text-white hover:bg-[--primary-dark] transition-colors
  Input:   rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-[--text-light] focus:border-[--primary]
```

---

## Section 12: Wallet Architecture Reference

```
@txnlab/use-wallet-react v4.6.0
  WalletManager (created at module scope in main.tsx):
    wallets: [
      { id: WalletId.KMD, options: { wallet: 'unencrypted-default-wallet', promptForPassword: async () => '' } },
      WalletId.PERA
    ]
    defaultNetwork: NetworkId.LOCALNET

  useWallet() returns:
    wallets, isReady, algodClient, activeWallet, activeAccount,
    activeAddress, signTransactions, transactionSigner

  Role detection:
    1. User connects wallet → activeAddress available
    2. useContractState polls global state → gets employer address
    3. If activeAddress === employer → redirect to /employer
    4. Else → redirect to /employee
```

---

## Section 13: Contract ABI Reference

```
MVP Methods (12):
  create(asset)                    — Employer — Initialize contract
  opt_in_asset()                   — Employer — Contract opts into ASA
  fund(axfer)                      — Employer — Validate funding transfer
  register_employee(account, rate) — Employer — Register with hourly rate
  withdraw()                       — Employee — Claim accrued (min 1000 base units)
  get_accrued(account)             — Anyone   — Read-only accrued balance
  update_rate(account, new_rate)   — Employer — Settle + apply new rate
  pause_stream(account)            — Employer — Settle + deactivate
  resume_stream(account)           — Employer — Reactivate (no retroactive)
  remove_employee(account)         — Employer — Final payout + deregister
  milestone_pay(employee, amount)  — Employer — One-time bonus
  pause_all()                      — Employer — Emergency global pause

STRETCH Methods (Sprint 4):
  resume_all()                     — Employer — Unpause global flag
  drain_funds()                    — Employer — Emergency withdrawal

Streaming Math:
  accrued = salary_rate * (now - last_withdrawal) / 3600
  Integer division only. Min withdrawal: 1000 base units.
  Overdraft: sends available balance, auto-pauses stream.
```

---

## End of Handoff

Sprint 4 is the final sprint. Focus on:
1. **Testnet deployment** — the demo MUST work on Testnet for judges
2. **Visual polish** — Silk, SpotlightCard, ShinyText make the difference
3. **Demo rehearsal** — practice the 9-step flow, under 3 minutes
4. **STRETCH only if time** — resume_all + drain_funds are nice-to-have

Planning verdict: **PASS**. Sprint 0-3 execution: **COMPLETE**. Sprint 4 may begin.
