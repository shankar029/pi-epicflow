# v0.5.2 Plan

**Goal:** UX polish + validation tightening from the first real outside-user epic (gen-ui), plus the L-028 recovery playbook deferred from v0.5.1.

**Status:** **done** — v0.5.2 tagged + pushed 2026-05-14.
**Started:** 2026-05-14
**Completed:** 2026-05-14 (same day)

## Items shipped

| Item | What | Where |
|------|------|-------|
| L-028 | Recovery playbook with 7 named recipes (R1–R7) | `docs/recovery.md` + cross-link from `prompts/epic-run-auto.md` §STALL HANDLING |
| L-029 | Range-syntax `depends_on: [F06-F09]` rejected with specific error hinting at the explicit-list fix | `pi-epic-validate-decomposition` + `prompts/epic-decompose.md` Step 1 |
| L-030 | Parent-dir-missing warning suppressed when 2+ scope_files share the parent (greenfield package signal) | `pi-epic-validate-decomposition` |
| L-031 | Spike-id position reflects DAG position (gen-ui `S04` vs smoke `S01`) | `prompts/epic-decompose.md` Step 1 |
| UX | `/epic-decompose` writes draft to disk + compact summary, stops & waits | `prompts/epic-decompose.md` (already on main as a9efc17) |

## Verification

- 10/10 smoke test phases pass (was 8/8 in v0.5.1).
- New phases [9/10] L-029, [10/10] L-030.
- lessons.md grew L-027 → L-031.
- `package.json`: 0.5.1 → 0.5.2.

## Out of scope (deferred)

- Decomposer-applied triggers as judgment, not gate. Gen-ui tagged 15/36 — feels right. Defer until a real cost shows up.
- Validator's L-024 symbol-path heuristic false positives on new packages with non-`src/` prefixes. Same story as L-030 — wait for repeated signal before tightening.
- Parallel-mode dispatcher. Out of scope, separate epic when ready.

## Lessons added in this release

- L-028 (recovery playbook)
- L-029 (range-syntax error)
- L-030 (parent-dir suppression)
- L-031 (spike numbering)
