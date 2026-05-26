# Conventions

> Always / never rules for this repo. Pi loads this file before any
> non-trivial edit. Adding/changing a rule is append-only — to amend a
> rule, append a new entry with `supersedes: <id>` and leave the old one
> in place.

**Last revised:** {{DATE}}

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

**Added:** {{DATE}}

---

## C-002 — Decisions are append-only

**Rule:** `decisions.md`, `backlog.md`, `sessions.md`, and this file are
append-only. To reverse or amend an entry, add a new entry with
`supersedes: <id>`; never edit the original.

**Why:** session-to-session traceability. The "why we changed our mind"
is as valuable as the current state.

**Added:** {{DATE}}

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
