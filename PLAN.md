# pi-epicflow v0.5.0 Plan

**Goal:** Ship v0.5.0 with hybrid planner architecture: always-on worker plan-first, optional feature-planner subagent gated by decomposition-time `needs_planner` flag, plus the L-019/L-020/L-021 decomp-quality patches and `kind: spike` support.

**Status:** rc1 cut + smoke-tested at script level (agent-flow smoke pending user pi session)
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

- [x] 1. Write PLAN.md (this file)
- [x] 2. L-019: `pi-feature-start` auto-commits scaffold after creating feature.md/meta.yaml
- [x] 3. L-020: validator rejects AC strings starting with reserved YAML chars (`*`, `&`, `!`, `|`, `>`, `%`, `@`, backtick)
- [x] 4. L-021: validator checks `scope_files` non-glob entries exist on filesystem (warning, not error)
- [x] 5. Update `templates/decomposition.yaml` — new fields: `kind`, `needs_planner`, `planner_triggers`, `reference_paths`
- [x] 6. Validator accepts new fields and validates them

### Phase B — Always-on worker plan-first

- [x] 7. Update `templates/feature.md` §4 — explicit Plan structure
- [x] 8. Update `agents/feature-worker.md` — mandatory ## Plan section before edits
- [x] 9. Update `agents/feature-reviewer.md` — plan-vs-impl validation

### Phase C — Spike support

- [x] 10. New `templates/feature-spike.md` (structured decision template)
- [x] 11. `pi-feature-start`: select template by `kind`
- [x] 12. `pi-feature-complete`: allow spike features to merge with decision-only diff
- [x] 13. `agents/feature-worker.md`: spike-mode loop (decision artifact, code optional)
- [x] 14. `agents/feature-reviewer.md`: spike-mode validation

### Phase D — Feature-planner subagent

- [x] 15. New `agents/feature-planner.md` (subagent definition)
- [x] 16. Plan artifact spec lives inside `agents/feature-planner.md` (no separate template needed; planner writes plan.md directly)
- [x] 17. `install/postinstall.mjs`: copy feature-planner.md
- [x] 18. Update `agents/feature-worker.md`: when plan.md exists, treat as binding contract

### Phase E — Orchestrator gating

- [x] 19. Update `prompts/epic-run-auto.md`:
  - New phase: `planning <fid>` before `worker-running <fid>`
  - Gate on `needs_planner` flag + env override + epic-level disable
  - Halt code H9 (planner-blocked)
  - Pass plan.md path to worker
  - Reviewer plan-vs-impl flow (via existing REQUEST_CHANGES, not new H10)

### Phase F — Escape hatches

- [x] 20. `pi-epic-init --no-planner` flag → writes `disable_planner: true` to epic meta.yaml
- [x] 21. Helper resolves effective `needs_planner` in orchestrator step 3.5 (env-var → epic flag → feature flag → kind-spike)

### Phase G — Decomp prompt updates

- [x] 22. `prompts/epic-decompose.md`:
  - New fields documented (kind, needs_planner, planner_triggers, reference_paths)
  - Trigger checklist (any 2 of 7) with codes
  - Manifest fan-out table
  - L-018-stronger literal-sample rule
  - L-020 quote-unsafe-AC rule
  - Spike conventions + worked example

### Phase H — Docs

- [x] 23. `CHANGELOG.md` — v0.5.0 entry (~100 lines)
- [x] 24. `README.md` — architecture diagram, --no-planner row, postinstall copy list
- [x] 25. `lessons.md` — L-019/L-020/L-021/L-022 (L-022 deferred to 0.5.1)
- [x] 26. `package.json` bumped to 0.5.0
- [x] 27. Committed as `d9cb57c release: 0.5.0-rc1`

### Phase I — Smoke test

- [x] 28. Toy 4-feature epic at `/tmp/v05-smoke/` (F01 plain, F02 tagged, S03 spike, F04 plain)
- [x] 29. `pi-epic-init --no-planner` writes `disable_planner: true` (verified)
- [x] 30. `pi-epic-validate-decomposition` reports `4 entries (3 features, 1 spikes, 1 need planner)` (verified)
- [x] 31. `pi-feature-start F01` auto-commits scaffold to epic branch as `chore(epic): scaffold F01 feature folder` (verified — L-019)
- [x] 32. `pi-feature-start S03` uses spike template (verified — first line of feature.md says "This is a SPIKE")
- [x] 33. `pi-feature-complete S03` skips tests (verified — logs `spike feature: skipping tests (deliverable is decision artifact)`) and archives correctly
- [ ] 34. **Pending user pi session:** full agent-flow smoke (planner subagent invocation, plan.md round-trip, plan-vs-impl review, H9 halt) requires running `/epic-run-auto` in a real pi session
- [ ] 35. After agent-flow smoke clean → tag `v0.5.0` final

## Verification commands the user runs in pi

```bash
# 1. Install rc1 into pi (or auto-pickup if pointing at the git repo)
pi update git:github.com/shankar029/pi-epicflow
# (or restart pi session if it's a local extension)

# 2. Smoke epic
mkdir -p ~/code/scratch/epicflow-v05-smoke && cd ~/code/scratch/epicflow-v05-smoke
git init -b main && touch README.md && git add -A && git commit -m init
pi-epic-init smoke --title "v0.5 smoke"
# fill design.md with a stub
# /epic-decompose --features=4 → should propose F01-F04 with at least one needs_planner=true
# manually add a spike S03 to decomposition.yaml
# /epic-run-auto
# Verify: planning phase fires for F02; worker reads plan.md; reviewer
#   reports Plan-vs-impl section; spike completes without tests; F03
#   ambiguity -> H9 halt if you author one
```

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
