---
description: Warm-up summary at session start. Reads .pi/project/{index, last 3 decisions, open backlog, last 3 sessions} and prints a 5-line "where we are" so pi (and you) start oriented.
argument-hint: ""
---

You are running `/project-onboard`. Produce a tight orientation summary
so the new session starts warm. This is optional — the `project-memory`
skill primes pi on entry anyway — but it's useful when you're returning
to a repo after time away.

## Delegation option (v0.14+)

For a hands-off warm-up across multiple repos (the "juggling 3-4
parallel projects" case), delegate to `epicflow-steward`:

```
subagent { agent: "epicflow-steward", task: "sweep" }
```

The steward will print the same orientation summary plus an audit, all
in a fresh context with no write risk to source code.

## Pre-flight

1. Check `.pi/project/index.md` exists. If not, tell the user:
   *"`.pi/project/` not initialized. Run `/project-init` first."* — stop.

## Step 1 — Read

In parallel:

- `.pi/project/index.md`
- `.pi/project/charter.md` (just the Goal + Quality bar)
- `.pi/project/decisions.md` — the last 3 active (non-superseded) DEC entries
- `.pi/project/backlog.md` — all entries with `status: open`
- `.pi/project/sessions.md` — the last 3 entries (any status)
- `.pi/project/conventions.md` — just the rule titles (C-NNN headings)

## Step 2 — Print the summary

In this exact shape (≤ ~25 lines total):

```
# Onboarding — <project name> — <today>

**Goal of this repo:** <one sentence from charter.md>

**Recent decisions:**
- DEC-NNN: <one line>
- DEC-NNN: <one line>
- DEC-NNN: <one line>

**Open backlog** (N items):
- BL-NNN: <one line> — revisit when: <trigger>
- BL-NNN: <one line> — revisit when: <trigger>
- BL-NNN: <one line> — revisit when: <trigger>
(+N more — see backlog.md)

**Last sessions:**
- S-NNN <date> — <goal> — <status>
- S-NNN <date> — <goal> — <status>
- S-NNN <date> — <goal> — <status>

**Active conventions:** C-001 (anti-stub), C-002 (append-only), <…>

**Ripe items the steward thinks are worth picking up today:**
- <BL-NNN if its revisit_when trigger has fired, else "none — your call">
- <…>

What's the goal for this session?
```

The last line **forces the session-goal ask** so the steward opens a
new `sessions.md` entry per the skill's lifecycle.

## Ripe-item heuristic

A backlog item is "ripe" if any of:
- Its `revisit_when` mentions a thing that's now true (e.g. "after auth
  lands" + most recent session's goal was auth-related and closed
  achieved).
- It's been open >90 days without progress.
- It's referenced by an active DEC entry's "consequences" or "revisit
  when" field.

If unsure, don't list it — better silence than noise.

## Anti-patterns

- Don't dump full file contents. Headline only.
- Don't list more than 5 backlog items. Use "+N more".
- Don't skip the goal-ask line.
- Don't suggest specific work the user didn't ask about — only surface
  ripe items by trigger match.
