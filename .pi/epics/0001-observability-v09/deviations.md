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

## Orchestrator finding — L-049 pre-check serialized the intended parallel batch

### 2026-05-17 — observed serial dispatch of {F02, F03, F04}
- What: After F01 merged, `pi-epic-next-feature --batch 3` returned only F02, not F02+F03+F04.
- Why: All three features declare `pi-epic-status-json.sh` in scope_files (each fills in its own `emit_X_json()` stub function inside that file). L-049's pre-check works at FILE granularity, not function/line granularity, so it correctly refuses to dispatch them together.
- Impact: The dogfood epic ran serially even though the DAG and decomposition were designed for parallel. This is the L-049 pre-check working AS DESIGNED — the safety property is more conservative than the actual conflict surface.
- Decomposition lesson (L-053 candidate): when one bash file aggregates emit logic for multiple parallel-eligible features, the pre-check serializes them even if their textual edits don't overlap. Mitigation options: (a) split the contract file into per-concern files at decomposition time, (b) extend the pre-check to function-level granularity (much more complex, AST-aware), (c) accept serialization as the safety tradeoff (current behavior). Option (a) is the operator's responsibility at decomposition; option (c) is the framework's default. The dogfood demonstrates that operators authoring decompositions for real codebases (vs greenfield) will hit this pattern frequently — the v0.8 verification toy app avoided it by accident because each feature's helper had its own file.
- v0.9.1 backlog: consider whether pi-epic-validate-decomposition should warn (not error) when N features depend on the same root and all share a scope_files entry, since this pattern is highly likely to defeat parallel dispatch.
