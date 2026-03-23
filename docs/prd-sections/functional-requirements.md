# AlgoFlow — Functional Requirements

**Document**: PRD Section — Functional Requirements
**Date**: 2026-03-23
**Source of Truth**: `docs/00-master-plan.md` (644 lines), `docs/research/ambiguity-resolutions.md`, `CLAUDE.md`
**Counts**: 42 MVP (P0) + 5 STRETCH (P1) = 47 Total

---

## Format Convention

Every FR follows:
```
**FR-{CAT}-{NNN}**: [Actor] can [capability]
- **Priority**: P0 (MVP) | P1 (STRETCH)
- **Acceptance Criteria**:
  - Given [precondition], When [action], Then [result]
- **Dependencies**: FR-XXX-NNN or None
```

Categories: CONTRACT, TOKEN, EMPLOYER, EMPLOYEE, SHARED, DEVOPS

---

## Summary

| Category   | P0 (MVP) | P1 (STRETCH) | Total |
|------------|----------|--------------|-------|
| CONTRACT   | 14       | 3            | 17    |
| TOKEN      | 4        | 0            | 4     |
| EMPLOYER   | 9        | 1            | 10    |
| EMPLOYEE   | 5        | 0            | 5     |
| SHARED     | 7        | 0            | 7     |
| DEVOPS     | 3        | 1            | 4     |
| **TOTAL**  | **42**   | **5**        | **47**|

---

## CONTRACT — Smart Contract Methods

---

**FR-CONTRACT-001**: Employer can initialize a PayrollStream contract linked to a specific salary ASA

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a deployer account with sufficient ALGO, When the deployer calls `create(asset)` with a valid ASA ID, Then the contract stores the deployer address as `employer`, stores the ASA ID as `salary_asset`, sets `total_employees` to 0, sets `total_streamed` to 0, and sets `is_paused` to 0
  - Given a contract that has already been created, When any account calls `create(asset)` again, Then the transaction is rejected because create is only callable at contract deployment
  - Given a deployer account, When the deployer calls `create(asset)`, Then the `employer` global state equals `Txn.sender`
- **Dependencies**: FR-TOKEN-001

---

**FR-CONTRACT-002**: Employer can make the contract opt in to the salary ASA so the contract can hold tokens

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a deployed contract where the caller is the employer, When the employer calls `opt_in_asset()`, Then the contract executes an inner transaction to opt into the salary ASA (0-amount AssetTransfer to itself)
  - Given a deployed contract where the caller is NOT the employer, When the non-employer calls `opt_in_asset()`, Then the transaction is rejected with an authorization error
  - Given a deployed contract that has already opted into the ASA, When the employer calls `opt_in_asset()` again, Then the transaction either succeeds idempotently or is rejected (no double-opt-in side effects)
- **Dependencies**: FR-CONTRACT-001

---

**FR-CONTRACT-003**: Employer can fund the contract by depositing salary tokens via asset transfer

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a contract that has opted into the salary ASA, When the employer sends an atomic group containing an AssetTransfer of PAYUSD to the contract address and an app call to `fund(axfer)`, Then the contract's PAYUSD balance increases by the transferred amount
  - Given a contract that has opted into the salary ASA, When a non-employer account calls `fund(axfer)`, Then the transaction is rejected with an authorization error
  - Given a fund transaction where the AssetTransfer references a different ASA than the contract's `salary_asset`, When the employer submits the group, Then the transaction is rejected
  - Given a fund transaction where the AssetTransfer receiver is not the contract address, When the employer submits the group, Then the transaction is rejected
- **Dependencies**: FR-CONTRACT-002

---

**FR-CONTRACT-004**: Employer can register a new employee with a wallet address and hourly token rate

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a funded contract and an employee account that has opted into both the ASA and the application, When the employer calls `register_employee(account, rate)` with a valid address and a rate in base units per hour, Then the employee's local state is set: `salary_rate` = rate, `stream_start` = current timestamp, `last_withdrawal` = current timestamp, `total_withdrawn` = 0, `is_active` = 1, and global `total_employees` increments by 1
  - Given an employee account that has NOT opted into the application, When the employer calls `register_employee(account, rate)`, Then the transaction is rejected
  - Given an employee that is already registered (salary_rate > 0), When the employer calls `register_employee(account, rate)` for the same address, Then the transaction is rejected to prevent double-registration
  - Given a non-employer account, When it calls `register_employee(account, rate)`, Then the transaction is rejected with an authorization error
- **Dependencies**: FR-CONTRACT-003, FR-TOKEN-003, FR-TOKEN-004

---

**FR-CONTRACT-005**: Employee can withdraw all currently accrued salary tokens to their wallet

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an active employee with accrued salary (elapsed time since last_withdrawal > 0), When the employee calls `withdraw()`, Then the contract calculates `accrued = rate * (now - last_withdrawal) / 3600`, sends `accrued` tokens via inner AssetTransfer to the employee, updates `last_withdrawal` to the current timestamp, increments `total_withdrawn` by the accrued amount, increments global `total_streamed` by the accrued amount, and returns the amount withdrawn
  - Given an active employee whose accrued amount is less than 1000 base units (0.001 PAYUSD minimum withdrawal), When the employee calls `withdraw()`, Then the transaction is rejected or returns 0 (accrual below minimum threshold due to integer division)
  - Given a paused employee (is_active == 0), When the employee calls `withdraw()`, Then the transaction is rejected because the stream is not active
  - Given a contract where `is_paused` == 1 (global emergency pause), When any employee calls `withdraw()`, Then the transaction is rejected
  - Given an account that is not a registered employee, When the account calls `withdraw()`, Then the transaction is rejected
- **Dependencies**: FR-CONTRACT-004

---

**FR-CONTRACT-006**: Any account can query the accrued (unclaimed) balance for any registered employee

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an active employee with a salary rate of 1,000,000 base units/hr and 1800 seconds elapsed since last_withdrawal, When anyone calls `get_accrued(account)`, Then the method returns 500,000 (base units) without modifying any state
  - Given a paused employee (is_active == 0), When anyone calls `get_accrued(account)`, Then the method returns 0 (no accrual during pause)
  - Given an account that is not a registered employee, When anyone calls `get_accrued(account)`, Then the method returns 0 or rejects with an error
  - Given an active employee, When `get_accrued` is called twice in the same block, Then both calls return the same value (read-only, no state change)
- **Dependencies**: FR-CONTRACT-004

---

**FR-CONTRACT-007**: Employer can update an employee's hourly salary rate with retroactive settlement at the old rate

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an active employee with accrued salary at the current rate, When the employer calls `update_rate(account, new_rate)`, Then the contract first settles all accrued salary at the old rate via inner AssetTransfer to the employee, then sets `salary_rate` to `new_rate`, and resets `last_withdrawal` to the current timestamp
  - Given an active employee, When the employer updates the rate and a concurrent `withdraw()` from that employee is submitted in the same round, Then the contract handles both operations without double-payment (one settles before the other takes effect)
  - Given a non-employer account, When it calls `update_rate(account, new_rate)`, Then the transaction is rejected with an authorization error
  - Given an employee who is paused (is_active == 0), When the employer calls `update_rate(account, new_rate)`, Then the rate is updated without settlement (no accrual during pause) and the stream remains paused
- **Dependencies**: FR-CONTRACT-004

---

**FR-CONTRACT-008**: Employer can pause an individual employee's salary stream

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an active employee with accrued salary, When the employer calls `pause_stream(account)`, Then the contract settles all accrued salary via inner AssetTransfer, sets `is_active` to 0, and updates `last_withdrawal` to the current timestamp
  - Given an employee that is already paused, When the employer calls `pause_stream(account)`, Then the transaction is rejected (already paused)
  - Given a non-employer account, When it calls `pause_stream(account)`, Then the transaction is rejected with an authorization error
  - Given an active employee with zero accrued (just registered or just withdrew), When the employer calls `pause_stream(account)`, Then no inner transfer occurs (nothing to settle) and `is_active` is set to 0
- **Dependencies**: FR-CONTRACT-004

---

**FR-CONTRACT-009**: Employer can resume a paused employee's salary stream

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a paused employee (is_active == 0), When the employer calls `resume_stream(account)`, Then `is_active` is set to 1, `stream_start` is reset to the current timestamp, `last_withdrawal` is reset to the current timestamp, and no retroactive accrual occurs for the paused period
  - Given an active employee (is_active == 1), When the employer calls `resume_stream(account)`, Then the transaction is rejected (already active)
  - Given a non-employer account, When it calls `resume_stream(account)`, Then the transaction is rejected with an authorization error
- **Dependencies**: FR-CONTRACT-008

---

**FR-CONTRACT-010**: Employer can remove an employee, triggering a final payout and deregistration

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a registered employee (active or paused) with accrued salary, When the employer calls `remove_employee(account)`, Then the contract settles all accrued salary via inner AssetTransfer to the employee, clears all local state for that account, and decrements `total_employees` by 1
  - Given a registered employee with zero accrued, When the employer calls `remove_employee(account)`, Then no inner transfer occurs, local state is cleared, and `total_employees` decrements by 1
  - Given a non-employer account, When it calls `remove_employee(account)`, Then the transaction is rejected with an authorization error
  - Given an account that is not a registered employee, When the employer calls `remove_employee(account)`, Then the transaction is rejected
- **Dependencies**: FR-CONTRACT-004

---

**FR-CONTRACT-011**: Employer can pause all active streams simultaneously as an emergency stop

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a contract with active employee streams, When the employer calls `pause_all()`, Then global `is_paused` is set to 1 and all subsequent `withdraw()` calls are rejected until the contract is unpaused
  - Given a contract that is already globally paused, When the employer calls `pause_all()` again, Then the transaction either succeeds idempotently (is_paused remains 1) or is rejected (already paused)
  - Given a non-employer account, When it calls `pause_all()`, Then the transaction is rejected with an authorization error
  - Given a globally paused contract, When an employee calls `withdraw()`, Then the transaction is rejected with an error indicating the contract is paused
- **Dependencies**: FR-CONTRACT-001

---

**FR-CONTRACT-012**: Employer can send a one-time milestone payment to an employee

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a registered employee and a contract with sufficient PAYUSD balance, When the employer calls `milestone_pay(employee, amount)`, Then the contract sends `amount` tokens to the employee via inner AssetTransfer, increments global `total_streamed` by `amount`, and does not modify the employee's salary_rate, stream_start, or last_withdrawal
  - Given a contract whose PAYUSD balance is less than the requested amount, When the employer calls `milestone_pay(employee, amount)`, Then the transaction is rejected due to insufficient funds
  - Given a non-employer account, When it calls `milestone_pay(employee, amount)`, Then the transaction is rejected with an authorization error
  - Given an account that is not a registered employee, When the employer calls `milestone_pay(account, amount)`, Then the transaction is rejected
- **Dependencies**: FR-CONTRACT-004

---

**FR-CONTRACT-013**: Contract automatically rejects unauthorized callers for employer-only methods

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given any of the employer-only methods (opt_in_asset, fund, register_employee, update_rate, pause_stream, resume_stream, remove_employee, pause_all, milestone_pay), When a non-employer account calls any of these methods, Then every call is rejected with an assertion error validating `Txn.sender == self.employer`
  - Given the employer address, When the employer calls any employer-only method, Then the authorization check passes and the method proceeds to its logic
- **Dependencies**: FR-CONTRACT-001

---

**FR-CONTRACT-014**: Contract implements overdraft protection to prevent failed withdrawals when the contract balance is insufficient

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a contract whose PAYUSD balance is less than an employee's accrued amount, When the employee calls `withdraw()`, Then the contract sends only the available balance (partial withdrawal), pauses the employee's stream (sets is_active to 0), and updates last_withdrawal to the current timestamp
  - Given a contract whose PAYUSD balance is 0, When an employee calls `withdraw()`, Then the transaction is rejected or the withdrawal returns 0 with the stream paused
  - Given a contract with sufficient balance, When an employee calls `withdraw()`, Then the full accrued amount is sent and the stream remains active
- **Dependencies**: FR-CONTRACT-005

---

**FR-CONTRACT-015**: Employer can resume all paused streams after an emergency pause

- **Priority**: P1 (STRETCH)
- **Acceptance Criteria**:
  - Given a globally paused contract (is_paused == 1), When the employer calls `resume_all()`, Then global `is_paused` is set to 0 and `withdraw()` calls are accepted again
  - Given a contract that is not globally paused (is_paused == 0), When the employer calls `resume_all()`, Then the transaction either succeeds idempotently or is rejected
  - Given a non-employer account, When it calls `resume_all()`, Then the transaction is rejected with an authorization error
- **Dependencies**: FR-CONTRACT-011

---

**FR-CONTRACT-016**: Employer can drain remaining tokens from the contract back to their wallet

- **Priority**: P1 (STRETCH)
- **Acceptance Criteria**:
  - Given a contract with a PAYUSD balance and no active employee streams (total_employees == 0 or all streams paused), When the employer calls `drain_funds()`, Then the entire PAYUSD balance is transferred to the employer via inner AssetTransfer
  - Given a contract with active employee streams, When the employer calls `drain_funds()`, Then the transaction is rejected (cannot drain while employees have active streams) or all streams are paused first
  - Given a non-employer account, When it calls `drain_funds()`, Then the transaction is rejected with an authorization error
- **Dependencies**: FR-CONTRACT-003

---

**FR-CONTRACT-017**: Contract emits ARC-28 on-chain events for stream lifecycle actions

- **Priority**: P1 (STRETCH)
- **Acceptance Criteria**:
  - Given any of the following contract actions: employee registration, withdrawal, rate change, stream pause, stream resume, milestone payment, or employee removal, When the action completes, Then the contract emits an ARC-28 structured event in the transaction log containing the action type, the employee address, the relevant amount or rate, and the timestamp
  - Given emitted events, When an indexer or explorer queries the application's transaction logs, Then the events are parseable and filterable by event type
- **Dependencies**: FR-CONTRACT-001

---

## TOKEN — ASA Creation and Opt-In

---

**FR-TOKEN-001**: System can create the PAYUSD salary ASA with the correct metadata and supply

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given the deployment account with sufficient ALGO, When the ASA creation transaction is submitted, Then a new ASA is created with name "AlgoFlow USD", unit name "PAYUSD", 6 decimals, total supply of 1,000,000,000,000 base units (1,000,000 tokens), default_frozen = false, manager = employer address, reserve = employer address, freeze = employer address
  - Given the created ASA, When inspected on an Algorand explorer, Then the metadata (name, unit, decimals, supply) is displayed correctly
- **Dependencies**: None

---

**FR-TOKEN-002**: System sets the contract address as the ASA clawback to enable programmatic transfers

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given the deployed PayrollStream contract and the created PAYUSD ASA, When the clawback address is configured (via ASA creation or asset config transaction), Then the contract application address is set as the ASA clawback address
  - Given the contract as clawback, When the contract executes an inner AssetTransfer, Then the transfer succeeds without requiring the asset receiver's signature on the asset side
- **Dependencies**: FR-TOKEN-001, FR-CONTRACT-001

---

**FR-TOKEN-003**: Employee can opt in to the salary ASA to become eligible to receive tokens

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an employee account with sufficient ALGO for the minimum balance requirement (0.1 ALGO for ASA opt-in), When the employee submits a 0-amount AssetTransfer of PAYUSD to themselves, Then the employee's account is opted into the PAYUSD ASA and can receive tokens
  - Given an employee who has not opted into the ASA, When the contract attempts to transfer PAYUSD to them via inner transaction, Then the transfer fails
  - Given an employee who has already opted into the ASA, When they attempt to opt in again, Then the transaction either succeeds idempotently or is rejected without side effects
- **Dependencies**: FR-TOKEN-001

---

**FR-TOKEN-004**: Employee can opt in to the PayrollStream application to have local state allocated

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an employee account with sufficient ALGO for the minimum balance requirement, When the employee submits an application opt-in transaction for the PayrollStream app, Then local state slots (salary_rate, stream_start, last_withdrawal, total_withdrawn, is_active) are allocated for that account with default values of 0
  - Given an employee who has not opted into the application, When the employer calls `register_employee` for that address, Then the transaction is rejected
  - Given an employee who has already opted into the application, When they attempt to opt in again, Then the transaction either succeeds idempotently or is rejected without side effects
- **Dependencies**: FR-CONTRACT-001

---

## EMPLOYER — Employer Dashboard Features

---

**FR-EMPLOYER-001**: Employer can connect their wallet to the employer dashboard

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an employer visiting the `/employer` route, When they click the wallet connection button, Then the wallet provider selection is presented: KMD on LocalNet, Pera Wallet on Testnet (determined by the network environment variable)
  - Given a successful wallet connection, When the employer's address matches the contract's `employer` global state, Then the employer dashboard is rendered with full functionality
  - Given a wallet that was previously connected, When the employer refreshes the page, Then the wallet connection is restored from localStorage and the last role (employer) is remembered
  - Given a wallet connection attempt that fails or is rejected by the user, When the connection error occurs, Then an error message is displayed with a retry button
- **Dependencies**: FR-SHARED-001

---

**FR-EMPLOYER-002**: Employer can view the contract's current PAYUSD balance, ALGO balance, and runway indicator

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a connected employer, When the employer dashboard loads, Then the contract's current PAYUSD token balance is displayed in dollar format (e.g., "$50,000.00") and the contract's ALGO balance is displayed
  - Given a contract with active employee streams, When the dashboard calculates runway, Then it displays the estimated time until fund depletion as `contract_balance / sum_of_all_active_rates` in hours and days
  - Given a contract whose runway drops below 24 hours, When the dashboard refreshes, Then a warning banner is displayed indicating low funds
  - Given a contract with zero active employees, When the dashboard displays runway, Then it shows "No active streams" instead of an infinite value
- **Dependencies**: FR-EMPLOYER-001, FR-CONTRACT-003

---

**FR-EMPLOYER-003**: Employer can fund the contract with a specified amount of PAYUSD tokens through the dashboard

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a connected employer with PAYUSD tokens in their wallet, When they enter a deposit amount and confirm the funding transaction, Then an atomic group (AssetTransfer + app call to `fund`) is submitted for wallet signing, and upon confirmation the contract balance increases by the deposited amount
  - Given a connected employer with insufficient PAYUSD balance, When they attempt to fund more than they hold, Then the transaction fails and an error message indicates insufficient token balance
  - Given a successful funding transaction, When the transaction is confirmed, Then a success notification is displayed containing the transaction ID and an explorer link
- **Dependencies**: FR-EMPLOYER-001, FR-CONTRACT-003

---

**FR-EMPLOYER-004**: Employer can register a new employee by entering their Algorand address and hourly rate

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a connected employer, When they enter a valid 58-character Algorand address and an hourly rate (in dollars, e.g., "$100/hr"), Then the frontend converts the rate to base units (100 * 1,000,000 = 100,000,000) and calls `register_employee(account, rate)` via a signed transaction
  - Given an invalid Algorand address (wrong length, invalid checksum), When the employer attempts to register, Then the form displays a validation error before submitting any transaction
  - Given an employee address that has not opted into the ASA or application, When the employer attempts to register them, Then the transaction fails and an error message indicates the employee must opt in first
  - Given a rate input of 0, When the employer attempts to register, Then the form rejects the input with a validation error
  - Given a successful registration, When the transaction is confirmed, Then the employee appears in the employee list with an "Active" status indicator
  - Given a connected employer and up to 3 employee accounts that have opted into the ASA and application, When the employer submits a batch registration with addresses and rates, Then all `register_employee` calls are grouped into a single atomic transaction group and either all succeed or all fail
  - Given a batch registration where one of the employees has not opted into the application, When the group is submitted, Then the entire atomic group fails and none of the employees are registered
- **Dependencies**: FR-EMPLOYER-001, FR-CONTRACT-004

---

**FR-EMPLOYER-005**: Employer can view a list of all registered employees with their rates, statuses, and accrued amounts

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a contract with registered employees, When the employer dashboard loads, Then each employee is displayed in a list showing: truncated address (first 6 + last 4 characters), hourly rate in dollars, stream status (Active or Paused), and current accrued amount in dollars
  - Given active employee streams, When the dashboard polls contract state at a regular interval, Then accrued amounts update to reflect current values
  - Given a contract with zero registered employees, When the employer dashboard loads, Then an empty state placeholder is displayed with a prompt to register the first employee
  - Given 3 registered employees (the demo maximum), When the list renders, Then all 3 employees are visible without scrolling on a standard viewport
- **Dependencies**: FR-EMPLOYER-001, FR-CONTRACT-004, FR-CONTRACT-006

---

**FR-EMPLOYER-006**: Employer can pause, resume, update the rate of, or remove any individual employee from the list

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an active employee in the list, When the employer clicks the pause action, Then `pause_stream(account)` is called, accrued salary is settled, and the employee's status changes to "Paused"
  - Given a paused employee in the list, When the employer clicks the resume action, Then `resume_stream(account)` is called and the employee's status changes to "Active"
  - Given an employee in the list, When the employer initiates a rate update with a new hourly rate, Then `update_rate(account, new_rate)` is called, accrued salary at the old rate is settled, and the displayed rate updates to the new value
  - Given an employee in the list, When the employer clicks the remove action and confirms, Then `remove_employee(account)` is called, a final payout is made, and the employee disappears from the list
  - Given a failed transaction for any of these actions, When the error occurs, Then an error message is displayed with a retry button
- **Dependencies**: FR-EMPLOYER-005, FR-CONTRACT-007, FR-CONTRACT-008, FR-CONTRACT-009, FR-CONTRACT-010

---

**FR-EMPLOYER-007**: Employer can send a milestone payment to a registered employee

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a registered employee and a contract with sufficient funds, When the employer enters a milestone amount in dollars and submits the milestone payment, Then `milestone_pay(employee, amount)` is called and the specified amount is transferred to the employee via inner transaction
  - Given a milestone amount exceeding the contract's PAYUSD balance, When the employer submits the payment, Then the transaction fails and an error message indicates insufficient contract balance
  - Given a successful milestone payment, When the transaction is confirmed, Then a success notification is displayed with the amount, recipient, and explorer link
- **Dependencies**: FR-EMPLOYER-005, FR-CONTRACT-012

---

**FR-EMPLOYER-008**: Employer can trigger an emergency pause of all active streams

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a contract with active employee streams, When the employer clicks "Pause All Streams", Then `pause_all()` is called, the global `is_paused` flag is set to 1, and a confirmation notification is displayed
  - Given a globally paused contract, When the employer views the dashboard, Then a prominent indicator shows that all streams are paused and all employee statuses reflect the global pause
  - Given the emergency pause is active, When any employee attempts to withdraw, Then the withdrawal is rejected by the contract
- **Dependencies**: FR-EMPLOYER-001, FR-CONTRACT-011

---

**FR-EMPLOYER-009**: Employer sees a setup checklist when the contract is newly deployed

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a connected employer with a newly deployed contract (no ASA opt-in, no funding, no employees), When the employer dashboard loads, Then a setup checklist is displayed with steps: (1) Contract deployed (complete), (2) ASA opt-in (pending), (3) Fund contract (pending), (4) Register first employee (pending)
  - Given the employer completes the ASA opt-in step, When the checklist re-evaluates, Then step 2 is marked as complete and step 3 becomes the next action
  - Given all checklist steps are complete, When the dashboard loads, Then the checklist is hidden and the standard dashboard view (employee list, contract health) is shown
- **Dependencies**: FR-EMPLOYER-001

---

**FR-EMPLOYER-010**: Employer can export a payroll summary report as CSV

- **Priority**: P1 (STRETCH)
- **Acceptance Criteria**:
  - Given a contract with registered employees and transaction history, When the employer clicks "Export Report", Then a CSV file is generated and downloaded containing columns: employee address, hourly rate, total accrued, total withdrawn, stream status, and registration timestamp
  - Given a contract with zero employees, When the employer clicks "Export Report", Then the CSV contains only the header row or a message indicating no data
- **Dependencies**: FR-EMPLOYER-005

---

## EMPLOYEE — Employee Dashboard Features

---

**FR-EMPLOYEE-001**: Employee can connect their wallet to the employee dashboard

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an employee visiting the `/employee` route, When they click the wallet connection button, Then the wallet provider selection is presented: KMD on LocalNet, Pera Wallet on Testnet (determined by the network environment variable)
  - Given a successful wallet connection, When the employee's address is a registered employee in the contract, Then the employee dashboard is rendered with their stream data
  - Given a wallet that was previously connected, When the employee refreshes the page, Then the wallet connection is restored from localStorage and the last role (employee) is remembered
  - Given a connected wallet that is not a registered employee but has been registered by an employer and has not yet opted in, Then the dashboard shows a prompt: "You've been registered by [employer]. Opt in to start receiving salary." with a one-click opt-in button
- **Dependencies**: FR-SHARED-001

---

**FR-EMPLOYEE-002**: Employee can view a real-time streaming counter showing salary accruing per second

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an active employee with a salary rate, When the employee dashboard loads, Then a counter displays the accrued salary amount in dollars, updating every 1 second by calculating `rate * elapsed_seconds / 3600` on the client side
  - Given an employee whose stream is paused, When the counter renders, Then the counter displays the last accrued value and stops ticking, with a visual indicator that the stream is paused
  - Given an employee who has just withdrawn, When the withdrawal is confirmed, Then the counter resets to $0.00 and begins ticking up again from the new `last_withdrawal` timestamp
  - Given the initial page load, When the counter fetches the on-chain `get_accrued` value, Then the client-side counter synchronizes with the on-chain value before beginning the 1-second tick
- **Dependencies**: FR-EMPLOYEE-001, FR-CONTRACT-006

---

**FR-EMPLOYEE-003**: Employee can withdraw all accrued salary tokens with a single button press

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an active employee with accrued salary above the minimum withdrawal threshold (0.001 PAYUSD / 1000 base units), When the employee clicks the "Withdraw" button, Then the `withdraw()` method is called, the accrued tokens are transferred to the employee's wallet, and a success notification shows the withdrawn amount with a transaction ID and explorer link
  - Given an employee whose accrued amount is below the minimum withdrawal threshold, When the withdraw button renders, Then the button is disabled with a tooltip or label indicating the minimum has not been met
  - Given a wallet signing request that the employee rejects (cancels in Pera/KMD), When the rejection occurs, Then the dashboard displays "Transaction rejected by user" and allows the employee to try again
  - Given a contract that is globally paused, When the employee clicks "Withdraw", Then the transaction fails and an error message indicates the contract is currently paused by the employer
  - Given a failed withdrawal transaction (network error, timeout), When the error occurs, Then an error message is displayed with a retry button
- **Dependencies**: FR-EMPLOYEE-001, FR-CONTRACT-005

---

**FR-EMPLOYEE-004**: Employee can view their withdrawal history with timestamps, amounts, and explorer links

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an employee who has made withdrawals, When the transaction history section loads, Then each withdrawal is displayed with: the amount withdrawn in dollars, the timestamp converted to the browser's local timezone, and a clickable link to the transaction on Lora Explorer (Testnet) or the local equivalent
  - Given an employee with no prior withdrawals, When the history section loads, Then an empty state message is displayed (e.g., "No withdrawals yet")
  - Given a withdrawal that was just completed, When the history section refreshes, Then the new withdrawal appears at the top of the list
- **Dependencies**: FR-EMPLOYEE-001, FR-SHARED-006

---

**FR-EMPLOYEE-005**: Employee can view their current hourly rate and stream status with multi-unit display

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given an active employee with a rate of 100,000,000 base units/hr ($100/hr), When the rate display section renders, Then the rate is shown in all 4 units simultaneously: $100.00/hr, $2,400.00/day, $16,800.00/week, $73,000.00/month (using conversion factors: daily = hourly * 24, weekly = hourly * 168, monthly = hourly * 730)
  - Given an active employee, When the stream status section renders, Then it shows "Active" with a visual indicator (e.g., green dot or streaming animation)
  - Given a paused employee, When the stream status section renders, Then it shows "Paused" with a distinct visual indicator
  - Given that the employer has changed the employee's rate since the employee's last visit, When the dashboard loads, Then a "New" badge or indicator highlights the rate change
- **Dependencies**: FR-EMPLOYEE-001

---

## SHARED — Landing Page, Routing, UX States, Design

---

**FR-SHARED-001**: System detects whether the connected wallet is the employer and routes to the correct dashboard

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a user on the landing page who connects their wallet, When the system queries the contract's `employer` global state and the connected address matches, Then the user is automatically redirected to the `/employer` route
  - Given a user on the landing page who connects their wallet, When the connected address does not match the employer address, Then the user is automatically redirected to the `/employee` route
  - Given a user on the landing page who has not connected a wallet, When the landing page renders, Then manual role selection buttons ("I'm an Employer" / "I'm an Employee") are available as a fallback
  - Given a user who refreshes the page on `/employer` or `/employee`, When the page loads, Then the system re-validates the wallet against the employer global state and maintains the correct route
- **Dependencies**: None

---

**FR-SHARED-002**: System renders a landing page with an architecture diagram and role selection entry points

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given any user visiting `/`, When the landing page loads, Then it displays: a "How it Works" section with an architecture diagram showing the Employer-to-Contract-to-Employee flow, role selection entry points, and a wallet connection prompt
  - Given the landing page, When the Silk 3D background is active, Then a procedural animated background renders behind the content
  - Given the landing page, When a user clicks "I'm an Employer" or "I'm an Employee" without a connected wallet, Then they are prompted to connect their wallet before proceeding
- **Dependencies**: None

---

**FR-SHARED-003**: System displays loading indicators during wallet connection, transaction signing, and confirmation waiting

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a wallet connection in progress, When the user initiates the connection, Then a loading indicator is displayed until the connection succeeds or fails
  - Given a transaction submitted for wallet signing, When the signing prompt is active, Then a loading indicator is displayed with text indicating "Waiting for wallet signature..."
  - Given a signed transaction submitted to the network, When waiting for confirmation, Then a loading indicator is displayed with text indicating "Confirming transaction..."
  - Given any loading state, When the operation completes (success or failure), Then the loading indicator is removed and replaced with the appropriate success or error state
- **Dependencies**: None

---

**FR-SHARED-004**: System displays error messages for rejected transactions, insufficient funds, and network errors

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a transaction that the user rejects in their wallet, When the rejection callback fires, Then an error notification is displayed: "Transaction rejected by user"
  - Given a transaction that fails due to insufficient PAYUSD in the contract, When the error is caught, Then an error notification is displayed indicating the specific issue (e.g., "Insufficient funds in contract")
  - Given a network error (node unreachable, timeout), When the error is caught, Then an error notification is displayed: "Network error. Please check your connection and try again."
  - Given any error notification, When displayed, Then a retry button is presented alongside the error message
  - Given a contract assertion failure (unauthorized caller, invalid state), When the error is caught, Then the error message maps the assertion to a human-readable explanation
- **Dependencies**: None

---

**FR-SHARED-005**: System displays success confirmations with transaction ID and explorer link after every on-chain action

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given any successful on-chain transaction (fund, register, withdraw, pause, resume, update rate, remove, milestone pay), When the transaction is confirmed, Then a toast notification is displayed containing: a success message describing the action, the transaction ID (truncated), and a clickable explorer link
  - Given the app is connected to Testnet, When the explorer link is generated, Then it points to Lora Explorer at the correct Testnet URL for the transaction
  - Given the app is connected to LocalNet, When the explorer link is generated, Then it points to the local explorer equivalent or displays the raw transaction ID
- **Dependencies**: None

---

**FR-SHARED-006**: System shows a network badge indicating whether the app is connected to LocalNet or Testnet

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given the app is configured with the network environment variable set to "testnet", When any page renders, Then a badge or indicator is visible displaying "Testnet"
  - Given the app is configured with the network environment variable set to "localnet", When any page renders, Then a badge or indicator is visible displaying "LocalNet"
  - Given the network badge, When rendered, Then it is positioned consistently across all pages (landing, employer dashboard, employee dashboard) without overlapping primary content
- **Dependencies**: None

---

**FR-SHARED-007**: System renders the dark theme with AlgoGate-inspired aesthetic across all pages

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given any page in the application, When it renders, Then the page background uses the dark color (#0a0f0d), cards use glassmorphism (blurred backdrop, semi-transparent borders, layered shadows), interactive cards follow the spotlight hover effect (radial gradient following mouse position), and key text elements use the shimmer gradient animation
  - Given the employer or employee dashboard, When cards are rendered, Then they use the SpotlightCard component with mouse-following radial gradient via CSS custom properties
  - Given all timestamps displayed in the application, When rendered, Then they are converted from UTC to the browser's local timezone using the browser's Intl API, displayed in a format like "Mar 23, 2026 11:30 AM IST"
  - Given all monetary amounts displayed in the application, When rendered, Then they use the dollar sign prefix (e.g., "$100.00") consistent with PAYUSD being a stablecoin analog where 1 PAYUSD = $1.00
- **Dependencies**: None

---

## DEVOPS — Deployment, Demo Scripts, Testing

---

**FR-DEVOPS-001**: Developer can deploy the full system (ASA + contract) to LocalNet or Testnet with a single command

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a configured environment with AlgoKit installed, When the developer runs the deployment script with a `--network localnet` flag, Then the script creates the PAYUSD ASA, deploys the PayrollStream contract, configures the clawback, opts the contract into the ASA, and outputs the resulting ASA ID and App ID
  - Given a configured environment, When the developer runs the deployment script with a `--network testnet` flag, Then the same sequence executes on Testnet using the deployer mnemonic from the environment variables
  - Given a deployment that fails at any step, When the error occurs, Then the script outputs a clear error message indicating which step failed and why
- **Dependencies**: FR-TOKEN-001, FR-TOKEN-002, FR-CONTRACT-001, FR-CONTRACT-002

---

**FR-DEVOPS-002**: Developer can fund test accounts with ALGO and PAYUSD tokens using a setup script

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given 3 test employee accounts, When the developer runs the account setup script, Then each account is funded with sufficient ALGO for minimum balance requirements and transaction fees, and each account receives an allocation of PAYUSD tokens
  - Given LocalNet, When the setup script runs, Then it uses the AlgoKit default accounts and KMD for signing
  - Given Testnet, When the setup script runs, Then it uses accounts derived from mnemonics in the environment variables
- **Dependencies**: FR-DEVOPS-001

---

**FR-DEVOPS-003**: Developer can run an automated demo script and a demo reset script for reliable demo execution

- **Priority**: P0 (MVP)
- **Acceptance Criteria**:
  - Given a deployed system (ASA + contract), When the developer runs the demo script with a `--network` flag, Then the script executes the 9-step demo sequence: (1) create ASA, (2) deploy contract, (3) fund with 100,000 PAYUSD, (4) register Employee A at $100/hr, (5) register Employees B and C in a batch, (6) wait for accrual, (7) Employee A withdraws, (8) update Employee B rate to $200/hr with retroactive settlement, (9) pause Employee C with settlement
  - Given any step of the demo script that fails, When the failure occurs, Then the script outputs which step failed with the error details and halts execution
  - Given the demo script completes all 9 steps, When the final step finishes, Then a summary is printed listing all transaction IDs and a "Demo complete" confirmation
  - Given a previously deployed system, When the developer runs the demo reset script, Then a fresh ASA is created, a fresh contract is deployed, the clawback is reconfigured, the contract is opted in, and updated ASA ID and App ID values are output
  - Given a demo reset on LocalNet, When the reset script runs, Then the new deployment completes in under 30 seconds
- **Dependencies**: FR-DEVOPS-001, FR-DEVOPS-002

---

**FR-DEVOPS-004**: Developer can demonstrate Algorand rekeying by delegating transaction authority from a sub-account to another address

- **Priority**: P1 (STRETCH)
- **Acceptance Criteria**:
  - Given an employer sub-account funded with ALGO and an HR manager address, When the employer submits a rekeying transaction (`PaymentTxn` with `rekey_to` set to the HR manager's address), Then the sub-account is rekeyed so the HR manager can sign transactions from the sub-account's address
  - Given a rekeyed sub-account, When the HR manager calls contract methods (register_employee, fund) using the sub-account's address but signing with their own key, Then the transactions are accepted by the network
  - Given a rekeyed sub-account, When the demo narrative is presented, Then it demonstrates: "The HR manager triggers payroll operations without having access to the employer's main funds"
- **Dependencies**: FR-DEVOPS-001

---

## Cross-Cutting Concerns

The following acceptance criteria apply across categories and are embedded in the FRs above but are highlighted here for completeness:

1. **Concurrent operations**: FR-CONTRACT-007 AC2 covers the case where the employer updates a rate while the employee withdraws simultaneously. The contract handles this gracefully and tests must cover this scenario.

2. **Session persistence**: FR-EMPLOYER-001 AC3 and FR-EMPLOYEE-001 AC3 specify that wallet connections persist via localStorage and the last role is remembered on refresh.

3. **Minimum withdrawal**: FR-EMPLOYEE-003 AC2 specifies the 0.001 PAYUSD (1000 base units) minimum withdrawal threshold.

4. **Failed transaction retry**: FR-SHARED-004 AC4 specifies that all error states include a retry button.

5. **Empty states**: FR-EMPLOYER-005 AC3 specifies the empty placeholder for no employees; FR-EMPLOYER-009 covers the setup checklist for newly deployed contracts; FR-EMPLOYEE-004 AC2 covers empty transaction history.

---

## Traceability Matrix

| FR ID | Contract Method / Feature | Master Plan Reference |
|-------|--------------------------|----------------------|
| FR-CONTRACT-001 | `create(asset)` | MVP Method #1 |
| FR-CONTRACT-002 | `opt_in_asset()` | MVP Method #2 |
| FR-CONTRACT-003 | `fund(axfer)` | MVP Method #3 |
| FR-CONTRACT-004 | `register_employee(account, rate)` | MVP Method #4 |
| FR-CONTRACT-005 | `withdraw()` | MVP Method #5 |
| FR-CONTRACT-006 | `get_accrued(account)` | MVP Method #6 |
| FR-CONTRACT-007 | `update_rate(account, new_rate)` | MVP Method #7 |
| FR-CONTRACT-008 | `pause_stream(account)` | MVP Method #8 |
| FR-CONTRACT-009 | `resume_stream(account)` | MVP Method #10 |
| FR-CONTRACT-010 | `remove_employee(account)` | MVP Method #11 |
| FR-CONTRACT-011 | `pause_all()` | MVP Method #12 |
| FR-CONTRACT-012 | `milestone_pay(employee, amount)` | MVP Method #9 |
| FR-CONTRACT-013 | Authorization enforcement | MVP #2 (auth) |
| FR-CONTRACT-014 | Overdraft protection | MVP #3 (overdraft) |
| FR-CONTRACT-015 | `resume_all()` | STRETCH Method #1 |
| FR-CONTRACT-016 | `drain_funds()` | STRETCH Method #2 |
| FR-CONTRACT-017 | ARC-28 event emission | STRETCH #5 |
| FR-TOKEN-001 | PAYUSD ASA creation | MVP Token #4 |
| FR-TOKEN-002 | Clawback configuration | MVP Token #5 |
| FR-TOKEN-003 | Employee ASA opt-in | MVP Token #6 |
| FR-TOKEN-004 | Employee app opt-in | MVP Token #7 |
| FR-EMPLOYER-001 | Wallet connection | MVP Employer #8 |
| FR-EMPLOYER-002 | Contract health + runway | MVP Employer #15 |
| FR-EMPLOYER-003 | Fund contract UI | MVP Employer #9 |
| FR-EMPLOYER-004 | Register employee UI (incl. batch) | MVP Employer #10 |
| FR-EMPLOYER-005 | Employee list | MVP Employer #11 |
| FR-EMPLOYER-006 | Stream management | MVP Employer #12 |
| FR-EMPLOYER-007 | Milestone payments UI | MVP Employer #13 |
| FR-EMPLOYER-008 | Emergency controls | MVP Employer #14 |
| FR-EMPLOYER-009 | Setup checklist | MVP Employer #16 |
| FR-EMPLOYER-010 | CSV export | STRETCH #3 |
| FR-EMPLOYEE-001 | Wallet connection | MVP Employee #17 |
| FR-EMPLOYEE-002 | Streaming counter | MVP Employee #18 |
| FR-EMPLOYEE-003 | Withdraw button | MVP Employee #19 |
| FR-EMPLOYEE-004 | Transaction history | MVP Employee #20 |
| FR-EMPLOYEE-005 | Rate & status display | MVP Employee #21 |
| FR-SHARED-001 | Role-based routing | MVP Shared #22 |
| FR-SHARED-002 | Landing page | MVP Shared #23 |
| FR-SHARED-003 | Loading states | MVP Shared #24 |
| FR-SHARED-004 | Error handling | MVP Shared #25 |
| FR-SHARED-005 | Success confirmations | MVP Shared #26 |
| FR-SHARED-006 | Network badge | MVP Shared #27 |
| FR-SHARED-007 | Dark theme + timezone + explorer | MVP Shared #28, UX #33-35 |
| FR-DEVOPS-001 | Deployment script | MVP DevOps #29 |
| FR-DEVOPS-002 | Account setup script | MVP DevOps #30 |
| FR-DEVOPS-003 | Demo script + demo reset | MVP DevOps #31-32 |
| FR-DEVOPS-004 | Rekeying demonstration | STRETCH #4 |

---

**Total: 47 FRs (42 P0 + 5 P1)**
