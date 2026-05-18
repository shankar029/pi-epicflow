# Deviations — F01 modularize-and-json-skeleton

## D-001: Edited `_common.sh` (outside declared scope_files)

- **Date:** 2026-05-17
- **File:** `skills/epic-feature-workflow/scripts/_common.sh`
- **Change:** `-d "$clone/.git"` → `-e "$clone/.git"` (1-char fix in `pi_epicflow_age_days()`)
- **Rationale:** Pre-existing bug — git worktrees have `.git` as a *file* (not directory), causing `pi_epicflow_age_days` to return `"?"` instead of the actual age. This broke the byte-for-byte baseline comparison (AC 3) when running from a worktree.
- **Impact:** 1-character fix, no behavior change for non-worktree repos. Required for AC 3 (byte-for-byte match).
- **Lesson:** `scope_files` should include `_common.sh` when features depend on its correct behavior from worktrees.
