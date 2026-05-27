# Project Memory — Gotchas

> Footguns, surprising library behavior, version-specific quirks, and
> the fix that worked. Each entry has a stable id (`G-NNN`) and a
> "still applies if" trigger so future audits can prune.
>
> Append-only. Never delete. Mark obsolete entries with
> `**Status:** obsolete (superseded-by: G-NNN | fixed-in: <version>)`.

**Last verified:** {{DATE}}
**Cap:** 200 entries; entries > 2 years → archive to
`gotchas-archive-<YYYY>.md` (see SKILL.md "Capacity & rollover").

---

<!-- Entry shape — kept inside a code fence so audits don't see the example heading.

```md
## G-NNN — <short footgun title>

**Date:** YYYY-MM-DD
**Discovered in session:** S-NNN
**Status:** active | obsolete (<reason>)
**Surface:** <which file / library / runtime version this bites>

**Symptom:**
<what the agent / user observed — error message, wrong output, etc.>

**Root cause:**
<the real reason — library quirk, OS difference, version drift, etc.>

**Fix:**
<the change that resolved it. Code block if relevant.>

**Still applies if:**
<the trigger that should re-raise this entry. e.g. "we upgrade past
library X v2.0", "we drop Python 3.10 support", "the workaround
becomes obsolete on Windows 11".>

**Related:** DEC-NNN, C-NNN, BL-NNN (whichever caused or fixed this)
```

-->

<!-- ===== Real entries below ===== -->
