# Sprint 0 Wave 1 — Backend + Frontend Scaffold Agent

You are running as an opus-class agent at maximum effort. Prioritize correctness and thoroughness over speed. Cost and token usage are not constraints.

## Your Mission

Implement STORY-0-001 (backend scaffold) and STORY-0-002 (frontend scaffold) for the AlgoFlow project. This is a greenfield project — you are creating the entire project structure from scratch.

## Context

AlgoFlow is a decentralized payroll streaming platform on Algorand. You are scaffolding the project — NO business logic yet. Just the skeleton that future sprints will build on.

**Working directory**: `/Users/pranayvaddanam/Desktop/infinova-hackathon`

## Required Reads

Before implementing, READ these files for full context:
1. `/Users/pranayvaddanam/Desktop/infinova-hackathon/CLAUDE.md` — ALL coding conventions, design system, project structure
2. `/Users/pranayvaddanam/Desktop/infinova-hackathon/sprints/stories/STORY-0-001.md` — Backend scaffold story + ACs
3. `/Users/pranayvaddanam/Desktop/infinova-hackathon/sprints/stories/STORY-0-002.md` — Frontend scaffold story + ACs
4. `/Users/pranayvaddanam/Desktop/infinova-hackathon/docs/02-architecture.md` — Architecture (read the smart contract schema section and frontend component list)
5. `/Users/pranayvaddanam/Desktop/infinova-hackathon/docs/03-data-model.md` — Data model (read the state schema for the contract skeleton)

## Context7 Mandate

You MUST use the Context7 MCP tools (mcp__context7__resolve-library-id and mcp__context7__query-docs) before implementing code that interacts with any library. Specifically:
- Look up **Algorand Python (algopy)** docs for ARC4Contract patterns
- Look up **Tailwind CSS v4** docs for Vite plugin setup and CSS-first configuration
- Look up **React Router v7** or latest react-router-dom for route setup
- Look up **Vite** docs for React TypeScript template configuration

## STORY-0-001: Backend Scaffold

### Files to Create

1. **`smart_contracts/__init__.py`** — empty init
2. **`smart_contracts/payroll_stream/__init__.py`** — empty init
3. **`smart_contracts/payroll_stream/contract.py`** — Empty PayrollStream(ARC4Contract) class skeleton. Include:
   - All imports from algopy
   - Class with global state declarations (employer: Account, salary_asset: Asset, total_employees: UInt64, total_streamed: UInt64, is_paused: UInt64)
   - Local state declarations (salary_rate, stream_start, last_withdrawal, total_withdrawn, is_active — all LocalState[UInt64])
   - NO method implementations yet — just the class with state declarations
   - CRITICAL: employer is Account type (stored as byte-slice on AVM). The schema must be 4 uints + 1 byte-slice.
4. **`smart_contracts/helpers/__init__.py`** — empty init
5. **`smart_contracts/helpers/build.py`** — Build helper (can be minimal for now)
6. **`smart_contracts/helpers/constants.py`** — Constants per CLAUDE.md:
   ```python
   from typing import Final
   SALARY_TOKEN_TOTAL_SUPPLY: Final[int] = 1_000_000_000_000  # 1M tokens (6 decimals)
   SALARY_TOKEN_DECIMALS: Final[int] = 6
   SALARY_TOKEN_UNIT_NAME: Final[str] = "PAYUSD"
   SALARY_TOKEN_NAME: Final[str] = "AlgoFlow USD"
   MIN_BALANCE_REQUIREMENT: Final[int] = 100_000  # 0.1 ALGO
   ```
7. **`tests/__init__.py`** — empty init
8. **`tests/conftest.py`** — Skeleton with basic imports and docstring. Include commented-out fixture patterns for algod_client, app_client, etc.
9. **`scripts/`** — Create directory (empty for now)
10. **`.algokit.toml`** — AlgoKit project configuration
11. **`pyproject.toml`** — Python project config with:
    - Project name: algoflow
    - Python >= 3.12
    - Dependencies: algorand-python, py-algorand-sdk, algokit-utils, pytest
12. **`requirements.txt`** — Same deps for pip install:
    ```
    algorand-python
    py-algorand-sdk>=2.6.0
    algokit-utils>=3.0.0
    pytest>=8.0.0
    ```
13. **`.env.example`** — All required keys per CLAUDE.md (ALGOD_SERVER, ALGOD_TOKEN, INDEXER_SERVER, INDEXER_TOKEN, DEPLOYER_MNEMONIC, APP_ID, ASSET_ID, VITE_ALGOD_SERVER, VITE_ALGOD_TOKEN, VITE_APP_ID, VITE_ASSET_ID, VITE_NETWORK)
14. **`.env`** — Copy of .env.example with LocalNet defaults filled in:
    ```
    ALGOD_SERVER=http://localhost:4001
    ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    INDEXER_SERVER=http://localhost:8980
    INDEXER_TOKEN=
    ```
15. **`.gitignore`** — Must exclude: .env, node_modules/, __pycache__/, .venv/, dist/, .algokit/, *.pyc, .pytest_cache/, .DS_Store

### Backend Verification
- Run `pip install -r requirements.txt` (or create a venv first if needed)
- Run `pytest` — should execute without import errors (0 tests collected is OK)
- Try `algokit compile python smart_contracts/payroll_stream/contract.py` — if it works, great. If it fails due to the empty class, that's OK — note the exact error in your output.

## STORY-0-002: Frontend Scaffold

### Files to Create

Create the frontend as a subdirectory `frontend/` in the project root.

1. **`frontend/package.json`** — Create manually (do NOT use npm create). Include:
   - name: "algoflow-frontend"
   - React 19, react-dom 19, react-router-dom (latest)
   - algosdk, @txnlab/use-wallet-react, @perawallet/connect
   - three, motion (framer-motion successor)
   - Dev deps: typescript, @types/react, @types/react-dom, @types/three
   - Vite, @vitejs/plugin-react
   - Tailwind CSS v4 (use @tailwindcss/vite plugin)
   - Scripts: dev, build, preview, test (vitest)

2. **`frontend/vite.config.ts`** — Vite config with React plugin and Tailwind v4 plugin

3. **`frontend/tsconfig.json`** — TypeScript config with strict mode, paths alias for @/

4. **`frontend/tsconfig.node.json`** — Node TypeScript config for Vite

5. **`frontend/index.html`** — HTML entry point. Include:
   - Title: "AlgoFlow — Payroll Streaming on Algorand"
   - Link to Geist Variable and Fraunces Variable fonts (Google Fonts or Fontsource)
   - Meta tags for viewport, charset
   - Dark background color in body style

6. **`frontend/src/main.tsx`** — React entry point with BrowserRouter

7. **`frontend/src/App.tsx`** — Main app with routes:
   - `/` → Landing placeholder
   - `/employer` → Employer Dashboard placeholder
   - `/employee` → Employee Dashboard placeholder

8. **`frontend/src/index.css`** — Tailwind CSS imports + design tokens. Include:
   - Tailwind v4 imports (@import "tailwindcss")
   - CSS custom properties from CLAUDE.md design system:
     - --primary: #137636
     - --primary-dark: #0d5427
     - --accent: #f25f6c
     - --surface: #fffdf8
     - --bg-dark: #0a0f0d
     - --text-primary: #1a1a1a
     - --text-light: #f0f0f0
     - --stream-green: #5dcaa5
   - Font-face declarations or imports for Geist Variable and Fraunces Variable
   - Body base styles: dark background, text-light color, font-family

9. **`frontend/src/components/`** — Create directory (empty for now)

10. **`frontend/src/hooks/`** — Create directory (empty for now)

11. **`frontend/src/lib/constants.ts`** — Export constants per CLAUDE.md:
    ```typescript
    export const STREAM_UPDATE_INTERVAL_MS = 1000;
    export const ASSET_DECIMALS = 6;
    export const ADDRESS_DISPLAY_LENGTH = 6;
    export const TX_CONFIRMATION_ROUNDS = 4;
    export const PERA_WALLET_PROJECT_ID = 'algoflow';
    ```

12. **`frontend/src/lib/utils.ts`** — Utility functions:
    - `formatTokenAmount(baseUnits: number, decimals?: number): string`
    - `shortenAddress(addr: string): string`
    - `cn(...classes: (string | undefined | false)[]): string` — class name merger

13. **`frontend/src/lib/algorand.ts`** — Skeleton for Algod/Indexer client setup (export functions that read from env vars)

14. **`frontend/src/types/index.ts`** — TypeScript interfaces:
    - `Employee` (address, salaryRate, streamStart, lastWithdrawal, totalWithdrawn, isActive)
    - `ContractState` (employer, salaryAsset, totalEmployees, totalStreamed, isPaused)
    - `PayrollConfig` (appId, assetId, network)

### Frontend Verification
- Run `cd frontend && npm install` to install all dependencies
- Run `npx tsc --noEmit` — should pass with zero type errors
- Run `npm run build` — should produce a dist/ directory
- Note: `npm run dev` verification is informational (server runs in background)

## Output Contract

Your output MUST include ALL of these sections:

### Implementation Summary
- Files Created: [list with full paths]
- Files Modified: [list with full paths]
- Tests Added: [list of test files]

### Acceptance Criteria Verification
| AC | Status | Evidence (file:line) |
|----|--------|---------------------|
| [each AC from both stories] | PASS/FAIL | [specific file:line reference] |

### Quality Verification
- Build (frontend): PASS/FAIL
- tsc --noEmit: PASS/FAIL
- pytest: PASS/FAIL
- algokit compile: PASS/FAIL or N/A with reason

### Dev Agent Record (for STORY-0-001)
Fill in the Dev Agent Record section.

### Dev Agent Record (for STORY-0-002)
Fill in the Dev Agent Record section.

### Anti-Patterns & Limitations
1. Anti-patterns observed (at least 1 or "None observed — [reason]")
2. Limitations encountered (at least 1 or "None encountered — [reason]")
3. Suggestions (at least 1 or "None — system working as designed")

## Communication Protocol (MVT-v1)

If you change any function signature, export, data shape, or create shared modules that other agents may depend on, send a message using TaskCreate:

Subject: MVT|HIGH|sprint0-scaffold|executor|API_CHANGE|msg-NNN
Description: JSON with protocol, ts, from, to, type, priority, payload details

## CRITICAL Rules
- Follow ALL conventions from CLAUDE.md
- Use Algorand Python (algopy) — ZERO PyTeal
- Use typed imports, proper file naming conventions
- NEVER hardcode credentials — use environment variables
- Create .env with LocalNet defaults but .env.example with empty values
- Test each verification step and report exact output
