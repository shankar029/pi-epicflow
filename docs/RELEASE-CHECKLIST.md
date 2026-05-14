# Release checklist

`pi-epicflow` follows [SemVer](https://semver.org/). The bar for each
release rung is explicit so the next maintainer doesn't have to guess.

This document is the source of truth for "is this ready to publish?"

---

## 0.x — Beta / early adopters

**What it means:** The package is installable, the documented happy path
works on Linux, the author has shipped at least one real epic with it,
and breaking changes are expected between minor versions. Issues from
outside users are the primary signal driving the roadmap.

**Per-release gate (every 0.y.z):**

- [ ] `bash install/smoke-test.sh` passes locally.
- [ ] `node --check install/postinstall.mjs` passes.
- [ ] `CHANGELOG.md` has a section for this version with `### Added`,
      `### Fixed`, `### Changed`, `### Removed` as relevant.
- [ ] `package.json` `version` matches the CHANGELOG section.
- [ ] Any new lesson observed during the release's bug fixes is appended
      to `skills/epic-feature-workflow/lessons.md` with a stable
      `L-NNN` id (don't renumber existing ones).
- [ ] `README.md` install / quickstart sections still match reality
      (run them mentally — or actually — against a fresh tmpdir repo).
- [ ] The README *"How it works"* diagram still matches the code if any
      step in the orchestrator changed.
- [ ] Tag the release: `git tag vX.Y.Z && git push --tags`.

**Per-release nice-to-have (best effort, not blocking):**

- [ ] Publish to npm: `npm publish --access public`.
- [ ] Cut a GitHub Release with the CHANGELOG entry as the body.
- [ ] Bump the `pi >= …` and `pi-subagents >= …` floors in `README.md`
      "Compatibility" if observed behavior changed.

---

## 1.0 — Public release

**What it means:** Stable surface. Outside users can `pi install` it and
ship epics without the author present. Breaking changes follow standard
SemVer (major bumps, deprecation notices, migration guides). Fit for
inclusion in a "recommended pi extensions" list, a Show HN, a blog post,
etc.

**Pre-1.0 gate — all of the following must be true:**

### Cross-user validation

- [ ] **≥ 3 outside epics** (i.e. by people other than the author or this
      repo's CI) completed end-to-end with auto mode. Each user's epic
      slug recorded in `docs/RELEASE-CHECKLIST.md` along with their
      reported issues and the commits / lessons that fixed them.
- [ ] **≥ 1 epic with > 8 features** (stresses orchestrator context,
      DAG bookkeeping, and the lessons-distillation pipeline).
- [ ] **≥ 1 epic where ≥ 2 features had merge conflicts** at squash-merge
      time, exercising H6 and the manual recovery instructions.
- [ ] **≥ 1 epic resumed across pi-session boundaries** (close pi
      mid-feature, re-open later, `/epic-run-auto`, finishes cleanly).

### Halt-code coverage

For each halt code, at least one real or deliberately-induced occurrence
with the recovery path executed and the halt-report's "exact resume
command" verified to actually resume:

- [ ] **H1** — tests failed (already covered by 0.2.x runs)
- [ ] **H2** — dirty working tree outside `.pi/epics/<id>/`
- [ ] **H3** — decomposition mismatch (manual edit of decomposition.yaml
      mid-run)
- [ ] **H4** — review cycles exhausted (3+ REQUEST_CHANGES on same
      feature)
- [ ] **H5** — environment fatal (e.g. simulate disk full or remove
      `git` mid-run)
- [ ] **H6** — merge conflict at squash-merge into epic branch
- [ ] **H7** — subagent stalled past the §STALL HANDLING budget

### Platform coverage

- [ ] **macOS** — one full `taskq`-shape epic completed end-to-end on
      a Mac (BSD sed/find quirks, default-shell quirks, `gh` auth).
- [ ] **Linux distro spread** — full run on at least one of {Debian,
      Ubuntu, Fedora, Arch} confirmed.
- [ ] **WSL** — at least one full run; Windows-native explicitly marked
      "unsupported" in README.

### Tooling

- [ ] **CI matrix:** `ubuntu-latest` + `macos-latest`, Node `18.x` +
      `20.x` + `22.x`, Python `3.10` + `3.12` + `3.13`. Each cell runs
      `install/smoke-test.sh`. Badge in README is green.
- [ ] **`pi-subagents` floor pinned in README** to a version known to
      work, with one revalidated point release above it.
- [ ] **`pi` floor pinned in README** to the lowest pi version where the
      `packages` settings schema and the prompt/skill loaders behave as
      expected for the auto-mode flow.

### Docs

- [ ] **`docs/design.md`** still matches the code; any drifted section
      either updated or marked `> Note: <date> the implementation
      diverges; see <commit/PR>.`.
- [ ] **`README.md`** "When NOT to use this" section explicitly lists
      every known un-fit scenario discovered during 0.x.
- [ ] **`docs/auto-mode.md`** (or equivalent) walks a first-time user
      through one full epic at the prompt level, with the actual STATUS
      blocks and halt example in-line.

### Release hygiene

- [ ] `CHANGELOG.md` has a `## [1.0.0]` section summarizing the entire
      0.x history, with a "Breaking changes since 0.2" subsection for
      anyone upgrading.
- [ ] Migration notes for anyone with a `0.x` install: what their existing
      `.pi/epics/<id>/` folders look like under 1.0, and any rename.
- [ ] All `TODO` / `FIXME` / `XXX` markers in `prompts/` and `skills/`
      either resolved or filed as tracked issues.

---

## Outside-epic ledger

Append one row per outside-user epic that contributed to the 1.0 gate.

| Date | User | Repo / epic | Features | Outcome | Issues filed | Lessons added |
|---|---|---|---|---|---|---|
| 2026-05-14 | sample (`taskq-sample`) | `taskq` | 5 | ✅ all merged, 29/29 tests | 3 (deps auto-install, L-016 python3, L-017 halt-leak, orchestrator skipped epic-complete) | L-016, L-017 |
| | | | | | | |

When this table reaches 3+ green rows from genuinely independent users
*and* every other 1.0 gate is checked, cut `1.0.0`.
