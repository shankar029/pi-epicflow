# pi-epicflow v0.7 / v0.8 arc plan

**Goal:** Ship five releases (v0.6.2 → v0.8.1) that close gaps surfaced by the
harmony-design-studio (20-feat serial) and gen-ui (36-feat parallel) epic
retrospectives, culminating in a parallel dispatcher whose evidence-gate
(L-035) has now been satisfied by the gen-ui 2.97× speedup.

**Status:** in progress — v0.6.2 + v0.6.3 + v0.7.0 shipped; v0.7.1 next.

## Evidence base

Two real epics on the same day, opposite shapes:

| | harmony-design-studio | gen-ui |
|---|---|---|
| Features | 20 | 36 |
| Wall-clock | 7.9h | 21.75h |
| Sum-of-features | 3.21h | 64.69h |
| Parallel speedup | 1.0× (serial) | **2.97×** |
| Max concurrent | 1 | 9–14 |
| Decompose phase | 4.6h (58%) | 0.4h (2%) |
| Deviations | 10 | 48 |
| Halts / re-runs | 0 / 0 | 0 / 0 |

Combined: 56 features, 0 halts, 100% APPROVE first-try.
Reviewer spot-checks (F23, F26): substantive, not rubber-stamping. .NET features
shipped without compile validation (no SDK in env) but per-feature reviewers
DID flag this; gap is runtime validation, not review rigor.

## Releases

### v0.6.2 — Quality-of-life pack (~5h, SHIPPED)

Bias: tight, mechanical, all five items confirmed by retrospective evidence.

- [x] **a. User/built-in lessons split (privacy).**
  - New `~/.pi/epicflow/user-lessons.md` (per-machine, never auto-pushed)
  - `pi-epic-complete` writes to user-lessons by default
  - `--contribute-lesson L-XYZ` flag opts into upstream PR (still manual)
  - Agents read both files at startup; user-lessons win on conflict
- [x] **b. `pi-epicflow doctor` + version-drift warning.**
  - New `pi-epicflow-doctor` script
  - Checks: installed version vs origin/main, last-update date, skills installed
  - `pi-epic-init` warns if installed pi-epicflow is >7 days behind origin/main
  - `pi-epic-status` shows active pi-epicflow version + last-update date
- [x] **c. `--no-verify` for journal commits (L-039).**
  - `pi-feature-complete` and `pi-epic-complete` use `git commit --no-verify` for journal/archive commits
  - One-line script change; defensive against husky/lint-staged conflicts
- [x] **d. Seed `.gitignore` with `node_modules*` (L-040).**
  - `pi-epic-init` ensures `.gitignore` contains `node_modules*` (not just `node_modules`)
  - Catches the `node_modules_main` symlink-tracked-by-git class of bug
- [x] **e. `test_cmd` bypass warning (L-038).**
  - `pi-epic-status` shows red warning if `test_cmd` matches `^echo\s` or contains `SKIP`/`skip`
  - `pi-epic-init` requires explicit `--accept-no-tests` flag if user sets such a bypass at creation
- [x] **f. New lessons L-036..L-041.**
- [x] Smoke-test pass (target: 14+ phases — add phases for doctor, journal-commit, test_cmd-warn).
- [x] CHANGELOG entry, version bump, commit, tag, push.

### v0.6.3 — `pi-epic-extend` (~3h, SHIPPED)

Driven by gen-ui retrospective: extending an epic is a legitimate workflow,
not a workaround. First-class verb with guardrails.

- [x] **a. `pi-epic-extend <id> --rationale "…" [--design FILE] [--title "…"]` script.**
  - Un-archives if in `done/`; refuses if branch is already merged to default.
  - Records `extensions:` entry in `meta.yaml` (timestamp + rationale + title).
  - Appends `## Extension — YYYY-MM-DD: <title>` section to `design.md` (append-only).
  - Snapshots `original_feature_count` on first extension for L-042 growth tracking.
  - `--no-verify` commit on epic branch.
- [x] **b. `/epic-decompose` extension mode.**
  - Detects `extensions:` block; switches to append-only (new features start at F<max+1>).
  - Existing features are read-only context; diff verified append-only before commit.
- [x] **c. `pi-epic-complete` extension guardrails.**
  - Warns at ≥1 extension; **hard-halts** at ≥30% feature growth without a recorded `Decomposition lesson:` in deviations.md.
  - `--skip-extension-check` escape hatch with operator acknowledgement.
- [x] **d. `pi-epic-status` + `pi-epicflow-doctor` extensions block.**
  - Shows count and feature growth %; yellow reminder at ≥30% growth.
- [x] **e. L-042 lesson** — framework epics need verification features in the original decomposition.
- [x] **f. Smoke phase 17** — round-trip test of pi-epic-extend.
- [x] CHANGELOG entry, version bump, commit, tag, push.

### v0.7.0 — feature-epic-reviewer agent (~6h, SHIPPED)

- [x] New `agents/feature-epic-reviewer.md` (final pass before `pi-epic-complete`)
  - Inputs: all feature reports, deviations.md, design.md, squashed diff
  - Output: epic-review.md with cross-feature consistency checks
  - Design-trace table (every design.md §X.Y → which feature; covers v0.6.3 `## Extension —` sections too)
  - Catches B1/B2-class cross-feature bugs (lockfile drift, resource leak, no-op stubs, orphaned refs)
  - **Rubber-stamp detector:** % of features with worker_runs=1 + review_cycles=1 + APPROVE. >90% triggers spot-check; ≥2 of 3 reports lacking file:line evidence → hard finding.
  - Toolchain & test-gate coverage (bypass test_cmd → hard finding; real test suite must run)
  - Anti-sycophancy credibility clause (same shape as feature-reviewer)
  - Verdict: `APPROVE_EPIC | REQUEST_CHANGES_EPIC | BLOCK_EPIC` (LAST non-empty line)
- [x] `pi-epic-complete` L-043 gate — refuses to archive without `Verdict: APPROVE_EPIC` in epic-review.md; `--skip-epic-review` escape hatch with warning + run-log audit entry
- [x] `prompts/epic-run-auto.md` step 4 invokes `feature-epic-reviewer` (was generic `reviewer`)
- [x] L-043 lesson (per-feature reviewers blind to cross-feature bugs; cite harmony B1/B2 + gen-ui MapHarmonyAgent stub)
- [x] Smoke phase 18 — gate refuses without file, refuses on REQUEST_CHANGES_EPIC, accepts APPROVE_EPIC, `--skip-epic-review` bypasses with audit log

### v0.7.1 — Scope-files completeness validator (~4h)

- [ ] New post-pass in `pi-epic-validate-decomposition`:
  - For each feature whose AC/summary contains: `wire`, `register`, `expose`, `integrate`, `migrate`, `add … to`, scope_files MUST include the language-appropriate integration shell
  - Heuristic shells per language: vite.config*, main.ts, index.html, Program.cs, Directory.Build.props, `index.ts` barrel in same package, *.csproj for new project
- [ ] Validator outputs ranked list of suspicious features for human review
- [ ] Per-feature reviewer reads same heuristics; flags as deviation if scope_files missed an obvious shell
- [ ] L-043 lesson + smoke phase

### v0.7.2 — `required_toolchain` pre-flight (~3h)

- [ ] New `epic-config.yaml` field:
  ```yaml
  required_toolchain:
    - { name: dotnet, min_version: "9.0", validate_cmd: "dotnet --version" }
    - { name: node, min_version: "20", validate_cmd: "node --version" }
  ```
- [ ] `pi-epic-init` runs each validate_cmd; refuses to start if any missing/wrong-version
- [ ] `pi-epic-status` shows toolchain check per feature
- [ ] Per-feature reviewer cannot APPROVE if a required toolchain was unavailable AND the feature touches files matched by that toolchain (e.g., `*.cs` requires dotnet)
- [ ] L-044 lesson + smoke phase

### v0.8.0 — Parallel dispatcher (~16h)

L-035 evidence-gate satisfied by gen-ui 2.97× speedup.
Conservative defaults; opt-in.

- [ ] Decomposer declares `independence_group` per feature
  (features in the same group can run concurrently; cross-group serializes via merge order)
- [ ] New `pi-epic-dispatch --parallel [--max-workers N]` script
  - Default `max_workers: 2` (still conservative)
  - Spawns N pi sessions, each picking next feature from `--ready` set
  - Coordinates via filesystem locks in `.pi/epics/<id>/locks/`
- [ ] **Halt-and-ask (H6 extension)** on out-of-order merge conflict — no auto-rebase
- [ ] Run-log gets `worker_id` and `dispatcher_pid` fields
- [ ] Recovery playbook R11 for parallel-merge conflicts
- [ ] L-045 + L-046 lessons + smoke phases (15+, 16+ for parallel-2 and parallel-4)

### v0.8.1 — Quality polish (~3h)

- [ ] Late-feature complexity factor in decomposer (L-041): estimated_hours × depth multiplier
- [ ] Run-log emission tightening (gen-ui had F01/F23 missing complete events; F36 no start)
- [ ] L-047 lesson + smoke phase

## Decisions log

- 2026-05-15 — Cadence: ship each release with stop-point before moving on
- 2026-05-15 — Parallel dispatcher (v0.7 sketch, originally canceled) RESTORED for v0.8 based on gen-ui evidence: 43 wall-clock-hours saved by manual parallelism
- 2026-05-15 — Lessons-sharing privacy fix prioritized to v0.6.2 (was v0.8 candidate)

## Risks & rollback

- **v0.6.2 lessons-split**: backward compat — existing skills/.../lessons.md keeps working, user-lessons.md is additive. No data migration. Rollback = ignore user-lessons.md.
- **v0.7 epic-reviewer gate**: blocks `pi-epic-complete` if file empty — add `--skip-epic-review` escape hatch (precedent: `--skip-evidence`, `--skip-tests`).
- **v0.8 parallel dispatcher**: opt-in only via `--parallel` flag. Serial path unchanged. Rollback = don't pass the flag.

## Open questions (resolved-by-default)

- Q: lessons-split conflict resolution = user-lessons win? **A: yes** (more context-specific).
- Q: doctor scope = version + active-epic sanity? **A: yes, both**.
- Q: epic-reviewer rubber-stamp threshold = 90%? **A: yes initially, calibrate later**.
- Q: parallel default max_workers = 2? **A: yes** (sketch-parallel.md locked decision).
