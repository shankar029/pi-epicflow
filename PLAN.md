# pi-epicflow v0.5.1 Plan

**Goal:** Fix the 6 bugs the kvstore smoke epic surfaced. Patch-level
release on top of v0.5.0. Architecture stays; tooling gets sharper.

**Status:** drafted
**Started:** 2026-05-14 (right after v0.5.0 tag)
**Triggered by:** end-to-end smoke run on `kvstore` epic (4 features, 40
tests, 0 halts, but 6 bugs caught by the workflow itself — exactly the
outside-user signal we needed).

## Confirmed scope

All six items are concrete, traced to a real artifact in the smoke run.
Estimates are rough; the whole release is ~1–1.5 days of focused work.

### High priority (block any second user-facing epic)

- **L-023 — `pi-feature-complete` spike path is broken (3 sub-fixes).**
  - Source: `epicflow-v05-smoke` `.pi/epics/done/0001-smoke/deviations.md`
    §S01 entry dated 2026-05-14 17:25.
  - Symptom: spike completion failed with "empty squash" because the
    worker (correctly, per spike contract) writes journal only to
    MAIN_REPO, leaving the feat branch with zero commits. Workaround
    required manual cherry-pick + reflog recovery from the L-004
    `--ours` resolver wiping the populated journal.
  - Fix matrix (verbatim from the deviation):
    1. `pi-feature-start` (`skills/.../scripts/pi-feature-start`): after
       creating the worktree + feat branch, cherry-pick the scaffold
       commit onto the feat branch so it has ≥1 commit even for spikes.
    2. `pi-feature-complete`: for `kind: spike`, commit the worker's
       MAIN_REPO journal edits onto the feat branch via the worktree
       *before* squash-merging. OR allow `--allow-empty` squash and
       treat MAIN_REPO journal as canonical.
    3. L-004 `--ours` auto-resolver inside `pi-feature-complete`: when
       `kind: spike`, prefer `--theirs` (feat-branch version) for
       `feature.md` / `deviations.md` / `meta.yaml` — the worker authored
       those on the feat branch.
  - Done when: spike-only path runs cleanly in `install/smoke-test.sh`
    (add a spike to the smoke fixture).
  - Estimate: 3h.

### Medium priority

- **L-024 — decomposer must include symbol-owning files in `scope_files`
  when an AC names a symbol path.**
  - Source: smoke `deviations.md` §F03 "out-of-scope edits to errors.py
    and __init__.py". F03 AC 4 literally said
    `kvstore.errors.LockedError` but F03 `scope_files` was only
    `engine.py` + `tests/test_engine.py`.
  - Fix: extend `prompts/epic-decompose.md` with a rule:
    > **Symbol-path scope rule.** Every AC that names a fully-qualified
    > symbol path (e.g. `module.errors.X`, `pkg.Class`, function-import
    > paths) MUST have the file owning that symbol in this feature's
    > `scope_files` — or the symbol must already exist on the epic
    > branch from a dependency. Walk the AC list, extract every
    > `dotted.path`, resolve to a file under `src/`.
  - Also: `pi-epic-validate-decomposition` warns when a depended-on
    feature defined a symbol path that this feature's AC mentions
    without including the owning file.
  - Done when: validator emits a `[symbol-scope]` warning on a
    deliberately-broken decomposition fixture; new test in
    `install/smoke-test.sh`.
  - Estimate: 2h.

- **L-025 — `pi-epic-complete` doesn't `git mv` / commit the epic dir
  rename.**
  - Source: I observed this directly post-smoke — the closeout +
    epic-review commits landed at the *old* path `.pi/epics/<id>/...`,
    then the filesystem rename to `.pi/epics/done/<id>/` happened
    untracked, leaving the working tree dirty.
  - Fix: in `skills/.../scripts/pi-epic-complete`, after the epic-review
    commit, use `git mv` (or `mv` + `git add -A`) for the rename and
    commit it as
    `chore(epic): archive <id> to .pi/epics/done/` so the epic ends
    fully clean.
  - Done when: after `pi-epic-complete`, `git status --short` is empty.
  - Estimate: 1h.

- **L-026 — `.gitignore` template doesn't cover `.pi/epics/done/<id>/`
  paths.**
  - Source: my `git add -A` post-smoke tracked the supposedly-gitignored
    `worker-report.md` / `review-report.md` files because the patterns
    `.pi/epics/*/features/done/*/worker-report.md` don't match the
    deeper post-archive path `.pi/epics/done/<id>/features/done/<fid>/worker-report.md`.
  - Fix: add to the template:
    ```
    .pi/epics/done/*/features/done/*/worker-report.md
    .pi/epics/done/*/features/done/*/review-report.md
    .pi/epics/done/*/features/done/*/progress.md
    .pi/epics/done/*/run-log.jsonl
    ```
    Source: `skills/.../scripts/pi-epic-init` (look for the
    `.gitignore` append block).
  - Plus: bundled per-language ignores. Add `__pycache__/` + `*.pyc` for
    Python projects (or universally — they're harmless on non-Python
    repos). Same for `.DS_Store`, `node_modules/` (no — too aggressive;
    keep narrow).
  - Decision pending: add `__pycache__/` to base template (cheap, broad
    benefit) or detect-and-add only when pyproject.toml present (more
    work, no real upside). **Recommend: add universally — it's noise
    on non-Python repos, not breakage.**
  - Done when: a fresh `pi-epic-init` epic, `python3 -m pytest` once,
    then `git status` shows zero untracked.
  - Estimate: 30min.

### Low priority

- **L-027 — decomposer summary text drifts from AC.**
  - Source: smoke epic-review.md "Note (non-blocking)" §2. F03
    `summary:` said compaction preserves order "via position of latest
    surviving SET", but AC 6 + design §4 say first-occurrence. Code
    correctly followed AC.
  - Fix options:
    - (a) Add a `prompts/epic-decompose.md` self-check step: after
      drafting each feature, re-read its `summary` against its
      `acceptance_criteria` for contradictions; rewrite the summary as
      a pure restatement of the AC + design references, not a separate
      narrative.
    - (b) Document that AC is normative; summary is informative; add
      a header comment to `decomposition.yaml` template.
  - **Recommend (b)**, since (a) is hard to verify and adds prompt
    weight. The reviewer catching it post-hoc is acceptable; making
    the contract explicit prevents arguments.
  - Done when: template + decompose prompt say "AC normative; summary
    informative" once.
  - Estimate: 20min.

- **L-028 — orchestrator manual recovery flow for L-019/L-004 hit-and-run.**
  - Source: same S01 deviation. After `pi-feature-complete` mangled the
    journal, the orchestrator recovered via `git reflog` lookup.
    There's no documented playbook for this; it succeeded only because
    the model went deep.
  - Fix: add a `prompts/epic-run-auto.md` §RECOVERY appendix listing
    common manual-fix recipes (reflog restore, cherry-pick scaffold,
    re-run `pi-feature-complete --resume`). Or: link to a new
    `docs/recovery.md`.
  - Done when: recipe is written; STALL HANDLING section cross-links it.
  - Estimate: 30min.
  - **Defer if time-pressed.** L-023 makes this less common; documenting
    it is hygiene, not blocker.

## Out of scope (for v0.5.1)

- L-019/L-020/L-021/L-022 — landed in v0.5.0; no rework needed.
- Decomposer-applied-triggers-as-judgment-not-gate (mentioned in v0.5.0
  PLAN as "future v0.5.1 candidate"). Smoke run over-tagged (3/3
  features needed planner) but it was harmless. Defer until a real
  epic shows the cost.
- Numbering convention (F01/F02/.../S04 vs S01/F02/...). Smoke ran fine
  with S01,F02–F04. Defer.
- AGUI v2 / partner-agent-sdk anything. v0.5.1 is purely tooling
  cleanup.

## Verification plan

- All 6 fixes land on a `v0.5.1` branch off `main`.
- Each fix has either:
  - A new assertion in `install/smoke-test.sh`, OR
  - A new fixture under `install/fixtures/` that exercises the failing
    case.
- After all fixes, re-run the kvstore smoke (or a simpler synthetic
  spike-only epic) to confirm zero manual recovery is needed.
- `node --check install/postinstall.mjs` passes.
- Bump `package.json` to `0.5.1`.
- CHANGELOG `[0.5.1]` section with `### Fixed` listing all six.
- Append L-023..L-028 to `skills/epic-feature-workflow/lessons.md` with
  short generalized form (not the epic-specific narrative).
- Re-tag and push.

## Steps

- [ ] 1. Write `install/fixtures/spike-only-epic/` (decomp with 1 spike,
        no features) for L-023 regression test.
- [ ] 2. Fix L-023 (3 script changes); add `install/smoke-test.sh` cases.
- [ ] 3. Fix L-024 (decompose prompt rule + validator warning).
- [ ] 4. Fix L-025 (pi-epic-complete git mv + commit).
- [ ] 5. Fix L-026 (`.gitignore` template + universal Python ignores).
- [ ] 6. Fix L-027 (template header comment + decompose prompt one-liner).
- [ ] 7. (Optional) L-028 recovery doc.
- [ ] 8. Bump version, write CHANGELOG.
- [ ] 9. Append lessons L-023..L-028.
- [ ] 10. Run a fresh synthetic smoke epic end-to-end with zero manual
         intervention; confirm `git status --short` is empty at end.
- [ ] 11. Tag `v0.5.1`, push.

## Risks & rollback

- **Risk:** L-023 fix #1 (scaffold cherry-pick to feat) interacts with
  L-019 in unexpected ways for *features* (not just spikes). Mitigation:
  test on a non-spike feature first; the cherry-pick should be a no-op
  if feat already inherits the scaffold from the epic branch.
- **Risk:** L-024 `[symbol-scope]` walker is fragile — naive regex on
  `module.Class` strings will false-positive on prose. Mitigation:
  warn-only (not error); match only `[a-z_]+(\.[a-z_]+)+\.[A-Z]\w*`
  shape; document the heuristic.
- **Rollback:** v0.5.0 is the previous stable tag. If 0.5.1 regresses,
  `git revert <0.5.1 commits>` is sufficient. No schema changes; epics
  produced by v0.5.0 keep working under v0.5.1 fixes.

## Decisions log

- 2026-05-14 — Cut v0.5.1 (not v0.6.0) because everything here is
  bug-fix; no new schema fields, no new halt codes, no new
  user-facing affordances.
- 2026-05-14 — Bundle all 6 items into one release rather than dripping
  patch by patch. Smoke run confirmed they're collectively the v0.5.0
  rough edges; users hitting one will hit several.
- 2026-05-14 — `__pycache__/` added to base `.gitignore` (not gated on
  pyproject.toml presence). Cheap; not even worth the conditional.

## References

- v0.5.0 plan (now archived): `PLAN-v0.5.0.md`
- Smoke artifacts:
  `/home/shbs/code/scratch/epicflow-v05-smoke/.pi/epics/done/0001-smoke/`
  - `deviations.md` — the source of L-023 and L-024
  - `epic-review.md` — the source of L-026 (gitignore note) and L-027
    (summary-vs-AC drift)
- L-numbering: continues from L-022; next free is L-023.
