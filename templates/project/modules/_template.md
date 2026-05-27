# Module card — {{MODULE_NAME}}

**Source path:** `<repo-relative path or glob>`
**Owner:** <who maintains this — persona / human / "core">
**Status:** new | active | stable | deprecated
**Last verified:** {{DATE}}
**Related decisions:** DEC-NNN, DEC-NNN
**Related conventions:** C-NNN
**Related gotchas:** G-NNN

## What this module does

<2-4 sentences — the role in the larger system, not an API listing.>

## How to start reading

Recommended order for a new agent / contributor:

1. `<file>` — <why this is the entry point>
2. `<file>` — <what it adds>
3. `<file>` — <what it adds>

Skip: <files that look important but aren't, with reason>.

## Internal seams

Where this module talks to other modules, by direction:

- **Calls into:** `<module>` (purpose), `<module>` (purpose)
- **Called by:** `<module>` (purpose), `<module>` (purpose)
- **Shared state:** `<file or DB table>` (read | write | both)

## Conventions specific to this module

- <"All public functions take a `Context` first arg" — link to C-NNN
  if it's a global convention.>
- <"Errors are wrapped in `ModuleError`, never raised raw."> 

## Known gotchas

- <one-line summary> — see `G-NNN`.
- …

## Open questions

- Q-NNN — <one-line summary>

## Recent changes

| Date | Session | Summary |
|---|---|---|
| YYYY-MM-DD | S-NNN | <one line> |
