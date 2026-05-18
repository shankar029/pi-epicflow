# v0.9 Observability — see what's happening inside an epic

**Goal:** make pi-epicflow's runtime state visible without grepping
`run-log.jsonl` by hand. The v0.8.0 real-app verification proved the
data is already there; the surface is missing. This epic adds the
surface.

**Non-goals (defer to v0.9.1+):**
- Live/watch mode (`--live` polling).
- Cross-epic dashboards or web UIs.
- Halt-UX consolidation (separate epic).
- Decomposition-author assistance (v0.10).

**Why now:** during v0.8.0 verification the orchestrator reconstructed
parallel-batch timing by hand from `run-log.jsonl` to prove the 2.87x
speedup. That data should be one command away, not a one-off awk
script.

---

## 1. JSON output (`pi-epic-status --json`)

The foundation. A stable, documented JSON schema that machine-readable
tooling (this project's smoke, external CI, the doctor) can consume
without parsing the human-rendered table.

**Schema (v1, additive-only forever):**

```json
{
  "schema_version": 1,
  "epic": {
    "id": "0001-observability-v09",
    "title": "v0.9 Observability",
    "slug": "observability-v09",
    "branch": "epic/observability-v09",
    "status": "in-progress",
    "started": "2026-05-17",
    "updated": "2026-05-17"
  },
  "features": [
    {
      "id": "F01",
      "slug": "json-output",
      "status": "done",
      "branch": "feat/observability-v09/F01-json-output",
      "merge_sha": "abc123...",
      "started_at": "2026-05-17T10:00:00Z",
      "completed_at": "2026-05-17T10:14:23Z",
      "duration_sec": 863,
      "halts": []
    }
  ],
  "batches": [
    {
      "id": 1,
      "started_at": "2026-05-17T10:15:00Z",
      "ended_at": "2026-05-17T10:25:30Z",
      "wall_clock_sec": 630,
      "serial_sum_sec": 1750,
      "speedup_ratio": 2.78,
      "feature_ids": ["F02", "F03", "F04"]
    }
  ],
  "halts": [],
  "ready_now": [],
  "blocked_on_deps": []
}
```

**Backward compat:** the existing human-table output is unchanged when
`--json` is absent. `--json` is opt-in.

**Source of truth:** `run-log.jsonl` for events, `meta.yaml` for epic-
level state, per-feature `meta.yaml` (where present) for feature state.
Halt files (`halt-*.md` under each feature dir) are scanned for
unresolved halts.

**Schema versioning:** `schema_version: 1`. Future additions go in new
fields (additive). Renames or removals bump the version with a
migration note in CHANGELOG.

---

## 2. Per-feature timing column

In the existing human-rendered status, add **started**, **duration**,
and (if running) **elapsed** columns. Read timestamps from
`run-log.jsonl`. For features in `state: in-progress`, duration is the
elapsed wall-clock since `feature-start`.

**Display rule:** durations less than 60s show as `Xs`, less than 1h
as `MM:SS`, longer as `H:MM:SS`.

**Why this matters:** the operator currently has no signal whether a
worker is making progress or wedged. After this lands, `pi-epic-status`
shows "F03 elapsed 04:32" and the operator can decide whether to
investigate or wait.

---

## 3. Batch visualization

When `epic-config.yaml` has `parallel.max_workers > 1`, group
concurrently-running features in the status output as a "Batch N"
block. Show:

- Batch wall-clock (max end - min start).
- Serial sum (sum of feature durations).
- Speedup ratio (`serial_sum / wall_clock`).
- Theoretical ceiling (`min(max_workers, batch_size)`).
- Per-feature start offset (`+0s`, `+1s`, `+2s` from batch start).

**Batch detection rule:** group consecutive `feature-start` events
within a 5-second window into one batch, terminated by the first
`feature-complete` for that group.

**Why this matters:** the v0.8.0 release claims "2.87x speedup vs 3.00x
theoretical." That claim needs to be reproducible by anyone with
`pi-epic-status`, not just by me with awk.

---

## 4. Halt visibility + recovery hints

Halted features should be **the first thing** the operator sees in
`pi-epic-status` output when present. Currently they're easy to miss.

For each unresolved halt, show:
- Feature ID + slug.
- Halt code (H1..H10) and short description.
- Halt file path (`.pi/epics/<id>/features/F03-.../halt-h6-out-of-scope.md`).
- The matching `docs/recovery.md` anchor (e.g. `#r6-out-of-scope`).

**Discovery rule:** scan each feature directory for `halt-*.md` files
where there is no matching `resolved-halt-*.md` sibling. Recovery
docs anchor is derived from the halt-code naming convention
(`halt-h6-...` → `recovery.md#r6-out-of-scope`).

**Why this matters:** L-043 introduced halt code H8 (review-blocked).
H9/H10 came in v0.8. Operators encountering an unfamiliar halt code
should be one click away from the recovery recipe.

---

## 5. Integration with `pi-epicflow-doctor`

`pi-epicflow-doctor` already reports installation health. Extend it
to read the `pi-epic-status --json` output for any in-flight epic in
the current working directory and surface:

- Active halts (count + severity).
- Recent batches summary (last 3 batches with speedup ratios).
- Any feature stuck in `in-progress` > 30 minutes.

This makes the doctor a one-stop "is anything wrong?" check for
operators driving long-running epics.

**Why this matters:** ties the new JSON contract back to the existing
diagnostic surface. Future tooling (CI checks, status dashboards)
follows the same pattern instead of reinventing.

---

## 6. Smoke coverage

Each feature ships with a smoke phase covering its happy path:

- **F01:** assert `pi-epic-status --json | jq .schema_version` equals 1
  and the documented top-level keys all exist.
- **F02:** start a feature, sleep 2s, assert duration column shows a
  non-empty value in the human output.
- **F03:** simulate a 3-feature parallel batch (or use existing v0.8
  fixtures) and assert the output reports batch wall-clock, serial sum,
  and speedup.
- **F04:** write a `halt-h6-test.md`, assert the human output surfaces
  it with the H6 description and the `#r6-out-of-scope` anchor.
- **F05:** assert `pi-epicflow-doctor` mentions "recent batches" when
  an epic with merged features is present.

Smoke phase count goes 24 → 29.

---

## 7. Out-of-scope (explicit)

- **Live/watch mode** (`pi-epic-status --live`) — defer to v0.9.1.
- **Cross-epic dashboards** — defer; no demand signal yet.
- **A web UI for pi-epic-status** — categorically out, this is a CLI.
- **Changing the human-rendered table format beyond the new columns**
  — the current table is fine; this epic adds to it, doesn't rewrite.
- **JSON schema version 2** — v1 is forever-additive; no breaking
  changes until v0.x→v1.0 anyway.

---

## 8. Risks

- **F01 defines a schema that F02–F04 all read.** If F01 ships a bad
  shape, all three parallel siblings re-do work. Mitigation:
  decomposition.yaml's F01 AC includes "schema documented in
  design.md §1, no deviations" and per-feature reviewer must catch
  drift before F01 merges.
- **`run-log.jsonl` is currently best-effort.** Some scripts may not
  log all events consistently. The L-053 candidate work in this epic
  is to make logging contract-quality. Logging additions are part of
  F01's scope.
- **The orchestrator (pi running `/epic-run-auto`) calls
  `pi-epic-status` internally to find the ready set.** Workers
  modifying that script could break the orchestrator mid-epic.
  Decision: declared scope_files isolate the changes to F01 only
  (F02–F04 add new render branches via include-pattern, not by
  modifying the existing `pi-epic-status` body). If this proves
  insufficient, snapshot-the-binary fallback is documented in design
  decisions log below.

---

## 9. Decisions log

- 2026-05-17 — **JSON schema version is 1, additive forever.** No
  breaking schema changes pre-1.0. Anything that would break it gets
  a new field.
- 2026-05-17 — **No snapshot of pi-epic-status at epic start.**
  Declared scope_files + parallel-mode L-049 pre-check is the safety
  net. If a worker breaks the orchestrator's invocation we'll learn
  L-053 and add the snapshot in v0.9.1.
- 2026-05-17 — **Batch detection window: 5 seconds.** Feature starts
  within 5s of each other are the same batch. v0.8 verification showed
  parallel dispatch fans out within ~1s; 5s gives margin without
  ambiguity.
- 2026-05-17 — **`--json` is opt-in, default output unchanged.** This
  is a v0.x release and changing the default would break any operator
  who's grepping `pi-epic-status` in shell history.
- 2026-05-17 — **Halt code → recovery.md anchor mapping is
  convention-derived, not configured.** `halt-h6-*.md` → `#r6-*`. No
  per-halt mapping table.

---

## 10. Success criteria

After this epic:

1. `pi-epic-status --json | jq .batches[0].speedup_ratio` returns a
   number for any epic with a completed parallel batch.
2. Human `pi-epic-status` output on a 5-feature parallel epic clearly
   shows 1 root + 1 batch of 3 + 1 integrator, with timing for each.
3. A halted feature is visible in the first screen of output (top of
   the table or a dedicated "ATTENTION: halts" header section).
4. `pi-epicflow-doctor` on a repo with an in-flight epic includes a
   "recent batches" section.
5. All v0.8.1 smoke phases (24) still pass; 5 new phases pass.

This is the v0.9 release.
