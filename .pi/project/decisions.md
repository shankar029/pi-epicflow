# Decisions

> ADR-lite. Every non-trivial choice between two or more viable options
> gets an entry. Append-only — to reverse a decision, append a new entry
> with `supersedes: <id>`.

**Last entry:** _(none yet — DEC-NNN will start at DEC-001)_

---

<!-- Entry shape — copy and fill (kept in a code fence so `grep`-based
     audits don't mistake the example headings for real entries):

```md
## DEC-NNN — <short decision title>

**Date:** YYYY-MM-DD
**Session:** S-NNN
**Status:** active | superseded by DEC-NNN
**Supersedes:** _(if applicable)_

**Context:**
<what situation forced a choice>

**Decision:**
<what we chose, in one or two sentences>

**Alternatives considered:**
- <alt 1> — rejected because <reason>
- <alt 2> — rejected because <reason>

**Consequences:**
- <what becomes easier>
- <what becomes harder>
- <what we'll need to revisit if X happens>
```
-->

## Gotchas

> Phase-1 stopgap section. Resolved tricky bugs, footguns, surprising
> library behavior, and version-specific quirks live here until v0.14
> splits them into their own `gotchas.md`.

<!-- Entry shape — in a code fence so grep doesn't see the example heading:

```md
### G-NNN — <short title>

**Date:** YYYY-MM-DD
**Session:** S-NNN

**Symptom:**
<what was observed>

**Root cause:**
<what was actually happening>

**Fix / workaround:**
<what we did, with file:line if applicable>

**Trigger to re-check:**
<dependency version bump? OS upgrade? language version?>
```
-->

## DEC-001 — Worktree-per-feature over single-branch development

**Date:** 2026-05-13
**Session:** S-pre-history (extracted from initial design)
**Status:** active

**Context:**
Multi-feature work historically went one of two ways: single long-lived
branch (massive PR, unreviewable, no checkpoint) or feature-branches-to-main
(noisy history, hard to package as one logical change). Agent-driven workflows
amplify both failure modes — context bloat in the long branch, scope drift in
the loose feature branches.

**Decision:**
Each feature gets its own git worktree under `.pi/epics/<id>/worktrees/<feature>/`
on a short-lived branch off the long-lived epic branch. Features
squash-merge back into the epic branch on completion. The epic branch
becomes the single reviewable PR target.

**Alternatives considered:**
- Single long branch with rebases — rejected: no checkpoint, restart-from-zero on failures, scope drift.
- Feature branches to main directly — rejected: many small PRs lose the epic-level story; reviewers can't see cross-feature contract.
- Stacked PRs (Graphite-style) — rejected: tooling lock-in; squash semantics get fuzzy.

**Consequences:**
- Worker scope is locally enforceable (worktree filesystem isolation).
- Parallel-eligible features can dispatch concurrently (with L-049's file-level pre-check).
- Adds operational complexity: worktree lifecycle, scope_files declarations, conflict classification (H6).
- Need PowerShell mirror of every worktree-touching script (C-003).

---

## DEC-002 — Long-lived epic branch + squash-merge model

**Date:** 2026-05-13
**Session:** S-pre-history
**Status:** active

**Context:**
Given DEC-001 (worktree-per-feature), how do feature commits reach main?

**Decision:**
Long-lived `epic/<id>` branch off `main`. Features squash-merge into the
epic branch (one commit per feature). When the epic completes,
`pi-epic-complete` rebases the epic branch onto current main and opens
a single PR. Result: one PR-per-epic, N squash commits inside.

**Alternatives considered:**
- Rebase-merge per feature — rejected: linear but loses feature boundary in history.
- Merge commits per feature — rejected: noisy reflog, hard to revert one feature cleanly.

**Consequences:**
- Each feature commit on the epic branch is self-contained and revertable.
- Reviewers can scan the epic-PR diff as one logical change OR commit-by-commit.
- Requires `pi-epic-complete` to gate on `epic-review.md` APPROVE_EPIC (L-043).

---

## DEC-003 — Custom `epicflow-*` sub-agent personas over generic `pi-subagents`

**Date:** 2026-05-26
**Session:** S-001 (v0.13 build)
**Status:** active

**Context:**
v0.13's project-memory pillar wants to delegate substantive work to
sub-agents. Generic `pi-subagents` (scout, researcher, worker, reviewer,
oracle from the builtin agent set) drift and time out on real tasks
because they have no mandatory project-context prime and no bounded
output contract.

**Decision:**
Ship 5 custom personas: `epicflow-scout`, `epicflow-researcher`,
`epicflow-worker`, `epicflow-reviewer`, `epicflow-oracle`. Each has:
mandatory `.pi/project/` prime at session start; strict structured
output template; bounded budget (≤30 reads, ≤4 web queries, etc.);
explicit refuse-on-over-scope clauses.

**Alternatives considered:**
- Reuse generic pi-subagents — rejected: dry-runs showed drift/timeout, no project awareness, no anti-stub self-check.
- Patch generic personas via system-prompt extensions — rejected: extension order is fragile; we want hard-coded behavior contracts.
- Single mega-persona — rejected: violates separation of concerns (recon vs impl vs review vs research vs critique).

**Consequences:**
- 5 new agent files to maintain.
- Personas can't be swapped at runtime — that's the point (contract enforcement).
- Generic pi-subagents still available if user wants them.
- Dry-run validated: `epicflow-scout` used 6/30 reads, followed template verbatim, primed on DEC-001+C-001 correctly.

---

## DEC-004 — `.pi/project/` location for the brain (not `docs/project/`)

**Date:** 2026-05-26
**Session:** S-001 (v0.13 build)
**Status:** active

**Context:**
Where on disk do the 6 brain artifacts live? Two natural homes: `docs/project/`
(visible, doc-style) or `.pi/project/` (peer to existing `.pi/epics/`).

**Decision:**
`.pi/project/`. Sits next to `.pi/epics/` and `.pi/STATE.md` under the
existing `.pi/` namespace.

**Alternatives considered:**
- `docs/project/` — rejected: implies for-humans documentation; the brain is primarily for pi consumption, with `index.md` as the routing layer.
- Repo root (`./project/` or `./PROJECT.md`) — rejected: clutters root; conflicts with conventions like `./project/` for product code.
- `.pi/brain/` — rejected: cute but unclear vs the existing `.pi/STATE.md` semantics.

**Consequences:**
- Pi already auto-loads `.pi/` paths; no new ignore rules needed.
- `.gitignore` allowlist for `.pi/project/` (the rest of `.pi/` may be runtime state).
- Slightly less discoverable for human contributors — mitigated by AGENTS.md pointer.

---

## DEC-005 — Phase 1 ships 6 brain artifacts; gotchas/questions/modules deferred

**Date:** 2026-05-26
**Session:** S-001 (v0.13 build)
**Status:** active

**Context:**
The full project-memory design had 9+ artifact types: index, charter,
conventions, decisions, backlog, sessions, gotchas, questions, per-module
cards. Shipping all 9 at once risks over-scaling before we have real
usage signal.

**Decision:**
Phase 1 ships 6: index, charter, conventions, decisions, backlog,
sessions. Gotchas live as a `## Gotchas` section inside `decisions.md`
as a stopgap. Questions and per-module cards are explicitly deferred to
Phase 2.

**Alternatives considered:**
- Ship all 9 — rejected: too much surface to dogfood reliably in one release.
- Ship only 4 (index + charter + decisions + sessions) — rejected: backlog and conventions are too high-value to defer; both fired on the very first dry-run session.

**Consequences:**
- `epicflow-scout` can flag "no module card exists" and steward logs it as backlog (BL).
- When Phase 2 lands, the existing `## Gotchas` section in `decisions.md`
  migrates to a standalone `gotchas.md`. Plan that as DEC-NNN at the time.
