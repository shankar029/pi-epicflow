# Show HN / dev.to / social drafts

Pick the shortest one that fits the venue.

---

## Show HN title (80 char limit)

```
Show HN: pi-epicflow v0.13 — file-based project memory so AI agents stop forgetting
```

(76 chars)

Alternates:
- `Show HN: A file-based brain so AI coding agents stop forgetting across sessions`
- `Show HN: Autonomous project memory for AI coding agents (file-based, per-repo)`

## Show HN body

Hey HN — I'm the author of pi-epicflow, a [pi](https://pi.dev)
extension for shipping multi-feature work as one clean PR. Just cut
v0.13 which adds a second pillar I think generalizes beyond pi.

**The problem:** every AI coding agent session starts cold. Decisions
made yesterday don't carry forward. Out-of-scope items get forgotten.
The agent re-asks questions and re-decides parked designs. Worse, it
ships `TODO: implement later` stubs that look done but aren't.

**The fix:** six append-only Markdown files under `.pi/project/` —
`charter.md` (goal/non-goals), `conventions.md` (always/never), `decisions.md`
(ADR-lite), `backlog.md` (deferred work + revisit triggers),
`sessions.md` (per-session log), `index.md` (router). The agent reads on
entry and writes autonomously when trigger phrases appear in
conversation ("defer to v2" → `BL-NNN`, "let's go with X over Y" →
`DEC-NNN`, "always do Y" → `C-NNN`).

A few design choices that took several iterations to land:

- **Trigger-moment writes, not end-of-session flushes.** Sessions crash.
  End-of-session batches lose data.
- **Work-noun co-occurrence required for triggers.** "I'll get back to
  you later" doesn't fire. "Let's defer the rate-limit headers to v2"
  does.
- **Goal as guardrail, not gate.** Off-goal turns prompt "park or
  pivot?" — the agent never refuses work.
- **Append-only with supersedes.** History of *how* a project changed
  its mind matters as much as current state.
- **Anti-stub as a hard rule.** No `TODO` / `FIXME` /
  `NotImplementedError` / bare-`pass` in shipped code. Enforced by a
  grep gate in the reviewer.

Dogfooded the design on the pi-epicflow repo itself. First-run
inference extracted 5 architecture decisions and 4 conventions from the
existing README/CHANGELOG without any manual seeding. The first audit
pass caught a real pre-existing bug (one operator script missing its
PowerShell mirror) that had escaped 12 prior releases.

The whole thing is ~1k LOC of Markdown + 5 custom sub-agent personas.
Vendor-neutral enough to port — the SKILL.md is a spec, not pi-specific
plumbing.

Repo: https://github.com/shankar029/pi-epicflow
Release notes: https://github.com/shankar029/pi-epicflow/releases/tag/v0.13.0
Blog post: https://github.com/shankar029/pi-epicflow/blob/main/docs/announcements/blog-project-memory.md

Happy to answer questions about the design tradeoffs, why it's
file-based not DB-based, why six artifacts not nine, and the trigger
false-positive calibration that took ~30 sessions to dial in.

---

## Twitter / X thread (5 tweets)

**Tweet 1**
Just shipped pi-epicflow v0.13 — a file-based project memory pillar for AI coding agents.

Your agent has amnesia. Every session starts cold. Yesterday's decisions evaporate. Today's session re-decides them. The fix is a brain that lives on disk and writes itself. 🧵

**Tweet 2**
Six append-only files under `.pi/project/`:

• charter.md — goal, non-goals
• conventions.md — always/never rules
• decisions.md — ADR-lite log
• backlog.md — deferred work + revisit triggers
• sessions.md — per-session log
• index.md — router

Read on entry. Write on triggers.

**Tweet 3**
The agent watches the conversation for trigger phrases and writes the moment they fire — not at session end.

"defer rate-limiting to v2" → BL-014 (immediately)
"go with sqlite over postgres" → DEC-007 (immediately)
"always validate at the boundary" → C-005 (immediately)

Sessions crash. Trigger-moment writes don't.

**Tweet 4**
Hard rule (C-001): no TODO / FIXME / NotImplementedError / bare-`pass` in shipped code.

Enforced by a `rg` gate in the reviewer persona.

Eliminates ~90% of "looks done, isn't" failure mode. Worth shipping for this alone.

**Tweet 5**
Dogfooded on the repo itself. First audit pass on existing code caught a real bug that escaped 12 prior releases: one operator script missing its PowerShell mirror.

If the brain catches your first bug on day one, it's worth keeping.

Repo: https://github.com/shankar029/pi-epicflow

---

## dev.to / Hashnode short post

**Title:** "Your AI coding agent has amnesia. Here's a file-based brain that fixes it."

(Use the full vendor-neutral blog post at `blog-project-memory.md`.
Crosspost canonical URL → the GitHub blob URL once committed.)

**Tags:** ai, llm, devtools, productivity, opensource

---

## LinkedIn (paragraph form)

Shipped pi-epicflow v0.13 today — a project memory pillar for AI
coding agents. Six append-only Markdown files at `.pi/project/` that
your agent reads on session entry and writes to autonomously when
trigger phrases fire in conversation ("defer X to v2", "let's go with
A over B", "always do Y"). Solves the everyday pain of agent sessions
starting cold, decisions evaporating across runs, and stubs that look
done but aren't (the hardest agent failure mode to catch). Vendor-
neutral enough to port beyond pi — the SKILL.md is a spec, not a
binding. Dogfooded on the repo itself: first audit caught a
pre-existing bug that escaped 12 prior releases. Worth a look if you've
been running AI coding agents in production for more than a few weeks.

Link: https://github.com/shankar029/pi-epicflow

---

## Email to existing users / mailing list

**Subject:** pi-epicflow v0.13.0 — project memory (the second pillar)

Hi —

v0.13.0 is out. It adds a second pillar to pi-epicflow alongside the
epic workflow: a persistent, file-based **project brain** at
`.pi/project/` that solves the everyday "pi sessions forgetting across
runs" pain.

**TL;DR:** drop into any repo, run `/project-init`, answer 4 questions.
After that, pi reads your project brain on every session entry and
writes to it autonomously when trigger phrases appear in conversation.
No more re-asking the same questions. No more re-deciding parked
designs. No more stubs that look done but aren't.

**Highlights:**

- 6 brain artifacts (charter / conventions / decisions / backlog /
  sessions / index)
- 5 custom `epicflow-*` sub-agent personas with mandatory project-context
  primes and bounded budgets
- Hard anti-stub rule (`C-001`) enforced at worker + reviewer gates
- One-time `/project-init`; everything else is autonomous

**No breaking changes.** Repos without `.pi/project/` see zero behavior
change. Opt in per-repo.

Release notes:
https://github.com/shankar029/pi-epicflow/releases/tag/v0.13.0

Long-form rationale:
https://github.com/shankar029/pi-epicflow/blob/main/docs/announcements/blog-project-memory.md

Thanks for shipping with this. v0.14 will likely focus on Phase 2
artifacts (gotchas/questions/module cards) once we have 2 weeks of
real-user signal on the Phase 1 surface.

— Shankar
