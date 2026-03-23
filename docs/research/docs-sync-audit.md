# AlgoFlow Documentation Sync Audit

> **STALENESS WARNING:** This audit was written BEFORE DEC-016 (promotion of resume_stream, remove_employee, pause_all to MVP). All references to "9 MVP methods" in this document should be read as "12 MVP methods." All references to "39 MVP FRs" should be read as "42 MVP FRs." All references to "8 STRETCH" should be read as "5 STRETCH." The fixes proposed below are partially correct but incomplete — see `final-consistency-audit.md` for the complete and current audit.

**Auditor:** Documentation Sync Auditor (Automated)
**Date:** 2026-03-23 (pre-DEC-016)
**Files Audited:**
1. `CLAUDE.md`
2. `docs/00-master-plan.md`
3. `docs/research/requirements-gaps.md`
4. `docs/research/ambiguity-resolutions.md`
5. `docs/research/market-analysis.md`
6. `orchestrator/runs/2026-03-23-paystream-planning/telemetry.yaml`

---

## 1. NAMING CONSISTENCY

| File | Line/Section | Issue | Current Value | Should Be |
|------|-------------|-------|---------------|-----------|
| `telemetry.yaml` | Line 1 (`run_id`) | **STALE "PayStream" reference in run ID** | `"2026-03-23-paystream-planning"` | `"2026-03-23-algoflow-planning"` |
| `telemetry.yaml` | (directory name) | **STALE "PayStream" reference in directory path** | `orchestrator/runs/2026-03-23-paystream-planning/` | `orchestrator/runs/2026-03-23-algoflow-planning/` |
| `CLAUDE.md` | Line 33 (project structure) | **STALE root directory name** | `paystream/` | `algoflow/` (or the actual repo root directory name) |
| `CLAUDE.md` | Line 622 (TypeScript constants) | **STALE "PayStream" reference in Pera Wallet project ID** | `PERA_WALLET_PROJECT_ID = 'paystream'` | `PERA_WALLET_PROJECT_ID = 'algoflow'` |
| `CLAUDE.md` | Line 612 (Python constants) | Token name OK | `SALARY_TOKEN_NAME: Final[str] = "AlgoFlow USD"` | Correct |
| `CLAUDE.md` | Line 611 (Python constants) | Unit name OK | `SALARY_TOKEN_UNIT_NAME: Final[str] = "PAYUSD"` | Correct |

### Component Names

| File | Line/Section | Issue | Current Value | Should Be |
|------|-------------|-------|---------------|-----------|
| All files | N/A | Component name `StreamCounter.tsx` | Consistent across all references | OK -- no `StreamingCounter.tsx` found |

### Method Names

| File | Line/Section | Issue | Current Value | Should Be |
|------|-------------|-------|---------------|-----------|
| All files | N/A | Method `milestone_pay` | Consistent: `milestone_pay(employee, amount)` in CLAUDE.md, master-plan, ambiguity-resolutions | OK -- no `milestone_payment` or `pay_milestone` variants found |

---

## 2. NUMBER CONSISTENCY

### MVP Functional Requirements Count

| File | Section | Stated MVP FR Count | Expected | Status |
|------|---------|---------------------|----------|--------|
| `docs/00-master-plan.md` | Line 36, "Product Scope" | **39 FRs** | 39 | OK |
| `docs/research/ambiguity-resolutions.md` | Line 164, "Updated FR Count" | **39 MVP** | 39 | OK |
| `docs/research/requirements-gaps.md` | Line 327, "Summary Statistics" | **33 MVP** | 39 | **CRITICAL -- stale count** |
| `docs/research/requirements-gaps.md` | Line 124, Constraints table | **33 MVP FRs** | 39 | **CRITICAL -- stale count** |
| `docs/research/requirements-gaps.md` | Line 330, "Critical Path" | **"8 core methods"** | 9 | **CRITICAL -- stale count** |

### MVP Method Count

| File | Section | Stated Method Count | Expected | Status |
|------|---------|---------------------|----------|--------|
| `CLAUDE.md` | Line 133, "Contract Methods (ABI)" | **9** | 9 | OK |
| `docs/00-master-plan.md` | Line 37, "Smart Contract (9 methods)" | **9** | 9 | OK |
| `docs/research/ambiguity-resolutions.md` | Line 13, Section A1 | **9 (was 8)** | 9 | OK |
| `docs/research/ambiguity-resolutions.md` | Line 170, Method Table | **9 methods** | 9 | OK |
| `docs/research/requirements-gaps.md` | Line 17, R2 mapping | **"13 ABI methods"** | 14 total (9 MVP + 5 STRETCH) | **WARNING -- says "13" but total is 14** |
| `docs/research/requirements-gaps.md` | Line 128, C1 conflict | **"8 must-have"** | 9 | **CRITICAL -- stale; the contradiction was resolved but the text was never updated** |
| `docs/research/requirements-gaps.md` | Lines 146-153, classification table | **8 listed as MVP** | 9 (missing `milestone_pay`) | **CRITICAL -- `milestone_pay` not listed as MVP** |
| `docs/00-master-plan.md` | Line 90, Technical Metrics | **"8 ABI methods callable and tested"** | 9 | **CRITICAL -- stale count** |
| `docs/00-master-plan.md` | Line 139, Sprint 1 description | **"8 core methods"** | 9 | **CRITICAL -- stale count** |

### Sprint Count

| File | Section | Stated Sprint Count | Expected | Status |
|------|---------|---------------------|----------|--------|
| `docs/00-master-plan.md` | Lines 136-143, Timeline | **5 sprints (0-4)** | 5 | OK |
| `telemetry.yaml` | Line 42, quality_gate details | **"5 sprints"** | 5 | OK |

### Employee Demo Count

| File | Section | Stated Count | Expected | Status |
|------|---------|--------------|----------|--------|
| `CLAUDE.md` | Line 165 | **3 employees maximum** | 3 | OK |
| `docs/research/ambiguity-resolutions.md` | Line 41, A7 | **3 for demo** | 3 | OK |
| `docs/research/ambiguity-resolutions.md` | Line 71, G5 batch | **"up to 3 employees"** | 3 | OK |

### Token Decimals

| File | Section | Stated Decimals | Expected | Status |
|------|---------|-----------------|----------|--------|
| `CLAUDE.md` | Line 156 | **6 decimals** | 6 | OK |
| `CLAUDE.md` | Line 609, Python constants | **6** | 6 | OK |
| `CLAUDE.md` | Line 619, TypeScript constants | **6** | 6 | OK |
| `docs/research/requirements-gaps.md` | Line 16, R1 mapping | **6 decimals** | 6 | OK |

### Total FR Count (MVP + STRETCH)

| File | Section | MVP | STRETCH | Total | Expected MVP | Expected STRETCH | Expected Total | Status |
|------|---------|-----|---------|-------|-------------|-----------------|---------------|--------|
| `docs/research/requirements-gaps.md` | Line 327 | 33 | 10 | 43 | 39 | 8 | 47 | **CRITICAL -- all three counts stale** |
| `docs/research/ambiguity-resolutions.md` | Line 164 | 39 | 8 | 47 | 39 | 8 | 47 | OK |
| `docs/00-master-plan.md` | Line 36 | 39 | (implied 8) | (implied 47) | 39 | 8 | 47 | OK |

### Growth/STRETCH FR Count

| File | Section | Stated | Expected | Status |
|------|---------|--------|----------|--------|
| `docs/00-master-plan.md` | Line 52, "Growth" | **8 FRs** | 8 | OK |
| `docs/research/requirements-gaps.md` | Line 327 | **10 STRETCH** | 8 | **CRITICAL -- stale count (pre-ambiguity-resolution)** |

---

## 3. FEATURE CONSISTENCY

### 9 MVP Methods Across All Docs

| Method | CLAUDE.md | master-plan | ambiguity-resolutions | requirements-gaps | Status |
|--------|-----------|-------------|----------------------|-------------------|--------|
| `create(asset)` | Line 136 | Line 37 | Line 99 | Line 146 (MVP) | OK |
| `opt_in_asset()` | Line 137 | Line 37 | Line 100 | Line 147 (MVP) | OK |
| `fund(axfer)` | Line 138 | Line 37 | Line 101 | Line 148 (MVP) | OK |
| `register_employee(account, rate)` | Line 139 | Line 37 | Line 102 | Line 149 (MVP) | OK |
| `withdraw()` | Line 140 | Line 37 | Line 103 | Line 150 (MVP) | OK |
| `get_accrued(account)` | Line 141 | Line 37 | Line 104 | Line 151 (MVP) | OK |
| `update_rate(account, new_rate)` | Line 142 | Line 37 | Line 105 | Line 152 (MVP) | OK |
| `pause_stream(account)` | Line 143 | Line 37 | Line 106 | Line 153 (MVP) | OK |
| `milestone_pay(employee, amount)` | Line 144 | Line 37 | Line 107 | **NOT listed as MVP** | **CRITICAL** |

### milestone_pay MVP Status

| File | Section | Listed as MVP? | Status |
|------|---------|---------------|--------|
| `CLAUDE.md` | Line 133-144 | Yes (under "MVP Methods (9)") | OK |
| `docs/00-master-plan.md` | Line 37 | Yes (listed in 9 methods) | OK |
| `docs/research/ambiguity-resolutions.md` | Line 11-13, A1 | Yes ("INCLUDED IN MVP") | OK |
| `docs/research/requirements-gaps.md` | Lines 146-158 | **No -- not in the MVP classification table at all** | **CRITICAL** |
| `docs/research/requirements-gaps.md` | Line 160 | **Listed as STRETCH: "Milestone-based streaming"** | **CRITICAL -- should be MVP** |

### STRETCH Methods Consistency

| Method | CLAUDE.md | master-plan | ambiguity-resolutions | requirements-gaps | Status |
|--------|-----------|-------------|----------------------|-------------------|--------|
| `resume_stream(account)` | Line 149 | Line 53 | Line 109 | Line 154 (STRETCH) | OK |
| `remove_employee(account)` | Line 150 | Line 54 | Line 109 | Line 155 (STRETCH) | OK |
| `pause_all()` | Line 151 | Line 55 | Line 109 | Line 156 (STRETCH) | OK |
| `resume_all()` | Line 152 | Line 55 | Line 109 | Line 157 (STRETCH) | OK |
| `drain_funds()` | Line 153 | Line 56 | Line 109 | Line 158 (STRETCH) | OK |

### Wallet Strategy

| File | Section | Description | Status |
|------|---------|-------------|--------|
| `CLAUDE.md` | Line 166 | "KMD for LocalNet, Pera Wallet for Testnet (via @txnlab/use-wallet-react)" | OK |
| `docs/00-master-plan.md` | Line 46 | "LocalNet uses KMD signing (no wallet app needed), Testnet uses Pera Wallet" | OK |
| `docs/research/ambiguity-resolutions.md` | Lines 129-139, C4 | Detailed KMD/Pera resolution via @txnlab/use-wallet-react | OK |
| `docs/research/requirements-gaps.md` | Line 131, C4 | "For LocalNet dev, use KMD-based signing ... Switch to Pera for Testnet" | OK |

### PAYUSD Description

| File | Section | Description | Status |
|------|---------|-------------|--------|
| `CLAUDE.md` | Line 162 | "PAYUSD is analogous to USDT -- display as '$' in UI (1 PAYUSD = $1.00)" | OK |
| `docs/00-master-plan.md` | Line 38 | "PAYUSD token (analogous to USDT, 1 PAYUSD = $1)" | OK |
| `docs/research/ambiguity-resolutions.md` | Line 25, A4 | "Display as '$' in the UI. 1 PAYUSD = $1.00" | OK |
| `docs/research/requirements-gaps.md` | Line 16, R1 | "AlgoFlow USD (PAYUSD), 6 decimals" | OK |
| `telemetry.yaml` | Line 96-98, DEC-012 | "PAYUSD displayed as stablecoin analog ($1 = 1 PAYUSD, like USDT)" | OK |

### Timezone Handling

| File | Section | Description | Status |
|------|---------|-------------|--------|
| `CLAUDE.md` | Line 164 | "All displayed timestamps converted from UTC to browser local timezone" | OK |
| `docs/00-master-plan.md` | Line 45 | "Contract uses UTC. Frontend detects browser timezone, converts all displayed times to local time." | OK |
| `docs/research/ambiguity-resolutions.md` | Lines 51-58, A10 | Full timezone implementation spec | OK |

### Frontend Routes

| File | Section | Routes Listed | Status |
|------|---------|--------------|--------|
| `CLAUDE.md` | N/A | Not explicitly listed as routes | INFO |
| `docs/00-master-plan.md` | Lines 40-42 | `/employer`, `/employee`, `/` (landing) | OK |
| `docs/research/ambiguity-resolutions.md` | Line 115, C2 | `/` (landing/home), `/employer`, `/employee` | OK |

---

## 4. DECISION CONSISTENCY

### Telemetry Decisions vs Other Docs

| Decision ID | telemetry.yaml | master-plan | CLAUDE.md | Status |
|------------|----------------|-------------|-----------|--------|
| DEC-001 | Algorand Python (algopy) | Line 150, DEC-001: same | Line 103 | OK |
| DEC-002 | AlgoKit CLI | Line 151, DEC-002: same | Line 10 | OK |
| DEC-003 | React 19 + Vite + Tailwind | Line 152, DEC-003: same | Line 12-13 | OK |
| DEC-004 | Frontend after contract | Line 153, DEC-004: same | N/A | OK |
| DEC-005 | Renamed from PayStream to AlgoFlow | Line 154, DEC-005: same | Line 1 (AlgoFlow) | OK |
| DEC-006 | Two separate dashboards | Line 155, DEC-006: same | Lines 62-63 | OK |
| DEC-007 | Dark theme, AlgoGate aesthetic | Line 156, DEC-007: same | Lines 186-210 | OK |
| DEC-008 | Automated demo fallback | Line 157, DEC-008: same | Line 48 (master-plan) | OK |
| DEC-009 | Rekeying as bombshell feature | Line 158 (master-plan), telemetry lines 118-123 | Line 109 (CLAUDE.md) | OK |
| DEC-010 | LocalNet dev, Testnet demo | Line 159 (master-plan), telemetry lines 124-129 | Line 166 (CLAUDE.md) | OK |
| DEC-011 | milestone_pay in MVP | telemetry lines 88-93 | CLAUDE.md line 144, master-plan line 37 | OK |
| DEC-012 | PAYUSD as stablecoin | telemetry lines 95-98 | CLAUDE.md line 162 | OK |
| DEC-013 | KMD + Pera via @txnlab | telemetry lines 100-105 | CLAUDE.md line 166 | OK |
| DEC-014 | Timezone handling | telemetry lines 107-110 | CLAUDE.md line 164 | OK |
| DEC-015 | Multi-unit rate display | telemetry lines 112-117 | CLAUDE.md line 163 | OK |

### Contradictions Between Docs

| Contradiction | Location A | Location B | Severity |
|--------------|-----------|-----------|----------|
| MVP method count: "8" vs "9" | `requirements-gaps.md` line 128 ("8 must-have") and line 330 ("8 core methods") | `CLAUDE.md` line 133 ("9"), `ambiguity-resolutions.md` line 13 ("9") | **CRITICAL** |
| MVP FR count: "33" vs "39" | `requirements-gaps.md` lines 124, 327 | `master-plan.md` line 36, `ambiguity-resolutions.md` line 164 | **CRITICAL** |
| ABI method count in Technical Metrics: "8" | `master-plan.md` line 90 | `CLAUDE.md` line 133 ("9 MVP"), `ambiguity-resolutions.md` line 13 | **CRITICAL** |
| Sprint 1 description: "8 core methods" | `master-plan.md` line 139 | `CLAUDE.md` line 133 ("9 MVP") | **CRITICAL** |
| STRETCH FR count: "10" vs "8" | `requirements-gaps.md` line 327 | `ambiguity-resolutions.md` line 164, `master-plan.md` line 52 | **CRITICAL** |
| Total ABI methods: "13" | `requirements-gaps.md` line 17 | Actual total: 14 (9 MVP + 5 STRETCH) | **WARNING** |
| Constraints table: "33 MVP FRs, 10 STRETCH" | `master-plan.md` line 124 | Updated count: 39 MVP, 8 STRETCH | **CRITICAL** |

---

## 5. STALE REFERENCES

| File | Line/Section | Stale Reference | Should Be | Severity |
|------|-------------|-----------------|-----------|----------|
| `telemetry.yaml` | Line 1 | `run_id: "2026-03-23-paystream-planning"` | `"2026-03-23-algoflow-planning"` | WARNING |
| `telemetry.yaml` | Directory path | `orchestrator/runs/2026-03-23-paystream-planning/` | `orchestrator/runs/2026-03-23-algoflow-planning/` | WARNING |
| `CLAUDE.md` | Line 33 | `paystream/` (project structure root) | `algoflow/` (or actual directory name) | WARNING |
| `CLAUDE.md` | Line 622 | `PERA_WALLET_PROJECT_ID = 'paystream'` | `PERA_WALLET_PROJECT_ID = 'algoflow'` | WARNING |
| `requirements-gaps.md` | Line 128 | `"8 must-have contract methods"` | `"9 must-have contract methods"` (milestone_pay added) | CRITICAL |
| `requirements-gaps.md` | Line 330 | `"8 core methods"` | `"9 core methods"` | CRITICAL |
| `requirements-gaps.md` | Line 327 | `33 MVP, 10 STRETCH, 43 total` | `39 MVP, 8 STRETCH, 47 total` | CRITICAL |
| `requirements-gaps.md` | Line 17 | `"13 ABI methods"` | `"14 ABI methods"` (9 MVP + 5 STRETCH) | WARNING |
| `requirements-gaps.md` | Lines 146-158 | `milestone_pay` missing from MVP; listed as STRETCH at line 160 | Add `milestone_pay` to MVP table; remove from STRETCH | CRITICAL |
| `master-plan.md` | Line 90 | `"8 ABI methods callable and tested"` | `"9 ABI methods callable and tested"` | CRITICAL |
| `master-plan.md` | Line 124 | `"33 MVP FRs, 10 STRETCH"` | `"39 MVP FRs, 8 STRETCH"` | CRITICAL |
| `master-plan.md` | Line 139 | `"8 core methods"` | `"9 core methods"` | CRITICAL |
| `telemetry.yaml` | Line 201 | `"8 methods must-have"` in boundary Q&A | Historical record -- reflects what user originally said before milestone_pay was added | INFO (historical) |

---

## Summary of Inconsistencies

| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 10 | Would cause confusion during execution. Developers/agents reading these docs would implement the wrong number of methods, wrong FR count, or miss milestone_pay in MVP. |
| **WARNING** | 5 | Cosmetic or minor naming issues. "PayStream" remnants in IDs and constants. ABI method total off by 1. Should fix to prevent confusion. |
| **INFO** | 2 | Historical records in telemetry (accurately reflect past state) and minor omission of routes in CLAUDE.md. No action required. |
| **TOTAL** | **17** | |

### CRITICAL Issues (10)

1. `requirements-gaps.md` says 33 MVP FRs -- should be 39
2. `requirements-gaps.md` says 10 STRETCH -- should be 8
3. `requirements-gaps.md` says 43 total -- should be 47
4. `requirements-gaps.md` says "8 must-have" methods in C1 -- should be 9
5. `requirements-gaps.md` Critical Path says "8 core methods" -- should be 9
6. `requirements-gaps.md` MVP classification table missing `milestone_pay` as MVP
7. `requirements-gaps.md` lists "Milestone-based streaming" as STRETCH -- should be MVP (per A1 resolution)
8. `master-plan.md` Technical Metrics says "8 ABI methods" -- should be 9
9. `master-plan.md` Constraints table says "33 MVP FRs, 10 STRETCH" -- should be 39 MVP, 8 STRETCH
10. `master-plan.md` Sprint 1 says "8 core methods" -- should be 9

### WARNING Issues (5)

1. `telemetry.yaml` run_id contains "paystream" -- should be "algoflow"
2. `telemetry.yaml` directory name contains "paystream" -- should be "algoflow"
3. `CLAUDE.md` project structure root says `paystream/` -- should be `algoflow/`
4. `CLAUDE.md` Pera project ID constant says `'paystream'` -- should be `'algoflow'`
5. `requirements-gaps.md` R2 mapping says "13 ABI methods" -- should be 14

---

## Fix List

### File 1: `docs/research/requirements-gaps.md`

**Fix 1.1 -- R2 method count (line 17)**
- Old: `13 ABI methods`
- New: `14 ABI methods (9 MVP + 5 STRETCH)`

**Fix 1.2 -- C1 conflict text (line 128)**
- Old: `8 must-have contract methods: create, opt_in_asset, fund, register_employee, withdraw, get_accrued, update_rate, pause_stream.`
- New: `9 must-have contract methods: create, opt_in_asset, fund, register_employee, withdraw, get_accrued, update_rate, pause_stream, milestone_pay.`

**Fix 1.3 -- C1 resolution (line 128)**
- Old: `Classify the extra 5 as STRETCH. The 8 named methods are MVP.`
- New: `Classify the extra 5 as STRETCH. The 9 named methods (including milestone_pay, added per user decision A1) are MVP.`

**Fix 1.4 -- MVP classification table: add milestone_pay (after line 153, before line 154)**
- Add row: `| \`milestone_pay(employee, amount)\` -- one-time milestone payment | MVP | User explicitly included per A1 resolution. Problem statement mentions "milestone-based." |`

**Fix 1.5 -- Move "Milestone-based streaming" from STRETCH to MVP (line 160)**
- Old: `| Milestone-based streaming | STRETCH | Problem statement says "or"; continuous alone satisfies |`
- New: Remove this line entirely (covered by milestone_pay in MVP table above)

**Fix 1.6 -- Critical Path (line 330)**
- Old: `Smart contract with 8 core methods`
- New: `Smart contract with 9 core methods`

**Fix 1.7 -- Summary Statistics (line 327)**
- Old:
```
| **TOTAL** | **33** | **10** | **43** |
```
- New:
```
| **TOTAL** | **39** | **8** | **47** |
```
Note: The per-category breakdown on lines 320-326 also needs updating to reflect the additions from ambiguity-resolutions.md section 4. The correct breakdown is:
- Smart Contract: 11 MVP (+1 milestone_pay, +1 overdraft), 5 STRETCH = 16
- Token / ASA: 4 MVP, 0 STRETCH = 4
- Employer Dashboard: 8 MVP (+1 milestone button, +1 runway indicator), 2 STRETCH = 10
- Employee Dashboard: 5 MVP, 0 STRETCH = 5
- Shared Frontend: 7 MVP (+1 toast, +1 architecture diagram), 0 STRETCH = 7
- DevOps / Demo: 4 MVP (+1 demo reset), 0 STRETCH = 4
- Rekeying: 0 MVP, 1 STRETCH = 1

**Fix 1.8 -- Constraints table reference (line 124)**
- Old: `33 MVP FRs, 10 STRETCH`
- New: `39 MVP FRs, 8 STRETCH`

### File 2: `docs/00-master-plan.md`

**Fix 2.1 -- Technical Metrics (line 90)**
- Old: `8 ABI methods callable and tested`
- New: `9 ABI methods callable and tested`

**Fix 2.2 -- Constraints table (line 124)**
- Old: `33 MVP FRs, 10 STRETCH. No time for perfection.`
- New: `39 MVP FRs, 8 STRETCH. No time for perfection.`

**Fix 2.3 -- Sprint 1 description (line 139)**
- Old: `Smart Contract: 8 core methods, ASA creation, deployment scripts, contract tests`
- New: `Smart Contract: 9 core methods (incl. milestone_pay), ASA creation, deployment scripts, contract tests`

### File 3: `CLAUDE.md`

**Fix 3.1 -- Project structure root (line 33)**
- Old: `paystream/`
- New: `algoflow/`

**Fix 3.2 -- Pera Wallet project ID constant (line 622)**
- Old: `export const PERA_WALLET_PROJECT_ID = 'paystream';`
- New: `export const PERA_WALLET_PROJECT_ID = 'algoflow';`

### File 4: `orchestrator/runs/2026-03-23-paystream-planning/telemetry.yaml`

**Fix 4.1 -- run_id (line 1)**
- Old: `run_id: "2026-03-23-paystream-planning"`
- New: `run_id: "2026-03-23-algoflow-planning"`

**Fix 4.2 -- directory rename**
- Old: `orchestrator/runs/2026-03-23-paystream-planning/`
- New: `orchestrator/runs/2026-03-23-algoflow-planning/`
- Note: This requires renaming the directory AND updating any references to this path in `orchestrator/config.yaml` or other orchestrator files.

### No Changes Required

- `docs/research/ambiguity-resolutions.md` -- Fully consistent with the latest decisions. All counts correct (9 MVP methods, 39 MVP FRs, 8 STRETCH, 47 total).
- `docs/research/market-analysis.md` -- No method counts, FR counts, or naming issues. Uses "AlgoFlow" consistently throughout.

---

## Root Cause Analysis

The stale references share a single root cause: **requirements-gaps.md and the master-plan Constraints/Metrics sections were written BEFORE the ambiguity resolution round (A1-A10, Gap Inclusions).** The ambiguity-resolutions.md file correctly updated all counts, but the updates were NOT propagated back to:

1. `requirements-gaps.md` (still shows pre-resolution counts of 33 MVP / 10 STRETCH / 8 methods)
2. `master-plan.md` Constraints table and Technical Metrics (still shows "33 MVP FRs, 10 STRETCH" and "8 ABI methods")
3. `master-plan.md` Sprint 1 description (still says "8 core methods")

The "PayStream" remnants are from the project's original name before DEC-005 renamed it to AlgoFlow. The run_id and directory were created before the rename and never updated. The `CLAUDE.md` project structure and Pera constant were similarly missed during the rename pass.
