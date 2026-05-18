# <Feature title>

> Status: pending · Branch: `feat/<epic-slug>/F<NN>-<slug>` · See `meta.yaml`
>
> Epic: [`<epic-id>`](../../design.md) · This feature implements: <link to feature in decomposition.yaml>

## 1. Goal

What this feature delivers (1–2 sentences). Pull from `decomposition.yaml`
summary + acceptance criteria. The end-goal of the epic stays authoritative;
this is the slice.

## 2. Acceptance criteria

Mirror from `decomposition.yaml`. Tick as satisfied:

- [ ] <criterion 1>
- [ ] <criterion 2>

## 3. Decisions (ADR-style, append-only)

Implementation-time decisions specific to this feature. Mirror one-liners to
the epic's `design.md` §4.

<!-- Append below; never edit past entries.

### ADR-001: <title>
- **Date:** YYYY-MM-DD
- **Status:** accepted | superseded by ADR-NNN
- **Context:** Why this decision is needed.
- **Decision:** What was decided.
- **Consequences:** Trade-offs accepted.
-->

## 4. Plan (mandatory; fill BEFORE first edit)

Worker must populate this section before making ANY code edits. Reviewer
validates the diff against this plan. If reality diverges, log to
`deviations.md` with rationale.

**Files I will touch:**
- `<path>` — <why>

**Files I will read for context (not edit):**
- `<path>` — <why>

**AC interpretation (literal expected behavior per criterion):**
- AC 1: <literal expected output / behavior — exact string, exact exit code, exact schema>
- AC 2: ...

**Ambiguities (HALT with H1 if any are blocking):**
- _(none)_  OR  - <question for orchestrator>

**Anti-scope (explicitly NOT in this feature):**
- _(none)_  OR  - <out-of-scope item, deferred to F0N>

## 5. TODO checklist (optional)

- [ ] Step 1
- [ ] Step 2

## 6. Progress log (append-only, newest on top)

<!-- Add new entries on top.

### YYYY-MM-DD HH:MM
- changes: <files touched>
- why: <one-line rationale>
- next: <what to pick up next session>
-->

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Anything explicitly deferred to another feature in the DAG.
