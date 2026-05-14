---
title: pi-epicflow
description: Ship multi-feature work as one clean PR.
---

> **Ship multi-feature work as one clean PR.** A [pi](https://pi.dev)
> extension that decomposes a `design.md` into a DAG of small features, runs
> each on its own git worktree + short-lived branch, squash-merges back into
> a long-lived **epic branch**, and opens a **single reviewable PR to main**
> when the whole epic is done. Halts only when truly blocked.

<p align="center">
  <a href="https://github.com/shankar029/pi-epicflow/actions/workflows/smoke.yml">
    <img alt="smoke" src="https://github.com/shankar029/pi-epicflow/actions/workflows/smoke.yml/badge.svg">
  </a>
  <a href="https://github.com/shankar029/pi-epicflow/blob/main/LICENSE">
    <img alt="MIT" src="https://img.shields.io/badge/license-MIT-blue.svg">
  </a>
  <a href="https://github.com/shankar029/pi-epicflow/releases/latest">
    <img alt="release" src="https://img.shields.io/github/v/release/shankar029/pi-epicflow?label=release&color=5f87ff">
  </a>
  <a href="https://pi.dev">
    <img alt="pi >= 0.74" src="https://img.shields.io/badge/pi-%E2%89%A50.74-5f87ff.svg">
  </a>
</p>

---

## Install

```bash
pi install git:github.com/shankar029/pi-epicflow
```

That's it. The postinstall step pulls in [`pi-subagents`](https://www.npmjs.com/package/pi-subagents) and [`pi-intercom`](https://www.npmjs.com/package/pi-intercom) automatically. Opt out with `PI_EPICFLOW_NO_AUTOINSTALL_DEPS=1` if you want to manage them yourself.

## Quickstart

```bash
# 1. From the repo where you want to ship the work
cd ~/code/<your-project>
git checkout main && git pull

# 2. Bootstrap an epic from a design doc
pi-epic-init my-epic --from ./DESIGN.md --title "My epic"

# 3. Open pi and run two slash commands
pi
```

Inside pi:

```
/epic-decompose      # propose 3–7 features as a DAG; you approve
/epic-run-auto       # orchestrator + subagents take it from here
```

The orchestrator runs each feature in its own git worktree with a fresh
subagent context, runs your test suite as the merge gate, squash-merges into
the epic branch, and opens a single PR to `main` when the whole epic is
green. Halts (rather than guesses) when something is truly ambiguous.

## How it works

```text
  design.md  ────────────────────┐
  (you write this, in pi or alone)│
                                  ▼
                        ┌───────────────┐
                        │ /epic-decompose │  pi proposes 3–7 features
                        │   (one turn)    │  with deps, scope, ACs
                        └────────┬────────┘  you approve once
                                 ▼
         decomposition.yaml (committed)
                                 ▼
                        ┌───────────────┐
                        │ /epic-run-auto  │  orchestrator loop
                        └────────┬────────┘
                                 │
            for each ready feature in DAG order:
                                 │
   ┌──────────────┬──────────────┴──────────────┬──────────────┐
   ▼              ▼                             ▼              ▼
 worktree +    feature-worker             feature-reviewer   squash-merge
 branch       subagent (fresh ctx,        subagent (fresh    into epic branch
 spawned       isolated impl + tests)     ctx, reads diff)   delete branch+wt
                                                             archive feature
                                                             │
                                                             ▼
                                                      deviations.md
                                                      (auto-logged)
                                 │
                                 ▼
                       all features merged?
                                 │
                                 ▼
                       pi-epic-complete
                       rebase + test + lessons
                       distillation + PR open
```

Four reasons it scales where naive "agent in one big context" doesn't:

1. **Each feature gets a fresh subagent context.** Worker tokens spent on F03
   don't pollute F04's context or the orchestrator's. Orchestrator context
   grows by ~1 KB of `worker-report.md` per feature, not by the diff size.
2. **Each feature gets its own git worktree.** No `git stash` dance, no
   branch-switching mid-implementation, no merge conflicts mid-feature.
3. **The decomposition is YAML, not chat.** Once approved, it's the
   contract. Any departure goes into `deviations.md` with a reason.
   Reviewable. Diffable. Version-controlled.
4. **Halts, not guesses.** Tests fail 3×? Merge conflict? Ambiguous spec?
   Write a halt report with the exact resume command and stop. Bad guesses
   at hour 3 waste hours; halts lose minutes.

## When to use it

✅ **Good fit**

- A real design doc (or you can write one) — 200+ lines of context.
- 3–20 features, each shippable in 20–60 minutes by an LLM.
- A test suite (or willingness to grow one feature-by-feature) — it's the
  merge gate.
- Git, with `gh` CLI on PATH if you want auto-PR.

❌ **Don't use it for**

- One-off scripts or single-file edits — overhead isn't worth it.
- Exploratory spikes where the design is the deliverable — there's nothing
  to decompose.
- Repos where you can't add a test suite — the merge gate degrades to
  "agent's self-assurance," which is not a gate.

## Two modes

- **Auto mode** *(recommended)* — the three slash commands above drive the
  whole pipeline. Requires `pi-subagents`.
- **Manual mode** — call the `pi-epic-*` and `pi-feature-*` CLI scripts
  yourself. Same on-disk state, same halt codes, no subagents needed.

Mix freely: start auto, drop to manual for a tricky feature, hop back.

## Status

- **v0.3.0** — beta. Validated on a 5-feature epic by an outside user.
- Pre-1.0 gate is tracked openly in
  [`RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md): three independent epics,
  every halt code exercised, macOS + Linux coverage, then we cut 1.0.
- Bugs found in your run = lessons-shaped contributions welcomed.

## Read more

- **[Full README](https://github.com/shankar029/pi-epicflow/blob/main/README.md)** —
  the long version with a worked `todoq` example, the full file layout, and
  every halt code explained.
- **[Design doc](design.md)** — why the architecture is shaped this way
  (subagents, worktrees, YAML decomposition, halts).
- **[Release checklist](RELEASE-CHECKLIST.md)** — what "ready for 1.0"
  means, with an open ledger of outside-user epics.
- **[Lessons](https://github.com/shankar029/pi-epicflow/blob/main/skills/epic-feature-workflow/lessons.md)** —
  every prompt/skill regression the agent has accumulated, by `L-NNN` id.
- **[Changelog](https://github.com/shankar029/pi-epicflow/blob/main/CHANGELOG.md)** —
  release notes.

## License

MIT. Use it, fork it, ship with it.
