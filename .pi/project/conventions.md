# Conventions

> Always / never rules for this repo. Pi loads this file before any
> non-trivial edit. Adding/changing a rule is append-only — to amend a
> rule, append a new entry with `supersedes: <id>` and leave the old one
> in place.

**Last revised:** 2026-05-26

---

## C-001 — Anti-stub (HARD RULE)

**Rule:** No stubs in shipped code. Pi must produce concrete
implementations.

**Forbidden patterns** (Pi refuses to write these unless this rule is
explicitly overridden for a specific case AND a backlog entry exists):

- `TODO`, `FIXME`, `XXX` left as placeholders for missing logic.
- `pass  # …`, `raise NotImplementedError`, `throw new Error("not implemented")`.
- `return null  // TODO`, `return undefined  // stub`, empty arrow bodies.
- Function bodies that are only a print/log call where logic was expected.
- Test bodies that are `assert True`, `expect(true).toBe(true)`, or
  equivalent.

**Allowlist (case-by-case, must cite this rule + a backlog entry):**

- _(none yet — add specific exceptions here as they're approved)_

**Enforcement:** `epicflow-reviewer` and `feature-reviewer` greps for the
forbidden patterns and fails the review unless the file:line is on the
allowlist.

**Added:** 2026-05-26

---

## C-002 — Decisions are append-only

**Rule:** `decisions.md`, `backlog.md`, `sessions.md`, and this file are
append-only. To reverse or amend an entry, add a new entry with
`supersedes: <id>`; never edit the original.

**Why:** session-to-session traceability. The "why we changed our mind"
is as valuable as the current state.

**Added:** 2026-05-26

---

<!-- Project-specific conventions are added below as they emerge.
     Entry shape — in a code fence so grep doesn't see the example heading:

```md
## C-NNN — <short rule title>
**Rule:** <one or two sentences, imperative>
**Why:** <rationale>
**Enforcement:** <how pi/reviewer checks>
**Added:** YYYY-MM-DD
```
-->

## C-003 — Bash + PowerShell parity for operator scripts
**Rule:** Every `pi-epic-*` and `pi-feature-*` script must have a
PowerShell mirror in `skills/epic-feature-workflow/scripts-win/` with
byte-equivalent behavior against smoke-test fixtures. Same CLI surface,
same exit codes, same commit messages, same gate semantics.
**Why:** Windows operators are first-class; behavioral drift between
shells silently breaks half the user base.
**Enforcement:** `smoke-test.ps1` runs the same 29 scenarios as
`smoke-test.sh`. Both must pass before tagging a release.
**Added:** 2026-05-26 (extracted from observed v0.11/v0.12 pattern)

## C-004 — Lessons get L-NNN ids and CHANGELOG entries
**Rule:** Every operational learning gets a sequentially-numbered
`L-NNN` id, a one-paragraph entry under "Lessons added" in the
in-progress `[X.Y.Z-dev]` CHANGELOG section, and a citation in any
code, agent, or doc that depends on it.
**Why:** Cross-version reasoning depends on stable lesson ids. The
CHANGELOG L-NNN format is how features, scripts, and agents reference
prior decisions ("per L-049", "see L-053 for the caveat", etc.).
**Enforcement:** Reviewers reject changes that introduce new
operational rules without an L-NNN. Search: `rg 'L-0[0-9]{2}'`.
**Added:** 2026-05-26 (extracted from CHANGELOG-wide pattern)

## C-005 — One PLAN file per release; never edit shipped PLANs
**Rule:** Each version-in-flight gets its own `PLAN-v<X.Y.Z>.md` at
repo root. Once the version is tagged, the PLAN file is frozen — no
retroactive edits. Future versions get new PLAN files.
**Why:** Plans are append-only history, not living documents. Editing
a shipped plan rewrites how decisions were actually made.
**Enforcement:** Reviewers reject diffs that modify any `PLAN-v*.md`
older than the in-progress version.
**Added:** 2026-05-26 (extracted from `ls PLAN-v*.md` showing one file
per version since v0.5.0)

## C-006 — Agent files use YAML frontmatter with mandatory keys
**Rule:** Every `agents/*.md` starts with a YAML frontmatter block
containing at minimum: `name`, `description`, `systemPromptMode`,
`inheritProjectContext`, `inheritSkills`, `defaultContext`,
`maxSubagentDepth`. Replace-mode prompts go below.
**Why:** `install/postinstall.mjs` auto-discovers agents via this
frontmatter (per L-050). Missing/malformed keys silently drop the agent
from registration.
**Enforcement:** Smoke test loads every `agents/*.md`; postinstall
exits non-zero on parse failure. Sample-check:
`awk '/^---$/{n++} END{exit n%2}' agents/*.md`.
**Added:** 2026-05-26 (extracted from observed pattern across 11 personas)
