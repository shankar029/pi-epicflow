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

### Operating principle: ASSUME INTERRUPTION

Write memory **during work**, not only at end-of-task sweep. Treat
every turn as potentially the last one before context is reset, the
session crashes, or the user walks away. Concretely:

- When a trigger phrase fires, append the `DEC` / `BL` / `C` / `L`
  entry **on that turn**, not at session-end.
- When you make a non-obvious implementation decision *in code* that
  the next reader will need to know, append the decision before moving
  on (don't batch and forget).
- The end-of-task sweep is a **safety net** to catch what slipped past
  during work, not the primary write phase.

Reason: the canonical failure mode of agent memory is the
end-of-session summarizer hallucinating or smoothing over the
"chose X over Y because Z" nuance. Writing eagerly, verbatim, in
the user's words preserves it.

### Start (first non-trivial turn)

1. **Read `.pi/project/index.md`.** Use its "Read for X" routing table
   at the top to decide which additional artifacts to load. Match the
   user's opening message against the table; load only the rows that
   match. If the task is ambiguous, default to `charter.md` +
   `conventions.md`. **Do not slurp every artifact on every session
   start** — progressive disclosure is the discipline that keeps the
   brain affordable as it grows.
2. **If `~/.pi/global-memory/index.md` exists, load it too** (after
   per-repo index, before any non-trivial action). The global overlay
   contributes cross-repo personal/team conventions and decisions.
   Conflict rule: **per-repo `.pi/project/` always wins**. Surface a
   one-line note when a per-repo entry overrides a global one.
3. **Restate the active ids you're working under.** Before any
   non-trivial action, name the specific `DEC-NNN` / `BL-NNN` / `C-NNN`
   / `L-NNN` / `Q-NNN` / `G-NNN` ids you just loaded and intend to
   honor on this turn. One line is enough: *"Working under DEC-003
   (custom personas), C-001 (anti-stub HARD RULE), C-003 (bash+ps1
   parity); BL-005 / 006 / 007 are the open items in scope."* Forces
   you to actually recall the brain's content rather than just having
   read past it, and gives the user a checkpoint to correct stale
   context before you act on it.
4. **Ask for the session goal.** Two paths:
   - If you can infer a goal confidently from the opening message, propose
     it: *"Goal for this session: **<inferred goal>** — confirm or
     correct?"*. One cheap turn.
   - If you can't infer: ask *"What's the goal for this session, in one
     sentence?"*. Suggest a recommendation if you have one.
5. Open a new entry in `sessions.md` with status `in-progress`. Capture:
   `id`, `date`, `goal`, `started_from` (branch/commit if relevant). Leave
   tally fields empty — you'll fill them as the session progresses.

   **In-progress line uniqueness invariant.** The placeholder line for
   the open session's `Status:` field is the **only** non-append edit
   permitted in `.pi/project/`. To keep that edit safe (now and for any
   future `str_replace`-style tooling), the in-progress marker MUST be
   byte-unique within `sessions.md`. Use the literal line
   `**Status:** in-progress (S-NNN open since YYYY-MM-DD HH:MM)` — the
   ISO timestamp + S-id pair guarantees uniqueness even when several
   closed sessions also contain `**Status:**` lines. When closing,
   replace that single line with `**Status:** achieved | paused |
   abandoned (closed YYYY-MM-DD HH:MM)`. Do not edit any other line.
6. If the user's task touches a prior decision or open backlog item,
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
| Resolved a tricky bug, footgun, surprising library behavior, version-specific quirk | — | `gotchas.md` | append `G-NNN` entry (symptom / root cause / fix / still-applies-if) |
| "we don't know yet", "we're still deciding", "open question", "need to figure out", "depends on X first" | a technical noun and no immediate decision in the same message | `questions.md` | append `Q-NNN` entry (context / alternatives / resolves-when / owner) |
| Resolved an open question previously logged as `Q-NNN` | — | `decisions.md` (`DEC-NNN` with `resolves: Q-NNN`) + flip the `Q-NNN` status line to `resolved (see DEC-NNN)` | both writes happen on the same turn |

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

## Global overlay (cross-repo brain, v0.14+)

If `~/.pi/global-memory/` exists, it's loaded **after** per-repo
`.pi/project/` on session entry. The overlay holds cross-repo personal/
team preferences that you don't want to re-state in every repo's
`conventions.md`.

**Read order on session start:**

1. `.pi/project/index.md` (per-repo, mandatory).
2. Artifacts matched by the per-repo "Read for X" routing table.
3. `~/.pi/global-memory/index.md` (global, optional — skip silently
   if absent).
4. Global artifacts matched by the global routing table.

**Conflict rule — per-repo always wins.** When a per-repo entry
contradicts a global entry on the same topic (e.g., per-repo
`C-007` mandates `black` for formatting while global `GC-003` says
`ruff format`), the per-repo rule applies. The agent surfaces a
one-line note like:

```
Note: per-repo C-007 overrides global GC-003 (formatter: black vs ruff format).
```

**Write triggers — explicit cross-repo phrasing only.** Bare
"always do X" without cross-repo framing still fires the per-repo
trigger. Use these for global:

| Trigger phrase patterns | Destination | Action |
|---|---|---|
| "globally always X", "across all my repos", "in every <lang> project of mine", "as a personal rule" | `~/.pi/global-memory/conventions.md` | append `GC-NNN` entry |
| "I always go with X for new projects", "my default is X" | `~/.pi/global-memory/decisions.md` | append `GD-NNN` entry |

**Anti-false-positives.** "I'll always remember that" / "I always
forget" are NOT triggers — they're conversational. The trigger
requires explicit cross-repo framing ("all my repos", "every project",
"in any new project", "as a personal rule").

**Writes go to global only when triggered by global phrasing.** When
in doubt, append to per-repo. A per-repo entry can later be promoted
to global if a pattern emerges across multiple repos (the
`epicflow-steward` will flag candidates during `/project-review`).

**Initialization.** Run `/project-init-global` once per user account
to lay down `~/.pi/global-memory/` from templates. The prompt is
idempotent and refuses to overwrite an existing directory (matches
the `/project-init` v0.13.1 hardening).

## Capacity & rollover (size + age caps)

The brain is append-only; it grows monotonically. To keep load-cost
bounded and `last_verified` accurate, each artifact has a soft cap.
When a cap is exceeded, `/project-review` recommends a **rollover** —
renaming the old file to an archive and starting a fresh live file.
Rollover is **never automatic**; the user confirms.

| Artifact | Entry cap | Age cap | Archive name |
|---|---|---|---|
| `decisions.md` | 500 entries | any entry > 2 years | `decisions-archive-<YYYY>.md` |
| `backlog.md`   | 200 entries | any open entry > 180 days | `backlog-archive-<YYYY>.md` |
| `sessions.md`  | 150 entries | any closed entry > 1 year | `sessions-archive-<YYYY>.md` |
| `gotchas.md`   | 200 entries | any entry > 2 years | `gotchas-archive-<YYYY>.md` |
| `questions.md` | 50 open + 200 resolved | any open > 1 year | `questions-archive-<YYYY>.md` |
| `conventions.md` | no cap (active rules only) | superseded rules pruned at rollover | n/a |
| `charter.md`   | no cap (rarely changes) | n/a | n/a |

**Rollover recipe** (recommended by `/project-review`, executed by
user confirmation):

1. Pick the cut-off (entry id or date). Everything *strictly before* it
   goes to the archive.
2. `git mv decisions.md decisions-archive-<YYYY>.md` (or copy the
   relevant entries; either is fine — stable ids survive).
3. Create a fresh `decisions.md` with the live header + entries after
   the cut-off.
4. Add an **Archives** row to `index.md` pointing at the new file.
5. **Stable ids never recycle.** If `decisions-archive-2024.md` ends at
   `DEC-487`, the live file starts at `DEC-488`. Cross-references stay
   valid.
6. Commit with a clear message (`chore: rollover decisions.md →
   decisions-archive-2024.md`).

**When loading on session start** (per the SKILL.md "Start" step):
load the live file first; load archives only when an explicit grep for
an id (e.g. `DEC-042`) requires it. The progressive-disclosure
`index.md` table is the discoverability layer.

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
