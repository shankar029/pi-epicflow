---
description: Periodic audit of .pi/project/. Surfaces stale entries, ripe backlog items, drift between brain and code, and proposes promoting 0–3 ripe items into a formal epic via /epic-design.
argument-hint: "[--quiet]"
---

You are running `/project-review`. This is a scheduled / on-demand
audit of the project brain. Run it weekly-ish, or before a planning
session, or when the backlog feels heavy.

Optional args from the user: $@

- `--quiet` — produce only the action recommendations, skip the audit
  detail.

## Pre-flight

1. `.pi/project/index.md` must exist. If not: *"Run `/project-init`
   first."* — stop.
2. Note today's date.

## Step 1 — Audit

Run these checks. Collect findings; print them in Step 2.

### A-0 — Fence-aware entry extraction

All subsequent audits operate on **real entries**, not template example
shapes. Template files keep their example shapes inside fenced ```` ```md ```` blocks
so they don't pollute audits. Use this one-liner to enumerate real
entries from any brain file:

```bash
awk '/^```/ {fence = !fence; next} /^## / && !fence {print FILENAME ":" FNR ": " $0}' .pi/project/<file>.md
```

Use the same fence-aware pattern when counting BL-/DEC-/C-/S- anchors.
A plain `grep '^## '` is wrong here — it will count example shapes from
comments / fences as if they were real entries.

### A-1 — Staleness

For every artifact in `.pi/project/`:
- If `last_verified` (in `index.md`) is >60 days old, flag stale.
- If the file hasn't been modified in >60 days but the repo has had
  substantial code activity in the same period, flag drift-risk.

### A-2 — Backlog ripeness

For every `status: open` entry in `backlog.md`:
- Parse `revisit_when` and decide: has the trigger fired?
  - "after X lands" + X visible in `decisions.md` as active and recent
    → ripe.
  - "if a real user asks" + no such ask visible → not ripe.
  - Concrete date passed → ripe.
  - >90 days old with no movement → stale-backlog (candidate for
    `status: dropped` after user confirms).

### A-3 — Conventions drift

For each rule in `conventions.md`, sample-grep the repo (`rg -l`) for
likely violations. List up to 5 per rule. Don't fix; just list.

### A-4 — Decision drift

For each active DEC entry that touches code, sample-check whether the
referenced code area still reflects the decision. If a DEC is contradicted
by current code, flag.

### A-5 — Session hygiene

In `sessions.md`:
- Are there `in-progress` entries older than 7 days? They should be
  `paused` or `abandoned`.
- Are there entries where the goal was clearly not advanced (look at
  linked DEC/BL counts and files touched)? Flag for review.

### A-6 — Module-card coverage (informational)

If `.pi/modules/` exists (Phase 2), list modules without cards and
modules with cards >90 days old. If `.pi/modules/` doesn't exist,
skip silently.

## Step 2 — Print the report

Unless `--quiet`:

```
# Project review — <today>

## Stale artifacts
- `<file>` — last_verified <date>, ~<N days> ago — <flag>
- (or "none")

## Ripe backlog items (suggest pulling into a session or epic)
- BL-NNN: <one line> — trigger fired because <reason>
- (or "none")

## Stale backlog items (suggest dropping)
- BL-NNN: <one line> — open <N days>, no movement
- (or "none")

## Convention violations (sample)
- C-NNN: <N hits> — examples: <file:line>, <file:line>
- (or "none in sample")

## Decision drift
- DEC-NNN appears contradicted by `<file:line>` — <how>
- (or "none")

## Stuck sessions
- S-NNN — `in-progress` since <date> (<N days>) — propose `paused` or close
- (or "none")
```

## Step 3 — Recommendations

Always print this block (even with `--quiet`):

```
## Recommended actions

1. Promote to epic: <BL-NNN, BL-NNN, BL-NNN> — these are ripe and big
   enough to warrant a multi-feature epic. Run:
     pi-epic-init <slug> --from <design-source>
     /epic-design
   (or "no items ripe for epic promotion this week")

2. Close stuck sessions: <S-NNN list> — I'll pause/close them on your
   OK. Reply "yes" to close, "leave them" to skip.

3. Drop stale backlog: <BL-NNN list> — open too long, no signal. Reply
   "yes" to mark dropped, "no" to leave.

4. Refresh stale brain entries: <file list> — I'll re-verify and bump
   last_verified dates on your OK.

5. Fix convention violations: <C-NNN list with counts> — I'll either
   fix in a focused session (if small) or open BL-NNN items for them
   (if larger).
```

## Step 4 — Execute confirmed actions

For each action the user confirms:

- **Promote to epic** → run `pi-epic-init` + suggest `/epic-design`.
  Don't run `/epic-design` automatically — that's user-driven.
- **Close stuck sessions** → append closing entries to `sessions.md`
  with `status: paused` (default) or `abandoned` (if user said so),
  with a one-line reason.
- **Drop stale backlog** → append updates to the BL entries setting
  `status: dropped` with `dropped_at: <date>` and `dropped_because:
  stale (no progress in 90+ days)`.
- **Refresh brain** → re-read the artifact, update `last_verified` in
  `index.md`, note in current session's sessions.md entry under
  "Files touched".
- **Convention violations** → either spawn an `epicflow-worker` per
  small batch, or append BL entries for larger ones.

After execution, summarize:

```
✅ Project review actions completed:
- Promoted: BL-NNN → epic <slug>
- Closed sessions: S-NNN (paused), …
- Dropped backlog: BL-NNN, …
- Refreshed: <file list>
- Backlog opened for conventions: BL-NNN (C-NNN cleanup)
```

## Anti-patterns

- Don't auto-execute anything. Always confirm.
- Don't open an epic without user opt-in — surface the candidate, let
  them choose.
- Don't drop backlog items without explicit OK.
- Don't run `epic-design` from inside this prompt. Hand off to the
  user.
- Don't list more than 5 items per category. Use "(+N more)".
