# STORY-2-002: Wallet connection and contract state hooks

## Story

**As an** employer,
**I want** to connect my wallet (Pera on Testnet, KMD on LocalNet) and have the app automatically detect that I am the employer,
**so that** I am routed to the employer dashboard with real-time contract state.

## Sprint

Sprint 2 -- Employer Dashboard

## FRs Covered

- **FR-EMPLOYER-001**: Employer can connect their wallet to the employer dashboard

## Complexity

L (Large)

## Acceptance Criteria

- **Given** an employer visiting `/employer`, **When** they click the wallet connection button, **Then** the wallet provider selection is presented: KMD on LocalNet, Pera Wallet on Testnet.
- **Given** a successful wallet connection, **When** the employer's address matches the contract's `employer` global state, **Then** the employer dashboard renders with full functionality.
- **Given** a wallet previously connected, **When** the employer refreshes, **Then** the connection is restored from localStorage.
- **Given** a wallet connection attempt that fails, **When** the error occurs, **Then** an error message with a retry button is displayed.
- **Given** the `useContractState` hook, **When** it is initialized with an app ID, **Then** it polls global state (employer, salary_asset, total_employees, total_streamed, is_paused) every 5 seconds and returns parsed values.
- **Given** the `useContractState` hook with an active address, **When** it polls, **Then** it also fetches and returns local state for the connected address.
- **Given** `main.tsx`, **When** inspected, **Then** the WalletProvider from `@txnlab/use-wallet-react` wraps the entire app with KMD and Pera providers configured.

## Architecture Components Affected

- `frontend/src/main.tsx` (WalletProvider setup)
- `frontend/src/components/WalletConnect.tsx`
- `frontend/src/hooks/useWallet.ts`
- `frontend/src/hooks/useContractState.ts`
- `frontend/src/hooks/usePayrollContract.ts` (skeleton -- method calling)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
