# STORY-0-001: Project scaffold and AlgoKit initialization

## Story

**As a** developer,
**I want** a fully initialized AlgoKit project with Python backend structure, local Algorand network, and working contract compilation pipeline,
**so that** I can start implementing smart contract logic immediately.

## Sprint

Sprint 0 -- Scaffold & Environment

## FRs Covered

None (infrastructure story -- no business logic FRs).

## Complexity

M (Medium)

## Acceptance Criteria

- **Given** AlgoKit CLI is installed, **When** I run `algokit localnet start`, **Then** Docker containers for algod, indexer, and KMD start and the algod health endpoint returns 200.
- **Given** the project directory exists, **When** I inspect the file structure, **Then** the following directories exist: `smart_contracts/payroll_stream/`, `smart_contracts/helpers/`, `tests/`, `scripts/`.
- **Given** the contract skeleton file `smart_contracts/payroll_stream/contract.py` contains an empty `PayrollStream(ARC4Contract)` class, **When** I run `algokit compile python smart_contracts/payroll_stream/contract.py`, **Then** compilation succeeds and produces TEAL output.
- **Given** the Python environment is configured, **When** I run `pytest`, **Then** the test runner executes without import errors (0 tests collected is acceptable).
- **Given** the project root, **When** I inspect `.env.example`, **Then** all required environment variable keys are documented: `ALGOD_SERVER`, `ALGOD_TOKEN`, `INDEXER_SERVER`, `INDEXER_TOKEN`, `DEPLOYER_MNEMONIC`, `APP_ID`, `ASSET_ID`, `VITE_ALGOD_SERVER`, `VITE_ALGOD_TOKEN`, `VITE_APP_ID`, `VITE_ASSET_ID`, `VITE_NETWORK`.
- **Given** the project root, **When** I inspect `.gitignore`, **Then** it excludes `.env`, `node_modules/`, `__pycache__/`, `.venv/`, `dist/`, `.algokit/`.
- **Given** the project root, **When** I inspect `pyproject.toml` and `requirements.txt`, **Then** dependencies include `algopy`, `py-algorand-sdk`, `algokit-utils`, `pytest`.

## Architecture Components Affected

- `smart_contracts/__init__.py`
- `smart_contracts/payroll_stream/__init__.py`
- `smart_contracts/payroll_stream/contract.py` (skeleton)
- `smart_contracts/helpers/__init__.py`
- `smart_contracts/helpers/build.py`
- `smart_contracts/helpers/constants.py`
- `tests/__init__.py`
- `tests/conftest.py` (skeleton)
- `scripts/` (directory creation)
- `.algokit.toml`
- `pyproject.toml`
- `requirements.txt`
- `.env.example`
- `.env`
- `.gitignore`

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
