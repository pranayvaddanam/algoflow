# STORY-4-002: Design polish: Silk background, spotlight cards, shimmer text, glassmorphism

## Story

**As a** user,
**I want** the AlgoFlow UI to feature a stunning dark theme with a 3D animated background, glassmorphism cards with mouse-following spotlight effects, and shimmer text animations,
**so that** the application makes a strong visual impression on hackathon judges.

## Sprint

Sprint 4 -- Polish, Testnet Deploy & Stretch Goals

## FRs Covered

- **FR-SHARED-007**: System renders the dark theme with glassmorphism aesthetic across all pages

## Complexity

L (Large)

## Acceptance Criteria

- **Given** any page, **When** rendered, **Then** the background uses `#0a0f0d` dark color with the Silk Three.js procedural 3D animation (fragment shader with noise).
- **Given** any card component, **When** rendered, **Then** it uses glassmorphism: `backdrop-filter: blur(18px)`, semi-transparent borders (`rgba(255,255,255,0.24)`), layered shadows.
- **Given** a SpotlightCard, **When** the user hovers and moves their mouse, **Then** a radial gradient follows the mouse position via CSS custom properties (`--mouse-x`, `--mouse-y`).
- **Given** key text elements (headings, counter, amounts), **When** rendered, **Then** shimmer gradient animation plays (200% width, 5s linear infinite cycle).
- **Given** all timestamps displayed, **When** rendered, **Then** they are converted from UTC to browser local timezone using `Intl.DateTimeFormat`.
- **Given** all monetary amounts, **When** rendered, **Then** they use dollar sign prefix consistent with PAYUSD = $1.
- **Given** headings, **When** rendered, **Then** they use Fraunces Variable font with letter-spacing -0.03em.
- **Given** body text, **When** rendered, **Then** it uses Geist Variable font.
- **Given** addresses and amounts, **When** rendered, **Then** they use the monospace font stack.

## Architecture Components Affected

- `frontend/src/components/Silk.tsx`
- `frontend/src/components/SpotlightCard.tsx`
- `frontend/src/components/SpotlightCard.css`
- `frontend/src/components/ShinyText.tsx`
- `frontend/src/components/ShinyText.css`
- `frontend/src/index.css` (global styles, CSS custom properties, font imports)
- `frontend/tailwind.config.ts` (design token integration)

## Dev Agent Record
<!-- Filled by implementing agent during /maestro-execute -->
- **Agent ID**:
- **Files Created**:
- **Files Modified**:
- **Tests Written**:
- **Decisions Made**:
- **Blockers Encountered**:
- **Completion Status**:
