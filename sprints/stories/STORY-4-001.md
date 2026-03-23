# STORY-4-001: Testnet deployment and Pera Wallet integration

## Story

**As a** presenter,
**I want** the full AlgoFlow application deployed on Algorand Testnet with Pera Wallet signing working,
**so that** judges can verify transactions on the public explorer and see a real blockchain application.

## Sprint

Sprint 4 -- Polish, Testnet Deploy & Stretch Goals

## FRs Covered

Infrastructure -- Testnet variant of FR-DEVOPS-001, FR-EMPLOYER-001, FR-EMPLOYEE-001. Ensures the Testnet deployment path works end-to-end with Pera Wallet.

## Complexity

M (Medium)

## Acceptance Criteria

- **Given** Testnet deployer account funded with ALGO (from faucet), **When** `python scripts/deploy.py --network testnet` is run, **Then** the PAYUSD ASA and PayrollStream contract are deployed on Testnet and IDs are output.
- **Given** the deployed contract on Testnet, **When** the App ID and Asset ID are set in `.env` with `VITE_NETWORK=testnet`, **Then** the frontend connects to Testnet Algod nodes.
- **Given** a user on the Testnet frontend, **When** they click "Connect Wallet", **Then** the Pera Wallet provider is presented (not KMD).
- **Given** Pera Wallet connection succeeds, **When** the user signs a transaction (e.g., fund, withdraw), **Then** the Pera signing popup appears, the transaction is submitted to Testnet, and confirmation returns within 5 seconds.
- **Given** the Testnet deployment, **When** explorer links are generated, **Then** they point to Lora Explorer at the correct Testnet URL (e.g., `https://lora.algokit.io/testnet/transaction/{txId}`).
- **Given** 3 test employee accounts, **When** `python scripts/fund_accounts.py --network testnet` is run, **Then** accounts are funded with ALGO and PAYUSD on Testnet.

## Architecture Components Affected

- `scripts/deploy.py` (Testnet path verification)
- `scripts/fund_accounts.py` (Testnet path)
- `frontend/src/main.tsx` (Pera provider activation)
- `frontend/src/lib/algorand.ts` (Testnet Algod URL)
- `.env` (Testnet values)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
