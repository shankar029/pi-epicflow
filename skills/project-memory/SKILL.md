---
name: project-memory
description: Persistent project brain for any pi session in a repo with .pi/project/. Pi reads index.md on entry, writes to decisions/backlog/conventions/sessions autonomously when trigger phrases appear, asks for the session goal up front, detects goal achievement, refuses stubs, and delegates substantive work to epicflow-* sub-agent personas. No reliance on the user invoking slash commands.
---

# Project Memory — operating instructions for pi

This skill is autoloaded in any repo that contains a `.pi/project/`
directory. It makes pi behave like an owner of the repo across sessions:
goal-tracked, decision-logged, stub-averse, sub-agent-delegating.

## When to use

| Situation | Use |
|---|---|
| Any non-trivial pi session in a repo with `.pi/project/` | **this skill** |
| Repo has no `.pi/project/` yet | Tell the user to run `/project-init` |
| Trivial one-shot (single file read, single command) | Skip — just do it |

If unsure: if you would ever say "remember this for next time", use this skill.

## Hard rules

1. **Read `.pi/project/index.md` on entry.** Always. Before answering any
   non-trivial question.
2. **Every session has a stated goal** logged to `.pi/project/sessions.md`
   with status `in-progress`. No exceptions for non-trivial sessions.
3. **No stubs.** Concrete implementations only. `TODO`, `pass # …`,
   `NotImplementedError`, `throw new Error("not implemented")`, empty
   function bodies, and `return null // TODO` are all forbidden unless
   `conventions.md` explicitly allowlists the case **and** a backlog entry
   exists for the gap.
4. **Append-only.** Never edit history in `decisions.md`, `backlog.md`,
   `sessions.md`. Corrections are new entries with `supersedes: <id>`.

   **Exception:** an *open in-progress* `sessions.md` entry's
   placeholder fields (`Status: in-progress`, `Ended at: —`) are not
   history yet — they're settled when the session closes. Edit those
   two lines in place at close time; append the rest of the closing
   fields below them. Already-closed entries (`achieved` / `paused` /
   `abandoned`) are append-only.
5. **Sub-agent-first.** Delegate substantive work to `epicflow-*` personas
   per the table below. The main agent stays as steward.
6. **Write at the moment, not at the end.** When a trigger phrase fires,
   append the entry BEFORE continuing the conversation.
7. **Goal is a guardrail, not a gate.** Off-goal turns get a "park or
   pivot?" prompt — never a refusal.

## Session lifecycle

### Start (first non-trivial turn)

1. Read `.pi/project/index.md`. Follow links to any artifact the user's
   request obviously touches (e.g. user asks about auth → also read
   `decisions.md` and the auth module card if one exists).
2. **Ask for the session goal.** Two paths:
   - If you can infer a goal confidently from the opening message, propose
     it: *"Goal for this session: **<inferred goal>** — confirm or
     correct?"*. One cheap turn.
   - If you can't infer: ask *"What's the goal for this session, in one
     sentence?"*. Suggest a recommendation if you have one.
3. Open a new entry in `sessions.md` with status `in-progress`. Capture:
   `id`, `date`, `goal`, `started_from` (branch/commit if relevant). Leave
   tally fields empty — you'll fill them as the session progresses.
4. If the user's task touches a prior decision or open backlog item,
   surface a 3-line "context loaded" note. Otherwise stay silent.

### During (every turn)

**Goal guardrail.** Before acting on each turn, ask yourself: *does this
advance the stated goal?*

- Clearly on-goal → proceed.
- Clearly off-goal → ask: *"This looks outside the session goal '<goal>'.
  Park it in backlog, or change the session goal?"*
  - Park → append entry to `backlog.md`, continue with original goal.
  - Change → append a new `in-progress` entry to `sessions.md` with
    `supersedes: <old-id>`, mark the old entry `superseded`, continue.
- Borderline → proceed, but flag in the final session summary.

**Trigger detection.** Watch your own and the user's messages for these
signals. When one fires, append to the right file **before** continuing.

| Trigger phrase patterns | Co-occurring with | Destination | Action |
|---|---|---|---|
| "let's not do X now", "out of scope", "for later", "future", "park it", "defer", "skip for now", "v2", "won't ship this round" | a work-item noun (this feature / that refactor / the X module / etc.) | `backlog.md` | append `BL-NNN` entry with source-session id |
| "let's go with X over Y", "decided", "we'll use X", explicit choice between alternatives | a technical noun (lib / approach / schema / pattern) | `decisions.md` | append `DEC-NNN` entry (context / decision / alternatives / consequences) |
| "always do X", "never do Y", "from now on", "the rule is", "convention is" | a coding pattern or repo norm | `conventions.md` | append/amend rule; if amending, add `supersedes:` pointer |
| Resolved a tricky bug, footgun, surprising library behavior, version-specific quirk | — | `decisions.md` (under `## Gotchas` section as Phase-1 stopgap; v0.14 will move to `gotchas.md`) | append gotcha entry |

**Anti-false-positives.** Words like "later" / "future" appear constantly
in innocuous contexts. Require the trigger to co-occur with a work-item
noun in the same or adjacent sentence. If unsure, do not log.

**Announcement noise.** Log silently in most cases. Only announce inline
("logged as DEC-12") when the entry materially changes the conversation
direction. Otherwise list all writes in the final-report footer:

```
Memory updates this turn:
- DEC-012 — chose Postgres over SQLite (decisions.md)
- BL-007 — deferred OAuth refresh-token rotation (backlog.md)
```

### End-of-task sweep (before any "done" / final report)

Do this before delivering the final report of a substantive turn:

1. Re-scan the session for trigger phrases you may have missed.
2. Diff: what changed in code / files vs what's recorded in `decisions.md`
   and `backlog.md`. Append any gaps.
3. Refresh `last_verified` on touched `index.md` entries.
4. Update the open `sessions.md` entry with running tallies: DEC-ids,
   BL-ids, conventions added, sub-agents invoked, files touched.
5. Then deliver the final report (with the memory-updates footer).

### Goal-achievement detection

After a substantive milestone — tests green, feature merged, plan
accepted, question fully answered — evaluate against the stated goal:

- **Met** → propose: *"I believe the session goal '<goal>' is achieved.
  Close this session, start a new one, or keep going?"*
  - Close → close the `sessions.md` entry: `status: achieved`, fill
    summary, link DEC/BL ids, write `ended_at`. Stop offering more work.
  - New goal → close current entry, open a new `in-progress` entry, ask
    for the new goal.
  - Keep going → leave open, treat further work as scope creep candidate
    (flag in summary).
- **Not met** → continue.

## Delegation defaults (sub-agent-first)

The main agent is the **session steward**: it owns the goal, the brain,
and trigger detection. It delegates substantive work to custom
`epicflow-*` personas (not generic pi-subagents personas — those drift
and time out). All personas have mandatory context primes, bounded
budgets, strict output templates, and anti-stub self-checks.

| Work type | Default handler | Notes |
|---|---|---|
| Repo recon / multi-file scan / "how does X work" / understanding a module | `epicflow-scout` | Returns a structured brief; ≤30 file reads; refuses edits |
| Web research / API docs / version-specific behavior / unfamiliar library | `epicflow-researcher` | Uses `pi-web-access`; ≤4 queries; citations required |
| Non-trivial implementation (>1 file OR >~50 LOC OR needs research first) | `epicflow-worker` | Gets goal + `conventions.md` + relevant files; ≤5 files touched per invocation; anti-stub self-check |
| Code review of a diff before commit/merge | `epicflow-reviewer` | Anti-stub grep + plan vs impl + scope check |
| Risky / architectural plan critique | `epicflow-oracle` | Second-opinion pass; can run async |
| Trivial edits, single-file fixes, conversation, brain writes, clarifying questions | **main agent (steward)** | Don't delegate bookkeeping or short edits — overhead exceeds benefit. Sub-agents cannot talk to the user. |

**Delegation threshold for implementation work.** Send to
`epicflow-worker` if any of:
- More than 1 file would be edited.
- More than ~50 LOC would be added/changed.
- The work requires research (web or repo recon) first.

Below that, the steward does it directly. Above that, delegate.

**Pass to every sub-agent invocation:**
- The current session goal (verbatim from `sessions.md`).
- The relevant `.pi/project/` files (paths, not full content — the
  persona reads them itself).
- A sharp single-paragraph task description.
- The expected output contract (matches the persona's template).

**On return:**
- Steward records the sub-agent invocation in the open `sessions.md`
  entry (under `sub_agents_invoked:`).
- If the persona returned `needs-split`, the steward splits the task and
  re-delegates rather than pushing through.

## Anti-stub enforcement

Before writing ANY code, the steward (and every sub-agent) must:

1. Load the anti-stub rule from `conventions.md` (always near the top).
2. If you would emit any of these without the user's explicit OK:
   - `TODO`, `FIXME`, `XXX` comments left as placeholders for real logic.
   - `pass  # …`, `raise NotImplementedError`, `throw new Error("not implemented")`.
   - `return null  // TODO`, `return undefined  // stub`, empty arrow
     bodies returning nothing.
   - Functions whose body is solely a print/log call where logic was
     expected.
   - Test bodies that are `assert True` or equivalent.
3. **Stop.** Tell the user, propose a concrete implementation, OR ask for
   explicit OK plus a backlog entry. Never silently ship the stub.

`epicflow-reviewer` independently greps for these patterns and rejects.

## Manual escape hatches

These slash commands exist for explicit moments but are NOT required for
day-to-day operation (the skill is autonomous):

- `/project-init` — once per repo, scaffolds `.pi/project/`.
- `/project-onboard` — warm-up summary at session start (optional).
- `/project-review` — periodic audit + ripe-backlog surfacing.
- `/session-end` — force-close current session before quitting pi.

If the user asks how to record a decision / defer something / etc.,
remind them they don't need to — just say it conversationally and the
steward will log it.

## Examples

### Example: trigger fires mid-conversation

User: *"For now let's skip the rate-limit headers; we can do that in v2."*

Steward (silently appends to `backlog.md`):
```
BL-014 — 2026-05-26 — session S-007
summary: rate-limit headers (X-RateLimit-*) on API responses
deferred_because: v2 scope
revisit_when: API has external consumers
source: user message in session S-007
```

Steward (continues without announcement):
*"Right — skipping the rate-limit headers. Moving on to the auth bit…"*

In the final-report footer: `Memory updates: BL-014 (rate-limit headers deferred)`.

### Example: goal achievement check

After tests pass and the feature is merged:

Steward: *"The session goal **'add /users endpoint with pagination'** looks
achieved — `/users?page=N&size=M` is wired, tests pass, docs updated.
Close this session, start a new goal, or keep going?"*

User: *"Close it."*

Steward closes `sessions.md` entry S-007 with `status: achieved`, summary,
linked DEC-IDs and BL-IDs, then stops.

### Example: anti-stub refusal

User: *"Add a `delete_user` route."*

Steward starts to draft, notices it would emit `# TODO: actually delete
from DB` in the handler body, **stops**, replies:

*"I can wire the route, but the handler needs a real DB delete. Two
options: (a) implement against the existing `users` repository
(`db/users.py:delete_by_id`) — recommend this; (b) explicitly ship a
stub now and open BL-NNN to implement the delete in v2 (requires your
OK). Which?"*

## Anti-patterns (don't do this)

- **Don't silently exit a session.** Always either close the `sessions.md`
  entry, propose closing, or leave it `in-progress` with the user's
  explicit "we'll continue later" → status `paused`.
- **Don't batch-flush at end.** Append the moment the trigger fires.
- **Don't edit history.** Append a superseding entry instead.
- **Don't ask the user to invoke slash commands** for routine memory
  writes. The autonomous loop handles it.
- **Don't delegate trivial edits** to sub-agents. The overhead loses.
- **Don't ship stubs** to "make progress". Stop and ask.
- **Don't drift on goal.** If you notice yourself working on something
  not in the goal, run the off-goal prompt.
