---
description: Force-close the current in-progress session in .pi/project/sessions.md. Use when you want to stop pi for the day before pi has detected goal achievement, or when you're abandoning / pausing the goal.
argument-hint: "[achieved|paused|abandoned] [reason in quotes]"
---

You are running `/session-end`. The user wants to explicitly close the
current session entry. Normally pi proposes closure autonomously on
goal achievement; this command is the manual escape hatch.

Optional args from the user: $@

- First positional arg: `achieved` | `paused` | `abandoned`
  (default: `paused` if no goal-met signal, `achieved` if the goal
  obviously was met)
- Second positional arg (quoted): a one-line reason / summary override.

## Pre-flight

1. Read `.pi/project/sessions.md` and find the most recent
   `Status: in-progress` entry.
   - If none exists: tell the user *"No in-progress session found.
     Nothing to close."* — stop.
   - If multiple exist (shouldn't happen but possible after a crash):
     close them all in date order, oldest first.

## Step 1 — Determine the closing status

Use this priority:

1. If the user passed an explicit arg (`achieved` / `paused` /
   `abandoned`), use it.
2. Else, infer:
   - If the session goal is clearly met (you have evidence: tests
     green, feature merged, plan approved, question answered) →
     `achieved`.
   - If work happened but goal not met → `paused`.
   - If the session is being walked away from with no plan to resume →
     `abandoned`.
3. If you're not sure, ASK: *"Close S-NNN as `achieved` / `paused` /
   `abandoned`? Recommend: `<recommendation>` because <one-line
   reason>."* — wait for the user.

## Step 2 — Run the end-of-task sweep

Before writing the closing entry, do the skill's end-of-task sweep:

1. Re-scan the session for trigger phrases you may have missed.
2. Diff what changed in code vs what's recorded in `decisions.md` /
   `backlog.md`. Append any gaps.
3. Refresh `last_verified` on any `index.md` rows for files touched.

## Step 3 — Write the closing fields

The S-NNN entry's `Status: in-progress` and `Ended at: —` lines are
placeholders — **edit them in place** (don't append duplicates).
Append the remaining closing fields after them.

1. **Edit in place** in the open S-NNN entry:
   - `**Status:** in-progress` → `**Status:** <achieved | paused | abandoned>`
   - `**Ended at:** —` → `**Ended at:** <today YYYY-MM-DD>`

2. **Append** the remaining fields directly under those two lines:

```md
**Status:** <achieved | paused | abandoned>
**Ended at:** <today YYYY-MM-DD>
**Summary:** <2–3 sentence narrative — what was tried, what landed, what
didn't. If user passed a quoted reason, use that as the spine.>

**Decisions made:** <DEC-NNN list, or "(none)">
**Backlog added:** <BL-NNN list, or "(none)">
**Conventions added/amended:** <C-NNN list, or "(none)">
**Sub-agents invoked:**
- epicflow-scout × N
- epicflow-worker × N
- epicflow-reviewer × N
- epicflow-researcher × N
- epicflow-oracle × N
(omit lines with 0 invocations)

**Files touched:** <full list, with (created | modified | deleted)>

**Open threads (carry into next session):**
- <one-line item the next session should pick up>
- (or "(none)")
```

If status is `paused`, the "Open threads" section is especially
important — it's how the next session resumes. Make sure it has at
least one concrete item.

If status is `abandoned`, add a one-line `**Abandoned because:**` field
above "Open threads" — the user's quoted reason or your inference.

## Step 4 — Report

```
✅ S-NNN closed: <status>
- Summary: <one-line>
- Decisions: <count>
- Backlog: <count>
- Conventions: <count>
- Files touched: <count>

Open threads carried forward:
- <list>

Start a new session by just telling me what you want next.
```

## Anti-patterns

- Don't write the closing entry without running the end-of-task sweep
  first — that's where missed memory writes get caught.
- Don't infer `achieved` without evidence. If unsure, ask.
- Don't leave "Open threads" blank on a `paused` close.
- Don't close a session whose status is already `achieved` / `paused` /
  `abandoned`. That's a no-op; just tell the user.
