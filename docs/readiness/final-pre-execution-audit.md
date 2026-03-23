# AlgoFlow -- Final Pre-Execution Audit

<!-- Auditor: Claude Opus 4.6 (1M context) -->
<!-- Date: 2026-03-23 -->
<!-- Scope: ALL 10 authoritative files + 5 story files -->

---

## A. CROSS-FILE NUMBER CONSISTENCY

### A1. MVP Contract Methods: Expected 12

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| CLAUDE.md | Line 133, "MVP Methods (12):" | **12** (table lists 12) | OK |
| 00-master-plan.md | Line 74, "12 ABI methods" | **12** | OK |
| 01-prd.md | Line 43, "12 ABI methods" | **12** | OK |
| 02-architecture.md | Line 133, "12 MVP + 2 STRETCH methods" | **12** | OK |
| 02-architecture.md | Line 276, "12 MVP + 2 STRETCH" | **12** | OK |
| sprint-plan.md | Line 43, "all 12 MVP contract methods" | **12** | OK |
| sprint-status.yaml | Line 40, "all 12 MVP contract methods" | **12** | OK |
| SESSION-HANDOFF.md | Line 115, "MVP (P0) 12" | **12** | OK |

**Result: CONSISTENT**

### A2. STRETCH Contract Methods: Expected 2

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| CLAUDE.md | Line 149, "STRETCH Methods (2):" | **2** | OK |
| 00-master-plan.md | Line 135 context (resume_all + drain_funds listed under STRETCH) | **2** methods | OK |
| 02-architecture.md | Line 133, "12 MVP + 2 STRETCH" | **2** | OK |
| SESSION-HANDOFF.md | Line 116, "STRETCH (P1) 2" | **2** | OK |

**Result: CONSISTENT**

### A3. MVP FRs: Expected 42

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| 00-master-plan.md | Line 71, "MVP (Must-Have for Hackathon Demo) -- 42 FRs" | **42** | OK |
| 01-prd.md | Line 41, "MVP Tier -- 42 FRs" | **42** | OK |
| 01-prd.md | Line 365, FR summary table "TOTAL 42" | **42** | OK |
| sprint-plan.md | Line 4, "42 MVP" | **42** | OK |
| sprint-status.yaml | Line 7, "total_mvp_frs: 42" | **42** | OK |
| SESSION-HANDOFF.md | Line 129, "TOTAL 42" | **42** | OK |

**Result: CONSISTENT**

### A4. STRETCH FRs: Expected 5

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| 00-master-plan.md | Line 134, "Growth (Post-Hackathon / Stretch Goals) -- 5 FRs" | **5** | OK |
| 01-prd.md | Line 55, "Growth Tier -- 5 FRs" | **5** | OK |
| 01-prd.md | Line 365, FR summary table "P1 (STRETCH) 5" | **5** | OK |
| sprint-plan.md | Line 4, "5 STRETCH" | **5** | OK |
| sprint-status.yaml | Line 8, "total_stretch_frs: 5" | **5** | OK |
| SESSION-HANDOFF.md | Line 129, "5" | **5** | OK |

**Result: CONSISTENT**

### A5. Total FRs: Expected 47

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| 01-prd.md | Line 371, "TOTAL 47" | **47** | OK |
| sprint-plan.md | Line 4, "47 FRs (42 MVP + 5 STRETCH)" | **47** | OK |
| SESSION-HANDOFF.md | Line 129, "TOTAL 47" | **47** | OK |

**Result: CONSISTENT**

### A6. NFR Count: Expected 22

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| 01-prd.md | Lines 946-1018 (actual NFR definitions counted) | **22** (PERF:5 + SEC:5 + REL:4 + UX:4 + BC:5 + TEST:4 = 27) | **MISMATCH** |
| 01-prd.md | Line 1086, "All 22 NFRs" (validation report) | Claims **22** | INCORRECT |
| 02-architecture.md | Line 212, "(47 FRs, 22 NFRs)" | Claims **22** | INCORRECT |
| SESSION-HANDOFF.md | Line 141, "TOTAL 27" | **27** | CORRECT COUNT |
| telemetry.yaml | Line 75, "22 NFRs" | Claims **22** | INCORRECT |
| readiness-report.md | Line 23, "All 22 NFRs" | Claims **22** | INCORRECT |
| quality-audit.md | Line 74, "All 22 NFRs" | Claims **22** | INCORRECT |

**Result: MISMATCH -- CRITICAL**

When I count the actual NFR IDs in the PRD (lines 946-1018):
- NFR-PERF-001 through NFR-PERF-005 = **5**
- NFR-SEC-001 through NFR-SEC-005 = **5**
- NFR-REL-001 through NFR-REL-004 = **4**
- NFR-UX-001 through NFR-UX-004 = **4**
- NFR-BC-001 through NFR-BC-005 = **5**
- NFR-TEST-001 through NFR-TEST-004 = **4**
- **Actual total: 27 NFRs**

SESSION-HANDOFF.md Section 4 correctly states 27. However, the PRD's own validation report (Appendix A, check 7) and architecture.md, telemetry, readiness report, and quality audit all claim 22. The original count (22) appears to have been from before the BC and TEST categories were finalized. This is a documentation count mismatch -- the actual NFRs are all present (27), but most files say 22.

### A7. Sprint Count: Expected 5 (0-4)

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| sprint-plan.md | Line 4, "5 sprints (0-4)" | **5** | OK |
| sprint-status.yaml | (5 sprint keys: 0-4) | **5** | OK |
| SESSION-HANDOFF.md | Line 147, "Sprints: 5 (Sprint 0 through Sprint 4)" | **5** | OK |
| 00-master-plan.md | Lines 525-531 (5 sprint rows) | **5** | OK |

**Result: CONSISTENT**

### A8. Story Count: Expected 22

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| sprint-plan.md | Line 4, "22 stories" | **22** | OK |
| sprint-plan.md | Line 202, "TOTAL 22" | **22** | OK |
| sprint-status.yaml | Line 6, "total_stories: 22" | **22** | OK |
| SESSION-HANDOFF.md | Line 148, "Total stories: 22" | **22** | OK |

**Result: CONSISTENT**

### A9. Demo Employees: Expected 3

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| CLAUDE.md | Line 165, "Demo configured for 3 employees maximum" | **3** | OK |
| 01-prd.md | Line 681, "3 registered employees (the demo maximum)" | **3** | OK |
| 03-data-model.md | Line 497, "Employee count: 3, Demo maximum" | **3** | OK |
| 04-screen-map.md | Line 188, "max 3 for demo" | **3** | OK |

**Result: CONSISTENT**

### A10. Token Decimals: Expected 6

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| CLAUDE.md | Line 156, "token with 6 decimals" | **6** | OK |
| CLAUDE.md | Line 610, "SALARY_TOKEN_DECIMALS = 6" | **6** | OK |
| 00-master-plan.md | Line 280, "Decimals: 6" | **6** | OK |
| 01-prd.md | Line 582, "6 decimals" | **6** | OK |
| 03-data-model.md | Line 126, "Decimals: 6" | **6** | OK |

**Result: CONSISTENT**

### A11. User Journeys: Expected 8

| File | Location | Value Found | Status |
|------|----------|-------------|--------|
| 01-prd.md | Lines 73-343 (8 journeys: J1-J8) | **8** | OK |
| 01-prd.md | Line 1084, "All 8 user journeys" | **8** | OK |
| telemetry.yaml | Line 75, "8 user journeys" | **8** | OK |
| 04-screen-map.md | Sections 4.1-4.8 (8 flow diagrams) | **8** | OK |

**Result: CONSISTENT**

---

## B. METHOD NAME CONSISTENCY

### 14 Methods (12 MVP + 2 STRETCH)

| # | Method Name | CLAUDE.md | master-plan | PRD | architecture | data-model | sprint-plan | SESSION-HANDOFF |
|---|-------------|-----------|-------------|-----|-------------|------------|-------------|-----------------|
| 1 | `create(asset)` | Line 136 | Line 75 | FR-001 AC | Line 185 | Line 305 | STORY-1-002 | Line 115 |
| 2 | `opt_in_asset()` | Line 137 | Line 76 | FR-002 AC | Line 191 | Line 315 | STORY-1-002 | Line 115 |
| 3 | `fund(axfer)` | Line 138 | Line 77 | FR-003 AC | Line 197 | Line 325 | STORY-1-002 | Line 115 |
| 4 | `register_employee(account, rate)` | Line 139 | Line 78 | FR-004 AC | Line 203 | Line 335 | STORY-1-002 | Line 115 |
| 5 | `withdraw()` | Line 140 | Line 79 | FR-005 AC | Line 210 | Line 346 | STORY-1-003 | Line 115 |
| 6 | `get_accrued(account)` | Line 141 | Line 80 | FR-006 AC | Line 217 | Line 357 | STORY-1-003 | Line 115 |
| 7 | `update_rate(account, new_rate)` | Line 142 | Line 81 | FR-007 AC | Line 223 | Line 368 | STORY-1-004 | Line 115 |
| 8 | `pause_stream(account)` | Line 143 | Line 82 | FR-008 AC | Line 229 | Line 379 | STORY-1-004 | Line 115 |
| 9 | `milestone_pay(employee, amount)` | Line 144 | Line 83 | FR-012 AC | Line 235 | Line 412 | STORY-1-004 | Line 115 |
| 10 | `resume_stream(account)` | Line 145 | Line 84 | FR-009 AC | Line 241 | Line 390 | STORY-1-004 | Line 115 |
| 11 | `remove_employee(account)` | Line 146 | Line 85 | FR-010 AC | Line 247 | Line 401 | STORY-1-004 | Line 115 |
| 12 | `pause_all()` | Line 147 | Line 86 | FR-011 AC | Line 253 | Line 423 | STORY-1-004 | Line 115 |
| 13 | `resume_all()` | Line 152 | Line 135 | FR-015 | Line 433 | Line 433 | STORY-4-004 | Line 116 |
| 14 | `drain_funds()` | Line 153 | Line 136 | FR-016 | Line 443 | Line 443 | STORY-4-004 | Line 116 |

**Parameter signature note**: CLAUDE.md and the master-plan specify `milestone_pay(employee, amount)` while the PRD says `milestone_pay(employee, amount)` -- consistent. The architecture doc uses the same. All parameter names align.

**Result: ALL 14 METHOD NAMES CONSISTENT across all 7 files.**

---

## C. COMPONENT NAME CONSISTENCY

| Component | CLAUDE.md | master-plan | architecture.md | screen-map | sprint stories |
|-----------|-----------|-------------|----------------|------------|----------------|
| EmployerDashboard.tsx | Line 63 | Line 317 | Line 169, 453 | Line 135 | STORY-2-004 |
| EmployeeDashboard.tsx | Line 62 | Line 326 | Line 179, 467 | Line 220 | STORY-3-002 |
| StreamCounter.tsx | Line 61 | Line 330 | Line 180, 469 | Line 246 | STORY-3-001 |
| SpotlightCard.tsx | Line 56 | Line 335 | Line 188 | Line 520 | STORY-4-002 |
| ShinyText.tsx | Line 58 | Line 337 | Line 190 | Line 521 | STORY-4-002 |
| Silk.tsx | Line 60 | Line 339 | Line 192 | Line 94 | STORY-4-002 |
| WalletConnect.tsx | Line 65 | Line 333 | Line 186 | Line 102 | STORY-2-002 |
| TransactionHistory.tsx | Line 64 | Line 331 | Line 184 | Line 279 | STORY-3-002 |

**CLAUDE.md component list**: Lists 10 components in the project structure (simplified). Architecture.md lists 25+ components. SESSION-HANDOFF.md Line 278 explicitly notes: "02-architecture.md is the authoritative component list (25+ components). CLAUDE.md lists only 10 (simplified overview)." This is correctly documented.

**Extra components in architecture.md not in CLAUDE.md**: Landing.tsx, HowItWorks.tsx, RoleSelector.tsx, SetupChecklist.tsx, ContractHealth.tsx, EmployeeList.tsx, EmployeeRow.tsx, RegisterForm.tsx, FundForm.tsx, MilestonePayForm.tsx, EmergencyControls.tsx, WithdrawButton.tsx, RateDisplay.tsx, StatusBadge.tsx, NetworkBadge.tsx, Toast.tsx, ExplorerLink.tsx, LoadingSkeleton.tsx, useContractState.ts. All exist consistently in architecture.md AND screen-map.

**Panel vs Dashboard**: The old EmployeePanel/EmployerPanel names exist ONLY in `docs/research/requirements-gaps.md` (line 21, pre-rename artifact) and `docs/research/final-consistency-audit.md` (which flagged the issue). The authoritative files (CLAUDE.md, master-plan, architecture, screen-map, sprint-plan, stories) ALL use "Dashboard". The research artifacts correctly identified this as a historical issue.

**Result: CONSISTENT across authoritative files. Research artifacts have stale "Panel" references but are correctly flagged.**

---

## D. FR-ID CONSISTENCY

I verified all 47 FR-IDs across the PRD, sprint-plan FR coverage matrix, sprint-status.yaml story FR lists, and screen-map FR references.

### FR-ID Validation

| FR Range | PRD Defined | Sprint-Plan Coverage | Sprint-Status Referenced | Screen-Map Referenced |
|----------|-------------|---------------------|-------------------------|----------------------|
| FR-CONTRACT-001 to 014 | All 14 defined | All mapped | All referenced | Yes |
| FR-CONTRACT-015 to 017 | All 3 defined (STRETCH) | STORY-4-004 | STORY-4-004 | N/A (STRETCH) |
| FR-TOKEN-001 to 004 | All 4 defined | All mapped | All referenced | Yes |
| FR-EMPLOYER-001 to 009 | All 9 defined | All mapped | All referenced | Yes |
| FR-EMPLOYER-010 | Defined (STRETCH) | STORY-4-004 | STORY-4-004 | N/A |
| FR-EMPLOYEE-001 to 005 | All 5 defined | All mapped | All referenced | Yes |
| FR-SHARED-001 to 007 | All 7 defined | All mapped | All referenced* | Yes |
| FR-DEVOPS-001 to 003 | All 3 defined | All mapped | All referenced | N/A |
| FR-DEVOPS-004 | Defined (STRETCH) | STORY-4-004 | STORY-4-004 | N/A |

*Note on FR-SHARED-007: Sprint-plan coverage matrix assigns it to STORY-4-002 (Sprint 4). Sprint-status.yaml assigns it to STORY-4-002. However, the SESSION-HANDOFF notes (line 562) that it is "split across Sprint 3 + Sprint 4" -- Sprint 3 does foundational dark theme, Sprint 4 does the polish effects. Sprint-status for sprint-3 stories does NOT include FR-SHARED-007 in their frs lists, which is correct per the plan (Sprint 3 stories handle it implicitly through general styling, Sprint 4 STORY-4-002 formally covers it).

**No phantom FRs found. No typos in FR-IDs. No missing references.**

**Result: CONSISTENT**

---

## E. STALE/OUTDATED CONTENT

### E1. "PayStream" / "paystream" references

| File | Location | Context | Severity |
|------|----------|---------|----------|
| telemetry.yaml | Lines 190, 192, 322, 325 | Historical decision records and boundary Q&A about the rename | **OK** -- properly annotated as historical |
| docs/research/docs-sync-audit.md | Multiple lines | References to the old "paystream" naming as issues that were resolved | **OK** -- audit artifact documenting the fix |
| docs/research/final-consistency-audit.md | Multiple lines | References to running-summary.md containing stale "PayStream" | **WARNING** -- indicates `running-summary.md` may still have stale references |

### E2. "8 methods" / "9 methods" / stale counts

| File | Location | Context | Severity |
|------|----------|---------|----------|
| telemetry.yaml | Lines 164, 325 | Historical boundary Q&A annotated with `[HISTORICAL]` tag | **OK** -- properly annotated |
| docs/research/docs-sync-audit.md | Lines 59, 61, 130 | **Targets 9 methods as the "expected" count** instead of 12 | **WARNING** -- stale research artifact |
| docs/research/ambiguity-resolutions.md | Lines 98-107, 170-181 | **Lists 9 MVP methods, not 12** (per final-consistency-audit.md findings) | **WARNING** -- stale research artifact |
| docs/research/requirements-gaps.md | Line 365 | "still shows pre-resolution counts of 33 MVP / 10 STRETCH / 8 methods" | **WARNING** -- stale research artifact |

### E3. "EmployeePanel" / "EmployerPanel"

| File | Location | Context | Severity |
|------|----------|---------|----------|
| docs/research/requirements-gaps.md | Line 21 | Uses "EmployerPanel.tsx" and "EmployeePanel.tsx" | **INFO** -- research artifact predating the rename |

### E4. "paystream:" note prefix

No instances found in any authoritative file. All files use "algoflow:". **OK.**

### E5. TODO / TBD / FIXME / PLACEHOLDER

| File | Location | Content | Severity |
|------|----------|---------|----------|
| docs/00-master-plan.md | Line 592 | "Exact flow TBD during Sprint 4 if time permits" (rekeying STRETCH) | **INFO** -- STRETCH feature, appropriately marked as TBD |
| docs/research/market-analysis.md | Line 258 | "Custom Curves ... TBD" | **INFO** -- competitive analysis table, not a project requirement |

All other "placeholder" and "TODO" hits are false positives referring to UI placeholder text, HTML placeholder attributes, or LoadingSkeleton component descriptions.

**Result: No stale content in authoritative files. Research artifacts have known stale counts but these are Tier 4 (read only if needed for context).**

---

## F. CONTRADICTIONS

### F1. NFR Count: 22 vs 27

**SESSION-HANDOFF.md** (Section 4, line 141) correctly states NFR total = **27** broken down as PERF:5, SEC:5, REL:4, UX:4, BC:5, TEST:4.

**01-prd.md** (validation report, line 1086) claims **22 NFRs**. The actual PRD defines 27 NFRs.

**02-architecture.md** (line 212) says "(47 FRs, 22 NFRs)".

**Telemetry.yaml** (line 75) says "22 NFRs".

This contradiction exists because the original NFR count was 22 before the BC (5) and TEST (4) categories were finalized. The SESSION-HANDOFF.md correctly updated to 27, but the PRD's self-validation report and several other files still claim 22.

**Severity: WARNING** -- The actual NFRs are all present and correct in the PRD. Only the stated count is wrong. An implementing agent counting NFRs might be confused, but the NFRs themselves are complete.

### F2. DevOps FR Count in MVP scope headers

**00-master-plan.md** (line 123): "DevOps / Demo (4 FRs)" listed under the **MVP** section heading.

**01-prd.md** (line 53): "DevOps / Demo (3 FRs)" in the MVP scope summary.

The PRD merged demo + reset into one FR (FR-DEVOPS-003) and classified rekeying as STRETCH (FR-DEVOPS-004). The master plan's section header counts 4 FRs under MVP, which is technically 3 MVP + 1 STRETCH. The overall totals (42 MVP, 47 total) remain correct across all files.

**Severity: WARNING** -- Misleading section header, but totals reconcile.

### F3. Architecture schema says "5 uints, 0 byte-slices" for global state

**02-architecture.md** (lines 302-303): "Global schema: 5 uints, 0 byte-slices" and "Local schema: 5 uints, 0 byte-slices".

But the `employer` global state key is an Account (byte-slice, 32 bytes), and `salary_asset` is an Asset reference. In Algorand Python (algopy), `Account` and `Asset` type declarations may compile differently than raw UInt64/bytes. The data-model.md (line 24) correctly notes employer as "Account (byte-slice)" and salary_asset as "Asset (uint64)".

The schema allocation declaration should be: **4 uints + 1 byte-slice** for global, not "5 uints, 0 byte-slices". The actual state usage is described correctly elsewhere in the same file (lines 284-299), but the summary schema allocation on lines 302-303 contradicts it.

**Severity: WARNING** -- An implementing agent using lines 302-303 to set the deployment schema would allocate 0 byte-slice slots, causing the `employer` Account to fail to store. The correct deployment schema must include at least 1 byte-slice slot.

### F4. CLAUDE.md project structure vs architecture.md component list

CLAUDE.md lists ~10 components in its project structure tree. Architecture.md lists 25+. SESSION-HANDOFF.md (line 278) explicitly documents this discrepancy and declares architecture.md as authoritative. **Not a contradiction -- properly documented as intentional simplification.**

### F5. NFR-BC-005 vs architecture opcode budget table

**NFR-BC-005** (PRD line 1006): "Each individual contract method call shall execute within the base opcode budget of 700 units."

**02-architecture.md** (data-model.md, lines 230-246): The opcode budget table shows `withdraw()` at ~900, `update_rate()` at ~950, `pause_stream()` at ~900, `remove_employee()` at ~950, `milestone_pay()` at ~850 -- all ABOVE 700 because they include inner transaction costs (700 per inner txn).

This is a contradiction. Methods with inner transactions will exceed 700 base budget and require fee pooling (the outer transaction fee must cover inner transaction fees). The NFR as written is technically unachievable for methods that issue inner transactions.

**Severity: WARNING** -- The NFR should be "within the base opcode budget of 700 units per method logic, excluding inner transaction overhead" or should acknowledge that inner-transaction methods require pooled budget. As written, it will fail pytest verification for 5 of 12 methods.

---

## G. AMBIGUITIES AND GREY AREAS

### G1. Employee opt-in ordering

The PRD (FR-TOKEN-003, FR-TOKEN-004) describes ASA opt-in and app opt-in as separate steps. The screen-map shows them sequentially in the onboarding card. However, no document specifies whether the ordering is enforced (ASA first, then app) or whether either order works. In practice, Algorand allows either order, but the contract's `register_employee` requires the app opt-in to exist (local state allocation). The ASA opt-in is needed before the contract can send tokens to the employee.

**Severity: INFO** -- Both orderings work. The UI presents ASA first, then app, which is a fine UX choice.

### G2. What happens when withdraw() is called with 0 accrual?

FR-CONTRACT-005 AC2 says: "accrued amount is less than 1000 base units (0.001 PAYUSD minimum withdrawal), the transaction is rejected or returns 0." The "or returns 0" creates ambiguity -- does the contract reject (assert failure) or succeed with a 0 return? This affects the frontend's handling.

**Severity: INFO** -- The implementing agent should pick one behavior (assert rejection is safer) and document the choice.

### G3. update_rate on a paused employee

FR-CONTRACT-007 AC4 says: "Given an employee who is paused, When the employer calls update_rate, Then the rate is updated without settlement and the stream remains paused."

But the data-model.md (line 596) says: "PAUSED + update_rate -> PAUSED: Rate changed; no settlement (no accrual while paused)."

However, `last_withdrawal` is not mentioned as being reset for paused employees during rate update. If `last_withdrawal` is NOT reset and the employee is later resumed, the accrual formula `rate * (now - last_withdrawal) / 3600` would calculate based on the old `last_withdrawal`, which could produce a large erroneous accrual at the new rate for time the employee was paused.

**Severity: WARNING** -- The implementing agent must ensure that `last_withdrawal` is reset to `now` on resume (which it is, per FR-CONTRACT-009 AC1), but the gap is the time between `update_rate` (paused) and `resume_stream`. If `update_rate` does not touch `last_withdrawal` while paused, and `resume_stream` resets it to `now`, then the behavior is correct. However, this multi-step interaction is not explicitly tested in any story's acceptance criteria.

### G4. Batch registration limit

CLAUDE.md (line 295): "Atomic group size: 16 transactions. Batch register up to 3 employees."

The 3-employee limit is a demo constraint, not a protocol constraint. The contract itself could handle up to ~15 registrations in an atomic group. No document clarifies whether the frontend should hard-limit to 3 or allow more.

**Severity: INFO** -- Demo is capped at 3. The frontend's RegisterForm batch mode shows 3 slots (per screen-map line 182). This is sufficient.

### G5. FR-SHARED-007 scope split

FR-SHARED-007 covers dark theme + glassmorphism + spotlight + shimmer + Silk + timezone conversion. The sprint plan assigns the primary implementation to STORY-4-002 (Sprint 4). However, SESSION-HANDOFF.md notes it is "split across Sprint 3 + Sprint 4." The exact split (what goes in Sprint 3 vs Sprint 4) is documented in the handoff but not in the PRD or sprint-plan.md.

**Severity: INFO** -- SESSION-HANDOFF.md clarifies the split. Implementing agents should follow the handoff instructions.

---

## H. SILENT FAILURE POINTS

### H1. MBR not funded before contract opt-in

If the contract account does not have sufficient ALGO for the minimum balance requirement before `opt_in_asset()` is called, the inner ASA opt-in transaction will fail. The contract's `opt_in_asset()` method does not check ALGO balance -- it just issues the inner transaction, which will be rejected by the protocol.

**Mitigation documented**: Data-model.md (line 196) recommends "Send at least 1 ALGO to the contract account." The deployment script (FR-DEVOPS-001) should handle this, and the setup checklist (FR-EMPLOYER-009) will guide the employer. But no explicit check exists in the contract itself.

**Severity: WARNING** -- The deploy script must fund the contract with ALGO before the employer calls `opt_in_asset()`. This sequencing is implicit but not enforced.

### H2. Employee not opted into ASA before registration

FR-CONTRACT-004 AC2 says registration is rejected if the employee hasn't opted into the app. But the contract cannot directly check whether an employee has opted into the ASA (that's a ledger-level property, not app state). If the employer registers an employee who hasn't opted into the PAYUSD ASA, the registration will succeed, but the first `withdraw()` will fail because the inner AssetTransfer to a non-opted-in account is rejected by the protocol.

**Mitigation**: FR-TOKEN-003 and the employee onboarding flow in the screen-map ensure employees opt into the ASA before the employer registers them. The frontend should validate ASA opt-in status before allowing registration.

**Severity: WARNING** -- The contract cannot enforce ASA opt-in. The frontend must check this. If the frontend fails to check, withdrawals will silently fail until the employee opts in.

### H3. Inner transaction fee not covered

Methods that issue inner transactions (withdraw, update_rate, pause_stream, remove_employee, milestone_pay, opt_in_asset) require the outer transaction fee to be high enough to cover the inner transaction fee (0.001 ALGO per inner txn). If the caller sets the fee to the default 0.001 ALGO (just the outer fee), the inner transaction will fail due to insufficient fee budget.

**Mitigation documented**: Architecture.md (line 407) and data-model.md (line 247) both document this requirement: "The caller must set fee = 0.002 ALGO (outer + 1 inner) or use fee pooling." The frontend's `usePayrollContract` hook must set `fee = 2000` (microALGO) for these methods.

**Severity: WARNING** -- This is a common Algorand development pitfall. The frontend hook must handle this correctly.

### H4. Integer overflow in accrual calculation

The formula `salary_rate * (current_timestamp - last_withdrawal)` could overflow UInt64 if the rate is very large or the elapsed time is very long. With a rate of 100,000,000 ($100/hr) and elapsed time of 1,000,000 seconds (~11.5 days), the multiplication produces 100,000,000,000,000,000 which is within UInt64 range (max ~1.8e19). Even at the extreme ($18B/hr for 11 days), overflow won't occur in practice.

**Severity: INFO** -- Not a practical concern for this project's demo scale.

### H5. Race condition: concurrent withdraw and update_rate

FR-CONTRACT-007 AC2 acknowledges this: "Given an active employee, When the employer updates the rate and a concurrent withdraw() from that employee is submitted in the same round, Then the contract handles both operations without double-payment." Since Algorand transactions within the same block are ordered by the proposer, one will execute before the other. Both `withdraw()` and `update_rate()` reset `last_withdrawal`, so whichever executes second will find 0 accrual. This is safe.

**Severity: INFO** -- Algorand's block ordering prevents true races. Both outcomes are correct.

---

## I. SESSION HANDOFF COMPLETENESS

### Checklist

| Required Element | Present? | Location | Notes |
|-----------------|----------|----------|-------|
| All files to read listed | Yes | Section 3, Tiers 1-4 | 44 files listed with line counts |
| Correct current state numbers | Mostly | Section 4 | NFR count says 27 (correct), but other docs say 22 |
| Sprint sequence explained | Yes | Section 5 | All 5 sprints summarized |
| Startup instructions | Yes | Section 10 | 32-step execution sequence |
| Hard gates defined | Yes | Section 10, "Hard Gates" | 6 gates (G1-G6) |
| Environment prerequisites | Yes | Section 10, "Environment Prerequisites" | Python, Node, AlgoKit, Docker verified |
| Status update protocol | Yes | Section 10, "Sprint Status Update Protocol" | After each story and sprint |
| Key conventions extracted | Yes | Section 7 | Contract, SDK, React, file naming, PAYUSD display |
| Risks listed | Yes | Section 9 | Top 5 + 5 additional |
| Decisions listed | Yes | Section 8 | All 18 decisions |
| Important reminders | Yes | End of document | 10 numbered reminders |

### What is MISSING

1. **No mention of `useContractState.ts` hook** in CLAUDE.md project structure, but it IS in architecture.md. The handoff notes CLAUDE.md is simplified, but the executor might create `usePayrollContract.ts` without `useContractState.ts` if they only read CLAUDE.md. The handoff correctly instructs reading architecture.md.

2. **No explicit mention of `scripts/reset.py`** in CLAUDE.md project structure (line 49 lists `demo.py` but not `reset.py`). Architecture.md (line 150) includes it. The handoff's Sprint 3 story list includes STORY-3-005 which covers the reset script.

3. **The learning-log.md reference** in CLAUDE.md (line 262) says to read it at session start, but the SESSION-HANDOFF.md Section 10 startup instructions do not include reading `orchestrator/learning-log.md` in the mandatory context loading steps. This is a minor gap since the learning log may be empty at planning completion.

4. **NFR-BC-005 contradiction** (700 opcode budget) is not flagged in the handoff. An implementing agent will discover this when methods with inner transactions exceed 700.

---

## SUMMARY

### Total Issues by Severity

| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 1 | NFR count mismatch: multiple files claim 22 NFRs, actual count is 27 |
| **WARNING** | 7 | DevOps FR header misleading; schema allocation says "0 byte-slices" (should be 1); NFR-BC-005 contradicts opcode budget table; MBR funding sequencing; ASA opt-in not enforceable in contract; inner txn fee requirement; update_rate on paused employee last_withdrawal gap |
| **INFO** | 6 | Stale research artifacts with old counts; TBD for STRETCH rekeying; employee opt-in ordering; withdraw(0) behavior; batch limit; FR-SHARED-007 scope split |

### Fix List

#### CRITICAL Fixes

**C1. NFR count mismatch** -- The authoritative PRD contains 27 NFRs but multiple files state 22.

Files to fix:
- `docs/01-prd.md` line 1086: Change "All 22 NFRs" to "All 27 NFRs"
- `docs/02-architecture.md` line 212: Change "(47 FRs, 22 NFRs)" to "(47 FRs, 27 NFRs)"

The following are Tier 4 (research/historical) files and do not need fixing:
- telemetry.yaml line 75 (historical record of P1 gate pass)
- readiness-report.md line 23 (historical audit)
- quality-audit.md lines 74, 106 (historical audit)

#### WARNING Fixes

**W1. Master plan DevOps header**
- `docs/00-master-plan.md` line 123: Change "#### DevOps / Demo (4 FRs)" to "#### DevOps / Demo (3 MVP FRs + 1 STRETCH FR)"

**W2. Architecture schema allocation**
- `docs/02-architecture.md` lines 302-303: Change "Global schema: 5 uints, 0 byte-slices" to "Global schema: 4 uints, 1 byte-slice" (employer is Account/byte-slice)

**W3. NFR-BC-005 opcode budget**
- `docs/01-prd.md` line 1006: Change "Each individual contract method call shall execute within the base opcode budget of 700 units without requiring OpUp budget pooling" to "Each individual contract method call's logic (excluding inner transaction overhead) shall execute within the base opcode budget of 700 units. Methods issuing inner transactions require fee pooling in the outer transaction to cover inner transaction costs."
- Also fix in `docs/prd-sections/non-functional-requirements.md` line 78 (same text).

**W4-W7** are implementation-aware warnings (MBR sequencing, ASA opt-in validation, inner txn fees, paused update_rate + resume interaction). These do not require document text changes but should be noted by the implementing agent. They are adequately documented across architecture.md and data-model.md but lack explicit test coverage in story acceptance criteria.

---

## VERDICT: **CONDITIONAL PASS**

The planning artifacts are comprehensive, well-structured, and internally consistent on all critical dimensions (method names, FR-IDs, story assignments, sprint structure, component names). The 1 CRITICAL issue (NFR count) is a documentation count error, not a missing requirement -- all 27 NFRs are fully defined. The 7 WARNING issues are either documentation imprecision or implementation-aware edge cases that are mitigated by the detailed architecture and data model docs.

**Conditions for PASS**:
1. Fix C1 (NFR count) in the PRD validation report and architecture.md
2. Fix W2 (schema allocation) in architecture.md -- this will cause a deployment failure if uncorrected
3. The implementing agent must be aware of W3 (opcode budget) and W4-W7 (inner txn fees, MBR sequencing, ASA opt-in enforcement)

Once C1 and W2 are corrected, the project is **READY FOR EXECUTION**.
