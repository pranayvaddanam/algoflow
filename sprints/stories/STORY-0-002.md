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
- **Agent ID**: sprint0-scaffold
- **Files Created**:
  - `frontend/package.json` (React 19, Tailwind v4, algosdk, use-wallet-react, three, motion)
  - `frontend/vite.config.ts` (React plugin + @tailwindcss/vite plugin)
  - `frontend/tsconfig.json` (project references)
  - `frontend/tsconfig.app.json` (strict mode, JSX react-jsx, path aliases)
  - `frontend/tsconfig.node.json` (Vite config typing)
  - `frontend/index.html` (Google Fonts for Geist + Fraunces, dark bg)
  - `frontend/src/main.tsx` (React entry with BrowserRouter)
  - `frontend/src/App.tsx` (Routes: /, /employer, /employee with placeholder components)
  - `frontend/src/index.css` (Tailwind v4 @import, @theme tokens, CSS custom properties, base styles)
  - `frontend/src/lib/constants.ts` (STREAM_UPDATE_INTERVAL_MS, ASSET_DECIMALS, etc.)
  - `frontend/src/lib/utils.ts` (formatTokenAmount, shortenAddress, cn)
  - `frontend/src/lib/algorand.ts` (Algod/Indexer client setup from VITE_ env vars)
  - `frontend/src/types/index.ts` (Employee, ContractState, PayrollConfig, WalletState, TransactionRecord)
  - `frontend/src/vite-env.d.ts` (ImportMetaEnv type declarations)
  - `frontend/src/components/.gitkeep`
  - `frontend/src/hooks/.gitkeep`
- **Files Modified**: None
- **Tests Written**: None (scaffold only — Vitest and Playwright will be added in later sprints)
- **Decisions Made**:
  - Used `@txnlab/use-wallet-react@^4.6.0` instead of `^3.9.0` because v3.x required `algosdk@^2.7.0` which conflicted with `algosdk@^3.2.0`. The v4.x line supports `algosdk@^3.0.0`.
  - Used `@perawallet/connect@^1.4.1` (latest) which requires `algosdk@^3.5.2`.
  - Tailwind v4 CSS-first configuration: used `@import "tailwindcss"` and `@theme` block instead of tailwind.config.ts (v4 convention). No separate tailwind.config.ts file needed.
  - Used `react-router-dom` with `BrowserRouter` + `Routes`/`Route` pattern (declarative routing).
  - Google Fonts CDN used for Geist and Fraunces Variable fonts (simplest for hackathon; Fontsource can be swapped in later).
  - Added bonus types `WalletState` and `TransactionRecord` to types/index.ts beyond the minimum required — these will be needed in Sprint 2.
- **Blockers Encountered**:
  - npm peer dependency conflict between `algosdk@^3.x` and `@txnlab/use-wallet-react@^3.9.0` (which required `algosdk@^2.7.0`). Resolved by upgrading to `@txnlab/use-wallet-react@^4.6.0`.
- **Completion Status**: complete
