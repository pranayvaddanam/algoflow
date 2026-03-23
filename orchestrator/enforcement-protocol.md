# Maestro Enforcement Protocol v1.0

<!-- This document is MANDATORY reading for every executor session -->
<!-- Created: 2026-03-24 after Sprint 3 post-mortem -->
<!-- Triggered by: AP-011 wave consolidation violation, event log degradation -->

---

## 1. Pre-Wave Verification Gate (BLOCKING)

Before spawning EACH wave agent, the executor MUST execute this checklist.
Skipping ANY item blocks agent spawn.

```
PRE-WAVE GATE — Wave {M}, Sprint {N}
=====================================
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

4. [ ] Agent prompt saved to prompts/ directory

VERDICT: ALL checked → spawn agent
         ANY unchecked → STOP
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

## End of Protocol

This document is the authoritative reference for Maestro process enforcement.
Every executor session MUST read this before Sprint execution begins.
Every gate in this document is BLOCKING — no exceptions without user approval.
