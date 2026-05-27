# Project Memory — Index

> Router for pi's persistent project brain. Always loaded at session start.
> Keep this file small (≤200 lines). Link out; don't dump content here.

**Repo:** {{PROJECT_NAME}}
**Owner persona:** pi acts as the long-term owner of this repo.
**Last verified:** {{DATE}}

## Read for X (progressive-disclosure routing)

Use this table to load **only** the artifacts a turn actually needs.
The agent should not slurp every artifact on session start — read this
file plus the rows that match the task at hand.

| If the user's task touches… | Read in this order |
|---|---|
| Project goal / quality bar / non-goals | [charter](#charter) |
| Code style / always-never rules / anti-stub | [conventions](#conventions) |
| "Why was X chosen?" / changing a past choice | [decisions](#decisions), then [conventions](#conventions) if a rule is implicated |
| Deferred work / "didn't we agree to defer Y?" | [backlog](#backlog) |
| "What did we do last time?" / resumed work | [sessions](#sessions) |
| Tricky bug / footgun / surprising library behavior | [gotchas](#gotchas) (if present) |
| Open unresolved question / "we're still deciding" | [questions](#questions) (if present) |
| A specific module / subsystem | [modules](#modules) → matching card |
| Cross-repo personal preferences (opt-in) | global overlay (see [global](#global)) |

If the task spans multiple rows, read **all** matching artifacts before
acting. If unsure, default to charter + conventions (cheap, always
relevant).

## Artifacts in `.pi/project/`

<a id="charter"></a>
### charter.md
Project goal, non-goals, quality bar, owner persona. Rarely changes.
**Last verified:** {{DATE}}

<a id="conventions"></a>
### conventions.md
Coding norms, anti-stub rule, naming, error handling, "always/never"
rules. Read before any non-trivial edit. Cite by `C-NNN`.
**Last verified:** {{DATE}}

<a id="decisions"></a>
### decisions.md
ADR-lite log of non-trivial choices and their alternatives. Append-only.
Cite by `DEC-NNN`. Archive trigger: 500 entries OR any entry > 2 years
old → `decisions-archive-YYYY.md`.
**Last verified:** {{DATE}}

<a id="backlog"></a>
### backlog.md
Parking lot of deferred work / out-of-scope items. Append-only. Cite by
`BL-NNN`. Archive trigger: 200 entries OR any open entry > 180 days.
**Last verified:** {{DATE}}

<a id="sessions"></a>
### sessions.md
Append-only log of every pi session: goal, status, summary, linked
DEC/BL ids. Cite by `S-NNN`. Archive trigger: 150 entries OR any
closed entry > 1 year.
**Last verified:** {{DATE}}

<a id="gotchas"></a>
### gotchas.md _(Phase 2; add via `/project-init` re-run or create
manually from `templates/project/gotchas.md`)_
Footguns, surprising library behavior, version-specific quirks. Each
entry has a fix and a "still applies if" trigger. Cite by `G-NNN`.
**Last verified:** {{DATE}}

<a id="questions"></a>
### questions.md _(Phase 2; same)_
Open questions that the project is *tracking but hasn't resolved*. Each
question has an owner and a "resolves when" trigger. Cite by `Q-NNN`.
Questions resolve into `decisions.md` entries (with `resolves: Q-NNN`).
**Last verified:** {{DATE}}

<a id="modules"></a>
### modules/
Per-module/subsystem cards under `.pi/project/modules/<name>.md`.
Each card answers: what does this module do, who owns it, where to
start reading, known gotchas, related decisions. No global limit on
card count; archive individual cards by renaming to
`<name>-archived-YYYY.md` and updating the row below.

| Module | Path | Card | Status | Last verified |
|---|---|---|---|---|
| _(none yet)_ | | | | |

## Archives

Older entries that have been split out by size/age caps. Each archive
file lives next to its source artifact (e.g. `decisions-archive-2024.md`
next to `decisions.md`). When loading on session start, prefer the
live file; load archives only when the agent explicitly grep-finds a
relevant id there.

| Archive | Source | Date range | Reason |
|---|---|---|---|
| _(none yet)_ | | | |

<a id="global"></a>
## Global overlay (optional, opt-in)

If `~/.pi/global-memory/` exists, pi loads it on session entry **after**
this file but **before** any non-trivial action. The global overlay
holds cross-repo personal/team preferences:

- `~/.pi/global-memory/charter.md` — personal/team identity.
- `~/.pi/global-memory/conventions.md` — always/never rules that apply
  across every repo.
- `~/.pi/global-memory/decisions.md` — cross-repo decisions (e.g.,
  "ruff + uv for all Python projects").

**Conflict rule:** per-repo `.pi/project/` always wins on conflict.
The agent surfaces a one-line note when a per-repo entry overrides
a global one.

Run `/project-init-global` to lay the overlay down. It's idempotent
and refuses to overwrite an existing `~/.pi/global-memory/`.

## Cross-references

- Root `AGENTS.md` references this index — sessions should land here first.
- Epicflow epics live under `.pi/epics/<id>/` and may reference items
  from `backlog.md` when promoting deferred work into a formal epic.
- The `project-memory` skill (`skills/project-memory/SKILL.md` in
  pi-epicflow) defines the read/write protocol.

## How to use this file (for pi)

1. On session start, read this file first.
2. Match the user's task against the **Read for X** routing table at
   the top. Load only matching artifacts.
3. If the task is ambiguous, default to `charter.md` + `conventions.md`.
4. After loading: **restate the active ids** (`DEC-NNN`, `BL-NNN`,
   `C-NNN`, `L-NNN`) you intend to honor on this turn. One line is
   enough.
5. If `~/.pi/global-memory/index.md` exists, load it too — global
   conventions and decisions apply unless overridden by a per-repo
   entry.
6. When writing back (DEC/BL/C/Q/G entries), append to the right file
   and update `last_verified` on touched rows above.
