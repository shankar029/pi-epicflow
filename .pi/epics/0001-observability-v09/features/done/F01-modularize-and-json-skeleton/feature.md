# <Feature title>

> Status: pending · Branch: `feat/<epic-slug>/F<NN>-<slug>` · See `meta.yaml`
>
> Epic: [`<epic-id>`](../../design.md) · This feature implements: <link to feature in decomposition.yaml>

## 1. Goal

What this feature delivers (1–2 sentences). Pull from `decomposition.yaml`
summary + acceptance criteria. The end-goal of the epic stays authoritative;
this is the slice.

## 2. Acceptance criteria

Mirror from `decomposition.yaml`. Tick as satisfied:

- [ ] <criterion 1>
- [ ] <criterion 2>

## 3. Decisions (ADR-style, append-only)

Implementation-time decisions specific to this feature. Mirror one-liners to
the epic's `design.md` §4.

<!-- Append below; never edit past entries.

### ADR-001: <title>
- **Date:** YYYY-MM-DD
- **Status:** accepted | superseded by ADR-NNN
- **Context:** Why this decision is needed.
- **Decision:** What was decided.
- **Consequences:** Trade-offs accepted.
-->

## 4. Plan (mandatory; fill BEFORE first edit)

See plan.md for full details.

**Files I will touch:**
- `skills/epic-feature-workflow/scripts/pi-epic-status` — rewrite to ~90-line dispatcher
- `skills/epic-feature-workflow/lib/pi-epic-status-features.sh` — feature-table + meta renderer (new)
- `skills/epic-feature-workflow/lib/pi-epic-status-runlog.sh` — run-log renderer (new)
- `skills/epic-feature-workflow/lib/pi-epic-status-halts.sh` — halt-reports renderer (new)
- `skills/epic-feature-workflow/lib/pi-epic-status-ready.sh` — --ready mode (new)
- `skills/epic-feature-workflow/lib/pi-epic-status-json.sh` — JSON emitter (new)
- `skills/epic-feature-workflow/scripts/_common.sh` — 1-char bug fix for worktree `.git` detection

**Anti-scope:**
- Do NOT add timing columns (F02)
- Do NOT implement batch detection (F03)
- Do NOT change halt rendering format (F04)
- Do NOT add smoke phases (F05)
- Do NOT populate batches/halts/ready_now/blocked_on_deps with real data (emit empty arrays)

## 5. TODO checklist (optional)

- [ ] Step 1
- [ ] Step 2

## 6. Progress log (append-only, newest on top)

### 2026-05-17 17:06
- changes: pi-epic-status rewritten as dispatcher (90 lines); 5 lib/*.sh files created; _common.sh 1-char fix
- why: F01 implementation — modularize + add --json skeleton
- result: all 12 AC pass; 24/24 smoke; byte-for-byte baseline match confirmed
- next: review + merge

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Anything explicitly deferred to another feature in the DAG.
