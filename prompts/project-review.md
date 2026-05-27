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

## Delegation option (v0.14+)

For an unattended sweep — or when running `/project-review` across
multiple repos in sequence — delegate the read-only audit to the
`epicflow-steward` persona. The steward can only write to
`.pi/project/` and `~/.pi/global-memory/`, so it can't accidentally
fix flagged source-code issues mid-sweep:

```
subagent { agent: "epicflow-steward", task: "sweep" }
```

The main agent (you) remains responsible for **acting on**
recommendations (promoting BL items to epics, executing rollovers
you've confirmed, etc.). The steward only surfaces them. Use the
main-agent flow below when the user is interactive and wants to
choose actions live.

## Pre-flight

1. `.pi/project/index.md` must exist. If not: *"Run `/project-init`
   first."* — stop.
2. Note today's date.

## Step 1 — Audit

Run these checks. Collect findings; print them in Step 2.

### A-0 — Fence-aware entry extraction

All subsequent audits operate on **real entries**, not template example
shapes. Template files keep their example shapes inside fenced ```` ```md ```` blocks
so they don't pollute audits. **Use the shared helper** (works in both
bash and pwsh — no `awk` dependency on Windows):

```bash
# Bash / WSL / macOS:
source <pi-epicflow>/install/lib/brain-audit.sh
brain_entries .pi/project/<file>.md      # list real `## ` headings
brain_anchors "BL-" .pi/project/backlog.md   # count real BL- entries
```

```powershell
# Windows pwsh:
. <pi-epicflow>\install\lib\brain-audit.ps1
Get-BrainEntries -Path .pi\project\<file>.md
Get-BrainAnchorCount -Prefix "BL-" -Path .pi\project\backlog.md
```

If the helper isn't sourceable for any reason, the inline fallbacks
are:

```bash
# Bash inline fallback:
awk '/^```/ {fence = !fence; next} /^## / && !fence {print FILENAME ":" FNR ": " $0}' .pi/project/<file>.md
```

```powershell
# pwsh inline fallback (awk is not available on Windows):
$fence = $false; $n = 0
Get-Content .pi\project\<file>.md | ForEach-Object {
  $n++
  if ($_ -match '^```') { $fence = -not $fence; return }
  if (-not $fence -and $_ -match '^## ') { "${n}: $_" }
}
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
- **In-progress uniqueness invariant** — at most one line in
  `sessions.md` should match `^\*\*Status:\*\* in-progress`. If the
  count is `> 1`, two sessions were opened without closing the
  previous one (likely a crash mid-session); flag for the user to
  close the older one as `abandoned` before the next write turn.
  Run:

  ```bash
  count=$(grep -c '^\*\*Status:\*\* in-progress' .pi/project/sessions.md || true)
  if [[ "$count" -gt 1 ]]; then
    echo "A-5 FAIL: $count in-progress sessions — only one should be open at a time"
  fi
  ```

  ```powershell
  $count = (Select-String -Path .pi/project/sessions.md `
              -Pattern '^\*\*Status:\*\* in-progress' `
              -AllMatches).Matches.Count
  if ($count -gt 1) {
    Write-Host "A-5 FAIL: $count in-progress sessions — only one should be open at a time"
  }
  ```

### A-6 — Module-card coverage (Phase 2)

If `.pi/project/modules/` exists, list modules without cards and
cards >90 days old (`last_verified` field). If the directory
doesn't exist, skip silently.

### A-7 — Index staleness

For every artifact listed in `.pi/project/index.md` with a
`**Last verified:** YYYY-MM-DD` line, flag entries where:

- The date is more than 60 days old, AND
- The underlying file has been modified more recently than the
  recorded `last_verified` date.

```bash
# Suggestion: rely on the brain_stale_days helper in install/lib/brain-audit.sh
source install/lib/brain-audit.sh 2>/dev/null || true
for art in charter conventions decisions backlog sessions gotchas questions; do
  f=".pi/project/${art}.md"
  [[ -f "$f" ]] || continue
  last_v=$(grep -m1 '^\*\*Last verified:\*\*' "$f" | sed -E 's/.*\*\*Last verified:\*\* *([0-9-]+).*/\1/')
  if [[ -n "$last_v" ]]; then
    file_mtime=$(date -u -r "$f" +%Y-%m-%d 2>/dev/null || stat -c %y "$f" | cut -d' ' -f1)
    if [[ "$file_mtime" > "$last_v" ]]; then
      echo "A-7 STALE: $f last_verified=$last_v but file mtime=$file_mtime"
    fi
  fi
done
```

### A-8 — Capacity caps (rollover candidates)

For each artifact with a cap (see `skills/project-memory/SKILL.md`
"Capacity & rollover"), count entries and flag if cap is exceeded.

```bash
source install/lib/brain-audit.sh 2>/dev/null || true

check_cap() {
  local prefix="$1" file="$2" cap="$3"
  [[ -f "$file" ]] || return 0
  local n; n=$(brain_anchors "$prefix" "$file")
  if (( n > cap )); then
    echo "A-8 OVER CAP: $file has $n '$prefix' entries (cap=$cap) — recommend rollover to ${file%.md}-archive-$(date +%Y).md"
  fi
}

check_cap 'DEC-' .pi/project/decisions.md 500
check_cap 'BL-'  .pi/project/backlog.md   200
check_cap 'S-'   .pi/project/sessions.md  150
check_cap 'G-'   .pi/project/gotchas.md   200
check_cap 'Q-'   .pi/project/questions.md 250
```

```powershell
. .\install\lib\brain-audit.ps1

function Test-CapacityCap($prefix, $file, $cap) {
  if (-not (Test-Path $file)) { return }
  $n = Get-BrainAnchorCount $prefix $file
  if ($n -gt $cap) {
    Write-Host "A-8 OVER CAP: $file has $n '$prefix' entries (cap=$cap) — recommend rollover"
  }
}

Test-CapacityCap 'DEC-' .pi/project/decisions.md 500
Test-CapacityCap 'BL-'  .pi/project/backlog.md   200
Test-CapacityCap 'S-'   .pi/project/sessions.md  150
Test-CapacityCap 'G-'   .pi/project/gotchas.md   200
Test-CapacityCap 'Q-'   .pi/project/questions.md 250
```

Age caps are advisory and surfaced as part of A-1 (Staleness) already;
A-8 focuses on entry-count caps.

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
