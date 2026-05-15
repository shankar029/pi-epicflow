# Recovery playbook

> **What this is.** A reference for the orchestrator (and for humans
> hand-running `/epic-run-auto`) when something stuck-states the
> workflow mid-feature or mid-epic. Most of these are rare under
> v0.5.1+ — the structural bugs that caused the common ones (L-019,
> L-023, L-025) are fixed. But you'll still occasionally hit one of
> these, especially on epics started under earlier versions, and the
> right recipe saves 30 min of confused archaeology.
>
> **When to use this:** the orchestrator's `/epic-run-auto` prompt
> cross-links here from §STALL HANDLING. If you hit a stuck state and
> none of the recipes below match, write `halt-<UTC>.md` in the active
> epic dir with what you saw and stop — adding a 7th recipe is better
> than improvising.

Each recipe follows the same shape: **Symptom → Root cause → Recovery
commands → Verification → Prevention reference**.

---

## R1 — Lost journal contents after an L-004 `--ours` resolve

**Symptom.** Mid-feature you ran `pi-feature-complete <fid>` and after
its squash-merge step the on-disk `feature.md` (or `meta.yaml`,
`deviations.md`) under `.pi/epics/<id>/features/<fid>-*/` is suddenly
the empty/scaffold version. The populated content the worker wrote is
gone. The L-004 auto-resolver log line will be in the output
(`auto-resolving journal-only conflicts under ... (taking epic-branch
version)`).

**Root cause.** The L-004 resolver took the epic-branch (`--ours`)
version of the journal, but the FEAT branch held the populated copy.
This is the pre-v0.5.1 spike-path failure mode (L-023). It can still
happen on epics started under v0.5.0 or earlier, and theoretically on
any non-spike feature where someone manually pushed populated journal
content onto the feat branch.

**Recovery.**

```bash
# 1. Find the squash-merge commit (the one whose parent had the populated journal).
git log --oneline -5 epic/<slug>
# Pick the most recent feat(<fid>): ... commit. Its parent^ is epic before merge.

# 2. Find the journal blob from the feat branch (now deleted, but in reflog).
git reflog --all | grep -i "<fid>" | head -10
# Find a sha that points at the populated state — usually a "wip: <fid> pre-complete"
# commit or the worker's last commit on feat/<epic>/<fid>-...

# 3. Restore the populated paths.
PRE=<that-sha>
git checkout $PRE -- ".pi/epics/<id>/features/<fid>-*/feature.md"
git checkout $PRE -- ".pi/epics/<id>/features/<fid>-*/meta.yaml"
# Same for deviations.md if it was affected.

# 4. Verify the content is back.
cat .pi/epics/<id>/features/<fid>-*/feature.md | head -40

# 5. Commit as a fix-up.
git add .pi/epics/<id>/features/<fid>-*/
git commit -m "fix(<fid>): restore populated journal lost during squash"
```

**Verification.** `pi-feature-next-feature` returns the next feature
ID; the restored journal contains the worker's actual notes; the
epic-branch tip log shows the fixup commit on top of the squash.

**Prevention.** Update to v0.5.1+ — L-023 fix makes this unreachable
for new spikes, and the underlying conflict for non-spike features is
extremely rare (requires manual push to feat branch mid-feature).

---

## R2 — Empty squash on a non-spike feature

**Symptom.** `pi-feature-complete <fid>` errors with
`ERROR: squash produced empty diff for non-spike feature <fid>` (v0.5.1+)
or silently exits zero with no commit on epic (pre-v0.5.1).

**Root cause.** The feat branch has no commits beyond what's already on
epic. Two possibilities:
1. The scaffold commit (L-019) didn't land on the feat branch — feat
   was branched off epic BEFORE the scaffold commit. Pre-v0.5.1 bug,
   fixed by L-023's reorder.
2. The worker did all its work directly in MAIN_REPO instead of the
   worktree. Worker contract violation — but a recoverable one.

**Recovery for case 1 (no scaffold on feat).**

```bash
# Find the scaffold commit on epic.
git log --oneline epic/<slug> --grep="scaffold $fid"
# Cherry-pick it onto feat.
git checkout feat/<slug>/<fid>-<feature-slug>
git cherry-pick <scaffold-sha>
# Re-run.
git checkout epic/<slug>
pi-feature-complete <fid> --skip-tests
```

**Recovery for case 2 (worker wrote in MAIN_REPO).** Same recipe as the
spike path: commit those edits on epic first, then let
`pi-feature-complete` no-op the squash via `--allow-empty`. Easiest
path is to override `kind: spike` in the feature's `meta.yaml`
temporarily, run `pi-feature-complete`, then flip back. Or commit by
hand:

```bash
git add .pi/epics/<id>/features/<fid>-*/ src/<any-code-worker-wrote>
git commit -m "feat($fid): <title> (recovered from misplaced worker output)"
# Manually finish the feature-complete steps that didn't run.
git worktree remove <worktree>
git branch -D feat/<slug>/<fid>-<feature-slug>
mkdir -p .pi/epics/<id>/features/done
git mv .pi/epics/<id>/features/<fid>-* .pi/epics/<id>/features/done/
git commit -m "chore(epic): archive <fid> to features/done/"
```

**Verification.** `pi-epic-next-feature` returns the next ID; feat
branch is gone (`git branch -a | grep <fid>` is empty); the feature
dir is under `.pi/epics/<id>/features/done/`.

**Prevention.** v0.5.1's `pi-feature-start` reorder makes case 1
impossible. Case 2 is a worker-contract violation surfaced by
worker-report review — the reviewer should catch it before
`pi-feature-complete` runs.

---

## R3 — Dirty working tree after `pi-feature-complete` (pre-v0.5.1)

**Symptom.** `git status` reports `D .pi/epics/<id>/features/<fid>-*/...`
+ `?? .pi/epics/<id>/features/done/<fid>-*/...` immediately after a
successful `pi-feature-complete <fid>`.

**Root cause.** Pre-v0.5.1 `pi-feature-complete` did a plain `mv` of
the feature dir to `done/` without committing the rename. The dirty
state would be swept up by the next `pi-feature-start`'s pending-edits
auto-commit, which worked for sequential features but left the last
feature in dirty state.

**Recovery.**

```bash
git add -A .pi/epics/<id>/
git commit -m "chore(epic): archive <fid> to features/done/"
```

**Verification.** `git status --short` is empty.

**Prevention.** v0.5.1's `pi-feature-complete` commits the rename
directly. Upgrade.

---

## R4 — Feat branch points at the wrong base

**Symptom.** `pi-feature-complete <fid>` reports many unmerged paths in
files OUTSIDE the journal directory — the L-004 auto-resolver bails
out with `squash-merge failed with conflicts outside the journal
directory`. Halt code H6 was raised.

**Root cause.** A dep feature (`F<N-1>`) merged into epic after this
feature's branch was created, AND the dep touched files this feature
also touches. The feat branch is rebase-stale.

**Recovery.**

```bash
# 1. Find where feat originally branched off.
OLD_BASE=$(git merge-base feat/<slug>/<fid>-<slug> epic/<slug>)

# 2. Rebase feat onto current epic tip.
git checkout feat/<slug>/<fid>-<slug>
git rebase --onto epic/<slug> $OLD_BASE
# Resolve conflicts as you would in any rebase. The worker may need a
# second pass if the rebase substantively changes the implementation
# surface — at that point, prefer aborting the rebase and respawning
# the worker on a fresh feat branch (see R5).

# 3. After successful rebase, re-run complete.
git checkout epic/<slug>
pi-feature-complete <fid>
```

**Verification.** Squash succeeds without conflicts; epic builds.

**Prevention.** Don't merge an unrelated feature while another is
in-progress. The orchestrator's sequential dispatcher (current
`pi-epic-next-feature` behavior) avoids this by design — it only
unblocks the next feature when all deps are merged. A parallel-mode
dispatcher will need to rebase-on-merge as part of its contract.

---

## R5 — `pi-feature-start` halted partway

**Symptom.** `pi-feature-start <fid>` errored mid-way; the feature
directory exists under `.pi/epics/<id>/features/<fid>-*/` but the feat
branch + worktree don't (or vice versa).

**Root cause.** Network blip / disk issue / interrupt during the
scaffold+branch+worktree dance.

**Recovery.** Clean up the partial state and re-run.

```bash
# Check what exists.
git worktree list | grep <fid> || echo "no worktree"
git branch -a | grep <fid> || echo "no branch"
ls -d .pi/epics/<id>/features/<fid>-* 2>/dev/null || echo "no feature dir"

# Remove whatever DID get created, then re-run.
git worktree remove <worktree-path> 2>/dev/null || true
git branch -D feat/<slug>/<fid>-<feature-slug> 2>/dev/null || true
rm -rf .pi/epics/<id>/features/<fid>-*

# Drop any half-committed scaffold from epic.
git log --oneline -5 epic/<slug> | head
# If the most recent commit is "chore(epic): scaffold <fid> ..." and
# the feature dir is gone, reset:
git reset --hard HEAD~1   # ONLY if it was the most recent commit AND nothing else depends on it

# Re-run.
pi-feature-start <fid>
```

**Verification.** Worktree + branch + feature dir all exist; `git status`
clean; can navigate to worktree and find the scaffolded `feature.md`.

**Prevention.** None practical — these are environment issues. Recovery
is the right tool.

---

## R6 — When `pi-feature-complete --skip-tests` is the right hammer (and when it isn't)

**`--skip-tests` is right when:**
- Tests pass in the worktree but fail in the post-merge epic tree because
  of an environment / path issue you've manually verified (e.g. a missing
  `__init__.py` you've added by hand).
- You're recovering from R1/R2 above and the work has already been
  reviewed — re-running the test gate adds nothing.
- The feature is a `kind: spike` and tests are not the deliverable.
  (v0.5.1+ does this automatically — `--skip-tests` should be
  unnecessary for spikes.)

**`--skip-tests` is wrong when:**
- The worker reported `feature complete` but you haven't seen reviewer
  output. The test gate is your only automated check; bypassing it on
  unreviewed code defeats the workflow.
- Tests fail in the worktree. Fix the tests first; if they're
  genuinely wrong, surface that as a deviation and update the AC.
- You're trying to make a stuck halt go away by force.
  `--skip-tests` doesn't address H1/H4/H5/H6 root causes — it just
  postpones them to the next feature.

In doubt: post `halt-<UTC>.md` instead. The skip flag is the escape
hatch, not the default.

---

## R7 — `pi-epic-complete` halted partway (pre-v0.5.1)

**Symptom.** Epic-complete ran but the working tree is dirty with
`D .pi/epics/<id>/...` + `?? .pi/epics/done/<id>/...`. Same as R3
but at the epic level.

**Root cause.** Pre-v0.5.1 `pi-epic-complete` did a plain `mv` of the
epic dir to `done/` without committing. There was no follow-up
auto-commit step.

**Recovery.**

```bash
git add -A .pi/epics/
git commit -m "chore(epic): archive <epic-id> to .pi/epics/done/"
```

**Verification.** `git status --short` empty; `.pi/epics/done/<id>/`
contents tracked.

**Prevention.** v0.5.1's `pi-epic-complete` uses `git mv` + sweeps the
destination + commits. Upgrade.

---

## When to stop and ask for help

If you've spent more than **15 minutes** on recovery and none of the
above recipes match, OR you'd need to do destructive history rewrites
(`git filter-branch`, force-push to a shared branch, drop commits with
real downstream consumers), **stop and write a halt file** instead:

```bash
cat > .pi/epics/<id>/halt-$(date -u +%Y%m%dT%H%M%SZ).md <<EOF
# Recovery halt

## What I saw
<git status, last 10 commits on epic, last failing command + output>

## What I tried
<recipes attempted from docs/recovery.md, why each one didn't apply>

## What I think is wrong
<best hypothesis>

## What I'd like the human to do
<concrete ask>
EOF
```

Halt files are gitignored by default — they're signals to the human,
not branch history. The orchestrator's §STALL HANDLING budget is also
15 minutes; same number, intentionally.

---

## Cross-links

- Halt codes reference: `docs/design.md` §"Halt codes"
- Lessons that drove these recipes: `skills/epic-feature-workflow/lessons.md`
  L-004 (resolver), L-012 (halt files), L-019 (scaffold commit), L-023
  (spike path), L-025 (clean tree).
- Orchestrator stall handling that links here: `prompts/epic-run-auto.md`
  §STALL HANDLING.
