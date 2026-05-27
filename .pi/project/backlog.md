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
**Status:** done (S-003, v0.14.0)

**Resolution:** All three Phase 2 artifacts shipped as templates +
SKILL.md trigger updates + `/project-init` wiring + `/project-review`
audit checks (A-6 extended; A-7 index-row staleness; A-8 capacity
caps). Module cards live at `.pi/project/modules/<name>.md` (under the
brain folder, preserving the "one folder = one brain" invariant from
DEC-004) with a `_template.md` users copy by hand. Gotchas trigger
migrated from `decisions.md ## Gotchas` to a standalone
`gotchas.md` (`G-NNN` ids). Questions get a new trigger
("open question" / "we're still deciding") landing in `questions.md`
(`Q-NNN` ids); resolution writes a `DEC-NNN` with `resolves: Q-NNN`
and flips the question's status line.

**Related:** DEC-005 (original deferral), C-001, /project-init,
/project-review

## BL-002 — `repo-steward` persona for read-only, brain-only sessions

**Date:** 2026-05-26
**Source session:** S-001 (v0.13 build)
**Status:** done (S-003, v0.14.0)

**Resolution:** Shipped as `epicflow-steward` persona
(`agents/epicflow-steward.md`). Write scope limited to
`.pi/project/*.md`, `.pi/project/modules/*.md`,
`.pi/project/*-archive-*.md`, and `~/.pi/global-memory/*.md`. Refuses
on any code / test / git / install / config edit with a clear
"Refused — not-brain-work" template. `/project-review` and
`/project-onboard` now include a "Delegation option" section pointing
at it for unattended sweeps across multiple repos. Doesn't replace
the main-agent stewardship pattern — it's a delegation target for
brain-only maintenance sessions.

**Related:** DEC-003 (custom personas), /project-review,
/project-onboard, BL-004 (the steward owns the global overlay too)

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
**Status:** done (S-003, v0.14.0)

**Resolution:** Shipped as an **additive read-on-entry overlay** at
`~/.pi/global-memory/` (directory, not single file — the title above
predates DEC-006). Per DEC-006, per-repo `.pi/project/` remains
canonical; per-repo always wins on conflict. Storage shape mirrors
per-repo templates minus the inherently-per-repo files: `index.md`,
`charter.md` (optional), `conventions.md` (`GC-NNN` ids),
`decisions.md` (`GD-NNN` ids). No global `sessions.md` / `backlog.md`.
SKILL.md gets a new "Global overlay" section documenting load order
(per-repo first, then global), conflict surfacing rule, and explicit
cross-repo write triggers ("globally always X", "across all my
repos", "in every <lang> project of mine"). New
`prompts/project-init-global.md` lays the overlay down once per user
account, idempotent, refuses to overwrite (matches BL-005). The
`epicflow-steward` persona's write scope includes
`~/.pi/global-memory/` so multi-repo sweeps can maintain it.

**Related:** DEC-004 (per-repo location, not superseded), DEC-006
(the layering rule), BL-003 brief §7 (the open design question this
resolves), epicflow-steward

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
