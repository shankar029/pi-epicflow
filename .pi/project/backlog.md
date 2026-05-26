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
**Status:** done (S-002, v0.13.1)

**Resolution:** Live-tested by spawning `epicflow-researcher` with a
real multi-source question (compare pi-epicflow project-memory design
against Claude memory tool + claude-mem). The persona gracefully
handled `pi-web-access` not being installed by falling back to `bash`
+ `curl` against steward-supplied URLs, surfaced that as a real
finding, and produced a structured brief
(`docs/announcements/v0.13.1-bl003-research-brief.md`) with 3
alignment points + 5 steal-list items + 3 reject-list items + 1 open
design question. The fallback behavior is now documented in the
persona's system prompt (see BL-008) so future invocations on stewards
without `pi-web-access` degrade gracefully instead of returning a
confident hallucination.

**Related:** DEC-003, BL-008

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
**Status:** done (S-002, v0.13.1)

**Resolution:** Rewrote `prompts/project-init.md` Step 3 with strict
append-only semantics and safety backup. Three explicit paths
(no-existing / existing-without-section / existing-with-section) with
an idempotent-skip guarantee. Mandatory backup to `AGENTS.md.bak`
(timestamped if `.bak` already exists). Anti-patterns explicitly
forbid `Set-Content` / `write` on an existing `AGENTS.md`. Verified all
3 paths in a dry run: pre-existing content byte-preserved; re-runs are
no-ops with unchanged SHA.

**Related:** /project-init

## BL-006 — Fence-aware audit awk should be a reusable shell helper

**Date:** 2026-05-26
**Source session:** S-001 (v0.13 build, dry-run finding #3)
**Status:** done (S-002, v0.13.1)

**Resolution:** Created `install/lib/brain-audit.sh` +
`install/lib/brain-audit.ps1` with `brain_entries` / `brain_anchors` /
`brain_stale_days` (bash) and `Get-BrainEntries` /
`Get-BrainAnchorCount` / `Test-BrainStale` (pwsh). Updated
`/project-review` Step 1 A-0 to call the shared helper, with inline
fallback for both shells. Verified on this repo: both shells return
identical counts (7 BL anchors, 5 DEC anchors).

## BL-007 — `pi-epic-status` missing PowerShell mirror (C-003 violation)

**Date:** 2026-05-26
**Source session:** S-001 (surfaced by first brain audit on this repo)
**Status:** done (S-002, v0.13.1)

**Resolution:** Ported the bash dispatcher + 6 lib sub-files
(~1000 LOC total) to a self-contained `scripts-win/pi-epic-status.ps1`
matching the single-file convention of the other 8 PS mirrors. Python
heredocs were preserved as PS here-strings invoked via
`Invoke-PythonScript` with `PYTHONIOENCODING=utf-8` forced (Windows
default cp1252 was crashing on emoji output). Visual separators
switched from box-drawing `──` to ASCII `---` for Windows-console
compatibility (matches existing `scripts-win/*.ps1` convention). All
4 modes byte-parity verified on a Windows fixture against bash:
`full`, `--json`, `--ready`, `--ready --quiet`. JSON spacing matches
(Python json.dumps used for both). Smoke test gained a `[0/N]` C-003
parity check in both `smoke-test.sh` and `smoke-test.ps1` that fails
if any `scripts/X` lacks a `scripts-win/X.ps1`.

**Related:** C-003, L-053 (modularization that triggered the gap)

## BL-008 — Researcher persona must tolerate missing pi-web-access (anti-stub for research output)

**Date:** 2026-05-26
**Source session:** S-002 (BL-003 live dry-run finding)
**Status:** done (S-002, v0.13.1)

**Summary:**
The `epicflow-researcher` persona declared `web_search`,
`code_search`, `fetch_content`, and `get_search_content` as required
tools without documenting a fallback when `pi-web-access` is absent.
In the BL-003 live test the persona was forced into a graceful `curl`
fallback. Without documented fallback rules it would have either
refused or, worse, hallucinated a brief from training-data memory —
a C-001 anti-stub violation applied to research output.

**Resolution:**
Added a "Tool availability fallback" section to
`agents/epicflow-researcher.md` with three explicit branches:
(1) halt-and-flag if no URLs supplied, (2) `curl` fallback if URLs
supplied, (3) never silently skip. Frames the rule as anti-stub
(C-001) applied to research — don't return a confident-sounding brief
from training-data memory.

**Related:** C-001, BL-003, epicflow-researcher
