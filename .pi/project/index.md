# Project memory — pi-epicflow

**Last verified:** 2026-05-26
**Maintainer:** pi (autonomous) + repo owner on confirm

This is the durable brain for the pi-epicflow repo. Pi reads this on
session entry and writes here when triggered (see the `project-memory`
skill). Append-only; never edit history.

## Artifacts in `.pi/project/`

| File | Purpose |
|---|---|
| [charter.md](./charter.md) | Goal, non-goals, quality bar, owner persona |
| [conventions.md](./conventions.md) | Always/never rules — including anti-stub |
| [decisions.md](./decisions.md) | ADR-lite log of choices and alternatives |
| [backlog.md](./backlog.md) | Deferred work, each with a revisit-trigger |
| [sessions.md](./sessions.md) | Per-session log: goal, status, summary, links |

## Module map

| Path | Owner | Status | Last verified | Notes |
|---|---|---|---|---|
| `skills/epic-feature-workflow/` | core | stable | 2026-05-26 | The epic pillar. ~2.5k LOC bash + ~1.7k LOC PowerShell mirror. See L-046, L-049, L-053. |
| `skills/project-memory/` | core | new (v0.13) | 2026-05-26 | The project-memory pillar. SKILL.md is canonical. |
| `agents/feature-*.md` | core | stable | 2026-05-26 | Epic-pipeline personas (planner, worker, reviewer, epic-reviewer). |
| `agents/epicflow-*.md` | core | new (v0.13) | 2026-05-26 | Project-memory personas (scout, researcher, worker, reviewer, oracle). |
| `prompts/` | core | active | 2026-05-26 | 7 slash commands: /epic-decompose, /epic-run-auto, /project-init, /project-onboard, /project-review, /session-end. |
| `templates/project/` | core | new (v0.13) | 2026-05-26 | 6 brain templates used by /project-init. |
| `install/postinstall.mjs` | core | stable | 2026-05-26 | Auto-discovers agents (L-050), copies templates, registers skills/prompts. |

## Cross-references

- **External:** [README.md](../../README.md), [CHANGELOG.md](../../CHANGELOG.md), in-flight `PLAN-v*.md` files at repo root.
- **Lessons:** the canonical lessons archive is the CHANGELOG `Lessons added` blocks (L-001..L-059+); cite by L-NNN id.
- **Schemas:** `schemas/` (epic-config, decomposition, deviations, lessons).
