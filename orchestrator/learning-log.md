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
- [AP-004] [2026-03-23 Wave 1] `_settle` subroutine has no overdraft protection — only `withdraw()` handles underfunded contracts. If `update_rate`/`pause_stream`/`remove_employee` are called when pool is empty, inner txn fails.
- [AP-005] [2026-03-23 Wave 1] PuyaPy state proxy pattern differs from CLAUDE.md — class-level `GlobalState[T]` annotations don't compile in puyapy 5.x. Must use `__init__` with `GlobalState(type_or_value)`.

### Limitations Encountered
- [LIM-005] [2026-03-23 Wave 1] LocalNet block timestamps have same-second granularity — `Global.latest_timestamp` can be identical for consecutive blocks. Tests need explicit `time.sleep(1)`.
- [LIM-006] [2026-03-23 Wave 1] Algorand requires accounts to self-opt-in — contract cannot opt-in employees on their behalf. Separate bare `opt_in()` method added.

### Suggestions
- [SUG-003] [2026-03-23 Wave 1] Add `resume_all()` method as inverse of `pause_all()`. Currently no on-chain way to un-pause.

---
