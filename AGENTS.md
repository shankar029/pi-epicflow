# Agent instructions — pi-epicflow

Read this first if you're an AI coding agent working on this repo.

## What this repo is

A [pi](https://pi.dev) extension that ships two complementary pillars:

1. **Epic workflow** (`skills/epic-feature-workflow/`) — multi-feature
   deliverables via worktree-per-feature + long-lived epic branch +
   single-PR-to-main. See `README.md` for the operator flow.
2. **Project memory** (`skills/project-memory/`, new in v0.13) —
   persistent, file-based project brain in `.pi/project/`.

## Read these on entry

Before answering non-trivial questions:

1. **`.pi/project/index.md`** — router to the brain (always-loaded).
2. **`.pi/project/charter.md`** — goal, non-goals, quality bar.
3. **`.pi/project/conventions.md`** — always/never rules. Note **C-001
   (anti-stub HARD RULE)**: no `TODO` / `FIXME` / `NotImplementedError` /
   bare `pass` bodies in shipped code, ever.
4. **`.pi/project/decisions.md`** — DEC-001..N. Cite by DEC-id when
   referencing past choices.
5. **`.pi/project/backlog.md`** — deferred items. Check before
   proposing "we should also do X" — X may already be parked.
6. **`.pi/project/sessions.md`** — prior session log.

## Triggers that produce writes

The `project-memory` skill (loaded automatically) details all triggers.
The high-frequency ones to internalize:

- User says *"defer X to v2"* / *"out of scope"* with a work-item noun →
  append a BL-NNN entry to `backlog.md` **at the moment of utterance**,
  not at session end.
- User says *"let's go with X over Y"* with a technical noun →
  append a DEC-NNN entry to `decisions.md` (include alternatives,
  consequences).
- User says *"always do X"* / *"never do Y"* / *"from now on"* →
  append a C-NNN entry to `conventions.md`.

Writes are append-only. Corrections are new entries with `supersedes:
<old-id>`, not edits to history. (One narrow exception: the
in-progress placeholders in an open `sessions.md` S-NNN entry are edited
in place when closing the session — see SKILL.md.)

## When to delegate to a sub-agent

Use the custom `epicflow-*` personas (not generic pi-subagents):

| Task | Persona |
|---|---|
| Read-only repo recon, >5 files to summarize | `epicflow-scout` |
| Web research, >2 sources needed | `epicflow-researcher` |
| Concrete impl, >1 file or >~50 LOC or needs research | `epicflow-worker` |
| Independent review of a diff before commit/merge | `epicflow-reviewer` |
| Second opinion on a risky plan or architecture | `epicflow-oracle` |

Each persona auto-primes on `.pi/project/`, follows a strict output
template, has a bounded budget, and refuses on over-scope.

## Quality bar (must pass before "done")

- `install/smoke-test.sh` and `install/smoke-test.ps1` both green
  (currently 29/29).
- Anti-stub grep clean on touched files
  (`agents/feature-reviewer.md` CHK-1).
- CHANGELOG entry added under the in-progress `[X.Y.Z-dev]` section
  with any new L-NNN lessons.
- If your change introduced a new operator script: PowerShell mirror in
  `skills/epic-feature-workflow/scripts-win/` (per C-003).

## See also

- `README.md` — operator-facing overview (both pillars).
- `CHANGELOG.md` — full version history with L-NNN lessons embedded.
- `PLAN-v<latest>.md` — the in-flight version's design record.
- `skills/project-memory/SKILL.md` — canonical project-memory rules.
- `skills/epic-feature-workflow/SKILL.md` — canonical epic-workflow rules.
