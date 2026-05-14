# Cross-epic decomposition lessons

> Read by `pi-epic-decompose` BEFORE proposing a new decomposition.
> Updated by `pi-epic-complete` distilling generalizable patterns from each
> epic's `deviations.md`. Append-only; supersede entries by adding a new one
> with `Supersedes: <id>`.

## Format

Each lesson:

```
### L-NNN: <one-line title>
- **Added:** YYYY-MM-DD (epic <epic-id>)
- **Pattern:** <when this applies>
- **Lesson:** <what to do / not do at decomposition time>
```

## Lessons

### L-016: `python` vs `python3` — propose the interpreter that exists
- **Added:** 2026-05-14 (epic 0001-taskq, sample run)
- **Pattern:** Modern Debian / Fedora / Arch / many container images ship `python3` only — there's no `python` symlink. `/epic-decompose` Step 3 was hardcoded to propose `python -m pytest -q` whenever a `pyproject.toml` was found. `pi-feature-complete` runs `bash -c "$test_cmd"` literally, so the missing shim makes every feature halt at H1 even when the worker's tests pass cleanly under `python3`. The F01 worker on epic `0001-taskq` had to patch `epic-config.yaml` itself, log a deviation, and continue.
- **Lesson:** `/epic-decompose` Step 3 must check `command -v python3 || command -v python` (in that order) and propose the interpreter that actually exists. The same logic belongs in any future `pi-epic-init`-side autodetect. (Prompt updated in `prompts/epic-decompose.md` 2026-05-14.)

### L-017: `.gitignore` must exclude `halt-*.md` (belt for L-012's suspenders)
- **Added:** 2026-05-14 (epic 0001-taskq, sample run)
- **Pattern:** L-012 fixed the most common halt-file leak path (`pi-feature-start`'s auto-commit train) with a targeted `git reset HEAD halt-*.md`. But the orchestrator's BLOCK-recovery step in FINALIZE re-stages `.pi/epics/<id>/` after the epic-reviewer flags issues, and the prompt was ambiguous enough that the orchestrator interpreted "stale halt report" as "file to archive into the commit" rather than "file to delete." Result on the taskq run: `halt-2026-05-14T0400Z.md` rode the `chore(epic): epic review + archived halt report` commit straight onto `epic/taskq` and would have been in the PR diff.
- **Lesson:** Defense in depth. (a) `pi-epic-init` adds `.pi/epics/*/halt-*.md` and `.pi/epics/done/*/halt-*.md` to `.gitignore` so even a stray `git add` typo can't stage one. (b) The orchestrator's FINALIZE step explicitly says "stale halt = `git rm` + `rm`, never `git add`" with a worked example. (c) The closeout-retry block carries the same `git reset HEAD halt-*.md` belt as the main closeout. (Implemented in `pi-epic-init` + `prompts/epic-run-auto.md` 2026-05-14.)

### L-001: pre-populate `.gitignore` with pi runtime artifacts at epic-init
- **Added:** 2026-05-12 (epic 0001-task-cli)
- **Pattern:** Repos using `pi install -l` for `pi-subagents` / `pi-intercom` create `.pi/npm/` and `.pi/settings.json`. The orchestrator's per-feature `worker-report.md`, `review-report.md`, `progress.md` are also runtime state, not source.
- **Lesson:** `pi-epic-init` must add `.pi/npm/`, `.pi/settings.json`, and the per-feature ephemeral report patterns to `.gitignore` as part of its scaffolding commit. Otherwise these untracked files dirty the tree and either block `pi-feature-start`'s clean-tree check or get accidentally committed. (Implemented in `pi-epic-init` 2026-05-12.)

### L-002: never use `|` as a sed delimiter on YAML scalar values
- **Added:** 2026-05-12 (epic 0001-task-cli)
- **Pattern:** Feature titles, summaries, and design text legitimately contain shell metacharacters (`|`, `/`, `&`, `\`). Any script that splices them into a `sed s|...|...|` command will crash on a perfectly valid title.
- **Lesson:** For in-place edits on `meta.yaml` / `feature.md` from values that originate in user-authored YAML, prefer a tiny embedded `python3 -` block over `sed -i`. Sed delimiters are landmines for content the user authored.

### L-003: skill scripts must fail loudly when run from the wrong cwd
- **Added:** 2026-05-12 (epic 0001-task-cli)
- **Pattern:** `pi-feature-complete` and similar scripts assume the main repo cwd (where `.pi/STATE.md` lives). Run from a feature worktree, they would silently no-op (exit non-zero with no stderr) because `active_epic_id` returned 1 with no message.
- **Lesson:** Helpers in `_common.sh` that resolve epic state must print a *specific* error to stderr explaining the likely cause ("are you in a worktree? cd to main repo") rather than `return 1` silently. Also: orchestrator templates must explicitly `cd` to the main repo before invoking these scripts — don't assume cwd. (Implemented in `_common.sh::active_epic_id` 2026-05-12.)

### L-004: `pi-feature-complete` must be defensive about post-merge journal state
- **Added:** 2026-05-12 (epic 0001-task-cli)
- **Pattern:** Squash-merging from a feature branch can interact badly with journal files (`feature.md`, `meta.yaml`) edited only on the epic branch by the orchestrator. After `mv $feat_dir done/`, the script's `sed -i` on `$moved_dir/meta.yaml` can fail if the file is missing for any reason — and `set -euo pipefail` propagates the failure up, leaving the merge committed but the archive incomplete.
- **Lesson:** Any post-merge file munging in `pi-feature-complete` should be wrapped in existence checks with a fallback that *reconstructs* a minimal `meta.yaml` (id, state=merged, branch, merge_sha, dates) rather than aborting. The merge has already happened; failing to update meta.yaml is a recoverable cosmetic issue, not a reason to leave the epic in an inconsistent state. (Implemented in `pi-feature-complete` 2026-05-12.)

### L-005: orchestrator must do its budget check at the TOP of the loop
- **Added:** 2026-05-12 (epic 0001-task-cli)
- **Pattern:** With a `--max-features=N` cap, naive orchestrators check the budget AFTER `pi-feature-complete` of the in-flight feature, but BEFORE that they've already called `pi-feature-start` for the NEXT feature — leaving an orphan worktree, branch, and `meta.yaml: state: in-progress` when the cap fires.
- **Lesson:** The budget check is step 0 of the loop, before `pi-epic-next-feature`. Same applies to wall-clock and token budgets. Never call `pi-feature-start` if the next iteration won't be allowed to complete.

### L-006: orchestrator must NOT make cleanup commits on the user's behalf
- **Added:** 2026-05-12 (epic 0001-task-cli)
- **Pattern:** When the working tree is dirty (real source/test changes, not orchestrator artifacts), it's tempting for the orchestrator to `git add -A && git commit -m "chore(epic): pending edits"` to unblock `pi-feature-start`. This silently absorbs user work into a chore commit on the epic branch, polluting the eventual PR.
- **Lesson:** `pi-feature-start` already auto-commits anything under `.pi/epics/<id>/` and `.pi/STATE.md` to the epic branch (intentional, scoped). For dirty paths OUTSIDE that scope, the orchestrator must HALT (H2) and let the human commit / stash / revert. Never `git add .` or `git commit -a` on the epic branch from the orchestrator.

### L-007: per-feature artifact paths are ephemeral after `pi-feature-complete`
- **Added:** 2026-05-12 (epic 0001-task-cli)
- **Pattern:** Orchestrators that spawn a follow-up subagent (e.g. "verify the merge") with `output: <FEATURE_DIR>/something.md` AFTER `pi-feature-complete` will write to the (now non-existent) original path — `subagent` recreates the parent directory, leaving stale artifacts in `features/<F>/` while the canonical archive is in `features/done/<F>/`.
- **Lesson:** Treat `FEATURE_DIR` as ephemeral after `pi-feature-complete`. If post-merge subagents are needed, point them at `EPIC_DIR/features/done/<F-slug>/` explicitly. The orchestrator template's step 12 makes this explicit.

### L-008: pass absolute paths to feature-worker / feature-reviewer subagents
- **Added:** 2026-05-12 (epic 0001-task-cli)
- **Pattern:** Workers/reviewers run with `cwd` = the feature worktree. The feature folder (`feature.md`, `meta.yaml`, `decomposition.yaml`) lives only in the *main repo's* `.pi/epics/<id>/`, not in the worktree (because `pi-feature-start` writes them after branching). A worker reading `".pi/epics/<id>/features/<F>/feature.md"` from cwd finds nothing.
- **Lesson:** When delegating to a per-feature subagent, the orchestrator must pass `MAIN_REPO=`, `EPIC_DIR=`, `FEATURE_DIR=`, `FEATURE_ID=` as absolute paths in the task message. The worker/reviewer reads from those absolute paths; only code/tests are written inside the worktree.

<!-- New lessons appended below. -->

### L-010: pi-epic-next-feature must prefer in-progress over ready
- **Added:** 2026-05-13 (epic 0001-minikv, halt-and-resume scenario)
- **Pattern:** When the orchestrator is interrupted mid-feature (halt, crash, user Ctrl+C, environment fix needed), the active feature's `meta.state` stays at `in-progress` and its worktree+branch persist. On resume, `pi-epic-next-feature` would scan for ready (pending + deps-met) features FIRST and only fall back to in-progress when none were ready. With multiple roots (e.g. F01 + F05 both depend_on=[]), this caused the script to silently skip the half-done F01 and start F05 instead, leaking F01's worktree and creating two parallel features for one orchestrator.
- **Lesson:** Resume-before-start is non-negotiable. `pi-epic-next-feature` checks `in_progress` FIRST and returns the lowest-numbered in-progress fid; only if none is in-progress does it look at the ready set. (Implemented 2026-05-13 in `pi-epic-next-feature`.)

### L-011: copy-paste local extension installs need the full deps tree, not just top-level packages
- **Added:** 2026-05-13 (epic 0001-minikv, setup hand-off)
- **Pattern:** When bootstrapping a new test repo, it's tempting to `cp -r .pi/npm/node_modules/pi-subagents /target/.pi/npm/node_modules/` plus a hand-written `.pi/settings.json`. This silently fails: pi-subagents has 100+ transitive deps that must also be present, AND the settings.json schema requires the key `"packages"` (not `"extensions"`). Symptom: `subagent` tool not found, `pi list` reports "No packages installed."
- **Lesson:** Either (a) `pi install -l npm:pi-subagents npm:pi-intercom` from inside the new repo (which writes the right settings.json AND installs deps), or (b) copy the WHOLE `.pi/npm/` tree (`node_modules/`, `package.json`, `package-lock.json`) plus the `.pi/settings.json` from a known-good repo. Both work; the half-measure does not.

### L-009: orchestrator must inspect, not blindly wait or kill
- **Added:** 2026-05-12 (epic 0001-task-cli, post-mortem)
- **Pattern:** Long-running subagents look the same to a naive parent whether they're (a) deep-thinking, (b) running a slow tool like `npm test`, (c) looping, or (d) hard-stalled. Blind timeouts kill (a)/(b); blind waits hang on (c)/(d).
- **Lesson:** The orchestrator template's `§STALL HANDLING` section requires three steps before kill: (1) call `subagent({action: "status", id})` to read current_tool, current_tool_duration, activity_freshness, recent_output, tokens_in_last_minute; (2) classify into Working / Looping / Stalled / Awaiting-decision / Crashing; (3) NUDGE first via `subagent({action: "resume", id, message})` and only then INTERRUPT. Forensics from `~/.pi/.../async-subagent-runs/<id>/` (events.jsonl + output-N.log) inform the post-interrupt decision: respawn-once vs HALT (H7). Caps: 1 nudge per episode, 1 interrupt-respawn per feature, 20 min total stall budget. Pi already raises automatic needs-attention notices for stalls — the orchestrator just has to react to them with this protocol instead of waiting blindly. (Implemented in `epic-run-auto.md` 2026-05-12.)

### L-012: halt reports must not ride the auto-commit train
- **Added:** 2026-05-13 (epic 0001-minikv, epic-review caught it)
- **Pattern:** When the orchestrator writes `.pi/epics/<id>/halt-<ts>.md` for a recoverable halt and the user resumes, the next `pi-feature-start` runs `git add ".pi/epics/<id>"` to commit straggling design/decomp edits. That glob silently scoops up the halt report, baking it into the epic branch history and eventually into the PR diff. The epic-reviewer caught this (correctly flagged as "Stale halt report committed"), but ideally it never happens.
- **Lesson:** `pi-feature-start` now `git reset HEAD -- ".pi/epics/<id>/halt-*.md"` after staging, so halt reports stay un-tracked operator artifacts. The orchestrator's closeout step does the same `git reset` belt-and-suspenders. (Implemented 2026-05-13 in `pi-feature-start` and `epic-run-auto.md`.)

### L-013: epic meta.yaml status must be advanced explicitly through its lifecycle
- **Added:** 2026-05-13 (epic 0001-minikv, cosmetic but visible in monitoring)
- **Pattern:** `pi-epic-init` sets `status: design`, `pi-epic-complete` sets `status: done`. Nothing in between advances it, so during the entire ~90-min run, monitoring tools and humans grepping `meta.yaml` saw `status: design` even though 11 features were already merged. Cosmetic but misleading; also breaks any downstream tooling that filters epics by lifecycle state.
- **Lesson:** `pi-feature-start` now advances `design \u2192 in-progress` on first invocation (idempotent: only writes if current value is `design` or empty). `pi-epic-complete` continues to set `done` at the end. (Implemented 2026-05-13 in `pi-feature-start`.)

### L-014: orchestrator needs an explicit closeout commit before epic-review
- **Added:** 2026-05-13 (epic 0001-minikv, epic-review forced the issue)
- **Pattern:** After the last `feature-merged`, integration features (especially the capstone like F12) often leave straggling writes under `.pi/epics/<id>/` \u2014 final deviation entries, lessons-candidate.md from `pi-epic-complete`'s upcoming distillation, ADR additions to design.md, the just-archived `done/<lastFid>-<slug>/` tree. None of these are "code"; they're epic record. The orchestrator was implicitly relying on the next `pi-feature-start` (which won't fire \u2014 we're done) to sweep them up, leaving them un-staged when the epic-reviewer ran. Reviewer correctly BLOCK'd with "uncommitted F12 closeout artifacts."
- **Lesson:** FINALIZE in the orchestrator template now has an explicit step 2: `cd MAIN_REPO && git add .pi/epics/<id>/ && git reset HEAD -- halt-*.md && git commit -m "chore(epic): closeout"` before spawning the epic-reviewer. Plus a one-shot retry rule: if the reviewer BLOCKs on a purely-`.pi/epics/<id>/` working-tree issue, one additional closeout commit + one re-review is allowed; anything beyond that or any code-side blocker is a HALT. (Implemented 2026-05-13 in `epic-run-auto.md`.)

### L-015: approval is "continue", not "stop"
- **Added:** 2026-05-13 (epic 0001-todoq dry-run, /epic-decompose prompt-template bug)
- **Pattern:** A prompt template designed as a multi-step pipeline (propose → present → approve → write → validate → commit) had a natural stopping point right after the user typed *"approved"*. Model interpreted approval as end-of-conversation rather than as the trigger to proceed through steps 3+; user thought the YAML was committed, exited pi, returned to find decomposition.yaml untouched.
- **Lesson:** When a prompt template has an approval gate followed by mandatory continuation steps, the template must say so loudly. Words to include: *"CRITICAL: approval is your trigger to continue to step N in the same turn. The deliverable is X, not Y. If you stop after the user approves, you have failed the contract."* Apply to every approval gate in every prompt. (Implemented 2026-05-13 in `prompts/epic-decompose.md` steps 2 and 6.)
