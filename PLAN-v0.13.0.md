# pi-epicflow v0.13.0 — Project Memory Pillar

**Goal:** Give every pi session in a repo a persistent, structured "project
brain" that pi reads on entry and writes to autonomously — no reliance on
the user invoking slash commands to flush state.

**Status:** done — v0.13.0 ready to tag and publish

---

## Why

Today, pi sessions are amnesiac. Decisions, deferred work, gotchas,
conventions, and lessons learned all evaporate at session end. The user
either re-discovers them next session or never does. Epicflow already
solved this *inside an epic* (`decomposition.yaml`, `deviations.md`,
`lessons.md`). v0.13 generalizes it to the whole repo, for ambient
day-to-day work outside formal epics.

## Design principles

1. **Eager small writes, not batch flushes.** Pi appends to the brain at
   the moment a triggering utterance/decision happens, not at session end.
   This survives crashed sessions, dropped connections, forgotten /sync.
2. **Trigger-driven, not command-driven.** Slash commands exist for
   bootstrap and explicit review, but the steady-state loop is autonomous.
3. **Tiered context.** A tiny `index.md` is always loaded; everything else
   is pulled on demand. Keeps context budget low.
4. **Append-only by default.** Pi never silently rewrites history;
   corrections are new entries that supersede old ones (with a pointer).
5. **No stubs.** Concrete-only implementations unless `conventions.md`
   explicitly allowlists a stub with a backlog ticket.
6. **Read on entry, write on trigger, sweep before report.** Three
   moments, no others.
7. **Main agent = session steward, not implementer.** The main agent
   owns the goal, the brain, and trigger detection. Substantive work
   (research, implementation, review) is delegated to sub-agents so the
   main context stays small and on-goal. Bookkeeping writes stay in the
   main agent (small, fast, must be visible to the steward).
8. **Every session has a stated goal.** Pi asks for it on the first
   non-trivial turn, logs it to `sessions.md`, and uses it as a drift
   guardrail — not a hard gate. Pivots are allowed but logged as
   supersedes.

---

## Phase 1 deliverables (this release)

### Artifacts created by `/project-init`

All under `.pi/project/`:

| File | Purpose | Append/Rewrite | Trigger to write |
|---|---|---|---|
| `index.md` | Router. 50–150 lines. Lists every other file with 1-line summary + `last_verified` date. Always loaded. | rewrite on structural change | when a new artifact is added or `last_verified` refreshed |
| `charter.md` | Project goal, non-goals, quality bar, owner persona ("pi owns this repo"). | rewrite (rare) | only on `/project-init` or explicit re-charter |
| `conventions.md` | Coding norms, anti-stub rule, naming, error handling, "always/never" rules. | append (new rule) or amend (rule change w/ supersede pointer) | when user says "always X" / "never Y" / "from now on …" |
| `decisions.md` | ADR-lite. Each entry: id, date, context, decision, alternatives, consequences. | append-only | when a non-trivial choice is made between ≥2 viable options |
| `backlog.md` | Parking lot. Each entry: id, date, source-session, summary, rationale-for-deferring, suggested-trigger-to-revisit. | append-only | when user says "not now / later / out of scope / future / park it" |
| `sessions.md` | Append-only log of every session. Each entry: id, date, goal, status (`in-progress` / `achieved` / `paused` / `abandoned` / `superseded`), summary, decisions-made (DEC-ids), backlog-added (BL-ids), conventions-added, sub-agents-invoked, files-touched, supersedes (if pivot). | append-only | on session start (open entry), on goal change (supersede), on session end (close entry) |

### New custom sub-agent personas (replace generic pi-subagents personas)

All under `agents/`, registered via `install/`. Each persona has: a sharp
single-responsibility system prompt, mandatory context-priming reads, hard
scope bounds, a strict output template, and anti-stub self-check.

| Persona file | Replaces | Hard rules |
|---|---|---|
| `agents/epicflow-scout.md` | `scout` | Reads `.pi/project/index.md` first; ≤30 file reads; refuses edits; output = `purpose / public API / invariants / gotchas / pointers` brief |
| `agents/epicflow-researcher.md` | `researcher` | Uses `pi-web-access`; ≤4 search queries; output = answer + ≥2 primary-source citations + version notes; refuses if no web research needed |
| `agents/epicflow-worker.md` | `worker` | Mandatory reads: session goal, `conventions.md`, relevant module files; anti-stub self-check; ≤5 files touched per invocation (else bounces back to steward with split proposal); output = diff summary + decisions discovered + deferred items |
| `agents/epicflow-reviewer.md` | `reviewer` | Reads diff + plan + `conventions.md`; runs anti-stub grep (`TODO`, `NotImplementedError`, `pass\s*#`, empty bodies); output = pass/fail + findings with `file:line` |
| `agents/epicflow-oracle.md` | `oracle` | Reads plan + `charter.md` + `decisions.md`; output = top-3 risks + alternatives + recommendation in fixed format; can run async |

**Anti-timeout tactics shared by all personas:**
- Bounded tool-call budgets stated up-front; on overrun, return partial
  result + `needs-split` flag instead of pushing through.
- Optional `progress.md` written into the run dir so the steward can
  read partial results if the persona dies mid-run.
- Long-running personas (`epicflow-oracle`, big `epicflow-scout`) can
  be invoked async; steward checks status later.

### New skill: `project-memory` (autoloaded in repos with `.pi/project/`)

Lives at `skills/project-memory/SKILL.md`. Instructs pi to:

**On session start (first non-trivial turn):**
- Read `.pi/project/index.md`.
- If the user's request maps to a known module / decision area, read the
  relevant linked file (e.g. `decisions.md`) before answering.
- **Ask for the session goal** (one sentence). If pi can infer it from
  the user's opening message, propose it and ask "goal for this session:
  '<inferred>' — confirm or correct?". Open a new entry in `sessions.md`
  with status `in-progress`.
- Surface a 3-line "context loaded" only if the user's task touches a
  prior decision/backlog item; otherwise stay silent.

**Goal guardrail (every turn):**
- Before acting, check: does this turn advance the stated goal?
- If clearly off-goal: ask the user "this looks outside the session goal
  '<goal>'. Park it in backlog, or change the session goal?"
  - Park → append to `backlog.md`, continue with original goal.
  - Change → append supersede entry to `sessions.md` (old entry →
    `superseded`, new entry → `in-progress`), continue with new goal.
- If borderline: proceed but note the drift in the eventual session
  summary.

**Goal-achievement detection:**
- After a substantive milestone (tests green, feature merged, question
  answered, plan accepted), evaluate: is the stated goal met?
- If yes: propose "I believe the session goal '<goal>' is achieved.
  Close this session, start a new one, or keep going?"
  - Close → write closing entry to `sessions.md` (status `achieved` +
    summary + linked DEC/BL ids), stop.
  - New goal → close current, open new entry, ask for the new goal.
  - Keep going → leave open, treat further work as scope creep candidate.

**Continuous (every turn) — detect trigger phrases and write immediately:**

Pi watches its own and the user's messages for these signals and writes
**before** continuing the conversation:

| Trigger signal | Destination | Action |
|---|---|---|
| "let's not do X now", "out of scope", "future", "park it", "defer", "skip for now", "v2", "later" | `backlog.md` | append entry; tell user "logged as BL-NNN" |
| "let's go with X over Y", "decided", "we'll use X", choice between alternatives | `decisions.md` | append ADR entry; tell user "logged as DEC-NNN" |
| "always do X", "never do Y", "from now on", "the rule is", "convention is" | `conventions.md` | append/amend rule; tell user "logged in conventions.md" |
| Resolved a tricky bug, footgun, surprising behavior, version-specific quirk | `gotchas.md` (Phase 2; in v0.13 → appended to bottom of `decisions.md` under a `## Gotchas` section as a stopgap) | append entry |
| User asked the same question a 2nd time, or pi had to re-derive something it should know | trigger `index.md` audit | flag stale/missing entry |

**On end-of-task sweep (before pi gives a "done" / final report):**
- Re-scan the session for any trigger phrases pi missed.
- Diff: what changed in code vs what's recorded in `decisions.md` /
  `backlog.md`. Append any gaps.
- Refresh `last_verified` on touched index entries.
- Update the open `sessions.md` entry with running tallies (DEC/BL
  added, sub-agents invoked, files touched).
- Then deliver the final report.

**Delegation defaults (sub-agent-first):**
The main agent stays as steward and delegates substantive work. Rules:

| Work type | Default handler | Notes |
|---|---|---|
| Repo recon / multi-file scan / "how does X work" | `scout` sub-agent | Returns a brief; main context stays clean |
| Web research / API docs / version-specific behavior | `researcher` sub-agent | Uses `pi-web-access` internally |
| Non-trivial implementation (>1 file or >~50 LOC) | `worker` sub-agent | Gets the session goal + relevant `.pi/project/` files as context |
| Code review of a diff | `reviewer` sub-agent | Includes anti-stub grep |
| Risky / architectural plan critique | `oracle` sub-agent | Second-opinion pass before commit |
| Trivial edits, single-file fixes, conversation, brain writes | **main agent** | Don't delegate bookkeeping or short edits — overhead exceeds benefit |
| Clarifying questions to the user | **main agent only** | Sub-agents can't talk to the user |

All delegations go to `epicflow-*` personas (not generic pi-subagents
personas) for the reasons in the persona section above.

Main agent's job per turn: triage → delegate or do → on return, record
outcome to `sessions.md` + relevant brain file → check goal status.

**Anti-stub enforcement:**
- Before writing any code, pi loads `conventions.md`'s anti-stub rule.
- If pi would emit `TODO`, `pass  # …`, `NotImplementedError`, `throw
  new Error("not implemented")`, `return null  // TODO`, empty
  function body, etc.: stop, tell the user, propose concrete impl OR
  ask for explicit OK + backlog entry.
- Reviewer (epicflow's existing `feature-reviewer` + a new ambient grep
  in the skill) rejects undeclared stubs.

### Slash commands

| Command | When to use | Behavior |
|---|---|---|
| `/project-init` | Once per repo | Interview (3–4 questions w/ recommended defaults), scaffold `.pi/project/`, update root `AGENTS.md` to reference `index.md`, commit on a branch. |
| `/project-onboard` | Optional — at start of a new session if user wants a warm-up | Pi reads `index.md` + last 3 entries of `decisions.md` + open `backlog.md` items + last 3 `sessions.md` entries, gives a 5-line "where we are" summary. |
| `/project-review` | Periodic, user-invoked | Pi audits `.pi/project/` for staleness, surfaces 3–5 ripe backlog items, proposes promoting some to an epic via `/epic-design`. |
| `/session-end` | Optional manual close | Forces the steward to write the closing `sessions.md` entry now (useful before quitting pi). Pi normally proposes this autonomously on goal achievement. |

**Note:** no `/project-sync` or `/session-start` commands. Both are
autonomous per the skill (session-start triggers on first non-trivial
turn; sync triggers on phrase detection + end-of-task sweep).

### `AGENTS.md` integration

`/project-init` appends a short section to the repo's root `AGENTS.md`:

```md
## Project memory (pi-epicflow)

This repo uses pi-epicflow's project-memory pillar. Before answering
non-trivial questions, read `.pi/project/index.md` and follow links to
relevant artifacts. Write to `decisions.md` / `backlog.md` /
`conventions.md` immediately when a triggering phrase appears (see
`skills/project-memory/SKILL.md`). Do not emit stubs.
```

---

## Phase 2 (deferred — logged in epicflow's own backlog)

- `gotchas.md`, `questions.md`, per-module cards (`.pi/modules/<name>.md`).
  (Session journal subsumed by `sessions.md` in Phase 1.)
- `repo-steward` subagent for periodic audits.
- Stale-detection on `last_verified` dates.
- Pre-commit hook for anti-stub grep.
- Optional global brain (`~/.pi/global/lessons.md`).

## Phase 3 (deferred)

- Cross-repo lessons sync.
- Auto-promote backlog → epic when a backlog item accumulates N
  "encountered again" markers.

---

## Open design questions

- [ ] **Trigger sensitivity.** Too eager → noise ("logged as DEC-12"
  spam). Too lazy → misses things. **Recommend:** only announce the log
  when the entry materially affects the conversation; otherwise log
  silently and mention in the final report's "memory updates" footer.
- [ ] **Conflict handling.** What if pi logs a decision the user later
  reverses mid-session? **Recommend:** append a superseding entry
  pointing back to the original (`supersedes: DEC-007`). Never edit
  history.
- [ ] **False-positive triggers.** "later" appears in lots of innocuous
  contexts. **Recommend:** require the trigger to co-occur with a *work
  item noun* ("this feature", "that refactor", "the X module") within a
  short window; otherwise ignore.
- [ ] **Goal as guardrail vs gate.** **Recommend guardrail** (asks before
  blocking) — gates frustrate users on legitimate pivots.
- [ ] **Inferred goal vs asked goal.** If pi can infer a goal confidently
  from the opening message, should it ask or just propose? **Recommend
  propose-and-confirm** ("goal: <X> — confirm/correct?") — one cheap
  turn, no friction, and corrects bad inferences.
- [ ] **Delegation threshold for implementation.** When exactly does an
  edit graduate from "main agent" to "`worker` sub-agent"? **Recommend
  >1 file OR >~50 LOC OR requires research first** — below that, the
  sub-agent overhead exceeds the context savings.

---

## Steps

- [x] 1. Scaffold `skills/project-memory/SKILL.md` with: trigger
      taxonomy, read/write rules, anti-stub rule, session-goal lifecycle
      (ask → guardrail → achievement detection → close), delegation
      defaults table referencing `epicflow-*` personas. ✅ 2026-05-26
- [x] 1b. Author 5 custom personas: `agents/epicflow-{scout,researcher,worker,reviewer,oracle}.md`
      with mandatory primes, bounded budgets, strict output templates,
      anti-stub self-check. ✅ 2026-05-26
- [ ] 2. Write `prompts/project-init.md` (the slash command body) — the
      interview script + scaffold writer. ✅ 2026-05-26
- [ ] 3. Write `prompts/project-onboard.md`, `prompts/project-review.md`,
      `prompts/session-end.md`. ✅ 2026-05-26
- [ ] 4. Add template files: `templates/project/index.md`, `charter.md`,
      `conventions.md` (with anti-stub rule baked in), `decisions.md`,
      `backlog.md`, `sessions.md`. ✅ 2026-05-26
- [x] 5. Extend `agents/feature-reviewer.md` with an anti-stub grep check
      that respects the `conventions.md` allowlist. ✅ 2026-05-26
- [x] 6. Update root `README.md` with a "Project memory" section + the
      session-steward / delegation model. ✅ 2026-05-26
- [x] 7. Update `install/` scripts to register the new skill + commands.
      ✅ 2026-05-26 — postinstall already auto-discovers agents (L-050);
      `pi.skills` / `pi.prompts` cover the new skill + 4 prompts;
      added `templates/**/*` to `package.json` `files` glob.
- [x] 8. Update `CHANGELOG.md` with v0.13.0 entry. ✅ 2026-05-26
- [x] 9. Dry-run on this very repo (`pi-epicflow`) — run
      `/project-init`, exercise a few sessions, verify autonomous goal
      ask + writes + achievement detection happen at the right moments.
      ✅ 2026-05-26 — two dry-runs:
      (a) sample notesd CLI in `/tmp/sample-notesd/` exercised trigger
      detection, false-positive resistance, anti-stub PASS+FAIL, and
      live persona spawn (`epicflow-scout`, 6/30 reads, surfaced 2
      real footguns).
      (b) pi-epicflow self-dogfood produced 5 DEC + 4 extracted
      conventions + 6 BL entries from existing README/CHANGELOG/PLAN
      sources; first audit caught a real pre-existing C-003 violation
      (BL-007: `pi-epic-status.ps1` missing).
      Three findings fixed in-flight: placeholder leak in conventions
      template, in-place close of in-progress session fields, fence-aware
      audit awk.

## Risks & rollback

- **Risk:** noisy auto-writes annoy the user. **Mitigation:** silent-log
  + final-report footer pattern (open question above).
- **Risk:** anti-stub rule over-triggers on legitimate scaffolding.
  **Mitigation:** `conventions.md` allowlist + reviewer respects it.
- **Risk:** `.pi/project/` files diverge from reality. **Mitigation:**
  `last_verified` dates + Phase 2 stale detection.
- **Rollback:** delete `.pi/project/` and the skill; everything else is
  additive.

## Decisions log

- 2026-05-26 — chose autonomous trigger-driven writes over `/project-sync`
  because users will forget to invoke commands.
- 2026-05-26 — Phase 1 ships only 6 artifacts (added `sessions.md`);
  gotchas/questions/module-cards deferred.
- 2026-05-26 — folded into pi-epicflow (not a new extension) because it
  shares philosophy and infra (`.pi/`, skills, sub-agents).
- 2026-05-26 — main agent = session steward; delegate substantive work
  to sub-agents (`scout`, `researcher`, `worker`, `reviewer`, `oracle`)
  to keep main context focused on goal + brain.
- 2026-05-26 — session goal is a guardrail, not a gate; pivots allowed
  but logged as `superseded` entries in `sessions.md`.
- 2026-05-26 — no `/session-start` command; session opens autonomously
  on first non-trivial turn via propose-and-confirm.
- 2026-05-26 — use custom `epicflow-*` personas instead of generic
  pi-subagents personas (scout/researcher/worker/reviewer/oracle).
  Generic personas are too broad → drift, timeouts, mediocre output.
  Custom personas get mandatory context primes, bounded budgets,
  strict output templates, anti-stub self-checks.
- 2026-05-26 — all 6 prior open questions resolved with recommended
  defaults (silent-log + footer; supersedes not edits; trigger
  co-occurrence with work-noun; goal as guardrail; propose-and-confirm
  inferred goal; delegation threshold >1 file OR >~50 LOC OR needs
  research).
