# Changelog

All notable changes to **pi-epicflow** will be documented in this file. The
format loosely follows [Keep a Changelog](https://keepachangelog.com/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.1] — 2026-05-14

Small additive feature plus the new Vite/React marketing site.

### Added
- **`pi-epic-init --base <branch>`.** Override the parent branch the epic
  branches off from (default: repo's auto-detected default branch).
  Resolves against `refs/heads/<branch>` first, then `refs/remotes/origin/<branch>`,
  and fetches before checkout so a clean tracking branch is created. The
  override is persisted in `meta.yaml` as `default_branch:` so downstream
  scripts (`pi-feature-start` worktree base, `pi-epic-complete` PR target)
  use the right branch. Unknown branch → fast-fail with a clear error
  listing the refs checked; no side-effects on the working tree.
  Use case: epics that target a release branch instead of `main`.
- **Vite/React marketing site** under `site/` deployed to GitHub Pages via
  `.github/workflows/deploy-site.yml`. Replaces the prior Jekyll layout
  under `docs/`. Source = GitHub Actions, base path `/pi-epicflow/`.

### Changed
- README script reference now lists `--base` on the `pi-epic-init` row.

## [0.3.0] — 2026-05-14

First end-to-end run by an outside user (`taskq`, 5 features). Three real
bugs surfaced and were fixed; the auto-mode install path got the polish it
needed; release-readiness is now tracked in `docs/RELEASE-CHECKLIST.md`.

### Added
- **postinstall auto-installs auto-mode deps.** `install/postinstall.mjs`
  now ensures `npm:pi-subagents` (required for `/epic-run-auto`) and
  `npm:pi-intercom` (recommended) are installed at the same scope as
  pi-epicflow itself. First run in a fresh environment no longer halts
  mid-epic with *"subagent tool not available"* and forces a pi-session
  restart (the L-011 backstop still applies if this step is skipped or
  fails). Detection of "already installed" is via the relevant
  `settings.json`'s `packages` array, so re-runs are idempotent. Opt out
  with `PI_EPICFLOW_NO_AUTOINSTALL_DEPS=1`.
- **`docs/RELEASE-CHECKLIST.md`** — explicit pre-1.0 gate (multiple
  outside epics, macOS run, deliberate-failure tests for H4/H6/H7, CI
  matrix). Tracks what "public release" means at each semver step so the
  bar doesn't slip.
- **L-016, L-017** appended to
  `skills/epic-feature-workflow/lessons.md` documenting the python3
  interpreter rule and the halt-file gitignore-as-belt rule.

### Fixed
- **L-016 — `python` vs `python3` autodetect.** `/epic-decompose` Step 3
  used to propose `python -m pytest -q` whenever `pyproject.toml` was
  found. On modern Debian/Fedora/Arch (no `python` symlink) every feature
  then halted at H1 even though the worker's tests passed under
  `python3`. The prompt now checks `command -v python3 || command -v
  python` (in that order) and proposes the interpreter that actually
  exists.
- **L-017 — halt files leaking into the epic branch.** L-012 fixed the
  most common path (`pi-feature-start`'s auto-commit train); the
  orchestrator's FINALIZE retry block was a second leak. Three fixes:
  - `pi-epic-init` now writes `.pi/epics/*/halt-*.md` and
    `.pi/epics/done/*/halt-*.md` into `.gitignore` (belt). A stray
    `git add` typo can no longer stage a halt file.
  - The orchestrator's FINALIZE step 5 BLOCK-recovery now spells out
    "stale halt reports are fixed by **deleting** them, not by committing
    them" with the exact `git rm` + `rm` recipe and the same
    `git reset HEAD halt-*.md` belt as the main closeout commit.
  - Both rules cross-referenced in `lessons.md` so the next prompt
    iteration can't undo them silently.
- **Orchestrator skipped `pi-epic-complete` after epic-review APPROVE.**
  Step 6 was a single sentence and ambiguous about whether the
  orchestrator was "done" once `epic-review.md` was committed. Result:
  the taskq epic shipped with `meta.status: in-progress`, journal
  un-archived, deviations un-distilled — the user had to know to run
  `pi-epic-complete` themselves, defeating the point of auto mode. The
  step now spells out the mandatory script call (with `--no-pr` fallback
  for repos without an `origin` remote), the failure-mode-to-halt-code
  mapping, and a FINAL STATUS template that's only legal to post AFTER
  `pi-epic-complete` returns 0.

## [0.2.1] — 2026-05-13

Doc polish + L-015 prompt fix.

### Fixed
- **L-015** — `/epic-decompose` no longer stops after the *"Looks good?"*
  approval prompt. Real-world: pi presented the YAML, asked for feedback,
  user said *"approved"*, pi treated that as end-of-turn and exited —
  decomposition.yaml never got written. The prompt now spells out
  explicitly that approval signals (*"yes"*, *"lgtm"*, *"ship it"*, etc.)
  are the trigger to immediately continue to write+validate+commit in the
  same turn. The deliverable is the committed YAML, not the chat YAML.
  Same fix applied to the Step 6 commit prompt.

### Added
- **README** — new top-of-file sections so a first-time reader gets the
  *why* before the *how*:
  - "The problem this solves" — names the five failure modes of
    naive-agent-in-one-context: context budget, unreviewable PRs, no
    checkpoint, silent scope drift, no memory across runs.
  - "How it works — the mental model" — ASCII diagram of the full pipeline
    plus the four design keys (fresh subagent contexts, worktree per
    feature, YAML-not-chat decomposition, halt-don't-guess).
  - "Two modes" — explicit comparison of auto vs manual, with guidance on
    when to mix.
  - "A worked example" — full pi chat transcript of shipping a 3-feature
    Python todo CLI (`todoq`).
  - "When NOT to use this" — sets expectations on the floor (single-PR
    changes, polyrepo, multi-user concurrent, throwaway exploration).
  - "FAQ" — eight common worries answered (difference vs single branch,
    auto mode optionality, bad decompositions, test failures, parallelism,
    crash recovery, Windows support, lock-in).
- **README badges** — smoke-test CI, license, pi version.

## [0.2.0] — 2026-05-13

UX polish. Same workflow contract — the *commands* the user types are now
three, not seven.

### Added
- **`/epic-decompose` prompt template** — packaged slash command that
  proposes + refines + validates + commits `decomposition.yaml`. No more
  hand-writing YAML or remembering which validator script to run. Discovers
  the active epic from `STATE.md`, reads design.md + lessons.md, presents
  the YAML in chat with an ASCII dep-graph, iterates on user feedback, then
  writes/validates/commits when approved. Also auto-sets `test_cmd` in
  `epic-config.yaml` by sniffing the repo (`pyproject.toml` → pytest,
  `Cargo.toml` → cargo test, etc.).
  - Flags: `--features=N`, `--auto-commit`.
- **`/epic-run-auto` self-bootstrap** — if `decomposition.yaml` is empty,
  `/epic-run-auto` now inlines the `/epic-decompose` flow first instead of
  halting. The whole pipeline runs from a single slash command.
  - New flag: `--no-bootstrap` to opt out and halt with H3 instead.

### Changed
- **README quickstart** — collapsed to the three-command flow
  (`pi-epic-init` → `/epic-decompose` → `/epic-run-auto`). Manual-mode and
  auto-mode deep-dive sections retained for power users.
- **SKILL.md** — added a top-level "three-command flow" section so when pi
  is asked "how do I start a multi-feature change", it points at the slash
  commands rather than the shell scripts.
- **Lifecycle diagram** — step 2 is now `/epic-decompose`, not
  `pi-epic-decompose` (there was never a script by that name).

### Notes
- No script changes — the underlying `pi-*` scripts are byte-identical to
  v0.1.0. The decomposition slash command shells out to
  `pi-epic-validate-decomposition` and `git` exactly as a human would have.
- Postinstall behavior unchanged.
- Upgrade path: `pi update git:github.com/shankar029/pi-epicflow`. Restart
  any open pi session to pick up the new prompt template.

## [0.1.0] — 2026-05-13

Initial public release. Carved out of the personal `epic-feature-workflow`
skill after end-to-end validation on two sample epics (4-feature and
12-feature, the latter with a 7-level DAG and shared-scope serialization).

### Added
- **Skill** `epic-feature-workflow` — the workflow contract, halt codes, lesson
  trail, and templates.
- **Scripts** `pi-epic-init`, `pi-epic-next-feature`, `pi-epic-validate-decomposition`,
  `pi-epic-status`, `pi-epic-complete`, `pi-feature-start`, `pi-feature-complete`.
  Symlinked into `~/.local/bin` by the postinstall hook.
- **Templates** for `design.md`, `decomposition.yaml`, `epic-config.yaml`,
  per-feature `meta.yaml` / `feature.md`, `halt-report.md`, `deviations.md`.
- **Agents** `feature-worker` and `feature-reviewer` — installed to
  `~/.pi/agent/agents/` by the postinstall hook so they're discoverable by
  `pi-subagents`.
- **Prompt** `/epic-run-auto` — the orchestrator template that turns the main
  pi session into a thin loop delegating each feature to a `feature-worker`
  subagent and each pre-merge review to a `feature-reviewer` subagent, with
  STATUS heartbeats and §STALL HANDLING.
- **Postinstall** (`install/postinstall.mjs`) — defensive, idempotent agent
  copy + bin symlink. Honors `PI_EPICFLOW_AGENTS_DIR`, `PI_EPICFLOW_BIN_DIR`,
  `PI_EPICFLOW_SKIP_POSTINSTALL`.
- **Smoke test** (`install/smoke-test.sh`) — end-to-end verification of
  `pi-epic-init → pi-feature-start → pi-feature-complete` in a throwaway repo,
  exercising the L-012 / L-013 / dispatcher invariants.
- **GitHub Actions** CI running the smoke test + shellcheck on every push.

### Documented lessons baked into the workflow
- **L-001..L-009** — empirical lessons captured from the 4-feature sample
  (commit-msg style, deviations log discipline, design.md anchor stability,
  per-feature ADRs, etc.). See `skills/epic-feature-workflow/lessons.md`.
- **L-010** — `pi-epic-next-feature` prefers `in-progress` over `pending` so
  a halt-then-resume picks up the active feature instead of leaking its
  worktree by starting a new one in parallel.
- **L-011** — local extension installs need the full transitive deps tree
  and the correct `settings.json` schema (`"packages"`, not `"extensions"`).
- **L-012** — `pi-feature-start` `git reset HEAD halt-*.md` after staging
  so halt reports never auto-commit onto the epic branch.
- **L-013** — `pi-feature-start` advances `meta.yaml` `status: design →
  in-progress` on first invocation; `pi-epic-complete` sets `done`.
- **L-014** — orchestrator template has an explicit closeout-commit step
  before epic-review, with one allowed retry on working-tree-only BLOCK
  verdicts.

[Unreleased]: https://github.com/shankar029/pi-epicflow/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/shankar029/pi-epicflow/releases/tag/v0.2.1
[0.2.0]: https://github.com/shankar029/pi-epicflow/releases/tag/v0.2.0
[0.1.0]: https://github.com/shankar029/pi-epicflow/releases/tag/v0.1.0
