# Backlog

> Parking lot for deferred / out-of-scope / future work. Append-only.
> Items are promoted to formal epics via `/project-review` →
> `/epic-design`, or pulled back into a session when their
> `revisit_when` trigger fires.

**Last entry:** BL-007

---

<!-- Entry shape — in a code fence so grep doesn't see the example heading:

```md
## BL-NNN — <short item title>

**Date:** YYYY-MM-DD
**Source session:** S-NNN
**Status:** open | in-progress (S-NNN) | done (S-NNN) | dropped

**Summary:**
<one or two sentences — what work is parked>

**Deferred because:**
<why we didn't do it now — scope, time, depends-on-X, needs-research, etc.>

**Revisit when:**
<concrete trigger — "next API contract bump", "after auth lands",
"if a real user asks for it", "v2", etc.>

**Related:**
- DEC-NNN, BL-NNN, or external link if relevant
```
-->

## BL-001 — Phase 2 brain artifacts: gotchas.md, questions.md, module cards

**Date:** 2026-05-26
**Source session:** S-001 (v0.13 build)
**Status:** open

**Summary:**
v0.13 Phase 1 ships only 6 brain artifacts. The full design called for
9+: a standalone `gotchas.md` (currently a section inside decisions.md),
a `questions.md` for unresolved-but-tracked items, and per-module cards
under `.pi/modules/<name>.md`.

**Deferred because:**
DEC-005 — too much surface to dogfood reliably in one release. Need
real usage signal from Phase 1 before committing to Phase 2 shape.

**Revisit when:**
- 5+ real users have used the brain for ≥2 weeks, OR
- A pi session naturally produces a "module card-shaped" output that
  doesn't fit the existing 6 artifacts, OR
- The `## Gotchas` section inside decisions.md exceeds ~20 entries
  (then graduate to standalone gotchas.md).

**Related:** DEC-005

## BL-002 — `repo-steward` persona for read-only, brain-only sessions

**Date:** 2026-05-26
**Source session:** S-001 (v0.13 build)
**Status:** open

**Summary:**
A session whose only goal is brain maintenance (running /project-review,
promoting BL items, resolving stale entries) doesn't need full code
write permissions. A dedicated `repo-steward` persona with read-only +
`.pi/project/`-only write scope would be safer.

**Deferred because:**
Phase 1 main-agent stewardship works fine; this is an optimization, not
a correctness fix.

**Revisit when:**
- /project-review starts being run weekly and a maintenance-session
  pattern emerges, OR
- A user reports the main agent accidentally edited code during a brain
  maintenance pass.

**Related:** DEC-003, /project-review

## BL-003 — Web-research integration: `epicflow-researcher` ↔ pi-web-access

**Date:** 2026-05-26
**Source session:** S-001 (v0.13 build)
**Status:** open

**Summary:**
`epicflow-researcher` declares pi-web-access tools (`web_search`,
`code_search`, `fetch_content`) but the dry-run didn't exercise the
actual tool integration. Real research sessions may surface contract
mismatches (citation format, query budget enforcement, etc.).

**Deferred because:**
Live web-access testing belongs in a dogfood session with a real
research question, not in the v0.13 build itself.

**Revisit when:**
- First real session uses `epicflow-researcher` with a substantive
  question (e.g. "what's the current best practice for X?"), OR
- pi-web-access ships breaking changes to its tool contract.

**Related:** DEC-003

## BL-004 — Global cross-repo brain (`~/.pi/global-memory.md`)

**Date:** 2026-05-26
**Source session:** S-001 (v0.13 build)
**Status:** open

**Summary:**
v0.13 is strictly per-repo brain. Recurring cross-repo patterns
(personal coding preferences, lessons that apply everywhere) currently
have to be re-stated in every repo's `.pi/project/conventions.md`.

**Deferred because:**
Per-repo first; cross-repo coupling adds storage location ambiguity
(home dir? pi config dir?) and namespace collision risk.

**Revisit when:**
- Same convention gets added to ≥3 different repos' conventions.md, OR
- A user explicitly asks for "things I always want pi to do".

**Related:** DEC-004

## BL-005 — `/project-init` should detect & migrate existing AGENTS.md

**Date:** 2026-05-26
**Source session:** S-001 (v0.13 build, dry-run finding)
**Status:** open

**Summary:**
When `/project-init` runs on a repo that already has AGENTS.md, the
prompt currently writes a fresh one. It should detect the existing file,
preserve its content, and prepend (or append) only the project-memory
reference block.

**Deferred because:**
The dry-run on the sample app had no pre-existing AGENTS.md; on
pi-epicflow itself I'm hand-merging. Real cases will hit this.

**Revisit when:**
- A user reports `/project-init` overwrote their AGENTS.md, OR
- v0.13.1 polish pass.

**Related:** /project-init

## BL-006 — Fence-aware audit awk should be a reusable shell helper

**Date:** 2026-05-26
**Source session:** S-001 (v0.13 build, dry-run finding #3)
**Status:** open

**Summary:**
Every audit (project-review A-0..A-6, persona primes, future tooling)
needs the same fence-aware "extract real headings, skip ones inside
triple-backtick fences" awk. Currently inlined into project-review.md as
a one-liner. Should be `install/lib/brain-audit.sh` (and a PowerShell
mirror per C-003) with shared helpers: `brain_entries`,
`brain_anchors`, `brain_stale`.

**Deferred because:**
Premature abstraction until a third caller appears.

**Revisit when:**
- Third audit-script writes the same awk inline, OR
- v0.14.0 polish pass.

**Related:** /project-review, C-003

## BL-007 — `pi-epic-status` missing PowerShell mirror (C-003 violation)

**Date:** 2026-05-26
**Source session:** S-001 (surfaced by first brain audit on this repo)
**Status:** open

**Summary:**
`skills/epic-feature-workflow/scripts/pi-epic-status` (bash) has no
corresponding `scripts-win/pi-epic-status.ps1`. Inventory: 9 bash
scripts, 8 PowerShell mirrors. The missing one is `pi-epic-status`,
likely because v0.8.0 modularized it into 6 `lib/pi-epic-status-*.sh`
sub-files and the PowerShell port stalled.

**Deferred because:**
Pre-existing violation discovered during the first brain audit on
this repo. Out of scope for S-001 (which was about building the
project-memory pillar, not closing existing C-003 gaps).

**Revisit when:**
- A Windows user reports `pi-epic-status` missing, OR
- Next v0.13.x or v0.14.0 polish pass, OR
- We add a smoke-test rule that asserts `scripts/` and `scripts-win/`
  have matching basenames — then this BL becomes the first feature in
  a small parity-restoration epic.

**Related:** C-003, L-053 (modularization that triggered the gap)
