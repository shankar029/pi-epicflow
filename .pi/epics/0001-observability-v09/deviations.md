# Deviations log

> Append-only. Pi writes here whenever the implementation departs from
> `decomposition.yaml` (out-of-scope edits, AC adaptations, dependency
> surprises, dismissed reviewer findings, design ambiguity calls). On
> `pi-epic-complete`, generalizable lessons here are distilled into the
> global `~/.pi/agent/skills/epic-feature-workflow/lessons.md`.

<!-- Sections grow per feature as deviations occur. Format:

## F<NN> — <slug>

### YYYY-MM-DD HH:MM — <deviation type>
- What: <one sentence>
- Why: <one sentence>
- Decomposition lesson: <what should have been in the original plan>

-->

## F01 — modularize-and-json-skeleton

### 2026-05-17 17:06 — out-of-scope file edit
- What: Changed `-d "$clone/.git"` to `-e "$clone/.git"` in `_common.sh:pi_epicflow_age_days()`
- Why: Pre-existing bug — git worktrees have `.git` as a file (not directory), causing version-age to show "?" instead of the correct value. This broke byte-for-byte AC 3 output match when running from the F01 worktree.
- Decomposition lesson: `_common.sh` should be in scope_files when features depend on correct behavior from worktrees; alternatively, the bug should have been fixed in a prep commit before the epic.
