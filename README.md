# pi-epicflow

> **Ship multi-feature work as one clean PR.** A [pi](https://pi.dev)
> extension that decomposes a `design.md` into a DAG of small features, runs
> each on its own git worktree + short-lived branch, squash-merges back into
> a long-lived **epic branch**, and opens a **single reviewable PR to main**
> when the whole epic is done. Halts only when truly blocked.
>
> **v0.5** adds a hybrid planning architecture: every feature writes a
> binding plan before any code edit, and features tagged `needs_planner:
> true` get a dedicated `feature-planner` subagent pass that produces a
> contract `plan.md`. **Spikes** (`kind: spike`) are first-class features
> whose deliverable is a decision artifact in `deviations.md`, not code
> — use them to resolve open questions before they corrupt downstream
> features.

[![smoke](https://github.com/shankar029/pi-epicflow/actions/workflows/smoke.yml/badge.svg)](https://github.com/shankar029/pi-epicflow/actions/workflows/smoke.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![pi >= 0.74](https://img.shields.io/badge/pi-%E2%89%A50.74-5f87ff.svg)](https://pi.dev)

---

## The problem this solves

When you ask an AI coding agent to ship a non-trivial change end-to-end —
5–20 features, multiple files, real tests — the day-1 workflow falls apart:

- **Context budget.** Implementing a dozen features in one context window
  burns tokens, slows every turn, and makes the agent fragile to long-tail
  errors. Each new line of code makes every prior line more expensive to
  re-read.
- **Unreviewable PRs.** A 5,000-line single-PR change-set is a rubber-stamp
  request, not a review. You spot the problems three weeks later in prod.
- **No checkpoint.** When a test breaks at hour 3, or the agent
  misinterprets a spec, or your laptop runs out of battery, the run
  restarts from zero. There's no "resume from feature 7".
- **Silent scope drift.** Without an explicit per-feature scope, the agent
  helpfully edits files no one asked about. The reviewer can't separate
  intentional changes from drift.
- **No memory across runs.** Mistakes the agent made on epic N — the
  ambiguous spec, the misunderstood acceptance criterion, the test-fixture
  trap — get made *again* on epic N+1 because nothing fed back into the
  agent's instructions.

**pi-epicflow** is the workflow + tooling that fixes all five. The shape is
straightforward: human + agent co-design → agent decomposes into a DAG of
20–60-minute features → each feature runs on its own git worktree →
squash-merges into a long-lived epic branch → single PR to main when the
whole epic completes. Halts are explicit, deviations are logged, and a
`lessons.md` grows after every epic so the agent literally gets better at
decomposing the next one.

## How it works — the mental model

```
  design.md  ────────────────────┐
  (you write this, in pi or alone)  │
                                    │
                                    ▼
                          ┌───────────────┐
                          │ /epic-decompose │    pi proposes 3–7 features
                          │ (one turn)      │    with deps, scope, ACs
                          └────────┬────────┘    you approve once
                                   │
                                   ▼
           decomposition.yaml (committed)
                                   │
                                   ▼
                          ┌───────────────┐
                          │ /epic-run-auto  │   orchestrator loop
                          └────────┬────────┘
                                   │
              for each ready feature in DAG order:
                                   │
      ┌────────────────┬───────┴───────┬───────────────────┐
      ▼                  ▼               ▼                      ▼
  worktree+branch    [feature-planner]  feature-worker         feature-reviewer
  spawned            subagent (only     subagent (fresh        subagent (fresh
  off epic branch    when needs_planner context, reads plan.md context, validates
                     :true; writes      if present, mandatory  plan-vs-impl +
                     plan.md)           plan section in §4)    AC + scope)
                                                              │
                                                              ▼
                                                       squash-merge into
                                                       epic branch, delete
                                                       branch+wt, archive
                                                       feature, deviations.md
                                   │
                                   ▼
                          all features merged?
                                   │
                                   ▼
                          ┌───────────────┐
                          │ epic-reviewer  │    final pre-PR pass over
                          │ subagent       │    the cumulative diff
                          └────────┬───────┘
                                   ▼
                          ┌───────────────┐
                          │ pi-epic-complete│   rebase epic onto main,
                          │                 │   distill deviations →
                          └────────┬────────┘   global lessons.md,
                                   ▼                push, open ONE PR
                          single PR → main
                          (one clean, reviewable diff)
```

Five keys to why this scales where naive "agent in one big context" doesn't:

1. **Each feature gets a fresh subagent context.** A worker that spends 80 KB
   of tokens implementing F03 doesn't pollute the orchestrator's context or
   F04's worker's context. The orchestrator's own context grows only by the
   size of each feature's 1 KB worker-report.
2. **Each feature gets its own git worktree.** No `git stash` dance. No
   branch-switching mid-implementation. Workers can in principle run in
   parallel; today they're serialized for atomic squash-merge into the
   epic branch.
3. **The decomposition is YAML, not chat.** Once approved, it's the
   contract. Any departure goes into `deviations.md` with a reason.
   Reviewable. Diffable. Version-controlled.
4. **Plan before code, always.** Every worker fills a structured Plan
   section in `feature.md` §4 (files-to-touch, AC interpretations,
   ambiguities, anti-scope) *before* the first edit. Features tagged
   `needs_planner: true` additionally get a dedicated `feature-planner`
   subagent pass that produces a binding `plan.md` — the worker treats
   it as a contract, and the reviewer checks plan-vs-impl alignment.
   Surfaces ambiguity at planning time (cheap) instead of
   implementation time (expensive).
5. **Halts, not guesses.** When the agent is unsure (planner can't
   resolve, test fails 3x, merge conflict, ambiguous spec), it writes a
   halt report with the exact resume command and stops. A bad guess at
   hour 3 wastes hours; a halt loses minutes.

Deeper rationale lives in [`docs/design.md`](docs/design.md).

## Two modes

- **Auto mode** (default, recommended) — the three slash commands above.
  `/epic-decompose` and `/epic-run-auto` drive the whole pipeline, delegating
  each feature to a `feature-worker` subagent and each pre-merge review to a
  `feature-reviewer` subagent. Requires
  [`pi-subagents`](https://www.npmjs.com/package/pi-subagents).
- **Manual mode** — you call the `pi-*` CLI scripts from your shell or from a
  regular pi session, doing the implementation yourself or in pi's main
  context. Same scripts, same state on disk, same halt codes — just no
  subagent delegation. Useful when subagents aren't available, when you want
  to inspect every step, or when one of the features genuinely needs a human.

Mix freely: start in auto mode, drop to manual for a tricky feature, hop
back into auto. The on-disk state in `.pi/epics/<id>/` is the single source
of truth and doesn't care which mode wrote it.

## A worked example: shipping `todoq` (a tiny Python CLI)

Given a `design.md` that specifies a four-command todo CLI (`add`, `list`,
`done`, `rm`) with JSON-backed storage, here's the full transcript:

```bash
# 1. Bootstrap the epic from your shell.
$ cd ~/code/todoq && git checkout main && git pull
$ pi-epic-init todoq --from /tmp/todoq-design.md
[epic-workflow] created branch: epic/todoq
[epic-workflow] seeded design.md from /tmp/todoq-design.md

# 2. Open pi in the repo.
$ pi
```

Then in pi:

```
you ▸ /epic-decompose
pi  ▸ [reads design.md + lessons.md + epic-config.yaml]
      [proposes the YAML below + ASCII dep-graph]
      F01 storage          ──┐
      F02 add-and-list      ├── F03 done-and-rm
      F01 storage          ──┘
      Looks good, or want changes?
you ▸ approved, write it and commit
pi  ▸ [detects pyproject.toml → proposes test_cmd: python -m pytest -q]
      [writes decomposition.yaml + epic-config.yaml]
      [runs pi-epic-validate-decomposition → OK, 3 features, DAG valid]
      [git commit -m "decomp: 0001-todoq into F01..F03"]
      decomposition.yaml committed as 49a2071.
      next: /epic-run-auto

you ▸ /epic-run-auto
pi  ▸ ─── EPIC STATUS ───
      epic: 0001-todoq  branch: epic/todoq
      phase: spawning F01
      ...
      ───────────────────
      [spawns feature-worker on ../todoq-F01]
      [worker implements + tests → pytest -q green]
      [spawns feature-reviewer → APPROVE]
      [pi-feature-complete F01 → squash-merge into epic/todoq]
      ─── EPIC STATUS ───
      phase: spawning F02
      done: F01 ✓
      ...
```

…repeating for F02 and F03, finishing with an epic-wide review pass and a
push of `epic/todoq`. The PR step opens `gh pr create` if `gh` is on your
PATH; otherwise it prints the command for you to run.

**Total wall-clock for 3 small features: ~15 minutes.** Two STATUS
heartbeats per feature, zero attention required between them.

Want something bigger? The 12-feature `minikv` validation epic (an in-memory
KV server with snapshots, expiry, and an admin CLI) ran end-to-end in ~87
minutes — 7-level DAG, four features touching the same `server.js`, zero
stalls, zero merge conflicts, 119/119 tests green.

## When NOT to use this

- **Single-PR changes.** If the work fits in one PR, just open it. The
  workflow's overhead pays off starting at ~3 features.
- **Cross-repo work.** One epic = one repo. For polyrepo changes, run
  parallel epics and coordinate via PRs.
- **Multi-user concurrent.** Two humans on one epic branch is not
  supported — there's no locking on `.pi/epics/<id>/`. Coordinate via PR
  review or work on different epics.
- **Throwaway exploration.** Spelunking, prototyping, "what if we tried…"
  — just run pi without ceremony. Use this when you've decided to ship.

---

## Table of contents
- [The problem this solves](#the-problem-this-solves)
- [How it works — the mental model](#how-it-works--the-mental-model)
- [Two modes](#two-modes)
- [A worked example](#a-worked-example-shipping-todoq-a-tiny-python-cli)
- [When NOT to use this](#when-not-to-use-this)
- [Install](#install)
- [Quickstart — the three-command flow](#quickstart--the-three-command-flow)
- [Quickstart — manual mode](#quickstart--manual-mode)
- [Quickstart — auto mode (deep-dive)](#quickstart--auto-mode-deep-dive)
- [What gets created on disk](#what-gets-created-on-disk)
- [Scripts](#scripts)
- [Halt codes](#halt-codes)
- [FAQ](#faq)
- [Design](#design)
- [Lessons](#lessons)
- [Uninstall](#uninstall)
- [Compatibility](#compatibility)
- [License](#license)

---

## Install

### From GitHub (recommended for v0.x)

```bash
# globally (writes to ~/.pi/agent/settings.json)
pi install git:github.com/shankar029/pi-epicflow

# or pin to a tag
pi install git:github.com/shankar029/pi-epicflow@v0.1.0

# or project-scope only (writes to ./.pi/settings.json)
pi install -l git:github.com/shankar029/pi-epicflow
```

### What the install does

1. Registers the skill (`epic-feature-workflow`) and prompt (`/epic-run-auto`)
   so pi loads them in any session.
2. Runs `install/postinstall.mjs` which:
   - Copies `feature-worker.md`, `feature-reviewer.md`, and `feature-planner.md` into
     `~/.pi/agent/agents/` so `pi-subagents` can discover them.
   - Symlinks `pi-epic-*` and `pi-feature-*` from the package into
     `~/.local/bin` so you can call them from any shell.
   - Auto-installs `npm:pi-subagents` (required for auto mode) and
     `npm:pi-intercom` (recommended) at the same scope you installed
     pi-epicflow — so the first `/epic-run-auto` doesn't have to stop and
     install them mid-run. Already-installed packages are detected and
     skipped. Set `PI_EPICFLOW_NO_AUTOINSTALL_DEPS=1` to skip this step.
3. Prints a hint if `~/.local/bin` isn't on your `PATH` yet.

All side-effects are **idempotent** and **defensive** — they never clobber
your local edits; on conflict they write `*.new` siblings and warn. If the
auto-install of pi-subagents/pi-intercom fails (offline, registry down,
etc.) the pi-epicflow install itself still succeeds and prints the exact
manual command.

Verify:

```bash
which pi-epic-init pi-feature-start pi-feature-complete   # all should resolve
ls ~/.pi/agent/agents/feature-*                            # 3 files: worker, reviewer, planner
pi list | grep -E 'pi-subagents|pi-intercom'               # both should appear
```

### Skipping the auto-install of pi-subagents / pi-intercom

Auto mode needs `pi-subagents`; manual mode does not. If you only ever
intend to drive the workflow from your shell (no `/epic-run-auto`), you can
opt out of the auto-install:

```bash
PI_EPICFLOW_NO_AUTOINSTALL_DEPS=1 pi install git:github.com/shankar029/pi-epicflow
```

You can install them later by hand whenever you want auto mode:

```bash
pi install npm:pi-subagents
pi install npm:pi-intercom   # nicer in-chat prompts; optional but recommended
```

---

## Quickstart — the three-command flow

From your repo, on the branch you want to PR into:

> **Using `git worktree`?** If your repo uses a bare-clone + worktrees
> layout (e.g. created via `mkrepo.sh`), `cd` into the worktree subdir
> first — the outer bare-clone dir isn't a working tree.
> See [`docs/git-worktrees.md`](docs/git-worktrees.md) for the full
> walkthrough.

```bash
# 1. Bootstrap the epic. Creates the epic branch + journal folder.
pi-epic-init my-feature --from /path/to/design.md

# 2. Open pi in the repo.
pi
```

Then in the pi chat:

```
/epic-decompose          # pi proposes features, you approve, pi writes + validates + commits
/epic-run-auto           # pi ships every feature, runs the reviewer, opens the PR
```

That's the whole workflow. Three commands, no file paths to memorize.

`/epic-run-auto` is **self-bootstrapping**: if you skip `/epic-decompose`,
it'll run that flow first automatically. Pass `--no-bootstrap` to force a
halt instead if you'd rather decompose by hand.

If you want to **drive the loop manually** (no subagents, no auto-mode), the
manual-mode section below shows the bare shell commands behind each step.

---

## Quickstart — manual mode

Drive the workflow by hand from your shell. Best when you want pi in the
loop only for parts of the work, or for environments where `pi-subagents`
isn't available.

```bash
# 0. one-time per repo: stand on the branch you want to PR into
cd ~/code/myrepo
git checkout main && git pull

# 1. write a design.md somewhere (in or out of the repo) describing the goal
$EDITOR /tmp/my-design.md

# 2. initialize an epic (creates an epic/<slug> branch + .pi/epics/<id>/ tree)
pi-epic-init my-feature --from /tmp/my-design.md --title "Add X to Y"

# 3. write decomposition.yaml — list the features, deps, scope_files, ACs
$EDITOR .pi/epics/0001-my-feature/decomposition.yaml
pi-epic-validate-decomposition
git add .pi/ && git commit -m "decomp"

# 4. loop: start, implement (anywhere, in any way), complete
while next=$(pi-epic-next-feature); [ "$next" != "DONE" ] && [[ "$next" != HALT:* ]]; do
  pi-feature-start "$next"                      # creates feat/<slug>/<fid>-... worktree
  # … implement under the printed worktree path, commit on the feature branch …
  pi-feature-complete "$next"                   # runs tests, squash-merges, archives
done

# 5. wrap up
pi-epic-complete                                # rebases, distills lessons, opens PR
```

`pi-epic-status` will give you a one-screen view of where the epic is at any
point.

---

## Quickstart — auto mode (deep-dive)

The three-command flow above is auto mode. This section explains what each
slash command actually does so you can debug if anything goes sideways.

After `pi install npm:pi-subagents`:

```bash
cd ~/code/myrepo
git checkout main && git pull
$EDITOR /tmp/my-design.md
pi-epic-init my-feature --from /tmp/my-design.md

# fresh pi session in the same dir
pi
# inside pi:
/epic-decompose                  # propose + approve + commit decomposition.yaml
/epic-run-auto                   # run the loop
```

What you'll see in chat:

```
─── EPIC STATUS ───
epic:    0001-my-feature  branch: epic/my-feature
phase:   spawning F02
done:    F01 ✓
ready:   F03, F04 (waiting)
last:    F01 merged (APPROVE, 1 worker run, 1 review cycle)
budget:  features merged 1/4, deviations 0, halts 0
───────────────────
```

…repeating for every transition. On any blocker, you get a clearly-marked
`─── EPIC HALTED ───` block with a halt-report path and an exact resume
command.

Optional flags after `/epic-run-auto`:
- `--max-features=N` — stop after N features merged this run (useful for
  iterative review).
- `--no-reviewer` — skip the per-feature `feature-reviewer` pass.
- `--no-bootstrap` — halt instead of auto-running `/epic-decompose` when
  decomposition.yaml is empty.

Optional flags after `/epic-decompose`:
- `--features=N` — ask pi to aim for N features (default 3–7).
- `--auto-commit` — skip the "commit this?" prompt at the end.

---

## What gets created on disk

```
your-repo/
├── .pi/
│   ├── STATE.md                                # pointer: active epic + active feature
│   └── epics/
│       └── 0001-<slug>/                        # one folder per epic, numbered
│           ├── meta.yaml                       # status, branch, links, timestamps
│           ├── design.md                       # the input you wrote
│           ├── decomposition.yaml              # features + deps + ACs
│           ├── epic-config.yaml                # test_cmd, budgets, worktree pattern
│           ├── deviations.md                   # append-only log of design departures
│           ├── lessons-candidate.md            # distilled by pi-epic-complete
│           ├── run-log.jsonl                   # one line per event (gitignored)
│           ├── halt-<UTC>.md                   # only on halt (gitignored auto-commit)
│           ├── epic-review.md                  # final pre-PR review (auto mode)
│           └── features/
│               ├── <fid>-<slug>/               # active feature folder
│               │   ├── meta.yaml
│               │   ├── feature.md
│               │   ├── worker-report.md        # auto mode (gitignored)
│               │   └── review-report.md        # auto mode (gitignored)
│               └── done/<fid>-<slug>/          # archived after squash-merge
└── ../<repo>-<fid>/                            # per-feature git worktree
```

Branches:
- `epic/<slug>` — long-lived; receives squash-merges; pushed when the epic
  completes.
- `feat/<epic-slug>/<fid>-<slug>` — short-lived; deleted by
  `pi-feature-complete` after squash-merge.

---

## Scripts

| Script | Job |
|---|---|
| `pi-epic-init <slug> [--from <design-file>] [--base <branch>] [--no-planner]` | Create the epic folder + branch + STATE.md. `--base` overrides the parent branch (default: repo's default branch); recorded in `meta.yaml` and used by `pi-epic-complete` as the PR target. `--no-planner` disables the `feature-planner` subagent for every feature in this epic (`disable_planner: true` in meta.yaml). Auto-commits a `.gitignore` for pi runtime state. |
| `pi-epic-validate-decomposition` | Sanity-check `decomposition.yaml`: no cycles, no unknown deps, IDs unique, scope_files unique, etc. |
| `pi-epic-next-feature` | Print the next feature id to work on. Prefers any **in-progress** feature (resume) over the lowest-numbered **ready** one. Prints `DONE` when all merged, `HALT:<reason>` on DAG corruption. |
| `pi-feature-start <fid>` | Create the feature worktree + branch, write `feature.md` / `meta.yaml`, auto-commit any pending `.pi/epics/<id>/` edits (except `halt-*.md`) on the epic branch, advance epic `status: design → in-progress` on first call. |
| `pi-feature-complete <fid> [--skip-tests]` | Run the epic's `test_cmd` on the feature branch, squash-merge it into the epic branch, delete the feature branch + worktree, archive the feature folder to `features/done/`. |
| `pi-epic-status` | One-screen overview: epic, branch, done/in-flight/ready, deviations count, halts. |
| `pi-epic-complete [--no-pr] [--draft]` | Rebase the epic branch onto the latest default branch, run the full test suite, distill `deviations.md` → `lessons-candidate.md` → global `lessons.md`, push, and (if `gh` is available) open the PR. Archive the epic to `.pi/epics/done/`. |

All scripts share `_common.sh` (yaml read/write, slugify, git helpers) and
each prints actionable error messages on failure.

---

## Halt codes

The orchestrator (and the manual workflow, via the scripts) halts rather than
guess when:

| Code | Trigger | Operator action |
|---|---|---|
| **H1** | Tests failing after retries, or post-merge tests red | Inspect; fix or clarify ACs; resume |
| **H2** | Dirty working tree outside `.pi/epics/<id>/` | Commit/stash/revert outside the journal scope; resume |
| **H3** | `pi-epic-next-feature` returned an unknown feature id (decomposition drift) | Reconcile `decomposition.yaml` vs `features/`; resume |
| **H4** | Feature failed review 3+ times | Inspect review reports; rewrite scope or AC; resume |
| **H5** | Environment fatal — disk full, git corrupt, missing toolchain | Fix the host; resume |
| **H6** | Merge conflict on squash-merge into epic branch | Resolve on epic branch (`pi-feature-complete --skip-tests`); resume |
| **H7** | Subagent stalled past the §STALL HANDLING budget (auto mode only) | Inspect last forensics; decide manual takeover or respawn |
| **H9** | `feature-planner` subagent returned BLOCKED (unresolvable ambiguity, missing call sites, contradictory AC) | Read `plan.md` + `planner-report.md`; fix decomposition AC or run a spike; resume |

Every halt writes `.pi/epics/<id>/halt-<UTC>.md` with the failing step, the
worker/review reports involved, what the human needs to decide, and the exact
resume command.

---

## FAQ

**Q: How is this different from just opening a feature branch and asking pi to implement it?**
The single-branch approach works for changes that fit in one context window
(~one PR's worth). pi-epicflow buys you (a) **context isolation per feature**
via subagents, (b) **resumability** — you can crash, switch machines, or come
back tomorrow and `/epic-run-auto` again, (c) **review-friendly history** —
the epic branch is one squash-commit per feature, not one bag of agent
intermediates, and (d) **cross-epic learning** via `lessons.md`. Below ~3
features it's not worth the ceremony; above ~5 it pays for itself many
times over.

**Q: Do I have to use auto mode?**
No. Manual mode is a first-class path — same scripts, same on-disk state,
same halt codes, you're just the one calling `pi-feature-start` /
`pi-feature-complete` from your shell. Use auto mode when you want to walk
away; use manual mode when you want a human in the loop on every feature.

**Q: Does pi-epicflow work with `git worktree`?**
Yes — it uses worktrees automatically. Every feature gets its own
per-feature worktree (`<repo>-F01-<slug>/`) created by `pi-feature-start`
and removed by `pi-feature-complete`. You don't manage these directly.
If your *own* checkout uses a bare-clone + worktrees layout (e.g. via
`mkrepo.sh`), see [`docs/git-worktrees.md`](docs/git-worktrees.md) for
the two valid setups (reuse default-branch worktree vs dedicated epic
worktree) and the common gotchas (`not in a git repository` from the
outer bare dir, seeding an epic from a non-default branch, etc.).

**Q: What if pi proposes a bad decomposition?**
You iterate. `/epic-decompose` shows the YAML in chat and asks for feedback
*before* writing to disk. You can say things like *"merge F03 and F04"*,
*"split F02 into model + CLI"*, *"F05 doesn't really depend on F03"*. Pi
revises and re-presents. Only on your explicit approval does it write +
validate + commit. Then `/epic-run-auto` is bound by that contract — any
departure goes into `deviations.md` with a reason.

**Q: What is the `feature-planner` subagent and when does it run?**
A pre-implementation pass that produces a binding `plan.md` for features
flagged `needs_planner: true` in `decomposition.yaml`. The planner reads
the design, the decomposition entry, any `reference_paths:` (POC code,
prior-art docs), and the repo — then writes files-to-touch, AC
interpretations with literal expected behavior, ambiguities, and
anti-scope. The worker treats `plan.md` as a contract; the reviewer
checks plan-vs-impl alignment. Triggered by a 7-item checklist in
`/epic-decompose` (any 2 of: unverified-callsites, format-sensitive-ac,
scope-crosses-modules, deep-dep-chain, large-estimate, many-acs,
cross-cutting-verb). Threshold tunable via
`PI_EPICFLOW_PLANNER_THRESHOLD`. Disable per-feature with
`needs_planner: false`, or per-epic with `pi-epic-init --no-planner`.

**Q: What is a spike?**
A feature whose deliverable is a *decision*, not code. Used when an open
question blocks 2+ downstream features ("CRC32 vs xxhash?", "which seam
do we decorate?", "hand-roll parser or use lark?"). Declared in
`decomposition.yaml` as `kind: spike` with `S<NN>` ids that share a
counter with features. Spike workers investigate (read code, prototype,
benchmark), then write a structured Decision / Evidence / Impact entry
in `deviations.md`. `pi-feature-complete` skips tests for spikes and
squash-merges the decision artifact into the epic branch.
`feature-reviewer` runs in spike-mode and checks decision quality, not
test results. Spikes are capped at 8 estimated hours.

**Q: What if a feature's tests fail?**
The `feature-worker` retries up to 3 times with different strategies. After
that it returns `BLOCKED`. The orchestrator escalates: spawns a fresh
worker once, and if still BLOCKED, halts with **H1** and writes
`.pi/epics/<id>/halt-<UTC>.md` with the failing tests, the worker's notes,
and the exact resume command. You fix the underlying issue (bad AC,
misunderstood spec, flaky test) and re-run `/epic-run-auto` — it picks up
exactly where it left off.

**Q: Can I run features in parallel?**
Not today. The orchestrator serializes feature execution so that
`pi-feature-complete`'s squash-merge into the epic branch is atomic.
Worktrees support parallel execution structurally — lifting the
serialization requires a per-feature lock around the merge, which is on
the roadmap.

**Q: What happens if I close pi mid-run?**
Nothing breaks. All state is on disk in `.pi/epics/<id>/`. Open pi again,
type `/epic-run-auto`, and it picks up from the next ready feature. If a
worker was mid-flight when you closed, the in-progress feature's worktree
is still there — the dispatcher prefers in-progress features over starting
new ones (lesson L-010), so the same feature resumes.

**Q: Does this work on Windows?**
WSL only. The scripts assume Unix paths, symlinks, and standard `git
worktree`. Native Windows is untested and likely broken.

**Q: Does it work with `pi -p` / non-interactive sessions?**
Manual mode does — the `pi-*` scripts are pure CLI. Auto mode is built
around a chat session because the orchestrator posts STATUS heartbeats and
handles stall notices. You *can* run `/epic-run-auto` non-interactively
but you lose the visibility into what's happening; not recommended.

**Q: How do I update?**
```bash
pi update git:github.com/shankar029/pi-epicflow
```
Restart any open pi session to pick up new prompts/skills (they're loaded
at session start). The bin symlinks update automatically.

**Q: Does this lock me in?**
No. Everything pi-epicflow produces is plain git — branches, worktrees,
squash commits, and a `.pi/` directory of YAML/markdown state. If you
stop using it tomorrow, nothing in your repo breaks. You can also drive
the entire workflow manually from your shell with no pi at all.

---

## Design

The deeper design rationale (worktree topology, why squash-merge, the
deviation log, lesson distillation, the orchestrator state machine, etc.) is
in [`docs/design.md`](docs/design.md).

The orchestrator's behavior contract is in
[`prompts/epic-run-auto.md`](prompts/epic-run-auto.md) — read this if you're
writing your own orchestrator or want to understand exactly what
`/epic-run-auto` does.

The skill's instructions to pi are in
[`skills/epic-feature-workflow/SKILL.md`](skills/epic-feature-workflow/SKILL.md).

---

## Lessons

`skills/epic-feature-workflow/lessons.md` is an append-only log of empirical
rules discovered during real runs (e.g. *"decomposition AC should name the
error class when it says 'throws'"*, *"halt files must not ride the
auto-commit train"*, *"prefer in-progress over ready in the dispatcher to
avoid leaking worktrees"*). New lessons get appended each time
`pi-epic-complete` distills `deviations.md` from a finished epic.

L-001 through L-052 are documented today (v0.8.1 added L-050 — derive install lists from repo contents, never from a hardcoded parallel list (postinstall.mjs's hardcoded 3-agent list shipped a broken v0.7.0 L-043 gate for four releases until v0.8.0 real-app verification caught it); L-051 — workers should contact_supervisor before installing dependencies that touch shared metadata files (package-lock.json, Cargo.lock, etc.), not just self-report deviations after the fact (under parallel mode this pattern is a real H6 risk); L-052 — pi-epic-complete must tolerate "no origin remote" for offline + sample workflows; v0.8.0 added L-048 — in-process orchestrator queue beats IPC for single-host parallelism (no `flock`, no lock-dir, coordination lives in the orchestrator's loop variables) and L-049 — conflict pre-check from declared `scope_files` is the cheap mechanical guard against parallel-merge collisions (data is already in the decomposition; false positives serialize when they could've paralleled; false negatives reduce to existing scope-discipline rule); v0.7.3 added L-047 — heuristics must be verified on a real app, not just smoke fixtures; real-app verification on a Vite+React TODO sample surfaced two compounding L-045 bugs synthetic fixtures could not have caught (App.tsx missing from the ts_react shell list AND wiring targets buried behind config files in the hint); release-checklist now requires a real-app verification pass for any heuristic-shaped feature; v0.7.2 added L-046 — detect + suggest, not detect + install; `epic-config.yaml` gains a `required_toolchain` block (`{name, min_version, validate_cmd, install_hint}` entries) and `pi-epic-validate-decomposition` runs each `validate_cmd` and refuses to validate if any fails, emitting the `install_hint` verbatim for the operator to run; pi-epicflow intentionally does NOT auto-install (security/portability/state-pollution/concern-boundary rationale spelled out in L-046); `.mise.toml` / `.tool-versions` defer to the toolchain manager; `--skip-toolchain-check` bypass; v0.7.1 added L-045 — integration shells are part of the work, not part of the toolchain; ~58 deviations across harmony + gen-ui all shared the same shape (worker built the new thing but forgot to wire it into the host app); `pi-epic-validate-decomposition` now refuses decompositions where AC contains trigger verbs (`wire`/`register`/`integrate`/etc.) without a language-appropriate integration shell in scope_files; `--skip-shell-check` bypass; L-044 was distilled the same day v0.7.0 shipped — public-facing surface lags code by default; codified in `docs/RELEASE-CHECKLIST.md` so future releases bump the site, the README lesson pointer, and any other landing surface as a hard gate; v0.7.0 added L-043 — per-feature reviewers are blind to cross-feature bugs by design; harmony's stale-lockfile B1 and gen-ui's `MapHarmonyAgent` no-op stub motivated the `feature-epic-reviewer` agent + `pi-epic-complete` epic-review gate; v0.6.3 added L-042 — framework epics need explicit verification features (sample apps, conformance harnesses) in the original decomposition, motivating `pi-epic-extend` as a first-class verb; v0.6.2 added L-036/L-037/L-038/L-039/L-040/L-041 from the harmony + gen-ui retrospectives; v0.6.1 added L-035 — defer the parallel-dispatch orchestrator, ship `pi-epic-status --ready` as the manual-parallelism aid; v0.6.0 added L-032/L-033/L-034 from the obra/superpowers review and the v0.6 verification-gate + soft-halt release; v0.5.2 added L-028/L-029/L-030/L-031 from the gen-ui epic decomposition review). Contributions of new lessons via
PR are welcome and encouraged.

---

## Uninstall

```bash
pi remove git:github.com/shankar029/pi-epicflow
```

This removes the package from pi's settings. The postinstall side-effects
(symlinks under `~/.local/bin/`, agent files in `~/.pi/agent/agents/`) are
**not** automatically reverted — they may be hand-edited and the install
script is deliberately non-destructive. Remove them by hand if desired:

```bash
rm ~/.local/bin/pi-epic-* ~/.local/bin/pi-feature-*
rm ~/.pi/agent/agents/feature-worker.md ~/.pi/agent/agents/feature-reviewer.md ~/.pi/agent/agents/feature-planner.md
```

---

## Compatibility

- **pi** ≥ 0.74 (uses the `packages` settings schema and the standard skill
  loader).
- **node** ≥ 18 (postinstall script uses `node:fs`, ESM, top-level await).
- **git** ≥ 2.20 (`git worktree`).
- **bash** ≥ 4.x (parameter expansion, arrays).
- **python3** ≥ 3.6 (YAML edits in `pi-feature-start` — no PyYAML, just
  stdlib).
- **OS:** tested on Linux. Should work on macOS. Windows: WSL only.
- **Auto mode** additionally requires `pi-subagents` ≥ 0.24.
  `pi-intercom` is optional but improves the in-chat prompts.

---

## License

MIT. See [LICENSE](LICENSE).
