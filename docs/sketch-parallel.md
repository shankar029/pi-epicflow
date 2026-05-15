# Sketch: parallel feature dispatch (v0.7+ candidate)

> **Status:** sketch only — not implemented in v0.6.x. This document
> captures the design so it isn't lost; the decision to ship is gated on
> real wall-clock evidence from at least one ≥20-feature epic (see
> §Decision gate).
>
> **Author:** pi-epicflow maintainers, 2026-05-15.
> **Related:** L-034 (mechanical-enforcement principle),
> v0.6.1 `pi-epic-status --ready` (manual-parallelism fallback).

---

## Problem

Pi-epicflow runs features serially through the DAG: `pi-epic-next-feature`
returns one feature at a time, the orchestrator dispatches one planner →
worker → reviewer → merge cycle, then loops. For a wide-fanout epic (gen-ui
has F03..F10 all depending only on F02), this leaves hardware idle.

**What we want:** run up to N features concurrently when the DAG permits,
without compromising the existing safety properties (atomic squash-merge,
clean epic history, deterministic resume).

**What we don't want:** to invent a build system. We want the **smallest**
parallel dispatcher that closes the wall-clock gap.

---

## What's already in place (no new work needed)

- **Worktrees per feature.** `pi-feature-start` already creates an
  isolated git worktree on a feature branch. Parallel workers running in
  different worktrees don't step on each other in the filesystem.
- **`pi-subagents` parallel mode.** The extension already supports
  `tasks[]` with a `concurrency` cap. The orchestrator can dispatch N
  workers in one tool call.
- **DAG semantics.** `depends_on` already encodes parallelizability. A
  feature is "ready" iff every dep is merged.
- **`pi-epic-status --ready`** (v0.6.1) lists ready features and works as
  a manual-parallelism aid right now: open two pi sessions, dispatch
  different ready ids by hand. Zero orchestrator changes needed.

---

## What's hard (the actual design problem)

### H1. Squash-merge is the serialization point, and it must stay that way

The epic branch must remain a single linear sequence of squash commits —
that property is what makes `pi-epic-complete` reversible, what makes the
recovery playbook tractable, and what gives the human reviewer a clean
history to read. We will not relax it.

So: parallel **execution** is fine; parallel **squash-merge** is not.
We need a serial merge queue that funnels parallel workers' completions
back into a single-writer commit stream.

### H2. Workers built on `epic@v1` may need to land on `epic@v2`

If Worker A and Worker B both `pi-feature-start` when epic head is `v1`,
their branches both fork from `v1`. A finishes, squash-merges → `v2`. Now
B's worktree is behind. B's squash-merge into the epic branch could:

1. **Apply cleanly** if scope_files truly don't overlap (most common).
2. **Conflict** if there's accidental overlap (shared imports,
   `package.json`, lockfiles, shared tests fixtures, formatter changes
   to adjacent lines).

Case 1 is fine; git's squash-merge handles it. Case 2 is the real work:
the dispatcher needs a policy for what to do when B's merge conflicts.

### H3. Halt isolation across N parallel runs

Today H1–H7/H9 halt the whole epic. H10 (v0.6) is the only soft halt.
With N=4 in flight:

- If one worker hits H10, the other 3 keep running. ✅ (H10 was designed
  for this; we're already aligned.)
- If one worker hits H1 (tests failed), what happens to the other 3?
  Today's answer is "halt everything." With parallel, halting everything
  means killing 3 productive worker contexts mid-run. Wasteful.
- The orchestrator now has to track N independent `worker-report.md`
  reads, N independent reviewer dispatches, N halt-or-continue decisions.

### H4. Reviewer + evidence-gate assume linear time

v0.6's reviewer spot-checks worker evidence by re-running a command in
the worker's worktree. If that re-run reads from anywhere the epic
branch has advanced (e.g. a shared config), the spot-check could pick up
state from a *different* feature's parallel completion. Not catastrophic
(worktree state is the worker's, not the epic's) but a real consistency
question.

### H5. Observability degrades

Today: read PLAN.md, worker-report.md, review-report.md in sequence. The
story is linear. Parallel = N interleaved streams. The run-log.jsonl
already has timestamps so machine-tooling stays fine, but the human-
readable narrative gets harder.

---

## Proposed design

### Components

1. **Ready-set computation.** `pi-epic-next-feature --batch N` returns
   the next ≤N ready features (own state ∈ {pending, halted-ambiguous},
   all deps merged), in DAG-topological order. Already largely
   implementable from `pi-epic-status --ready --quiet | head -N`.

2. **Conflict pre-check (optional, recommended).** Before dispatch,
   compute pairwise `scope_files` intersections from `decomposition.yaml`.
   If two ready features overlap, only dispatch one of them in this
   batch. This is a *prompt-only-rule killer* — the dispatcher
   mechanically enforces "no parallel dispatch of features with
   overlapping declared scope." (L-034 compliance.)

3. **Parallel worker pool.** Orchestrator calls `subagent` with `tasks[]`
   containing planner+worker pairs for each batch member, `concurrency: N`.
   Each task gets its own `cwd` = its worktree, `output` = its
   `worker-report.md`.

4. **Per-task review.** As each worker completes (not waiting for the
   batch), spawn its reviewer. Reviewer outputs go to per-feature
   `review-report.md`. Reviewers are independent; no shared state.

5. **Serial merge queue.** A single in-process queue: as reviewers
   APPROVE, the orchestrator pulls completed features off in arrival
   order and runs `pi-feature-complete` one at a time. If the second
   merge conflicts, it triggers the **rebase-or-fallback protocol**
   (below).

6. **Halt isolation.** Each task's halt is recorded against its feature.
   H10 → mark feature `halted-ambiguous`, continue. H1/H4 → mark feature
   `halted`, continue (do NOT kill sibling workers; let them finish
   what they're doing, then halt the epic only if needed). Hard
   environment halts (H2 dirty-tree, H5 fatal-env, H6 unrecoverable
   merge conflict, H7 stall) still kill the batch — those are
   process-wide problems.

### Rebase-or-fallback protocol (the H6 fix)

When `pi-feature-complete` for feature B detects that the epic branch
has advanced since B's worktree was created:

```
1. Try `git merge --squash` of B's branch into epic head.
2. If clean: commit, done. Standard path.
3. If conflict:
   a. Identify the conflicting files.
   b. If conflicting files are all in B's declared scope_files:
      → write halt H6 with the merge conflict, mark B halted, continue.
        (This is "we predicted disjoint scopes and were wrong" —
        decomposition feedback.)
   c. If conflicting files are outside B's declared scope_files:
      → write halt H6 with "B's worker went out of scope and
        conflicts with A's already-merged change", mark B halted.
        (Worker discipline failure; reviewer should have caught.)
4. NO automatic rebase. NO automatic conflict resolution. Halt-and-ask.
```

Rationale: automatic rebase logic in 2026 LLM-orchestrated workflows is
where bugs hide. Cheaper to halt the one conflicting feature, let the
human resolve, than to silently rebase and ship a subtle merge.

### Concurrency cap

Default `N=2`. Tunable via `epic-config.yaml`:

```yaml
parallel:
  max_workers: 2          # 1 = serial (current behavior)
  conflict_precheck: true # skip dispatch on declared-scope overlap
```

Higher N is technically supported but every step from N=1 → N=2 → N=4
multiplies token cost, halt-handling complexity, and observability load.
N=2 captures most of the wall-clock benefit (typical epics have 2–3 ready
features at any moment, not 10).

### Backward compatibility

- Default `max_workers: 1` for new epics → identical behavior to v0.5/v0.6.
- Opt-in via `epic-config.yaml` only. Decomposition format unchanged.
- Halt codes unchanged (no H11).
- All v0.6 mechanical gates (evidence section, reviewer credibility,
  H10 soft halt) work unchanged.

---

## Decision gate: ship when

We commit to building this when **at least one** of:

1. **One real epic has run** (gen-ui or any outside epic with ≥20 features
   and ≥5h wall-clock) and the run-log shows ≥30% wall-clock spent on
   *serial dispatch* (i.e. features waiting in the queue while no
   worker was running). Measure via `run-log.jsonl` `feature-start` →
   `feature-merged` deltas vs. wall-clock.
2. **Two independent outside users** ask for it. Two data points from
   different epics validate it's a real pain, not a one-off.
3. **Token cost analysis** shows that for ≥3 epic runs, serial total
   wall-clock × hourly rate > parallel orchestrator implementation
   cost + parallel-mode token premium × expected runs.

Until then: ship `pi-epic-status --ready` (done in v0.6.1) and let
manual parallelism via two pi sessions cover the use case.

---

## Costs (revised estimate)

| Item | Hours |
|------|------:|
| Orchestrator state machine: batch dispatch + per-task tracking | 4 |
| Serial merge queue + rebase-or-fallback protocol | 3 |
| Halt isolation: per-task halt routing | 2 |
| `pi-epic-next-feature --batch` + conflict pre-check | 1 |
| `epic-config.yaml` parsing for `parallel:` block | 1 |
| Smoke test phases: parallel happy path, conflict-on-merge fallback, halt isolation | 3 |
| Recovery recipe R9 (parallel-merge conflict) | 1 |
| L-035/L-036/L-037 lessons | 1 |
| **Total** | **16** |

Vs. v0.6.0 (~5h actual). 3× the cost. Worth it only with evidence.

---

## Out of scope (don't build)

- **Automatic rebase-on-conflict.** Halt-and-ask is safer. If it turns
  out users actually want a rebase attempt, that's a v0.8+ refinement
  after we have data.
- **Cross-feature work stealing.** If A finishes first and B is still
  going, A's worker context does NOT pick up another ready feature. Each
  subagent context dies at feature boundaries. Less efficient, much
  simpler state.
- **Parallel decomposition.** `/epic-decompose` stays single-pass. We've
  already added the validator + UX work in v0.5.2.
- **Parallel reviewers per feature** (3 reviewers × 1 feature). Already
  achievable today via `pi-subagents` parallel `tasks[]` if the user wants
  it; no orchestrator-level support needed.
- **Multi-machine dispatch.** Way out of scope.

---

## Open questions to resolve before implementation

1. **What's the right `max_workers` default if/when we ship?** N=2 is the
   sketch's pick. May want N=auto (= half the host's CPU count, capped at 4).
2. **Should the conflict pre-check be advisory or hard?** Sketch says
   "hard: don't dispatch overlapping pairs." Could relax to "warn and
   dispatch anyway" if the conservative version creates false negatives.
3. **How loud should the parallel run-log be?** The current single-stream
   narrative gets harder; consider a `pi-epic-status --timeline` view
   that linearizes parallel runs for human consumption.
4. **Does the v0.6 evidence-gate need any changes?** Probably not — each
   worker's evidence lives in its own report and is re-runnable in its
   own worktree. But verify.

---

## Update log

- **2026-05-15** — sketch created during v0.6.0 release retrospective.
  Decision: defer to v0.7+. Ship `pi-epic-status --ready` as the
  manual-parallelism fallback in v0.6.1.
