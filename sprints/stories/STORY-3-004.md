# STORY-3-004: Shared UX: loading states, error handling, toasts, network badge, explorer links

## Story

**As a** user,
**I want** clear loading indicators during async operations, user-friendly error messages for all failure modes, success toasts with explorer links after every transaction, and a network badge showing which network I am connected to,
**so that** I always know the status of my actions and can verify transactions independently.

## Sprint

Sprint 3 -- Employee Dashboard, Landing Page, Shared UX & Demo Scripts

## FRs Covered

- **FR-SHARED-003**: System displays loading indicators during wallet connection, transaction signing, and confirmation waiting
- **FR-SHARED-004**: System displays error messages for rejected transactions, insufficient funds, and network errors
- **FR-SHARED-005**: System displays success confirmations with transaction ID and explorer link after every on-chain action
- **FR-SHARED-006**: System shows a network badge indicating whether the app is connected to LocalNet or Testnet

## Complexity

L (Large)

## Acceptance Criteria

### Loading states (FR-SHARED-003)
- **Given** a wallet connection in progress, **Then** a loading indicator is displayed until success or failure.
- **Given** a transaction submitted for signing, **Then** "Waiting for wallet signature..." with a loading indicator is shown.
- **Given** a signed transaction submitted to the network, **Then** "Confirming transaction..." with a loading indicator is shown.
- **Given** any loading state completes, **Then** the indicator is replaced with the success or error state.

### Error handling (FR-SHARED-004)
- **Given** a user-rejected transaction, **Then** "Transaction rejected by user" is displayed.
- **Given** insufficient PAYUSD in the contract, **Then** "Insufficient funds in contract" is displayed.
- **Given** a network error, **Then** "Network error. Please check your connection and try again." is displayed.
- **Given** any error, **Then** a retry button is presented alongside the message.
- **Given** a contract assertion failure, **Then** the assertion is mapped to a human-readable explanation.

### Success toasts (FR-SHARED-005)
- **Given** any successful on-chain transaction, **When** confirmed, **Then** a toast shows: success message, truncated tx ID, and clickable explorer link.
- **Given** Testnet connection, **Then** the link points to Lora Explorer at the correct URL.
- **Given** LocalNet connection, **Then** the link points to the local explorer or displays the raw tx ID.

### Network badge (FR-SHARED-006)
- **Given** `VITE_NETWORK` set to "testnet", **Then** a badge displays "Testnet" on all pages.
- **Given** `VITE_NETWORK` set to "localnet", **Then** a badge displays "LocalNet" on all pages.
- **Given** the badge, **Then** it is positioned consistently without overlapping primary content.

## Architecture Components Affected

- `frontend/src/components/Toast.tsx`
- `frontend/src/components/ExplorerLink.tsx`
- `frontend/src/components/NetworkBadge.tsx`
- All form components (loading/error state integration)
- `frontend/src/lib/utils.ts` (explorer URL builder)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
