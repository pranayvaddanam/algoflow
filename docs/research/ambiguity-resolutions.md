# AlgoFlow — Ambiguity Resolutions, Gap Inclusions & Contradiction Fixes

**Date:** 2026-03-23
**Source:** User feedback on requirements-gaps.md during P0 Approval Gate

---

## 1. Ambiguity Resolutions (All 10)

### A1: Milestone-Based Streaming → INCLUDED IN MVP
**User decision:** "Yes, milestone-based streaming needs to be present. Judges would find it useful."
**Design:** Add a `milestone_pay(employee, amount)` contract method. Employer calls it when a deliverable is completed — triggers an immediate inner transaction transfer alongside the continuous time-based streaming. No complex milestone state tracking needed.
**Contract changes:** +1 method (`milestone_pay`). Total MVP methods: 9 (was 8).
**Frontend:** Employer dashboard gets a "Send Milestone Payment" button per employee.

### A2: Rekeying Scope → SIMPLE DEMONSTRATION
**Decision:** Keep simple. Demonstrate employer delegating payroll operations to an HR manager address. The HR manager can trigger fund deposits and employee registrations using the employer's rekeyed authority. Show this as a single demo step: "HR manager signs a payroll transaction using delegated authority — no access to employer's funds."
**Implementation:** Off-chain rekeying transaction via algosdk (not a contract method). Employer rekeys a sub-account to HR manager's key. HR manager then calls contract methods on behalf of employer.

### A3: Multi-Employer → SINGLE EMPLOYER PER CONTRACT
**Decision:** One employer per contract instance. Multiple employers deploy separate contracts. Simple, clean, no added complexity. For demo, one employer is sufficient. This is the same model Sablier uses.

### A4: PAYUSD Token → STABLECOIN ANALOG (like USDT)
**User decision:** "Should be viewed as analogous to USDT."
**Impact:** Display as "$" in the UI. 1 PAYUSD = $1.00. All rate inputs show $/hr, $/day, $/month. Dashboard shows dollar signs. This makes the demo immediately understandable to non-crypto judges.

### A5: Employee Registration → EMPLOYER REGISTERS, EMPLOYEE OPTS IN
**Decision:** Employer registers employee by address + rate. Employee receives a notification (or knows to check) and must opt-in to both the ASA and the app to activate their stream. This is a natural blockchain flow and shows understanding of Algorand's opt-in model.
**Frontend:** Employee dashboard shows "You've been registered by [employer]. Opt in to start receiving salary." with a one-click opt-in button.

### A6: Rate Unit Input → SUPPORT MULTIPLE UNITS WITH CONVERSION
**User decision:** "Yes, that sounds like an employee would use that feature."
**Implementation:** Frontend input accepts hourly, daily, weekly, or monthly rates. Conversion to hourly (base unit for contract):
- Monthly → ÷ 730 (avg hours/month)
- Weekly → ÷ 168
- Daily → ÷ 24
- Hourly → direct
Display shows all units simultaneously: "$100/hr = $2,400/day = $16,800/week = $73,000/month"

### A7: Maximum Employees → 3 FOR DEMO
**User decision:** "Demo can support up to 3 employees."
**Impact:** Contract has no hard limit (bounded by opt-in accounts), but demo scripts, setup, and test data are configured for 3 employees. UI optimized for 3-employee display.

### A8: Contract Upgradability → DEFER (IMMUTABLE)
**Decision:** Contract is immutable after deployment. Too complex for hackathon. If the contract needs changes, redeploy. The demo reset script handles this.

### A9: Multiple Salary Tokens → ONE TOKEN PER CONTRACT
**Decision:** One ASA per contract. Simplest model. If different tokens are needed, deploy separate contracts. No added complexity.

### A10: Timezone Handling → IMPLEMENT
**User decision:** "Timezone handling would make our application more robust."
**Implementation:**
- Contract: All timestamps in UTC (Global.latest_timestamp is Unix epoch).
- Frontend: Detect browser timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Display: Convert UTC timestamps to local time for all user-facing dates/times.
- Rate display: "Streaming since Mar 23, 2026 11:30 AM IST" (not UTC).
- Store timezone preference in localStorage.

---

## 2. Gap Inclusions (All 15 Resolved)

### High-Impact Demo Features

| # | Gap | Decision | Classification | Notes |
|---|-----|----------|---------------|-------|
| G1 | Explorer links | **INCLUDE** | MVP | Every tx links to Lora Explorer (testnet) or LocalNet equivalent. Already decided. |
| G2 | Real-time streaming animation | **INCLUDE** | MVP | StreamCounter.tsx — JS timer recalculates accrual every second. Core wow factor. |
| G3 | One-click demo reset | **INCLUDE** | MVP | `scripts/demo_reset.py` — tears down and redeploys for clean state. Critical for repeated demo runs. |
| G4 | Contract runway indicator | **INCLUDE** | MVP | Calculate: `contract_balance / (sum_of_all_rates)` = hours remaining. Display as gauge on employer dashboard. |
| G5 | Batch registration | **INCLUDE** | MVP | Register up to 3 employees in one atomic group. Shows atomic transfer mastery. Fits demo size (3 employees). |
| G6 | Export payroll report (CSV) | **INCLUDE** | STRETCH | Button on employer dashboard. CSV with columns: employee, rate, accrued, withdrawn, status. |
| G7 | QR code onboarding | **SKIP** | — | Too high effort for 48h. Employee address is entered manually or pasted. |

### Technical Depth Signals

| # | Gap | Decision | Classification | Notes |
|---|-----|----------|---------------|-------|
| G8 | Test coverage report | **INCLUDE** | MVP | `pytest --tb=short` output shown in README/demo. Shows engineering rigor. |
| G9 | ARC-28 events | **INCLUDE** | STRETCH | Emit events for: stream_started, withdrawal, rate_changed, stream_paused. Indexer can subscribe. |
| G10 | Multi-asset streaming | **SKIP** | — | Too complex. One token per contract is sufficient. |
| G11 | Overdraft protection | **INCLUDE** | MVP | Contract checks balance before inner transfer. If insufficient, auto-pauses stream and emits warning. Prevents failed withdrawals. |
| G12 | Retroactive settlement on rate change | **INCLUDE** | MVP | `update_rate` method first settles accrued at old rate (inner tx), then applies new rate. Already implied by design. |

### Presentation Polish

| # | Gap | Decision | Classification | Notes |
|---|-----|----------|---------------|-------|
| G13 | Architecture diagram | **INCLUDE** | MVP | "How it Works" section on landing/home page. SVG diagram showing: Employer → Contract → Employee flow. |
| G14 | Toast/notification system | **INCLUDE** | MVP | React-hot-toast or similar. Show: "Transaction confirmed ✓", "Withdrawal successful", "Error: insufficient funds". Professional feel. |
| G15 | Keyboard shortcuts | **SKIP** | — | Minor polish, not worth time investment. |

---

## 3. Contradiction Resolutions (All 5)

### C1: Must-Have Methods Count → NOW 12 (was 8) + milestone_pay + 3 promoted from STRETCH
**Resolution:** With milestone_pay added and resume_stream, remove_employee, pause_all promoted from STRETCH per DEC-016 (user-value audit), MVP contract methods are:
1. `create(asset)` — initialize
2. `opt_in_asset()` — contract opts into ASA
3. `fund(axfer)` — deposit tokens
4. `register_employee(account, rate)` — register
5. `withdraw()` — employee claims accrued
6. `get_accrued(account)` — read-only check
7. `update_rate(account, new_rate)` — change rate (with retroactive settlement)
8. `pause_stream(account)` — pause
9. `milestone_pay(employee, amount)` — one-time milestone payment
10. `resume_stream(account)` — resume a paused stream (promoted per DEC-016)
11. `remove_employee(account)` — final payout + deregister (promoted per DEC-016)
12. `pause_all()` — emergency pause all streams (promoted per DEC-016)

STRETCH methods (2): resume_all, drain_funds
CLAUDE.md updated to reflect 12 MVP methods.

### C2: Two Dashboards + Role Detection → SINGLE APP, TWO ROUTES
**Resolution:**
- Single React app with React Router
- Routes: `/` (landing/home), `/employer`, `/employee`
- Auto-detection: on wallet connect, query contract's `employer` global state. If connected address matches → redirect to `/employer`. Otherwise → redirect to `/employee`.
- Manual override: toggle button on landing page ("I'm an Employer" / "I'm an Employee") for cases where auto-detect fails or user wants to view both.
- Landing page shows "How it Works" architecture diagram.

### C3: LocalNet vs Testnet → DUAL-ENVIRONMENT SUPPORT
**Resolution:**
- `VITE_NETWORK` env var controls which environment the frontend connects to
- `localnet`: Algod at `http://localhost:4001`, KMD signing, instant blocks
- `testnet`: Algod at `https://testnet-api.algonode.cloud`, Pera Wallet signing
- Deployment scripts accept `--network localnet|testnet` flag
- Demo script works on both — auto-detects network
- Keep LocalNet running as instant fallback during Testnet demo

### C4: Pera Wallet on LocalNet → RESOLVED VIA @txnlab/use-wallet
**Resolution:** NOT A RISK. The `@txnlab/use-wallet-react` library supports multiple wallet providers simultaneously:
- **LocalNet:** KMD provider (built into AlgoKit). Transactions signed server-side by KMD daemon. No external wallet app needed. No popup. Instant signing.
- **Testnet:** Pera provider. Real Pera Wallet popup for signing. Full WalletConnect flow.
- **Same `useWallet()` hook** in React for both. Zero code changes between environments.
- Provider selection is automatic based on `VITE_NETWORK` env var.
- KMD provider configuration:
  ```typescript
  // Automatically available on LocalNet
  { id: 'kmd', name: 'KMD', options: { host: 'http://localhost:4002', token: 'a]'.repeat(16) } }
  ```

### C5: Rekeying — No Methods → DESIGNED AS DEMO STEP
**Resolution:** Rekeying is demonstrated as an off-chain transaction step, NOT a contract method:
1. Employer has a "payroll operations" sub-account funded with ALGO for fees
2. Employer rekeys this sub-account to an HR manager's address (algosdk `PaymentTxn` with `rekey_to` field)
3. HR manager can now sign transactions from the sub-account's address
4. HR manager calls contract methods (register_employee, fund) using the sub-account's address but signing with their own key
5. Demo narrative: "The HR manager triggers payroll operations without having access to the employer's main funds"
6. If time doesn't permit: skip this. The rekeying demo is impressive but the core streaming demo is more important.
**Classification:** STRETCH — attempt only after all MVP is complete.

---

## 4. Updated FR Count

| Category | MVP | STRETCH | Total |
|----------|-----|---------|-------|
| Smart Contract | 14 (+1 milestone_pay, +1 overdraft, +3 promoted per DEC-016) | 2 | 16 |
| Token / ASA | 4 | 0 | 4 |
| Employer Dashboard | 8 (+1 milestone button, +1 runway indicator) | 2 | 10 |
| Employee Dashboard | 5 | 0 | 5 |
| Shared Frontend | 7 (+1 toast, +1 architecture diagram) | 0 | 7 |
| DevOps / Demo | 4 (+1 demo reset) | 0 | 4 |
| Rekeying | 0 | 1 | 1 |
| **TOTAL** | **42** | **5** | **47** |

> Note: Originally 39 MVP / 8 STRETCH after this resolution. Updated to 42 MVP / 5 STRETCH when DEC-016 promoted resume_stream, remove_employee, pause_all from STRETCH to MVP per user-value audit recommendations.

---

## 5. Updated Contract Method Table

### MVP (12 methods)
| Method | Caller | Description |
|--------|--------|-------------|
| `create(asset)` | Employer | Initialize contract with salary ASA |
| `opt_in_asset()` | Employer | Contract opts into the salary ASA |
| `fund(axfer)` | Employer | Deposit salary tokens into contract |
| `register_employee(account, rate)` | Employer | Register employee with hourly rate |
| `withdraw()` | Employee | Claim all accrued salary tokens |
| `get_accrued(account)` | Anyone | Read-only: view accrued balance |
| `update_rate(account, new_rate)` | Employer | Settle at old rate, apply new rate |
| `pause_stream(account)` | Employer | Pause employee's stream (settles accrued first) |
| `milestone_pay(employee, amount)` | Employer | One-time milestone payment via inner transaction |
| `resume_stream(account)` | Employer | Resume a paused stream (promoted per DEC-016) |
| `remove_employee(account)` | Employer | Final payout + deregister (promoted per DEC-016) |
| `pause_all()` | Employer | Emergency pause all streams (promoted per DEC-016) |

### STRETCH (2 methods)
| Method | Caller | Description |
|--------|--------|-------------|
| `resume_all()` | Employer | Resume all streams |
| `drain_funds()` | Employer | Withdraw remaining pool |
