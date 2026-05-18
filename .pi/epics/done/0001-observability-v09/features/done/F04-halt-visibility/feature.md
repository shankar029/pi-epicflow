# F04 — halt-visibility

> Status: in-progress · Branch: `feat/observability-v09/F04-halt-visibility` · See `meta.yaml`
>
> Epic: [`0001-observability-v09`](../../design.md) · This feature implements halt visibility per decomposition.yaml F04.

## 1. Goal

Replace the existing halt-reports section in pi-epic-status with a prominent
⚠ HALTS header listing each unresolved halt with H-code, description, file
path, and recovery.md anchor. Wire the JSON emitter for `.halts[]`.

## 2. Acceptance criteria

- [x] AC1: When any feature dir has halt-*.md WITHOUT sibling resolved-halt-*.md, human output prepends ⚠ HALTS section.
- [x] AC2: Each listed halt shows: feature id, halt code (H1..H10), short description, halt file path, recovery anchor.
- [x] AC3: Recovery anchor convention: halt-h6-*.md → #r6-..., halt-h1-*.md → #r1-...
- [x] AC4: `.halts[]` mirrors section: feature_id, halt_code, halt_file, recovery_anchor.
- [x] AC5: When no unresolved halts, no ⚠ HALTS section and `.halts` is empty array.
- [x] AC6: Halt presence does NOT alter feature table / batches sections.

## 3. Decisions (ADR-style, append-only)

### ADR-001: Move render_halts call before feature table in dispatcher
- **Date:** 2026-05-17
- **Status:** accepted
- **Context:** Design §4 says halts should be "the first thing the operator sees". F01 placed render_halts after render_runlog (last).
- **Decision:** Move render_halts call to before render_batches in the dispatcher. Same deviation pattern as F03.
- **Consequences:** Out-of-scope edit to pi-epic-status dispatcher (1 line move).

## 4. Plan (mandatory; fill BEFORE first edit)

**Files I will touch:**
- `skills/epic-feature-workflow/lib/pi-epic-status-halts.sh` — rewrite render_halts() to scan features dirs for unresolved halts with ⚠ HALTS format
- `skills/epic-feature-workflow/lib/pi-epic-status-json.sh` — fill in emit_halts_json() stub
- `skills/epic-feature-workflow/scripts/pi-epic-status` — move render_halts call before render_batches (deviation: dispatcher edit)

**Files I will read for context (not edit):**
- `skills/epic-feature-workflow/scripts/_common.sh` — understand yaml_get, active_epic_dir
- `design.md §4` — halt visibility spec
- `decomposition.yaml` — AC and scope

**AC interpretation (literal expected behavior per criterion):**
- AC1: Scan `.pi/epics/<id>/features/*/halt-*.md`, check for sibling `resolved-halt-*.md` with matching suffix. If unresolved found, output starts with `⚠ HALTS` header before feature table.
- AC2: Each line: `  <feature_id>  <Hn>  <description>  <path>  docs/recovery.md#rN-<rest>`
- AC3: Filename `halt-h6-out-of-scope-collision.md` → anchor `#r6-out-of-scope-collision`
- AC4: JSON array of objects `{feature_id, halt_code, halt_file, recovery_anchor}`, empty `[]` when none.
- AC5: render_halts is a no-op when no unresolved halts. emit_halts_json prints `[]`.
- AC6: Feature table and batches sections render identically regardless of halt presence.

**Ambiguities:**
- _(none)_

**Anti-scope:**
- Do NOT touch features.sh, batches.sh, runlog.sh, ready.sh, _common.sh
- Do NOT modify other emit_X_json functions

## 5. TODO checklist

- [x] Rewrite render_halts() in halts.sh
- [x] Fill emit_halts_json() in json.sh
- [x] Move render_halts call in dispatcher
- [x] bash -n both files
- [x] Verify no halts on clean fixture
- [x] Verify halts on fabricated fixture
- [x] Verify JSON output
- [x] Smoke test 24/24

## 6. Progress log (append-only, newest on top)

### 2026-05-17
- changes: pi-epic-status-halts.sh (rewrite), pi-epic-status-json.sh (emit_halts_json), pi-epic-status (dispatcher order)
- why: Implement F04 halt visibility
- next: verification and worker-report

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Halt-UX consolidation (separate epic per design.md non-goals)
- Any changes to features.sh, batches.sh, runlog.sh
