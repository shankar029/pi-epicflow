# Global Memory — Index

> Router for pi's **cross-repo** project brain. Loaded on session
> entry **after** per-repo `.pi/project/index.md`. Per-repo entries
> always win on conflict; this file holds your personal/team
> preferences that apply across every repo.
>
> Keep this file small (≤100 lines). Link out; don't dump content here.

**Owner:** {{OWNER_NAME}}
**Last verified:** {{DATE}}

## Read for X (global routing)

| If the task touches… | Read |
|---|---|
| "How do I usually do X?" / personal style | [charter](#charter), [conventions](#conventions) |
| "I always pick A over B" / cross-repo defaults | [decisions](#decisions) |
| Conflict between this repo and my preference | per-repo wins; surface the conflict |

## Artifacts in `~/.pi/global-memory/`

<a id="charter"></a>
### charter.md _(optional)_
Personal/team identity: who you are, the kind of work you do, the
quality bar you carry across every project. Rarely changes.
**Last verified:** {{DATE}}

<a id="conventions"></a>
### conventions.md
Always/never rules that apply across **every** repo you work on
(e.g. "always use ruff for Python projects", "never commit without
running tests locally"). Cite by `GC-NNN` (Global Convention) to
distinguish from per-repo `C-NNN`.
**Last verified:** {{DATE}}

<a id="decisions"></a>
### decisions.md
Cross-repo decisions (e.g. "default to uv for Python dependency
management", "Postgres over MySQL for new services unless there's a
reason"). Cite by `GD-NNN` (Global Decision). When a per-repo
`.pi/project/decisions.md` has a `DEC-NNN` covering the same topic,
the per-repo entry wins.
**Last verified:** {{DATE}}

## Why no `sessions.md` / `backlog.md` here?

Sessions are inherently per-repo (a session happens *in* a repo).
Backlog items are scoped to the repo that produced them. Cross-repo
patterns surface as conventions or decisions, not as work items.

If you have cross-repo work to track, open per-repo backlog items in
each affected repo and tag them with `cross-repo: yes` in the entry.

## How to use this file (for pi)

1. Load this file **after** the per-repo `.pi/project/index.md` on
   session entry.
2. Surface a one-line "global overlay loaded" note in the "context
   loaded" section.
3. When applying a rule, prefer per-repo over global. If both
   contradict, follow per-repo and surface the conflict to the user.
4. Write triggers (see `skills/project-memory/SKILL.md` "Global
   overlay"):
   - "globally always X" / "across all my repos" → `conventions.md` (`GC-NNN`)
   - "I always go with X in any new project" → `decisions.md` (`GD-NNN`)
