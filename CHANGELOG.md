# Changelog

All notable changes to **pi-epicflow** will be documented in this file. The
format loosely follows [Keep a Changelog](https://keepachangelog.com/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.14.2] — 2026-06-09

### Added (site — between v0.14.1 and v0.14.2)

- **In-site Quickstart page** at
  [`#/quickstart`](https://shankar029.github.io/pi-epicflow/#/quickstart).
  4-step walkthrough (install pi → install pi-epicflow → verify → pick
  first-use path), 3 branching path tutorials (project-memory only,
  epic-only, both pillars), troubleshooting. Header nav gets
  Quickstart link before Docs and Blog. Hero CTA button rewired from
  GitHub README anchor to `#/quickstart`.

- **"Worktree topology" docs page** at `#/docs/worktrees` covering
  default vs dedicated-epic-worktree patterns, per-feature worktrees,
  when-to-pick-which table, rationale, and cleanup recipes.

- **"Reference docs" section on the website** at
  [`#/docs`](https://shankar029.github.io/pi-epicflow/#/docs). 9
  reference pages: Overview, Commands, Scripts, Personas, Skills,
  Brain artifacts, Trigger phrases, Halt codes (H1–H7),
  Install & config. Each page has a "Source on GitHub" deep-link.

### Fixed (npm — ship in the v0.14.2 tarball)

- **postinstall scope detection (L-055)** — `pi install npm:pi-epicflow`
  installed under a plain npm-global prefix (`/usr/local/lib/node_modules/`,
  `~/.npm-global/lib/node_modules/`, nvm/fnm/Homebrew/volta layouts,
  `%AppData%\npm\node_modules\`) now correctly resolves as `global` scope
  via the new "npm-global" fallback regex matching
  `*/(lib/)?node_modules/pi-epicflow$`. Previously the install-scope
  detector only knew about pi's own `~/.pi/agent/` and `<repo>/.pi/{git,npm}/`
  layouts, so any npm-global install printed `WARN: could not detect
  install scope` and skipped the auto-install of `pi-subagents` /
  `pi-intercom`. Users then hit a mid-`/epic-run-auto` "subagent tool
  not found" and had to bounce their pi session.

- **stale skill-tarball sweep (L-056)** — postinstall now removes any
  `~/.pi/agent/skills/epic-feature-workflow*.tar.gz` left over from
  pre-v0.4 installs (when pi packaged the skill as a tarball instead
  of an unpacked directory). Pi's own `pi update` never touches these,
  so the junk accumulates silently.

- **`pi-epicflow-doctor`: proactive npm-prefix EACCES detection (L-054)**
  — new `── npm prefix ──` section runs `npm config get prefix`,
  checks writability of `<prefix>/lib/node_modules`, and prints the
  fix recipe (re-point npm to `~/.npm-global`) if not writable.
  Surfaces the cliff BEFORE the user hits it on their next
  `pi update`. PowerShell parity in `scripts-win/pi-epicflow-doctor.ps1`
  (uses `%LOCALAPPDATA%\npm-global` for Windows users).

- **`pi-epicflow-doctor`: pending agent-update visibility (L-057)**
  — new `── pending agent updates ──` section lists every `*.new`
  file under `~/.pi/agent/agents/` (staged by postinstall's
  non-destructive overwrite) with a one-line `diff` + accept/reject
  recipe. Previously these were only mentioned in scrollback during
  install; now surfaced on demand.

### Fixed (site polish since v0.14.1)

- **All install commands across the site lead with npm**
  (`pi install npm:pi-epicflow@^0.14`) instead of the git source.
  Git source repositioned as the fallback for unreleased commits.
  Affects: landing TerminalWindow snippet, blog
  `v0-14-end-to-end-guide` install block, docs `config` page.

- **Lead with "this is a pi plugin"** in README, site Hero, and docs
  overview. Prior copy assumed readers knew what pi was; now there's an
  explicit prereq callout naming sibling tools (Claude Code, Aider,
  Cursor) so newcomers can anchor what pi is.

- **Complete-guide blog post halt table corrected** from invented
  H1–H11 to real H1–H7. Linked to new `#/docs/halts` reference.

### Notes

- The four npm-package fixes above were discovered during a smoke test
  of `pi install npm:pi-epicflow@^0.14` in a fresh prefix and verified
  by re-running the smoke + doctor against seeded test conditions
  (stale tarball + .new file). All four are pure surface improvements
  — no behavioral change for users who weren't already in the broken
  state.

## [0.14.1] — 2026-05-26

**Docs + website + end-to-end guide for v0.14.** Functional code
unchanged from v0.14.0; this release ships the operator-facing
material that makes v0.14 actually adoptable. First version published
to npm (v0.13.x was git-only).

### Added

- **End-to-end blog post** at
  [`#/blog/v0-14-end-to-end-guide`](https://shankar029.github.io/pi-epicflow/#/blog/v0-14-end-to-end-guide).
  ~18-minute read covering: the mental model in 90 seconds; day-zero
  install + both inits (`/project-init-global`, `/project-init`); the
  9-file structure with full trigger-phrase reference table; a complete
  25-minute session walkthrough showing every trigger type firing once;
  the Q→DEC double-write (the brain's only non-append edit); when and
  how to author module cards; global overlay vocabulary and conflict
  resolution; the `epicflow-steward` persona's write-allowlist and the
  three reasons to invoke it; capacity caps + manual rollover recipe
  with stable-ids-never-recycle rule; a weekly rhythm cheat-sheet; and
  five common pitfalls.
- **v0.14.0 release banner** on the site landing page (vibrant-green,
  above the v0.13.0 banner). Links to the end-to-end guide, the
  CHANGELOG entry, the PLAN, and the GitHub release.

### Changed

- **README Pillar 2 section** — rewritten for v0.14:
  - 6‐artifact table → 9-artifact table (added `gotchas.md`,
    `questions.md`, `modules/<name>.md`; flagged Phase 2 entries).
  - New "Plus one optional cross-repo overlay" subsection documenting
    `~/.pi/global-memory/` shape, load order, conflict rule, and
    trigger vocabulary; links to DEC-006.
  - 5‐persona list → 6-persona list (added `epicflow-steward` with
    write-allowlist callout).
  - 3‐slash-command block → 5-command block (added
    `/project-init-global` and `/project-review`; corrected the
    "three" miscount that had been in the file since v0.13).
  - Capacity & rollover subsection added (full caps table; manual,
    user-confirmed rollover; stable-ids-never-recycle rule).
  - "See:" footer now points at the end-to-end guide as the canonical
    "how to use this" entry point.
- **Site landing page hero copy** — "new in v0.13" → "new in v0.13,
  expanded in v0.14" with the global overlay mention; the previous
  hero pill (`v0.14 — phase 2 brain + global overlay`) is unchanged.

### Notes

- **Functional code is bit-identical to v0.14.0.** Skill, templates,
  prompts, agents, install scripts, and tests all unchanged. Only
  documentation files were touched: `README.md`, `site/src/App.tsx`,
  `site/src/posts.ts`, `site/src/blog-posts/v0-14-end-to-end-guide.tsx`
  (new), `package.json`, `CHANGELOG.md`.
- **First npm publish.** Tag `v0.14.1` is the first version we publish
  to the npm registry (v0.13.0…v0.14.0 are git-only). Installs via
  `pi install npm:pi-epicflow@^0.14` now resolve cleanly.
- **No new lessons.** Same six locked design calls as v0.14.0; same
  brain hygiene rules.
- **GitHub Release for v0.14.0** will reference back to this post for
  the operator guide.

## [0.14.0] — 2026-05-26

**Phase 2 brain + steward persona + global cross-repo overlay.** The
v0.13 deferred items (BL-001 Phase 2 artifacts, BL-002 maintenance
persona, BL-004 cross-repo brain) plus the two foundational steal-list
items from the BL-003 brief (progressive-disclosure index, size+age
caps with rollover) all ship in one minor bump. Per-repo brain remains
canonical; cross-repo is opt-in. Six locked design calls in
[`PLAN-v0.14.0.md`](PLAN-v0.14.0.md).

### Added

- **Progressive-disclosure `index.md` (steal-item 3 from BL-003 brief).**
  Rewrote `templates/project/index.md` with a top-of-file "Read for X"
  routing table so the agent loads only the artifacts a turn actually
  needs. Per-section anchors (`#charter`, `#conventions`, etc.) plus
  archive + global-overlay sections. SKILL.md "Start" step
  retargeted to honor the routing table; the explicit instruction is
  "do not slurp every artifact on every session start."
- **Capacity & rollover policy (steal-item 4 from BL-003 brief).** New
  SKILL.md section codifies per-artifact caps: `decisions.md` 500 /
  2 yr, `backlog.md` 200 / 180 d open, `sessions.md` 150 / 1 yr,
  `gotchas.md` 200 / 2 yr, `questions.md` 50 open + 200 resolved /
  1 yr open. Conventions and charter are uncapped. Stable ids never
  recycle across archives. Rollover is **never automatic** —
  `/project-review` Step A-8 flags candidates and surfaces a
  `git mv → fresh-live-file → index.md archive row` recipe.
- **Phase 2 brain artifacts (BL-001).** Three new templates:
  - `templates/project/gotchas.md` (`G-NNN` ids; trigger migrated
    out of `decisions.md ## Gotchas`).
  - `templates/project/questions.md` (`Q-NNN` ids; new trigger; the
    single non-append edit allowed is flipping `**Status:** open` →
    `resolved (see DEC-NNN)`).
  - `templates/project/modules/` (`README.md` + `_template.md`).
    Cards live at `.pi/project/modules/<name>.md` per the
    "one folder = one brain" invariant (DEC-004 unchanged). No
    automatic prompt to author cards — deliberately user-driven for
    v0.14.0; an authoring prompt may land in v0.14.x if usage
    justifies it.
  - SKILL.md trigger table updated: gotcha trigger → `gotchas.md`;
    new "unresolved-question" trigger → `questions.md`; "resolved an
    open question" double-write (DEC + question status flip on the
    same turn).
  - `/project-init` template table extended with the three new
    artifacts; older pi-epicflow installs (pre-v0.14) skip them
    silently.
  - `/project-review` audits extended (A-6 module-card coverage,
    A-7 index-row staleness, A-8 capacity caps).
- **`epicflow-steward` persona (BL-002).** New sub-agent
  (`agents/epicflow-steward.md`) with write scope strictly limited to
  `.pi/project/*.md`, `.pi/project/modules/*.md`,
  `.pi/project/*-archive-*.md`, and `~/.pi/global-memory/*.md`.
  Refuses any code / test / git / install / config edit. Modes:
  `audit`, `promote BL-NNN`, `archive <file>`,
  `update last_verified`, `sweep`. `/project-review` and
  `/project-onboard` gain a "Delegation option" section for
  unattended sweeps across multiple repos. Doesn't replace the
  main-agent stewardship pattern — it's a delegation target for
  brain-only maintenance. Auto-registered by the existing postinstall
  `readdirSync(agents/)` (no installer changes).
- **Global cross-repo brain overlay (BL-004) at `~/.pi/global-memory/`.**
  Strictly additive read-on-entry layer. Per-repo `.pi/project/`
  remains canonical and always wins on conflict (`DEC-006`). Storage
  shape mirrors per-repo templates minus the inherently-per-repo
  files:
  - `templates/global/index.md` (routing).
  - `templates/global/charter.md` (optional personal/team identity).
  - `templates/global/conventions.md` (`GC-NNN` cross-repo always/never).
  - `templates/global/decisions.md` (`GD-NNN` cross-repo defaults
    like "ruff+uv for all Python").
  - **No** global `sessions.md` / `backlog.md` (per DEC-006).
  SKILL.md gets a new "Global overlay" section: read order (per-repo
  first, then global), conflict-surfacing rule, explicit cross-repo
  write triggers ("globally always X" / "across all my repos" /
  "in every <lang> project of mine"), anti-false-positives. New
  `prompts/project-init-global.md` lays the overlay down once per
  user account, idempotent, refuses to overwrite (matches BL-005 /
  v0.13.1 hardening).

### Changed

- `skills/project-memory/SKILL.md` — "Start" step gains a global-load
  step (#2) and is retargeted to honor the progressive-disclosure
  routing table. Trigger table now points gotchas at `gotchas.md`
  and adds the question + question-resolution triggers. New
  sections: "Global overlay" and "Capacity & rollover".
- `templates/project/index.md` — full rewrite. The old version was
  a 5-row table + module map; the new version is a routing table +
  per-section anchors + archive table + global-overlay pointer.
- `prompts/project-init.md` — template list extended for the three
  Phase 2 artifacts (v0.14+ only; older installs degrade silently).
- `prompts/project-review.md` — "Delegation option" section for
  `epicflow-steward`; A-6 / A-7 / A-8 audit additions.
- `prompts/project-onboard.md` — "Delegation option" section.
- `.pi/project/decisions.md` — added DEC-006 (cross-repo layering
  rule, additive overlay, per-repo wins on conflict).
- `.pi/project/backlog.md` — BL-001, BL-002, BL-004 closed.
- `.pi/project/sessions.md` — S-003 opened to track this work.

### Notes

- **DEC-004 is not superseded.** It specifies per-repo brain
  *location*; DEC-006 adds an opt-in global layer that doesn't
  contradict it.
- **Backwards compatibility.** Existing v0.13.x repos work unchanged.
  Re-running `/project-init` on a v0.13 repo will add the three new
  Phase 2 templates only if they're not already present (BL-005
  semantics). Re-running on a v0.14 repo is a no-op (idempotent
  skip).
- **No automatic rollover.** All archive splits are user-confirmed
  via `/project-review`.
- **No retrieval/search persona** — deferred from the BL-003 brief
  §7. `index.md` + grep stays the primary access path. If usage
  signal demands it, an `epicflow-retriever` is the natural next
  persona; not in v0.14.
- **No global `sessions.md` / `backlog.md`.** Cross-repo work surfaces
  as global conventions or decisions, not as global work items.
  Per-repo backlog entries can carry a `cross-repo: yes` tag.

## [0.13.2] — 2026-05-26

**Polish + website blog.** Three small adoptions from the BL-003
research brief comparing pi-epicflow project-memory against Claude's
memory tool and `claude-mem`, plus a real blog section on the marketing
site. No bug fixes; no breaking changes.

### Added

- **"ASSUME INTERRUPTION" operating principle in `project-memory`
  SKILL.md.** Inspired by Anthropic's memory-tool system prompt. One
  paragraph at the top of "Session lifecycle" telling the agent to
  treat every turn as potentially the last one before context resets:
  write `DEC` / `BL` / `C` / `L` entries on the turn the trigger
  fires, not at end-of-task. The end-of-task sweep is now framed as a
  safety net, not the primary write phase. Defends against the
  canonical failure mode where the end-of-session summarizer smooths
  over the exact "chose X over Y because Z" nuance.
- **Restate-active-ids rule in `project-memory` SKILL.md "Start"
  step.** Before any non-trivial action on session entry, the agent
  must name the specific `DEC-NNN` / `BL-NNN` / `C-NNN` / `L-NNN` ids
  it just loaded and intends to honor on this turn. Forces actual
  recall (vs. "I read past it") and gives the user a checkpoint to
  correct stale context before action.
- **In-progress line uniqueness invariant for `sessions.md`.** The
  open session's `**Status:**` line must be byte-unique within
  `sessions.md` (use
  `**Status:** in-progress (S-NNN open since YYYY-MM-DD HH:MM)`). Keeps
  the one mutable line in the entire `.pi/project/` tree safe for
  current and future `str_replace`-style tooling. Documented in
  `templates/project/sessions.md` and enforced by a new check in
  `/project-review` Step 1 A-5 ("Session hygiene") that fails when
  more than one in-progress entry is open at a time — catches a crash
  that left a stale open session behind.
- **Blog on the marketing site** (`site/`). New `#/blog` route lists
  posts; `#/blog/<slug>` renders a single post. Zero new dependencies
  — a hash-router (~30 LOC, `useEffect` + `hashchange` event) keeps
  this lightweight. Two launch posts:
  - **"Project memory: pi sessions that stop forgetting"** — the
    `.pi/project/` design, trigger-phrase writes, anti-stub HARD RULE,
    and the five custom sub-agent personas, with the "~50 sessions
    of trying variants" framing.
  - **"Feature decomposition: turning design.md into a parallel
    DAG"** — why `/epic-decompose` writes a YAML DAG, the seven-
    signal `needs_planner` test, halt codes, and how `deviations.md`
    feeds back into `lessons.md` so the next epic gets smarter.
- Navbar + footer gain a **"Blog"** link pointing at `#/blog`.
- Site version pill bumped 0.13.0 → 0.13.2 (cosmetic; tracks shipped
  changes).

### Changed

- `skills/project-memory/SKILL.md` — added "Operating principle:
  ASSUME INTERRUPTION" subsection above "Start"; promoted the
  restate-active-ids rule from implicit to explicit step 2.
- `templates/project/sessions.md` — expanded the inline
  documentation around the `Status:` field with the uniqueness
  invariant.
- `prompts/project-review.md` — A-5 audit now includes the
  uniqueness check, with both `bash` and `pwsh` recipes.

### Notes

- The three steal-list items from the BL-003 brief that landed here
  (items 1, 2, 5) are the zero-design-risk subset. Items 3 (per-
  section anchors + routing table in `index.md`) and 4 (size+age caps
  with explicit rollover) deserve their own scoping conversation and
  remain open for v0.14.
- Blog posts are sourced under `site/src/blog-posts/` and registered
  in `site/src/posts.ts`. Adding a third post is a 3-line change to
  the registry plus one new TSX file.

## [0.13.1] — 2026-05-26

**Bug-fix + hardening release.** Closes every gap surfaced by the
v0.13.0 self-dogfood (BL-003, BL-005, BL-006, BL-007) plus one new
finding (BL-008) so v0.13 is safe to run on a real Windows codebase
for a real epic. Phase 2 / cross-repo brain / repo-steward persona
remain deliberately deferred until real-user signal arrives — they're
feature expansion, not gaps.

### Fixed

- **BL-005 — `/project-init` preserves existing `AGENTS.md`.** Step 3
  rewritten with strict append-only semantics, safety backup
  (`AGENTS.md.bak`, timestamped if `.bak` already exists), idempotent
  re-run, and an explicit anti-pattern list (no `Set-Content` / `write`
  on existing `AGENTS.md`). All three paths (no-existing / existing-
  without-section / existing-with-section) verified in dry run with
  byte-preservation check.
- **BL-007 — `pi-epic-status` PowerShell mirror shipped.** Bash
  dispatcher + 6 `lib/pi-epic-status-*.sh` sub-files (~1000 LOC) ported
  to a single self-contained `scripts-win/pi-epic-status.ps1` matching
  the convention of the other 8 PS mirrors. All four modes verified
  byte-parity on a Windows fixture against bash: `full`, `--json`,
  `--ready`, `--ready --quiet`. Closes the pre-existing C-003 violation
  that escaped twelve prior releases.
- **BL-008 — `epicflow-researcher` persona must not hallucinate when
  `pi-web-access` is absent.** Persona system prompt now mandates a
  three-branch fallback: halt-and-flag if no URLs supplied; `curl`
  fallback if steward supplies primary-source URLs; never silently skip.
  Framed as anti-stub (C-001) applied to research output. Surfaced by
  the BL-003 live test.

### Added

- **`install/lib/brain-audit.{sh,ps1}`** — shared fence-aware helpers
  for `.pi/project/` audits. Bash: `brain_entries` / `brain_anchors` /
  `brain_stale_days`. PowerShell: `Get-BrainEntries` /
  `Get-BrainAnchorCount` / `Test-BrainStale`. Both shells return
  identical counts on this repo (verified: 7 BL anchors, 5 DEC
  anchors). `/project-review` Step 1 A-0 now calls the helper with
  inline fallback for both shells. Closes BL-006 and eliminates the
  `awk`-on-Windows risk.
- **C-003 parity check in both smoke tests.** New `[0/N]` phase in
  `install/smoke-test.sh` and `install/smoke-test.ps1` that fails if
  any `scripts/X` lacks a corresponding `scripts-win/X.ps1`. The next
  missing PowerShell mirror cannot now slip through to release.
- **`docs/announcements/v0.13.1-bl003-research-brief.md`** — structured
  brief from the BL-003 live test, comparing pi-epicflow project-memory
  against Claude's memory tool and `claude-mem`. Five-item steal-list,
  three-item reject-list, one open design question for v0.14+ (the
  retrieval story when `.pi/project/` outgrows grep).

### Changed

- **`agents/epicflow-researcher.md`** — hard-bound fallback section
  added (see BL-008 above).
- **`prompts/project-init.md`** — Step 3 rewritten end-to-end (see
  BL-005 above).
- **`prompts/project-review.md`** — Step 1 A-0 references the shared
  brain-audit helper instead of an inline `awk` one-liner.
- **`skills/epic-feature-workflow/scripts-win/pi-epic-status.ps1`** —
  new self-contained PS port. Uses ASCII separators (`---`) rather
  than bash's box-drawing `──` because Windows-console encoding can
  drop non-ASCII chars when output is redirected through pipes;
  matches the convention of other `scripts-win/*.ps1` files. Forces
  `PYTHONIOENCODING=utf-8` for embedded Python heredocs so emoji
  output (⏳, ✅, etc.) renders correctly on Windows.

### Notes

- v0.13 touched zero shell scripts. v0.13.1 adds exactly one PS file
  (`pi-epic-status.ps1`) and one shared lib pair
  (`brain-audit.{sh,ps1}`). Total LOC delta is small; release surface
  area in the published tarball grows by ~40 KB.
- Three open BL items remain deferred by deliberate choice: **BL-001**
  (Phase 2 brain artifacts: gotchas.md / questions.md / module cards),
  **BL-002** (read-only `repo-steward` persona), **BL-004** (global
  cross-repo brain). All three are feature expansion, not gaps. They
  ship when real-user signal from v0.13.x runs justifies the surface.

## [0.13.0] — 2026-05-26

**Project Memory pillar.** A second pillar alongside the epic workflow:
persistent, file-based project brain that pi reads on entry and writes
to autonomously — no reliance on the user invoking slash commands. See
[`PLAN-v0.13.0.md`](PLAN-v0.13.0.md) for full design + decisions log.

### New: `project-memory` skill

- **`skills/project-memory/SKILL.md`** — autoloaded in any repo with
  `.pi/project/`. Teaches pi to: read `.pi/project/index.md` on entry;
  ask for a one-sentence session goal on the first non-trivial turn;
  watch for trigger phrases ("defer", "decided", "always do X", "out of
  scope") and append to `decisions.md` / `backlog.md` / `conventions.md`
  **at the moment the phrase fires** (not at end-of-session); run an
  end-of-task sweep before any "done" report; detect goal achievement
  and propose closing the session; refuse to ship stubs; delegate
  substantive work to `epicflow-*` sub-agent personas.

### New: 6 brain artifact templates

- **`templates/project/{index,charter,conventions,decisions,backlog,sessions}.md`**
  — the six artifacts scaffolded by `/project-init` into the consumer
  repo's `.pi/project/`. `index.md` is the always-loaded router (≤150
  lines). `charter.md` captures goal / non-goals / quality bar / owner
  persona. `conventions.md` ships with C-001 (anti-stub) and C-002
  (append-only) seeded. `decisions.md` is ADR-lite, append-only.
  `backlog.md` is the parking lot with `revisit_when` triggers.
  `sessions.md` logs every session: goal, status
  (`in-progress`/`achieved`/`paused`/`abandoned`/`superseded`), summary,
  linked DEC/BL ids, sub-agents invoked, files touched.

### New: 5 custom `epicflow-*` sub-agent personas

Generic pi-subagents personas (scout/researcher/worker/reviewer/oracle)
drift and time out because they're built to fit any task. The custom
versions have mandatory context primes, bounded tool budgets, strict
output templates, and anti-stub self-checks.

- **`agents/epicflow-scout.md`** — read-only repo recon. Primes on
  `.pi/project/`, ≤30 file reads, refuses edits, returns a structured
  brief (purpose / public API / invariants / gotchas / pointers).
- **`agents/epicflow-researcher.md`** — web research via
  `pi-web-access`. ≤4 queries, ≥6 fetches, ≥2 primary-source
  citations required. Refuses repo-internal questions.
- **`agents/epicflow-worker.md`** — bounded implementation. ≤5 files
  per invocation, mandatory plan-before-edit, anti-stub grep self-check
  before reporting back. Returns diff summary + decisions-discovered +
  items-deferred. Refuses with `needs-split` on over-scope.
- **`agents/epicflow-reviewer.md`** — independent diff review. 7
  checks: CHK-1 anti-stub (hard fail), CHK-2 scope, CHK-3 conventions,
  CHK-4 decision conflicts, CHK-5 acceptance criteria, CHK-6 tests,
  CHK-7 smell-check (soft).
- **`agents/epicflow-oracle.md`** — architectural critique. Returns
  top-3 risks (not five, not ten — three), alternatives considered,
  and a verdict: PROCEED / PROCEED_WITH_CHANGES / RECONSIDER. Can run
  async; writes `progress.md` for crash recovery.

### New: 4 slash commands

- **`/project-init`** (`prompts/project-init.md`) — one-shot scaffold.
  Reads README/package.json to infer charter facts, asks 4 batched
  questions with recommended defaults, copies templates from
  `templates/project/` into `.pi/project/`, opens session S-001, wires
  the root `AGENTS.md` to reference the index, commits on a
  `project/init` branch.
- **`/project-onboard`** (`prompts/project-onboard.md`) — optional
  warm-up at session start. Prints goal / recent decisions / open
  backlog / last sessions / active conventions / ripe items, then
  forces the session-goal ask.
- **`/project-review`** (`prompts/project-review.md`) — periodic audit.
  Six checks (A-1 staleness, A-2 backlog ripeness, A-3 conventions
  drift, A-4 decision drift, A-5 stuck sessions, A-6 module-card
  coverage), recommends 5 actions (promote-to-epic, close-stuck,
  drop-stale, refresh-brain, fix-violations), confirms before
  executing.
- **`/session-end`** (`prompts/session-end.md`) — manual force-close
  for the current `in-progress` session. Runs the end-of-task sweep
  first; infers `achieved`/`paused`/`abandoned` if not specified.

### Existing: `feature-reviewer` hardened with anti-stub grep

- **`agents/feature-reviewer.md`** — the existing epic-pipeline
  reviewer now runs the same anti-stub grep as `epicflow-reviewer`'s
  CHK-1, respecting the `.pi/project/conventions.md` allowlist. Any
  unallowlisted stub in a feature diff blocks APPROVE. Soft-warn only
  in repos without `.pi/project/` (no opt-in, no enforcement).

### Packaging

- **`package.json`** — `templates/**/*` added to the `files` glob so
  the npm tarball ships the brain templates. Version bumped to
  `0.13.0-dev`. Postinstall needed no changes — it already auto-
  discovers all `agents/*.md` (L-050) and `pi.skills` / `pi.prompts`
  resource paths cover the new skill + 4 prompts automatically.

### Why this matters

Decisions made on Tuesday no longer evaporate on Wednesday. Out-of-
scope items get logged the moment the user says "let's not do that
now" — not forgotten when the session ends. Pi reads its own session
history before answering, so it stops re-asking the same questions.
Every session has a stated goal that pi defends against drift. Stubs
are refused by default. Substantive work is delegated to specialized
personas so the main session context stays focused on stewardship,
not implementation details.

See the **"Project memory"** section in the README for the user-facing
flow and the [v0.13.0 plan](PLAN-v0.13.0.md) for the full design rationale.

## [0.12.0-dev] — in progress

**Native Windows support via PowerShell.** Phased rollout; see [`PLAN-v0.12.0.md`](PLAN-v0.12.0.md) for full plan + parity rules.

### Phase 3 — epic lifecycle + Python extraction

- **`skills/epic-feature-workflow/lib/validate_decomposition.py`** (698 lines) — extracted from the 685-line Python heredoc that lived inside `scripts/pi-epic-validate-decomposition`. Both bash and PowerShell siblings now invoke it: `python3 "$skill/lib/validate_decomposition.py" "$decomp" "$repo" "$epic_cfg"`. Single source of truth for validation behaviour. Bash sibling shrank from 880 → 199 lines. Linux smoke 29/29 green after extraction.
- **`scripts-win/pi-epic-validate-decomposition.ps1`** (130 lines) — thin wrapper around the extracted lib + inline L-046 toolchain-check gate (small enough to inline; reads `required_toolchains` and `toolchain_manager` from epic-config.yaml).
- **`scripts-win/pi-epic-complete.ps1`** (484 lines) — full PowerShell port. All gates preserved: E2E (with `Start-Process` replacing bash `&` + `trap`, polling `ready_check` via `cmd.exe /c`, halt-h11 file on timeout or non-zero exit), **L-043 epic-review gate** (refuses to archive without an APPROVE_EPIC verdict in `epic-review.md`), **L-042 extension guardrails** (warns at ≥1 extension, hard-halts at ≥30% growth without recorded decomposition lesson), `git rebase` onto default branch, full test suite (`Get-DetectedTestCmd2` covers Node/.NET/Python/Go/Rust), deviations → lessons-candidate.md distillation, push + PR via `gh pr create` (gracefully skips on missing `origin` per L-052), archive to `.pi/epics/done/` via `git mv`, STATE.md reset, `--contribute-lesson L-XYZ` extraction mode.
- **`scripts-win/pi-epic-extend.ps1`** (270 lines) — full port. Locates epic in active or archived path, refuses merged epics, un-archives via `git mv`, records `original_feature_count` snapshot for L-042 growth check, flips meta.yaml status → in-progress, appends extension entry + design.md `## Extension - YYYY-MM-DD: <title>` section (with `--design FILE` body or editable stub), STATE.md update, run-log entry, single squash commit on epic branch.
- **`scripts-win/pi-epicflow-doctor.ps1`** updated — required scripts list expanded to include `pi-epic-next-feature` + `pi-epic-extend`; documented `pi-epic-status` as a known v0.13 gap.

### Phase 3 dogfood (validated on actual Windows host)

Fresh repo: `git init -b main` → `pi-epic-init p3v2` → install `decomposition.yaml` with `estimated_hours: 2` (required field caught by the validator) → `pi-epic-validate-decomposition` exits 0 → `pi-feature-start F01` → worker writes file + worker-report.md → `pi-feature-complete F01` → `pi-epic-next-feature` returns DONE → write APPROVE_EPIC `epic-review.md` (L-043 gate satisfied) → `pi-epic-complete --no-pr` archives epic to `.pi/epics/done/0001-p3v2/`, distills `lessons-candidate.md`, appends to `~/.pi/epicflow/user-lessons.md`, resets STATE.md, exit 0 → `pi-epic-extend 0001-p3v2 --rationale "..." --title "..."` un-archives, records `original_feature_count=1`, appends `## Extension - 2026-05-24: Verification phase` to design.md, writes new run-log entry, single `chore(epic): extend 0001-p3v2 #1 - Verification phase` commit on epic branch, exit 0. All run-log.jsonl entries valid JSON.

### Phase 3 bugs found + fixed during dogfood

1. **`Get-FileContentLF $f -split "\n"` parser-precedence bug.** PowerShell parsed `-split` as a parameter to the function, not the operator. Fixed by wrapping the function call in parens. Caught in `pi-epic-complete.ps1` and `pi-epic-extend.ps1`.
2. **`Add-UserLessonsFromCandidate -CandidatePath` parameter mismatch.** The function in `_common.ps1` declares `-Candidate` (no `Path` suffix). Renamed call site to match.
3. **`git fetch --quiet origin $def 2>$null | Out-Null` didn't suppress stderr** because `2>$null` only catches PowerShell errors, not native stderr. Switched to `2>&1 | Out-Null`.
4. **PowerShell drops trailing empty-string arguments to native commands.** `pi-epic-extend`'s inline Python expected 6 args but got 5 when `--design` was omitted. Fixed in Python: pad `sys.argv[1:]` with empty strings before unpacking. Same pattern needed for any future PS → Python heredoc with optional trailing args.

### Not yet ported (Phase 4 + v0.13)

`pi-epic-status` is the only remaining script. Bash sibling is 92 lines of dispatcher + 1016 lines of lib files (rendering, ANSI, parsing, JSON emission, DAG state machine). Deferred to v0.13 so the rendering layer can be extracted to a shared Python module (same pattern as `validate_decomposition.py`) rather than translated by hand. Doctor warns when missing. `pi-epic-next-feature` provides the minimum-viable status check (DONE / HALT / next ready id) in the interim. **All write/lifecycle commands ship on Windows as of v0.12.0.**

### Phase 2 — feature loop

- **`pi-feature-start.ps1`** (445 lines) — full PowerShell port of `pi-feature-start`. Same CLI surface, same exit codes, same commit messages, same L-019/L-023 scaffold-first-branch-second ordering. **Concurrency safety**: replaces bash `flock` with `[System.Threading.Mutex]` keyed off a SHA1 of `git-common-dir` (16-char hex → mutex name). Same 60s wait, same "another invocation holding the lock" message. Worktree path computed via `Resolve-Path` + `Join-Path` (no shell expansion).
- **`pi-feature-complete.ps1`** (484 lines) — full PowerShell port of `pi-feature-complete`. All 4 gates ported: test command (with `Get-DetectedTestCmd` covering Node/.NET/Python/Go/Rust), completion-evidence (`worker-report.md` `## Completion evidence` section), v0.10/L-056 declared-deliverables, parallel-merge **H6 conflict classifier** (in-scope vs out-of-scope based on `scope_files` declarations, with deviations.md auto-append). Test command invocation goes through `cmd.exe /c $testCmd` so `npm test`, `pytest`, etc. work without quoting hell. Squash commit message built in a temp file, `--allow-empty` for spike features (L-023).
- **`pi-epic-next-feature.ps1`** (170 lines) — full PowerShell port. State machine identical to bash: halted → HALT, all-merged → DONE, in-progress → resume that one first, otherwise pick lowest-id ready (deterministic). `--batch N` mode preserved with L-049 scope-overlap pre-check.
- **`Add-RunLogEntry` / `ConvertTo-JsonString` (in `_common.ps1`)** — fixed a real bug found during dogfood: Windows paths embedded directly into JSON via string interpolation produce invalid JSON (`\U`, `\s`, etc. are not valid JSON escape sequences). Added `ConvertTo-JsonString` (RFC 8259 escaping: `\`, `"`, control chars → `\uXXXX`) and wired it into `pi-feature-start.ps1`'s worktree-path embedding. **Bash sibling has the same latent bug on Windows paths** — it just doesn't manifest in normal Linux/macOS use. Tracked as Phase 4 follow-up.
- **`Get-FeatureDeclaredDeliverables`** — stub from Phase 1 replaced with full inline-Python implementation matching `_common.sh::feature_declared_deliverables` output format (`e2e:<path>`, `mock:<path>`, `doc:<path>`, `changelog:CHANGELOG.md`). Will move to shared `lib/yaml_helpers.py` in Phase 3a.

### Phase 2 dogfood (validated on actual Windows host via WSL → powershell.exe)

Clean Windows repo: `git init -b main` → `pi-epic-init p2full` → install `decomposition.yaml` (F01 + F02 with `F02 depends_on: [F01]`) → `pi-epic-next-feature` returns `F01` → `pi-feature-start F01` (worktree + branch + scaffold) → worker writes `hello.txt` in worktree + `worker-report.md` with `## Completion evidence` in main repo → `pi-feature-complete F01` (test command auto-detected, evidence check passes, squash-merge as `feat(F01)`, branch + worktree removed, folder archived to `features/done/`, run-log entry written) → `pi-epic-next-feature` returns `F02` (dependency now satisfied) → same loop for F02 → `pi-epic-next-feature` returns `DONE`. All 5 `run-log.jsonl` entries are valid JSON (verified via `ConvertFrom-Json`). Final epic log has the exact 10-commit sequence parity with bash: scaffold → pending-edits → scaffold-F01 → feat(F01) → archive-F01 → scaffold-F02 → feat(F02) → archive-F02 plus the initial 2 setup commits.

### Phase 1 — install + foundation

- **`install/postinstall.mjs`** now branches on `process.platform`. POSIX: symlinks bash scripts from `skills/epic-feature-workflow/scripts/` into `BIN_DST` (unchanged). Windows: writes `pi-<name>.cmd` shims into `BIN_DST` that exec the PowerShell sibling with `-NoProfile -ExecutionPolicy Bypass -File <abs-path> %*` — so corporate Restricted policies are not a blocker. Shims carry a `pi-epicflow-shim v1` marker line so subsequent installs only overwrite our own files.
- **`skills/epic-feature-workflow/scripts-win/_common.ps1`** — full PowerShell port of `_common.sh`. Public surface: `Get-RepoRoot`, `Get-SkillRoot`, `Get-DefaultBranch`, `Get-ActiveEpicId`, `Get-ActiveEpicDir`, `Get-ActiveFeatureId`, `Get-NextEpicId`, `ConvertTo-Slug`, `Get-YamlValue`, `Update-YamlUpdated`, `Set-YamlValue`, `Get-FeatureDeclaredDeliverables` (stub until Phase 3a Python extraction), `Add-RunLogEntry`, `Assert-NotDefaultBranch`, `Write-Log`, `Get-UserLessonsPath`, `Initialize-UserLessons`, `Add-UserLessonsFromCandidate`, `Get-PiEpicflowClone`, `Get-PiEpicflowAgeDays`, `Get-PiEpicflowVersion`. PowerShell-only helpers: `Get-PythonExe` (auto-skips the Windows Store stub), `Get-FileContentLF`, `Set-FileContentLF`, `Add-FileLineLF`, `Ensure-FileLine` — the last four enforce LF line endings everywhere we write to disk (parity rule #6 — keeps `.pi/` diffs noise-free across platforms).
- **`skills/epic-feature-workflow/scripts-win/pi-epic-init.ps1`** — full PowerShell port of `pi-epic-init`. Same CLI surface (`--from`, `--title`, `--base`, `--no-planner`), same flag parsing rules (bash-style `--flag value`), same exit codes, same commit messages (`chore: ignore pi runtime state …`, `chore(epic): scaffold <id>`), same `.gitignore` patterns including the L-012 / L-026 / L-040 belts, same STATE.md format, same `Next steps (in pi)` footer pointing at `/epic-design`. Detects dedicated-epic-worktree mode the same way.
- **`skills/epic-feature-workflow/scripts-win/pi-epicflow-doctor.ps1`** — read-only health report. Mirrors the bash doctor's runtime / skills / user-lessons / active-epic / tools sections, plus a new **Windows-specific** block: PowerShell version (≥ 5.1 required), effective `ExecutionPolicy` (Bypass via .cmd shim makes Restricted policy non-blocking — informational only), `git config core.longpaths`, `git config core.symlinks`, Python detection (with the Windows Store stub auto-skipped). Bash availability is informational only — not required on Windows.
- **`PLAN-v0.12.0.md`** added — four-phase plan with explicit dogfood checkpoints, decisions log, parity rules, risks. Phase 2 (feature loop), Phase 3 (epic lifecycle + Python helper extraction), Phase 4 (contract tests + Windows CI) tracked there.
- **README compatibility section** rewritten. New "Windows-specific setup" subsection covers Git for Windows, Python install (avoid Store stub), `core.longpaths`, and the doctor verification step. Old "WSL only" line removed.

### Not yet ported (deferred to v0.13)

As of v0.12.0 Phase 3, the only remaining script is **`pi-epic-status`** (read-only status report; bash sibling is 92 lines of dispatcher + 1016 lines of lib files). Deferred so its rendering layer can be extracted to a shared Python module first (same pattern as `validate_decomposition.py`) rather than translated by hand. The doctor warns when it's missing. `pi-epic-next-feature` covers the minimum-viable status check (DONE / HALT / next ready id) in the interim.

**All write/lifecycle commands ship natively on Windows.** Contract tests + Windows CI runner land in Phase 4.

## [0.11.0] — 2026-05-20

**Adds `/epic-design` and `/epic-review-design` slash prompts so pi can co-author `design.md` in the right place — closing the gap between `pi-epic-init` and `/epic-decompose`.** Previously a fresh pi chat had no idea where `design.md` lived or that pi-epicflow was even in the room; the user had to write the design out-of-band and copy it in. Lean v1: solve the path/context problem with light structure, keep the heavyweight unbiased-critic review as a separate opt-in pass.

### Added

- **`/epic-design` prompt** (`prompts/epic-design.md`). Phase 1a ingests existing artifacts (BRD/PRD/tickets/transcripts/`--from=<path>` args / `pi-epic-init --from` seeding) BEFORE asking questions; produces a sourced "Understanding so far" snapshot the user can audit for misreads; iterates gap questions with recommended defaults per AGENTS.md §2; gates writing on a Phase-4 "gist for approval" step so pi can't silently dump 500 lines into `design.md`; then writes the canonical template structure to `.pi/epics/<id>/design.md` and commits on the epic branch as `docs(epic): draft design for <id>`. Saves a reusable snapshot to `.pi/epics/<id>/.design-snapshot.md` (gitignored) for the critic pass.
- **`/epic-review-design` prompt** (`prompts/epic-review-design.md`). Opt-in heavyweight pass. Spawns the `epic-design-critic` sub-agent in a fresh context, summarizes findings by severity (`must-fix` / `should-fix` / `nice-to-have`), walks each one with the user (`apply` / `discuss` / `skip` / `reject`), applies approved edits surgically with the `edit` tool, appends a decisions-log entry summarizing the pass, and commits as `docs(epic): incorporate design review for <id>`. Supports `--auto-apply-must-fix` for users who trust the critic on hard findings. Halts on `BLOCK` verdict (fundamental redo, not editable).
- **`epic-design-critic` agent** (`agents/epic-design-critic.md`). Fresh-context, read-only critic with persona "senior staff engineer who assumes the author is wrong until proven right." Attacks on two axes: architectural challenge (10× load, threat model, failure modes, hidden coupling, observability, 2-year maintenance, onboarding cost, dismissed alternatives) and an explicit 11-point quality-attribute checklist (correctness, performance, security, reliability, observability, usability/DX, maintainability, extensibility, testability, migration, cost). Silent dimensions count as findings; only explicit N/A with a reason passes. Carries the same anti-sycophancy credibility clause as `feature-reviewer` (name a concrete weakness OR list three specifics verified clean). Bundled under `agents/` so pi-epicflow owns the persona quality end-to-end — not delegated to pi-subagents' generic built-ins.

### Changed

- **`pi-epic-init` footer** now points the user at `/epic-design` (→ optional `/epic-review-design`) → `/epic-decompose` → `/epic-run-auto` instead of the prior "edit `design.md` by hand" hint. Editing by hand still works — the prompt detects seeded / hand-edited content and treats it as a first-class artifact.
- **README quickstart** and **`SKILL.md` lifecycle diagram** updated to show the new design + review steps in the canonical pi-driven flow.

### Deferred (out of scope for v0.11; promote on real-usage signal)

- Hard Phase-1 checklist exit gate (currently checklist is a reference, not a gate; pi uses judgment).
- Parallel oracle + reviewer in the review pass (single combined critic for now; split later if real use shows distinct value).
- `PI_EPICFLOW_REVIEW_MODEL` env for opt-in different-model review.
- Loop-until-clean review iteration (single pass per `/epic-review-design` invocation; user can re-run).
- Dedicated `epic-design-scout` agent for large-repo recon (pi scouts itself; ad-hoc delegate via the global AGENTS.md §6 trigger #1 when truly needed).

### Migration notes

- No file-format changes. Existing epics with hand-written `design.md` keep working; `/epic-design` will detect the already-drafted state and offer to refine instead of replace.
- `.gitignore` gets two new patterns the first time `/epic-design` or `/epic-review-design` runs: `.pi/epics/*/.design-snapshot.md` and `.pi/epics/*/.design-review-*.md`. These are workspace state, not canonical epic record.
- The new prompts and agent are auto-installed by `install/postinstall.mjs` on `pi install pi-epicflow` / on package update — no manual steps required.

## [0.10.1] — 2026-05-18

**Hotfix release. Three real-world friction bugs surfaced by stress-testing v0.10.0's parallel-execution + real-Playwright/Vite E2E claims on a fresh fixture.** The bugs existed before v0.10 (parallel-safety since v0.6, npm-test autodetect since v0.6) but had never been exercised because every prior dogfood epic ran serial + skipped autodetection. v0.11 backlog item "stress test parallel + E2E on real app" was pulled forward; results below.

### Fixed

- **`pi-feature-start` is now parallel-safe (HIGH).** Multiple concurrent `pi-feature-start <fid>` invocations on the same repo previously raced on `.git/index.lock` and silently left half-applied scaffolds (some worktrees not created, some feature folders uncommitted). Root cause: the script does `git add` + `git commit` on the epic branch with no cross-process synchronization. Fix: acquire an exclusive `flock` on `<git-common-dir>/.pi-feature-start.lock` for the duration of the script. Concurrent calls now serialize cleanly (`time` staircase ~0.4s → 0.8s → 1.2s per call). If `flock` is unavailable on the platform, the script falls through to the prior behavior — there is no hard dependency. Lock file lives under `.git/` so it never shows up as a dirty-tree false positive.
- **`pi-feature-start` and `pi-feature-complete` now print real `--help` / `-h` text (LOW).** Previously these flags were treated as feature IDs and produced `ERROR: feature --help not found in decomposition.yaml`. Same UX shape as the v0.10.x backlog `pi-epic-init --help` bug; fixed at the same time.
- **`pi-feature-complete` and `pi-epic-complete` no longer fail when `package.json` exists but has no `test` script (HIGH).** Real-world friction: many Vite / Next / CRA projects have `package.json` but ship `test:unit` / `test:e2e` instead of a top-level `test` script. v0.10.0 emitted `npm test` from `detect_test_cmd`, npm errored with `Missing script: "test"`, and the feature/epic halted. Fix: `detect_test_cmd` now uses `node -e 'process.exit(scripts.test ? 0 : 1)'` to verify the script exists before emitting `npm test`. If no script exists and no `test_cmd` is configured in `epic-config.yaml`, the test phase is silently skipped (operator opt-in via `test_cmd: "npm run test:unit"` or similar). v0.9-era behavior of detecting Cargo/Go/Python toolchains is unchanged.

### Stress-test report (informs v0.11)

Fixture: fresh Vite 5 + React 18 + TypeScript app at `/tmp/v010-stress` with 3 truly independent features (`products` / `search` / `footer` — no shared aggregator beyond pre-stubbed `App.tsx` to avoid L-053 serialization).

**Verified working end-to-end:**
- `parallel.max_workers: 3` decomposition validates clean.
- After v0.10.1 fix #3, 3 parallel `pi-feature-start` calls serialize cleanly and all worktrees are created.
- 3 concurrent `git commit`s across 3 separate worktrees — zero conflicts (the worktree pattern is the whole point and it holds).
- 3 concurrent `pi-feature-complete` invocations: 2 squash-merge cleanly; the third correctly hits H6 halt (parallel-merge collision) with the documented recovery instructions. **This is correct behavior, not a bug.**
- After rebase + retry, the third feature merges cleanly.
- **Real Vite dev server lifecycle works:** E2E gate starts `npm run dev -- --port 5180` in background, polls `curl -fs http://localhost:5180`, runs the real `run_cmd` against the live server, and `pkill -f 'vite.*5180'` from `shutdown_cmd` properly kills the vite worker child processes (a system-level kill of just the npm parent would leak children).
- **H11 halt path works with real vite:** intentional non-zero `run_cmd` produces `halt-h11-e2e-<UTC>.md` with command, exit code, output tail, and the `docs/recovery.md#r11-e2e-failure` link. Trap properly tears down vite even on the failure path (no leaked processes after halt).
- `e2e-report.json` produced on success with stats / suites array (Playwright-shaped subset).

**Did not exercise (deferred):**
- Real Playwright browser binaries — fixture host (Ubuntu 26.04) is not in Playwright's supported-OS list, so the run_cmd substituted a Node-based HTTP-fetch E2E that hits the live Vite dev server. The pi-epicflow mechanism (start → ready_check → run_cmd → shutdown_cmd → exit-code-shaped halt) was exercised against a real bound network port and a real dev-server-spawned process tree, which is the framework-relevant surface. v0.11 will exercise Playwright proper on a supported OS.
- `pi-feature-start` was always sequential in pre-v0.10.1 because nobody ever called it concurrently — the parallel feature was "parallel worker dispatch into already-created worktrees". This release makes concurrent invocation explicitly safe even though it wasn't the recommended workflow.

### Deferred (operator workaround available)

- **`yaml_get` mangles escaped quotes in complex `run_cmd` values.** Example: `run_cmd: "node -e \"process.exit(1)\""` round-trips with the inner `\"` becoming literal `\"` instead of `"`. Operator workaround: use single-quote outer + double-quote inner, or use a multi-line YAML block scalar (`run_cmd: |`). A proper YAML parser swap is on the v0.11 backlog (current parser is regex-based for zero-dependency reasons).

## [0.10.0] — 2026-05-18

**Deliverables-contract release. Second consecutive dogfood epic shipped by pi-epicflow on its own codebase.** Seven features merged, linear history, APPROVE_EPIC at the L-043 gate with 0 hard / 3 soft findings. Reframes decomposition from "code increments" to "the contract for everything the epic ships."

Link: `.pi/epics/done/0002-deliverables-contract-v10/epic-review.md` (committed in the release).

### Added

- **`decomposition.yaml` deliverable fields.** Four new optional per-feature fields: `e2e_scenarios`, `mock_fixtures`, `docs_updates`, `changelog_entry`. Plus `e2e_skip_reason` as an explicit suppression escape hatch. All optional; existing v0.7–v0.9 decompositions continue to validate unchanged.
- **`pi-epic-validate-decomposition` trigger→deliverable engine.** New `deliverables` validation phase. Triggers: AC text matching `\b(user|click|see|display|navigate|submit|GET /|POST /|PUT /|DELETE /)\b` requires `e2e_scenarios`; `scope_files` referencing known SDK names (`stripe`, `openai`, `anthropic`, `twilio`, `sendgrid`, `@aws-sdk`) requires `mock_fixtures`. Two layers of SDK detection: path substring + file-content read (first 100 lines). Off by default; flip on via `strict_deliverables: true` in `epic-config.yaml`. v0.11 will flip the default.
- **`pi-feature-complete` deliverables pre-merge check.** New phase after the completion-evidence gate. For every file declared in `e2e_scenarios` / `mock_fixtures` / `docs_updates`: file must exist in the worktree AND appear in `git diff <epic_base>..HEAD --name-only`. `changelog_entry: true` requires `CHANGELOG.md` modification. Refuses merge with actionable error: `Declared deliverable not produced: <path> (feature F<id>). Worker may have skipped this output; re-dispatch or update decomposition.yaml.`
- **`pi-epic-complete` E2E gate (opt-in).** New phase between feature-merge and the L-043 epic-review gate. Reads `epic-config.yaml` `e2e:` block; shells out to operator-declared `start_cmd` / `ready_check` / `run_cmd` / `shutdown_cmd` verbatim. Always tears down via bash trap (EXIT/INT/TERM). On failure: writes `halt-h11-e2e-<UTC-timestamp>.md` with command, exit code, last 50 lines of output, and recovery link. On success: writes `e2e-report.json` (copies `tests/e2e-report.json` if produced, else minimal stub). Off by default (`e2e.enabled: false`).
- **Halt code H11** for E2E gate failures. `docs/recovery.md#r11-e2e-failure` documents bisect recipe (most recent feature first), how to inspect `e2e-output.log`, how to resume after fix.
- **`_common.sh feature_declared_deliverables` helper.** Yaml-parses `decomposition.yaml` and emits the deliverable file list for a given feature ID, one per line with category prefix (`e2e:`, `mock:`, `docs:`, `changelog:`). Consumed by `pi-feature-complete` today; reusable by future tooling.
- **`prompts/epic-decompose.md` deliverables section.** Teaches the decomposer the new fields, the trigger rules, and provides two worked examples (Stripe checkout with all fields populated; pure refactor with `e2e_skip_reason`).
- **`agents/feature-worker.md` Declared deliverables section.** Workers treat declared deliverables as first-class scope; producing them is part of READY.
- **`agents/feature-reviewer.md` rubric items.** Mock honesty (soft — audit `mock_fixtures` against the real SDK contract for hallucinated/missing fields) and E2E selector quality (soft — flag fragile selectors, prefer `data-testid`/role/label).
- **`agents/feature-epic-reviewer.md` E2E coverage rate.** Reads `tests/e2e-report.json` when present; reports declared / passing / failing / skipped / missing per feature. Graceful no-op when absent.
- **`docs/v0.10-real-app-verification.md`.** F07 L-047 verification report. Fresh Vite+React+TypeScript fixture with a planted bug (`* 0.9` multiplier in `computeTotal()`) that passes unit tests but fails E2E. Validator + gate + halt + fix loop verified end-to-end.

### Lessons added (L-056, L-057, L-058)

See `skills/epic-feature-workflow/lessons.md` for canonical entries:

- **L-056:** decomposition is the contract for everything the epic ships, not just code increments. Generalizes L-044 one level up. Verified by F07: validator caught a real scope-assignment mistake before workers started.
- **L-057:** mocks are owned by the feature that imports the real dep, never authored at gate time. The worker who just wrote the calling code is the right entity to write the mock; gate-time mock authorship hides decomposition mistakes. Verified by F07.
- **L-058 (candidate):** content-based SDK detection catches transitive imports that path-based detection misses. Decomposers should keep the "primary SDK consumer" file in the feature that owns `mock_fixtures`.

### Honest deviations (logged in epic-review)

- **F03** worker subagent died mid-stream ("Anthropic stream ended before message_stop"); orchestrator completed the prompt-only edit inline. Logged as a pattern: for prompt-only features, orchestrator-direct completion is cheaper than re-dispatch when the worker crashes.
- **F07** used `vitest` + `@testing-library/react` instead of Playwright (avoids 200MB browser binary download). Used 2 features instead of 3 (both trigger rules exercised by 2). Substitutions logged; epic-reviewer flagged that browser-specific failure modes (port conflicts, install races) remain unverified — v0.11 backlog.
- **0 / 7** features had per-feature `review-report.md` persisted. Acceptable for self-dogfood on framework's own files; flagged as a process gap for users running their own epics.

### v0.11 forward backlog (from epic-review soft findings)

1. Add smoke phases 30-35 covering the deliverables surface.
2. Run F05's new mock-honesty + selector-quality rubrics on a real user epic before promoting them from soft to hard.
3. Playwright-specific real-app verification (browser binary install, port conflicts).
4. Persist `review-report.md` files for every feature; `pi-feature-complete` warns when absent.
5. Flip `strict_deliverables: true` as the template default (currently `false`).
6. Consider configurable `deliverable_rules:` in `epic-config.yaml` per-project (move SDK list out of hardcoded validator).

## [0.9.0] — 2026-05-18

**Observability release. First epic shipped by pi-epicflow on its own codebase (pure dogfood).** Five features merged on a linear epic branch, 0 hard findings at the L-043 gate, 3 soft findings — all decomposition-process lessons (L-053/L-054/L-055) that synthetic verification could not have surfaced.

Link: `.pi/epics/done/0001-observability-v09/epic-review.md` (committed in the release).

### Added

- **`pi-epic-status --json`** (schema v1, additive-forever). Seven top-level keys: `schema_version`, `epic`, `features` (with `started_at` / `duration_sec`), `batches` (with `wall_clock_sec` / `serial_sum_sec` / `speedup_ratio` / `theoretical_max` / `feature_ids[]`), `halts` (with `feature_id` / `halt_code` / `halt_file` / `recovery_anchor`), `ready_now`, `blocked_on_deps`. Consumable by external tooling, dashboards, CI.
- **Per-feature `started` + `duration` columns** in human `pi-epic-status` output. Reads timestamps from `run-log.jsonl`. Formatting: `<60s` → `Xs`, `60..3599s` → `MM:SS`, `>=3600s` → `H:MM:SS`. In-progress features show elapsed-since-start.
- **`── Recent batches ──` section** in human `pi-epic-status` output (rendered only when `parallel.max_workers > 1` and >=1 batch detected). Per-batch summary: feature ids, wall-clock, serial sum, speedup ratio, theoretical max. Batch detection: groups consecutive `feature-start` events within a 5-second window with no `feature-complete` between them.
- **`⚠ HALTS` section at the top of `pi-epic-status` output** when unresolved halts exist. Discovery: scans every feature dir under `.pi/epics/<id>/features/` for `halt-*.md` files with no sibling `resolved-halt-*.md`. Each entry includes the halt code (H1..H10), short description, file path, and a `docs/recovery.md#rN-*` recovery anchor.
- **`pi-epicflow-doctor` integration:** new `── Recent epic activity ──` section that calls `pi-epic-status --json` and surfaces (a) unresolved halt count + summary, (b) most recent batch, (c) any feature stuck in-progress >30 minutes. Rendered only when invoked inside an epic worktree; otherwise the existing doctor output is preserved byte-for-byte.
- **Smoke phases 25–29** for the new observability surface (`install/smoke-test.sh` is now 29/29). One phase per AC family: --json schema, per-feature timing, batch detection, halt visibility, doctor integration.
- **Modularized `pi-epic-status`** (299-line monolith → 90-line dispatcher + 6 `skills/epic-feature-workflow/lib/*.sh` sub-files, one per concern). Behavior preserved byte-for-byte against the v0.8.1 baseline (F01 AC 3). Enables future per-concern parallel work — see L-053 for the caveat about shared-aggregator files.

### Fixed

- **`_common.sh:pi_epicflow_age_days()` failed silently from any git worktree** (latent since v0.6.0). Used `[[ -d "$clone/.git" ]]` which is false in worktrees where `.git` is a *file* (a `gitdir:` pointer), not a directory. Fixed to `[[ -e "$clone/.git" ]]`. Symptom was the `clone age: ?` line in `pi-epicflow-doctor` whenever run from a worktree. See L-055 for the full bug shape + audit recommendation.

### Lessons added (L-053, L-054, L-055)

See `skills/epic-feature-workflow/lessons.md` for the canonical entries. Distilled from the v0.9.0 epic deviations log + the epic-review-report:

- **L-053:** file-level scope-conflict pre-checks (L-049) serialize features that share a contract file even when their textual edits don't overlap. Decomposition heuristic: when N parallel-eligible features need to fill in shards of a shared aggregator file, the root feature should split the aggregator at decomposition time — siblings' `scope_files` should not contain the aggregator, only the per-concern shards. Confirmed by the v0.9.0 dogfood, where F02/F03/F04 ran serially despite a deliberately parallel-shaped DAG.
- **L-054:** `feature-worker` can silently truncate `worker-report.md` to 0 bytes when its subagent session ends mid-flight. `pi-feature-complete`'s contract check caught the empty file incidentally but with a misleading error message. Mitigations: workers should write the report incrementally (`state: IN_PROGRESS` first, then update); `pi-feature-complete` should differentiate "0-byte" (worker crashed) from "non-empty missing section" (worker skipped section). Orchestrator pattern: reconstruct the report from worktree inspection when this happens, log a deviation, proceed.
- **L-055:** git worktrees expose latent `.git`-file-vs-directory bugs. Audit rule: any check involving `.git` must use `-e` (exists), not `-d` (directory). Pair with a smoke phase that runs `pi-epic-*` scripts from a worktree.

### Dogfood notes (real findings, all expected)

- L-049's file-level pre-check correctly refused parallel dispatch on every batch attempt (F02/F03/F04 all needed to edit `pi-epic-status-json.sh`). The epic ran fully serially — the safety property is more conservative than the actual conflict surface. See L-053.
- F03 and F04 each made a 1–2-line out-of-scope edit to the dispatcher (sourcing + calling the lib files F01 had created as stubs but not wired). F01's AC should have specified the dispatcher wiring as a checkable criterion — captured as a soft finding in the epic-review and a forward note for future root-modularize features.
- The dogfood is now self-observing: `pi-epic-status` against the v0.9.0 epic renders its own feature timings via the very columns F02 added.

## [0.8.1] — 2026-05-17

**Hotfix release from v0.8.0 real-app verification.** Drove the v0.8.0
parallel dispatcher end-to-end against a Vite+React TODO sample with
three real `feature-worker` subagents running concurrently (2.87x
empirical speedup vs theoretical 3.00x). The dispatcher itself worked
as designed; the verification surfaced three issues, one
release-blocking. See `docs/v0.8.0-real-app-verification.md` for the
full report.

### Fixed

- **🚨 CRITICAL: `postinstall.mjs` did not install
  `feature-epic-reviewer.md`** (L-050). The hardcoded agent-list in
  postinstall was last updated in v0.6, and never picked up the
  `feature-epic-reviewer` agent that v0.7.0 introduced for the L-043
  epic-review gate. Every user who ran `pi install pi-epicflow` and
  upgraded to any release between v0.7.0 and v0.8.0 (inclusive) shipped
  with a broken epic-review gate — `/epic-run-auto` would error with
  `Unknown agent: feature-epic-reviewer` at the gate, and the only
  escape was `pi-epic-complete --skip-epic-review` which negates the
  entire L-043 feature. Fix: postinstall now derives the agent list
  from `readdirSync(AGENTS_SRC)` so adding a new agent never requires
  touching `postinstall.mjs` again. New smoke phase 24 asserts every
  `.md` in `agents/` lands in the install destination, specifically
  including `feature-epic-reviewer.md` (regression guard).

- **`pi-epic-complete` failed non-gracefully when there is no `origin`
  remote** (L-052). After all the local work succeeded (squash-merge
  tally, epic-review gate, archive rename, lessons distillation), the
  final `git push --set-upstream origin epic/<slug>` would error out on
  sample/scratch repos or offline development. The epic stayed in
  `state: in-progress` even though every local finalization succeeded.
  Fix: wrap the push step in a `git remote get-url origin` guard that
  warns + skips with a copy-paste-able `git remote add` recipe if no
  origin is configured. Local archive succeeds either way.

### Added

- **L-050, L-051, L-052** lessons codifying the discoveries (now 52
  total). L-051 specifically: workers should `contact_supervisor`
  before running dependency installs that touch shared metadata files
  (`package-lock.json`, `Cargo.lock`, etc.), not log a deviation after
  the fact — under parallel mode this pattern is a real H6 risk.

- **`docs/v0.8.0-real-app-verification.md`** — the verification report
  documenting what worked (2.87x speedup, linear history under parallel
  execution, all v0.7 gates honored) and what didn't (the three
  findings above).

- **Smoke phase 24 (regression guard for L-050).** Runs postinstall
  against a temp dir and asserts every `agents/*.md` in the repo lands
  at the destination. The check `[ -f $DEST/feature-epic-reviewer.md ]`
  is called out explicitly with a comment naming the regression.

### Real-app verification (per L-047)

The v0.8.0 release notes promised real-app verification of the
`/epic-run-auto.md` parallel branch in a follow-up; v0.8.1 includes
that verification. Sample: `/tmp/pe-v8-realapp` (Vite+React TODO
scaffold) with a 5-feature parallel-friendly DAG:

- F01 (root: types + id helper) ran serially.
- F02 + F03 + F04 (disjoint helpers) ran as a **real parallel batch**
  via three concurrent `feature-worker` subagents. Wall-clock measured
  from session logs:
  - F02: 75.0s
  - F03: 84.3s
  - F04: 85.3s
  - Batch wall-clock total: **85.3s** vs **244.7s serial sum** =
    **2.87x speedup**
- F05 (integration, touches App.tsx + new TodoList component) ran
  serially against the merged batch. Validated L-045's integration-
  shell check (App.tsx in scope_files).
- `feature-epic-reviewer` was invoked at `pi-epic-complete` time per
  L-043 and emitted `APPROVE_EPIC` with 2 soft findings (stale comment
  in main.tsx, no per-feature reviewer artifacts for the verification
  run — expected; verification deliberately skipped per-feature
  reviewers to control token budget).

Evidence preserved in `.pi/epics/0001-parallel-todo/run-log.jsonl`:
three `feature-start` events at `01:25:21Z`/`01:25:21Z`/`01:25:22Z`,
three `feature-complete` events at `01:27:58Z`. The serial-merge
invariant (one `pi-feature-complete` at a time) is visible in the
final `git log --oneline` on `epic/parallel-todo` — four sequential
squash commits, zero merge commits, linear history despite three
concurrent workers.

### Known limitations carrying forward

- The v0.8 verification did not exercise an H6 collision from a worker
  going out-of-scope into a sibling's territory (smoke covers this
  with a forced collision; the real run avoided it because the
  orchestrator pre-staged `npm install` between F01 and the parallel
  batch).
- Did not exercise a worker-halt mid-batch (one of 3 workers halts
  while the other 2 continue).
- Did not stress `max_workers > 3` for an optimal-value signal.

These are good v0.9+ targets: heavier real-app epics will exercise
them naturally.

## [0.8.0] — 2026-05-17

**Parallel feature dispatcher.** First concurrency feature in pi-epicflow.
Operators opt in via `epic-config.yaml` → `parallel.max_workers > 1`;
when enabled, the orchestrator dispatches up to N features concurrently
when the DAG permits AND their declared `scope_files` do not overlap.
Serial merge property preserved: only one `pi-feature-complete` runs at
a time, so the epic branch remains a linear sequence of squash commits.

The design is in `docs/sketch-parallel.md` (authored during the v0.6.0
retrospective, deferred to v0.7+, now implemented). Two lessons codify
the design choices that fell out of building it:

- **L-048**: in-process orchestrator queue beats IPC for single-host
  parallelism. We started with a `flock(2)` design and ended without
  any locks at all — coordination lives in the orchestrator's loop
  variables. Falls out of "one trusted writer + many subagent workers."
- **L-049**: conflict pre-check from declared `scope_files` is the
  cheap mechanical guard. The data is already in the decomposition;
  the check is O(N²) on tiny N; false positives serialize when they
  could've paralleled (low cost); false negatives reduce to an
  existing rule (workers must declare their scope honestly, L-006).

### Added

- **`epic-config.yaml` new field: `parallel:` block.**
  ```yaml
  parallel:
    max_workers: 1          # default = serial = current behavior
    conflict_precheck: true # set false to disable the L-049 hard guard
  ```
  Default `max_workers: 1` is identical-to-v0.7 behavior; the template
  ships with the block + commented docs so operators discover the
  capability when they edit epic-config.yaml.

- **`pi-epic-next-feature --batch N`.** Returns up to N ready features
  (one ID per line), applying a hard conflict pre-check that admits
  no two features whose declared `scope_files` overlap into the same
  batch. Greedy admission in DAG-topological order. Default behavior
  (no `--batch`) unchanged — returns a single feature ID per the v0.7
  contract.

- **`pi-feature-complete` H6 halt with classification.** The existing
  squash-merge-conflict path is now tagged with halt code `H6` in
  `meta.yaml`, prints a structured stderr block, and appends a
  classified entry to `deviations.md`. Conflicts on files inside the
  failing feature's declared `scope_files` are tagged
  *In-scope conflicts (decomposition-feedback)*; conflicts on files
  outside scope are tagged *Out-of-scope conflicts (worker-discipline)*.
  Same path triggers for serial-mode conflicts too; the v0.8.0 work is
  the tagging + classification + deviations.md entry, not the
  conflict detection itself.

- **`prompts/epic-run-auto.md` parallel-mode subsection.**
  Operator-facing orchestration prompt gains a new section ("Parallel
  mode (v0.8.0 — max_workers > 1)") with an explicit step-by-step
  loop: P0 budget check, P1 admit workers, P2 await completion, P3
  drain merge queue, P4 exit conditions. Halt-isolation table covers
  H1/H2/H4/H5/H6/H7/H9/H10. Serial loop unchanged — the parallel
  branch is additive and gated on `max_workers > 1`.

- **R9 recovery recipe in `docs/recovery.md`.** Step-by-step for
  both in-scope and out-of-scope H6 cases, plus a "preventing H6 next
  time" subsection covering when to declare shared files in both
  features' `scope_files` (let the pre-check serialize them) vs.
  when to drop to `max_workers: 1` (heavy shared-config epics).

- **Smoke phases 21–23** — 9 new pass cases:
  - phase 21 (4 cases): `--batch` returns correct ready set; pre-check
    drops overlapping features; admits disjoint features; respects
    DAG (no premature admission)
  - phase 22 (3 cases): `--batch` flag validation (rejects non-numeric,
    rejects zero, accepts 1 as no-op)
  - phase 23 (1 case): template ships `parallel.max_workers: 1`

- **L-048 + L-049 lessons.** Detailed write-ups in
  `skills/epic-feature-workflow/lessons.md`.

- **Design.md v0.8 callout.** Brief addendum to the v0.7 shift-left
  section noting v0.8's "serial merge queue preserves linear history
  under parallel execution" property.

- **`docs/sketch-parallel.md` IMPLEMENTED banner.** Sketch kept as
  historical record; banner cites v0.8.0 and notes which sketch
  choices were taken as-is and which were revised.

### Real-app verification (per L-047)

Drove the parallel dispatcher's script-level surfaces against
`/tmp/pe-sample-todo-v8`, a Vite+React skeleton with a deliberate
parallel-friendly DAG (1 root → 3 disjoint helpers → 1 integrator).
Verified:
  - `pi-epic-next-feature --batch 3` returns F02+F03+F04 concurrently
    after F01 merges
  - drops down to F03+F04 when F02 also merges (DAG-aware admission)
  - returns F05 alone when only F05 remains ready
  - returns `DONE` when all merge
  - `pi-feature-complete` on a forced out-of-scope `package.json`
    conflict produces the H6 halt with correct *Out-of-scope conflicts
    (worker-discipline)* classification, and the deviations.md entry
    is structurally correct.

The `/epic-run-auto.md` parallel branch itself is not exercised by
automated smoke (it requires real subagent invocations); operators
verifying this release should drive a 4-feature parallel-friendly epic
through `/epic-run-auto` with `parallel.max_workers: 2` and confirm
from `run-log.jsonl` timestamps that feature workers ran concurrently.

### Migration notes

- Existing epics: no action required. `max_workers: 1` default is
  identical to v0.7 behavior. Operators who want to try parallel
  edit `epic-config.yaml` and bump `max_workers`.
- Existing decompositions: scope_files declarations should be
  *complete* (declare every file the worker will touch) for the
  L-049 pre-check to be effective. If your scope_files are aspirational
  ("new file at path X") and the worker also touches shared files,
  consider declaring those shared files explicitly so the pre-check
  can serialize them.
- v0.7 features ship unchanged: feature-epic-reviewer gate (L-043),
  integration-shell validator (L-045/L-047), required_toolchain
  pre-flight (L-046).

### Known limitations (intentional v0.8.0 scope)

- No auto-rebase on conflict. H6 halts the feature; operator resolves.
  Rationale in `docs/sketch-parallel.md` and L-049.
- No cross-feature work stealing. Each subagent context dies at
  feature boundaries.
- No multi-machine dispatch. Single-host parallelism only.
- `max_workers: auto` not supported — the value must be an explicit
  integer in `epic-config.yaml`.
- Smoke does not exercise the `/epic-run-auto.md` parallel branch
  end-to-end (would require running real subagents). Operator
  verification covers that path.

## [0.7.3] — 2026-05-16

**Heuristic hotfix found by real-app verification (L-047).** v0.7.1
shipped the L-045 integration-shell validator with a 4-case smoke
fixture. Smoke covered the schema; it did not cover the distribution
of real-world React wiring patterns. Driving the validator against a
real Vite+React app (a TODO slice under `/tmp/pe-sample-todo`) surfaced
two compounding bugs that synthetic fixtures could not have caught.

### Fixed

- **`App.{tsx,jsx,ts,js}` / `Routes.tsx` / `AppRouter.tsx` / `router.tsx`
  added to the `ts_react` shell list.** Before this fix, the canonical
  React wiring target (`src/App.tsx`) did not satisfy the L-045 gate,
  meaning an operator who *correctly* added `App.tsx` to scope_files
  was *still* told the gate failed. The validator effectively pointed
  operators at the wrong files.

- **Shell list reordered so wiring targets surface first in hints.**
  The hint shows the first 3 entries per detected language. Before
  this fix, that meant `[vite.config.ts, vite.config.js, vite.config.mjs]`
  — generic config files that are almost never the right answer for
  "wire X into the host app". Now the operator-facing hint surfaces
  `App.tsx, App.jsx, main.tsx, Routes.tsx, AppRouter.tsx, ...` first.

### Added

- **L-047 lesson** — *heuristics must be verified on a real app, not
  just smoke fixtures*. Codifies the pattern: every heuristic-shaped
  feature gets at least one verification pass on a realistic codebase
  before release. Smoke ensures the code *runs*; real-app verification
  ensures the code *helps*.

- **Smoke regression cases for L-047** (two new cases inside the
  L-045 phase): App.tsx in scope_files now satisfies the gate; the
  hint surfaces App.tsx when scope_files lacks any shell.

### Migration notes

- Zero migration: this is a pure expansion of the shell-acceptance
  set + a hint reordering. Decompositions that previously passed
  still pass; decompositions that correctly cited App.tsx will now
  pass where before they were rejected.

## [0.7.2] — 2026-05-15

**`required_toolchain` pre-flight (L-046).** Detect + suggest, NOT
detect + auto-install. Closes the failure mode where an epic gets
halfway through F03 before discovering the host machine doesn't have
the SDK the work needs. Auto-install was deliberately rejected (see
L-046) on security, portability, state-pollution, and concern-boundary
grounds; auto-install can return as an opt-in flag with an installer
allow-list only after outside-user evidence demands it.

### Added

- **`epic-config.yaml` new field: `required_toolchain`** — list of
  `{name, min_version, validate_cmd, install_hint}` entries. Template
  ships with `required_toolchain: []` (no-op) plus a commented-out
  example documenting the schema.

- **`pi-epic-validate-decomposition` L-046 check** — runs each
  `required_toolchain` entry's `validate_cmd` (15s timeout); compares
  leading digit groups of stdout against `min_version` (`'v9.0.100'`
  parses as `(9, 0, 100)`); on failure, emits a multi-line stderr
  block with the failing toolchain name, the failure reason (exit
  code / version comparison / parse failure), and the `install_hint`
  **verbatim** — pi-epicflow does NOT execute the hint. Operator
  copy/pastes.

- **Toolchain-manager auto-defer** — if the repo root has
  `.mise.toml` / `mise.toml`, the failure message prefers
  `mise install` over per-SDK hints. If `.tool-versions` is present
  but no mise config, prefers `asdf install`. Defers to the
  toolchain manager the repo already chose; doesn't try to install
  the manager itself.

- **`--skip-toolchain-check` flag** — documented escape hatch (CI
  smoke runs, one-off operator overrides). Logs a yellow warning.

- **L-046 lesson** — *detect + suggest, not detect + install*.
  Spells out the rationale for rejecting auto-install (security,
  portability, state pollution, concern boundary, no outside-user
  evidence yet).

- **Smoke phase 20** — six-case round-trip:
  - empty `required_toolchain: []` is a no-op
  - nonexistent SDK → errors with install_hint
  - `--skip-toolchain-check` → bypasses with warning
  - present SDK passes
  - too-old `min_version` → errors with 'version too low'
  - `.tool-versions` present → prefers `asdf install` over per-SDK hint

### Changed

- `skills/epic-feature-workflow/templates/epic-config.yaml` — adds
  the `required_toolchain: []` field + commented example. Existing
  `epic-config.yaml` files without the field are unaffected (the
  check is opt-in via population, not via field presence).

### Migration notes

- Existing epics: no action required. The check only fires when
  `required_toolchain` is populated. The template will seed the field
  on new `pi-epic-init` runs; old epics keep working unchanged.
- To benefit on an existing epic: edit `epic-config.yaml`, populate
  `required_toolchain`, re-run `pi-epic-validate-decomposition`.
- Rationale for the detect+suggest design (vs auto-install) is
  spelled out in lessons.md §L-046 and in this CHANGELOG entry.

## [0.7.1] — 2026-05-15

**Integration-shell completeness validator (L-045).** Closes the
largest single deviation class observed across harmony + gen-ui:
~58 deviations that boil down to "worker built the new thing but
forgot to wire it into the host app" — missing barrel entry,
missing `main.tsx` registration, missing `Directory.Packages.props`
entry, missing `vite.config` plugin entry. Per-feature reviewer
catches it inconsistently because AC is shaped around the new
thing, not the boundary.

### Added

- **`pi-epic-validate-decomposition` integration-shell check (L-045)**
  — for every feature whose `acceptance_criteria` or `summary`
  contains a trigger verb (`wire`, `register`, `expose`, `integrate`,
  `mount`, `route`, `add ... to`, `hook up`, `plug in`, `connect`),
  `scope_files` MUST include at least one language-appropriate
  integration shell or the validator errors out:

  | Detected language | Required shell candidates (≥1) |
  |---|---|
  | TypeScript/JS + React (`.tsx`, `.jsx`) | `main.tsx` / `main.ts` / `index.html` / `index.ts` barrel / `vite.config*` |
  | TypeScript/JS (`.ts`, `.js`) | `package.json` / `index.ts` / `tsconfig.json` |
  | C# (`.cs`) | `Program.cs` / `Startup.cs` / `*.csproj` / `*.sln` / `Directory.Build.props` |
  | Python (`.py`) | `pyproject.toml` / `__init__.py` / `conftest.py` |
  | Rust (`.rs`) | `Cargo.toml` / `lib.rs` / `main.rs` |
  | Go (`.go`) | `go.mod` / `main.go` |

  Detection is by extension on `scope_files`. Repo root markers
  (e.g. an existing `vite.config.ts`) promote `.ts`/`.js` to
  `ts_react`. Match is permissive: a single shell satisfies the
  gate.

- **`--skip-shell-check` flag** on `pi-epic-validate-decomposition`
  — documented escape hatch for one-off bypass. Mirrors the v0.7.0
  `--skip-epic-review` pattern.

- **L-045 lesson** — *integration shells are part of the work, not
  part of the toolchain*. Cites the 58-deviation evidence base
  from both real epics.

- **Smoke phase 19** — four-case round-trip:
  - Trigger AC + no shell → validator errors with L-045 message
  - Trigger AC + shell present → validator passes
  - `--skip-shell-check` → bypasses
  - No trigger verb → validator does not false-positive

### Changed

- `pi-epic-validate-decomposition` now accepts flags (previously
  positional-args-only). `--help` describes the new flag.

### Migration notes

- Existing in-flight decomposition.yaml files that contain trigger
  verbs but no shell will now error on the next
  `pi-epic-validate-decomposition` run. Fix by adding the
  appropriate shell to `scope_files` (preferred) or by passing
  `--skip-shell-check` (one-off bypass).
- The check is opt-out, not opt-in. Rationale: the bug class is
  high-frequency and high-impact; the heuristic has been validated
  against two large real epics; the bypass flag handles edge cases
  cleanly.

## [0.7.0] — 2026-05-15

**`feature-epic-reviewer` agent + `pi-epic-complete` epic-review gate (L-043).**
Close the bug-class gap surfaced by harmony (B1 stale lockfile, B2
`destroyConversation` orphan) and gen-ui (`MapHarmonyAgent` no-op stub).
Per-feature reviewers are blind to these cross-feature bugs by design;
v0.7.0 adds a final-pass agent that runs AFTER every feature merges and
BEFORE `pi-epic-complete` archives, and a gate in `pi-epic-complete` that
refuses to archive without an `APPROVE_EPIC` verdict.

### Added

- **`agents/feature-epic-reviewer.md`** (L-043) — dedicated agent for
  end-of-epic review. Contract:
  - Pre-flight (cwd + branch sanity)
  - Cross-feature consistency (lockfile / manifest churn, no-op stubs,
    orphaned references, resource lifecycle symmetry)
  - Design-trace table (every `design.md` section — including v0.6.3
    `## Extension —` sections — must be claimed by ≥1 feature)
  - Rubber-stamp detector (parses run-log.jsonl `worker_runs` /
    `review_cycles`; >90% single-pass APPROVE on ≥5 features triggers
    spot-checks of 3 random review-reports; ≥2 of 3 lacking file:line
    evidence → hard finding)
  - Toolchain & test-gate coverage (bypass `test_cmd` = hard finding;
    real test suite MUST run)
  - Extension growth check (L-042 reminder)
  - Verdict: `APPROVE_EPIC | REQUEST_CHANGES_EPIC | BLOCK_EPIC`
    (LAST non-empty line of output, parsed by pi-epic-complete)
  - Same anti-sycophancy credibility clause as `feature-reviewer`:
    must name a concrete weakness OR list three specific clean checks.

- **`pi-epic-complete` L-043 gate** — reads
  `EPIC_DIR/epic-review.md` after the working-tree cleanliness check.
  Refuses to archive unless the file exists AND its last non-empty
  line matches `Verdict:*APPROVE_EPIC*`. Helpful error messages
  distinguish missing file vs missing verdict vs wrong verdict.
  Escape hatch: `--skip-epic-review` logs a yellow warning, appends
  an `epic-review-skipped` event to run-log.jsonl, and proceeds.
  Intentional for spike-only epics, smoke tests, and documented
  emergency overrides; NOT the default path.

- **`prompts/epic-run-auto.md` step 4 updated** — invokes
  `feature-epic-reviewer` (was: generic `reviewer`). Passes
  `EPIC_ID`, `EPIC_BRANCH`, `DEFAULT_BRANCH`, `MAIN_REPO`,
  `EPIC_DIR` as task fields. Decision tree updated to expect the
  new verdict names. Step 5 retry path unchanged.

- **L-043 lesson** — documents the structural blind spot:
  per-feature reviewers see one feature's diff against one feature's
  AC; they cannot see cross-feature bugs. End-of-epic review is
  mandatory. The lesson cites harmony's B1/B2 and gen-ui's stub as
  the empirical evidence.

- **Smoke phase 18** — L-043 gate round-trip:
  - missing epic-review.md → refuses
  - `Verdict: REQUEST_CHANGES_EPIC` → refuses
  - `Verdict: APPROVE_EPIC` → gate passes
  - `--skip-epic-review` → bypasses with warning + run-log entry

### Changed

- **`pi-epic-complete`** — new `--skip-epic-review` flag (in addition to
  the existing `--skip-extension-check` from v0.6.3). Existing flags
  unchanged.

- **Smoke phase 8** — spike-epic pi-epic-complete invocation updated
  to `--skip-epic-review` (this phase tests archive mechanics, not the
  L-043 gate). Phase 18 explicitly exercises the gate.

### Migration notes

- Existing epics will refuse to archive on the next `pi-epic-complete`
  run unless either:
  - An `epic-review.md` is written by the new agent (via the
    orchestrator's step 4, or a manual `subagent` invocation), OR
  - `--skip-epic-review` is passed (one-time emergency override).
- The recommended migration is to run the orchestrator step 4 by
  hand: spawn the `feature-epic-reviewer` agent against the
  in-flight epic and produce an `epic-review.md`. The agent is
  designed to work on retrospective epics too.

## [0.6.3] — 2026-05-15

**`pi-epic-extend` — first-class verb for extending an existing epic.**
Driven by gen-ui's sample-app gap: the original epic shipped a framework
with `test_cmd: "echo SKIP-…"` and Chromium-only frontend tests. The only
honest way to verify it is to build a sample/consumer app, but that work
belongs to the *original* epic's contract — not a stacked downstream epic
with 3-tier branch pain. Now there's a sanctioned path.

### Added

- **`pi-epic-extend <id> --rationale "…" [--design FILE] [--title "…"]`**
  (L-042) — extend an existing epic with new requirements that belong to
  its original scope. Resolves the epic from either `.pi/epics/<id>/` or
  `.pi/epics/done/<id>/`, un-archives it if needed (via `git mv` on the
  epic branch), flips `meta.yaml` `status: in-progress`, records the
  extension in `meta.yaml extensions:` with timestamp + rationale, and
  appends a `## Extension — YYYY-MM-DD: <title>` section to
  `design.md` (with `--design FILE` content or an editable stub).
  Original `design.md` content is never edited. The new commit is on the
  existing epic branch, `--no-verify` per L-039. Refuses if the epic
  branch has already been merged to its `default_branch`, if the working
  tree is dirty, or if `--rationale` is missing.

- **Extension mode in `prompts/epic-decompose.md`** — when the decomposer
  detects an `extensions:` block in `meta.yaml` whose latest entry has no
  corresponding features yet, it switches to APPEND-ONLY mode: new
  features start at `F<max+1>`, existing entries are read-only context,
  the diff to `decomposition.yaml` is verified append-only before commit.
  The summary explicitly tells the user: *"EXTENSION MODE: 5 new
  features F37–F41 will be APPENDED. Existing F01–F36 are unchanged."*

- **`original_feature_count`** in `meta.yaml` (snapshotted by
  `pi-epic-extend` before the first extension) — used by
  `pi-epic-complete`, `pi-epic-status`, and `pi-epicflow-doctor` to
  compute extension growth percentage.

- **`pi-epic-status` extensions block** — surfaces extension count and
  feature growth %. At ≥30% growth, prints a yellow reminder to record
  a `Decomposition lesson:` in `deviations.md` before `pi-epic-complete`.

- **`pi-epicflow-doctor` extensions line** — reports extension count on
  the active epic; warns at ≥2 extensions about possibly-too-narrow
  original scope.

- **L-042 lesson** — framework epics need verification features
  (sample apps, conformance harnesses) in the ORIGINAL decomposition,
  not as follow-up work. *"Tests pass" ≠ "framework verified" when the
  tests don't exercise a real consumer.*

- **Smoke phase 17** — `pi-epic-extend` round-trip: rationale-required
  gate, meta.yaml mutation, design.md append, status flip, un-archive
  from `done/`, idempotent `original_feature_count`, doctor reports
  extension count.

### Changed

- **`pi-epic-complete`** — extension guardrails. Warns when the active
  epic has ≥1 extension; **hard-halts (exit 1)** when extension features
  grow the epic ≥30% AND no `Decomposition lesson:` line exists in
  `deviations.md`. Override with `--skip-extension-check` or by
  recording the lesson. The escape hatch is intentional but visible —
  the operator has to acknowledge why the original scope under-shot.

- **`meta.yaml` template** — includes `extensions: []` placeholder.

### Migration notes

- Existing epics created before v0.6.3 have no `extensions:` field. They
  still work — `pi-epic-extend` creates the field on first use, and
  `pi-epic-status` only surfaces the block when present.
- Existing epics also lack `original_feature_count`. The first call to
  `pi-epic-extend` snapshots `decomposition.yaml`'s current feature count
  at that moment, which serves as the baseline. If your epic has already
  grown via manual feature additions before you call `pi-epic-extend` for
  the first time, that growth is invisible to the L-042 check — set
  `original_feature_count:` manually in `meta.yaml` to the historical
  baseline if you care.

## [0.6.2] — 2026-05-15

**Quality-of-life pack triggered by harmony + gen-ui retrospectives.**
Two real epics on the same day (20 features serial, 36 features parallel)
surfaced six new lessons (L-036..L-041) that were closeable with small
mechanical fixes. Ships them ahead of v0.7.0 to de-risk the parallel
dispatcher and other big work that follows.

### Added

- **User-private lessons** (`~/.pi/epicflow/user-lessons.md`, L-036) —
  per-machine, never auto-pushed. `pi-epic-complete` automatically
  appends each epic's distilled lessons here; the framework's
  `skills/epic-feature-workflow/lessons.md` no longer accumulates
  project-specific patterns by default. Agents (decomposer + planner +
  reviewer) read BOTH files; user lessons win on conflict. Privacy fix:
  pushing pi-epicflow upstream no longer risks leaking your project's
  product names, API endpoints, or internal architecture decisions.

- **`pi-epic-complete --contribute-lesson L-XYZ`** (L-036) — prints
  copy-paste-friendly text for a specific lesson from your user-lessons
  so you can PR it into the framework's lessons.md upstream. Reminds
  you to strip project-specific names first.

- **`pi-epicflow-doctor`** (L-036) — read-only health report: clone
  age, version, behind-origin commits, skills installed/executable,
  user-lessons file state, active epic + test_cmd sanity, tooling on
  PATH. Diagnostic only; never gates.

- **Version-drift warning in `pi-epic-init` and `pi-epic-status`**
  (L-036) — if the installed pi-epicflow clone is more than 7 days
  old, log a warning suggesting `pi update pi-epicflow`. The gen-ui
  epic shipped on v0.5.0 while v0.6.x was already out; this prevents
  the silent-drift case.

- **`test_cmd` bypass warning** (L-038) — `pi-epic-status` (and
  `pi-epicflow-doctor`) surface a red WARNING whenever
  `epic-config.yaml`'s `test_cmd` matches `^echo` or contains
  `SKIP`/`skip`. The gen-ui epic ran 36 features with
  `test_cmd: "echo SKIP-tests-verified-by-epic-review"` and deferred
  all test verification to the final epic-review pass — worked here
  only by luck. Now the bypass is visible on every status invocation.

- **`node_modules*` glob in default `.gitignore`** (L-040) —
  `pi-epic-init` now ensures `.gitignore` covers the whole
  `node_modules*` family, not just exact `node_modules/`. Catches
  worktree symlinks (`node_modules_main`), caches, and `.bak` siblings
  that slipped past the original ignore. Gen-ui F01 lost ~5 minutes
  to recovery from this exact scenario.

- **Smoke-test phases 14, 15, 16** — coverage for L-038 bypass
  warning, L-036 user-lessons distillation idempotency, and L-040
  gitignore glob effectiveness.

- **6 new lessons** — L-036 (user-vs-framework lessons split),
  L-037 (toolchain availability gate — deferred to v0.7.2 for the
  full pre-flight check), L-038 (bypass test_cmd warning), L-039
  (journal commits use `--no-verify`), L-040 (`node_modules*` glob),
  L-041 (late-DAG complexity factor — deferred to v0.8.1 for the
  decomposer depth multiplier).

### Changed

- **All journal/archive commits use `git commit --no-verify`** (L-039)
  — `pi-feature-start` (pending-edits + scaffold), `pi-feature-complete`
  (worktree wip + spike journal + squash + archive), `pi-epic-init`
  (gitignore + scaffold), `pi-epic-complete` (archive). These commits
  only touch `.pi/` bookkeeping, never user source. Skipping husky /
  lint-staged / commit-msg hooks here is correct: hooks should validate
  user code, not pi-epicflow's internal record-keeping. Gen-ui F01 hit
  this; future epics in repos with strict hooks are unblocked.

- **`pi-epic-complete`** no longer instructs users to manually append
  to the framework lessons file. New instructions point at the
  per-machine `~/.pi/epicflow/user-lessons.md` and the
  `--contribute-lesson` opt-in path for upstream contributions.

- **`prompts/epic-decompose.md`** now instructs the decomposer to read
  BOTH the framework lessons.md and `~/.pi/epicflow/user-lessons.md`
  (with user-lessons winning on conflict).

### Roadmap context

The v0.7 / v0.8 arc is documented in `PLAN.md`:

- **v0.7.0** — `feature-epic-reviewer` agent + epic-review.md gate +
  rubber-stamp detector. Catches the cross-feature bugs (lockfile drift,
  resource leaks across feature boundaries, design.md sections that no
  feature ever covers) that per-feature reviewers cannot see by design.
- **v0.7.1** — scope_files completeness validator (L-036/L-042). 58 of
  58 deviations across harmony + gen-ui were the same shape: integration
  shells (barrels, vite.config, Program.cs, Toolbar) missing from
  scope_files.
- **v0.7.2** — `required_toolchain:` epic-config pre-flight (L-037).
  Refuses to start an epic whose features will need a SDK / runtime that
  isn't installed; replaces the "manual structural validation" fallback.
- **v0.8.0** — **Parallel dispatcher** (L-035 evidence-gate satisfied).
  Gen-ui shipped 36 features in 21.75h via manual parallelism for a 2.97×
  speedup over a serial baseline of 64.69h. Conservative defaults
  (`max_workers: 2`), opt-in `--parallel` flag, halt-and-ask on
  out-of-order merge conflicts.
- **v0.8.1** — late-DAG depth multiplier (L-041) + run-log emission
  tightening (gen-ui dropped 2 of 36 `feature-complete` events).

## [0.6.1] — 2026-05-15

**Manual-parallelism aid + parallel-dispatch design sketch.** Closes the
"can I run features in parallel?" question with a near-free path today
(open multiple pi sessions, use `pi-epic-status --ready` to pick
non-overlapping features) and parks the full-orchestrator design in
`docs/sketch-parallel.md` for v0.7+ when real wall-clock evidence
justifies the ~16h build.

### Added

- **`pi-epic-status --ready`** — list features that are currently
  dispatchable (own state ∈ {pending, halted-ambiguous}, every dep
  merged). Default mode prints a table with the warning that overlapping
  scope_files must be dispatched serially. `--ready --quiet` (or `-q`)
  emits one feature id per line for scripting:
  `pi-epic-status --ready --quiet | head -2` to pick two for two pi
  sessions. When no features are ready, prints the top blocker deps
  ranked by how many pending features each one gates.

- **`docs/sketch-parallel.md`** — ~1-page design sketch for a v0.7+
  parallel-dispatch orchestrator. Captures: the problem, what's already
  in place (worktrees + pi-subagents parallel mode + DAG semantics +
  v0.6.1 `--ready`), the five hard problems (serial squash-merge, stale
  worktree on out-of-order merge, halt isolation, reviewer consistency,
  observability), the proposed components (batch dispatch + conflict
  pre-check + parallel worker pool + per-task review + serial merge
  queue + halt isolation), the rebase-or-fallback protocol (halt-and-ask,
  no auto-rebase), the decision gate (one real ≥20-feature epic with
  measurable serial-wait time OR two independent outside users asking),
  the cost estimate (~16h vs. v0.6.0's ~5h), and open questions. Will be
  the starting point if/when we ship; until then it just prevents
  redesigning from scratch.

### Why this and not the full dispatcher

No real evidence yet that serial dispatch is the bottleneck. kvstore was
4 features; gen-ui hasn't run. Building a 16h parallel orchestrator on
zero data points violates the project's no-bloat bias. The `--ready`
lookup is ~50 lines of Python in an existing script and lets users get
manual parallelism today — enough to find out whether they actually
want the full thing. (L-035 captures this decision.)

### Smoke test

Grew from 12 to 13 phases (added phase 13 for `--ready` correctness:
verifies F01 + F04 ready when all pending; F02 + F03 join the ready set
after F01 merges; F02 drops out when it goes in-progress and rejoins on
halted-ambiguous). 13/13 pass.

## [0.6.0] — 2026-05-14

**Verification + soft-halt release.** Closes the two biggest implicit
failure modes that the gen-ui decomposition surfaced and that
obra/superpowers' culture pack (191k☆) is also trying to address from
the opposite direction: workers hallucinating "done" without showing
their work, and ambiguous AC silently guessed at instead of paused.

Borrows the *concepts* from obra/superpowers'
`verification-before-completion`, `systematic-debugging`, and
"stop and ask" patterns, but lands them as **mechanical gates** —
shell-script checks, structured halt codes, reviewer must-cite clauses,
template completeness audits — not as prompt-only skills. The new L-034
lesson codifies that principle going forward.

One new halt code (H10), one new shell-script gate, one tightened
template, four new mandatory reviewer checks, three new lessons. No
breaking changes; v0.5.x epics in flight keep working (legacy features
without an evidence section can be merged with `--skip-evidence`).

### Added

- **L-032 — worker completion evidence (mechanical gate).** Workers must
  emit a `## Completion evidence` section in `worker-report.md` with one
  `### AC<N>:` block per acceptance criterion containing the literal
  command run + the last ~20 lines of stdout/stderr (or a `file:line`
  citation + structural claim for code-shape ACs). `pi-feature-complete`
  enforces presence of the header at the shell layer; missing evidence
  rejects the merge unless `--skip-evidence` is passed. The reviewer is
  required to spot-check at least one block by re-running the command
  — mismatched output → REQUEST_CHANGES with the specific block flagged.
  Spikes are exempt (their evidence lives in the spike template's §3/§5
  and `deviations.md`). (Concept inspired by obra/superpowers'
  `verification-before-completion` skill.)

- **L-033 — H10 soft halt code ("ambiguous AC, paused for human").**
  New halt code for ambiguities that should not block the whole epic:
  literal `TODO`/`TBD`/`<placeholder>`/`???` in AC text, missing
  scope_file that isn't part of a multi-file greenfield package (L-030
  case), upstream deviation contradicting current AC, undefined
  `design.md` symbol referenced by the AC, materially-divergent valid
  readings. On H10, `/epic-run-auto` marks the feature
  `state: halted-ambiguous`, writes a halt report with the planner or
  worker's exact question, and **continues to the next dependency-
  independent feature** — only this feature and its dependents are
  blocked, not the whole epic. When the user resolves the AC (one-line
  edit to `decomposition.yaml` or `design.md`) and re-runs
  `/epic-run-auto`, `pi-epic-next-feature`'s in-progress-first rule
  (L-010) picks the halted feature back up. Recipe documented in
  `docs/recovery.md` R8. The halt family is now H1–H7, H9 (hard),
  H10 (soft).

- **L-034 — "Every rule has a mechanical enforcement point" (meta-
  lesson).** Documented as a top-level key design choice in
  `docs/design.md`. Every new lesson, halt code, or quality bar must
  land in at least one of: a `pi-*` script gate, a reviewer must-cite
  clause that maps to REQUEST_CHANGES, a structured field the
  orchestrator parses (halt codes, `state:` enums, `kind:`), or a
  template field the reviewer audits for completeness. Prompt-only
  rules are allowed only when no good mechanical proxy exists
  (anti-sycophancy clauses, etc.) and must be flagged as exceptions.
  This is pi-epicflow's actual leverage over a culture-pack-style
  skills bundle — keep it.

- **Reviewer credibility clause (folded into L-032).** `feature-reviewer`
  must either (a) name at least one concrete weakness in the worker's
  change, or (b) explicitly list three specific things it checked and
  found clean. Rubber-stamp APPROVE with no findings and no specifics is
  rejected by the orchestrator. Cheapest available anti-sycophancy lever.

- **`docs/recovery.md` R8 — H10 recovery recipe.** Symptom → root
  cause → the one-line edit to `decomposition.yaml` or `design.md` →
  resume → prevention. Cross-linked from `prompts/epic-run-auto.md`.

### Changed

- **`templates/feature-spike.md` — ≥2 options required, ≥3 recommended.**
  Each option must list approach, pros, cons, and a falsification or
  comparison test. "Option B = do not adopt; keep status quo" is a valid
  second option for genuinely one-sided spikes. Reviewer enforces the
  floor — spikes with only one filled-in option come back as
  REQUEST_CHANGES. (Concept inspired by obra/superpowers'
  `systematic-debugging` skill; pi-epicflow already had the template,
  v0.6 makes the floor reviewer-enforced.)

- **`pi-feature-complete` — new `--skip-evidence` flag.** Mirrors
  `--skip-tests` for the evidence gate. Use for legacy v0.5.x features
  whose worker-report predates the evidence requirement, or for the
  rare case where the worker had a real reason to omit the section.

- **`agents/feature-worker.md` — H10 trigger list added** to step 2
  (planning). Replaces the old "HALT with H1" instruction for
  ambiguous AC with the more specific H10 path.

- **`agents/feature-planner.md` — H9 vs H10 distinction made explicit.**
  H9 stays for structural ambiguity (decomposition is wrong; full epic
  halt). H10 is for AC-level ambiguity (one feature halts; epic
  continues). Examples and trigger lists for both.

- **Halt family documented as two tiers in `docs/design.md`.** Hard
  halts (H1–H7, H9) stop the epic. Soft halt (H10) stops only the
  feature and its dependents.

### Fixed

_(Nothing in this release — v0.6.0 is additive. Smoke test grew
from 10 to 12 phases; phases 1–10 unchanged in behavior, phases 11
and 12 cover the new evidence-gate.)_

### Inspired by but did NOT adopt

- TDD enforcer (obra/superpowers `test-driven-development`) —
  pi-epicflow targets any epic, not just test-firstable code. A hard
  rule would break legitimate non-TDD features (configs, migrations,
  docs epics). Available as an optional planner-trigger tag, not a
  default.
- Brainstorming, root-cause, commit-hygiene skills — single-line
  ideas, folded into existing prompts where applicable, not imported
  as separate skills (per the L-034 "no skill sprawl" anti-pattern).
- Multi-harness adapters (Claude Code, Codex, Cursor, OpenCode, etc.)
  — pi-epicflow is pi-shaped and that's a feature, not a gap.
- `pi-skill-lint` for user-authored content (researcher's P4) —
  premature; reconsider when first outside-contributor PR opens.

## [0.5.2] — 2026-05-14

**UX + validation polish.** Five items — one prompt UX change already on
main, plus four items surfaced by the gen-ui epic decomposition (the
first real outside-user epic since v0.5.1). No schema changes, no
breaking changes, no new halt codes.

### Added

- **L-028 — `docs/recovery.md` (recovery playbook).** Seven named
  recipes (R1–R7) covering common stuck states: lost-journal restore
  after an L-004 `--ours` resolve; empty-squash on a non-spike
  feature; dirty tree after `pi-feature-complete` / `pi-epic-complete`
  (pre-v0.5.1 epics); feat-branch base drift; half-finished
  `pi-feature-start`; when `--skip-tests` is the right hammer; and a
  final 15-min stop-and-halt rule. Each recipe follows the same
  shape: Symptom → Root cause → Recovery commands → Verification →
  Prevention reference. Cross-linked from
  `prompts/epic-run-auto.md` §STALL HANDLING. Deferred from v0.5.1.

### Changed

- **`/epic-decompose` no longer prints the full YAML.** The prompt used to
  stream the entire proposed `decomposition.yaml` into chat as a fenced
  code block for review. On large epics (20+ features) this flooded the
  terminal, was too long to skim quickly, and added real wall-clock
  latency to the turn. New behavior: the agent **writes the draft to
  `.pi/epics/<id>/decomposition.yaml` on disk**, runs the validator for
  warnings, then POSTs a compact summary block (epic id, totals,
  dependency graph, one line per feature with id/slug/hours/deps/
  planner tags, validator warnings). The user reviews the file directly
  in their editor and either approves or requests changes; on changes
  the agent overwrites the same file and re-posts the summary. The
  file is not committed until the user approves (Steps 5+6 unchanged).
  Touches `prompts/epic-decompose.md` only — no script or schema
  changes.
- **`/epic-decompose` now stops and waits after the summary.** Previously
  the prompt instructed the agent to continue straight through Steps 3–6
  in the same turn once it detected an approval signal. New behavior:
  after posting the draft summary the agent **STOPS** and waits for the
  user's next message before proceeding. Approval still triggers
  Steps 3–6, but in the user's approval turn rather than the proposal
  turn. This adds a real human-in-the-loop checkpoint before the
  commit.

### Fixed

- **L-029 — `depends_on` range syntax is now caught with a useful
  error.** Range strings like `[F06-F09]` or `F06-F09` look like YAML
  range syntax but YAML doesn't expand them — the dispatcher treats
  `"F06-F09"` as a single literal feature ID that doesn't exist,
  silently breaking the dependency graph. Previously the validator
  caught this with a generic `depends_on '...' is not a defined feature`
  error that didn't point at the underlying mistake. Now:
  - `pi-epic-validate-decomposition` matches the range pattern
    `^[FS]\d+-[FS]\d+$` and emits an error naming the fix inline:
    *"Expand to an explicit list, e.g. depends_on: [F06, F07, F08, F09]."*
  - `prompts/epic-decompose.md` Step 1 has a new L-029 callout banning
    range syntax explicitly.
  - Near-miss in gen-ui decomposition: seven features had range
    strings in the summary view; user caught it during review.
- **L-030 — validator's parent-dir-missing warning no longer floods
  greenfield decompositions.** The warning was designed to catch stale
  paths from earlier layouts, but on epics that build new packages
  (gen-ui: ~10 new directories with multiple files each) it fired once
  per file: 50+ false-positive lines that drowned real warnings. Now:
  - Pre-compute per-directory scope_file counts across the entire
    decomposition.
  - Suppress the warning when 2+ scope_files share the same (missing)
    parent dir — evidence the user is building a new package on
    purpose, not pointing at a stale path.
  - Single-file-in-new-dir entries still warn (those could be stale).
  - Warning message now also tells the user how to silence it
    explicitly: *"add a second scope_file under '<parent>/' to confirm
    intent."*
- **L-031 — spike numbering convention.** Smoke epic used `S01,F02..F04`
  (spike at the top); gen-ui used `F01..F03,S04,F05..` (spike after
  early catalog work). Both work mechanically. The second is clearer:
  the id reflects DAG position, not just "this is a spike". Encoded in
  `prompts/epic-decompose.md` Step 1: place spikes at the position in
  the dependency order where they naturally fall, sharing the numeric
  counter with features.

## [0.5.1] — 2026-05-14

**Bug-fix release.** Six tooling sharpenings traced to specific artifacts
in the kvstore v0.5.0 smoke epic (`0001-smoke`). No schema changes; no
new halt codes; no breaking changes. Epics produced under v0.5.0 keep
working.

### Fixed

- **L-023 — `pi-feature-complete` spike path.** Spike completion was
  broken in three interlocking ways. The smoke epic's S01 spike
  required manual `git reflog` recovery. Now fixed structurally:
  - `pi-feature-start` writes + commits the scaffold to the epic
    branch **before** creating the feat branch, so feat inherits the
    scaffold commit (was: branched first, committed scaffold later —
    feat had nothing).
  - `pi-feature-complete` for `kind: spike`: commits the worker's
    MAIN_REPO journal edits (`feature.md`, `meta.yaml`,
    `deviations.md`) to the epic branch first as `spike(<id>):
    decision + journal`, then proceeds. The subsequent
    `git merge --squash $feat_branch` produces an empty diff (feat
    has only scaffold); allowed via `--allow-empty` for spikes only.
  - Smoke test step 7 added: end-to-end spike workflow with no manual
    intervention.
- **L-024 — decomposer + validator catch symbol-path scope holes.**
  When an AC names a fully-qualified symbol path
  (`module.errors.X`, `pkg.module.Class`), the file owning that
  symbol must appear in this feature's `scope_files` — or in an
  upstream merged dependency's scope. v0.5.0 silently allowed this
  (smoke epic F03 added `LockedError` to `errors.py` despite
  `scope_files: [engine.py, test_engine.py]`).
  - `prompts/epic-decompose.md` Step 1: new L-024 callout requires the
    decomposer to walk every AC bullet, extract dotted symbol paths,
    and include the owning file in scope_files.
  - `pi-epic-validate-decomposition`: new warning when an AC mentions
    `dotted.module.ClassName` and no `scope_files` entry (this
    feature's or a dep's) heuristically maps to that module. Strips
    leading `src/`, `lib/`, `app/`, `source/`; matches
    `pkg/module.py` and `pkg/module/__init__.py`. Heuristic +
    warn-only — false positives don't block.
- **L-025 — `pi-epic-complete` commits the archive rename.** Previous
  behavior: `mv .pi/epics/<id> .pi/epics/done/<id>` on the
  filesystem, no `git mv`, no commit — epic ended with a dirty
  working tree (smoke epic needed a manual `git add -A && git commit`
  to clean up). Now: prefer `git mv` (stages the rename), fall back
  to `mv` + `git add -A` for repos with untracked siblings; sweep the
  destination for newly-written files (`lessons-candidate.md`,
  `epic-review.md`); commit as
  `chore(epic): archive <id> to .pi/epics/done/`.
  - Same fix applied at the per-feature level in
    `pi-feature-complete`: the `mv features/<fid> features/done/<fid>`
    now commits as `chore(epic): archive <fid> to features/done/`,
    independent of the next `pi-feature-start`'s pending-edits sweep.
  - Smoke test step 8 added: `git status --short` is empty after
    `pi-epic-complete`.
- **L-026 — `.gitignore` template gaps closed.** The v0.5.0 patterns
  matched only `.pi/epics/*/...` (one segment), so after
  `pi-epic-complete` archived the epic to `.pi/epics/done/<id>/`,
  worker/review/progress reports + the run-log became un-ignored
  (smoke epic shipped 11 `.pyc` files into the epic branch as a
  side-effect). `pi-epic-init` now adds:
  - `.pi/epics/done/*/run-log.jsonl`
  - `.pi/epics/done/*/features/done/*/worker-report.md`
  - `.pi/epics/done/*/features/done/*/review-report.md`
  - `.pi/epics/done/*/features/done/*/progress.md`
  - `__pycache__/` (universal — noise on non-Python repos, real
    hygiene win on Python repos)
  - `*.pyc`
- **L-027 — decomposition.yaml template clarifies AC vs summary.** The
  smoke epic's F03 `summary` said compaction preserved order via
  "latest surviving SET" while the AC + design required first-
  occurrence order. Code correctly followed the AC; epic-reviewer
  caught the drift post-hoc. Template now has a header comment
  stating `acceptance_criteria` is normative; `summary` is
  informative; on conflict, implementation follows AC.

### Changed

- `pi-feature-start` reorders the scaffold commit to happen before feat
  branch creation. Non-spike features behave identically (the scaffold
  is the same files they'd write on top of); spike features now
  produce a usable feat branch.
- `install/smoke-test.sh` extended from 6 to 8 phases. New phases:
  - **[7/8]** L-023 spike workflow end-to-end (no manual recovery).
  - **[8/8]** L-025 clean tree after `pi-epic-complete`.

### Deferred

- L-028 (orchestrator recovery playbook for L-019/L-004 collisions) —
  the underlying bugs are fixed by L-023, so the recovery doc is
  hygiene rather than blocker. Tracked for v0.5.2.

## [0.5.0] — 2026-05-14

**Hybrid planner architecture.** Every feature now writes a plan section
before any code edits (always-on baseline). Features flagged
`needs_planner: true` in `decomposition.yaml` additionally get a dedicated
`feature-planner` subagent pass that produces a binding `plan.md`. New
halt code **H9** (planner-blocked) surfaces unresolvable ambiguities to
the human BEFORE worker time burns. New `kind: spike` for decision-only
features. Three v0.4-baseline decomp-quality fixes (L-019/L-020/L-021)
landed in the same release.

Motivated by partner-agent-sdk's F06 halt (AC assumed engine call sites
that didn't exist) and by readiness for the Harmony GenUI v2 epic
(~75-100 features, cross-language, 19 open questions).

### Added

- **`feature-planner` subagent** (`agents/feature-planner.md`). Runs
  before `feature-worker` when the orchestrator's planning gate fires
  (§3.5 in `prompts/epic-run-auto.md`). Reads design + decomposition +
  `reference_paths` + repo code; produces `FEATURE_DIR/plan.md` listing
  files-to-touch, AC interpretations with literal expected behavior,
  ambiguities, and anti-scope. Worker treats `plan.md` as a binding
  contract; deviations require a `deviations.md` entry. Reviewer
  validates plan-vs-impl alignment.
- **Always-on worker plan-first contract.** `feature.md` §4 is now a
  structured Plan section (files-to-touch, AC interpretations,
  ambiguities, anti-scope). Worker fills it BEFORE first edit, even for
  features without a dedicated planner pass. Reviewer enforces.
- **`kind: feature|spike`** in `decomposition.yaml`. Spikes ship a
  decision artifact in `deviations.md` instead of code; `pi-feature-start`
  uses a different journal template (`feature-spike.md`);
  `pi-feature-complete` skips test runs for spikes. Spike IDs use
  `S<NN>` prefix sharing the same numeric counter as features. Capped at
  8 estimated hours.
- **`needs_planner: bool` + `planner_triggers: [list]`** per-feature
  fields in `decomposition.yaml`. Trigger checklist in
  `prompts/epic-decompose.md`: tag if ≥2 of 7 triggers fire
  (unverified-callsites, format-sensitive-ac, scope-crosses-modules,
  deep-dep-chain, large-estimate, many-acs, cross-cutting-verb).
  Threshold tunable via `PI_EPICFLOW_PLANNER_THRESHOLD`.
- **`reference_paths:` epic-level field** in `decomposition.yaml`. Paths
  the planner-subagent always reads when planning a tagged feature.
  Files >100KB are noted but not pulled into context. Generic mechanism;
  the user populates with project-specific paths (POC code, findings
  docs, prior-art ADRs).
- **Halt code H9 — planner-blocked.** Fired when `feature-planner`
  surfaces an unresolvable ambiguity (missing call sites, contradictory
  AC, undefined pattern). Decomposition needs human input before the
  feature can proceed.
- **`pi-epic-init --no-planner`** escape hatch. Persists
  `disable_planner: true` to epic `meta.yaml`; planning gate honors it.
- **`feature-spike.md` journal template** with structured decision
  shape: Options Considered / Decision / Evidence / Impact / Plan.
- **L-019: `pi-feature-start` auto-commits scaffolded feature folder**
  to the epic branch immediately after creating it. Fixes the F01/F02
  add/add merge conflict class hit on every feature of
  partner-agent-sdk. Idempotent.
- **L-020: validator rejects unsafe-leading-char AC strings.**
  `pi-epic-validate-decomposition` errors on any unquoted AC starting
  with `*`, `&`, `!`, `|`, `>`, `%`, `@`, or backtick. Strict-YAML
  parsers reject these; the lenient parser tolerated them silently in
  partner-agent-sdk's decomposition.yaml the entire epic.
- **L-021: validator warns on stale `scope_files` paths.** Non-glob
  entries whose parent dir doesn't exist produce a warning (likely
  carryover from an earlier layout). Same check applied to
  `reference_paths`.
- **L-018-stronger: validator warns on golden/snapshot/wire-shape AC
  without inline literal sample.** AC mentioning "golden", "snapshot",
  "wire shape", "wire format" must include a fenced code block or quoted
  literal with the expected value.

### Changed

- `prompts/epic-run-auto.md`: new step 3.5 — planning gate; new STATUS
  phase `planning <fid>`; halt codes section updated with H9.
- `prompts/epic-decompose.md`: trigger checklist, spike-feature
  conventions, `reference_paths` field, manifest fan-out hint,
  L-018/L-020 literal-sample rules.
- `agents/feature-worker.md`: §1 reads `plan.md` if present; §2
  mandatory Plan section; §3 spike-mode loop; §7 deviations triggers
  expanded to include plan-vs-impl drift.
- `agents/feature-reviewer.md`: plan-vs-impl validation block;
  spike-mode validation; new output `## Plan-vs-impl` section.
- `skills/epic-feature-workflow/templates/decomposition.yaml`: documents
  new fields, trigger list, spike example.
- `skills/epic-feature-workflow/templates/feature.md`: §4 restructured
  into mandatory Plan.
- `pi-feature-start`: reads `kind` from decomposition; selects journal
  template; commits scaffold to epic branch (L-019).
- `pi-feature-complete`: spikes skip the test run.
- `pi-epic-validate-decomposition`: see "Added" items above.
- `install/postinstall.mjs`: copies `feature-planner.md` alongside
  worker/reviewer.

### Migration

Legacy `decomposition.yaml` files without the new fields (`kind`,
`needs_planner`, `reference_paths`) validate cleanly — fields default to
`feature` / `false` / `[]`. No schema migration required for in-flight
epics. Mid-epic upgrades are safe: the planning gate is a no-op for
features without `needs_planner: true`.

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
