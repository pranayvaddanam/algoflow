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
- **Agent ID**: sprint0-scaffold
- **Files Created**:
  - `smart_contracts/__init__.py`
  - `smart_contracts/payroll_stream/__init__.py`
  - `smart_contracts/payroll_stream/contract.py` (PayrollStream skeleton with state declarations)
  - `smart_contracts/payroll_stream/deploy_config.py`
  - `smart_contracts/helpers/__init__.py`
  - `smart_contracts/helpers/build.py`
  - `smart_contracts/helpers/constants.py`
  - `tests/__init__.py`
  - `tests/conftest.py` (skeleton with commented-out fixtures)
  - `scripts/.gitkeep`
  - `.algokit.toml`
  - `pyproject.toml`
  - `requirements.txt`
  - `.env.example`
  - `.env` (LocalNet defaults)
  - `.gitignore`
- **Files Modified**: None
- **Tests Written**: `tests/conftest.py` (fixture stubs, no executable tests yet)
- **Decisions Made**:
  - Used class-level type annotation pattern for GlobalState/LocalState declarations (e.g., `employer: GlobalState[Account]`), which is the Algorand Python convention. The Puya compiler optimizes away unused state in the ARC56 schema — the schema will auto-populate when methods are added in Sprint 1.
  - `algopy` cannot be imported at runtime (raises RuntimeError) — this is by design. The module is a stub for the Puya compiler. Contract import verification relies on `algokit compile` instead.
  - `employer` declared as `GlobalState[Account]` (byte-slice on AVM) per data model requirement. `salary_asset` declared as `GlobalState[Asset]` (uint64 reference).
  - AlgoKit compile produces correct TEAL output (PayrollStream.approval.teal, PayrollStream.clear.teal, PayrollStream.arc56.json).
  - Python 3.14 used (available on system); `requires-python >= 3.12` set in pyproject.toml.
- **Blockers Encountered**:
  - None. `algokit compile` succeeded. `pytest` collected 0 tests (expected for skeleton).
- **Completion Status**: complete
