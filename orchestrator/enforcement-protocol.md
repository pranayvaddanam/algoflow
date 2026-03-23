# Maestro Enforcement Protocol v2.0

<!-- This document is MANDATORY reading for every executor session -->
<!-- Created: 2026-03-24 after Sprint 3 post-mortem -->
<!-- Updated: v2.0 — added health checks, multi-perspective analysis, attention re-anchoring -->
<!-- Triggered by: AP-011 wave consolidation violation, event log degradation, urgency bias -->

---

## 0. CORE VALUES (Read Before Every Sprint, Every Wave)

**The executor's priority ordering is NON-NEGOTIABLE:**

```
1. PROCESS ADHERENCE — logging, gates, checkpoints, agreed structure
2. RULE COMPLIANCE — wave count contract, audit thoroughness, enforcement gates
3. QUALITY — correctness, completeness, robustness
4. THOROUGHNESS — audits, edge cases, verification
5. SPEED — LAST CONCERN. Never skip process to save time.
```

**Speed is not a value. Thoroughness is.** If a logging step takes 5 minutes, take it. If a wave checkpoint takes 100 lines, write them. If an audit finds nothing but you haven't checked all 14 keywords, keep checking. NEVER optimize for speed at the expense of process.

**Cost is not a constraint.** Token usage, agent count, and compute time are irrelevant. The user has explicitly stated this. Do not internalize "efficiency" as a goal.

### Attention Re-Anchoring Rule (CRITICAL — fixes systemic degradation)

As the session progresses and code output grows, process rules lose relative attention weight. To counter this:

**Before EVERY wave spawn, the executor MUST re-read this Section 0 and verbally confirm:**
> "Process > Rules > Quality > Thoroughness > Speed. Logging this wave fully."

This is logged to the event log:
```json
{"ts":"...","event":"values_reanchor","wave":M,"confirmed":true}
```

If this event is missing for any wave, the Sprint Completion Gate FAILS.

---

## 1. MANDATORY HARD GATES (System Will Not Proceed Without These)

The Maestro system has 5 hard gates. Each gate is a BLOCKING checkpoint.
The executor CANNOT advance past a gate without completing ALL items.
There are NO exceptions. There are NO "do it later" options.

### Gate Map (execution order)

```
SPRINT START
    │
    ▼
[GATE A: Sprint Entry] ──── Must pass before ANY wave starts
    │
    ▼
[GATE B: Pre-Wave] ──────── Must pass before EACH agent spawns
    │
    ▼
  Agent runs...
    │
    ▼
[GATE C: Post-Wave] ─────── Must pass after EACH wave completes
    │
    ▼
  Next wave (repeat B→C) or...
    │
    ▼
[GATE D: Sprint Exit] ───── Must pass before sprint marked "done"
    │
    ▼
[GATE E: Health Verify] ──── Must pass before proceeding to next sprint
```

### GATE A: Sprint Entry Gate

Before the first wave of any sprint, verify ALL:
```
GATE A — Sprint {N} Entry
==========================
A1. [ ] Enforcement protocol read (this file, fully)
A2. [ ] Core values stated: "Process > Rules > Quality > Thoroughness > Speed"
A3. [ ] Wave plan agreed with user (exact wave count + story assignments)
A4. [ ] Sprint event log created (sprint_started event written)
A5. [ ] Prior sprint drift score reviewed (if not Sprint 0)
A6. [ ] All prior sprint stories verified "done" in sprint-status.yaml
A7. [ ] Git working tree clean

PASS: ALL 7 checked → proceed to Gate B for Wave 1
FAIL: ANY unchecked → STOP. Do not start sprint.
```

### GATE B: Pre-Wave Gate

Before spawning EACH wave agent:
```
GATE B — Wave {M}, Sprint {N}
===============================
1. [ ] Wave number matches user-approved plan
       Planned wave count for this sprint: ___
       Current wave number: ___
       MATCH: yes/no
       IF NO → STOP. Ask user before proceeding.

2. [ ] Story assignment matches plan
       Stories assigned to this wave: [list]
       Stories in approved plan for this wave: [list]
       MATCH: yes/no
       IF NO → STOP. Ask user before proceeding.

3. [ ] Logged to drift-log.jsonl:
       {"ts":"...","sprint":N,"type":"wave_verification","wave":M,
        "planned_stories":[...],"actual_stories":[...],"plan_match":true/false}

B4. [ ] Agent prompt saved to prompts/ directory
B5. [ ] values_reanchor event logged:
        {"ts":"...","event":"values_reanchor","wave":M,"confirmed":true}

PASS: ALL 5 checked → spawn agent
FAIL: ANY unchecked → STOP. Do not spawn.
```

### GATE C: Post-Wave Gate

After EACH wave's agent(s) return and BEFORE proceeding to anything else:
```
GATE C — Wave {M}, Sprint {N}
===============================
C1. [ ] agent_completed event logged for EVERY agent in this wave
C2. [ ] quality_check event logged (tsc, build, pytest results)
C3. [ ] Wave checkpoint document written (50+ lines)
C4. [ ] Health check run (8 points — Section 12) and logged
C5. [ ] Mid-wave audit run (14 keywords — Section 7) if files were created
C6. [ ] wave_completed event logged
C7. [ ] Git commit created for this wave's changes
C8. [ ] Anti-patterns from agent output extracted to learning-log.md

PASS: ALL 8 checked → proceed to Gate B for next wave (or Gate D if last wave)
FAIL: ANY unchecked → STOP. Complete the missing item before proceeding.
```

### GATE D: Sprint Exit Gate

Before marking sprint as "done" in sprint-status.yaml:
```
GATE D — Sprint {N} Exit
==========================
D1. [ ] sprint_completed event logged to event log
D2. [ ] ALL stories updated to "done" with timestamps in sprint-status.yaml
D3. [ ] Dev Agent Records filled in ALL story files
D4. [ ] Drift score computed and logged to drift-log.jsonl
D5. [ ] Sprint trend data logged to meta-log.jsonl
D6. [ ] Learning log updated with sprint section
D7. [ ] Event log completeness check passed (Section 8 standard)
D8. [ ] CLAUDE.md execution status updated
D9. [ ] sprint-plan.md header updated

PASS: ALL 9 checked → proceed to Gate E
FAIL: ANY unchecked → STOP. Sprint is NOT done.
```

### GATE E: Health Verification Gate

Final check before declaring sprint complete to user:
```
GATE E — Sprint {N} Health Verification
=========================================
E1. [ ] All backend tests still pass (pytest)
E2. [ ] Frontend builds clean (tsc + build)
E3. [ ] Git working tree clean
E4. [ ] Sprint drift score < 30 (ACCEPTABLE)
        IF score >= 30 → report to user, get acknowledgment before proceeding
E5. [ ] Multi-perspective scores logged (structural, behavioral, temporal, forensic)
E6. [ ] Health check scores for ALL waves were GREEN
        IF any wave was AMBER → document what was fixed
        IF any wave was RED → this gate FAILS

PASS: ALL 6 checked → sprint is DONE. Report to user.
FAIL: ANY unchecked → fix before declaring done.
```

---

## 2. Post-Agent Completion Logging (MANDATORY)

IMMEDIATELY after every agent returns (within the same response), the executor MUST:

```bash
# Append to sprint event log — NEVER batch, NEVER defer
echo '{"ts":"<NOW>","event":"agent_completed","agent":"<name>","wave":<M>,
  "status":"<success|partial|failed>","files_created":<N>,"files_modified":<N>,
  "tests_added":<N>,"duration_seconds":<D>}' >> sprint-{N}-event-log.jsonl
```

**Enforcement**: The Sprint Completion Gate (Section 7) checks that EVERY `agent_spawned` event has a corresponding `agent_completed` event. Missing completions BLOCK sprint completion.

---

## 3. Quality Check Logging (MANDATORY)

After EVERY build/tsc/pytest/compile check, log the result. Even passes.

```bash
echo '{"ts":"<NOW>","event":"quality_check","wave":<M>,
  "tsc":{"errors":<N>,"warnings":<N>},
  "build":"PASS|FAIL",
  "pytest":{"total":<N>,"passing":<N>,"failing":<N>},
  "algokit_compile":"PASS|FAIL|N/A"}' >> sprint-{N}-event-log.jsonl
```

**Enforcement**: The Wave Completion Gate checks that every wave has exactly 1 quality_check event.

---

## 4. Sprint Completion Event (MANDATORY)

The LAST action before committing sprint completion is logging `sprint_completed`:

```bash
echo '{"ts":"<NOW>","event":"sprint_completed","sprint":<N>,
  "stories_completed":<N>,"unit_tests":<N>,"frontend_components":<N>,
  "duration_seconds":<D>,"anomaly_count":<N>,
  "wave_drift":0,"event_log_entries":<total>}' >> sprint-{N}-event-log.jsonl
```

**Enforcement**: Sprint status CANNOT be set to "done" in sprint-status.yaml until `sprint_completed` event exists in the event log.

---

## 5. SIT Agent Protocol (Simplified for Hackathon)

Full SIT (Recorder/Diagnostician/Modifier) is too heavy for a hackathon. Instead, the executor acts as its own SIT with structured checkpoints:

### After Each Wave Completion:
1. **Record**: Update sprint event log (agent_completed + quality_check)
2. **Diagnose**: Check for symptoms:
   - Agent tokens > 100K? → flag PERF_CONCERN
   - Any test failures? → flag QUALITY_FAILURE
   - Agent reported anti-patterns? → log to learning-log.md
   - Files created match prompt's write targets? → flag DRIFT if mismatch
3. **Log**: Append diagnosis to meta-log.jsonl:
   ```json
   {"ts":"...","category":"wave_diagnosis","sprint":N,"wave":M,
    "symptoms_checked":5,"symptoms_found":0,"health":"GREEN|AMBER|RED"}
   ```

### At Sprint Completion:
1. **Sprint health summary** logged to meta-log.jsonl
2. **Drift check** — compare planned vs actual (waves, agents, stories)
3. **Event log completeness check** — count events vs expected minimum

---

## 6. Wave Checkpoint Enforcement (MANDATORY)

After EVERY wave passes quality checks, write a checkpoint document:

**File**: `orchestrator/runs/{run-id}/wave-{M}-sprint{N}-checkpoint.md`
**Minimum**: 50 lines

**Required sections**:
```markdown
# Sprint {N} Wave {M} Checkpoint

## Wave Summary
(agents, stories, status, duration — 5+ lines)

## Files Created
(full paths — 1 line per file)

## Files Modified
(full paths — 1 line per file)

## Quality Check Results
(tsc, build, pytest — exact numbers — 3+ lines)

## Key Decisions
(numbered list — 2+ items)

## Anti-Patterns Observed
(from agent output — 1+ items)

## Context for Next Wave
(what downstream agents need — 3+ lines)
```

**Enforcement**: Sprint Completion Gate verifies checkpoint file exists for every wave.

---

## 7. Audit Calibration Protocol

### Negative Keyword Injection

ALL audit agent prompts MUST include this expanded keyword set to catch real issues:

```
Search for these SPECIFIC problem patterns:
- INCONSISTENCY: values that contradict across files
- STALE REFERENCE: paths, function names, or constants that were renamed/removed
- AMBIGUITY: unclear behavior, missing edge case handling, undocumented assumptions
- GREY AREA: code that works but could break under reasonable conditions
- SILENT FAILURE: errors caught and swallowed without logging or user notification
- DEAD CODE: unreachable branches, unused imports, orphaned functions
- DRIFT: implementation that deviates from spec (CLAUDE.md, story ACs, screen map)
- PHANTOM: docs referencing code that doesn't exist, or code not referenced in docs
- REGRESSION: behavior that worked before but may break after recent changes
- CONTRADICTION: two pieces of code/docs that say opposite things
- HARDCODED: magic numbers, inline strings, or values that should be constants
- LEAK: memory leaks (uncleared timers), state leaks (stale closures), data leaks (secrets in code)
- COUPLING: tight dependencies between components that should be independent
- RACE CONDITION: async operations that could interleave incorrectly
```

### Verification-First Audit Rule

Every audit finding MUST include a verification step:
```
[FINDING] Description
VERIFIED BY: <exact command or file:line that proves this is real>
```

If the auditor cannot provide `VERIFIED BY`, the finding is UNVERIFIED and does not count toward severity totals. This reduces false positives from 86% to near-zero.

### Mid-Wave Audit (NEW)

Between waves (after quality check, before next wave spawn), run a QUICK audit:
- `grep` for the 14 negative keywords above across files modified in the wave
- If any hits → log to event log as `{"event":"mid_wave_audit","findings":N}`
- CRITICAL findings block next wave

---

## 8. Event Log Completeness Standard

### Minimum Events Per Sprint

| Event Type | Minimum Count | Formula |
|-----------|---------------|---------|
| sprint_started | 1 | Exactly 1 |
| wave_started | = wave count | 1 per wave |
| agent_spawned | = agent count | 1 per agent |
| agent_completed | = agent count | 1 per agent |
| quality_check | = wave count | 1 per wave |
| wave_completed | = wave count | 1 per wave |
| sprint_completed | 1 | Exactly 1 |
| wave_verification | = wave count | 1 per wave (NEW) |
| wave_diagnosis | = wave count | 1 per wave (NEW) |
| mid_wave_audit | >= wave count - 1 | Between waves (NEW) |

**For a 3-wave sprint**: minimum 28 events.
**For a 2-wave sprint**: minimum 20 events.

### Completeness Check (run at sprint end)

```bash
# Verify event log completeness
EXPECTED_AGENTS=$(grep -c "agent_spawned" sprint-{N}-event-log.jsonl)
ACTUAL_COMPLETED=$(grep -c "agent_completed" sprint-{N}-event-log.jsonl)
echo "Agents: spawned=$EXPECTED_AGENTS completed=$ACTUAL_COMPLETED"
[ "$EXPECTED_AGENTS" = "$ACTUAL_COMPLETED" ] || echo "INCOMPLETE — agent completions missing"

EXPECTED_WAVES=$(grep -c "wave_started" sprint-{N}-event-log.jsonl)
ACTUAL_WAVE_DONE=$(grep -c "wave_completed" sprint-{N}-event-log.jsonl)
echo "Waves: started=$EXPECTED_WAVES completed=$ACTUAL_WAVE_DONE"
[ "$EXPECTED_WAVES" = "$ACTUAL_WAVE_DONE" ] || echo "INCOMPLETE — wave completions missing"

grep -q "sprint_completed" sprint-{N}-event-log.jsonl || echo "INCOMPLETE — sprint_completed missing"
```

---

## 9. Drift Measurement Framework

### Quantitative Drift Dimensions

| Dimension | Measurement | Threshold |
|-----------|-------------|-----------|
| Wave count | planned - actual | Any non-zero = HIGH |
| Agent count | planned - actual | |delta| >= 2 = MEDIUM |
| Story assignment | stories-in-plan vs stories-executed | Any mismatch = MEDIUM |
| Event log coverage | events logged / expected minimum | < 80% = HIGH |
| Test count | sprint end - sprint start | Decrease = CRITICAL |
| Build status | pass/fail per wave | Any fail = CRITICAL |
| Audit false positive rate | false / total | > 50% = MEDIUM |
| Checkpoint completeness | checkpoints written / waves executed | < 100% = HIGH |

### Sprint Drift Score

After each sprint, compute:
```
drift_score = (
  (wave_drift != 0) * 30 +
  (agent_drift != 0) * 20 +
  (event_coverage < 0.8) * 25 +
  (checkpoints_missing > 0) * 15 +
  (test_regression) * 40 +
  (audit_fp_rate > 0.5) * 10
)

0-10:  EXCELLENT — no significant drift
11-30: ACCEPTABLE — minor deviations, documented
31-50: CONCERNING — course correction needed
51+:   CRITICAL — halt and review with user
```

### Sprint Drift Scores (Session 1)

| Sprint | Wave | Agent | Events | Checkpoints | Tests | Audit FP | Score | Grade |
|--------|------|-------|--------|-------------|-------|----------|-------|-------|
| 0 | 0 | 0 | OK | 1/1 | 0 | N/A | 0 | EXCELLENT |
| 1 | 0 | 0 | OK | 0/2 | +37 | 21% | 15 | ACCEPTABLE |
| 2 | 0 | 0 | LOW | 0/3 | 0 | 86% | 50 | CONCERNING |
| 3 | -1 | -1 | VERY LOW | 0/2 | 0 | N/A | 70 | **CRITICAL** |

**Trend**: Deteriorating. Sprint 4 must score < 30 (ACCEPTABLE or better).

---

## 10. Qualitative Analysis Terms

Beyond quantitative metrics, track these qualitative dimensions:

### Per-Sprint Qualitative Assessment

| Term | Question | Rating (1-5) |
|------|----------|-------------|
| **Fidelity** | Does the output match the spec exactly? | |
| **Completeness** | Are all ACs met with evidence? | |
| **Robustness** | Are edge cases handled? | |
| **Consistency** | Do patterns match across files? | |
| **Observability** | Can issues be debugged from logs alone? | |
| **Maintainability** | Could another developer understand this? | |
| **Correctness** | Does it actually work (not just compile)? | |
| **Process Discipline** | Were all gates followed? | |

### Session 1 Qualitative Scores

| Term | S0 | S1 | S2 | S3 | Trend |
|------|----|----|----|----|-------|
| Fidelity | 5 | 5 | 4 | 3 | DOWN |
| Completeness | 5 | 5 | 5 | 5 | STABLE |
| Robustness | 3 | 5 | 4 | 4 | STABLE |
| Consistency | 4 | 5 | 4 | 4 | STABLE |
| Observability | 4 | 4 | 2 | 1 | DOWN |
| Maintainability | 5 | 5 | 5 | 5 | STABLE |
| Correctness | 5 | 5 | 5 | 5 | STABLE |
| Process Discipline | 5 | 4 | 3 | 2 | **DOWN** |

**Key insight**: Code quality (Completeness, Correctness, Maintainability) stayed high. Process discipline (Fidelity, Observability, Process Discipline) degraded. Sprint 4 must focus on process, not just code.

---

## 11. Cross-Sprint Trend Analysis

Compute after each sprint for the meta-log:

```json
{
  "category": "sprint_trend",
  "sprint": N,
  "metrics": {
    "drift_score": 0,
    "event_coverage_pct": 100,
    "checkpoint_pct": 100,
    "test_delta": 0,
    "audit_fp_rate": 0,
    "components_created": 0,
    "lines_added": 0,
    "qualitative": {
      "fidelity": 5,
      "completeness": 5,
      "observability": 5,
      "process_discipline": 5
    }
  }
}
```

---

## 12. Health Check System (Run After Every Wave)

After each wave completes and is logged, run this health check before proceeding:

### Process Health (5 checks)
```
HEALTH CHECK — Wave {M}, Sprint {N}
====================================
1. [ ] values_reanchor event exists for this wave
2. [ ] wave_verification event exists for this wave
3. [ ] agent_completed event exists for every agent in this wave
4. [ ] quality_check event exists for this wave
5. [ ] wave checkpoint document written (50+ lines)

Score: ___/5
  5/5 = GREEN — proceed
  3-4 = AMBER — fix missing items, then proceed
  0-2 = RED — STOP. Something is systemically wrong.
```

### Behavioral Health (3 checks)
```
6. [ ] No process steps were skipped "for efficiency"
7. [ ] No wave/story consolidation occurred without user approval
8. [ ] All catch blocks have console.error logging

Score: ___/3
```

### Log to meta-log.jsonl:
```json
{"ts":"...","category":"health_check","sprint":N,"wave":M,
 "process_score":5,"behavioral_score":3,"total":8,"grade":"GREEN"}
```

---

## 13. Multi-Perspective Analysis Framework

Beyond quantitative (drift scores) and qualitative (8 dimensions), add these perspectives:

### Structural Perspective
*"Is the system's architecture sound?"*

| Check | Question |
|-------|----------|
| Coupling | Do components depend on each other's internals? |
| Cohesion | Does each file do one thing well? |
| Layering | Are hooks, components, and lib properly separated? |
| Naming | Do names communicate intent clearly? |
| File size | Are any files > 300 lines (split needed)? |

### Behavioral Perspective
*"Does the system do what the spec says?"*

| Check | Question |
|-------|----------|
| AC coverage | Is every acceptance criterion verifiable in the code? |
| Edge cases | Are boundary conditions handled (0, null, max)? |
| Error paths | Does every async operation have error handling? |
| State transitions | Do all state machines have defined transitions? |
| Race conditions | Can any async operations interleave incorrectly? |

### Temporal Perspective
*"How does the system change over time?"*

| Check | Question |
|-------|----------|
| Drift rate | Is the drift score increasing or decreasing per sprint? |
| Process decay | Are later sprints skipping more steps than earlier ones? |
| Complexity growth | Are files getting larger each sprint? |
| Technical debt | Are deferred items accumulating faster than being resolved? |
| Learning velocity | Are anti-patterns being caught earlier each sprint? |

### Forensic Perspective
*"Can we reconstruct what happened from logs alone?"*

| Check | Question |
|-------|----------|
| Event completeness | Can the full sprint timeline be reconstructed from event logs? |
| Decision traceability | Is every non-trivial decision logged with reasoning? |
| Error attribution | Can every bug be traced to a specific agent and wave? |
| Checkpoint chain | Do wave checkpoints form a complete history? |
| Handoff fidelity | Could a new executor replicate the sprint from the handoff alone? |

### Rate each perspective 1-5 after each sprint:
```json
{"ts":"...","category":"multi_perspective","sprint":N,
 "structural":4,"behavioral":5,"temporal":3,"forensic":2}
```

### Session 1 Perspective Scores:
| Perspective | S0 | S1 | S2 | S3 | Trend |
|-------------|----|----|----|----|-------|
| Structural | 4 | 5 | 4 | 4 | STABLE |
| Behavioral | 5 | 5 | 5 | 5 | STABLE |
| Temporal | N/A | 4 | 3 | 2 | DOWN |
| Forensic | 4 | 4 | 2 | 1 | **DOWN** |

**Forensic is the worst dimension.** Sprint 3's event log was so sparse that the sprint cannot be reconstructed from logs alone. Sprint 4 MUST score >= 4 on Forensic.

---

## 14. Mid-Sprint Course Correction

If at any wave boundary, the health check scores AMBER or RED:

1. **AMBER**: Log the issue, fix it, add a correction event:
   ```json
   {"ts":"...","event":"course_correction","wave":M,
    "issue":"...", "fix":"...", "prevented":"..."}
   ```

2. **RED**: STOP execution. Report to user:
   - What health checks failed
   - What caused the failure
   - Proposed fix before continuing
   - DO NOT proceed without user acknowledgment

This prevents the "gradual decay" pattern observed in Session 1 where each sprint was slightly worse than the last without any intervention.

---

## End of Protocol

This document is the authoritative reference for Maestro process enforcement.
Every executor session MUST read this before Sprint execution begins.
Every gate in this document is BLOCKING — no exceptions without user approval.

**Core values reminder**: Process > Rules > Quality > Thoroughness > Speed.
**Speed is NEVER a reason to skip a step.**
