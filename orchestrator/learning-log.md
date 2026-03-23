# Maestro Learning Log

<!-- This log captures anti-patterns, limitations, and suggestions discovered across all sprints -->
<!-- Updated incrementally after each wave (not batched at sprint end) -->

---

## Sprint 0 — Scaffold & Environment

### Anti-Patterns Discovered
- [AP-001] [2026-03-23 Wave 1] Duplicate CSS custom properties in index.css — colors defined in both `:root` and `@theme` blocks. Tailwind v4 only needs `@theme`. Consolidate in Sprint 2 when design system work begins.
- [AP-002] [2026-03-23 Wave 1] CLAUDE.md project structure references `tailwind.config.ts` but Tailwind v4 uses CSS-first `@theme` configuration. CLAUDE.md should be updated to note this.

### Limitations Encountered
- [LIM-001] [2026-03-23 Wave 1] `algorand-python` is a compile-time-only stub — raises RuntimeError if imported at Python runtime. Tests must use `algokit_utils.ApplicationClient` against compiled TEAL, not import PayrollStream directly.
- [LIM-002] [2026-03-23 Wave 1] Puya compiler optimizes away declared-but-unused state. ARC56 schema shows 0/0 for skeleton contract. Schema auto-populates when state-accessing methods are added.
- [LIM-003] [2026-03-23 Wave 1] `@perawallet/connect` brings 10 npm audit vulnerabilities (6 moderate, 4 high) via transitive WalletConnect v1 deps. Cannot be resolved without upstream fixes.
- [LIM-004] [2026-03-23 Wave 1] Docker not running at Sprint 0 start — cannot verify `algokit localnet start`. Required for Sprint 1.

### Suggestions
- [SUG-001] [2026-03-23 Wave 1] Add `VITE_INDEXER_SERVER` and `VITE_INDEXER_TOKEN` to `.env.example` for completeness (frontend `algorand.ts` reads them with fallback defaults).
- [SUG-002] [2026-03-23 Wave 1] Update CLAUDE.md to replace `tailwind.config.ts` reference with note about CSS-first v4 configuration.

---

## Sprint 1 — Smart Contract & Token Infrastructure

### Anti-Patterns Discovered
- [AP-003] [2026-03-23 Wave 1] `remove_employee` zeroes local state instead of deleting. Cleared slots still consume MBR. Future: use `del self.field[account]` to free storage.
- [AP-004] [2026-03-23 Wave 1] `_settle` subroutine had no overdraft protection. **RESOLVED**: Added balance check + auto-pause in commit 6a0fe0b.
- [AP-005] [2026-03-23 Wave 1] PuyaPy state proxy pattern differs from CLAUDE.md. **RESOLVED**: CLAUDE.md updated to show `__init__` pattern in commit 6a0fe0b.

### Limitations Encountered
- [LIM-005] [2026-03-23 Wave 1] LocalNet block timestamps have same-second granularity — `Global.latest_timestamp` can be identical for consecutive blocks. Tests need explicit `time.sleep(1)`.
- [LIM-006] [2026-03-23 Wave 1] Algorand requires accounts to self-opt-in — contract cannot opt-in employees on their behalf. Separate bare `opt_in()` method added.

### Suggestions
- [SUG-003] [2026-03-23 Wave 1] Add `resume_all()` method as inverse of `pause_all()`. Currently no on-chain way to un-pause.

---

## Sprint 2 — Employer Dashboard

### Anti-Patterns Discovered
- [AP-006] [2026-03-23 Wave 2] App.tsx route ternary had both branches pointing to `/employer` — dead code bug. **RESOLVED**: Fixed in commit c09bd57.
- [AP-007] [2026-03-23 Wave 2] Employee address tracking via localStorage — contract has no on-chain address list. If localStorage cleared, employee list empties. Demo-scope limitation (max 3). Production: use Indexer.
- [AP-008] [2026-03-23 Wave 2] Batch registration executes sequentially, not atomically. Partial failure leaves some employees registered, others not.
- [AP-009] [2026-03-23 Wave 3] setTimeout without cleanup in EmployerDashboard callbacks. Minor memory leak on unmount. Low priority.

### Limitations Encountered
- [LIM-007] [2026-03-23 Wave 1] algosdk v3 types differ significantly from v2 — `TealKeyValue.key` is `Uint8Array`, `TealValue.uint` is `bigint`, global state path is `.params.globalState`. Risk resolution doc had v2 patterns.
- [LIM-008] [2026-03-23 Wave 1] ARC56 JSON must be copied into `src/lib/` because tsconfig `include: ["src"]` blocks imports from outside src directory.
- [LIM-009] [2026-03-23 Wave 2] algosdk bundle is ~1MB. Chunk warning on build. Needs code-splitting in Sprint 4.

### Suggestions
- [SUG-004] [2026-03-23 Wave 2] Use Indexer queries to discover opted-in employees instead of localStorage tracking.
- [SUG-005] [2026-03-23 Wave 3] Add `resume_all` to EmergencyControls — currently only pause, no unpause UI.

---
