# <Epic title>

> Status: design · Branch: `epic/<slug>` · See `meta.yaml`

## 1. Goal

One paragraph. What problem does this epic solve, who benefits, and what does
"done" look like? **This is the authoritative end-goal pi will optimize for**
when deviating from the decomposition.

## 2. Scope

- **In scope:** what this epic delivers.
- **Out of scope:** explicitly NOT in this epic (prevents scope creep mid-flight).

## 3. Design

The shape of the solution. Approaches considered, what was chosen, why.
Diagrams, schemas, file maps as needed. Long enough to be useful, short
enough to read in one sitting.

## 4. Decisions log (epic-level)

Pre-implementation strategic decisions. Implementation-time decisions live in
each feature's `feature.md` §3 ADRs and get mirrored here as one-liners.

- **YYYY-MM-DD — D-1. <title>.** <one-line summary + rationale>

## 5. Constraints / non-negotiables

- Backward-compat? API stability? Performance? Security? Anything pi must not break.

## 6. References

- Related repos, prior designs, external specs, issue links.

---

_The decomposition (feature DAG, scope, acceptance criteria) lives in
`decomposition.yaml`. Per-feature implementation journals live in
`features/F<NN>-<slug>/feature.md`. Deviations from the plan live in
`deviations.md`. This file is the "why we're doing this and what done looks
like" — keep it stable._
