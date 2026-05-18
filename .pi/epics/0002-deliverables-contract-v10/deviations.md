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

## F02 — validator-trigger-engine

### 2026-05-18 13:45 — scope_files advisory: _common.sh untouched
- What: `skills/epic-feature-workflow/scripts/_common.sh` is listed in F02's `scope_files` but was not edited.
- Why: The deliverables engine lives entirely inside the Python heredoc in `pi-epic-validate-decomposition`. No bash-level helper was needed (plan.md §6 anticipated this).
- Decomposition lesson: When scope_files includes a file "just in case," mark it as advisory in the decomposition notes to avoid false deviation signals.
