# Project Memory — Index

> Router for pi's persistent project brain. Always loaded at session start.
> Keep this file small (≤150 lines). Link out; don't dump content here.

**Repo:** {{PROJECT_NAME}}
**Owner persona:** pi acts as the long-term owner of this repo.
**Last verified:** {{DATE}}

## Artifacts in `.pi/project/`

| File | Purpose | Last verified |
|---|---|---|
| `charter.md` | Project goal, non-goals, quality bar, owner persona. Rarely changes. | {{DATE}} |
| `conventions.md` | Coding norms, anti-stub rule, naming, error handling, "always/never" rules. Read before any non-trivial edit. | {{DATE}} |
| `decisions.md` | ADR-lite log of non-trivial choices and their alternatives. Append-only. | {{DATE}} |
| `backlog.md` | Parking lot of deferred work / out-of-scope items. Append-only. | {{DATE}} |
| `sessions.md` | Append-only log of every pi session: goal, status, summary, linked DEC/BL ids. | {{DATE}} |

## Module map

> One row per significant module/subsystem. Phase 2 will add a per-module
> card under `.pi/modules/<name>.md`. For now, link directly to code.

| Module | Path | Purpose | Last verified |
|---|---|---|---|
| _(none yet)_ | | | |

## Cross-references

- Root `AGENTS.md` references this index — sessions should land here first.
- Epicflow epics live under `.pi/epics/<id>/` and may reference items
  from `backlog.md` when promoting deferred work into a formal epic.
- The `project-memory` skill (`skills/project-memory/SKILL.md` in
  pi-epicflow) defines the read/write protocol.

## How to use this file (for pi)

1. On session start, read this file first.
2. If the user's task obviously touches one of the linked artifacts,
   read that artifact too before answering.
3. When you add a new module card, write a row above and bump
   `last_verified`.
4. When you discover this file is stale, update the relevant row's
   `last_verified` date as part of the end-of-task sweep.
