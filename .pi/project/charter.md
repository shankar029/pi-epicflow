# Project charter — pi-epicflow

**Last verified:** 2026-05-26

## Goal

**Ship multi-feature work as one clean PR.** A pi extension that
decomposes a `design.md` into a DAG of small features, runs each on
its own git worktree + short-lived branch, squash-merges back into a
long-lived **epic branch**, and opens a **single reviewable PR to main**
when the whole epic is done. As of v0.13, also provides a **project
memory pillar** that gives pi sessions a persistent, autonomous project
brain with anti-stub enforcement.

## Non-goals

- **Single-feature workflows.** If a change is one feature, use plain
  pi — epicflow's worktree-per-feature overhead isn't worth it.
- **Multi-repo orchestration.** One repo at a time; cross-repo coupling
  is out of scope.
- **CI/CD replacement.** The smoke test is a sanity gate, not a release
  pipeline. Real CI lives in `.github/workflows/`.
- **Web UI / dashboard.** CLI scripts + Markdown brain files only.
- **Global project memory.** v0.13 ships per-repo brain only; no
  shared cross-repo memory.

## Quality bar

- **Test policy:** `install/smoke-test.sh` (Bash) + `smoke-test.ps1`
  (PowerShell) cover every script's happy path and key failure modes.
  Currently 29 tests. New scripts add at least one smoke case.
- **Doc policy:** every new script gets a README section; every new
  agent persona gets YAML frontmatter with a one-line `description`;
  every behavioral change lands a CHANGELOG entry under the in-progress
  `[X.Y.Z-dev]` section; lessons get an L-NNN id.
- **Perf policy:** scripts run in <2s on a clean repo. Long ops
  (test runs, npm install) are explicit and timeout-bounded.
- **Compat policy:** Bash + PowerShell parity for every operator script
  (`pi-epic-*`, `pi-feature-*`). Behavior must be byte-equivalent
  against the smoke fixtures. Minimum pi version pin (`pi >= 0.74`).
- **Anti-stub:** no TODO / FIXME / NotImplementedError / bare-pass
  bodies in shipped code (C-001).

## Owner persona

A senior developer who uses pi to ship real multi-feature work, wants
review-friendly PRs, and is allergic to the agent silently editing
files outside the declared scope.

## Stakeholders

- **Direct:** repo maintainer (shankar029), pi power users adopting
  multi-feature workflows.
- **Downstream:** consumers of `epicflow-*` personas and the
  `project-memory` skill via the npm package.

## Out-of-band references

- README: `./README.md`
- Lessons archive: `CHANGELOG.md` `Lessons added` blocks (L-001..L-059+)
- Active plans: `PLAN-v0.13.0.md` (v0.13), `PLAN-v0.12.0.md` (v0.12)
- Smoke gate: `install/smoke-test.sh`, `install/smoke-test.ps1`
