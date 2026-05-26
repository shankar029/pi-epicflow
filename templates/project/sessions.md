# Sessions

> Append-only log of every pi session. Each session has a stated goal,
> a status, and links to the decisions / backlog items it produced.
> Pi opens an entry autonomously on the first non-trivial turn and
> closes it on goal achievement (or the user invoking `/session-end`).

**Last entry:** _(none yet — S-NNN will start at S-001)_

---

<!-- Entry shape — in a code fence so grep doesn't see the example heading:

```md
## S-NNN — <short session title>

**Date:** YYYY-MM-DD
**Goal:** <one sentence — what this session is for>
**Status:** in-progress | achieved | paused | abandoned | superseded
**Started from:** <branch / commit if relevant>
**Ended at:** <YYYY-MM-DD or — if still open>
**Supersedes:** _(if this session is a pivot from S-NNN)_
**Superseded by:** _(filled in by the next session if this one pivots)_

**Summary:**
<two or three sentences — what actually happened>

**Decisions made:**
- DEC-NNN — <short>

**Backlog added:**
- BL-NNN — <short>

**Conventions added/amended:**
- C-NNN — <short>

**Sub-agents invoked:**
- epicflow-scout × N — <one-line purpose>
- epicflow-worker × N
- epicflow-reviewer × N
- epicflow-researcher × N
- epicflow-oracle × N
(omit lines with 0 invocations)

**Files touched:**
- path/to/file (created | modified | deleted)

**Open threads (carry into next session):**
- <thing the user said "we'll pick up later">
```
-->
