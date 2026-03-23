# Non-Functional Requirements

<!-- AlgoFlow PRD Section: Non-Functional Requirements -->
<!-- Authoritative sources: 00-master-plan.md, CLAUDE.md, research/technical-analysis.md -->

---

## 1. Performance

**NFR-PERF-001**: The system shall render the initial frontend page (landing route `/`) within 2 seconds of navigation on a broadband connection (>=10 Mbps), measured by Lighthouse First Contentful Paint (FCP) metric in a production Vite build.

**NFR-PERF-002**: The system shall confirm any single on-chain transaction (withdraw, fund, register, pause, resume, milestone_pay) within 5 seconds of submission to Algorand Testnet, measured by the elapsed time between `algod_client.send_transaction()` and `wait_for_confirmation()` returning a confirmed round.

**NFR-PERF-003**: The StreamCounter component shall update the displayed accrual amount at a rate of 1 Hz (once per second +/- 50 ms), measured by timestamping consecutive `setInterval` or `requestAnimationFrame` callbacks in the `useStreamAccrual` hook.

**NFR-PERF-004**: The employer dashboard shall render the employee list with 3 employees (addresses, rates, accrued amounts, status badges) within 800 milliseconds of contract state fetch completion, measured by React profiler render duration.

**NFR-PERF-005**: The frontend production bundle (excluding Three.js Silk background shader) shall not exceed 500 KB gzipped total, measured by `vite build` output and `gzip -k` on the resulting assets.

---

## 2. Security

**NFR-SEC-001**: The system shall ensure that zero private keys, mnemonics, or signing secrets are present in any file served to the browser, measured by a recursive search of the `frontend/dist/` build output for 25-word mnemonic patterns and base64-encoded Ed25519 key material. The `DEPLOYER_MNEMONIC` environment variable shall exist only in `.env` (gitignored) and never in source-controlled files.

**NFR-SEC-002**: Every employer-only smart contract method (`fund`, `register_employee`, `update_rate`, `pause_stream`, `resume_stream`, `remove_employee`, `milestone_pay`, `pause_all`, `opt_in_asset`) shall reject calls from non-employer addresses with 100% consistency, measured by pytest assertions verifying that 9 out of 9 employer methods raise an assertion error when called by a non-employer account.

**NFR-SEC-003**: The `withdraw()` method shall never transfer more tokens than the mathematically accrued amount (`rate * elapsed / 3600`), measured by pytest tests comparing the inner transaction amount against independently calculated expected values across 5 or more test scenarios with varying rates and elapsed times.

**NFR-SEC-004**: The system shall validate all Algorand addresses (32-byte public key, valid checksum) before submitting any transaction, measured by frontend unit tests confirming that 3 or more malformed addresses are rejected before reaching the SDK layer.

**NFR-SEC-005**: All frontend-to-node communication shall use HTTPS (TLS 1.2+) for Testnet Algod and Indexer endpoints, measured by verifying that `VITE_ALGOD_SERVER` and `VITE_INDEXER_SERVER` values use the `https://` scheme in `.env.example` and runtime configuration.

---

## 3. Reliability

**NFR-REL-001**: The frontend shall display a user-readable error message (not a raw exception or stack trace) for 100% of anticipated failure modes: wallet rejection, insufficient funds, network timeout, unregistered employee withdrawal, and contract-paused withdrawal, measured by manual testing of each scenario and verifying that the rendered error message is a complete English sentence.

**NFR-REL-002**: The automated demo script (`scripts/demo.py`) shall complete the full 9-step demo flow without manual intervention on 3 consecutive runs against a freshly deployed Testnet contract, measured by exit code 0 on each run.

**NFR-REL-003**: The contract's overdraft protection shall automatically pause an employee's stream when the contract's ASA balance is less than the accrued withdrawal amount, transferring the remaining available balance instead of failing the transaction, measured by a pytest test that funds the contract below the accrued threshold and verifies partial payout plus `is_active` set to 0.

**NFR-REL-004**: The frontend shall degrade gracefully when the Algorand Indexer is unavailable by displaying cached or placeholder transaction history (e.g., "Transaction history temporarily unavailable") instead of crashing, measured by disconnecting the Indexer endpoint and verifying that the employee dashboard renders without a JavaScript error.

---

## 4. Usability

**NFR-UX-001**: Every on-chain action initiated by the user (fund, register, withdraw, pause, resume, update rate, milestone pay) shall display a loading/spinner state within 200 milliseconds of the user clicking the action button, measured by the time between the `onClick` event and the first render of the loading indicator.

**NFR-UX-002**: Every successful on-chain transaction shall produce a toast notification containing the transaction ID (truncated) and a clickable link to the Lora Explorer within 1 second of transaction confirmation, measured by the elapsed time between `wait_for_confirmation` resolution and toast DOM render.

**NFR-UX-003**: All displayed timestamps (withdrawal history, stream start, last withdrawal) shall be converted from UTC to the user's browser-local timezone using `Intl.DateTimeFormat`, measured by a Vitest unit test comparing formatted output against expected local-time strings for at least 2 different timezone offsets.

**NFR-UX-004**: Algorand addresses displayed in the UI shall be truncated to the format `XXXXXX...YYYY` (6 prefix + 4 suffix characters), never showing the full 58-character address in body text, measured by Vitest snapshot tests on all components that render addresses (EmployeeRow, TransactionHistory, WalletConnect).

---

## 5. Blockchain-Specific

**NFR-BC-001**: The system shall operate within Algorand Testnet's block finality window of 3.3 seconds average, with all user-facing flows (submit to confirmed) completing within 2 block rounds (approximately 7 seconds), measured by logging `confirmed_round - submission_round` across 10 test transactions and verifying the median is 2 or fewer rounds.

**NFR-BC-002**: The total Algorand transaction fee budget for the complete 9-step demo flow shall not exceed 0.05 ALGO (50,000 microAlgo), measured by summing all fees from the demo script's transaction receipts. At 0.001 ALGO per transaction, this accommodates up to 50 transactions including inner transactions.

**NFR-BC-003**: The smart contract shall use no more than 5 global state keys and 5 local state keys per employee, staying within 8% of the 64-key global limit and 31% of the 16-key local limit, measured by inspecting the compiled contract's state schema declaration.

**NFR-BC-004**: The smart contract's compiled approval program shall not exceed 8,192 bytes (single program page, no extra pages required), measured by the byte length of the TEAL output from `algokit compile python`.

**NFR-BC-005**: Each individual contract method call shall execute within the base opcode budget of 700 units without requiring OpUp budget pooling, measured by AVM execution traces during pytest that report opcode cost per method invocation.

---

## 6. Testability

**NFR-TEST-001**: The smart contract pytest suite shall achieve a minimum of 80% line coverage across `contract.py`, measured by `pytest --cov=smart_contracts --cov-report=term-missing` output.

**NFR-TEST-002**: The pytest suite shall include at least 1 test per ABI method (12 methods minimum), covering the success path for each, measured by counting distinct `test_*` functions that invoke each of the 12 contract methods.

**NFR-TEST-003**: The demo script (`scripts/demo.py`) shall include a `--dry-run` flag that validates all transaction construction without submitting to the network, completing in under 5 seconds, measured by wall-clock time of `python scripts/demo.py --dry-run`.

**NFR-TEST-004**: The frontend shall pass `npx tsc --noEmit` with zero type errors, measured by the exit code of the TypeScript compiler check against all `.ts` and `.tsx` files in `frontend/src/`.
