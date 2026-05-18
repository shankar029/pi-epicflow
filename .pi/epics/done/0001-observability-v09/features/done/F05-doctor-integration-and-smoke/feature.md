# F05 — Doctor integration and smoke phases 25-29

> Status: in-progress · Branch: `feat/observability-v09/F05-doctor-integration-and-smoke` · See `meta.yaml`
>
> Epic: [`0001-observability-v09`](../../design.md)

## 1. Goal

Integrate `pi-epic-status --json` into `pi-epicflow-doctor` ("Recent epic activity" section) and add smoke phases 25-29 covering F01-F04 features.

## 2. Acceptance criteria

- [x] AC1: `pi-epicflow-doctor` in a repo with an in-flight epic invokes `pi-epic-status --json` and parses the result.
- [x] AC2: Doctor output gains a `Recent epic activity` section showing: active halts (count if any), last batch summary (if any), any feature stuck in-progress > 30 minutes.
- [x] AC3: When no in-flight epic, doctor's existing output is unchanged.
- [x] AC4: Smoke phase 25 `[25/29] L-053 pi-epic-status --json schema`: creates a minimal epic, asserts --json emits schema_version=1 and all 7 top-level keys.
- [x] AC5: Smoke phase 26 `[26/29] L-053 per-feature timing`: completes a feature, asserts duration column non-empty in human output.
- [x] AC6: Smoke phase 27 `[27/29] L-053 batch detection`: fabricates run-log with 2 feature-start within 5s, asserts Batch block renders + .batches[0] populated.
- [x] AC7: Smoke phase 28 `[28/29] L-053 halt visibility`: writes halt-h6-test.md, asserts ⚠ HALTS section surfaces with #r6-test anchor (deviation: actually #r6-test since filename is halt-h6-test.md).
- [x] AC8: Smoke phase 29 `[29/29] L-053 doctor integration`: runs doctor in an epic worktree, asserts output mentions 'Recent epic activity'.
- [x] AC9: All 29 smoke phases pass on a clean run; smoke `[N/29]` headers all updated.

## 3. Decisions (ADR-style, append-only)

Implementation-time decisions specific to this feature. Mirror one-liners to
the epic's `design.md` §4.

<!-- Append below; never edit past entries.

### ADR-001: <title>
- **Date:** YYYY-MM-DD
- **Status:** accepted | superseded by ADR-NNN
- **Context:** Why this decision is needed.
- **Decision:** What was decided.
- **Consequences:** Trade-offs accepted.
-->

## 4. Plan (mandatory; fill BEFORE first edit)

**Files I will touch:**
- `skills/epic-feature-workflow/scripts/pi-epicflow-doctor` — Add "Recent epic activity" section (Part A)
- `install/smoke-test.sh` — Update phase counters 24→29 and add phases 25-29 (Part B)

**Files I will read for context (not edit):**
- `skills/epic-feature-workflow/scripts/_common.sh` — understand `active_epic_dir`, `yaml_get` helpers
- `skills/epic-feature-workflow/scripts/pi-epic-status` — understand `--json` invocation and dispatcher
- `skills/epic-feature-workflow/lib/pi-epic-status-json.sh` — understand JSON schema emitted
- `skills/epic-feature-workflow/lib/pi-epic-status-batches.sh` — understand batch rendering patterns
- `skills/epic-feature-workflow/lib/pi-epic-status-halts.sh` — understand halt rendering patterns

**AC interpretation (literal expected behavior per criterion):**
- AC1: Doctor runs `pi-epic-status --json` when `active_epic_dir` succeeds; parses with `python3 -c` or `jq`.
- AC2: Output contains `## Recent epic activity` header. Under it: "Active halts: N" if halts > 0; "Last batch: Batch N (F02,F03,F04) speedup X.XXx" if batches non-empty; "⚠ F03 in-progress for 45m (>30m)" for stuck features. All items conditional.
- AC3: When `active_epic_dir` fails (no .pi/STATE.md), the section is completely omitted — zero extra output lines.
- AC4: Phase 25 inits an epic, runs `pi-epic-status --json | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["schema_version"]==1; assert set(["schema_version","epic","features","batches","halts","ready_now","blocked_on_deps"]).issubset(d.keys())'`.
- AC5: Phase 26 starts a feature, commits, completes it, runs `pi-epic-status` (human), greps for a non-dash duration value.
- AC6: Phase 27 writes 2 `feature-start` entries to run-log.jsonl < 5s apart, sets max_workers: 3, runs `pi-epic-status` human mode, greps for "Batch"; runs `--json` and asserts `.batches[0]` populated.
- AC7: Phase 28 creates `halt-h6-test.md` in a feature dir, runs `pi-epic-status`, greps for "⚠ HALTS" and "#r6-test".
- AC8: Phase 29 runs `pi-epicflow-doctor` inside an epic worktree with a merged feature, greps output for "Recent epic activity".
- AC9: `bash install/smoke-test.sh` exits 0 with all `[N/29]` headers.

**Ambiguities:**
- _(none)_

**Anti-scope:**
- Do NOT touch lib/*.sh, _common.sh, pi-epic-status, or any other scripts.
- Do NOT modify the JSON schema or human rendering logic.
- Smoke phases inline all helpers; no new functions in _common.sh.

## 5. TODO checklist (optional)

- [ ] Step 1
- [ ] Step 2

## 6. Progress log (append-only, newest on top)

### 2026-05-17 18:00
- changes: pi-epicflow-doctor (Part A), smoke-test.sh (Part B)
- why: F05 implementation — doctor integration + smoke phases 25-29
- what: Added "Recent epic activity" section to doctor using pi-epic-status --json. Added 5 new smoke phases covering JSON schema, timing, batch detection, halt visibility, and doctor integration. Updated all phase counters from /24 to /29.
- next: review and merge

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Anything explicitly deferred to another feature in the DAG.
