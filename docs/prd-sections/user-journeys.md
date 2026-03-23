# AlgoFlow -- User Journeys

**Author:** User Journey Writer (Maestro P0)
**Date:** 2026-03-23
**Personas:** Raj (DAO Treasury Manager / Employer), Alice (Remote Contractor / Employee)
**Source:** 00-master-plan.md, requirements-gaps.md, user-value-audit.md

---

## Journey 1: First-Time Employer Setup

**Persona**: Raj (DAO Treasury Manager)
**Trigger**: Raj's DAO votes to replace monthly batch payments with continuous salary streaming. Raj opens AlgoFlow for the first time to set up the payroll infrastructure.
**Preconditions**: Raj has an Algorand wallet (Pera on Testnet or KMD on LocalNet) funded with at least 10 ALGO for transaction fees and minimum balance requirements. No AlgoFlow contract exists yet.

1. Raj navigates to the AlgoFlow landing page at `/` and sees the "How It Works" architecture diagram explaining the streaming model -- employer funds a contract, salaries accrue every second, employees withdraw anytime. He clicks "I'm an Employer" to proceed to `/employer`. (FR-FRONTEND-001, FR-FRONTEND-002)

2. The app prompts Raj to connect his wallet. He opens Pera Wallet on his phone, scans the WalletConnect QR code, and approves the connection. The dashboard shows his wallet address and ALGO balance. On LocalNet, he would instead select his KMD account from a dropdown with no popup required. (FR-WALLET-001, FR-FRONTEND-008)

3. Since no contract is deployed, the employer dashboard shows a **Setup Checklist** with four steps: (a) Deploy contract, (b) Opt in to salary token, (c) Fund contract, (d) Register first employee. Step (a) is highlighted as "current." Raj sees clear progress indicators -- no guesswork about what to do next. (FR-EMPLOYER-010)

4. Raj runs the deployment script from his terminal: `algokit deploy --network testnet`. This creates the PAYUSD salary token (1,000,000 tokens, 6 decimals, unit name "PAYUSD") and deploys the PayrollStream contract in a single command. The script outputs the ASA ID and App ID. (FR-TOKEN-001, FR-CONTRACT-001, FR-DEVOPS-001)

5. Back in the dashboard, Raj refreshes and the checklist updates -- step (a) shows a green checkmark. He clicks "Opt In to PAYUSD" and signs the transaction in Pera. The contract can now hold salary tokens. A toast notification confirms: "Contract opted in to PAYUSD -- Tx: 7X2K...R9M4" with a clickable link to Lora Explorer. (FR-CONTRACT-002, FR-FRONTEND-006, FR-FRONTEND-007)

6. Raj enters 100,000 in the funding form and clicks "Fund Contract." Pera prompts him to sign an atomic group containing the asset transfer and the app call. He approves. The contract balance updates to show "$100,000.00 PAYUSD" and the checklist advances to step (c) complete. (FR-CONTRACT-003, FR-EMPLOYER-002, FR-EMPLOYER-001)

7. The **Contract Health** panel now displays a runway indicator: "Runway: ~303 days at current rates" (currently zero employees, so it shows the maximum). A network badge in the corner reads "Testnet." (FR-EMPLOYER-009, FR-FRONTEND-008)

8. Raj enters the Algorand address of his first contributor, Alice, and sets her rate to $100/hr. He clicks "Register Employee." The contract writes Alice's local state: salary_rate = 100,000,000 (100 PAYUSD/hr in base units), stream_start = now, is_active = 1. The employee list shows one row: Alice's truncated address, "$100/hr", status "Active", accrued "$0.00". The checklist shows all four steps complete. (FR-CONTRACT-004, FR-EMPLOYER-003, FR-EMPLOYER-004)

9. Raj registers two more contributors in a single batch: Bob at $150/hr and Carol at $80/hr. He enters both addresses and rates, clicks "Batch Register," and signs one atomic transaction group containing both app calls. All three employees now appear in the list, all streaming. The runway indicator updates: "$100,000 / $330/hr = ~303 hours (~12.6 days)." (FR-EMPLOYER-008, FR-CONTRACT-004)

**Outcome**: Raj has a fully operational payroll system with three employees streaming salary. The contract holds $100,000 PAYUSD, all streams are active, and every setup action is verified on Algorand Explorer via clickable transaction links.

**Error paths**:
- **Wallet connection fails**: App shows "Could not connect to Pera Wallet. Please ensure your wallet app is open and try again." Raj can retry or switch to KMD on LocalNet. (FR-FRONTEND-005)
- **Insufficient ALGO for MBR**: If Raj's account does not have enough ALGO for the contract's minimum balance requirement, the opt-in transaction fails with "Insufficient ALGO balance. You need at least 0.3 ALGO for contract setup." (FR-FRONTEND-005)
- **Employee not opted in**: If Raj tries to register Alice before she has opted into the PAYUSD token and the app, the transaction is rejected with "Employee must opt in to PAYUSD and AlgoFlow before registration." The UI shows a help link explaining the opt-in process. (FR-TOKEN-003, FR-TOKEN-004)
- **Duplicate registration**: If Raj accidentally enters Alice's address again, the contract rejects it: "Employee already registered." (FR-CONTRACT-006)

---

## Journey 2: Daily Employer Operations

**Persona**: Raj (DAO Treasury Manager)
**Trigger**: It is Tuesday morning. Raj opens the AlgoFlow employer dashboard for his daily check on payroll operations. Three employees have been streaming for 5 days.
**Preconditions**: Contract deployed and funded with $100,000 PAYUSD. Three employees registered: Alice ($100/hr), Bob ($150/hr), Carol ($80/hr). All streams active for 5 days (120 hours).

1. Raj connects his wallet and is automatically routed to `/employer` because his address matches the contract's `employer` global state. The dashboard loads within 2 seconds. (FR-FRONTEND-002, FR-WALLET-001)

2. The **employee list** shows three rows with live accrued amounts:
   - Alice: $100/hr, Active, Accrued: $12,000.00 (120 hrs x $100)
   - Bob: $150/hr, Active, Accrued: $18,000.00 (120 hrs x $150)
   - Carol: $80/hr, Active, Accrued: $9,600.00 (120 hrs x $80)

   Total streamed so far: $39,600. The amounts tick up visibly as Raj watches. (FR-EMPLOYER-004, FR-CONTRACT-005)

3. The **Contract Health** panel shows: "Balance: $60,400 PAYUSD | Runway: ~183 hours (~7.6 days) at $330/hr." The runway bar is green -- no warnings yet. (FR-EMPLOYER-009)

4. The DAO has approved a rate increase for Bob from $150/hr to $200/hr, effective immediately. Raj clicks the "Update Rate" button on Bob's row, enters $200, and confirms. The contract first settles Bob's accrued $18,000 via inner asset transfer (retroactive settlement at the old rate), then sets the new rate to $200/hr and resets `last_withdrawal` to now. Bob's row updates: "$200/hr, Active, Accrued: $0.00" -- his balance was just paid out. A toast confirms: "Bob's rate updated to $200/hr. Settled $18,000.00 at previous rate." (FR-CONTRACT-007, FR-EMPLOYER-005)

5. The runway recalculates: "$42,400 / $380/hr = ~111 hours (~4.6 days)." Still green, but Raj notes he should add funds soon. (FR-EMPLOYER-009)

6. Carol has informed Raj she is taking a two-week vacation starting today. Raj clicks "Pause" on Carol's row. The contract settles Carol's accrued $9,600 (inner asset transfer), then sets her `is_active` to 0. Her row shows "Paused" in amber. The runway improves: "$32,800 / $300/hr = ~109 hours (~4.5 days)." A toast confirms: "Carol's stream paused. Settled $9,600.00." (FR-CONTRACT-008, FR-EMPLOYER-005)

7. Alice has completed a security audit deliverable worth $5,000. Raj clicks "Send Milestone Payment" on Alice's row, enters $5,000, and confirms. The contract sends $5,000 PAYUSD to Alice via inner asset transfer. This is independent of her streaming -- her hourly accrual continues uninterrupted. A toast confirms: "Milestone payment of $5,000.00 sent to Alice. Tx: M8P2...K4J7." (FR-CONTRACT-009, FR-EMPLOYER-006)

8. Raj clicks the explorer link on the milestone payment toast to verify the transaction on Lora Explorer. He sees the inner asset transfer: 5,000,000,000 microPAYUSD from the contract address to Alice's address. Confirmed in round 41,928,304. (FR-FRONTEND-007)

**Outcome**: Raj has performed four distinct payroll operations in under five minutes: reviewed accruals, updated a rate with retroactive settlement, paused a stream with settlement, and sent a milestone payment. All actions are verified on-chain.

**Error paths**:
- **Rate update with insufficient balance**: If the contract cannot cover Bob's $18,000 settlement, the overdraft protection kicks in -- the contract sends whatever is available and pauses Bob's stream. Raj sees: "Warning: Insufficient funds for full settlement. $X paid, stream paused." (FR-CONTRACT-006)
- **Milestone amount exceeds balance**: If Raj tries to send a $50,000 milestone when only $32,800 remains, the transaction fails with "Insufficient contract balance for milestone payment." (FR-FRONTEND-005)
- **Transaction rejected in wallet**: If Raj declines the Pera signing prompt, the UI returns to its previous state with "Transaction cancelled by user." No state changes occur. (FR-FRONTEND-005)

---

## Journey 3: Emergency Stop

**Persona**: Raj (DAO Treasury Manager)
**Trigger**: Raj receives a Telegram message from a DAO council member: "We think there's a bug in the rate calculation -- Carol was set to $80/hr but the accrual looks wrong. Stop everything until we verify." Raj needs to freeze all streams immediately.
**Preconditions**: Contract is active with two streaming employees (Alice at $100/hr, Bob at $200/hr). Carol is already paused from Journey 2. Contract balance: $27,800 PAYUSD.

1. Raj opens the AlgoFlow employer dashboard and connects his wallet. He sees the two active streams ticking. (FR-WALLET-001, FR-EMPLOYER-004)

2. Raj clicks the red **"Emergency: Pause All Streams"** button in the Emergency Controls section. A confirmation dialog appears: "This will freeze ALL active streams. Employees will not be able to withdraw until streams are resumed. Are you sure?" Raj clicks "Confirm." (FR-CONTRACT-011, FR-EMPLOYER-007)

3. The contract sets the global `is_paused` flag to 1. This is a single transaction -- it does NOT settle individual streams (settling each employee's accrual would require multiple inner transactions, which could exceed limits with many employees). The dashboard updates: all employee rows show "PAUSED (Global)" in red. The Emergency Controls section now shows "All streams paused" with a timestamp. A toast confirms: "Emergency pause activated. All streams frozen. Tx: EP91...X3R2." (FR-CONTRACT-011, FR-FRONTEND-006)

4. While the global pause is active, Alice tries to withdraw from her employee dashboard. Her withdrawal transaction is rejected by the contract: "System is paused by employer. Withdrawals are temporarily disabled." Alice sees this message on her dashboard. (FR-CONTRACT-006, FR-FRONTEND-005)

5. Raj investigates the rate concern. He checks Carol's local state on the explorer: salary_rate = 80,000,000 (correct -- 80 PAYUSD/hr in base units with 6 decimals). He verifies the math: 80,000,000 x elapsed_seconds / 3600 matches the displayed accrual. The rates are correct -- false alarm.

6. Raj clicks **"Resume All Streams"** (STRETCH feature -- if available). The global `is_paused` flag resets to 0. All previously active streams resume from the current timestamp. No retroactive accrual occurs for the paused period. If `resume_all` is not available, Raj must resume each employee individually using `resume_stream`. (FR-CONTRACT-012, FR-CONTRACT-009)

7. Alice's dashboard updates: her stream counter begins ticking again. She sees a "New" badge indicating her stream status changed since her last visit. (FR-EMPLOYEE-005, FR-EMPLOYEE-006)

**Outcome**: Raj froze all payroll operations within seconds of receiving a concern. After investigation, he resumed operations. Total downtime: approximately 15 minutes. No salary was lost -- employees simply did not accrue during the pause window, and no erroneous payments were made.

**Error paths**:
- **Non-employer tries pause_all**: If someone other than Raj calls `pause_all`, the contract rejects it: "Unauthorized: only the employer can pause streams." (FR-CONTRACT-006)
- **Double pause**: If Raj clicks "Pause All" when streams are already paused, the contract accepts it idempotently (sets is_paused = 1 again) but no state changes. The UI shows "Streams are already paused." (FR-FRONTEND-005)
- **Resume without pause_all**: If `resume_all` is not implemented (STRETCH), Raj must click "Resume" on Alice and Bob individually. Carol remains paused from her vacation. Each resume is a separate transaction. (FR-CONTRACT-009)

---

## Journey 4: Employee Off-boarding

**Persona**: Raj (DAO Treasury Manager)
**Trigger**: Bob has accepted a position at another DAO. His last day is today. Raj needs to process Bob's final payout and remove him from the payroll system.
**Preconditions**: Bob is registered at $200/hr, has been streaming for 3 days (72 hours) since his last settlement. Accrued: $14,400. Contract balance: $50,000 PAYUSD.

1. Raj opens the employer dashboard and locates Bob in the employee list. Bob's row shows: "$200/hr, Active, Accrued: $14,400.00." Raj clicks the **"Remove Employee"** button on Bob's row. (FR-EMPLOYER-004, FR-EMPLOYER-005)

2. A confirmation dialog appears: "Remove Bob (B7X2...K9M4) from payroll? This will: (1) Settle all accrued salary ($14,400.00), (2) Permanently deregister this employee, (3) Free the local state slot. This action cannot be undone." Raj clicks "Confirm and Remove." (FR-FRONTEND-005)

3. Raj signs the transaction in Pera. The contract executes `remove_employee`: first, it calculates Bob's final accrual ($14,400) and sends it via inner asset transfer. Then it clears all of Bob's local state (salary_rate, stream_start, last_withdrawal, total_withdrawn, is_active all reset to 0). Finally, it decrements `total_employees` from 3 to 2. (FR-CONTRACT-010)

4. A toast confirms: "Bob removed from payroll. Final payout: $14,400.00. Tx: RB42...N7P1." The employee list now shows two entries: Alice ($100/hr, Active) and Carol ($80/hr, Paused). (FR-FRONTEND-006, FR-FRONTEND-007)

5. The **Contract Health** panel updates. With Bob removed, the active burn rate drops from $300/hr to $100/hr (Carol is paused). Runway recalculates: "$35,600 / $100/hr = 356 hours (~14.8 days)." (FR-EMPLOYER-009)

6. Bob, on his employee dashboard, sees his stream has stopped. His status shows "Removed" and the streaming counter is frozen. His transaction history shows the final settlement of $14,400. He can still view his historical withdrawals and explorer links as a record of his employment. (FR-EMPLOYEE-003, FR-EMPLOYEE-004)

**Outcome**: Bob has been cleanly off-boarded. He received every dollar owed. His local state slot is freed for a future employee. The contract's employee count and runway accurately reflect the reduced headcount.

**Error paths**:
- **Remove with insufficient balance**: If the contract has only $10,000 but owes Bob $14,400, the overdraft protection activates. The contract sends $10,000 (what is available), pauses the stream, and logs the shortfall. Raj sees: "Partial settlement: $10,000.00 of $14,400.00. Remaining $4,400.00 owed -- please fund the contract." Bob is NOT removed until fully settled. (FR-CONTRACT-006)
- **Remove a paused employee**: If Carol (paused) is being off-boarded, her accrued amount since the pause is $0 (paused streams do not accrue). The contract sends a $0 settlement and deregisters her. Raj sees: "Carol removed. No outstanding balance." (FR-CONTRACT-010)
- **Non-employer attempts removal**: The contract rejects the call with "Unauthorized." (FR-CONTRACT-006)

---

## Journey 5: First-Time Employee Onboarding

**Persona**: Alice (Remote Contractor)
**Trigger**: Alice receives a message from Raj on Discord: "I've registered you on AlgoFlow at $100/hr. Go to app.algoflow.io and connect your wallet to start streaming." Alice has never used AlgoFlow before.
**Preconditions**: Raj has already deployed the contract, funded it with $100,000 PAYUSD, and called `register_employee` with Alice's address and a rate of $100/hr. Alice has a Pera Wallet with at least 1 ALGO (for opt-in MBR and transaction fees).

1. Alice navigates to the AlgoFlow landing page at `/`. She sees a dark-themed page with a Silk 3D animated background. The "How It Works" section shows a three-step diagram: "Employer funds contract -> Salary streams every second -> Withdraw anytime." She clicks "I'm an Employee" to go to `/employee`. (FR-FRONTEND-001, FR-FRONTEND-002)

2. The employee dashboard prompts Alice to connect her wallet. She opens Pera on her phone, scans the QR code, and approves the connection. The app detects that her address is NOT the employer address in the contract's global state, confirming she should be on the employee dashboard. A network badge shows "Testnet." (FR-WALLET-001, FR-FRONTEND-002, FR-FRONTEND-008)

3. The dashboard detects that Alice has been registered by the employer but has NOT yet opted into the PAYUSD salary token or the AlgoFlow application. It shows a prominent onboarding card: "You've been registered by Raj's DAO! Your salary rate is $100/hr ($2,400/day | $16,800/week | $73,000/month). To start receiving salary, complete the opt-in steps below." Two buttons appear: "Opt In to PAYUSD Token" and "Opt In to AlgoFlow App." (FR-EMPLOYEE-005, FR-EMPLOYEE-006)

4. Alice clicks "Opt In to PAYUSD Token." Pera prompts her to sign an ASA opt-in transaction (a zero-amount asset transfer to herself). She approves. This costs 0.1 ALGO in MBR. A toast confirms: "Opted in to PAYUSD. Tx: OI41...H8K2." (FR-TOKEN-003)

5. Alice clicks "Opt In to AlgoFlow App." Pera prompts her to sign an application opt-in transaction. She approves. This allocates her local state in the contract (5 keys). A toast confirms: "Opted in to AlgoFlow. Tx: AO72...P5M9." (FR-TOKEN-004)

6. Both opt-ins complete, the onboarding card disappears. The **StreamCounter** appears -- a large, prominent counter showing Alice's accrued salary ticking up in real time:

   ```
   $0.027778
   ```

   The number increments every second. Alice watches it tick from $0.03 to $0.04 to $0.05. This is the "wow" moment -- she is earning money visibly, continuously, right now. Below the counter: "Rate: $100.00/hr | $2,400.00/day | $16,800.00/week | $73,000.00/month." Status: "Active" with a green indicator. (FR-EMPLOYEE-001, FR-EMPLOYEE-005)

7. Alice's transaction history panel is empty but shows a friendly empty state: "No withdrawals yet. Your salary is accruing -- withdraw anytime!" (FR-EMPLOYEE-003)

8. Alice watches the counter for 60 seconds. It reads $1.67. She smiles -- this is the fastest she has ever been paid. (FR-EMPLOYEE-001)

**Outcome**: Alice is fully onboarded and streaming. Her salary accrues at $100/hr, visible in real time. She can withdraw at any point. Total onboarding time: under 2 minutes. Two wallet signatures required (ASA opt-in + app opt-in).

**Error paths**:
- **Insufficient ALGO for opt-in**: If Alice has less than 0.2 ALGO (not enough for both MBR requirements), the opt-in transaction fails: "Insufficient ALGO balance. You need at least 0.2 ALGO for opt-in fees." She needs to fund her wallet from a faucet or receive ALGO from Raj. (FR-FRONTEND-005)
- **Not registered**: If Alice connects a wallet that has NOT been registered by any employer, the dashboard shows: "Your wallet is not registered with any AlgoFlow contract. Ask your employer to register your address." No streaming counter appears. (FR-FRONTEND-005)
- **Already opted in**: If Alice has previously opted in (e.g., from a test), the opt-in buttons are hidden and the streaming counter appears immediately. (FR-FRONTEND-002)
- **Wrong network**: If Alice connects on LocalNet but the contract is on Testnet, the app shows: "No contract found on this network. Please switch to Testnet." (FR-FRONTEND-008)

---

## Journey 6: Employee Withdrawal

**Persona**: Alice (Remote Contractor)
**Trigger**: Alice has been streaming for 3 days (72 hours) at $100/hr. She wants to withdraw her accrued salary to cover rent due tomorrow.
**Preconditions**: Alice is registered, opted in, and streaming at $100/hr. Her `last_withdrawal` timestamp is 72 hours ago. Accrued: $7,200. Contract has sufficient balance ($50,000 PAYUSD).

1. Alice opens the AlgoFlow employee dashboard at `/employee` and connects her Pera Wallet. The StreamCounter immediately shows her accrued balance: **$7,200.03** (and counting). The cents tick up every second -- $0.027778 per second at $100/hr. (FR-WALLET-001, FR-EMPLOYEE-001)

2. Below the counter, a large green **"Withdraw All"** button pulses gently. Alice clicks it. (FR-EMPLOYEE-002)

3. A confirmation panel appears: "Withdraw $7,200.06 PAYUSD to your wallet? This will transfer all accrued salary. You will continue earning at $100/hr after withdrawal." Alice clicks "Confirm Withdrawal." (FR-EMPLOYEE-002)

4. Pera prompts Alice to sign the withdrawal transaction (an app call). She approves. A loading spinner appears: "Processing withdrawal..." (FR-FRONTEND-004)

5. The contract executes `withdraw()`: it calculates the exact accrued amount using on-chain timestamps (`rate * (Global.latest_timestamp - last_withdrawal) / 3600`), sends the tokens via inner asset transfer, and updates `last_withdrawal` to now. The on-chain amount may differ slightly from the frontend estimate because the block timestamp is authoritative -- Alice receives $7,200.08 (the exact amount at the moment the transaction was confirmed, 3.3 seconds after she signed). (FR-CONTRACT-005, FR-CONTRACT-007)

6. A success toast appears: "Withdrawn $7,200.08 PAYUSD! Tx: WD93...F2K8" with a clickable Lora Explorer link. The StreamCounter resets to **$0.00** and immediately begins ticking up again from zero. Alice's rate has not changed -- she continues earning $100/hr. (FR-FRONTEND-006, FR-FRONTEND-007)

7. The **Transaction History** panel updates with a new row:
   ```
   Mar 26, 2026 9:14 AM IST | Withdrawal | +$7,200.08 PAYUSD | View on Explorer
   ```
   The timestamp is displayed in Alice's local timezone (IST). (FR-EMPLOYEE-003, FR-FRONTEND-009)

8. Alice clicks "View on Explorer." Lora Explorer opens in a new tab showing the confirmed transaction: inner asset transfer of 7,200,080,000 microPAYUSD from the contract address to Alice's address. Confirmed in round 41,932,187. Finality: 3.3 seconds. Fee: 0.001 ALGO ($0.00024). (FR-FRONTEND-007)

9. Alice checks her Pera Wallet. Her PAYUSD balance has increased by $7,200.08. The funds are hers -- the employer cannot claw them back because the clawback address is the contract, and the contract has no "reclaim" method. (FR-TOKEN-002)

**Outcome**: Alice has withdrawn $7,200.08 in accrued salary. The entire process took under 10 seconds from button press to confirmed receipt. Her stream continues uninterrupted. The transaction is permanently recorded on-chain and verifiable by anyone.

**Error paths**:
- **Zero accrual**: If Alice tries to withdraw immediately after a previous withdrawal (accrued = $0.00), the contract rejects it: "No salary accrued. Try again later." The UI disables the withdraw button when accrued is below 0.01 PAYUSD. (FR-FRONTEND-005)
- **Contract out of funds (overdraft)**: If the contract has only $3,000 but Alice is owed $7,200, the overdraft protection activates. The contract sends $3,000 (everything available) and automatically pauses Alice's stream. She sees: "Partial withdrawal: $3,000.00 of $7,200.00. Stream paused -- insufficient contract funds. Contact your employer." (FR-CONTRACT-006)
- **Global pause active**: If Raj has activated the emergency pause, Alice's withdrawal transaction is rejected: "System paused by employer. Withdrawals temporarily disabled. Please try again later." (FR-CONTRACT-011)
- **Transaction signing rejected**: If Alice declines the Pera prompt, the UI returns to its previous state. "Transaction cancelled. No changes made." Her accrual continues. (FR-FRONTEND-005)

---

## Journey 7: Employee Rate Change Discovery

**Persona**: Alice (Remote Contractor)
**Trigger**: Alice has not checked AlgoFlow in three days. During that time, Raj updated her rate from $100/hr to $120/hr (the DAO approved a raise). Alice opens the app to check her earnings.
**Preconditions**: Alice was streaming at $100/hr. Raj called `update_rate(alice, 120)` two days ago, which settled all accrual at $100/hr and started a new stream at $120/hr. Alice has not visited the dashboard since before the rate change.

1. Alice opens the AlgoFlow employee dashboard and connects her wallet. The app loads her data from the contract's local state. (FR-WALLET-001)

2. The **StatusBadge** component compares the on-chain state against Alice's last-visit timestamp (stored in localStorage). It detects that Alice's `salary_rate` has changed since her last visit. A **"New"** badge appears next to her rate display, pulsing in the accent color. (FR-EMPLOYEE-006)

3. Alice sees her current rate displayed as: **$120.00/hr** with a "New" badge. Below: "$2,880.00/day | $20,160.00/week | $87,360.00/month." She notices the increase from her previous $100/hr ($73,000/month) to $120/hr ($87,360/month) and realizes she received a raise. (FR-EMPLOYEE-005)

4. The **StreamCounter** shows her accrued balance since the rate change: **$5,760.00** (48 hours at $120/hr). The counter ticks at $0.033333/second (faster than before, reflecting the higher rate). Alice notices the tick speed has increased. (FR-EMPLOYEE-001)

5. Alice checks her **Transaction History** and sees an entry she did not initiate:
   ```
   Mar 24, 2026 2:30 PM IST | Rate Settlement | +$4,800.00 PAYUSD | View on Explorer
   ```
   This was the automatic retroactive settlement when Raj changed her rate -- the contract paid out everything owed at $100/hr before applying the new $120/hr rate. Alice received $4,800 without lifting a finger. (FR-EMPLOYEE-003, FR-CONTRACT-007)

6. Alice clicks the "New" badge to dismiss it. Her last-visit timestamp updates in localStorage. The badge will not appear again unless another change occurs. (FR-EMPLOYEE-006)

7. Alice opens Pera to verify. Her PAYUSD balance includes the $4,800 settlement. She clicks the explorer link to confirm: the inner asset transfer originated from the contract, labeled with a `algoflow:rate_update_settlement` transaction note. (FR-FRONTEND-007)

**Outcome**: Alice discovered her rate increase through the "New" badge indicator and confirmed that all salary owed at her previous rate was automatically settled. She did not need to take any action -- the retroactive settlement happened when Raj updated the rate. Her streaming counter now reflects the new, higher rate.

**Error paths**:
- **localStorage cleared**: If Alice cleared her browser data, every current state appears as "new" (the app has no baseline to compare against). The badge shows regardless. After dismissing, a new baseline is set. (FR-EMPLOYEE-006)
- **Rate decreased**: If Raj reduced Alice's rate (e.g., the DAO scaled back a role), the same flow applies. Alice sees the "New" badge, her new lower rate, and the settlement at the old higher rate in her history. The notification is neutral -- it flags a change, not whether it is positive or negative. (FR-EMPLOYEE-005, FR-EMPLOYEE-006)
- **Stream paused while away**: If Raj paused Alice's stream while she was offline, the "New" badge also appears on the status indicator. Alice sees "Paused" instead of "Active." Her streaming counter is frozen. She cannot withdraw during a global pause, but can withdraw accrued amounts during an individual pause (since individual pauses settle accrued before pausing). (FR-EMPLOYEE-005)

---

## Journey 8: Live Demo Flow (Hackathon Presentation)

**Persona**: Raj (DAO Treasury Manager) and Alice (Remote Contractor) -- played by the presenter
**Trigger**: The hackathon presentation timer starts. The presenter has 3 minutes to demonstrate AlgoFlow end-to-end.
**Preconditions**: Demo reset script has been run (`scripts/reset.py --network testnet`). Clean state: no contract deployed, no tokens created. Three test accounts pre-funded with ALGO via the setup script. Pera Wallet connected. Browser open to AlgoFlow landing page.

1. **[0:00] Create PAYUSD token.** The presenter runs the deployment script or clicks "Deploy" in the setup flow. A new ASA appears on Lora Explorer: "AlgoFlow USD" (PAYUSD), 1M tokens, 6 decimals. The judges see the asset on the explorer -- proof this is a real Algorand asset, not a mock. (FR-TOKEN-001, FR-DEVOPS-001)

2. **[0:15] Deploy AlgoFlow contract.** The PayrollStream contract deploys to Testnet. The contract's App ID appears on the explorer. The presenter briefly highlights: "This is an ARC-4 smart contract written in Algorand Python with 12 ABI methods." (FR-CONTRACT-001, FR-DEVOPS-001)

3. **[0:30] Fund contract with 100,000 PAYUSD.** On the employer dashboard, the presenter enters 100,000 and clicks "Fund." Signs in Pera. The Contract Health panel lights up: "$100,000.00 PAYUSD." The presenter says: "This is an atomic transaction -- the asset transfer and the app call succeed or fail together. No partial state." (FR-CONTRACT-003, FR-EMPLOYER-002, FR-EMPLOYER-001)

4. **[0:45] Register Employee A at $100/hr.** The presenter enters Employee A's address and $100/hr. Signs. Employee A appears in the list: Active, $100/hr, Accrued: $0.00. "Local state has been written to Employee A's account on-chain -- salary rate, stream start time, active flag." (FR-CONTRACT-004, FR-EMPLOYER-003)

5. **[1:00] Batch-register Employees B ($150/hr) and C ($80/hr).** The presenter enters both addresses and rates, clicks "Batch Register," and signs ONE transaction. Both employees appear simultaneously. "That was an atomic group -- two registrations in a single indivisible transaction. This is an Algorand-unique capability." Runway indicator updates: "~303 hours at $330/hr." (FR-EMPLOYER-008, FR-EMPLOYER-009)

6. **[1:15] Switch to Employee A dashboard.** The presenter connects Employee A's wallet (or uses a second browser tab pre-connected). The StreamCounter is the centerpiece -- a large number ticking up every second: $0.03... $0.06... $0.08... The judges watch money accrue in real time. "This counter runs client-side, but the on-chain calculation is authoritative. Let me prove it." (FR-EMPLOYEE-001)

7. **[1:45] Employee A withdraws.** The presenter clicks "Withdraw All" (showing $0.83 after ~30 seconds of accrual). Signs in Pera. 3.3 seconds later: "Withdrawn $0.83 PAYUSD!" with an explorer link. The presenter clicks the link -- judges see the inner asset transfer confirmed on Lora Explorer. "Instant finality. 3.3 seconds. Fee: $0.00024. Compare that to a $25 bank wire that takes 3 days." The counter resets and starts ticking from $0.00 again. (FR-EMPLOYEE-002, FR-CONTRACT-005, FR-FRONTEND-007)

8. **[2:15] Update Employee B's rate to $200/hr.** Back on the employer dashboard, the presenter updates Bob's rate. The contract settles Bob's accrued amount at $150/hr first (retroactive settlement), then applies the new $200/hr rate. "Notice the retroactive settlement -- Bob got everything owed at his old rate before the new rate kicks in. No lost earnings, no manual calculation." (FR-CONTRACT-007, FR-EMPLOYER-005)

9. **[2:30] Pause Employee C.** The presenter pauses Carol's stream. The contract settles her accrued amount and stops her stream. Her row shows "Paused." "Instant payroll control. Pause, resume, update -- all on-chain, all auditable, all in seconds." (FR-CONTRACT-008, FR-EMPLOYER-005)

10. **[2:45] Bonus: Milestone payment.** If time remains, the presenter sends a $500 milestone payment to Employee A: "Bonus for completing the smart contract audit." The inner transaction sends $500 alongside her ongoing stream. "Continuous streaming AND milestone-based payments in the same contract. No other protocol does both." (FR-CONTRACT-009, FR-EMPLOYER-006)

**Outcome**: The judges have witnessed the complete lifecycle: token creation, contract deployment, funding, employee registration (single and batch), real-time streaming, withdrawal with on-chain verification, rate update with retroactive settlement, stream pausing, and milestone payment. All on Algorand Testnet, verifiable on the explorer, executed in under 3 minutes.

**Error paths**:
- **Testnet congestion delays transactions**: If any transaction takes longer than 5 seconds, the presenter narrates the loading state: "We're waiting for Algorand consensus -- normally 3.3 seconds." If Testnet is fully unresponsive, the presenter switches to the automated demo script: `python scripts/demo.py --network testnet` which executes the same 9 steps in terminal with transaction IDs the judges can verify after. (FR-DEVOPS-003)
- **Pera Wallet disconnects mid-demo**: The presenter has KMD pre-configured as a fallback. If Pera fails, they switch to LocalNet with KMD signing (no popup delays, instant transactions). "Let me switch to our local development network for reliability." (FR-WALLET-001)
- **Demo needs a restart**: The presenter runs `python scripts/reset.py --network testnet` to tear down everything and start fresh. This takes approximately 15 seconds. (FR-DEVOPS-004)
- **Contract deployment fails**: The automated demo script (`scripts/demo.py`) is the nuclear fallback -- it runs the entire flow in terminal, producing transaction IDs and explorer links that judges can verify independently. (FR-DEVOPS-003)

---

## Appendix: FR Reference Index

The journeys above reference functional requirements using category-based IDs. The following table maps these to the canonical FR numbers from the requirements-gaps document.

| Journey FR ID | Canonical FR | Description |
|---------------|-------------|-------------|
| FR-CONTRACT-001 | FR-01 | Deploy PayrollStream contract |
| FR-CONTRACT-002 | FR-02 | Contract opts in to salary ASA |
| FR-CONTRACT-003 | FR-03 | Fund contract with salary tokens |
| FR-CONTRACT-004 | FR-04 | Register employee with address and rate |
| FR-CONTRACT-005 | FR-05 | Employee withdraws accrued salary |
| FR-CONTRACT-006 | FR-14 | Authorization enforcement + error handling |
| FR-CONTRACT-007 | FR-07 | Update employee salary rate (retroactive settlement) |
| FR-CONTRACT-008 | FR-08 | Pause individual stream |
| FR-CONTRACT-009 | FR-09 | Resume paused stream / Milestone pay (FR-milestone_pay) |
| FR-CONTRACT-010 | FR-10 | Remove employee with final payout |
| FR-CONTRACT-011 | FR-11 | Pause all streams (emergency stop) |
| FR-CONTRACT-012 | FR-12 | Resume all streams |
| FR-TOKEN-001 | FR-17 | Create salary ASA (PAYUSD) |
| FR-TOKEN-002 | FR-18 | Contract set as ASA clawback |
| FR-TOKEN-003 | FR-19 | Employee ASA opt-in |
| FR-TOKEN-004 | FR-20 | Employee app opt-in |
| FR-WALLET-001 | FR-21, FR-31 | Wallet connection (Pera/KMD) |
| FR-EMPLOYER-001 | FR-22 | View contract balance |
| FR-EMPLOYER-002 | FR-23 | Fund contract via UI |
| FR-EMPLOYER-003 | FR-24 | Register employee via UI |
| FR-EMPLOYER-004 | FR-25 | View employee list with rates/status/accrued |
| FR-EMPLOYER-005 | FR-26 | Pause/update rate from employee list |
| FR-EMPLOYER-006 | FR-27, milestone_pay UI | Milestone payment + explorer links |
| FR-EMPLOYER-007 | FR-11 UI | Emergency controls (pause all button) |
| FR-EMPLOYER-008 | FR-29 | Batch employee registration |
| FR-EMPLOYER-009 | FR-28 | Contract runway indicator |
| FR-EMPLOYER-010 | FR-NEW-04 | Setup checklist for first-time users |
| FR-EMPLOYEE-001 | FR-32 | Real-time streaming counter |
| FR-EMPLOYEE-002 | FR-33 | One-click withdraw button |
| FR-EMPLOYEE-003 | FR-34 | Withdrawal history with explorer links |
| FR-EMPLOYEE-004 | FR-35 | Rate and stream status display |
| FR-EMPLOYEE-005 | FR-35 | Rate display with multi-unit conversion |
| FR-EMPLOYEE-006 | FR-NEW-03 | "New" badge for status changes |
| FR-FRONTEND-001 | FR-36 | Role detection and dashboard routing |
| FR-FRONTEND-002 | FR-36 | Auto-redirect based on wallet address |
| FR-FRONTEND-004 | FR-37 | Loading states for async operations |
| FR-FRONTEND-005 | FR-38 | Error messages for failures |
| FR-FRONTEND-006 | FR-39 | Success confirmations with tx ID |
| FR-FRONTEND-007 | FR-27, FR-34 | Explorer links for transactions |
| FR-FRONTEND-008 | FR-40 | Network badge (LocalNet/Testnet) |
| FR-FRONTEND-009 | Timezone handling | Local timezone display |
| FR-DEVOPS-001 | FR-41 | Deployment script (LocalNet + Testnet) |
| FR-DEVOPS-003 | FR-43 | Automated demo fallback script |
| FR-DEVOPS-004 | FR-44 | Demo reset script |
