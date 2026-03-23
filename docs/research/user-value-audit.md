# AlgoFlow -- User Value Audit

**Auditor:** User Value Auditor (Maestro P0)
**Date:** 2026-03-23
**Project:** AlgoFlow -- Real-Time Programmable Payroll Streaming on Algorand
**Scope:** Two-perspective audit against all 47 FRs (39 MVP + 8 STRETCH at time of audit; subsequently updated to 42 MVP + 5 STRETCH per DEC-016 which accepted this audit's promotion recommendations)

---

## AUDIT 1: EMPLOYER PERSPECTIVE

**Persona:** "Raj" -- DAO Treasury Manager paying 50 contributors
**Context:** Raj manages treasury for a mid-size DAO. He currently uses spreadsheets and monthly batch transfers. He needs transparency, automation, and control.

### Employer Activity Coverage Matrix

| # | Activity | Verdict | Coverage Details | Severity if Gap |
|---|----------|---------|-----------------|-----------------|
| E1 | **Onboarding: First-time setup** | PARTIALLY COVERED | FR-01 (deploy contract), FR-02 (opt-in ASA), FR-41 (deploy script) handle the technical setup. Landing page (master-plan item 6) provides "I'm an Employer" entry point. **Missing:** No guided first-time wizard or step-by-step onboarding flow in the UI. Raj must know to: (1) deploy a contract, (2) opt-in to ASA, (3) fund it -- but the employer dashboard assumes the contract already exists. The deploy step happens via CLI scripts, not the dashboard. For a hackathon demo this is acceptable since the deployer IS the employer, but for a real user this is a gap. | MEDIUM |
| E2 | **Funding: Depositing money** | COVERED | FR-03 (fund contract via asset transfer), FR-23 (fund through UI), FR-22 (view contract token + ALGO balance). Raj can deposit salary tokens and see the current balance. The flow is explicit: enter amount, sign transaction, see confirmation with tx ID (FR-39) and explorer link (FR-27). | -- |
| E3 | **Hiring/Registration: Adding team members** | COVERED | FR-04 (register employee with address + rate), FR-24 (register via UI), FR-29 (batch-register up to 3 atomically). Raj enters an Algorand address and hourly rate. Batch registration (MVP per ambiguity-resolutions.md) lets him add multiple people in one atomic group. **Minor friction:** Raj must obtain each contributor's Algorand address out-of-band. No invite link or QR code (G7 was explicitly skipped). Acceptable for hackathon. | -- |
| E4 | **Salary Management: Rates and units** | COVERED | FR-07 (update rate with retroactive settlement), FR-26 (update rate from UI). Ambiguity resolution A6 confirms multi-unit input: hourly, daily, weekly, monthly with automatic conversion. Display shows all units simultaneously. Rate stored as tokens/hour on-chain; UI converts. Raj can set $100/hr and see it as $73,000/month. | -- |
| E5 | **Oversight: Real-time visibility** | COVERED | FR-25 (view employee list with rates, status, accrued amounts), FR-06 (query accrued balance for any employee), FR-22 (contract balance). Raj sees a live list of all registered employees with their current accrual, status (active/paused), and rate. **Minor limitation:** The "real-time" update on the employer side relies on polling or manual refresh (implicit requirement I17 was flagged as "NOT specified" in the gaps report). The streaming counter is primarily an employee feature. Employer sees accrued amounts but they may not tick live without a polling mechanism. | -- |
| E6 | **Control: Pause, resume, remove** | PARTIALLY COVERED | FR-08 (pause individual stream -- MVP), FR-09 (resume stream -- STRETCH), FR-10 (remove employee -- STRETCH). Raj can pause any individual employee's stream immediately. **Gap:** Resume and remove are STRETCH features. If only MVP ships, Raj can pause someone but cannot unpause them -- the stream is effectively terminated. This is a significant control limitation. A paused stream with no resume is a one-way action that forces redeployment or re-registration as a workaround. | CRITICAL |
| E7 | **Milestone Payments: Deliverable-based pay** | COVERED | FR-milestone_pay (added via ambiguity resolution A1), employer dashboard gets "Send Milestone Payment" button per employee. Raj can send a one-time payment for a completed deliverable alongside the continuous stream. This is a direct inner-transaction transfer, not a complex milestone-tracking system, but it satisfies the core need. | -- |
| E8 | **Financial Health: Runway and alerts** | PARTIALLY COVERED | FR-28 (contract runway indicator -- hours/days until depleted). Ambiguity resolution confirms this is MVP. The formula is `contract_balance / sum_of_all_rates`. **Gap:** No alert/notification system when funds are running low. Raj must manually check the dashboard. There is no email, push, or on-screen alert that says "Warning: funds will run out in 12 hours." The runway indicator is passive, not proactive. | MEDIUM |
| E9 | **Audit Trail: Provable payment records** | PARTIALLY COVERED | FR-27 (explorer links for every transaction), FR-39 (success confirmation with tx ID), FR-34 (transaction history). All on-chain transactions are verifiable via Algorand Explorer. Transaction notes use `algoflow:` prefix for indexer filtering. **Gap:** FR-30 (export payroll report as CSV) is STRETCH. Without it, Raj cannot generate a downloadable report for stakeholders. He can point them to individual explorer links but has no consolidated audit document. For DAO governance proposals or financial reviews, a CSV/PDF export is important. | MEDIUM |
| E10 | **Security: Delegated access** | PARTIALLY COVERED | FR-14 (contract rejects unauthorized callers), FR-45 (rekeying demonstration -- STRETCH). The contract validates `Txn.sender == self.employer` on all employer methods. **Gap:** Rekeying (delegating payroll ops to an HR manager) is STRETCH. If only MVP ships, Raj is the sole operator -- he cannot delegate registration or funding to a team lead without sharing his private key. For a 50-person DAO this is a real operational bottleneck. The rekeying demo (A2) is designed but classified as attempt-only-after-MVP. | MEDIUM |
| E11 | **Emergency: Stop everything** | PARTIALLY COVERED | FR-11 (pause all streams -- STRETCH), FR-13 (drain funds -- STRETCH). **Gap:** Both emergency controls are STRETCH. In MVP, Raj can only pause employees one at a time (FR-08). With 50 contributors (or even 3 in the demo), there is no emergency stop button. If the contract is compromised or Raj discovers an error, he must pause each stream individually. No drain_funds means he cannot recover deposited tokens in an emergency. | CRITICAL |
| E12 | **Off-boarding: Employee departure** | GAP (MVP) / PARTIALLY COVERED (STRETCH) | FR-10 (remove employee with final payout -- STRETCH). **Gap:** In MVP, there is no off-boarding flow. Raj can pause a stream (one-way, since resume is also STRETCH), but the employee remains "registered" in local state. There is no final settlement, no deregistration, no cleanup. The employee's local state slots remain allocated. For a DAO with contributor turnover, this is a gap. | CRITICAL |

### Employer Audit Summary

| Verdict | Count | Items |
|---------|-------|-------|
| COVERED | 4 | E2 (Funding), E3 (Registration), E4 (Salary Mgmt), E7 (Milestone) |
| PARTIALLY COVERED | 6 | E1 (Onboarding), E5 (Oversight), E6 (Control), E8 (Financial Health), E9 (Audit Trail), E10 (Security) |
| GAP | 1 | E12 (Off-boarding -- no MVP coverage) |
| **CRITICAL gaps** | 3 | E6 (no resume), E11 (no emergency stop), E12 (no off-boarding) |
| **MEDIUM gaps** | 3 | E1 (no setup wizard), E8 (no low-fund alerts), E9 (no CSV export in MVP) |

---

## AUDIT 2: EMPLOYEE PERSPECTIVE

**Persona:** "Alice" -- Remote contractor working for 2-3 DAOs simultaneously
**Context:** Alice is a smart contract developer paid by multiple DAOs. She wants real-time earnings visibility, easy withdrawals, and clear status across all engagements.

### Employee Activity Coverage Matrix

| # | Activity | Verdict | Coverage Details | Severity if Gap |
|---|----------|---------|-----------------|-----------------|
| A1 | **Discovery: Knowing I'm registered** | PARTIALLY COVERED | Ambiguity resolution A5 states: "Employee receives a notification (or knows to check) and must opt-in." The employee dashboard shows "You've been registered by [employer]. Opt in to start receiving salary." **Gap:** The phrase "or knows to check" is vague. There is no push notification, email, or on-chain event (ARC-28 events are STRETCH -- FR/G9) that proactively tells Alice she has been registered. She must manually connect her wallet and check the dashboard. If she does not know to check, she may not discover she has been registered until someone tells her out-of-band. | MEDIUM |
| A2 | **Onboarding: Starting to receive salary** | COVERED | FR-19 (opt-in to ASA), FR-20 (opt-in to app). The employee dashboard shows a clear prompt with a one-click opt-in button. The flow is: connect wallet, see registration notice, click "Opt In", sign transaction, stream begins. This is well-designed and blockchain-native. Alice needs ALGO for the opt-in MBR (minimum balance requirement), which is a standard Algorand friction point but is handled by the setup scripts (FR-42) for demo purposes. | -- |
| A3 | **Earnings Visibility: Real-time accrual** | COVERED | FR-32 (real-time streaming counter), FR-06 (query accrued balance). This is the "wow" moment of the application. Alice sees a counter ticking up every second showing her salary accruing. The JS timer recalculates `rate * elapsed / 3600` each second. On-chain calculation happens only at withdrawal. This is the core value proposition for employees and it is fully designed. | -- |
| A4 | **Withdrawal: Getting my money** | COVERED | FR-05 (withdraw accrued tokens), FR-33 (one-button withdraw), FR-39 (success confirmation with tx ID and explorer link). Alice clicks one button, signs one transaction, and receives all accrued tokens. The contract computes the exact amount owed via on-chain timestamps. Settlement is instant (3.3s Algorand finality). Fee is ~$0.00024. This is clean and well-designed. | -- |
| A5 | **Rate Transparency: Understanding my pay** | COVERED | FR-35 (view current hourly rate and status). Ambiguity resolution A6 confirms multi-unit display: $/hr, $/day, $/week, $/month shown simultaneously. Ambiguity resolution A4 confirms PAYUSD displayed as "$" (1 PAYUSD = $1.00). Alice sees "$100/hr = $2,400/day = $16,800/week = $73,000/month" -- immediately understandable. | -- |
| A6 | **History: Past payment records** | COVERED | FR-34 (withdrawal history with timestamps, amounts, explorer links). Transaction notes use `algoflow:` prefix for indexer filtering (I18). Alice can see all past withdrawals with clickable links to verify each one on Algorand Explorer. On-chain data is immutable and permanent. | -- |
| A7 | **Status: Stream active or paused** | PARTIALLY COVERED | FR-35 (view stream status -- active/paused). Alice can see whether her stream is active or paused. **Gap:** Alice cannot see WHO paused her stream or WHY. The local state `is_active` is a binary flag (0 or 1) with no metadata about the pause event. If her stream is paused, she sees "Paused" but has no context -- was it an error? A temporary hold? Is the employer out of funds? There is no pause reason field and no notification when the status changes. | LOW |
| A8 | **Multiple Employers: Cross-DAO visibility** | GAP | Ambiguity resolution A3 confirms: one employer per contract instance. Multiple employers deploy separate contracts. **Gap:** There is no multi-contract aggregation view. If Alice works for 3 DAOs, she must manually connect to 3 different contract instances (3 different APP_IDs) and check each dashboard separately. There is no unified "My Streams" view that aggregates all her active streams across contracts. The frontend is hardcoded to a single `VITE_APP_ID`. This is a significant usability gap for Alice's persona, which explicitly states she works for "2-3 DAOs simultaneously." | CRITICAL |
| A9 | **Notifications: Rate changes, pauses, milestones** | GAP | ARC-28 event emission (G9) is STRETCH. Toast/notification system (G14/FR-14 in updated count) is MVP but only for in-session actions (transaction confirmations). **Gap:** There is no notification mechanism for events that happen when Alice is not actively viewing the dashboard. If her employer changes her rate, pauses her stream, or sends a milestone payment while she is offline, she has no way to know until she logs back in and manually checks. No email, no push notification, no on-chain event subscription. | MEDIUM |
| A10 | **Security: Fund safety** | COVERED | The contract computes withdrawable amounts from on-chain timestamps -- employees cannot claim more than earned (CLAUDE.md security section). Once tokens are withdrawn to Alice's wallet, the employer cannot claw them back -- the clawback address is the contract (not the employer), and the contract has no "reclaim" method. Inner transactions are initiated by the contract, not external signers. Alice's private keys never leave her wallet app (WalletConnect). Overdraft protection (G11, MVP) prevents failed withdrawals. | -- |
| A11 | **Timezone: Local time display** | COVERED | Ambiguity resolution A10 confirms full timezone handling. Contract uses UTC (`Global.latest_timestamp`). Frontend detects browser timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`. All displayed times are converted to local time. Example: "Streaming since Mar 23, 2026 11:30 AM IST". Timezone preference stored in localStorage. | -- |
| A12 | **Mobile Access: Phone-based checking** | GAP | Master-plan "Explicitly Out of Scope" item 6: "Mobile wallet app development." Responsive design is classified as STRETCH in the gaps report. The frontend is built with React + Tailwind (which supports responsive design), but viewport optimization is not specified (implicit requirement I15: "NOT specified"). Alice cannot check her accrual from her phone unless the web app happens to render acceptably on mobile -- but this is not designed for or tested. | LOW |

### Employee Audit Summary

| Verdict | Count | Items |
|---------|-------|-------|
| COVERED | 7 | A2 (Onboarding), A3 (Earnings), A4 (Withdrawal), A5 (Rate), A6 (History), A10 (Security), A11 (Timezone) |
| PARTIALLY COVERED | 2 | A1 (Discovery), A7 (Status detail) |
| GAP | 3 | A8 (Multi-employer), A9 (Notifications), A12 (Mobile) |
| **CRITICAL gaps** | 1 | A8 (no multi-contract view for multi-DAO worker) |
| **MEDIUM gaps** | 2 | A1 (no proactive registration notice), A9 (no offline notifications) |
| **LOW gaps** | 2 | A7 (no pause reason/context), A12 (no mobile optimization) |

---

## CONSOLIDATED GAP ANALYSIS

### All Gaps by Severity

| Severity | ID | Gap Description | Affects | Existing FR? |
|----------|----|----------------|---------|--------------|
| CRITICAL | E6 | No `resume_stream` in MVP -- pause is a one-way action | Employer | FR-09 exists but is STRETCH |
| CRITICAL | E11 | No emergency stop-all or drain in MVP | Employer | FR-11, FR-13 exist but are STRETCH |
| CRITICAL | E12 | No off-boarding/removal flow in MVP | Employer | FR-10 exists but is STRETCH |
| CRITICAL | A8 | No multi-contract aggregation for multi-DAO employees | Employee | Not addressed at all |
| MEDIUM | E1 | No guided first-time setup wizard in the UI | Employer | Not addressed |
| MEDIUM | E8 | No proactive low-fund alerts (runway is passive only) | Employer | Not addressed |
| MEDIUM | E9 | No CSV/PDF export in MVP | Employer | FR-30 exists but is STRETCH |
| MEDIUM | E10 | No delegated access in MVP (rekeying is STRETCH) | Employer | FR-45 exists but is STRETCH |
| MEDIUM | A1 | No proactive notification of registration | Employee | Not addressed |
| MEDIUM | A9 | No offline notification system for rate changes, pauses | Employee | G9 (ARC-28) is STRETCH |
| LOW | A7 | No pause reason or context shown to employee | Employee | Not addressed |
| LOW | A12 | No mobile-responsive design guarantee | Employee | I15 flagged but unresolved |

### Gap Classification by Root Cause

| Root Cause | Gaps | Pattern |
|------------|------|---------|
| **STRETCH features too critical** | E6, E11, E12, E10, E9 | Five employer-critical features (resume, emergency stop, off-boarding, delegation, export) are classified as STRETCH. Three of these are CRITICAL severity. The MVP/STRETCH boundary needs adjustment. |
| **Missing feature entirely** | A8, E1, E8, A1, A7, A12 | Six gaps have no corresponding FR at all -- they were never identified as requirements. |
| **Notification system absent** | A1, A9, E8 | Three gaps stem from the same root: no asynchronous notification mechanism exists. The toast system (MVP) only covers in-session events. |

---

## RECOMMENDED ADDITIONS

### Priority 1: Promote from STRETCH to MVP (Critical Gaps)

These features already have STRETCH FRs but should be reclassified to MVP because their absence breaks core user workflows.

| Current FR | Recommendation | Justification |
|------------|---------------|---------------|
| FR-09 `resume_stream` | **Promote to MVP** | Without resume, pause is a destructive action. No employer would use a payroll system where pausing an employee's pay is irreversible. This undermines trust in the entire pause mechanism (FR-08). Implementation is the inverse of pause -- low additional effort. |
| FR-10 `remove_employee` | **Promote to MVP** | Without removal, off-boarded employees permanently occupy local state slots. For the demo (3 employees), this may not surface, but it signals incomplete lifecycle management to judges evaluating "real-world viability." |
| FR-11 `pause_all` | **Promote to MVP** | Emergency controls are table-stakes for financial software. A payroll system with no emergency stop is a liability. If the contract is funded with $100K and something goes wrong, the employer must pause 50 streams one by one. Even for the demo, an "Emergency Stop" button is a powerful visual. |

### Priority 2: New FRs for Identified Gaps

| Proposed FR | Description | Persona | Severity | Effort |
|-------------|-------------|---------|----------|--------|
| FR-NEW-01 | [Employee] can view a unified list of all active streams across multiple contract instances by entering or bookmarking multiple APP_IDs | Employee (Alice) | CRITICAL | HIGH -- requires frontend multi-contract support, contract discovery, and state aggregation. Recommend deferring to post-hackathon but acknowledging in the "Vision" section. |
| FR-NEW-02 | [System] displays a warning banner on the employer dashboard when contract runway falls below a configurable threshold (e.g., 24 hours) | Employer (Raj) | MEDIUM | LOW -- frontend-only check against the existing runway calculation. Add a conditional banner: `if runway < 24h, show warning`. |
| FR-NEW-03 | [Employee] sees a "New" badge or status change indicator when their rate has been updated or stream has been paused/resumed since their last visit | Employee (Alice) | MEDIUM | LOW -- store last-visit timestamp in localStorage, compare against on-chain `last_withdrawal` or rate-change events. |
| FR-NEW-04 | [Employer] sees a guided setup checklist on first visit (deploy status, ASA opt-in status, funding status, first employee registered) | Employer (Raj) | MEDIUM | LOW -- frontend component that checks contract state and shows completion progress. |
| FR-NEW-05 | [Employee] can see a brief reason or context label when their stream is paused (e.g., "Paused by employer" vs "Paused: insufficient funds") | Employee (Alice) | LOW | MEDIUM -- requires adding a pause_reason field to local state or using transaction notes. |

### Priority 3: Acknowledged but Deferred (Post-Hackathon)

These gaps are real but too costly to address in a 48-hour hackathon window.

| Gap | Rationale for Deferral |
|-----|----------------------|
| A8: Multi-contract aggregation | Requires architectural changes (multi-APP_ID support, contract discovery protocol). Explicitly out of scope for single-contract demo. Should be item 3 in the Vision section (already partially listed as "Multi-employer contracts"). |
| A12: Mobile-responsive design | Explicitly out of scope (master-plan item 6). Tailwind CSS provides baseline responsiveness, but testing and optimizing for mobile is time-prohibitive. |
| E10: Delegated access (rekeying) | Already classified as STRETCH with a clear design (A2). Attempt only after all MVP is complete. |
| A9: Offline notifications | Requires push notification infrastructure (service workers, or ARC-28 indexer integration). Too complex for hackathon. ARC-28 events (G9 STRETCH) are the stepping stone. |

---

## VERDICT

### Employer Persona ("Raj" -- DAO Treasury Manager)

**Overall Assessment: STRONG FOUNDATION, INCOMPLETE LIFECYCLE**

AlgoFlow delivers exceptional value on the core employer workflows: funding, registration, salary management, milestone payments, and real-time oversight. The atomic batch registration, multi-unit rate input, and explorer-linked transparency are genuinely superior to spreadsheet-and-wire-transfer workflows.

However, the MVP has a critical lifecycle gap. An employer can start streams and pause them, but cannot resume them, cannot remove departed employees, and cannot emergency-stop all streams. This means the system handles the "happy path" well but fails on the "management path" -- the day-to-day operational actions a treasury manager needs. Promoting `resume_stream`, `remove_employee`, and `pause_all` from STRETCH to MVP would close the three CRITICAL gaps with relatively low additional engineering effort (these are straightforward inverse/batch operations on existing logic).

The financial health indicator (runway) is well-designed but passive. Adding a low-fund warning banner (FR-NEW-02) would transform it from a "nice gauge" to an actionable alert -- minimal effort, meaningful impact.

**Employer value score: 7/10 (MVP as-is) | 9/10 (with STRETCH promotions)**

### Employee Persona ("Alice" -- Multi-DAO Contractor)

**Overall Assessment: EXCELLENT CORE EXPERIENCE, SINGLE-EMPLOYER LIMITATION**

AlgoFlow's employee experience is its strongest selling point. The real-time streaming counter is the "wow" moment that makes the demo memorable. One-click withdrawal with instant settlement, multi-unit rate display, timezone-aware timestamps, and immutable on-chain history deliver genuine value over "wait 30 days for a bank wire."

The critical gap is multi-employer support. Alice's persona explicitly works for 2-3 DAOs, but the frontend is hardcoded to a single APP_ID. She cannot see all her streams in one place. This is architecturally difficult to fix in 48 hours (it requires contract discovery and multi-state aggregation), but it should be prominently acknowledged in the Vision section and demo narrative.

The notification gap (no awareness of rate changes or pauses when offline) is a real-world pain point but acceptable for a hackathon demo where all actions happen live. The localStorage-based "New" badge (FR-NEW-03) would be a low-effort mitigation.

Security is well-handled: withdrawn funds are safe from employer clawback, amounts are computed on-chain, and private keys never leave the wallet.

**Employee value score: 8/10 (MVP as-is) | 9/10 (with FR-NEW-01 and FR-NEW-03)**

### Combined Verdict

AlgoFlow's value proposition is **compelling for a hackathon submission**. The core streaming mechanic, Algorand-native features (ASAs, atomic groups, inner transactions, instant finality), and dual-dashboard design deliver a clear, demonstrable improvement over traditional payroll. The "real-time salary counter" is a genuinely powerful demo moment.

The primary risk is the STRETCH classification of operationally critical features (resume, remove, emergency stop). If judges evaluate "would I actually use this?" -- the inability to resume a paused stream or remove a departed employee signals an incomplete product. Promoting these three features to MVP is the single highest-impact action to strengthen the submission.

**Recommended action sequence:**
1. Promote FR-09 (resume), FR-10 (remove), FR-11 (pause_all) to MVP -- closes all 3 CRITICAL employer gaps
2. Add FR-NEW-02 (low-fund warning banner) -- 30 minutes of work, meaningful employer value
3. Add FR-NEW-03 (status change indicator) -- 30 minutes of work, meaningful employee value
4. Acknowledge A8 (multi-employer) in Vision section with a clear future roadmap

**Total effort for recommendations 1-3: approximately 3-4 hours of additional development.**
