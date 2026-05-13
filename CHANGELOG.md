# Changelog

All notable changes to **pi-epicflow** will be documented in this file. The
format loosely follows [Keep a Changelog](https://keepachangelog.com/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/shankar029/pi-epicflow/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/shankar029/pi-epicflow/releases/tag/v0.1.0
