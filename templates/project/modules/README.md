# Module Cards

> One file per significant module/subsystem of the repo. Each card is a
> ≤200-line "what you need to know to touch this module" brief written
> by pi (or the user) the first time the module needs explanation, and
> updated when it materially changes.
>
> File naming: `<name>.md` (kebab-case, matches the module's filesystem
> path where possible). Archive obsolete cards by renaming to
> `<name>-archived-<YYYY>.md` and updating `index.md`.
>
> The template for new cards is in [`_template.md`](./_template.md) —
> copy it, fill in the sections, register the card in
> `.pi/project/index.md` "Module map" table.

## When to write a card

Write or update a card when:

1. The user (or you) explains a module in detail for the first time,
   and the explanation is non-obvious from `README.md` or source code.
2. A non-trivial decision lands that affects how to touch this module
   (e.g. "we keep schema and handlers in sync via a generated file").
3. A footgun is discovered that's specific to this module
   (cross-reference the `G-NNN` entry).

## When NOT to write a card

- Single-file modules where source code is self-documenting.
- Modules that haven't been touched in >6 months (stale by default).
- Boilerplate / config / vendored dirs.

## Audit

`/project-review` Step A-6 flags:

- Modules in `.pi/project/index.md` "Module map" with no card.
- Cards whose `**Last verified:**` is > 90 days old.
- Cards whose underlying source path no longer exists.
