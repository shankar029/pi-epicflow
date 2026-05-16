# v0.6.0 Plan

**Goal:** Close the "worker hallucinates done" gap and the "ambiguous AC silently
guessed" gap, by adding **mechanically-enforced** evidence and a soft halt code.
Borrows the *ideas* from `obra/superpowers` (verification-before-completion,
systematic-debugging, hooks-as-enforcement) but encodes them as shell-script
gates + reviewer must-cite clauses, not prompt suggestions.

**Status:** **done** — v0.6.0 ready to tag 2026-05-14.
**Started:** 2026-05-14
**Completed:** 2026-05-14 (same day)

## Scope

| # | Item | Effort | Files touched |
|---|------|--------|---------------|
| P1 | Evidence-required completion gate | S | `agents/feature-worker.md`, `agents/feature-reviewer.md`, `pi-feature-complete`, `lessons.md` L-032 |
| P2 | Spike-investigation template tightening (≥2 options enforced by reviewer) | S | `templates/feature-spike.md`, `agents/feature-reviewer.md`, `lessons.md` L-032 rider |
| P3 | H10 soft halt ("ambiguous AC, paused for human") | XS | `agents/feature-worker.md`, `agents/feature-planner.md`, `prompts/epic-run-auto.md`, `docs/design.md`, `docs/recovery.md`, `lessons.md` L-033 |
| Policy | Mechanical-enforcement principle | XS | `docs/design.md`, `lessons.md` L-034 |

**Net new files:** 0 (all changes go into existing files; the spike template
already exists from v0.5).

**Net new halt code:** 1 (H10).

## Assumptions

- The evidence gate is encoded in `pi-feature-complete` (not a hook) because
  pi-epicflow already standardizes on shell scripts as the mechanical-
  enforcement layer.
- H10 does NOT halt the whole DAG — `pi-epic-next-feature` skips to the
  next dependency-independent feature, mirroring H9 (planner-blocked).
- Spike features are exempt from the evidence-gate check (their deliverable
  is a decision artifact, not code; the spike template's filled-in §3/§5
  IS the evidence).

## Steps

- [x] 1. PLAN.md written (this file).
- [x] 2. P1 worker prompt: evidence section in report shape.
- [x] 3. P1 reviewer prompt: per-AC evidence audit + spot-check + must-name-weakness clause.
- [x] 4. P1 `pi-feature-complete`: hard-gate on `## Completion evidence` header (with `--skip-evidence` override).
- [x] 5. P2 spike template: ≥2 options + falsification-test column.
- [x] 6. P2 reviewer spike-mode: ≥2 non-placeholder options + §5 Decision filled.
- [x] 7. P3 worker prompt: H10 trigger list + escalation path.
- [x] 8. P3 planner prompt: H9 vs H10 distinction with examples for each.
- [x] 9. P3 `prompts/epic-run-auto.md`: H10 in halt-codes table + soft-halt handling in steps 3.e and 6.
- [x] 10. P3 `docs/design.md`: H10 in halt family + two-tier (hard/soft) framing.
- [x] 11. P3 `docs/recovery.md`: R8 recipe.
- [x] 12. Policy: `docs/design.md` "Every rule has a mechanical enforcement point" key design choice.
- [x] 13. `lessons.md`: L-032, L-033, L-034 appended.
- [x] 14. `install/smoke-test.sh`: phases 11 + 12 added; 12/12 pass.
- [x] 15. `CHANGELOG.md` [0.6.0] section written.
- [x] 16. `package.json`: 0.5.2 → 0.6.0.
- [x] 17. Smoke test verified: 12/12.
- [x] 18. Commit + tag v0.6.0 + push.

## Risks & rollback

- **Evidence-gate false positives:** Worker forgets the "## Completion
  evidence" section on a perfectly-fine feature, gets rejected by
  `pi-feature-complete`. **Mitigation:** The error message tells the
  user exactly which header is missing and where to add it; one
  re-spawn or one hand-edit resolves. Rollback path: `--skip-evidence`
  flag on `pi-feature-complete` if false positives are frequent.
- **H10 too easily triggered:** Worker abuses H10 to avoid hard work.
  **Mitigation:** H10 has a specific trigger list (TODO/TBD literals,
  missing files); ambiguity-but-can-be-resolved-by-reading-docs is
  explicitly NOT H10. Reviewer can mark a feature as "H10 abused;
  proceed" in a follow-up resume.
- **Spike template too rigid:** Some spikes genuinely have only one
  reasonable option (e.g. "use the library the design.md specifies").
  **Mitigation:** Floor is ≥2 options, ≥3 recommended. Reviewer can
  accept "Option B = do not adopt; status quo" as a second option.

## Decisions log

- 2026-05-14 — Halt code is **H10**, not **H0**. Avoids the "lowest
  severity" ambiguity of H0; sits naturally adjacent to H9
  (planner-blocked). The halt family becomes H1–H7, H9, H10 (H8 still
  reserved).
- 2026-05-14 — Evidence is in `worker-report.md` under a fixed
  `## Completion evidence` header. No structured YAML schema; free-form
  per-AC blocks. Resist the urge to build an evidence parser.
- 2026-05-14 — Reviewer "must name a weakness OR three checks done"
  clause folded into P1's reviewer change instead of shipped separately.
  Net effect identical, one fewer file touched.
- 2026-05-14 — `pi-skill-lint` (researcher's P4) DEFERRED. Reconsider
  when first outside-contributor PR opens.

## Out of scope (deferred to v0.7+)

- Parallel-mode dispatcher (researcher's P6). Its own multi-feature epic.
- `pi-skill-lint` for user-authored content. Needs ≥1 outside contribution
  first.
- Multi-harness adapters (Claude Code, Codex, …). Stays pi-only by design.
