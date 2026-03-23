# STORY-3-003: Landing page, role routing, and shared navigation

## Story

**As a** user,
**I want** to visit a landing page that explains how AlgoFlow works and automatically routes me to the correct dashboard based on my wallet address,
**so that** I have an intuitive entry point whether I am an employer or an employee.

## Sprint

Sprint 3 -- Employee Dashboard, Landing Page, Shared UX & Demo Scripts

## FRs Covered

- **FR-SHARED-001**: System detects whether the connected wallet is the employer and routes to the correct dashboard
- **FR-SHARED-002**: System renders a landing page with an architecture diagram and role selection entry points

## Complexity

M (Medium)

## Acceptance Criteria

### Role routing (FR-SHARED-001)
- **Given** a user who connects their wallet on the landing page, **When** the connected address matches the contract's `employer` global state, **Then** the user is redirected to `/employer`.
- **Given** a connected address that does not match the employer, **Then** the user is redirected to `/employee`.
- **Given** a user who has not connected a wallet, **Then** manual role selection buttons are available as a fallback.
- **Given** a user who refreshes on `/employer` or `/employee`, **Then** the system re-validates and maintains the correct route.

### Landing page (FR-SHARED-002)
- **Given** any user visiting `/`, **When** the landing page loads, **Then** it displays: a "How It Works" section with an architecture diagram, role selection entry points ("I'm an Employer" / "I'm an Employee"), and a wallet connection prompt.
- **Given** the landing page, **When** the 3D background shader is active, **Then** a procedural animated background renders behind the content (placeholder in Sprint 3; polished in Sprint 4).
- **Given** a user clicking a role button without a connected wallet, **Then** they are prompted to connect their wallet before proceeding.

## Architecture Components Affected

- `frontend/src/App.tsx` (React Router setup, role detection logic)
- `frontend/src/components/Landing.tsx`
- `frontend/src/components/HowItWorks.tsx`
- `frontend/src/components/RoleSelector.tsx`

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
