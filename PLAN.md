# pi-epicflow — post-v0.10 plan

**Status:** v0.10.0 shipped 2026-05-18. Second consecutive epic shipped by pi-epicflow on its own codebase (deliverables-contract-v10). 7 features, 0 hard findings, APPROVE_EPIC at L-043 gate. See `PLAN-v0.10.0.md` for the v0.9→v0.10 design arc.

## v0.10.0 shipped

- [x] `decomposition.yaml` deliverable fields (e2e_scenarios, mock_fixtures, docs_updates, changelog_entry, e2e_skip_reason)
- [x] `pi-epic-validate-decomposition` trigger→deliverable engine (path + content SDK detection)
- [x] `strict_deliverables: false/true` opt-in (v0.11 will flip default)
- [x] `pi-feature-complete` deliverables pre-merge check
- [x] `pi-epic-complete` opt-in E2E gate + H11 halt code + recovery anchor
- [x] `_common.sh feature_declared_deliverables` helper
- [x] Decomposer / worker / reviewer / epic-reviewer prompts updated
- [x] F07 real-app verification with planted bug; `docs/v0.10-real-app-verification.md`
- [x] L-056 + L-057 promoted to confirmed; L-058 (content-based SDK detection) new candidate

## v0.11 backlog (from epic-review soft findings)

- [ ] **Smoke phases 30-35** for the deliverables surface (deliverables trigger detection, strict mode enforcement, pre-merge check, E2E gate skip/pass/fail). Currently 29/29; should grow to 35/35.
- [ ] **Run F05 reviewer rubrics on a real epic.** Mock-honesty + selector-quality were never exercised by an actual per-feature reviewer during the v0.10 dogfood. Validate actionability before promoting to hard findings in v0.11.
- [ ] **Playwright-specific real-app verification.** F07 substituted vitest+jsdom for Playwright. Browser-binary download, port conflicts, `npx playwright install` races remain unverified.
- [ ] **Persist `review-report.md` for every feature.** 0/7 features in the v0.10 dogfood had review reports. Consider making `pi-feature-complete` warn (not block) when absent.
- [ ] **Flip `strict_deliverables: true` as template default** in v0.11 (currently `false` opt-in).
- [ ] **Configurable `deliverable_rules:`** in `epic-config.yaml` per-project (move SDK list out of hardcoded validator). Lets operators add their own SDK names (`anthropic`, `langchain`, `pinecone`, etc.).
- [ ] **L-058 promotion:** verify content-based SDK detection on a second epic; promote from candidate to confirmed.

## Earlier backlog (from v0.9.x; some closed by v0.10)

- [x] L-053 mitigation considered (validator warning when N≥2 siblings share scope file) — DEFERRED. The cleaner answer per L-056: shared aggregator files indicate decomposition needs splitting. v0.10's deliverable-shard model is the structural answer.
- [ ] L-054 mitigation: incremental worker-report writes (state: IN_PROGRESS first). Worker subagent died mid-stream during F03 of v0.10 — same shape as L-054. Hot.
- [ ] L-055 audit: sweep remaining `[ -d "$X/.git" ]` patterns; add a worktree-targeted smoke phase.
- [ ] UX: `pi-epic-init --help` creates an epic named "help" instead of showing usage.
- [ ] Decomposition root-feature contract: when root feature creates stub files, AC should include "dispatcher sources + calls each stub". Capture in `feature-planner` or decomposition template.

## Stable surfaces

- 5 user scripts + 2 helper scripts + 1 doctor.
- 4 agents (worker, planner, reviewer, epic-reviewer).
- 5 prompts.
- Lessons L-001..L-058 in `skills/epic-feature-workflow/lessons.md`.
- 29 smoke phases (35 planned for v0.11).
- 2 dogfood epics shipped: v0.9 (observability), v0.10 (deliverables contract).
