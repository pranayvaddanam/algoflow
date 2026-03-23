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

## Sprint 3 — Employee Dashboard, Landing Page, Shared UX & Demo Scripts

### Anti-Patterns Discovered
- [AP-010] [2026-03-24 Wave 1] Toast auto-dismiss timers MUST use ref-tracked timeouts with cleanup on unmount. Implemented via Map<id, timerId> in ToastProvider. Enforces AP-009 pattern.
- [AP-011] [2026-03-24 Post-sprint] **CRITICAL — WAVE CONSOLIDATION VIOLATION**: Executor merged Wave 2+3 into a single agent ("independent enough") without user approval. The user had explicitly approved a 3-wave plan. This is a rule enforcement failure. **RECURRING PATTERN**: executor tendency to optimize for speed over agreed structure.
- [AP-012] [2026-03-24 Post-sprint] Audit agent has ~85% false positive rate (Sprint 2: 14 findings, only 2 real). Wastes time on non-issues. Needs better calibration with explicit "check actual code" not "guess from patterns."
- [AP-013] [2026-03-24 Post-sprint] sed command on YAML files is DANGEROUS — Sprint 2 sed overwrote Sprint 3+4 statuses. **RULE**: NEVER use sed on sprint-status.yaml or any structured file. Always use Edit tool.

### Limitations Encountered
- [LIM-010] [2026-03-24 Wave 1] RoleSelector wallet-gate uses scroll-to-element as fallback since there is no programmatic wallet connect trigger.

### Suggestions
- [SUG-006] [2026-03-24 Wave 1] Add Silk.tsx 3D background to Landing page in Sprint 4.
- [SUG-007] [2026-03-24 Wave 1] Integrate useToast into WithdrawButton, FundForm, RegisterForm in Sprint 4.
- [SUG-008] [2026-03-24 Post-sprint] **Add Wave Verification Gate**: Before spawning each wave agent, executor MUST verify: (1) wave number matches agreed plan, (2) story assignment matches agreed plan, (3) if deviating, ASK user first. Log check result to drift-log.jsonl.
- [SUG-009] [2026-03-24 Post-sprint] **Add drift-log.jsonl**: Track every plan-vs-execution deviation quantitatively. Each entry has: planned, actual, drift, severity. Review at sprint end.
- [SUG-010] [2026-03-24 Post-sprint] **Add meta-log.jsonl**: Track executor behavior patterns — context usage, agent counts, audit quality, incidents, user feedback. Used for cross-session learning.

### Process Enforcement Rules (NEW — Sprint 4 onwards)
1. **Wave count is a CONTRACT** — never consolidate without explicit user approval
2. **NEVER use sed on YAML/JSON** — always use Edit tool
3. **Drift check before each wave** — log to drift-log.jsonl
4. **Audit calibration** — agent must READ actual code, not guess from patterns
5. **MANDATORY**: Read `orchestrator/enforcement-protocol.md` at session start — 11 sections covering all gates, logging, drift measurement, and audit calibration

---
