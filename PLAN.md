# pi-epicflow — post-v0.9 plan

**Status:** v0.9.0 shipped 2026-05-18. First epic shipped by pi-epicflow on its own codebase. See `PLAN-v0.9.0.md` for the historical v0.7/v0.8 arc plan.

## v0.9.0 shipped
- [x] `pi-epic-status --json` (schema v1, 7 keys)
- [x] per-feature `started` + `duration` columns
- [x] `── Recent batches ──` section with empirical speedup_ratio
- [x] `⚠ HALTS` section + recovery anchors
- [x] `pi-epicflow-doctor` `── Recent epic activity ──` section
- [x] Smoke 24/24 → 29/29
- [x] Modularize `pi-epic-status` (299-line monolith → 90-line dispatcher + 6 lib/*.sh)
- [x] L-053 / L-054 / L-055 lessons distilled into `skills/epic-feature-workflow/lessons.md`

## Forward backlog (v0.9.x / v0.10)

- [ ] **L-053 mitigation:** consider warning in `pi-epic-validate-decomposition` when N>=2 sibling features depend on the same root AND share a `scope_files` entry (likely-defeats-parallel-dispatch pattern).
- [ ] **L-054 mitigation:** in `agents/feature-worker.md`, require the worker to write `worker-report.md` with `state: IN_PROGRESS` as the first step, then update incrementally. Tighten `pi-feature-complete` 0-byte detection with a more specific error message.
- [ ] **L-055 audit:** sweep remaining `[ -d "$X/.git" ]` patterns across the script set; replace with `-e` or `git rev-parse --is-inside-work-tree`. Add a smoke phase that runs `pi-epic-*` scripts from a worktree.
- [ ] **UX bug noted earlier:** `pi-epic-init --help` creates an epic named "help" instead of showing usage. Easy fix.
- [ ] **Decomposition root-feature contract:** when a root feature creates stub files, its AC should explicitly include "dispatcher sources + calls each stub function in the correct order" — apply to the `feature-planner` agent prompt + the decomposition template comments.

## Stable surfaces
- 5 user scripts (`pi-epic-init/-status/-complete/-extend/-validate-decomposition`) + 2 helper scripts (`pi-feature-start/-complete`) + 1 doctor.
- 4 agents (worker, planner, reviewer, epic-reviewer).
- 5 prompts (epic-design, epic-decompose, epic-run-auto, epic-extend, feature-spike).
- Lessons L-001..L-055 in `skills/epic-feature-workflow/lessons.md`.
- 29 smoke phases.
