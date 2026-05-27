# pi-epicflow v0.14.0 — Plan

**Goal:** Ship the deferred Phase 2 work (BL-001 module cards / gotchas /
questions), the brain-maintenance persona (BL-002), the cross-repo
overlay (BL-004), and the two foundational steal-list items from the
BL-003 brief (progressive-disclosure index, size+age caps with
rollover). Result: a richer brain shape, a safer maintenance loop, and
opt-in cross-repo memory — without disturbing the v0.13 per-repo
contract.

**Status:** done
**Version:** 0.14.0
**Started:** 2026-05-26
**Closed:** 2026-05-26
**Owner:** S-003 (this session)

All 10 steps complete. Tagged v0.14.0. Optional Step 9 blog post on
the global overlay deferred to v0.14.1 (out of session budget; not a
release blocker).

## Locked design calls

All six confirmed by user, 2026-05-26:

1. **BL-004 = additive overlay**, not replacement. Per-repo brain stays
   canonical; per-repo wins on conflict.
2. **BL-004 storage** = `~/.pi/global-memory/` *directory* mirroring
   per-repo templates (`charter.md`, `conventions.md`, `decisions.md`).
   No global `sessions.md` / `backlog.md`.
3. **Module cards** live at `.pi/project/modules/<name>.md` (under the
   brain folder), not at `.pi/modules/<name>.md`.
4. **Steward persona** is a *delegation target* for brain maintenance.
   Main-agent stewardship for normal sessions is unchanged.
5. **Cap thresholds:**
   - `decisions.md` → archive at 500 entries OR entries > 2 years old
   - `backlog.md` → archive at 200 entries OR open > 180 days
   - `sessions.md` → archive at 150 entries OR closed > 1 year
   - Archives linked from `index.md`; rollover is `/project-review`
     recommended-action, never automatic.
6. **Version = 0.14.0** (SemVer minor: feature add).

## Out of scope (deliberate)

- No retrieval/search persona. `index.md` + grep stays primary.
- No automatic archive rollover.
- No global `sessions.md` / `backlog.md`.

## Execution order (dependency-respecting)

- [ ] **Step 0 — open S-003 in `sessions.md`.** Required by SKILL.md.
- [ ] **Step 1 — Steal-item 3: progressive-disclosure `index.md`.**
  Foundational. Other steps add rows + routing entries to it.
  - [ ] Rewrite `templates/project/index.md` with per-section
    anchors + "what to read for X" routing table.
  - [ ] Update `skills/project-memory/SKILL.md` Start step to reference
    the routing table.
  - [ ] Add audit check to `/project-review` Step 1 (new A-7) that
    flags `index.md` rows missing their `last_verified` date.
- [ ] **Step 2 — Steal-item 4: size + age caps with rollover.**
  - [ ] Add "Capacity & rollover" section to SKILL.md with the
    thresholds above.
  - [ ] Add `/project-review` Step 1 A-8 that counts entries per
    artifact and flags caps exceeded.
  - [ ] Add rollover recipe (file rename + index.md archive row) to
    `/project-review` Step 4 (recommended actions).
- [ ] **Step 3 — BL-001: Phase 2 artifacts.**
  - [ ] Create `templates/project/gotchas.md` (graduates the `## Gotchas`
    section out of `decisions.md`).
  - [ ] Create `templates/project/questions.md` (unresolved-but-tracked).
  - [ ] Create `templates/project/modules/README.md` + a `_template.md`
    inside it for cards.
  - [ ] Update SKILL.md trigger table:
    - Gotcha trigger → `gotchas.md` (was `decisions.md ## Gotchas`)
    - New "unresolved-question" trigger → `questions.md`
    - Module cards = user-initiated (`/project-module-card <name>`),
      no trigger phrase.
  - [ ] Update `prompts/project-init.md` to copy the three new
    artifacts.
  - [ ] Update `prompts/project-review.md` audits to include the three
    new files.
  - [ ] Add three new rows + `modules/` directory entry to the
    progressive-disclosure `index.md` template.
  - [ ] (Optional v0.14.1) create `prompts/project-module-card.md` for
    user-initiated module-card creation. **Decision: defer; users can
    write the card by hand from `_template.md`** since module cards
    are inherently authoring-heavy and don't benefit from a prompt yet.
- [ ] **Step 4 — BL-002: `epicflow-steward` persona.**
  - [ ] Create `agents/epicflow-steward.md` with read-only + `.pi/project/`
    + `~/.pi/global-memory/` write scope; mandatory brain prime; refuse
    template for code edits.
  - [ ] Update `prompts/project-review.md` to mention delegation option
    (`subagent { agent: "epicflow-steward" }`) for unattended sweeps.
  - [ ] Update `prompts/project-onboard.md` similarly.
- [ ] **Step 5 — BL-004: global cross-repo brain overlay.**
  - [ ] Add DEC-006 to this repo's `decisions.md` documenting the
    additive-overlay layering rule (per-repo wins on conflict).
  - [ ] Create `templates/global/charter.md`, `conventions.md`,
    `decisions.md`, `index.md` (parallel to `templates/project/` shape,
    minus `sessions`/`backlog`).
  - [ ] Add "Global overlay" section to SKILL.md:
    - Read-on-entry rule: load `~/.pi/global-memory/index.md` *after*
      per-repo `index.md`, before any non-trivial action.
    - Write triggers: explicit cross-repo phrases ("globally always X",
      "across all my repos", "in every Python project of mine") fire
      into `~/.pi/global-memory/`, not per-repo `.pi/project/`.
    - Conflict rule: per-repo wins, always; surface the conflict in the
      "context loaded" note.
  - [ ] Create `prompts/project-init-global.md` — user-initiated, lays
    down `~/.pi/global-memory/` from the new templates. Idempotent
    skip if it already exists.
  - [ ] Register the new prompt via `install/postinstall.mjs` (it
    auto-globs `prompts/*.md` already; confirm).
  - [ ] Update `templates/project/AGENTS.md` snippet to mention the
    optional global overlay.
- [ ] **Step 6 — Brain updates (this repo).**
  - [ ] Mark BL-001 / BL-002 / BL-004 done with resolution in
    `backlog.md`.
  - [ ] DEC-006 added in Step 5 (above).
  - [ ] Close S-003 at end of session.
- [ ] **Step 7 — CHANGELOG + version bump.**
  - [ ] CHANGELOG entry `[0.14.0]` with full Added / Changed / Notes
    breakdown.
  - [ ] `package.json` 0.13.2 → 0.14.0.
- [ ] **Step 8 — Verification.**
  - [ ] Bash smoke test green (existing 30/30).
  - [ ] PowerShell smoke test green on Windows-native checkout.
  - [ ] `npm pack --dry-run` confirms new files land in tarball.
  - [ ] Postinstall fixture confirms new persona + new prompt
    registered.
  - [ ] Dogfood: run brain-audit helpers on the updated `index.md` and
    confirm progressive disclosure works (anchors resolve).
- [ ] **Step 9 — Site update.**
  - [ ] Bump version pill in navbar to 0.14.0.
  - [ ] Add a "What's new in v0.14" entry near the hero (small) or to
    the existing WhatsNew section.
  - [ ] Optional: a third blog post on the global-overlay design. **Defer
    decision until after Step 8** — only ship if Steps 1–8 land within
    budget.
- [ ] **Step 10 — Commit + tag + push.**

## Risks & rollback

- **Risk:** Progressive-disclosure `index.md` overhaul drifts the
  template far enough that existing `.pi/project/index.md` instances
  (this repo + the sample app) need manual migration. *Mitigation:*
  hand-migrate this repo's `index.md` as part of dogfood; document the
  migration steps as a separate "upgrading from v0.13" note in CHANGELOG.
- **Risk:** `~/.pi/global-memory/` collides with an existing user file.
  *Mitigation:* `/project-init-global` checks for existence and refuses
  to overwrite (matches BL-005 fix for per-repo `AGENTS.md`).
- **Risk:** `epicflow-steward` persona gets invoked for code edits and
  refuses too loudly. *Mitigation:* clear refusal template + a single
  sentence explaining when to use the main worker persona instead.
- **Rollback:** All net-new files (`agents/epicflow-steward.md`, the
  global-memory templates, the new prompt, the three brain templates).
  Steal-items 3+4 are pure docs in SKILL.md + `/project-review`. Worst
  case: revert the commit and keep v0.13.2.

## Decisions log

- 2026-05-26 — BL-004 scoped as additive overlay (DEC-006), preserving
  DEC-004's per-repo location rule.
- 2026-05-26 — Module cards under `.pi/project/modules/` (not the
  originally-suggested `.pi/modules/`) to keep "one folder = one brain"
  invariant.
- 2026-05-26 — `/project-module-card` prompt deferred to v0.14.1+; users
  copy `_template.md` by hand for now (cards are authoring-heavy).
- 2026-05-26 — Third blog post on global overlay is conditional on
  Steps 1–8 finishing within budget.
