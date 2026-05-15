# pi-epicflow — Design

This document is the "why" behind the workflow. The "what" (commands,
shapes of files, halt codes) lives in the [README](../README.md). The "how
the orchestrator runs" lives in
[`prompts/epic-run-auto.md`](../prompts/epic-run-auto.md).

## The problem

When you sit down to ship a non-trivial change with an AI coding agent, the
day-1 workflow is some variant of:

1. Sketch a design.
2. Implement it end-to-end in one big context window.
3. Tests pass; commit; PR.

That works for ~100-line changes. It breaks for anything bigger because:

- **Context budget.** Implementing 12 features in one context window eats
  tokens, slows down each turn, and makes the agent fragile to long-tail
  errors. Each new line of code makes every prior line more expensive to
  re-read.
- **Reviewability.** A single 5,000-line PR is unreviewable in practice. The
  human ends up either rubber-stamping it or asking for it to be broken up,
  which costs the same time twice.
- **Recoverability.** If anything goes wrong mid-way (test breaks, design
  ambiguity, agent stall), the whole thing has to restart. There is no
  resumable checkpoint.
- **Scope drift.** Without an explicit per-feature scope, the agent edits
  files no one asked about. The reviewer can't tell intentional changes from
  drift.

## The shape of the solution

Three observations drove the design:

1. **Most non-trivial work decomposes naturally into 5–20 small features**,
   each implementable in 20–60 minutes by a focused agent with one feature's
   worth of context.
2. **Git already has a primitive for "I want to work on N things in parallel
   that share a base"**: worktrees + topic branches.
3. **The thing humans actually want to review is the squash-merged feature
   sequence**, not the agent's intermediate commits. A clean linear epic
   branch with 12 `feat(F01..F12): …` squash commits is reviewable in a
   sitting.

So the workflow is:

```
human + pi co-design  →   design.md
       ↓
pi proposes decomp    →   decomposition.yaml (DAG of features)
       ↓
human approves
       ↓
loop:
  pick next ready feature  ─┐
  create worktree+branch    │
  implement (worker)        │   ← optionally a sub-agent
  test                      │
  review (reviewer)         │   ← optionally another sub-agent
  squash-merge to epic      │
  archive feature folder    │
  log deviations            │
                          ←─┘
       ↓
all done?
       ↓
epic-wide review
       ↓
push epic branch + open ONE PR to main
```

The epic branch lives long-term until the PR merges. The feature branches
are ephemeral. The journal (`.pi/epics/<id>/`) is the source of truth for
state.

## Key design choices

### Worktrees per feature, not branch-switching

Each feature gets its own checkout at `<repo>-F<NN>/`. The main checkout
stays on the epic branch.

Why:
- No `git stash` dance when interrupted.
- Multiple features could be worked in parallel (though the orchestrator
  currently serializes them — see below).
- Subagents get a clean cwd that points at exactly one feature's worth of
  files.

### Squash-merge, not merge or rebase

Every feature lands as a single `feat(F<NN>): <title>` commit on the epic
branch. The feature branch is then deleted.

Why:
- The agent's intermediate commits ("fix typo", "wip", "actually this one")
  are noise. Squash hides them.
- The epic branch's history reads as a clean feature timeline. Reviewers
  navigate it by feature, not by commit.
- Rebasing the feature branch before merge would force-update the worker's
  branch and confuse anyone watching it.

### The decomposition is YAML, not a chat thread

`decomposition.yaml` is the contract. It enumerates features, their
dependencies, scope files, acceptance criteria, and estimated hours. The
human approves it explicitly before any feature is started.

Why:
- A YAML file is reviewable, diff-able, and version-controlled.
- Once approved, neither pi nor the human can silently change the plan —
  any departure goes into `deviations.md` with a reason.
- `pi-epic-validate-decomposition` enforces invariants (no cycles, IDs
  unique, scope files unique, all deps point to real IDs) before any work
  starts.

### Halt, don't guess

When the agent is unsure (test fails repeatedly, design is genuinely
ambiguous, merge conflict on epic, **planner can't resolve a fact**), it
halts with one of nine well-defined codes (H1–H7, H9, H10) and writes a
`halt-<UTC>.md` with the exact resume command. It does NOT try three
different things in a row.

The halt codes split into two severity tiers:

- **Hard halts (H1–H7, H9):** the whole epic stops. Resume requires the
  user to take an action (commit/stash, edit decomposition, fix env, etc.).
- **Soft halt (H10) — added in v0.6:** only this feature stops; the
  orchestrator skips to the next dependency-independent feature in the DAG
  and keeps going. Used for ambiguous AC that the planner or worker found
  during runtime (literal `TODO`/`TBD`, missing scope_file, contradicting
  upstream deviation, undefined design symbol). Lets the user clarify one
  feature without blocking the other ten.

Why:
- A bad guess at hour 3 of a 12-feature run wastes hours. A halt loses
  ~minutes.
- Halt-reports become the conversation between the agent and the human —
  far better than a multi-page chat log.
- Resume is just `/epic-run-auto`; no special restart mode.

### Plan before code (v0.5)

Every feature writes a structured plan in `feature.md` §4 *before* the
worker makes its first edit — files-to-touch, AC interpretations
(literal expected behavior), ambiguities, anti-scope. Features tagged
`needs_planner: true` in `decomposition.yaml` additionally get a
dedicated `feature-planner` subagent pass that produces a binding
`plan.md` in `FEATURE_DIR/`. The worker treats `plan.md` as a contract
(deviations require a `deviations.md` entry); the reviewer validates
plan-vs-impl alignment.

Why:
- The single biggest source of mid-implementation halts (in real epics)
  is *AC interpretation*: the worker reads an AC like "golden file
  matches output" and guesses the byte layout. Forcing a written
  interpretation up front converts a 2-hour worker crisis into a
  10-minute review of plan.md.
- The planner subagent runs in a *read-only* context with the entire
  design + reference paths + repo loaded — a context budget the worker
  shouldn't have to pay. Workers come in with a focused, decided plan.
- For features without `needs_planner: true`, the always-on §4 Plan
  section still surfaces the worker's intent before any edit; reviewers
  catch silent deviations.

Triggers (any 2 of 7 → tag `needs_planner: true` in
`decomposition.yaml`): unverified-callsites, format-sensitive-ac,
scope-crosses-modules, deep-dep-chain, large-estimate, many-acs,
cross-cutting-verb. Threshold tunable via
`PI_EPICFLOW_PLANNER_THRESHOLD`. Disable per-feature
(`needs_planner: false`) or per-epic (`pi-epic-init --no-planner`).

### Spikes for decisions, not code (v0.5)

When an open question blocks 2+ downstream features ("CRC32 vs xxhash?",
"which seam to decorate?", "hand-roll vs library?"), don't paper over it
in AC. File a **spike**: a feature with `kind: spike` whose deliverable
is a structured Decision / Evidence / Impact entry in `deviations.md`,
not production code.

Why:
- Without spikes, the orchestrator either (a) halts mid-feature with H9
  when the planner discovers the gap, or (b) ships code that locks in
  the wrong choice silently. Both are expensive.
- Spikes are bounded (8h cap), reviewable (the decision lands in git as
  a squash-merge on the epic branch), and feed straight into downstream
  planners (which see the updated design + deviation).
- Spike workers run a different loop: read code, prototype, benchmark,
  log decision. `pi-feature-complete` skips test runs.
  `feature-reviewer` checks decision quality, not test results.

### Deviations are first-class

`deviations.md` is append-only. Every time the implementation departs from
`decomposition.yaml` — out-of-scope edit, AC re-interpretation, dismissed
review finding, design ambiguity call — pi writes an entry with *what* and
*why* and *what should have been in the original plan*.

Why:
- Spec ambiguity is the single biggest source of friction. Capturing each
  case feeds back into better decomposition next time.
- Reviewers (human or agent) can audit the difference between *plan* and
  *what was built* without rereading every diff.
- At `pi-epic-complete`, deviations are distilled into the global
  `lessons.md`. The skill literally gets smarter every epic.

### Every rule has a mechanical enforcement point (v0.6)

When a new lesson, halt code, or quality bar gets added, the change MUST
land somewhere a shell script, validator, reviewer-must-cite clause, or
git-state check can fail loudly. Prompt-only rules ("the worker should
…") fail silently when the model ignores them and quietly bit-rot over
time.

Concretely, every rule lands in at least one of:
- a `pi-*` script gate (`pi-feature-complete` rejects missing evidence,
  `pi-epic-validate-decomposition` rejects range syntax, etc.),
- a reviewer must-cite clause (the reviewer's verdict requires citing
  the rule's evidence; missing evidence → REQUEST_CHANGES),
- a structured field the orchestrator parses (halt codes, `state:` enum,
  `kind: feature|spike`), or
- a template the reviewer audits for completeness (≥2 spike options,
  per-AC evidence blocks).

Why:
- Lessons L-019, L-023, L-025, L-028, L-029, L-030 all happened because
  earlier prompt-only suggestions weren't enough to prevent the bug.
  Each lesson's fix added a mechanical gate.
- Pi-epicflow's core leverage over a culture-pack-style "skills bundle"
  is that the orchestrator runs shell scripts the agent can't avoid.
  Keep that leverage. Don't drift toward prompt-only rules just because
  they're easy to write.
- Exceptions are rare and should be documented (e.g. anti-sycophancy
  clauses where there's no good mechanical proxy — those stay as
  reviewer must-cite rules).

## The two operating modes

### Manual mode

The human is the agent. They call `pi-epic-init` / `pi-feature-start` /
`pi-feature-complete` from a shell. Pi may or may not be involved per
feature; the scripts don't care.

Use when:
- You want to drive the loop yourself.
- You're using a model/setup where subagents aren't available.
- You're learning the workflow and want to see every step.

### Auto mode

`/epic-run-auto` turns the main pi session into a stateless orchestrator
loop. It:

1. Reads `STATE.md` + `decomposition.yaml` + `epic-config.yaml` + tail of
   `run-log.jsonl`.
2. Calls `pi-epic-next-feature`.
3. For each feature: spawns a `feature-worker` subagent with the feature's
   FEATURE_DIR + worktree path, reads its `worker-report.md`, spawns a
   `feature-reviewer` subagent on the same worktree, reads the verdict,
   calls `pi-feature-complete`, posts a STATUS heartbeat, loops.
4. At the end, spawns an epic-wide reviewer, makes a closeout commit if
   needed, calls `pi-epic-complete`, posts a final STATUS.

The orchestrator carries no implementation context across iterations — each
worker gets a **fresh** subagent context with only the FEATURE_DIR's worth
of state. The orchestrator's own context budget grows only by the size of
each worker's report (~1 KB).

#### Why subagents

Three reasons:

1. **Context isolation.** A worker that spends 80 KB of context implementing
   F03 doesn't pollute the orchestrator's context or F04's worker's context.
2. **Fault isolation.** A worker that hangs or crashes is killed and
   respawned without losing the orchestrator's state.
3. **Telemetry.** `pi-subagents` exposes `status` / `interrupt` / `resume`
   actions that the orchestrator uses to detect and unstick stalls
   (§STALL HANDLING in the prompt template).

#### Why fresh contexts (no `continue`)

The contract says each new worker/reviewer starts in a fresh context. We
could in principle `continue` a previous worker for a related feature, but:

- Fresh contexts force the worker to read the design + decomposition + its
  feature.md every time. That's exactly the discipline we want — they can't
  silently rely on what they "remembered" from the last feature.
- It makes the system robust to model/provider switches between features.
- Token cost: a fresh-context worker pays the read-the-design tax once;
  reusing a context would pay it across every feature it's reused for.

#### Why phase 1 is serial

The skill could in principle run two features in parallel if their DAG nodes
are independent. We chose serial-by-default because:

- Sub-agents in pi-subagents can already write to shared paths
  (decomposition tells the worker its `scope_files`, but the worker can in
  practice edit anything in the worktree).
- A second worker started concurrently couldn't squash-merge into the epic
  branch atomically — two `pi-feature-complete` invocations racing for the
  same epic branch is a recipe for spurious conflicts.
- Wall-clock dominance is currently in compute (worker token throughput),
  not in coordination. Parallelism would help most for I/O-bound features
  (build + test cycles); that's a future optimization with explicit lock
  primitives.

### The orchestrator state machine

Steps 0–14 in `prompts/epic-run-auto.md` describe the loop. The
non-obvious bits:

- **Step 0 (budget check).** If `--max-features=N` was passed and we've
  already merged N, stop cleanly — do not even call `pi-feature-start` for
  the next one. This is the right place: any later check leaves an
  orphan worktree.
- **Step 5 (worker spawn).** Pass MAIN_REPO + EPIC_DIR + FEATURE_DIR + the
  feature id as absolute paths in the task message. The worker's
  `cwd` is the worktree, which makes the test-running and editing
  ergonomic but means it should NEVER write to `EPIC_DIR` relatively.
- **Step 12 (post-merge cleanup awareness).** After `pi-feature-complete`,
  the feature dir has moved from `EPIC_DIR/features/<fid>-<slug>/` to
  `EPIC_DIR/features/done/<fid>-<slug>/`. The orchestrator must not write
  to the original path.
- **§STALL HANDLING.** When pi surfaces a needs-attention notice, the
  orchestrator INSPECTs (`subagent({action:"status"})`) before acting,
  classifies the worker (working-long-tool / thinking / looping / stalled
  / awaiting-decision / crashing), NUDGEs once (`resume` with a specific
  message), then INTERRUPTs if no progress, with a forensics pass over
  the run's `output-*.log` + `events.jsonl`. Hard caps prevent runaway
  retries.

## What this is NOT

- **Not a CI/CD system.** No watch-and-rebuild, no deployment, no
  scheduling. It's a workflow for landing one big change as one PR.
- **Not a code-review tool.** The feature-reviewer subagent is a stop-loss,
  not a substitute for human review of the final epic PR.
- **Not magic.** If the decomposition is bad, the workflow will faithfully
  ship the bad decomposition. The decomp + design are the leverage points.
- **Not multi-user.** Two humans sharing one epic branch should coordinate
  via PR review or work on different epics. The state in `.pi/epics/<id>/`
  has no locking.

## What we expect to evolve

- **Optional parallelism** for independent DAG nodes once a per-feature
  lock around squash-merge is in place.
- **Richer telemetry** in the run-log (current draft is JSONL of events;
  could include token counts, tool counts, retries).
- **Cross-repo epics** — an epic that touches more than one repo via
  submodule or polyrepo. Probably needs a separate `pi-epic-link` script.
- **Pluggable test_cmd matrix** — currently one `test_cmd` per epic. Some
  features benefit from running a subset (faster) plus a final full pass
  on completion.

## References

- The skill contract: [`skills/epic-feature-workflow/SKILL.md`](../skills/epic-feature-workflow/SKILL.md)
- The orchestrator prompt: [`prompts/epic-run-auto.md`](../prompts/epic-run-auto.md)
- Empirical lessons: [`skills/epic-feature-workflow/lessons.md`](../skills/epic-feature-workflow/lessons.md)
- Feature-worker contract: [`agents/feature-worker.md`](../agents/feature-worker.md)
- Feature-reviewer contract: [`agents/feature-reviewer.md`](../agents/feature-reviewer.md)
