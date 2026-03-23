# STORY-0-002: Frontend scaffold with React, Vite, Tailwind

## Story

**As a** developer,
**I want** a fully initialized React 19 + TypeScript + Vite + Tailwind CSS 4 frontend project with the design token system configured,
**so that** I can start building dashboard components in Sprint 2.

## Sprint

Sprint 0 -- Scaffold & Environment

## FRs Covered

None (infrastructure story -- no business logic FRs).

## Complexity

M (Medium)

## Acceptance Criteria

- **Given** Node.js 22.x is installed, **When** I run `npm run dev` from the `frontend/` directory, **Then** a Vite dev server starts and the browser shows a placeholder page at `http://localhost:5173`.
- **Given** the frontend directory, **When** I inspect `package.json`, **Then** dependencies include: `react`, `react-dom`, `react-router-dom`, `algosdk`, `@txnlab/use-wallet-react`, `@perawallet/connect`, `three`, `motion`.
- **Given** `tailwind.config.ts`, **When** I inspect the configuration, **Then** the design tokens from CLAUDE.md are configured: colors (`--primary`, `--primary-dark`, `--accent`, `--surface`, `--bg-dark`, `--text-primary`, `--text-light`, `--stream-green`), fonts (Geist Variable, Fraunces Variable).
- **Given** `frontend/src/index.css`, **When** I inspect its contents, **Then** it imports Tailwind base/components/utilities and defines CSS custom properties for the design system.
- **Given** the frontend source tree, **When** I inspect the directories, **Then** the following directories exist: `src/components/`, `src/hooks/`, `src/lib/`, `src/types/`.
- **Given** `frontend/src/lib/constants.ts`, **When** I inspect its contents, **Then** it exports: `STREAM_UPDATE_INTERVAL_MS`, `ASSET_DECIMALS`, `ADDRESS_DISPLAY_LENGTH`, `TX_CONFIRMATION_ROUNDS`.
- **Given** `frontend/src/types/index.ts`, **When** I inspect its contents, **Then** it exports TypeScript interfaces: `Employee`, `ContractState`, `PayrollConfig` (at minimum).
- **Given** the frontend directory, **When** I run `npx tsc --noEmit`, **Then** TypeScript compilation passes with zero type errors.

## Architecture Components Affected

- `frontend/index.html`
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tailwind.config.ts`
- `frontend/tsconfig.json`
- `frontend/tsconfig.node.json`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx` (placeholder)
- `frontend/src/index.css`
- `frontend/src/lib/constants.ts`
- `frontend/src/lib/utils.ts`
- `frontend/src/lib/algorand.ts` (skeleton)
- `frontend/src/types/index.ts`

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
