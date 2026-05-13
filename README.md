# pi-epicflow

> Decompose a `design.md` into a dependency-ordered DAG of small features.
> Work each one on its own git worktree + branch off a long-lived **epic
> branch**, squash-merge it back, then open a **single PR to main** when the
> whole epic is done. Halt only when truly blocked.

A pi skill + orchestrator prompt + helper agents that turn the otherwise
manual "design → decompose → implement → review → merge → repeat" loop into
something you can drive in one of two modes:

- **Manual mode** — you call the `pi-*` CLI scripts from your shell or from
  a regular pi session, doing the implementation work yourself or in pi's
  main context. The scripts handle the bookkeeping (branches, worktrees,
  squash-merge, state, lessons).
- **Auto mode** — `/epic-run-auto` turns the main pi session into a thin
  orchestrator that delegates each feature's implementation to a
  `feature-worker` subagent and each pre-merge review to a
  `feature-reviewer` subagent. Requires
  [`pi-subagents`](https://github.com/nicobailon/pi-subagents). Posts STATUS
  heartbeats to chat. Handles stalls, retries, and halts per the contract.

Validated end-to-end on a 12-feature, 7-level DAG with shared-scope
serialization: **0 stalls, 0 retries, 0 conflicts, 119 tests green in ~87 min.**

---

## Table of contents
- [Install](#install)
- [Quickstart — the three-command flow](#quickstart--the-three-command-flow)
- [Quickstart — manual mode](#quickstart--manual-mode)
- [Quickstart — auto mode (deep-dive)](#quickstart--auto-mode-deep-dive)
- [What gets created on disk](#what-gets-created-on-disk)
- [Scripts](#scripts)
- [Halt codes](#halt-codes)
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
   - Copies `feature-worker.md` and `feature-reviewer.md` into
     `~/.pi/agent/agents/` so `pi-subagents` can discover them.
   - Symlinks `pi-epic-*` and `pi-feature-*` from the package into
     `~/.local/bin` so you can call them from any shell.
3. Prints a hint if `~/.local/bin` isn't on your `PATH` yet.

Both side-effects are **idempotent** and **defensive** — they never clobber
your local edits; on conflict they write `*.new` siblings and warn.

Verify:

```bash
which pi-epic-init pi-feature-start pi-feature-complete   # all should resolve
ls ~/.pi/agent/agents/feature-*                            # both files present
```

### Optional: install pi-subagents (only needed for auto mode)

```bash
pi install npm:pi-subagents
pi install npm:pi-intercom   # nicer in-chat prompts; optional but recommended
```

---

## Quickstart — the three-command flow

From your repo, on the branch you want to PR into:

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
| `pi-epic-init <slug> [--from <design-file>]` | Create the epic folder + branch + STATE.md. Auto-commits a `.gitignore` for pi runtime state. |
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

Every halt writes `.pi/epics/<id>/halt-<UTC>.md` with the failing step, the
worker/review reports involved, what the human needs to decide, and the exact
resume command.

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

L-001 through L-014 are documented today. Contributions of new lessons via
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
rm ~/.pi/agent/agents/feature-worker.md ~/.pi/agent/agents/feature-reviewer.md
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
