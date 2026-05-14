# Working with git worktrees

pi-epicflow uses `git worktree` heavily. If you've only ever used a single
checkout (one branch at a time per repo), this page is for you. If
worktrees are familiar, skim §3.

## 1. What a worktree is, in one minute

A **worktree** is a directory on disk where one branch of your repo is
checked out. By default, every git repo has exactly one worktree — the
directory you cloned into. `git worktree add` lets you have **multiple**
worktrees from the same repo, each on a different branch:

```
~/code/myrepo/      ← main worktree, branch: main
~/code/myrepo-f12/  ← additional worktree, branch: feat/feature-12
```

They share the same `.git` history (no second clone, no doubled disk),
but each one is an independent working directory: you can `cd` into one
and edit/build/test without affecting the others.

The official docs: <https://git-scm.com/docs/git-worktree>.

## 2. Why pi-epicflow uses them

Every feature in an epic gets its own worktree:

```
~/code/myrepo/                   ← orchestrator runs here (branch: epic/<slug>)
~/code/myrepo-F01-codec/         ← worker for F01 (branch: feat/<slug>/F01-codec)
~/code/myrepo-F02-engine/        ← worker for F02 (branch: feat/<slug>/F02-engine)
```

Created automatically by `pi-feature-start`; removed by
`pi-feature-complete` after squash-merge into the epic branch. You never
manage these directly — pi does.

Benefits:

- A worker editing F02 cannot stomp on F03's files mid-implementation.
- Tests for F02 run in F02's worktree. No `git stash` dance.
- Crashed worker → kill the worktree, respawn. The epic branch is
  untouched.
- Branch-switching never happens mid-implementation; each worker stays
  on its branch for its whole life.

You don't need to know any worktree commands to use pi-epicflow. But if
your project's checkout *already* uses worktrees, the next two sections
matter.

## 3. The two valid setups

### 3a. Single-checkout (classic)

```
~/code/myrepo/        ← the only worktree, branch: main (usually)
├── .git/             ← real git directory
└── …source files…
```

This is what `git clone` gives you out of the box. **It works perfectly
with pi-epicflow.** Just `cd ~/code/myrepo && pi-epic-init <slug>`.
pi-epicflow will create per-feature worktrees alongside (e.g.
`~/code/myrepo-F01-codec/`) and clean them up when done.

### 3b. Bare + worktrees (mkrepo.sh / advanced)

```
~/code/myrepo/
├── .bare/            ← bare clone (the real git data)
├── .git              ← a FILE: "gitdir: ./.bare"
└── main/             ← FIRST worktree, branch: main
```

This pattern lets you keep one directory per branch. Each subdirectory
(`main/`, `develop/`, …) is a separate worktree.

**Gotcha:** the *outer* `~/code/myrepo/` directory is **not** a git
working tree. `git status` and pi-epic-init both fail there with "not a
git repository." You must `cd` into a worktree subdir (e.g.
`~/code/myrepo/main/`) before running any pi or git commands.

## 4. Running pi-epicflow on a bare+worktrees repo

You have two ergonomic options.

### 4a. Reuse the existing worktree (lazy)

Just run `pi-epic-init` from your default-branch worktree:

```bash
cd ~/code/myrepo/main
pi-epic-init my-epic --base main
```

`pi-epic-init` creates branch `epic/my-epic` and **checks it out in this
worktree**. The `main/` directory is now on `epic/my-epic`, not `main`.
When the epic completes, `git checkout main` puts it back.

Per-feature worktrees still appear at the parent level
(`~/code/myrepo/main-F01-…/` or similar — pi names them off the current
worktree).

Downside: while the epic runs, you can't easily use `main/` for normal
work (it's on the epic branch).

### 4b. Dedicated epic worktree (recommended)

Create a worktree just for the epic, so the default-branch worktree
stays free:

```bash
cd ~/code/myrepo
git worktree add my-epic main              # branch off main into ./my-epic/
cd my-epic
pi-epic-init my-epic --base main           # creates epic/my-epic, checks it out here
```

Now you have:

```
~/code/myrepo/
├── .bare/
├── .git
├── main/             ← stays on main; use freely for unrelated work
└── my-epic/          ← branch: epic/my-epic; run pi here
```

Per-feature worktrees land at `~/code/myrepo/my-epic-F01-codec/`,
`~/code/myrepo/my-epic-F02-engine/`, etc. — siblings to `my-epic/`. They
clean up after each `pi-feature-complete`.

When the epic finishes:

```bash
cd ~/code/myrepo
git worktree remove my-epic       # removes the dir; branch stays in git
```

### 4c. Seeding the epic off a non-default branch

If you want the epic to start from a feature branch instead of `main`
(e.g. you have a `users/yourname/prototype` branch with existing work):

```bash
cd ~/code/myrepo
git fetch origin users/yourname/prototype
git worktree add my-epic users/yourname/prototype
cd my-epic
pi-epic-init my-epic --base users/yourname/prototype --title "…"
```

`epic/my-epic` branches off `users/yourname/prototype`, inheriting all
its commits. Your original branch is untouched.

## 5. Troubleshooting

**`ERROR: not in a git repository`**

You're in the outer dir of a bare+worktrees layout. `cd` into one of
the worktree subdirectories (the one without `.bare/` next to it).

**`fatal: '<branch>' is already checked out at '<path>'`**

A branch can be checked out by only one worktree at a time. If you
already have a worktree on that branch elsewhere, either reuse it or
remove the other one (`git worktree remove <path>`).

**Per-feature worktrees not being cleaned up**

Look for stray dirs matching `<repo>-F*` or `<epic-worktree>-F*` next to
your repo. Safe to remove manually:

```bash
git worktree list                          # see what git tracks
git worktree remove --force <stale-path>   # if it's tracked
rm -rf <stale-path>                        # if it's not (untracked dir)
git worktree prune                         # cleanup stale registrations
```

**"Why is my main worktree dirty after `pi-epic-complete`?"**

Known issue in v0.5.0; the epic-archive rename (`.pi/epics/<id>` →
`.pi/epics/done/<id>`) isn't staged automatically. Fix queued for
v0.5.1 (L-025). Workaround: `git add -A && git commit -m "chore(epic):
archive"` after `pi-epic-complete`.

## 6. Mental model summary

| Question | Answer |
|---|---|
| Do I need to create worktrees manually for features? | No — `pi-feature-start` does it. |
| Where do per-feature worktrees appear? | As siblings of your epic worktree. |
| Can I run pi-epicflow without worktrees at all? | The *user-visible* commands run in a single worktree fine. The *feature* worktrees are an implementation detail; you just need git ≥ 2.5. |
| Do worktrees double my disk usage? | No — they share `.git`. |
| Can I work on `main` while an epic is running? | Yes, if the epic has its own dedicated worktree (setup §4b). |
| Can two people share an epic? | Not yet — `.pi/epics/<id>/` has no locking. One person per epic. |

## 7. See also

- `docs/design.md` §"Worktrees per feature, not branch-switching" — why
  this is the design.
- `skills/epic-feature-workflow/scripts/pi-feature-start` — the script
  that creates per-feature worktrees.
- [`git worktree` docs](https://git-scm.com/docs/git-worktree).
