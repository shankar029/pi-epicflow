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

See plan.md for full details. Summary below.

**Files I will touch:**
- `skills/epic-feature-workflow/scripts/pi-epic-validate-decomposition` — add deliverables validation phase in the Python heredoc

**Files I will read for context (not edit):**
- `skills/epic-feature-workflow/scripts/_common.sh` — checked for helpers; not editing
- `.pi/epics/done/0001-observability-v09/decomposition.yaml` — backward compat test target
- `skills/epic-feature-workflow/templates/epic-config.yaml` — confirm strict_deliverables field exists

**AC interpretation:** See plan.md §4 for literal expected behavior per criterion.

**Ambiguities:** None (all resolved in plan.md §6).

**Anti-scope (per plan.md §5):**
- Configurable `deliverable_rules:` in epic-config.yaml (v0.11)
- `changelog_entry` and `docs_updates` triggers (not in F02 AC)
- `_common.sh` helper `feature_declared_deliverables` (F04)
- E2E gate in `pi-epic-complete` (F06)
- Prompt changes (F03)

## 5. TODO checklist (optional)

- [ ] Step 1
- [ ] Step 2

## 6. Progress log (append-only, newest on top)

### 2026-05-18 13:45
- changes: `skills/epic-feature-workflow/scripts/pi-epic-validate-decomposition` (+142/-2)
- why: implemented deliverables trigger engine (all 8 ACs)
- next: reviewer pass, then pi-feature-complete

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Anything explicitly deferred to another feature in the DAG.
