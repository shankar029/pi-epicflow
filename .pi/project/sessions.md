# Sessions

> Append-only log of every pi session. Each session has a stated goal,
> a status, and links to the decisions / backlog items it produced.
> Pi opens an entry autonomously on the first non-trivial turn and
> closes it on goal achievement (or the user invoking `/session-end`).

**Last entry:** S-001

---

<!-- Entry shape — in a code fence so grep doesn't see the example heading:

```md
## S-NNN — <short session title>

**Date:** YYYY-MM-DD
**Goal:** <one sentence>
**Status:** in-progress | achieved | paused | abandoned | superseded
**Started from:** <branch / commit if relevant>
**Ended at:** <YYYY-MM-DD or — if still open>

**Summary:**
<two or three sentences>

**Decisions made:**
- DEC-NNN — <short>

**Backlog added:**
- BL-NNN — <short>

**Conventions added/amended:**
- C-NNN — <short>

**Sub-agents invoked:**
- epicflow-scout × N — <one-line purpose>

**Files touched:**
- path/to/file (created | modified | deleted)

**Open threads (carry into next session):**
- <thing the user said "we'll pick up later">
```
-->

## S-001 — Build v0.13.0 project-memory pillar

**Date:** 2026-05-26
**Goal:** Implement, dogfood, and dogfood-on-self the project-memory pillar (skill, 6 templates, 5 epicflow-* personas, 4 slash commands, anti-stub reviewer hardening) so pi sessions get a persistent, autonomous project brain.
**Status:** achieved
**Started from:** branch `main` at v0.12.0
**Ended at:** 2026-05-26

**Summary:**
Designed and shipped v0.13.0-dev: 16 new files (1 skill, 6 templates,
5 personas, 4 slash commands), feature-reviewer.md hardened with the
anti-stub grep, package.json bumped + templates glob added, CHANGELOG
entry written, README "Two pillars" section. Two dry-runs: a sample
notesd CLI app (validated trigger detection, false-positive resistance,
anti-stub PASS+FAIL, end-to-end persona spawn with `epicflow-scout`)
and this very repo (validated first-run inference from existing
README/CHANGELOG/PLAN — produced 5 substantive DEC entries and 4
extracted-from-code conventions). Three findings surfaced and fixed
in-flight: placeholder leak in conventions template, in-place edit of
in-progress session fields at close time, and fence-aware audit grep
for example shapes inside templates. A fourth (duplicate `## C-003`
from an unconverted placeholder heading in the conventions template)
was found and fixed during the pi-epicflow dogfood. Most importantly,
the first brain audit on this repo found a genuine pre-existing
C-003 violation (BL-007) — the brain immediately justified its
existence.

**Decisions made:**
- DEC-001 — Worktree-per-feature (extracted from initial design)
- DEC-002 — Long-lived epic branch + squash-merge (extracted)
- DEC-003 — Custom `epicflow-*` personas over generic pi-subagents
- DEC-004 — `.pi/project/` location (not `docs/project/`)
- DEC-005 — Phase 1 ships 6 artifacts; gotchas/questions/modules deferred

**Backlog added:**
- BL-001 — Phase 2 brain artifacts (gotchas/questions/modules)
- BL-002 — repo-steward persona for brain-only sessions
- BL-003 — Web-research integration testing
- BL-004 — Global cross-repo brain
- BL-005 — /project-init should preserve existing AGENTS.md
- BL-006 — Fence-aware audit awk → reusable shell helper
- BL-007 — `pi-epic-status` missing PowerShell mirror (surfaced by first brain audit — a real pre-existing C-003 violation)

**Conventions added/amended:**
- C-001 — Anti-stub (HARD RULE) seeded from template
- C-002 — Decisions are append-only seeded from template
- C-003 — Bash + PowerShell parity for operator scripts (extracted)
- C-004 — Lessons get L-NNN ids and CHANGELOG entries (extracted)
- C-005 — One PLAN file per release; never edit shipped PLANs (extracted)
- C-006 — Agent files use YAML frontmatter with mandatory keys (extracted)

**Sub-agents invoked:**
- epicflow-scout × 1 — recon of notesd.storage during sample-app dry-run; 6/30 reads, surfaced 2 real footguns + a stewardship meta-flag

**Files touched:**
- `skills/project-memory/SKILL.md` (created)
- `templates/project/{index,charter,conventions,decisions,backlog,sessions}.md` (created)
- `agents/epicflow-{scout,researcher,worker,reviewer,oracle}.md` (created)
- `prompts/{project-init,project-onboard,project-review,session-end}.md` (created)
- `agents/feature-reviewer.md` (modified — anti-stub grep added)
- `package.json` (modified — version 0.13.0-dev, templates glob)
- `CHANGELOG.md` (modified — v0.13.0-dev entry)
- `README.md` (modified — Two pillars section)
- `PLAN-v0.13.0.md` (created — design record)
- `.pi/project/{index,charter,conventions,decisions,backlog,sessions}.md` (created — this brain)
- `AGENTS.md` (created — points at the brain)

**Open threads (carry into next session):**
- Tag v0.13.0 (drop -dev suffix) once a real-user session has exercised
  /project-init on a third repo.
- BL-005 is the most likely first paper cut for adopters with existing
  AGENTS.md — consider patching in v0.13.1.
- BL-006 (fence-aware awk helper) is the most likely engineering
  follow-up; defer until a 3rd caller appears.

---

## S-002 — v0.13.1 follow-up: close BL-003 / BL-005 / BL-006 / BL-007 + BL-008 finding

**Date:** 2026-05-26
**Goal:** Resolve all gaps and Windows-blocking issues identified during the
v0.13.0 release so the maintainer can run an epic on a real codebase
under Windows without hitting known paper cuts. Explicitly: BL-003
(live researcher dry-run), BL-005 (`/project-init` preserves AGENTS.md),
BL-006 (fence-aware audit helper), BL-007 (`pi-epic-status.ps1` port).
Phase 2 / BL-001 / BL-002 / BL-004 explicitly held out as
feature-expansion, not gaps.

**Status:** achieved
**Started from:** branch `main` (at v0.13.0 tag)

**Decisions promoted to DEC:**
- (none — incremental work; no architectural decisions changed)

**Backlog items added / advanced:**
- BL-003 — done. Spawned `epicflow-researcher` live; surfaced 5-item
  steal-list comparing pi-epicflow vs Claude memory tool + claude-mem;
  brief at `docs/announcements/v0.13.1-bl003-research-brief.md`.
- BL-005 — done. `/project-init` Step 3 rewritten with strict
  append-only semantics, safety backup, idempotent skip; all 3 paths
  verified in dry run.
- BL-006 — done. `install/lib/brain-audit.{sh,ps1}` shipped with
  `brain_entries` / `brain_anchors` / `brain_stale_days` (bash) and
  `Get-BrainEntries` / `Get-BrainAnchorCount` / `Test-BrainStale`
  (pwsh); both shells return identical counts on this repo.
- BL-007 — done. `scripts-win/pi-epic-status.ps1` ported
  (single-file, ~1000 LOC, all 4 modes byte-parity with bash). New
  C-003 parity check in both smoke tests asserts every `scripts/X`
  has a `scripts-win/X.ps1`.
- BL-008 — opened then done in same session. Persona-fallback
  hardening (researcher must not hallucinate when pi-web-access is
  missing); discovered during the BL-003 live test.

**Conventions changed:**
- (none — C-001..C-006 unchanged)

**Sub-agents invoked:**
- epicflow-researcher × 1 — BL-003 live test against
  Claude memory tool + claude-mem; 2 curl fetches against
  steward-supplied URLs after pi-web-access unavailable;
  Partial: true; brief saved as artifact.

**Files touched:**
- `agents/epicflow-researcher.md` (modified — added "Tool availability
  fallback" section per BL-008)
- `install/lib/brain-audit.sh` (created)
- `install/lib/brain-audit.ps1` (created)
- `install/smoke-test.sh` (modified — new [0/29] C-003 parity check)
- `install/smoke-test.ps1` (modified — new [0/8] C-003 parity check)
- `prompts/project-init.md` (modified — Step 3 hardened per BL-005)
- `prompts/project-review.md` (modified — A-0 calls shared helper)
- `skills/epic-feature-workflow/scripts-win/pi-epic-status.ps1` (created)
- `package.json` (modified — version 0.13.0 → 0.13.1)
- `CHANGELOG.md` (modified — [0.13.1] entry)
- `.pi/project/backlog.md` (modified — BL-003/005/006/007 closed;
  BL-008 opened + closed)
- `.pi/project/sessions.md` (modified — this entry)
- `docs/announcements/v0.13.1-bl003-research-brief.md` (created)

**Open threads (carry into next session):**
- Steal-list items 1–5 from the BL-003 research brief (ASSUME-INTERRUPTION
  framing, tightened read-on-entry, progressive-disclosure index,
  size+age caps, in-progress-line uniqueness) — none are bugs; all are
  v0.14 design conversation candidates.
- §7 open design question from the brief: retrieval story when
  `.pi/project/` outgrows grep (option a = grep-only + size caps; b =
  `epicflow-retriever` persona; c = optional FTS5 sidecar).
  Recommended (b) now, defer (c).
- BL-001, BL-002, BL-004 remain open by deliberate choice — feature
  expansion, not gaps; wait for real-user signal from v0.13.x runs.
