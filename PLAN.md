# pi-epicflow v0.5.0 Plan

**Goal:** Ship v0.5.0 with hybrid planner architecture: always-on worker plan-first, optional feature-planner subagent gated by decomposition-time `needs_planner` flag, plus the L-019/L-020/L-021 decomp-quality patches and `kind: spike` support.

**Status:** in progress
**Started:** 2026-05-14
**Triggered by:** Harmony GenUI v2 epic readiness; user requested direct v0.5 jump skipping v0.4 baseline.

## Confirmed scope (user-approved)

- L-019 — `pi-feature-start` auto-commits scaffold (F01/F02 fix)
- L-020 — validator rejects unsafe-leading-char AC strings
- L-021 — validator checks `scope_files` paths exist
- `kind: feature|spike` schema in decomposition.yaml (default template = structured option B)
- Literal-sample enforcement for golden/snapshot/wire-shape AC
- Manifest-touching fan-out hint (in decompose prompt)
- Worker plan-first contract (always-on)
- `feature-planner` subagent + orchestrator gating
- H9 (planner-blocked) + H10 (worker-deviated-from-plan, soft via reviewer)
- Escape hatches: `pi-epic-init --no-planner`, per-feature `needs_planner: false` override
- Epic-level `reference_paths:` generic field (planner reads when tagged)

## Confirmed defaults

- Trigger threshold: **any 2 of 7** (env-var tunable `PI_EPICFLOW_PLANNER_THRESHOLD`)
- Worker plan-first paragraph: **always-on, no toggle**
- Spike AC scaffold: **option B (structured: decision/evidence/impact)**
- Planner reads `reference_paths`: **yes, with 100KB soft cap per file**

## Steps

### Phase A — Foundations

- [ ] 1. Write PLAN.md (this file)
- [ ] 2. L-019: `pi-feature-start` auto-commits scaffold after creating feature.md/meta.yaml
- [ ] 3. L-020: validator rejects AC strings starting with reserved YAML chars (`*`, `&`, `!`, `|`, `>`, `%`, `@`, backtick)
- [ ] 4. L-021: validator checks `scope_files` non-glob entries exist on filesystem (warning, not error)
- [ ] 5. Update `templates/decomposition.yaml` — new fields: `kind`, `needs_planner`, `planner_triggers`, `reference_paths`
- [ ] 6. Validator accepts new fields and validates them

### Phase B — Always-on worker plan-first

- [ ] 7. Update `templates/feature.md` §4 — explicit Plan structure
- [ ] 8. Update `agents/feature-worker.md` — mandatory ## Plan section before edits
- [ ] 9. Update `agents/feature-reviewer.md` — plan-vs-impl validation

### Phase C — Spike support

- [ ] 10. New `templates/feature-spike.md` (structured decision template)
- [ ] 11. `pi-feature-start`: select template by `kind`
- [ ] 12. `pi-feature-complete`: allow spike features to merge with decision-only diff
- [ ] 13. `agents/feature-worker.md`: spike-mode loop (decision artifact, code optional)
- [ ] 14. `agents/feature-reviewer.md`: spike-mode validation

### Phase D — Feature-planner subagent

- [ ] 15. New `agents/feature-planner.md` (subagent definition)
- [ ] 16. New `templates/plan.md` (plan artifact spec)
- [ ] 17. `install/postinstall.mjs`: copy feature-planner.md
- [ ] 18. Update `agents/feature-worker.md`: when plan.md exists, treat as binding contract

### Phase E — Orchestrator gating

- [ ] 19. Update `prompts/epic-run-auto.md`:
  - New phase: `planning <fid>` before `worker-running <fid>`
  - Gate on `needs_planner` flag
  - Halt code H9 (planner-blocked)
  - Pass plan.md path to worker
  - Reviewer plan-vs-impl flow

### Phase F — Escape hatches

- [ ] 20. `pi-epic-init --no-planner` flag → writes `disable_planner: true` to epic meta.yaml
- [ ] 21. Helper resolves effective `needs_planner` (per-feature flag AND epic-level disable AND env-var override)

### Phase G — Decomp prompt updates

- [ ] 22. `prompts/epic-decompose.md`:
  - Document new fields
  - Trigger checklist (any 2 of 7)
  - Manifest fan-out hint
  - Literal-sample requirement for golden/snapshot/wire AC
  - Spike-kind examples
  - `reference_paths` field

### Phase H — Docs

- [ ] 23. `CHANGELOG.md` — v0.5.0 entry
- [ ] 24. `README.md` — document new features
- [ ] 25. `skills/epic-feature-workflow/lessons.md` — append L-019/L-020/L-021/L-022
- [ ] 26. Bump `package.json` to 0.5.0
- [ ] 27. Commit + tag v0.5.0-rc1

### Phase I — Smoke test (Day 2, ~2h)

- [ ] 28. Build toy 4-feature epic at `~/code/scratch/epicflow-v05-smoke/`
- [ ] 29. F1 plain (untagged), F2 tagged, F3 spike, F4 planner-disagrees
- [ ] 30. Run /epic-decompose, verify tagging
- [ ] 31. Run /epic-run-auto end-to-end
- [ ] 32. Verify: plan-first, planner subagent, spike kind, H9 fires
- [ ] 33. Cut v0.5.0 if rc1 clean

## Trigger checklist (in decompose prompt)

Tag `needs_planner: true` if **any 2 of 7** fire:

1. AC references an existing subsystem whose call sites NOT verified
2. AC contains literal sample I/O, exit codes, schema shapes
3. `scope_files` crosses ≥2 module/package boundaries
4. `depends_on` chain depth ≥3
5. `estimated_hours` ≥10
6. AC count ≥6
7. Description contains: thread/wire/integrate/migrate/default/rollout/deprecate

## Risk register

- New halt codes untested at scale → smoke test mandatory before AGUI epic.
- Trigger thresholds are guesses → env-var tunable, conservative bias to over-tag.
- Plan-vs-impl reviewer check may cause REQUEST_CHANGES loops → reviewer prompt must explicitly accept deviations with rationale.
- Schema changes to decomposition.yaml — legacy yamls without new fields must default cleanly (test).

## Rollback

- v0.3.1 is the previous stable tag. Revert to that if rc1 reveals systemic issues.
- v0.4.0 / v0.4.1 intermediate tags skipped per user direction; if needed, can be cut from v0.5.0 with the planner half stripped.

## Decisions log

- 2026-05-14 — Skipped v0.4 baseline. User accepts trigger-tuning risk on first run of AGUI epic.
- 2026-05-14 — Generic `reference_paths` field (epic-level), not project-specific. Pi-epicflow ships mechanism only.
- 2026-05-14 — Spike default AC = option B (structured: decision/evidence/impact). Overridable per-spike.
- 2026-05-14 — Threshold "any 2 of 7", env-var tunable as `PI_EPICFLOW_PLANNER_THRESHOLD`.
