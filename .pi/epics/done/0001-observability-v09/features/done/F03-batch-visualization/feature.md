# F03 — Batch Visualization

> Status: tests-passing · Branch: `feat/observability-v09/F03-batch-visualization` · See `meta.yaml`
>
> Epic: [`0001-observability-v09`](../../design.md) · This feature implements: batch detection + visualization from decomposition.yaml F03

## 1. Goal

Detect parallel feature batches from run-log.jsonl and render them in both
human (`pi-epic-status`) and JSON (`--json .batches[]`) output, showing
wall-clock, serial sum, speedup ratio, and per-feature start offsets.

## 2. Acceptance criteria

- [x] When run-log.jsonl contains >=2 feature-start events within 5s and no intervening feature-complete, human output renders a `Batch N` block.
- [x] Batch block shows wall_clock, serial_sum, speedup_ratio (2 decimals), theoretical_max.
- [x] Per-feature start offset within batch: `+0s`, `+1s`, etc.
- [x] `--json .batches[]` populated with id, started_at, ended_at, wall_clock_sec, serial_sum_sec, speedup_ratio, feature_ids[].
- [x] When max_workers == 1 or unset, `.batches` is empty and no Batch block renders.
- [x] Against /tmp/pe-v8-realapp: exactly 1 batch grouping F02+F03+F04 with speedup_ratio=2.99 (within 2.7–3.0 range).

## 3. Decisions (ADR-style, append-only)

### ADR-001: Dispatcher modification required
- **Date:** 2026-05-17
- **Status:** accepted
- **Context:** F01 was supposed to create pi-epic-status-batches.sh as a stub AND wire it into the dispatcher (source + render call). F01 created neither. The dispatcher has no source line for batches.sh and no render_batches call in the full-mode dispatch.
- **Decision:** Add 2 lines to the dispatcher: `source batches.sh` and `render_batches "$epic_dir"` before render_features. Logged as deviation.
- **Consequences:** Touches 1 file outside strict scope_files. Minimal change (2 lines).

## 4. Plan (mandatory; fill BEFORE first edit)

**Files I will touch:**
- `skills/epic-feature-workflow/lib/pi-epic-status-batches.sh` — create with render_batches() (human output)
- `skills/epic-feature-workflow/lib/pi-epic-status-json.sh` — fill in emit_batches_json() stub
- `skills/epic-feature-workflow/scripts/pi-epic-status` — add source line + render_batches call (deviation: F01 omission)

**Files I will read for context (not edit):**
- `skills/epic-feature-workflow/lib/pi-epic-status-features.sh` — pattern for Python heredoc rendering
- `skills/epic-feature-workflow/scripts/_common.sh` — yaml_get function signature

**AC interpretation (literal expected behavior per criterion):**
- AC 1: Human output shows `── Recent batches ──` header followed by `Batch N (size=K, max_workers=W)` when >=2 starts within 5s
- AC 2: Each batch block prints `wall_clock: MM:SS   serial_sum: MM:SS   speedup: X.XXx / Y.YYx theoretical`
- AC 3: Each feature in batch shows `F0N  (start +Ns)`
- AC 4: JSON `.batches[0]` contains all documented keys with correct types
- AC 5: When max_workers <= 1, render_batches returns early; emit_batches_json prints `[]`
- AC 6: On /tmp/pe-v8-realapp: 1 batch, feature_ids=[F02,F03,F04], speedup_ratio=2.99

**Ambiguities:** none

**Anti-scope:**
- Do NOT modify emit_features_json (F02), emit_halts_json (F04)
- Do NOT modify _common.sh
- Do NOT add smoke tests (F05 owns)

## 5. TODO checklist

- [x] Create pi-epic-status-batches.sh with render_batches()
- [x] Fill in emit_batches_json() in pi-epic-status-json.sh
- [x] Wire dispatcher (deviation)
- [x] Verify bash -n on all files
- [x] Verify JSON output on v0.8 fixture
- [x] Verify human output on v0.8 fixture
- [x] Verify 24/24 smoke tests pass
- [x] Verify F02 JSON keys preserved

## 6. Progress log (append-only, newest on top)

### 2026-05-17 12:00
- changes: created lib/pi-epic-status-batches.sh, modified lib/pi-epic-status-json.sh emit_batches_json(), modified scripts/pi-epic-status (+2 lines)
- why: implement batch detection + visualization per F03 AC
- next: reviewer pass

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Smoke test for batch detection (F05 owns)
- Halt rendering (F04)
- Per-feature timing columns (F02)
