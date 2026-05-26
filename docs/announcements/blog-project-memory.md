# Your coding agent has amnesia. Here's a file-based brain that fixes it.

*Posted on the v0.13.0 release of [pi-epicflow](https://github.com/shankar029/pi-epicflow). Vendor-neutral — the design applies to any agentic coding workflow.*

---

You ship a feature with an AI coding agent on Tuesday afternoon. You
make three architectural decisions along the way ("we're caching in
Redis, not Postgres", "client-side timezone is the source of truth",
"defer the multi-tenant story to v2"). The feature lands. You close
your laptop.

Wednesday morning you open a fresh agent session in the same repo.
The agent has no idea those three decisions exist. It asks you whether
to cache in Postgres or Redis. It assumes server-side timezones. It
helpfully starts laying foundations for the multi-tenant story you
explicitly parked.

This isn't a memory bug. The agent is working as designed — every
session is a fresh context. The bug is that **the project itself has no
brain**. Yesterday's decisions evaporated because nothing wrote them
down in a way today's session can read.

## What people try first (and why it doesn't stick)

Three common patches, all of which work for about a week:

**1. "Just add it to AGENTS.md / .cursorrules / .clinerules."**
Works until your `AGENTS.md` is 800 lines of accumulated rules and the
agent's context budget says no.

**2. "Tell the agent to write a `notes.md` at the end of each session."**
Works until a session crashes mid-flight and the notes never get
written. Or the agent batches three days of work into one note dump
and loses the trigger-to-decision linkage.

**3. "Just point the agent at the CHANGELOG."**
Works for shipped releases. Doesn't help with in-flight decisions,
deferred work, or session-level "we tried X and rejected it" notes
that never warrant a release-level entry.

All three share a deeper problem: they treat memory as a side effect of
something else (rules, sessions, releases) rather than a first-class
concern with its own discipline.

## The design that holds up

After ~50 sessions of trying variants, the shape that survives looks
like this:

### Six files, append-only, under a known path

```
.pi/project/
├── index.md         ← always-loaded router (≤150 lines)
├── charter.md       ← goal, non-goals, quality bar, owner persona
├── conventions.md   ← always/never rules (incl. anti-stub)
├── decisions.md     ← ADR-lite log: choice, alternatives, consequences
├── backlog.md       ← deferred work, each with a revisit-trigger
└── sessions.md      ← per-session log: goal, status, summary, links
```

The path matters less than the discipline:

- **Append-only.** Nothing is edited or deleted. Reversals are new
  entries with `supersedes: <old-id>`. The history of *how* a project
  changed its mind is as valuable as the current state.
- **Each entry has a stable id** (`DEC-001`, `BL-014`, `C-003`,
  `S-042`). Stable ids let one file reference another and let future
  audits track ripeness.
- **Each entry has a revisit-trigger.** `revisit_when: after auth
  lands` or `revisit_when: if a real user asks` or
  `revisit_when: >90 days with no movement → drop`. Without a trigger,
  the backlog rots.

### Trigger-driven writes (not batched flushes)

The agent watches the conversation for trigger phrases and writes the
entry *the moment the phrase fires*, not at session end:

| User utterance | Lands in | At |
|---|---|---|
| "defer X to v2" / "out of scope" (with work-noun) | `backlog.md` (`BL-NNN`) | immediately |
| "let's go with X over Y" (with technical noun) | `decisions.md` (`DEC-NNN`) | immediately |
| "always do X" / "never do Y" / "from now on" | `conventions.md` (`C-NNN`) | immediately |
| Goal advanced / milestone hit | `sessions.md` (`S-NNN` update) | at the moment of acknowledgment |

The "immediately" matters. Sessions crash. Tokens run out. The dog
needs to be let out. End-of-session batch writes lose data; trigger-
moment writes don't.

Three triggers we explicitly *don't* match: bare "later" without a
work-noun ("I'll get back to you later" is conversational, not
deferral); bare "decided" without a technical noun ("decided to take a
break" isn't a DEC); compliments without rules ("X always works well"
is praise, not a convention). The false-positive rate matters more than
the recall rate — a brain that writes spurious entries gets ignored
within a week.

### A guardrail goal, not a gate

Every non-trivial session opens with a stated goal:

> **Goal:** Make `notesd list --since=<X>` accept "yesterday", "today",
> and ISO dates.

The goal is **not** a hard gate (the agent won't refuse off-goal work
— that's tyrannical). It's a guardrail: when an off-goal turn appears,
the agent prompts "park this, or pivot the session goal?". The user
decides. The brain records.

Two things this catches that nothing else catches:

1. The agent helpfully expanding scope (the "while I'm here, let me
   refactor X" failure mode).
2. The user opening a tab on something unrelated and forgetting to
   close the original goal.

### Anti-stub as a first-class convention

The most pernicious failure mode of agentic coding: code that *looks*
done but is actually stubs.

```python
def parse_user_input(text: str) -> User:
    # TODO: implement properly
    return None  # FIXME
```

This passes "did the agent finish?" checks because there's a function,
there's a return statement, there's even a comment. It fails the only
check that matters: "would this work in production?"

The fix is a hard rule (`C-001` in the convention shape above):

> **No `TODO` / `FIXME` / `XXX` / `NotImplementedError` / bare-`pass` /
> stub-returning-`null` bodies in shipped code, ever.**

Enforced two places:

1. **Worker self-check** at end of every implementation pass:
   ```bash
   rg -nP '\b(TODO|FIXME|XXX)\b' <touched files>
   ```
   If hits, the worker fixes them before declaring done.

2. **Reviewer hard gate** before any APPROVE verdict. Same grep, same
   patterns, same allowlist (escape valves for *files that document*
   the rule itself).

Together these eliminate ~90% of the "looks done, isn't" class of
failures. The remaining 10% (incorrect-but-real implementations) need
real testing.

### Sub-agent personas with mandatory project-context primes

The thing nobody mentions about "delegate to sub-agents" workflows: a
*generic* sub-agent fired into your repo answers as if your project
didn't exist. It cites no decisions. It doesn't know your conventions.
It re-invents wheels you explicitly rejected three weeks ago.

The fix is custom personas with two mandatory contracts:

1. **Prime on `.pi/project/index.md` + relevant artifacts before
   producing output.** Not optional. Hard-coded into the persona's
   system prompt.
2. **Strict structured output template.** No "well, it depends" prose.
   Bounded budget (≤30 reads, ≤4 web queries, etc.) so the persona
   doesn't drift or time out.

Five personas cover the bases:

- **`scout`** — read-only repo recon, returns a structured brief
- **`researcher`** — web research with citation requirements
- **`worker`** — bounded impl (≤5 files), with anti-stub self-check
- **`reviewer`** — independent diff review with anti-stub gate
- **`oracle`** — top-3-risks architectural critique

When this design fired for real on a 6-line `parse_since` function in a
small Python CLI, the scout caught two real footguns the steward had
missed (a `fuzzy=True` over-acceptance bug class and a year-rollover
ambiguity in partial-date inputs). Generic sub-agents don't do this
because they don't know the project's quality bar.

## The cost

This isn't free.

**You write more.** Every session opens with a one-sentence goal. Every
"defer X" produces a paragraph. Every "let's go with X over Y" produces
a 4-section ADR-lite entry. For a 30-minute session, expect ~5 minutes
of brain writes.

**You commit text.** `.pi/project/` is a real file tree under version
control. It changes on every meaningful session. Your `git log` shape
shifts.

**The agent needs a discipline budget.** Trigger detection takes
attention. Every turn the agent has to scan the user's utterance
against trigger patterns. In a long session this is real cognitive
overhead.

**False positives are expensive.** A brain that writes a BL entry for
every conversational "later" gets ignored. The trigger rules have to be
tight — work-noun co-occurrence required, not bare keyword match.

## Whether to adopt it

This is overkill for:

- Solo single-file scripts where nothing persists across sessions
- One-off prototypes you'll throw away within 48 hours
- Pure code-review or read-only workflows

It earns its keep when:

- You're 2+ weeks into a project and have shipped at least 3 sessions
- You're returning to a repo after >1 week and the agent can't
  reconstruct prior decisions
- You've shipped at least one "stub that looked done" bug
- You have ≥2 collaborators (human or AI) on the same repo

If those describe you, the cost (~5 min/session) is paid back the first
time the agent doesn't re-ask a question or re-decide a parked design.

## See it run

The [pi-epicflow](https://github.com/shankar029/pi-epicflow) extension
implements all of the above as a `project-memory` skill + 5 custom
sub-agent personas + 4 slash commands, shipped as v0.13.0. The skill
file ([`SKILL.md`](https://github.com/shankar029/pi-epicflow/blob/main/skills/project-memory/SKILL.md))
is the canonical spec; it's vendor-neutral enough to port to any agent
runtime that supports skill autoload and structured sub-agents.

The brain on this very repo
([`.pi/project/`](https://github.com/shankar029/pi-epicflow/tree/main/.pi/project))
is the result of running the design on itself. It was generated on
first run by inferring goal, conventions, and decisions from the
existing README, CHANGELOG, and PLAN files — no manual seeding. The
first audit pass found a real pre-existing convention violation (one
operator script was missing its PowerShell mirror) that had escaped
twelve prior releases.

Memory is the cheapest feature you're not shipping. Ship it.
