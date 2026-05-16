# Changelog

All notable changes to **pi-epicflow** will be documented in this file. The
format loosely follows [Keep a Changelog](https://keepachangelog.com/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.7.2] — 2026-05-15

**`required_toolchain` pre-flight (L-046).** Detect + suggest, NOT
detect + auto-install. Closes the failure mode where an epic gets
halfway through F03 before discovering the host machine doesn't have
the SDK the work needs. Auto-install was deliberately rejected (see
L-046) on security, portability, state-pollution, and concern-boundary
grounds; auto-install can return as an opt-in flag with an installer
allow-list only after outside-user evidence demands it.

### Added

- **`epic-config.yaml` new field: `required_toolchain`** — list of
  `{name, min_version, validate_cmd, install_hint}` entries. Template
  ships with `required_toolchain: []` (no-op) plus a commented-out
  example documenting the schema.

- **`pi-epic-validate-decomposition` L-046 check** — runs each
  `required_toolchain` entry's `validate_cmd` (15s timeout); compares
  leading digit groups of stdout against `min_version` (`'v9.0.100'`
  parses as `(9, 0, 100)`); on failure, emits a multi-line stderr
  block with the failing toolchain name, the failure reason (exit
  code / version comparison / parse failure), and the `install_hint`
  **verbatim** — pi-epicflow does NOT execute the hint. Operator
  copy/pastes.

- **Toolchain-manager auto-defer** — if the repo root has
  `.mise.toml` / `mise.toml`, the failure message prefers
  `mise install` over per-SDK hints. If `.tool-versions` is present
  but no mise config, prefers `asdf install`. Defers to the
  toolchain manager the repo already chose; doesn't try to install
  the manager itself.

- **`--skip-toolchain-check` flag** — documented escape hatch (CI
  smoke runs, one-off operator overrides). Logs a yellow warning.

- **L-046 lesson** — *detect + suggest, not detect + install*.
  Spells out the rationale for rejecting auto-install (security,
  portability, state pollution, concern boundary, no outside-user
  evidence yet).

- **Smoke phase 20** — six-case round-trip:
  - empty `required_toolchain: []` is a no-op
  - nonexistent SDK → errors with install_hint
  - `--skip-toolchain-check` → bypasses with warning
  - present SDK passes
  - too-old `min_version` → errors with 'version too low'
  - `.tool-versions` present → prefers `asdf install` over per-SDK hint

### Changed

- `skills/epic-feature-workflow/templates/epic-config.yaml` — adds
  the `required_toolchain: []` field + commented example. Existing
  `epic-config.yaml` files without the field are unaffected (the
  check is opt-in via population, not via field presence).

### Migration notes

- Existing epics: no action required. The check only fires when
  `required_toolchain` is populated. The template will seed the field
  on new `pi-epic-init` runs; old epics keep working unchanged.
- To benefit on an existing epic: edit `epic-config.yaml`, populate
  `required_toolchain`, re-run `pi-epic-validate-decomposition`.
- Rationale for the detect+suggest design (vs auto-install) is
  spelled out in lessons.md §L-046 and in this CHANGELOG entry.

## [0.7.1] — 2026-05-15

**Integration-shell completeness validator (L-045).** Closes the
largest single deviation class observed across harmony + gen-ui:
~58 deviations that boil down to "worker built the new thing but
forgot to wire it into the host app" — missing barrel entry,
missing `main.tsx` registration, missing `Directory.Packages.props`
entry, missing `vite.config` plugin entry. Per-feature reviewer
catches it inconsistently because AC is shaped around the new
thing, not the boundary.

### Added

- **`pi-epic-validate-decomposition` integration-shell check (L-045)**
  — for every feature whose `acceptance_criteria` or `summary`
  contains a trigger verb (`wire`, `register`, `expose`, `integrate`,
  `mount`, `route`, `add ... to`, `hook up`, `plug in`, `connect`),
  `scope_files` MUST include at least one language-appropriate
  integration shell or the validator errors out:

  | Detected language | Required shell candidates (≥1) |
  |---|---|
  | TypeScript/JS + React (`.tsx`, `.jsx`) | `main.tsx` / `main.ts` / `index.html` / `index.ts` barrel / `vite.config*` |
  | TypeScript/JS (`.ts`, `.js`) | `package.json` / `index.ts` / `tsconfig.json` |
  | C# (`.cs`) | `Program.cs` / `Startup.cs` / `*.csproj` / `*.sln` / `Directory.Build.props` |
  | Python (`.py`) | `pyproject.toml` / `__init__.py` / `conftest.py` |
  | Rust (`.rs`) | `Cargo.toml` / `lib.rs` / `main.rs` |
  | Go (`.go`) | `go.mod` / `main.go` |

  Detection is by extension on `scope_files`. Repo root markers
  (e.g. an existing `vite.config.ts`) promote `.ts`/`.js` to
  `ts_react`. Match is permissive: a single shell satisfies the
  gate.

- **`--skip-shell-check` flag** on `pi-epic-validate-decomposition`
  — documented escape hatch for one-off bypass. Mirrors the v0.7.0
  `--skip-epic-review` pattern.

- **L-045 lesson** — *integration shells are part of the work, not
  part of the toolchain*. Cites the 58-deviation evidence base
  from both real epics.

- **Smoke phase 19** — four-case round-trip:
  - Trigger AC + no shell → validator errors with L-045 message
  - Trigger AC + shell present → validator passes
  - `--skip-shell-check` → bypasses
  - No trigger verb → validator does not false-positive

### Changed

- `pi-epic-validate-decomposition` now accepts flags (previously
  positional-args-only). `--help` describes the new flag.

### Migration notes

- Existing in-flight decomposition.yaml files that contain trigger
  verbs but no shell will now error on the next
  `pi-epic-validate-decomposition` run. Fix by adding the
  appropriate shell to `scope_files` (preferred) or by passing
  `--skip-shell-check` (one-off bypass).
- The check is opt-out, not opt-in. Rationale: the bug class is
  high-frequency and high-impact; the heuristic has been validated
  against two large real epics; the bypass flag handles edge cases
  cleanly.

## [0.7.0] — 2026-05-15

**`feature-epic-reviewer` agent + `pi-epic-complete` epic-review gate (L-043).**
Close the bug-class gap surfaced by harmony (B1 stale lockfile, B2
`destroyConversation` orphan) and gen-ui (`MapHarmonyAgent` no-op stub).
Per-feature reviewers are blind to these cross-feature bugs by design;
v0.7.0 adds a final-pass agent that runs AFTER every feature merges and
BEFORE `pi-epic-complete` archives, and a gate in `pi-epic-complete` that
refuses to archive without an `APPROVE_EPIC` verdict.

### Added

- **`agents/feature-epic-reviewer.md`** (L-043) — dedicated agent for
  end-of-epic review. Contract:
  - Pre-flight (cwd + branch sanity)
  - Cross-feature consistency (lockfile / manifest churn, no-op stubs,
    orphaned references, resource lifecycle symmetry)
  - Design-trace table (every `design.md` section — including v0.6.3
    `## Extension —` sections — must be claimed by ≥1 feature)
  - Rubber-stamp detector (parses run-log.jsonl `worker_runs` /
    `review_cycles`; >90% single-pass APPROVE on ≥5 features triggers
    spot-checks of 3 random review-reports; ≥2 of 3 lacking file:line
    evidence → hard finding)
  - Toolchain & test-gate coverage (bypass `test_cmd` = hard finding;
    real test suite MUST run)
  - Extension growth check (L-042 reminder)
  - Verdict: `APPROVE_EPIC | REQUEST_CHANGES_EPIC | BLOCK_EPIC`
    (LAST non-empty line of output, parsed by pi-epic-complete)
  - Same anti-sycophancy credibility clause as `feature-reviewer`:
    must name a concrete weakness OR list three specific clean checks.

- **`pi-epic-complete` L-043 gate** — reads
  `EPIC_DIR/epic-review.md` after the working-tree cleanliness check.
  Refuses to archive unless the file exists AND its last non-empty
  line matches `Verdict:*APPROVE_EPIC*`. Helpful error messages
  distinguish missing file vs missing verdict vs wrong verdict.
  Escape hatch: `--skip-epic-review` logs a yellow warning, appends
  an `epic-review-skipped` event to run-log.jsonl, and proceeds.
  Intentional for spike-only epics, smoke tests, and documented
  emergency overrides; NOT the default path.

- **`prompts/epic-run-auto.md` step 4 updated** — invokes
  `feature-epic-reviewer` (was: generic `reviewer`). Passes
  `EPIC_ID`, `EPIC_BRANCH`, `DEFAULT_BRANCH`, `MAIN_REPO`,
  `EPIC_DIR` as task fields. Decision tree updated to expect the
  new verdict names. Step 5 retry path unchanged.

- **L-043 lesson** — documents the structural blind spot:
  per-feature reviewers see one feature's diff against one feature's
  AC; they cannot see cross-feature bugs. End-of-epic review is
  mandatory. The lesson cites harmony's B1/B2 and gen-ui's stub as
  the empirical evidence.

- **Smoke phase 18** — L-043 gate round-trip:
  - missing epic-review.md → refuses
  - `Verdict: REQUEST_CHANGES_EPIC` → refuses
  - `Verdict: APPROVE_EPIC` → gate passes
  - `--skip-epic-review` → bypasses with warning + run-log entry

### Changed

- **`pi-epic-complete`** — new `--skip-epic-review` flag (in addition to
  the existing `--skip-extension-check` from v0.6.3). Existing flags
  unchanged.

- **Smoke phase 8** — spike-epic pi-epic-complete invocation updated
  to `--skip-epic-review` (this phase tests archive mechanics, not the
  L-043 gate). Phase 18 explicitly exercises the gate.

### Migration notes

- Existing epics will refuse to archive on the next `pi-epic-complete`
  run unless either:
  - An `epic-review.md` is written by the new agent (via the
    orchestrator's step 4, or a manual `subagent` invocation), OR
  - `--skip-epic-review` is passed (one-time emergency override).
- The recommended migration is to run the orchestrator step 4 by
  hand: spawn the `feature-epic-reviewer` agent against the
  in-flight epic and produce an `epic-review.md`. The agent is
  designed to work on retrospective epics too.

## [0.6.3] — 2026-05-15

**`pi-epic-extend` — first-class verb for extending an existing epic.**
Driven by gen-ui's sample-app gap: the original epic shipped a framework
with `test_cmd: "echo SKIP-…"` and Chromium-only frontend tests. The only
honest way to verify it is to build a sample/consumer app, but that work
belongs to the *original* epic's contract — not a stacked downstream epic
with 3-tier branch pain. Now there's a sanctioned path.

### Added

- **`pi-epic-extend <id> --rationale "…" [--design FILE] [--title "…"]`**
  (L-042) — extend an existing epic with new requirements that belong to
  its original scope. Resolves the epic from either `.pi/epics/<id>/` or
  `.pi/epics/done/<id>/`, un-archives it if needed (via `git mv` on the
  epic branch), flips `meta.yaml` `status: in-progress`, records the
  extension in `meta.yaml extensions:` with timestamp + rationale, and
  appends a `## Extension — YYYY-MM-DD: <title>` section to
  `design.md` (with `--design FILE` content or an editable stub).
  Original `design.md` content is never edited. The new commit is on the
  existing epic branch, `--no-verify` per L-039. Refuses if the epic
  branch has already been merged to its `default_branch`, if the working
  tree is dirty, or if `--rationale` is missing.

- **Extension mode in `prompts/epic-decompose.md`** — when the decomposer
  detects an `extensions:` block in `meta.yaml` whose latest entry has no
  corresponding features yet, it switches to APPEND-ONLY mode: new
  features start at `F<max+1>`, existing entries are read-only context,
  the diff to `decomposition.yaml` is verified append-only before commit.
  The summary explicitly tells the user: *"EXTENSION MODE: 5 new
  features F37–F41 will be APPENDED. Existing F01–F36 are unchanged."*

- **`original_feature_count`** in `meta.yaml` (snapshotted by
  `pi-epic-extend` before the first extension) — used by
  `pi-epic-complete`, `pi-epic-status`, and `pi-epicflow-doctor` to
  compute extension growth percentage.

- **`pi-epic-status` extensions block** — surfaces extension count and
  feature growth %. At ≥30% growth, prints a yellow reminder to record
  a `Decomposition lesson:` in `deviations.md` before `pi-epic-complete`.

- **`pi-epicflow-doctor` extensions line** — reports extension count on
  the active epic; warns at ≥2 extensions about possibly-too-narrow
  original scope.

- **L-042 lesson** — framework epics need verification features
  (sample apps, conformance harnesses) in the ORIGINAL decomposition,
  not as follow-up work. *"Tests pass" ≠ "framework verified" when the
  tests don't exercise a real consumer.*

- **Smoke phase 17** — `pi-epic-extend` round-trip: rationale-required
  gate, meta.yaml mutation, design.md append, status flip, un-archive
  from `done/`, idempotent `original_feature_count`, doctor reports
  extension count.

### Changed

- **`pi-epic-complete`** — extension guardrails. Warns when the active
  epic has ≥1 extension; **hard-halts (exit 1)** when extension features
  grow the epic ≥30% AND no `Decomposition lesson:` line exists in
  `deviations.md`. Override with `--skip-extension-check` or by
  recording the lesson. The escape hatch is intentional but visible —
  the operator has to acknowledge why the original scope under-shot.

- **`meta.yaml` template** — includes `extensions: []` placeholder.

### Migration notes

- Existing epics created before v0.6.3 have no `extensions:` field. They
  still work — `pi-epic-extend` creates the field on first use, and
  `pi-epic-status` only surfaces the block when present.
- Existing epics also lack `original_feature_count`. The first call to
  `pi-epic-extend` snapshots `decomposition.yaml`'s current feature count
  at that moment, which serves as the baseline. If your epic has already
  grown via manual feature additions before you call `pi-epic-extend` for
  the first time, that growth is invisible to the L-042 check — set
  `original_feature_count:` manually in `meta.yaml` to the historical
  baseline if you care.

## [0.6.2] — 2026-05-15

**Quality-of-life pack triggered by harmony + gen-ui retrospectives.**
Two real epics on the same day (20 features serial, 36 features parallel)
surfaced six new lessons (L-036..L-041) that were closeable with small
mechanical fixes. Ships them ahead of v0.7.0 to de-risk the parallel
dispatcher and other big work that follows.

### Added

- **User-private lessons** (`~/.pi/epicflow/user-lessons.md`, L-036) —
  per-machine, never auto-pushed. `pi-epic-complete` automatically
  appends each epic's distilled lessons here; the framework's
  `skills/epic-feature-workflow/lessons.md` no longer accumulates
  project-specific patterns by default. Agents (decomposer + planner +
  reviewer) read BOTH files; user lessons win on conflict. Privacy fix:
  pushing pi-epicflow upstream no longer risks leaking your project's
  product names, API endpoints, or internal architecture decisions.

- **`pi-epic-complete --contribute-lesson L-XYZ`** (L-036) — prints
  copy-paste-friendly text for a specific lesson from your user-lessons
  so you can PR it into the framework's lessons.md upstream. Reminds
  you to strip project-specific names first.

- **`pi-epicflow-doctor`** (L-036) — read-only health report: clone
  age, version, behind-origin commits, skills installed/executable,
  user-lessons file state, active epic + test_cmd sanity, tooling on
  PATH. Diagnostic only; never gates.

- **Version-drift warning in `pi-epic-init` and `pi-epic-status`**
  (L-036) — if the installed pi-epicflow clone is more than 7 days
  old, log a warning suggesting `pi update pi-epicflow`. The gen-ui
  epic shipped on v0.5.0 while v0.6.x was already out; this prevents
  the silent-drift case.

- **`test_cmd` bypass warning** (L-038) — `pi-epic-status` (and
  `pi-epicflow-doctor`) surface a red WARNING whenever
  `epic-config.yaml`'s `test_cmd` matches `^echo` or contains
  `SKIP`/`skip`. The gen-ui epic ran 36 features with
  `test_cmd: "echo SKIP-tests-verified-by-epic-review"` and deferred
  all test verification to the final epic-review pass — worked here
  only by luck. Now the bypass is visible on every status invocation.

- **`node_modules*` glob in default `.gitignore`** (L-040) —
  `pi-epic-init` now ensures `.gitignore` covers the whole
  `node_modules*` family, not just exact `node_modules/`. Catches
  worktree symlinks (`node_modules_main`), caches, and `.bak` siblings
  that slipped past the original ignore. Gen-ui F01 lost ~5 minutes
  to recovery from this exact scenario.

- **Smoke-test phases 14, 15, 16** — coverage for L-038 bypass
  warning, L-036 user-lessons distillation idempotency, and L-040
  gitignore glob effectiveness.

- **6 new lessons** — L-036 (user-vs-framework lessons split),
  L-037 (toolchain availability gate — deferred to v0.7.2 for the
  full pre-flight check), L-038 (bypass test_cmd warning), L-039
  (journal commits use `--no-verify`), L-040 (`node_modules*` glob),
  L-041 (late-DAG complexity factor — deferred to v0.8.1 for the
  decomposer depth multiplier).

### Changed

- **All journal/archive commits use `git commit --no-verify`** (L-039)
  — `pi-feature-start` (pending-edits + scaffold), `pi-feature-complete`
  (worktree wip + spike journal + squash + archive), `pi-epic-init`
  (gitignore + scaffold), `pi-epic-complete` (archive). These commits
  only touch `.pi/` bookkeeping, never user source. Skipping husky /
  lint-staged / commit-msg hooks here is correct: hooks should validate
  user code, not pi-epicflow's internal record-keeping. Gen-ui F01 hit
  this; future epics in repos with strict hooks are unblocked.

- **`pi-epic-complete`** no longer instructs users to manually append
  to the framework lessons file. New instructions point at the
  per-machine `~/.pi/epicflow/user-lessons.md` and the
  `--contribute-lesson` opt-in path for upstream contributions.

- **`prompts/epic-decompose.md`** now instructs the decomposer to read
  BOTH the framework lessons.md and `~/.pi/epicflow/user-lessons.md`
  (with user-lessons winning on conflict).

### Roadmap context

The v0.7 / v0.8 arc is documented in `PLAN.md`:

- **v0.7.0** — `feature-epic-reviewer` agent + epic-review.md gate +
  rubber-stamp detector. Catches the cross-feature bugs (lockfile drift,
  resource leaks across feature boundaries, design.md sections that no
  feature ever covers) that per-feature reviewers cannot see by design.
- **v0.7.1** — scope_files completeness validator (L-036/L-042). 58 of
  58 deviations across harmony + gen-ui were the same shape: integration
  shells (barrels, vite.config, Program.cs, Toolbar) missing from
  scope_files.
- **v0.7.2** — `required_toolchain:` epic-config pre-flight (L-037).
  Refuses to start an epic whose features will need a SDK / runtime that
  isn't installed; replaces the "manual structural validation" fallback.
- **v0.8.0** — **Parallel dispatcher** (L-035 evidence-gate satisfied).
  Gen-ui shipped 36 features in 21.75h via manual parallelism for a 2.97×
  speedup over a serial baseline of 64.69h. Conservative defaults
  (`max_workers: 2`), opt-in `--parallel` flag, halt-and-ask on
  out-of-order merge conflicts.
- **v0.8.1** — late-DAG depth multiplier (L-041) + run-log emission
  tightening (gen-ui dropped 2 of 36 `feature-complete` events).

## [0.6.1] — 2026-05-15

**Manual-parallelism aid + parallel-dispatch design sketch.** Closes the
"can I run features in parallel?" question with a near-free path today
(open multiple pi sessions, use `pi-epic-status --ready` to pick
non-overlapping features) and parks the full-orchestrator design in
`docs/sketch-parallel.md` for v0.7+ when real wall-clock evidence
justifies the ~16h build.

### Added

- **`pi-epic-status --ready`** — list features that are currently
  dispatchable (own state ∈ {pending, halted-ambiguous}, every dep
  merged). Default mode prints a table with the warning that overlapping
  scope_files must be dispatched serially. `--ready --quiet` (or `-q`)
  emits one feature id per line for scripting:
  `pi-epic-status --ready --quiet | head -2` to pick two for two pi
  sessions. When no features are ready, prints the top blocker deps
  ranked by how many pending features each one gates.

- **`docs/sketch-parallel.md`** — ~1-page design sketch for a v0.7+
  parallel-dispatch orchestrator. Captures: the problem, what's already
  in place (worktrees + pi-subagents parallel mode + DAG semantics +
  v0.6.1 `--ready`), the five hard problems (serial squash-merge, stale
  worktree on out-of-order merge, halt isolation, reviewer consistency,
  observability), the proposed components (batch dispatch + conflict
  pre-check + parallel worker pool + per-task review + serial merge
  queue + halt isolation), the rebase-or-fallback protocol (halt-and-ask,
  no auto-rebase), the decision gate (one real ≥20-feature epic with
  measurable serial-wait time OR two independent outside users asking),
  the cost estimate (~16h vs. v0.6.0's ~5h), and open questions. Will be
  the starting point if/when we ship; until then it just prevents
  redesigning from scratch.

### Why this and not the full dispatcher

No real evidence yet that serial dispatch is the bottleneck. kvstore was
4 features; gen-ui hasn't run. Building a 16h parallel orchestrator on
zero data points violates the project's no-bloat bias. The `--ready`
lookup is ~50 lines of Python in an existing script and lets users get
manual parallelism today — enough to find out whether they actually
want the full thing. (L-035 captures this decision.)

### Smoke test

Grew from 12 to 13 phases (added phase 13 for `--ready` correctness:
verifies F01 + F04 ready when all pending; F02 + F03 join the ready set
after F01 merges; F02 drops out when it goes in-progress and rejoins on
halted-ambiguous). 13/13 pass.

## [0.6.0] — 2026-05-14

**Verification + soft-halt release.** Closes the two biggest implicit
failure modes that the gen-ui decomposition surfaced and that
obra/superpowers' culture pack (191k☆) is also trying to address from
the opposite direction: workers hallucinating "done" without showing
their work, and ambiguous AC silently guessed at instead of paused.

Borrows the *concepts* from obra/superpowers'
`verification-before-completion`, `systematic-debugging`, and
"stop and ask" patterns, but lands them as **mechanical gates** —
shell-script checks, structured halt codes, reviewer must-cite clauses,
template completeness audits — not as prompt-only skills. The new L-034
lesson codifies that principle going forward.

One new halt code (H10), one new shell-script gate, one tightened
template, four new mandatory reviewer checks, three new lessons. No
breaking changes; v0.5.x epics in flight keep working (legacy features
without an evidence section can be merged with `--skip-evidence`).

### Added

- **L-032 — worker completion evidence (mechanical gate).** Workers must
  emit a `## Completion evidence` section in `worker-report.md` with one
  `### AC<N>:` block per acceptance criterion containing the literal
  command run + the last ~20 lines of stdout/stderr (or a `file:line`
  citation + structural claim for code-shape ACs). `pi-feature-complete`
  enforces presence of the header at the shell layer; missing evidence
  rejects the merge unless `--skip-evidence` is passed. The reviewer is
  required to spot-check at least one block by re-running the command
  — mismatched output → REQUEST_CHANGES with the specific block flagged.
  Spikes are exempt (their evidence lives in the spike template's §3/§5
  and `deviations.md`). (Concept inspired by obra/superpowers'
  `verification-before-completion` skill.)

- **L-033 — H10 soft halt code ("ambiguous AC, paused for human").**
  New halt code for ambiguities that should not block the whole epic:
  literal `TODO`/`TBD`/`<placeholder>`/`???` in AC text, missing
  scope_file that isn't part of a multi-file greenfield package (L-030
  case), upstream deviation contradicting current AC, undefined
  `design.md` symbol referenced by the AC, materially-divergent valid
  readings. On H10, `/epic-run-auto` marks the feature
  `state: halted-ambiguous`, writes a halt report with the planner or
  worker's exact question, and **continues to the next dependency-
  independent feature** — only this feature and its dependents are
  blocked, not the whole epic. When the user resolves the AC (one-line
  edit to `decomposition.yaml` or `design.md`) and re-runs
  `/epic-run-auto`, `pi-epic-next-feature`'s in-progress-first rule
  (L-010) picks the halted feature back up. Recipe documented in
  `docs/recovery.md` R8. The halt family is now H1–H7, H9 (hard),
  H10 (soft).

- **L-034 — "Every rule has a mechanical enforcement point" (meta-
  lesson).** Documented as a top-level key design choice in
  `docs/design.md`. Every new lesson, halt code, or quality bar must
  land in at least one of: a `pi-*` script gate, a reviewer must-cite
  clause that maps to REQUEST_CHANGES, a structured field the
  orchestrator parses (halt codes, `state:` enums, `kind:`), or a
  template field the reviewer audits for completeness. Prompt-only
  rules are allowed only when no good mechanical proxy exists
  (anti-sycophancy clauses, etc.) and must be flagged as exceptions.
  This is pi-epicflow's actual leverage over a culture-pack-style
  skills bundle — keep it.

- **Reviewer credibility clause (folded into L-032).** `feature-reviewer`
  must either (a) name at least one concrete weakness in the worker's
  change, or (b) explicitly list three specific things it checked and
  found clean. Rubber-stamp APPROVE with no findings and no specifics is
  rejected by the orchestrator. Cheapest available anti-sycophancy lever.

- **`docs/recovery.md` R8 — H10 recovery recipe.** Symptom → root
  cause → the one-line edit to `decomposition.yaml` or `design.md` →
  resume → prevention. Cross-linked from `prompts/epic-run-auto.md`.

### Changed

- **`templates/feature-spike.md` — ≥2 options required, ≥3 recommended.**
  Each option must list approach, pros, cons, and a falsification or
  comparison test. "Option B = do not adopt; keep status quo" is a valid
  second option for genuinely one-sided spikes. Reviewer enforces the
  floor — spikes with only one filled-in option come back as
  REQUEST_CHANGES. (Concept inspired by obra/superpowers'
  `systematic-debugging` skill; pi-epicflow already had the template,
  v0.6 makes the floor reviewer-enforced.)

- **`pi-feature-complete` — new `--skip-evidence` flag.** Mirrors
  `--skip-tests` for the evidence gate. Use for legacy v0.5.x features
  whose worker-report predates the evidence requirement, or for the
  rare case where the worker had a real reason to omit the section.

- **`agents/feature-worker.md` — H10 trigger list added** to step 2
  (planning). Replaces the old "HALT with H1" instruction for
  ambiguous AC with the more specific H10 path.

- **`agents/feature-planner.md` — H9 vs H10 distinction made explicit.**
  H9 stays for structural ambiguity (decomposition is wrong; full epic
  halt). H10 is for AC-level ambiguity (one feature halts; epic
  continues). Examples and trigger lists for both.

- **Halt family documented as two tiers in `docs/design.md`.** Hard
  halts (H1–H7, H9) stop the epic. Soft halt (H10) stops only the
  feature and its dependents.

### Fixed

_(Nothing in this release — v0.6.0 is additive. Smoke test grew
from 10 to 12 phases; phases 1–10 unchanged in behavior, phases 11
and 12 cover the new evidence-gate.)_

### Inspired by but did NOT adopt

- TDD enforcer (obra/superpowers `test-driven-development`) —
  pi-epicflow targets any epic, not just test-firstable code. A hard
  rule would break legitimate non-TDD features (configs, migrations,
  docs epics). Available as an optional planner-trigger tag, not a
  default.
- Brainstorming, root-cause, commit-hygiene skills — single-line
  ideas, folded into existing prompts where applicable, not imported
  as separate skills (per the L-034 "no skill sprawl" anti-pattern).
- Multi-harness adapters (Claude Code, Codex, Cursor, OpenCode, etc.)
  — pi-epicflow is pi-shaped and that's a feature, not a gap.
- `pi-skill-lint` for user-authored content (researcher's P4) —
  premature; reconsider when first outside-contributor PR opens.

## [0.5.2] — 2026-05-14

**UX + validation polish.** Five items — one prompt UX change already on
main, plus four items surfaced by the gen-ui epic decomposition (the
first real outside-user epic since v0.5.1). No schema changes, no
breaking changes, no new halt codes.

### Added

- **L-028 — `docs/recovery.md` (recovery playbook).** Seven named
  recipes (R1–R7) covering common stuck states: lost-journal restore
  after an L-004 `--ours` resolve; empty-squash on a non-spike
  feature; dirty tree after `pi-feature-complete` / `pi-epic-complete`
  (pre-v0.5.1 epics); feat-branch base drift; half-finished
  `pi-feature-start`; when `--skip-tests` is the right hammer; and a
  final 15-min stop-and-halt rule. Each recipe follows the same
  shape: Symptom → Root cause → Recovery commands → Verification →
  Prevention reference. Cross-linked from
  `prompts/epic-run-auto.md` §STALL HANDLING. Deferred from v0.5.1.

### Changed

- **`/epic-decompose` no longer prints the full YAML.** The prompt used to
  stream the entire proposed `decomposition.yaml` into chat as a fenced
  code block for review. On large epics (20+ features) this flooded the
  terminal, was too long to skim quickly, and added real wall-clock
  latency to the turn. New behavior: the agent **writes the draft to
  `.pi/epics/<id>/decomposition.yaml` on disk**, runs the validator for
  warnings, then POSTs a compact summary block (epic id, totals,
  dependency graph, one line per feature with id/slug/hours/deps/
  planner tags, validator warnings). The user reviews the file directly
  in their editor and either approves or requests changes; on changes
  the agent overwrites the same file and re-posts the summary. The
  file is not committed until the user approves (Steps 5+6 unchanged).
  Touches `prompts/epic-decompose.md` only — no script or schema
  changes.
- **`/epic-decompose` now stops and waits after the summary.** Previously
  the prompt instructed the agent to continue straight through Steps 3–6
  in the same turn once it detected an approval signal. New behavior:
  after posting the draft summary the agent **STOPS** and waits for the
  user's next message before proceeding. Approval still triggers
  Steps 3–6, but in the user's approval turn rather than the proposal
  turn. This adds a real human-in-the-loop checkpoint before the
  commit.

### Fixed

- **L-029 — `depends_on` range syntax is now caught with a useful
  error.** Range strings like `[F06-F09]` or `F06-F09` look like YAML
  range syntax but YAML doesn't expand them — the dispatcher treats
  `"F06-F09"` as a single literal feature ID that doesn't exist,
  silently breaking the dependency graph. Previously the validator
  caught this with a generic `depends_on '...' is not a defined feature`
  error that didn't point at the underlying mistake. Now:
  - `pi-epic-validate-decomposition` matches the range pattern
    `^[FS]\d+-[FS]\d+$` and emits an error naming the fix inline:
    *"Expand to an explicit list, e.g. depends_on: [F06, F07, F08, F09]."*
  - `prompts/epic-decompose.md` Step 1 has a new L-029 callout banning
    range syntax explicitly.
  - Near-miss in gen-ui decomposition: seven features had range
    strings in the summary view; user caught it during review.
- **L-030 — validator's parent-dir-missing warning no longer floods
  greenfield decompositions.** The warning was designed to catch stale
  paths from earlier layouts, but on epics that build new packages
  (gen-ui: ~10 new directories with multiple files each) it fired once
  per file: 50+ false-positive lines that drowned real warnings. Now:
  - Pre-compute per-directory scope_file counts across the entire
    decomposition.
  - Suppress the warning when 2+ scope_files share the same (missing)
    parent dir — evidence the user is building a new package on
    purpose, not pointing at a stale path.
  - Single-file-in-new-dir entries still warn (those could be stale).
  - Warning message now also tells the user how to silence it
    explicitly: *"add a second scope_file under '<parent>/' to confirm
    intent."*
- **L-031 — spike numbering convention.** Smoke epic used `S01,F02..F04`
  (spike at the top); gen-ui used `F01..F03,S04,F05..` (spike after
  early catalog work). Both work mechanically. The second is clearer:
  the id reflects DAG position, not just "this is a spike". Encoded in
  `prompts/epic-decompose.md` Step 1: place spikes at the position in
  the dependency order where they naturally fall, sharing the numeric
  counter with features.

## [0.5.1] — 2026-05-14

**Bug-fix release.** Six tooling sharpenings traced to specific artifacts
in the kvstore v0.5.0 smoke epic (`0001-smoke`). No schema changes; no
new halt codes; no breaking changes. Epics produced under v0.5.0 keep
working.

### Fixed

- **L-023 — `pi-feature-complete` spike path.** Spike completion was
  broken in three interlocking ways. The smoke epic's S01 spike
  required manual `git reflog` recovery. Now fixed structurally:
  - `pi-feature-start` writes + commits the scaffold to the epic
    branch **before** creating the feat branch, so feat inherits the
    scaffold commit (was: branched first, committed scaffold later —
    feat had nothing).
  - `pi-feature-complete` for `kind: spike`: commits the worker's
    MAIN_REPO journal edits (`feature.md`, `meta.yaml`,
    `deviations.md`) to the epic branch first as `spike(<id>):
    decision + journal`, then proceeds. The subsequent
    `git merge --squash $feat_branch` produces an empty diff (feat
    has only scaffold); allowed via `--allow-empty` for spikes only.
  - Smoke test step 7 added: end-to-end spike workflow with no manual
    intervention.
- **L-024 — decomposer + validator catch symbol-path scope holes.**
  When an AC names a fully-qualified symbol path
  (`module.errors.X`, `pkg.module.Class`), the file owning that
  symbol must appear in this feature's `scope_files` — or in an
  upstream merged dependency's scope. v0.5.0 silently allowed this
  (smoke epic F03 added `LockedError` to `errors.py` despite
  `scope_files: [engine.py, test_engine.py]`).
  - `prompts/epic-decompose.md` Step 1: new L-024 callout requires the
    decomposer to walk every AC bullet, extract dotted symbol paths,
    and include the owning file in scope_files.
  - `pi-epic-validate-decomposition`: new warning when an AC mentions
    `dotted.module.ClassName` and no `scope_files` entry (this
    feature's or a dep's) heuristically maps to that module. Strips
    leading `src/`, `lib/`, `app/`, `source/`; matches
    `pkg/module.py` and `pkg/module/__init__.py`. Heuristic +
    warn-only — false positives don't block.
- **L-025 — `pi-epic-complete` commits the archive rename.** Previous
  behavior: `mv .pi/epics/<id> .pi/epics/done/<id>` on the
  filesystem, no `git mv`, no commit — epic ended with a dirty
  working tree (smoke epic needed a manual `git add -A && git commit`
  to clean up). Now: prefer `git mv` (stages the rename), fall back
  to `mv` + `git add -A` for repos with untracked siblings; sweep the
  destination for newly-written files (`lessons-candidate.md`,
  `epic-review.md`); commit as
  `chore(epic): archive <id> to .pi/epics/done/`.
  - Same fix applied at the per-feature level in
    `pi-feature-complete`: the `mv features/<fid> features/done/<fid>`
    now commits as `chore(epic): archive <fid> to features/done/`,
    independent of the next `pi-feature-start`'s pending-edits sweep.
  - Smoke test step 8 added: `git status --short` is empty after
    `pi-epic-complete`.
- **L-026 — `.gitignore` template gaps closed.** The v0.5.0 patterns
  matched only `.pi/epics/*/...` (one segment), so after
  `pi-epic-complete` archived the epic to `.pi/epics/done/<id>/`,
  worker/review/progress reports + the run-log became un-ignored
  (smoke epic shipped 11 `.pyc` files into the epic branch as a
  side-effect). `pi-epic-init` now adds:
  - `.pi/epics/done/*/run-log.jsonl`
  - `.pi/epics/done/*/features/done/*/worker-report.md`
  - `.pi/epics/done/*/features/done/*/review-report.md`
  - `.pi/epics/done/*/features/done/*/progress.md`
  - `__pycache__/` (universal — noise on non-Python repos, real
    hygiene win on Python repos)
  - `*.pyc`
- **L-027 — decomposition.yaml template clarifies AC vs summary.** The
  smoke epic's F03 `summary` said compaction preserved order via
  "latest surviving SET" while the AC + design required first-
  occurrence order. Code correctly followed the AC; epic-reviewer
  caught the drift post-hoc. Template now has a header comment
  stating `acceptance_criteria` is normative; `summary` is
  informative; on conflict, implementation follows AC.

### Changed

- `pi-feature-start` reorders the scaffold commit to happen before feat
  branch creation. Non-spike features behave identically (the scaffold
  is the same files they'd write on top of); spike features now
  produce a usable feat branch.
- `install/smoke-test.sh` extended from 6 to 8 phases. New phases:
  - **[7/8]** L-023 spike workflow end-to-end (no manual recovery).
  - **[8/8]** L-025 clean tree after `pi-epic-complete`.

### Deferred

- L-028 (orchestrator recovery playbook for L-019/L-004 collisions) —
  the underlying bugs are fixed by L-023, so the recovery doc is
  hygiene rather than blocker. Tracked for v0.5.2.

## [0.5.0] — 2026-05-14

**Hybrid planner architecture.** Every feature now writes a plan section
before any code edits (always-on baseline). Features flagged
`needs_planner: true` in `decomposition.yaml` additionally get a dedicated
`feature-planner` subagent pass that produces a binding `plan.md`. New
halt code **H9** (planner-blocked) surfaces unresolvable ambiguities to
the human BEFORE worker time burns. New `kind: spike` for decision-only
features. Three v0.4-baseline decomp-quality fixes (L-019/L-020/L-021)
landed in the same release.

Motivated by partner-agent-sdk's F06 halt (AC assumed engine call sites
that didn't exist) and by readiness for the Harmony GenUI v2 epic
(~75-100 features, cross-language, 19 open questions).

### Added

- **`feature-planner` subagent** (`agents/feature-planner.md`). Runs
  before `feature-worker` when the orchestrator's planning gate fires
  (§3.5 in `prompts/epic-run-auto.md`). Reads design + decomposition +
  `reference_paths` + repo code; produces `FEATURE_DIR/plan.md` listing
  files-to-touch, AC interpretations with literal expected behavior,
  ambiguities, and anti-scope. Worker treats `plan.md` as a binding
  contract; deviations require a `deviations.md` entry. Reviewer
  validates plan-vs-impl alignment.
- **Always-on worker plan-first contract.** `feature.md` §4 is now a
  structured Plan section (files-to-touch, AC interpretations,
  ambiguities, anti-scope). Worker fills it BEFORE first edit, even for
  features without a dedicated planner pass. Reviewer enforces.
- **`kind: feature|spike`** in `decomposition.yaml`. Spikes ship a
  decision artifact in `deviations.md` instead of code; `pi-feature-start`
  uses a different journal template (`feature-spike.md`);
  `pi-feature-complete` skips test runs for spikes. Spike IDs use
  `S<NN>` prefix sharing the same numeric counter as features. Capped at
  8 estimated hours.
- **`needs_planner: bool` + `planner_triggers: [list]`** per-feature
  fields in `decomposition.yaml`. Trigger checklist in
  `prompts/epic-decompose.md`: tag if ≥2 of 7 triggers fire
  (unverified-callsites, format-sensitive-ac, scope-crosses-modules,
  deep-dep-chain, large-estimate, many-acs, cross-cutting-verb).
  Threshold tunable via `PI_EPICFLOW_PLANNER_THRESHOLD`.
- **`reference_paths:` epic-level field** in `decomposition.yaml`. Paths
  the planner-subagent always reads when planning a tagged feature.
  Files >100KB are noted but not pulled into context. Generic mechanism;
  the user populates with project-specific paths (POC code, findings
  docs, prior-art ADRs).
- **Halt code H9 — planner-blocked.** Fired when `feature-planner`
  surfaces an unresolvable ambiguity (missing call sites, contradictory
  AC, undefined pattern). Decomposition needs human input before the
  feature can proceed.
- **`pi-epic-init --no-planner`** escape hatch. Persists
  `disable_planner: true` to epic `meta.yaml`; planning gate honors it.
- **`feature-spike.md` journal template** with structured decision
  shape: Options Considered / Decision / Evidence / Impact / Plan.
- **L-019: `pi-feature-start` auto-commits scaffolded feature folder**
  to the epic branch immediately after creating it. Fixes the F01/F02
  add/add merge conflict class hit on every feature of
  partner-agent-sdk. Idempotent.
- **L-020: validator rejects unsafe-leading-char AC strings.**
  `pi-epic-validate-decomposition` errors on any unquoted AC starting
  with `*`, `&`, `!`, `|`, `>`, `%`, `@`, or backtick. Strict-YAML
  parsers reject these; the lenient parser tolerated them silently in
  partner-agent-sdk's decomposition.yaml the entire epic.
- **L-021: validator warns on stale `scope_files` paths.** Non-glob
  entries whose parent dir doesn't exist produce a warning (likely
  carryover from an earlier layout). Same check applied to
  `reference_paths`.
- **L-018-stronger: validator warns on golden/snapshot/wire-shape AC
  without inline literal sample.** AC mentioning "golden", "snapshot",
  "wire shape", "wire format" must include a fenced code block or quoted
  literal with the expected value.

### Changed

- `prompts/epic-run-auto.md`: new step 3.5 — planning gate; new STATUS
  phase `planning <fid>`; halt codes section updated with H9.
- `prompts/epic-decompose.md`: trigger checklist, spike-feature
  conventions, `reference_paths` field, manifest fan-out hint,
  L-018/L-020 literal-sample rules.
- `agents/feature-worker.md`: §1 reads `plan.md` if present; §2
  mandatory Plan section; §3 spike-mode loop; §7 deviations triggers
  expanded to include plan-vs-impl drift.
- `agents/feature-reviewer.md`: plan-vs-impl validation block;
  spike-mode validation; new output `## Plan-vs-impl` section.
- `skills/epic-feature-workflow/templates/decomposition.yaml`: documents
  new fields, trigger list, spike example.
- `skills/epic-feature-workflow/templates/feature.md`: §4 restructured
  into mandatory Plan.
- `pi-feature-start`: reads `kind` from decomposition; selects journal
  template; commits scaffold to epic branch (L-019).
- `pi-feature-complete`: spikes skip the test run.
- `pi-epic-validate-decomposition`: see "Added" items above.
- `install/postinstall.mjs`: copies `feature-planner.md` alongside
  worker/reviewer.

### Migration

Legacy `decomposition.yaml` files without the new fields (`kind`,
`needs_planner`, `reference_paths`) validate cleanly — fields default to
`feature` / `false` / `[]`. No schema migration required for in-flight
epics. Mid-epic upgrades are safe: the planning gate is a no-op for
features without `needs_planner: true`.

## [0.3.1] — 2026-05-14

Small additive feature plus the new Vite/React marketing site.

### Added
- **`pi-epic-init --base <branch>`.** Override the parent branch the epic
  branches off from (default: repo's auto-detected default branch).
  Resolves against `refs/heads/<branch>` first, then `refs/remotes/origin/<branch>`,
  and fetches before checkout so a clean tracking branch is created. The
  override is persisted in `meta.yaml` as `default_branch:` so downstream
  scripts (`pi-feature-start` worktree base, `pi-epic-complete` PR target)
  use the right branch. Unknown branch → fast-fail with a clear error
  listing the refs checked; no side-effects on the working tree.
  Use case: epics that target a release branch instead of `main`.
- **Vite/React marketing site** under `site/` deployed to GitHub Pages via
  `.github/workflows/deploy-site.yml`. Replaces the prior Jekyll layout
  under `docs/`. Source = GitHub Actions, base path `/pi-epicflow/`.

### Changed
- README script reference now lists `--base` on the `pi-epic-init` row.

## [0.3.0] — 2026-05-14

First end-to-end run by an outside user (`taskq`, 5 features). Three real
bugs surfaced and were fixed; the auto-mode install path got the polish it
needed; release-readiness is now tracked in `docs/RELEASE-CHECKLIST.md`.

### Added
- **postinstall auto-installs auto-mode deps.** `install/postinstall.mjs`
  now ensures `npm:pi-subagents` (required for `/epic-run-auto`) and
  `npm:pi-intercom` (recommended) are installed at the same scope as
  pi-epicflow itself. First run in a fresh environment no longer halts
  mid-epic with *"subagent tool not available"* and forces a pi-session
  restart (the L-011 backstop still applies if this step is skipped or
  fails). Detection of "already installed" is via the relevant
  `settings.json`'s `packages` array, so re-runs are idempotent. Opt out
  with `PI_EPICFLOW_NO_AUTOINSTALL_DEPS=1`.
- **`docs/RELEASE-CHECKLIST.md`** — explicit pre-1.0 gate (multiple
  outside epics, macOS run, deliberate-failure tests for H4/H6/H7, CI
  matrix). Tracks what "public release" means at each semver step so the
  bar doesn't slip.
- **L-016, L-017** appended to
  `skills/epic-feature-workflow/lessons.md` documenting the python3
  interpreter rule and the halt-file gitignore-as-belt rule.

### Fixed
- **L-016 — `python` vs `python3` autodetect.** `/epic-decompose` Step 3
  used to propose `python -m pytest -q` whenever `pyproject.toml` was
  found. On modern Debian/Fedora/Arch (no `python` symlink) every feature
  then halted at H1 even though the worker's tests passed under
  `python3`. The prompt now checks `command -v python3 || command -v
  python` (in that order) and proposes the interpreter that actually
  exists.
- **L-017 — halt files leaking into the epic branch.** L-012 fixed the
  most common path (`pi-feature-start`'s auto-commit train); the
  orchestrator's FINALIZE retry block was a second leak. Three fixes:
  - `pi-epic-init` now writes `.pi/epics/*/halt-*.md` and
    `.pi/epics/done/*/halt-*.md` into `.gitignore` (belt). A stray
    `git add` typo can no longer stage a halt file.
  - The orchestrator's FINALIZE step 5 BLOCK-recovery now spells out
    "stale halt reports are fixed by **deleting** them, not by committing
    them" with the exact `git rm` + `rm` recipe and the same
    `git reset HEAD halt-*.md` belt as the main closeout commit.
  - Both rules cross-referenced in `lessons.md` so the next prompt
    iteration can't undo them silently.
- **Orchestrator skipped `pi-epic-complete` after epic-review APPROVE.**
  Step 6 was a single sentence and ambiguous about whether the
  orchestrator was "done" once `epic-review.md` was committed. Result:
  the taskq epic shipped with `meta.status: in-progress`, journal
  un-archived, deviations un-distilled — the user had to know to run
  `pi-epic-complete` themselves, defeating the point of auto mode. The
  step now spells out the mandatory script call (with `--no-pr` fallback
  for repos without an `origin` remote), the failure-mode-to-halt-code
  mapping, and a FINAL STATUS template that's only legal to post AFTER
  `pi-epic-complete` returns 0.

## [0.2.1] — 2026-05-13

Doc polish + L-015 prompt fix.

### Fixed
- **L-015** — `/epic-decompose` no longer stops after the *"Looks good?"*
  approval prompt. Real-world: pi presented the YAML, asked for feedback,
  user said *"approved"*, pi treated that as end-of-turn and exited —
  decomposition.yaml never got written. The prompt now spells out
  explicitly that approval signals (*"yes"*, *"lgtm"*, *"ship it"*, etc.)
  are the trigger to immediately continue to write+validate+commit in the
  same turn. The deliverable is the committed YAML, not the chat YAML.
  Same fix applied to the Step 6 commit prompt.

### Added
- **README** — new top-of-file sections so a first-time reader gets the
  *why* before the *how*:
  - "The problem this solves" — names the five failure modes of
    naive-agent-in-one-context: context budget, unreviewable PRs, no
    checkpoint, silent scope drift, no memory across runs.
  - "How it works — the mental model" — ASCII diagram of the full pipeline
    plus the four design keys (fresh subagent contexts, worktree per
    feature, YAML-not-chat decomposition, halt-don't-guess).
  - "Two modes" — explicit comparison of auto vs manual, with guidance on
    when to mix.
  - "A worked example" — full pi chat transcript of shipping a 3-feature
    Python todo CLI (`todoq`).
  - "When NOT to use this" — sets expectations on the floor (single-PR
    changes, polyrepo, multi-user concurrent, throwaway exploration).
  - "FAQ" — eight common worries answered (difference vs single branch,
    auto mode optionality, bad decompositions, test failures, parallelism,
    crash recovery, Windows support, lock-in).
- **README badges** — smoke-test CI, license, pi version.

## [0.2.0] — 2026-05-13

UX polish. Same workflow contract — the *commands* the user types are now
three, not seven.

### Added
- **`/epic-decompose` prompt template** — packaged slash command that
  proposes + refines + validates + commits `decomposition.yaml`. No more
  hand-writing YAML or remembering which validator script to run. Discovers
  the active epic from `STATE.md`, reads design.md + lessons.md, presents
  the YAML in chat with an ASCII dep-graph, iterates on user feedback, then
  writes/validates/commits when approved. Also auto-sets `test_cmd` in
  `epic-config.yaml` by sniffing the repo (`pyproject.toml` → pytest,
  `Cargo.toml` → cargo test, etc.).
  - Flags: `--features=N`, `--auto-commit`.
- **`/epic-run-auto` self-bootstrap** — if `decomposition.yaml` is empty,
  `/epic-run-auto` now inlines the `/epic-decompose` flow first instead of
  halting. The whole pipeline runs from a single slash command.
  - New flag: `--no-bootstrap` to opt out and halt with H3 instead.

### Changed
- **README quickstart** — collapsed to the three-command flow
  (`pi-epic-init` → `/epic-decompose` → `/epic-run-auto`). Manual-mode and
  auto-mode deep-dive sections retained for power users.
- **SKILL.md** — added a top-level "three-command flow" section so when pi
  is asked "how do I start a multi-feature change", it points at the slash
  commands rather than the shell scripts.
- **Lifecycle diagram** — step 2 is now `/epic-decompose`, not
  `pi-epic-decompose` (there was never a script by that name).

### Notes
- No script changes — the underlying `pi-*` scripts are byte-identical to
  v0.1.0. The decomposition slash command shells out to
  `pi-epic-validate-decomposition` and `git` exactly as a human would have.
- Postinstall behavior unchanged.
- Upgrade path: `pi update git:github.com/shankar029/pi-epicflow`. Restart
  any open pi session to pick up the new prompt template.

## [0.1.0] — 2026-05-13

Initial public release. Carved out of the personal `epic-feature-workflow`
skill after end-to-end validation on two sample epics (4-feature and
12-feature, the latter with a 7-level DAG and shared-scope serialization).

### Added
- **Skill** `epic-feature-workflow` — the workflow contract, halt codes, lesson
  trail, and templates.
- **Scripts** `pi-epic-init`, `pi-epic-next-feature`, `pi-epic-validate-decomposition`,
  `pi-epic-status`, `pi-epic-complete`, `pi-feature-start`, `pi-feature-complete`.
  Symlinked into `~/.local/bin` by the postinstall hook.
- **Templates** for `design.md`, `decomposition.yaml`, `epic-config.yaml`,
  per-feature `meta.yaml` / `feature.md`, `halt-report.md`, `deviations.md`.
- **Agents** `feature-worker` and `feature-reviewer` — installed to
  `~/.pi/agent/agents/` by the postinstall hook so they're discoverable by
  `pi-subagents`.
- **Prompt** `/epic-run-auto` — the orchestrator template that turns the main
  pi session into a thin loop delegating each feature to a `feature-worker`
  subagent and each pre-merge review to a `feature-reviewer` subagent, with
  STATUS heartbeats and §STALL HANDLING.
- **Postinstall** (`install/postinstall.mjs`) — defensive, idempotent agent
  copy + bin symlink. Honors `PI_EPICFLOW_AGENTS_DIR`, `PI_EPICFLOW_BIN_DIR`,
  `PI_EPICFLOW_SKIP_POSTINSTALL`.
- **Smoke test** (`install/smoke-test.sh`) — end-to-end verification of
  `pi-epic-init → pi-feature-start → pi-feature-complete` in a throwaway repo,
  exercising the L-012 / L-013 / dispatcher invariants.
- **GitHub Actions** CI running the smoke test + shellcheck on every push.

### Documented lessons baked into the workflow
- **L-001..L-009** — empirical lessons captured from the 4-feature sample
  (commit-msg style, deviations log discipline, design.md anchor stability,
  per-feature ADRs, etc.). See `skills/epic-feature-workflow/lessons.md`.
- **L-010** — `pi-epic-next-feature` prefers `in-progress` over `pending` so
  a halt-then-resume picks up the active feature instead of leaking its
  worktree by starting a new one in parallel.
- **L-011** — local extension installs need the full transitive deps tree
  and the correct `settings.json` schema (`"packages"`, not `"extensions"`).
- **L-012** — `pi-feature-start` `git reset HEAD halt-*.md` after staging
  so halt reports never auto-commit onto the epic branch.
- **L-013** — `pi-feature-start` advances `meta.yaml` `status: design →
  in-progress` on first invocation; `pi-epic-complete` sets `done`.
- **L-014** — orchestrator template has an explicit closeout-commit step
  before epic-review, with one allowed retry on working-tree-only BLOCK
  verdicts.

[Unreleased]: https://github.com/shankar029/pi-epicflow/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/shankar029/pi-epicflow/releases/tag/v0.2.1
[0.2.0]: https://github.com/shankar029/pi-epicflow/releases/tag/v0.2.0
[0.1.0]: https://github.com/shankar029/pi-epicflow/releases/tag/v0.1.0
