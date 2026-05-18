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

See `plan.md` for full binding plan. Summary:

**Files I will touch:**
- `skills/epic-feature-workflow/scripts/pi-epic-complete` — E2E gate phase (~100 lines)
- `skills/epic-feature-workflow/templates/epic-config.yaml` — inline comment on e2e: block
- `docs/recovery.md` — R11 section

**Files I will read for context (not edit):**
- `skills/epic-feature-workflow/scripts/_common.sh` — yaml_get dotted-path support

**AC interpretation:** See plan.md §4.

**Ambiguities:** None (resolved in plan.md §6).

**Anti-scope:** See plan.md §5.

## 5. TODO checklist (optional)

- [ ] Step 1
- [ ] Step 2

## 6. Progress log (append-only, newest on top)

### 2026-05-18 02:30
- changes: `pi-epic-complete` (+111 lines), `epic-config.yaml` (+2 comment lines), `docs/recovery.md` (+45 lines R11 section)
- why: Implemented full E2E gate per plan.md §9
- validation: bash -n pass, smoke-test 29/29, synthetic e2e success+failure+skip all verified
- next: review and merge

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Anything explicitly deferred to another feature in the DAG.
