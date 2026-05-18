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
- `prompts/epic-decompose.md` — add Deliverables section, trigger rules, worked examples, checklist item

**Files I will read for context (not edit):**
- `skills/epic-feature-workflow/templates/decomposition.yaml` — field names and comments to match
- `.pi/epics/done/0001-observability-v09/decomposition.yaml` — real decomposer output for example modeling
- `.pi/epics/0002-deliverables-contract-v10/design.md` — design §4.3 trigger rules
- `.pi/epics/0002-deliverables-contract-v10/decomposition.yaml` — normative ACs for F03

**AC interpretation (literal expected behavior per criterion):**
- AC 1: New markdown section titled exactly `### Deliverables (v0.10+)` with 4 subsections (one paragraph each) for `e2e_scenarios`, `mock_fixtures`, `docs_updates`, `changelog_entry`.
- AC 2: A trigger-rules table matching F02's validator: user-facing verbs → e2e_scenarios; SDK imports → mock_fixtures; user-observable behavior → changelog_entry; public API → docs_updates.
- AC 3: Two fenced YAML examples — (a) user-facing feature with all 4 fields populated; (b) pure refactor with `e2e_skip_reason` and empty deliverables.
- AC 4: In Step 5 (final validate), add checklist item about `pi-epic-validate-decomposition` + `strict_deliverables` + `e2e_skip_reason`.
- AC 5: Final word count ≤ 4177 (3213 × 1.3).

**Ambiguities:**
- _(none)_

**Anti-scope:**
- No changes to `prompts/epic-design.md` (dropped before epic started)
- No script changes
- No template changes (F01 already did those)

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
