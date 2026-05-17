# v0.8.0 Plan — Parallel feature dispatcher

**Goal:** Run up to N features concurrently when the DAG permits, without
relaxing any v0.5/v0.6/v0.7 safety property. Cheapest viable design.

**Status:** in progress, started 2026-05-16.

**Source of truth for the design:** `docs/sketch-parallel.md` (authored
during v0.6.0 retrospective, deferred to v0.7+, now implementing).

---

## Anchoring decisions (taken from the sketch unless noted)

| Decision | Choice | Rationale |
|---|---|---|
| Concurrency primitive | **In-process orchestrator queue** (NO `flock`, NO `.locks/` dir, NO IPC between workers) | The orchestrator is one pi session running `/epic-run-auto`. Workers are subagents spawned via `pi-subagents` `tasks[]`. Coordination lives in the orchestrator's loop. No filesystem locking needed. (Simpler than my initial verbal sketch.) |
| Where the parallel flag lives | `epic-config.yaml` → `parallel.max_workers` (default `1`) | Opt-in per epic; backward-compatible. Sketch §"Concurrency cap". |
| New scripts? | **None.** Extend `pi-epic-next-feature` with `--batch N`, extend `/epic-run-auto.md` orchestration prompt. | Smaller blast radius. Serial code path untouched. |
| Default `max_workers` | `1` (serial = current behavior); operators opt in to `2` | Sketch default `2` is the *recommended* opt-in value, not the *out-of-the-box* default. Backward compat is more important than turning on a feature operators haven't asked for. |
| Conflict pre-check | **Hard** (refuse to dispatch overlapping pairs in the same batch) | L-034 mechanical enforcement. The sketch already flagged this as a *prompt-only-rule killer*. |
| Auto-rebase on conflict | **No.** Halt H6 with classification (in-scope vs out-of-scope), operator resolves. | Sketch §"Rebase-or-fallback protocol". Automatic rebase logic is a 2026 footgun. |
| Halt isolation | Soft halts (H1, H4, H10) on one worker → mark that feature, let siblings finish, then halt epic. Hard halts (H2, H5, H6, H7) → kill the batch immediately. | Sketch §H3. |
| Windows support | Not required (no flock anyway). Document Linux/macOS as verified targets; WSL works. | Falls out of "no IPC" design. |
| Cross-feature work stealing | **Out of scope.** Each subagent context dies at feature boundaries. | Sketch §"Out of scope". |
| Live timeline view | **Defer to v0.8.1** unless trivially small. | YAGNI for v0.8.0. |

---

## File-by-file scope

### Scripts
- [ ] `skills/epic-feature-workflow/scripts/pi-epic-next-feature`
      → add `--batch N` flag returning ≤N ready features (one id per line);
      apply hard conflict pre-check from declared `scope_files`.
- [ ] `skills/epic-feature-workflow/scripts/pi-feature-complete`
      → tag the existing squash-merge-conflict path with halt code `H6`;
      classify conflicting files (in-scope of fid vs out-of-scope);
      append a structured deviations.md entry.

### Orchestration prompt
- [ ] `prompts/epic-run-auto.md`
      → add a "parallel mode" branch: read `parallel.max_workers` from
      epic-config.yaml; if >1, call `pi-epic-next-feature --batch N`,
      dispatch via `subagent` `tasks[]` `concurrency: N`; per-task
      review; serial merge queue (one `pi-feature-complete` at a time);
      halt-isolation routing.
      Serial branch (max_workers=1) unchanged.

### Template
- [ ] `skills/epic-feature-workflow/templates/epic-config.yaml`
      → add `parallel:` block (default `max_workers: 1`,
      `conflict_precheck: true`); commented documentation.

### Agents
- [ ] `agents/feature-epic-reviewer.md` — verify the final-pass gate
      still works on parallel-merged history. Likely no change needed
      (the agent audits the cumulative epic diff, which is the same
      whether features merged serially or via the queue).

### Recovery
- [ ] `docs/recovery.md` → new recipe **R9** for parallel-merge
      conflict (covers both in-scope and out-of-scope cases).

### Smoke tests
- [ ] `install/smoke-test.sh` phase 21: parallel happy path
      (2 features with truly disjoint scope_files, dispatched together,
      both merge cleanly in arrival order).
- [ ] phase 22: forced merge conflict
      (2 features both touching `package.json`; conflict pre-check
      SHOULD prevent the dispatch; verify the dispatch list excludes
      one of them).
- [ ] phase 23: halt isolation
      (one feature in a batch of 2 returns H1; sibling finishes; epic
      halts only after sibling completes its current cycle).

### Docs / site
- [ ] `docs/sketch-parallel.md` → add IMPLEMENTED banner with v0.8.0
      release date; keep the sketch as historical record.
- [ ] `docs/design.md` → small addendum to the v0.7 shift-left section
      mentioning v0.8's "serial merge queue preserves linear history
      under parallel execution" property.
- [ ] `docs/RELEASE-CHECKLIST.md` → already has the L-047 real-app
      verification gate; parallel-mode dispatch must satisfy it.
- [ ] `site/src/App.tsx` — Navbar pill, Hero pill, `<WhatsNew>` section
      replacement (story: v0.8 = first concurrency feature), changelog
      deep-link.
- [ ] `README.md` — lesson catch-up sentence.

### Versioning
- [ ] `package.json` 0.7.3 → 0.8.0.
- [ ] `CHANGELOG.md` v0.8.0 entry.

### Lessons
- [ ] `skills/epic-feature-workflow/lessons.md`
      → **L-048**: in-process orchestrator queue beats IPC for
      single-host parallelism (avoid `flock`/lock-dirs entirely
      when one process owns coordination).
      → **L-049**: conflict pre-check from declared `scope_files`
      is a *cheap mechanical guard* against the most common
      parallel-merge bug (worker A and worker B both edit the
      same shared file).

### Real-app verification (per L-047)
- [ ] Re-use `/tmp/pe-sample-todo` (or extend it with one more file
      to enable a richer DAG): drive a 4-feature decomposition
      (F01 → F02, F01 → F03, F02 + F03 → F04) with `max_workers: 2`.
      Verify F02 and F03 dispatch concurrently (per run-log.jsonl
      timestamps).
- [ ] Force a conflict: edit decomposition so F02 and F03 both
      declare `package.json` in `scope_files`; verify pre-check
      drops one from the batch.
- [ ] Edit decomposition to remove `package.json` from one but
      have the *worker* go out of scope and touch `package.json`
      anyway; verify the merge-time H6 halt fires with
      "out-of-scope conflict" classification.

---

## Risks

| Risk | Mitigation |
|---|---|
| `/epic-run-auto.md` rewrite is the largest single change in v0.x; bugs here cascade across every feature. | Keep serial branch byte-for-byte unchanged; parallel branch is additive. Real-app verification before tag. |
| Subagent `tasks[]` parallel mode has observability quirks; the orchestrator's context could bloat reading N concurrent worker outputs. | Each worker writes its own `worker-report.md`; orchestrator only reads them after the task completes. Bounded reads. |
| Conflict pre-check false positives (two features declare `package.json` for legitimately different reasons; pre-check serializes them when they'd merge fine). | Acceptable. Pre-check is *conservative* by design — false-positive cost is "the two features run serially," not "the build breaks." |
| Halt-isolation logic complexity. | Tested as smoke phase 23. Soft-halt taxonomy already exists (H10 was designed for this). |
| Operators expect `max_workers: 2` by default and report "nothing got faster." | Documented opt-in. README + site + CHANGELOG all explicit. |

---

## Out of scope (v0.8.1+)

- Auto-rebase on conflict (sketch §"Out of scope")
- Cross-feature work stealing (sketch §"Out of scope")
- Multi-machine dispatch (sketch §"Out of scope")
- Parallel decomposition (sketch §"Out of scope")
- Live timeline view (`pi-epic-status --timeline`) — could ship as
  v0.8.1 if it's a 1-hour win
- `max_workers: auto` (CPU-count-derived) — adds a "did pi-epicflow
  actually use 4 workers?" question to every issue; ship hard-coded
  defaults only

---

## Decisions log

- **2026-05-16** — Plan written. Sketch §"Decision gate" was: ship
  when one epic shows ≥30% wall-clock idle OR two outside users ask.
  Gen-ui's run-log was the implicit ≥30% idle signal (the user has
  cited 2.97× ceiling on parallel speedup). Proceeding.
- **2026-05-16** — Default `max_workers: 1` (not `2`). Backward compat
  > opt-out friction.
- **2026-05-16** — No new scripts. `pi-epic-next-feature --batch` +
  `/epic-run-auto.md` parallel branch + `pi-feature-complete` H6
  tagging are the only surface changes.
