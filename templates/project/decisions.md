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
