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

**Files I will touch:**
- `agents/feature-reviewer.md` — add Mock honesty + E2E selector quality rubric items + v0.11 note
- `agents/feature-epic-reviewer.md` — add E2E coverage rate rubric item + v0.11 note

**Files I will read for context (not edit):**
- `design.md` §6 — reviewer contract changes spec
- `decomposition.yaml` — AC definitions, field names
- `agents/feature-worker.md` — understand Declared deliverables section (F04)

**AC interpretation:**
- AC 1: feature-reviewer.md gains a rubric sub-section "Mock honesty (soft)" that instructs the reviewer to read mock_fixtures files, compare shapes against real SDK, and flag hallucinated/missing fields. Explicitly marked SOFT (does not block APPROVE).
- AC 2: feature-reviewer.md gains a rubric sub-section "E2E selector quality (soft)" instructing reviewer to flag fragile selectors (random classes, deep xpath, text-only without role). Prefers data-testid/role/label. Explicitly SOFT.
- AC 3: Both items contain the word "soft" and explicit statement that they do not block APPROVE in v0.10.
- AC 4: feature-epic-reviewer.md gains an "E2E coverage rate" rubric item in §2 that reads tests/e2e-report.json when present, reports declared/passing/failing/skipped/missing. Gracefully no-ops when file absent.
- AC 5: Both files contain a note: "v0.11 may promote mock-honesty from soft to hard; v0.10 is a calibration release."
- AC 6: Word count growth ≤ 20% in each file. Baseline: feature-reviewer.md=1164w, feature-epic-reviewer.md=1958w. Max: 1397w, 2350w.

**Ambiguities:**
- _(none)_

**Anti-scope:**
- No script changes
- No changes to feature-worker.md (F04's domain)
- No AC↔scenario coverage rubric (design mentions it but AC doesn't require it)

## 5. TODO checklist (optional)

- [ ] Step 1
- [ ] Step 2

## 6. Progress log (append-only, newest on top)

### 2026-05-18 14:30
- changes: agents/feature-reviewer.md, agents/feature-epic-reviewer.md
- why: Added Mock honesty (soft), E2E selector quality (soft), E2E coverage rate rubric items + v0.11 notes
- next: Review and merge

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Anything explicitly deferred to another feature in the DAG.
