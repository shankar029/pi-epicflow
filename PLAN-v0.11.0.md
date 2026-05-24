# v0.11.0 — `/epic-design` (lean v1)

**Goal:** Close the gap between `pi-epic-init` and `/epic-decompose` by giving
pi a structured way to co-author `.pi/epics/<id>/design.md` in-place,
without relying on the user to know the path or remember the workflow.

**Status:** done

## Scope (lean v1)

- New slash prompt `/epic-design` that ingests existing artifacts first, asks
  gap questions with recommendations, shows a gist for approval, then writes
  `design.md` and commits on the epic branch.
- Optional second prompt `/epic-review-design` that runs a single unbiased
  critic sub-agent over the committed design and walks comments with the
  user.
- One custom critic agent (`epic-design-critic`) bundled under `agents/`,
  combining an "assume the author is wrong" oracle stance with an explicit
  quality-attribute checklist. We do NOT depend on pi-subagents' built-in
  agents.
- Footer / docs updates so the new step is discoverable.

## Non-goals (deferred to v0.12+ if usage demands)

- Hard Phase-1 checklist exit gate.
- Parallel oracle + reviewer in the review pass.
- `PI_EPICFLOW_REVIEW_MODEL` env for different-model review.
- Loop-until-clean review iteration.
- Dedicated `epic-design-scout` agent for big-repo recon (pi can scout
  itself; promote later if needed).

## Files

- [x] 1. `prompts/epic-design.md` — new ✅ 2026-05-20
- [x] 2. `prompts/epic-review-design.md` — new ✅ 2026-05-20
- [x] 3. `agents/epic-design-critic.md` — new ✅ 2026-05-20
- [x] 4. `skills/epic-feature-workflow/scripts/pi-epic-init` — footer updated ✅ 2026-05-20
- [x] 5. `README.md` — quickstart + workflow diagram updates ✅ 2026-05-20
- [x] 6. `skills/epic-feature-workflow/SKILL.md` — lifecycle diagram updated ✅ 2026-05-20
- [x] 7. `CHANGELOG.md` — entry ✅ 2026-05-20
- [x] 8. `package.json` — bumped to `0.11.0` ✅ 2026-05-20
- [x] 9. Smoke test passes (29/29, incl. L-050 5-agent count) ✅ 2026-05-20

## Risks & rollback

- New prompt may overlap with users' own design habits → mitigated by
  prompt explicitly honoring `--from`-seeded content and accepting arbitrary
  artifact paths.
- Critic agent quality is on us → persona prompt is explicit about
  "assume author is wrong"; output schema is structured so users can audit.
- Rollback: revert the commit; pi-epic-init footer + README still work
  with the old "edit design.md by hand" flow.

## Decisions log

- 2026-05-20 — chose lean v1 over heavy v1 to avoid bloat; quality bar is
  enforced by AGENTS.md + opt-in review pass rather than ceremony.
- 2026-05-20 — single combined critic agent instead of parallel oracle +
  reviewer; can split later if real use shows distinct value.
- 2026-05-20 — review is a separate slash command (`/epic-review-design`),
  not bundled into `/epic-design`, so fast-design users aren't penalized.
