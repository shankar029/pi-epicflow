---
name: epic-feature-workflow
description: Drive a multi-feature deliverable end-to-end with minimal human intervention. Decompose a design.md into a dependency-ordered DAG of small features, work each on its own git worktree + branch off a long-lived epic branch, squash-merge back, and open a single PR to main when the epic is done. Halt only when truly blocked; log deviations and feed them into future decompositions.
---

# Epic / Feature Workflow

A protocol for delivering multi-feature work fast (days, not weeks) with high
autonomy. After the human and pi co-design `design.md`, pi runs unattended:
decompose → implement feature-by-feature → review → PR.

## When to use this skill

| Situation | Use |
|---|---|
| Multi-feature deliverable, ≥3 features, design fits on a page or two | **epic-feature-workflow** (this skill) |
| Single focused change, one PR, days of work | `feature-journal` skill |
| Trivial fix, single file, minutes of work | Just do it |

If unsure: if you'd open more than one PR, use this skill.

## Three-command flow (for users)

The whole workflow is three commands. Everything else is optional power-user
plumbing.

```bash
# 1. From your shell, in the repo, on the branch you want to PR into:
pi-epic-init my-feature --from /path/to/design.md

# 2. Start pi in the same repo:
pi
```

Then in the pi chat:

```
/epic-decompose        # pi proposes features; you approve; pi commits decomposition.yaml
/epic-run-auto         # pi runs the loop, ships each feature, opens the PR
```

If the user asks how to "start a multi-feature change" / "break this design
into features" / "run the epic", point them at one of those three commands
rather than at the underlying scripts.

## Hard rules

1. **Never push or commit to `main` (or the repo's default branch) directly.** All work lands via PR from the epic branch.
2. **Always create an epic branch** (`epic/<slug>`), even for solo work.
3. **Each feature gets its own git worktree** sibling to the repo (`../<repo>-<feature-id>/`), so multiple in-flight features don't collide.
4. **Squash-merge** features into the epic branch. **Merge-commit** epic into main via the final PR.
5. **The design's end-goal is authoritative.** The decomposition is a plan, not a contract — deviate when needed and log it.
6. **Halt only on H1–H7** (see below). Everything else → log a deviation and continue.
7. **Distill deviations into the global `lessons.md`** at epic completion. Future decompositions read this file first.

## Layout

```
<repo>/
└── .pi/
    ├── STATE.md                                  # active epic + active feature
    └── epics/
        ├── _template/                            # skeletons (shipped with skill)
        ├── <NNNN>-<slug>/                        # active epic
        │   ├── design.md                         # the source of truth
        │   ├── meta.yaml                         # epic status, branch, dates, budgets
        │   ├── epic-config.yaml                  # test_cmd, budgets, overrides
        │   ├── decomposition.yaml                # features DAG + scope + AC
        │   ├── deviations.md                     # append-only learning log
        │   ├── run-log.jsonl                     # orchestrator decisions
        │   ├── halt-<timestamp>.md               # only when halted
        │   └── features/
        │       ├── F01-<slug>/
        │       │   ├── feature.md                # per-session journal
        │       │   └── meta.yaml                 # state, branch, worktree, deps
        │       └── done/F00-<slug>/              # merged features
        └── done/<NNNN>-<slug>/                   # shipped epics

~/.pi/agent/skills/epic-feature-workflow/
├── SKILL.md                                      # this file
├── scripts/                                      # helper bash scripts (idempotent)
├── templates/                                    # all skeletons
└── lessons.md                                    # cross-epic learning (grows over time)
```

## Lifecycle

```
   ┌────────────────────────┐
   │ user + pi co-design    │   pi-epic-init
   │ design.md              │   pi reads global lessons.md
   └──────────┬─────────────┘
              │
              ▼
   ┌────────────────────────┐
   │ /epic-decompose        │   pi proposes decomposition.yaml
   │ (DAG + scope + AC)     │   user approves once, pi commits
   └──────────┬─────────────┘
              │   ◄────── ONLY HUMAN GATE
              ▼
   ┌────────────────────────┐   ┌────────────────────────────────┐
   │ AUTO MODE LOOP:        │ ←─┤ pi-feature-start <next>        │
   │   pick next ready      │   │   creates worktree + branch    │
   │   implement            │   │ pi implements + tests + reviews│
   │   self-review          │   │ pi-feature-complete <id>       │
   │   merge to epic        │   │   squash-merges, deletes, logs │
   │   archive              │   └────────────────────────────────┘
   │   loop                 │
   └──────────┬─────────────┘
              │
              ▼
   ┌────────────────────────┐
   │ pi-epic-review         │   reviewer sub-agent on full epic diff
   │ pi-epic-complete       │   distill deviations → lessons.md
   │                        │   push epic branch, open PR → main
   └────────────────────────┘
```

## On every session

1. Read `.pi/STATE.md`. If it points at an epic, read its `meta.yaml`,
   `design.md`, `decomposition.yaml`, `deviations.md`, and last few entries of
   `run-log.jsonl` before doing any work.
2. If `STATE.md` also points at an active feature, read that feature's
   `feature.md` and `meta.yaml`, and `cd` to its worktree.
3. If neither: check current git branch against any `meta.yaml`. If still no
   match and the user is starting work: ask whether to `pi-epic-init`.

## Auto-mode orchestration loop

The agent (you) runs this loop after decomposition is approved. **Don't ask the
human between iterations** — proceed unless a halt condition fires.

```
while true:
    next = $(pi-epic-next-feature)
    if next == "DONE":
        pi-epic-review
        pi-epic-complete
        break
    if next == "HALT:<reason>":
        write halt-<timestamp>.md
        surface halt to human
        exit

    pi-feature-start $next
    cd $(cat .pi/STATE.md | grep worktree)

    # Implement against feature.md acceptance criteria.
    # Read scope_files in the feature's meta.yaml as a guideline.
    # If you must edit outside scope_files: do it, log to deviations.md, continue.
    # If an AC must be adapted: do it, log to deviations.md, continue.

    run tests (up to 3 attempts with different strategies)
    if tests still failing: HALT H1

    invoke `reviewer` sub-agent on the diff
    if reviewer flags blocking issues: fix, re-review (max 3 times)
    if still flagged: HALT H1 (treat as test failure)

    pi-feature-complete $next
    # ^ this script squash-merges, deletes branch+worktree, archives folder

    append run-log entry
    loop
```

## Halt conditions (truly blocking only)

| # | Trigger | Resolution path |
|---|---|---|
| **H1** | Tests still failing after ≥3 attempts with different strategies | Human inspects, fixes or clarifies, runs `pi-epic-run --resume` |
| **H2** | Blocking question with no reasonable default | Human answers, edits the halt-report, resumes |
| **H3** | Token budget exceeded (per epic, see `epic-config.yaml`) | Human raises budget or splits epic |
| **H4** | Wall-clock budget exceeded for a feature (default 8h) | Human inspects for stuck loops |
| **H5** | Destructive operation contradicting design intent (force-push, drop unrelated DB, mass-delete) | Hard safety; never bypass without explicit human approval |
| **H6** | Merge conflict needing semantic judgment (not mechanical) | Human resolves on epic branch, resumes |
| **H7** | DAG corruption (no resolvable next feature, cycle, missing dep) | Human edits `decomposition.yaml`, resumes |

**These are the only reasons to stop.** Out-of-scope edits, AC rewrites,
estimate overruns, reviewer disagreements that you're confident about — all
get **logged to `deviations.md` and you continue**.

## Deviation logging (the learning loop)

Append to `.pi/epics/<id>/deviations.md` whenever:

- You modify a file outside the feature's `scope_files` glob.
- You adapt, add, or remove an acceptance criterion.
- Estimated hours are exceeded by ≥50%.
- A dependency in the DAG turns out to be wrong (mid-flight DAG edit).
- Reviewer sub-agent flags an issue you decide to dismiss with reasoning.
- You discover the design's end-goal is ambiguous and you picked an interpretation.

Format (append-only, newest at bottom of the relevant feature's section):

```md
## F03 — <slug>

### YYYY-MM-DD HH:MM — <deviation type>
- What: <one sentence>
- Why: <one sentence>
- Decomposition lesson: <what should have been in the original plan>
```

At `pi-epic-complete`, distill the **generalizable** lessons (not epic-specific
trivia) and append them to the global `~/.pi/agent/skills/epic-feature-workflow/lessons.md`.
Read that file at every `pi-epic-decompose` invocation.

## Resume semantics

All state lives on disk. Crash, kill, machine switch — `pi-epic-run --resume`
picks up where it left off:

1. Read `.pi/STATE.md` → epic + last active feature.
2. Read the feature's `meta.yaml` → state field (`pending`, `in-progress`, `tests-passing`, `merged`, `halted`).
3. If `halted`: refuse to continue without `--force` or human edit to the halt-report.
4. Otherwise: `pi-epic-next-feature` and continue the loop.

## Helper scripts (in `scripts/`)

| Script | Role | Caller |
|---|---|---|
| `pi-epic-init` | Bootstrap epic folder, branch, STATE.md | human or pi |
| `pi-epic-validate-decomposition` | Validate `decomposition.yaml` (no cycles, all fields, etc.) | pi (after writing decomposition) |
| `pi-epic-next-feature` | Print next ready feature ID, or `DONE`, or `HALT:<reason>` | pi (in the auto loop) |
| `pi-feature-start <id>` | Create branch + worktree, update meta + STATE | pi |
| `pi-feature-complete <id>` | Run tests, squash-merge, delete branch+worktree, archive | pi |
| `pi-epic-status` | Print DAG with state of every feature, budgets, halts | human or pi (read-only) |
| `pi-epic-complete` | Rebase epic onto main, distill lessons, push, open PR, archive | pi |

All scripts are bash, POSIX where possible, idempotent, and exit non-zero on
error with a clear message.

## Conventions inherited from `feature-journal`

The per-feature `feature.md` follows the same §1–§7 structure as the
`feature-journal` skill (Goal, Design, ADRs, Plan, Progress log, Open
questions, Out of scope). ADRs in §3 are append-only. Progress log in §5 gets
a new entry per session.

The epic `design.md` is the long-form spec; per-feature `feature.md` is a
short journal that points back at the design and tracks implementation
progress + decisions specific to that feature.

## Definition of done (per feature, before squash-merge)

- [ ] Acceptance criteria intent met (adaptations logged in deviations.md).
- [ ] Test command exits 0.
- [ ] `reviewer` sub-agent has been invoked and any blocking findings addressed.
- [ ] `feature.md` §5 progress log entry prepended.
- [ ] `meta.yaml` `updated:` bumped, `state: tests-passing`.
- [ ] Any new ADRs in §3 mirrored as a one-liner to `design.md` decisions log.

## Definition of done (per epic, before PR)

- [ ] All features in `decomposition.yaml` have `state: merged`.
- [ ] Epic branch rebased onto current main, all tests pass.
- [ ] `pi-epic-review` run, findings addressed or logged.
- [ ] `deviations.md` distilled into `lessons.md` (proposed diff, agent applies after self-review).
- [ ] PR opened with auto-generated description (links design.md, lists features, summarizes ADRs).

## Anti-patterns (don't)

- Don't ask the human between features in auto-mode — that's why decomposition is the gate.
- Don't expand scope mid-feature — log a deviation and finish the current feature first.
- Don't push the epic branch to a shared remote until `pi-epic-complete` (unless the human asked).
- Don't edit past ADRs — supersede them.
- Don't hand-edit `run-log.jsonl` or `index.json`.
- Don't use this skill for trivial work — use `feature-journal` or just commit.
