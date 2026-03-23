# AlgoFlow — Real-Time Programmable Payroll Infrastructure on Algorand

## Project Overview
AlgoFlow is a decentralized payroll streaming platform built on the Algorand blockchain. Employers fund smart contracts with tokenized salary units (ASAs), which stream continuously to employees. Employees withdraw accrued earnings at any time with instant settlement. Built for DAOs, remote teams, and digital organizations seeking transparent, programmable payroll automation.

Built for the **Infinova Hackathon** (Blockchain with Algorand track, Option 1).

## Tech Stack
- **Smart Contracts**: Algorand Python (`algopy`) — typed Python compiled to AVM bytecode
- **Tooling**: AlgoKit CLI — scaffolding, compilation, deployment, local network
- **SDK**: `py-algorand-sdk` (`algosdk`) — transaction building, indexer queries, account management
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + custom glassmorphism design system
- **3D/Animation**: Three.js (Silk background), Motion library (shimmer/transitions)
- **Wallet**: Pera Wallet (WalletConnect) for transaction signing
- **Network**: Algorand Testnet (free, ~3.3s finality, 0.001 ALGO fees)
- **Testing**: pytest (contracts), Vitest (frontend unit), Playwright (E2E)

## Commands
- `algokit localnet start` — Start local Algorand network (Docker required)
- `algokit localnet stop` — Stop local network
- `algokit compile python smart_contracts/payroll_stream/contract.py` — Compile contract
- `algokit deploy` — Deploy contracts to configured network
- `pytest` — Run smart contract tests
- `npm run dev` — Start frontend dev server
- `npm run build` — Production build
- `npm run test` — Run frontend unit tests
- `npx playwright test` — Run E2E tests
- `npm run lint` — Check formatting

## Project Structure
```
algoflow/
├── CLAUDE.md                          # This file — project conventions
├── smart_contracts/
│   ├── payroll_stream/
│   │   ├── contract.py                # Main PayrollStream ARC4 contract (algopy)
│   │   └── deploy_config.py           # Deployment configuration
│   ├── helpers/
│   │   └── build.py                   # Contract build helpers
│   └── __init__.py
├── tests/
│   ├── conftest.py                    # Shared fixtures (algod client, accounts, etc.)
│   ├── test_payroll_stream.py         # Contract unit tests
│   └── test_integration.py            # Full-flow integration tests
├── scripts/
│   ├── deploy.py                      # Deployment script (testnet/localnet)
│   ├── fund_accounts.py               # Fund test accounts from faucet
│   └── demo.py                        # Live demo script for presentations
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Main application component
│   │   ├── main.tsx                   # React entry point
│   │   ├── index.css                  # Global styles, Tailwind imports
│   │   ├── components/
│   │   │   ├── SpotlightCard.tsx      # Interactive spotlight hover card
│   │   │   ├── SpotlightCard.css      # Spotlight radial gradient styles
│   │   │   ├── ShinyText.tsx          # Shimmer gradient text animation
│   │   │   ├── ShinyText.css          # Shimmer keyframes
│   │   │   ├── Silk.tsx               # Three.js procedural 3D background
│   │   │   ├── StreamCounter.tsx      # Real-time salary accrual counter
│   │   │   ├── EmployeeDashboard.tsx      # Employee view — accrued, withdraw, history
│   │   │   ├── EmployerDashboard.tsx      # Employer view — manage employees, fund
│   │   │   ├── TransactionHistory.tsx # On-chain transaction log
│   │   │   └── WalletConnect.tsx      # Pera Wallet connection handler
│   │   ├── hooks/
│   │   │   ├── usePayrollContract.ts  # Contract interaction hook
│   │   │   ├── useStreamAccrual.ts    # Real-time accrual calculation hook
│   │   │   └── useWallet.ts           # Wallet connection state hook
│   │   ├── lib/
│   │   │   ├── algorand.ts            # Algod/Indexer client setup
│   │   │   ├── constants.ts           # App-wide constants
│   │   │   └── utils.ts               # Tailwind merge, formatters
│   │   └── types/
│   │       └── index.ts               # TypeScript type definitions
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── docs/                              # Maestro planning artifacts
│   ├── 00-master-plan.md             # Authoritative project plan (644 lines)
│   ├── 01-prd.md                     # Product requirements — 47 FRs, 27 NFRs, 8 journeys (1089 lines)
│   ├── 02-architecture.md            # System architecture + 9 ADRs (1335 lines)
│   ├── 03-data-model.md              # On-chain state schema + MBR calculations (716 lines)
│   ├── 04-screen-map.md              # Screen map + wireframes + UX states (1012 lines)
│   ├── prd-sections/                 # PRD sub-documents (generated during P1)
│   ├── research/                     # Discovery research + audit reports
│   └── readiness/                    # P5 readiness gate audit results
├── sprints/                           # Maestro sprint artifacts
│   ├── sprint-plan.md                # 22 stories across 5 sprints (0-4)
│   ├── sprint-status.yaml            # Story state machine tracker
│   └── stories/                      # 22 individual story files (STORY-{sprint}-{NNN}.md)
├── orchestrator/                      # Maestro execution artifacts
│   ├── config.yaml
│   ├── learning-log.md
│   └── runs/
│       └── 2026-03-23-algoflow-planning/
│           ├── SESSION-HANDOFF.md    # Authoritative handoff for /maestro-execute (670 lines)
│           ├── readiness-report.md   # P5 readiness verdict: PASS
│           ├── telemetry.yaml        # Pipeline telemetry
│           └── running-summary.md    # Pipeline status summary
├── .env.example
├── .env
├── .algokit.toml                      # AlgoKit project config
├── pyproject.toml                     # Python project config
└── requirements.txt                   # Python dependencies
```

## Architecture Decisions
- **Algorand Python over PyTeal**: Cleaner syntax, typed Python, better tooling support with AlgoKit. All contracts use `algopy` imports — zero PyTeal patterns.
- **ASA for salary tokens**: Native Algorand Standard Assets are cheaper and simpler than smart-contract-managed tokens. The salary token is a first-class Algorand asset.
- **Math-based streaming**: Salary accrual is calculated mathematically (`rate × elapsed_time / 3600`), not by sending transactions every second. Employees withdraw on demand — the contract computes what's owed.
- **Inner transactions for payouts**: The contract itself initiates asset transfers to employees via inner transactions — employees don't need to be pre-funded or trusted.
- **Atomic transfers for safety**: Multi-step operations (fund + register, withdraw + update) are grouped atomically — all succeed or all fail.
- **Frontend streaming illusion**: JavaScript timer recalculates accrual every second for visual effect. On-chain calculation happens only on withdrawal — no wasted compute.
- **Clawback for contract authority**: The contract address is set as the ASA clawback, enabling it to programmatically move salary tokens without requiring employee signatures on the asset side.

## Smart Contract Schema

### Global State
| Key | Type | Description |
|-----|------|-------------|
| `employer` | Account | Address of the employer who created the contract |
| `salary_asset` | Asset | ASA ID of the salary token |
| `total_employees` | UInt64 | Count of active registered employees |
| `total_streamed` | UInt64 | Cumulative tokens disbursed to all employees |
| `is_paused` | UInt64 | Global pause flag (0 = active, 1 = paused) |

### Local State (Per Employee)
| Key | Type | Description |
|-----|------|-------------|
| `salary_rate` | UInt64 | Tokens per hour (in base units) |
| `stream_start` | UInt64 | Unix timestamp when streaming began |
| `last_withdrawal` | UInt64 | Unix timestamp of last withdrawal |
| `total_withdrawn` | UInt64 | Cumulative tokens withdrawn |
| `is_active` | UInt64 | Employee stream status (0 = paused, 1 = active) |

### Contract Methods (ABI)

**MVP Methods (12):**
| Method | Caller | Description |
|--------|--------|-------------|
| `create(asset)` | Employer | Initialize contract with salary ASA |
| `opt_in_asset()` | Employer | Contract opts into the salary ASA |
| `fund(axfer)` | Employer | Deposit salary tokens into contract |
| `register_employee(account, rate)` | Employer | Register employee with hourly rate |
| `withdraw()` | Employee | Claim all accrued salary tokens (with overdraft protection) |
| `get_accrued(account)` | Anyone | Read-only: view accrued balance |
| `update_rate(account, new_rate)` | Employer | Settle accrued at old rate, then apply new rate |
| `pause_stream(account)` | Employer | Settle accrued, then pause stream |
| `milestone_pay(employee, amount)` | Employer | One-time milestone payment via inner transaction |
| `resume_stream(account)` | Employer | Resume a paused stream (inverse of pause) |
| `remove_employee(account)` | Employer | Final payout + deregister employee |
| `pause_all()` | Employer | Emergency pause all active streams |

**STRETCH Methods (2):**
| Method | Caller | Description |
|--------|--------|-------------|
| `resume_all()` | Employer | Resume all paused streams |
| `drain_funds()` | Employer | Withdraw remaining pool (emergency) |

## Key Conventions
- All monetary values in **base units** (token with 6 decimals: 1,000,000 = 1.000000 token)
- Salary rates stored as **tokens per hour** in base units
- Timestamps are **Unix epoch seconds** from `Global.latest_timestamp`
- All on-chain time arithmetic uses **integer division** — no floating point
- Frontend displays converted values: `base_units / 10^decimals`
- Transaction notes use prefix `algoflow:` for indexer filtering
- PAYUSD is analogous to USDT — display as "$" in UI (1 PAYUSD = $1.00)
- Frontend supports multi-unit rate display: $/hr, $/day, $/week, $/month
- All displayed timestamps converted from UTC to browser local timezone
- Demo configured for 3 employees maximum
- Wallet signing: KMD for LocalNet, Pera Wallet for Testnet (via @txnlab/use-wallet-react)

## Environment Variables
Required environment variables (see `.env.example`):
- `ALGOD_SERVER` — Algod node URL (e.g., `https://testnet-api.algonode.cloud`)
- `ALGOD_TOKEN` — Algod API token (empty string for Algonode public nodes)
- `INDEXER_SERVER` — Indexer URL (e.g., `https://testnet-idx.algonode.cloud`)
- `INDEXER_TOKEN` — Indexer API token (empty string for Algonode)
- `DEPLOYER_MNEMONIC` — 25-word Algorand mnemonic for deployment account (server-side only, NEVER commit)
- `APP_ID` — Deployed application ID (set after deployment)
- `ASSET_ID` — Created salary ASA ID (set after creation)
- `VITE_ALGOD_SERVER` — Algod URL exposed to frontend (Vite prefix)
- `VITE_ALGOD_TOKEN` — Algod token exposed to frontend
- `VITE_APP_ID` — App ID exposed to frontend
- `VITE_ASSET_ID` — Asset ID exposed to frontend
- `VITE_NETWORK` — Network identifier (`testnet` | `localnet`)

**CRITICAL: NEVER commit `.env` files. NEVER expose mnemonics or private keys to the frontend. Use `VITE_` prefix ONLY for public, non-sensitive values.**

## Design System

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#137636` | Primary actions, headers, active states |
| `--primary-dark` | `#0d5427` | Hover states, emphasis |
| `--accent` | `#f25f6c` | Alerts, important callouts, live indicators |
| `--surface` | `#fffdf8` | Card backgrounds |
| `--bg-dark` | `#0a0f0d` | Page background |
| `--text-primary` | `#1a1a1a` | Primary text on light surfaces |
| `--text-light` | `#f0f0f0` | Text on dark surfaces |
| `--stream-green` | `#5dcaa5` | Streaming indicator, accrual counter |

### Typography
- **Body**: `"Geist Variable"`, system-ui fallback
- **Headings**: `"Fraunces Variable"`, serif fallback
- **Monospace**: `ui-monospace, SFMono-Regular, Menlo` — for addresses, amounts, counters
- **Letter spacing**: `-0.03em` on headings for tighter feel

### Effects
- **Glassmorphism**: `backdrop-filter: blur(18px)`, semi-transparent borders, layered shadows
- **Spotlight Cards**: Mouse-following radial gradient via CSS custom properties
- **Shimmer Text**: Gradient background-clip animation on key text elements
- **Silk Background**: Three.js procedural 3D animation (fragment shader with noise)
- **Stream Counter**: Smooth number interpolation for real-time salary accrual display

## Security
- Private keys and mnemonics stored ONLY in environment variables, NEVER in code or version control
- All contract methods validate `Txn.sender` against authorized addresses (employer or registered employee)
- Withdrawal amounts computed on-chain from timestamps — employees cannot claim more than earned
- Atomic transaction groups prevent partial execution of multi-step operations
- Inner transactions are initiated by the contract, not external signers — prevents spoofing
- Frontend wallet interactions use WalletConnect — private keys never leave the wallet app
- All Algorand addresses are validated before use (32-byte public key, valid checksum)
- Rate limiting on frontend RPC calls to prevent indexer abuse

## Known Constraints
- Algorand smart contract local state limited to 16 key-value pairs per account per app
- Algorand smart contract global state limited to 64 key-value pairs
- Inner transaction limit: 256 per group (sufficient for batch payroll)
- Algorand Python compiler requires AlgoKit CLI installed
- `Global.latest_timestamp` has ~4.5 second granularity (block time) — acceptable for hourly rates
- Testnet accounts require funding via faucet (https://bank.testnet.algorand.network/)

## Planning Status

**Maestro Planning: COMPLETE** (all 6 phases P0-P5 passed)

| Metric | Value |
|--------|-------|
| Planning artifacts | 47 files, 13,259 lines |
| MVP contract methods | 12 |
| STRETCH contract methods | 2 (resume_all, drain_funds) |
| MVP FRs | 42 |
| STRETCH FRs | 5 |
| Total FRs | 47 |
| NFRs | 27 |
| User journeys | 8 |
| Sprints | 5 (0-4), 22 stories |
| Estimated effort | 33-42 hours |
| Readiness verdict | PASS (3/3 auditors) |
| Session handoff | `orchestrator/runs/2026-03-23-algoflow-planning/SESSION-HANDOFF.md` |

**Execution status**: Sprint 0 DONE, Sprint 1 DONE. Sprint 2 next.

## Implementation Warnings

These MUST be observed during execution:

1. **Global state schema**: Declare as `4 uints, 1 byte-slice` (employer is Account/byte-slice). Wrong allocation = deployment failure.
2. **MBR funding order**: Fund contract with ALGO → opt_in_asset() → fund with PAYUSD. Never call opt_in_asset before MBR funding.
3. **Employee ASA opt-in**: Contract cannot enforce this. Frontend must verify before registration. Demo script pre-opts-in test employees.
4. **Inner transaction fees**: Methods with inner txns need `fee = 2 * min_fee` on outer call, or include fee-funding PaymentTxn in atomic group.
5. **Paused employee rate update**: Contract rejects `update_rate()` on paused employees (assert is_active == 1). `resume_stream()` resets `last_withdrawal` to now, preventing paused-period accrual. Both are tested.
6. **Minimum withdrawal**: 0.001 PAYUSD (1000 base units). Contract rejects withdrawals below this threshold (implemented).
7. **Testnet deployment cost**: Full deployment requires ~5 ALGO (contract MBR 0.464 ALGO + inner txn fees + employee opt-in MBR). Fund deployer with 10 ALGO from testnet faucet (https://bank.testnet.algorand.network/).

## Maestro Orchestration

This project uses the Maestro orchestration system for structured planning and execution.

### Skills
- `/maestro-plan` — COMPLETED (2026-03-23). All planning artifacts generated.
- `/maestro-execute` — Run the Maestro Executioner to implement sprint by sprint
- `/maestro-retro` — Run a structured retrospective after completing a sprint
- `/maestro-correct` — Handle mid-implementation scope changes

### Orchestrator Config
- Project config: `orchestrator/config.yaml`
- Run artifacts: `orchestrator/runs/{run-id}/`
- Learning log: `orchestrator/learning-log.md`
- Session handoff: `orchestrator/runs/2026-03-23-algoflow-planning/SESSION-HANDOFF.md`

### Quality Gates
- Contract tests: `pytest --tb=short`
- Type check: `npx tsc --noEmit` (frontend)
- Unit tests: `npx vitest run`
- E2E tests: `npx playwright test`
- Lint: `npm run lint`
- Coverage target: 80%

### Context Loading Policy

The Maestro executor MUST load maximum context at session start. This is NOT optional.

**Required reads at session start (ALL of these, FULL files):**
1. `orchestrator/runs/{latest}/SESSION-HANDOFF.md` — the authoritative handoff document
2. `orchestrator/runs/{latest}/telemetry.yaml` — execution metrics
3. `sprints/sprint-plan.md` — full sprint plan
4. `sprints/sprint-status.yaml` — full status
5. `orchestrator/learning-log.md` — all anti-patterns and lessons
6. `CLAUDE.md` — project conventions (this file)
7. All `sprints/stories/STORY-{N}-*.md` files for the current sprint

**The executor follows SESSION-HANDOFF.md instructions EXACTLY. It does not improvise, skip steps, or override the handoff's wave structure, hard gates, or requirements.**

## Coding Conventions

These conventions are MANDATORY for all code. Every AI agent and developer MUST follow them exactly.

### 1. Algorand Python Contract Conventions

ALL smart contracts MUST use Algorand Python (`algopy`). Zero tolerance for PyTeal or raw TEAL.

**Contract structure (PuyaPy 5.x — state declared in `__init__`):**
```python
from algopy import ARC4Contract, arc4, Asset, Account, Global, Txn
from algopy import UInt64, gtxn, itxn, LocalState, GlobalState, subroutine, op

class PayrollStream(ARC4Contract):
    """Contract docstring describing purpose."""

    def __init__(self) -> None:
        # 1. Global state declarations (PuyaPy 5.x requires __init__)
        self.employer = GlobalState(Account)
        self.salary_asset = GlobalState(Asset)

        # 2. Local state declarations
        self.salary_rate = LocalState(UInt64, key="salary_rate")

    # 3. Create method (constructor)
    @arc4.abimethod(create="require")
    def create(self, asset: Asset) -> None:
        self.employer.value = Txn.sender
        self.salary_asset.value = asset

    # 4. Public ABI methods
    @arc4.abimethod
    def withdraw(self) -> UInt64:
        # method body
        ...

    # 5. Internal helper methods (subroutines)
    @algopy.subroutine
    def _calculate_accrued(self, employee: Account) -> UInt64:
        # helper body
        ...
```

**WRONG — NEVER use PyTeal:**
```python
# WRONG — PyTeal imports. NEVER use.
from pyteal import *
from pyteal import Seq, Assert, App, Int, Bytes, Txn
```

**Authorization pattern — ALWAYS validate sender:**
```python
@arc4.abimethod
def register_employee(self, employee: Account, rate: arc4.UInt64) -> None:
    # CORRECT — validate sender is employer
    assert Txn.sender == self.employer

    # WRONG — no validation. NEVER skip this.
    # self.salary_rate[employee] = rate.native
```

**Inner transactions — use typed builders:**
```python
# CORRECT — typed inner transaction
itxn.AssetTransfer(
    xfer_asset=self.salary_asset,
    asset_receiver=employee,
    asset_amount=accrued,
).submit()

# WRONG — raw InnerTxnBuilder (PyTeal pattern)
# InnerTxnBuilder.Execute({...})
```

### 2. algosdk (Python SDK) Conventions

**Client setup:**
```python
from algosdk.v2client import algod, indexer

# CORRECT — use environment variables
algod_client = algod.AlgodClient(
    algod_token=os.environ["ALGOD_TOKEN"],
    algod_address=os.environ["ALGOD_SERVER"],
)

# WRONG — hardcoded credentials
# algod_client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")
```

**Transaction building — use typed transaction classes:**
```python
from algosdk.transaction import (
    AssetCreateTxn,
    AssetTransferTxn,
    ApplicationCallTxn,
    PaymentTxn,
    assign_group_id,
)

# CORRECT — typed transaction
txn = AssetTransferTxn(
    sender=sender_address,
    sp=algod_client.suggested_params(),
    receiver=receiver_address,
    amt=amount,
    index=asset_id,
)

# WRONG — raw dictionary construction
# txn = {"type": "axfer", "sender": sender, ...}
```

**Atomic groups — always use assign_group_id:**
```python
# CORRECT — atomic group
txns = [fund_txn, register_txn]
assign_group_id(txns)
signed_txns = [txn.sign(private_key) for txn in txns]
algod_client.send_transactions(signed_txns)

# WRONG — sending transactions separately (not atomic)
# algod_client.send_transaction(fund_txn.sign(key))
# algod_client.send_transaction(register_txn.sign(key))
```

**Waiting for confirmation — ALWAYS wait:**
```python
from algosdk.transaction import wait_for_confirmation

# CORRECT — wait for confirmation after send
txid = algod_client.send_transaction(signed_txn)
result = wait_for_confirmation(algod_client, txid, 4)

# WRONG — send and hope. NEVER do this.
# algod_client.send_transaction(signed_txn)
# return txid  # might not be confirmed!
```

### 3. React / TypeScript Frontend Conventions

**Component structure — every component MUST follow this order:**
```tsx
// 1. React/library imports
import { useState, useEffect, useCallback } from 'react';

// 2. Local imports (hooks, utils, types)
import { usePayrollContract } from '../hooks/usePayrollContract';
import type { Employee } from '../types';

// 3. Component props type
interface EmployeeDashboardProps {
  appId: number;
  assetId: number;
}

// 4. Component function
export function EmployeeDashboard({ appId, assetId }: EmployeeDashboardProps) {
  // 5. Hooks
  const { accrued, withdraw } = usePayrollContract(appId);

  // 6. State
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 7. Derived values (useMemo)
  // 8. Effects (useEffect)
  // 9. Event handlers
  // 10. Render
  return <div>...</div>;
}
```

**Naming conventions:**
| Category | Convention | Examples |
|----------|-----------|---------|
| Components | PascalCase | `EmployeeDashboard`, `StreamCounter`, `SpotlightCard` |
| Hooks | camelCase, `use` prefix | `usePayrollContract`, `useStreamAccrual`, `useWallet` |
| Utilities | camelCase | `formatAlgoAmount`, `shortenAddress`, `calculateAccrued` |
| Constants | SCREAMING_SNAKE_CASE | `ALGOD_SERVER`, `STREAM_UPDATE_INTERVAL_MS`, `ASSET_DECIMALS` |
| Types/Interfaces | PascalCase | `Employee`, `PayrollState`, `ContractConfig` |
| CSS files | Match component name | `SpotlightCard.css`, `ShinyText.css` |
| Event handlers | `handle` prefix | `handleWithdraw`, `handleConnect`, `handleRegister` |
| Boolean state | `is`/`has`/`can` prefix | `isConnected`, `hasEmployees`, `canWithdraw` |

**Algorand address display — ALWAYS truncate:**
```tsx
// CORRECT — truncate long addresses
function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
// Display: "ABC123...XY78"

// WRONG — full 58-character address in UI
// <span>{fullAddress}</span>
```

**Amount formatting — ALWAYS convert from base units:**
```tsx
// CORRECT — convert and format
function formatTokenAmount(baseUnits: number, decimals: number = 6): string {
  return (baseUnits / Math.pow(10, decimals)).toFixed(decimals);
}

// WRONG — display raw base units
// <span>{1000000}</span>  // User sees "1000000" instead of "1.000000"
```

### 4. File Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Smart contracts | snake_case.py | `contract.py`, `deploy_config.py` |
| Python tests | test_*.py | `test_payroll_stream.py`, `test_integration.py` |
| Python modules | snake_case.py | `fund_accounts.py`, `demo.py` |
| React components | PascalCase.tsx | `EmployeeDashboard.tsx`, `StreamCounter.tsx` |
| React hooks | camelCase.ts, `use` prefix | `usePayrollContract.ts`, `useWallet.ts` |
| CSS files | PascalCase.css (match component) | `SpotlightCard.css` |
| Utility modules | camelCase.ts | `algorand.ts`, `constants.ts`, `utils.ts` |
| Type definitions | camelCase.ts in types/ | `types/index.ts` |
| Config files | standard names | `vite.config.ts`, `tsconfig.json`, `pyproject.toml` |

### 5. Testing Conventions

**Smart contract tests — use AlgoKit testing utilities:**
```python
import pytest
from algokit_utils import (
    ApplicationClient,
    get_localnet_default_account,
)

def test_register_employee(algod_client, app_client):
    """Test names describe the behavior being verified."""
    # Arrange
    employee = generate_account()

    # Act
    result = app_client.call(
        method="register_employee",
        employee=employee.address,
        rate=1_000_000,
    )

    # Assert
    assert result.confirmed_round > 0
```

**Test naming — describe behavior, not implementation:**
```python
# CORRECT
def test_employee_cannot_withdraw_more_than_accrued():
def test_only_employer_can_register_employees():
def test_paused_stream_stops_accrual():

# WRONG — vague names
# def test_withdraw():
# def test_register():
# def test_pause():
```

### 6. Import Conventions

**Python — group imports with blank lines between groups:**
```python
# 1. Standard library
import os
import time
from typing import Final

# 2. Third-party
from algosdk.v2client import algod
from algosdk.transaction import AssetCreateTxn, wait_for_confirmation
from algosdk import account, mnemonic

# 3. AlgoKit utilities
from algokit_utils import ApplicationClient, get_localnet_default_account

# 4. Local project
from smart_contracts.payroll_stream.contract import PayrollStream
```

**TypeScript — group imports with blank lines between groups:**
```tsx
// 1. React / external libraries
import { useState, useEffect } from 'react';
import algosdk from 'algosdk';

// 2. Local hooks and utilities
import { usePayrollContract } from '../hooks/usePayrollContract';
import { formatTokenAmount, shortenAddress } from '../lib/utils';

// 3. Types
import type { Employee, ContractState } from '../types';

// 4. Styles
import './EmployeeDashboard.css';
```

### 7. Error Handling

**Smart contracts — use assert with clear conditions:**
```python
# CORRECT — clear assertion
assert Txn.sender == self.employer, "Only employer can register"
assert self.salary_rate[employee].get(default=UInt64(0)) == 0, "Already registered"
assert accrued > 0, "Nothing to withdraw"

# WRONG — silent failure or unclear error
# if Txn.sender != self.employer:
#     return  # silently does nothing
```

**Frontend — handle wallet and transaction errors gracefully:**
```tsx
try {
  const result = await contract.withdraw();
  setStatus('success');
} catch (error) {
  if (error.message.includes('rejected')) {
    setStatus('User rejected transaction');
  } else if (error.message.includes('insufficient')) {
    setStatus('Insufficient funds in contract');
  } else {
    setStatus('Transaction failed. Please try again.');
    console.error('Withdraw error:', error);
  }
}
```

### 8. Git Conventions

- **Branch naming**: `feat/`, `fix/`, `docs/`, `test/` prefixes
- **Commit messages**: Present tense, imperative mood ("Add employee registration", not "Added")
- **Never commit**: `.env`, mnemonics, private keys, `node_modules/`, `__pycache__/`, `.venv/`
- **`.gitignore** must include: `.env`, `*.pyc`, `__pycache__/`, `node_modules/`, `.venv/`, `dist/`, `.algokit/`

### 9. Constants — No Magic Numbers

All configuration values in dedicated constants files:

**Python (`smart_contracts/helpers/constants.py`):**
```python
SALARY_TOKEN_TOTAL_SUPPLY: Final[int] = 1_000_000_000_000  # 1M tokens (6 decimals)
SALARY_TOKEN_DECIMALS: Final[int] = 6
SALARY_TOKEN_UNIT_NAME: Final[str] = "PAYUSD"
SALARY_TOKEN_NAME: Final[str] = "AlgoFlow USD"
MIN_BALANCE_REQUIREMENT: Final[int] = 100_000  # 0.1 ALGO
```

**TypeScript (`frontend/src/lib/constants.ts`):**
```typescript
export const STREAM_UPDATE_INTERVAL_MS = 1000;
export const ASSET_DECIMALS = 6;
export const ADDRESS_DISPLAY_LENGTH = 6;
export const TX_CONFIRMATION_ROUNDS = 4;
export const PERA_WALLET_PROJECT_ID = 'algoflow';
```
