# F01 — Schema Upgrade

> Status: tests-passing · Branch: `feat/deliverables-contract-v10/F01-schema-upgrade` · See `meta.yaml`
>
> Epic: [`0002-deliverables-contract-v10`](../../design.md) · This feature implements: decomposition.yaml §F01

## 1. Goal

Add optional per-feature deliverable fields (e2e_scenarios, mock_fixtures, docs_updates, changelog_entry) to decomposition.yaml template, strict_deliverables + e2e block to epic-config.yaml, and deliverables_summary to meta.yaml. Pure schema/template work — no enforcement.

## 2. Acceptance criteria

- [x] decomposition.yaml template features section adds 4 new optional fields per feature, in order after acceptance_criteria: e2e_scenarios (list, default []), mock_fixtures (list, default []), docs_updates (list, default []), changelog_entry (bool, default false).
- [x] Each new field is documented inline with a 1-3 line comment explaining purpose + when to populate.
- [x] epic-config.yaml template adds top-level strict_deliverables: false (with comment: 'v0.10: opt-in capability; v0.11 will flip default to true').
- [x] epic-config.yaml template adds top-level e2e: block with enabled: false (default), and commented examples of install_hint, start_cmd, start_url, ready_check, ready_timeout_sec, shutdown_cmd, run_cmd.
- [x] meta.yaml template gains a deliverables_summary section that mirrors the per-feature deliverable counts (optional; populated by pi-epic-init if decomposition.yaml has them).
- [x] A fresh `pi-epic-init <slug>` on a clean repo produces templates with the new fields present + commented.
- [x] An existing v0.9-era decomposition.yaml (without the new fields) continues to validate without error under the v0.10 template parser.

## 3. Decisions (ADR-style, append-only)

No decisions needed — straightforward template additions per design §4.1/§4.2.

## 4. Plan (mandatory; fill BEFORE first edit)

**Files I will touch:**
- `skills/epic-feature-workflow/templates/decomposition.yaml` — add 4 deliverable fields with inline comments
- `skills/epic-feature-workflow/templates/epic-config.yaml` — add strict_deliverables + e2e block
- `skills/epic-feature-workflow/templates/meta.yaml` — add deliverables_summary section

**Files I will read for context (not edit):**
- `design.md` §4.1, §4.2, §8 — field names, semantics, backward compat rules
- `decomposition.yaml` (epic) — AC definitions
- `.pi/epics/done/0001-observability-v09/decomposition.yaml` — v0.9 backward compat test

**AC interpretation:**
- AC 1: Fields appear after acceptance_criteria in F01 example block, each as `field: default_value` with YAML list/bool types
- AC 2: Each field has 1-3 comment lines above or beside explaining when to populate
- AC 3: `strict_deliverables: false` appears at top-level before test_cmd, with the exact version note
- AC 4: `e2e:` block at top level with `enabled: false` and all 7 sub-fields commented out as examples
- AC 5: `deliverables_summary:` section in meta.yaml, commented out (optional), showing 4 count fields
- AC 6: Verified by running pi-epic-init on a scratch repo — templates are copied as-is
- AC 7: Verified by running pi-epic-validate-decomposition on the v0.9 archive — exits 0

**Ambiguities:** None.

**Anti-scope:**
- No script changes (enforcement is F02/F04/F06)
- No prompt changes (that's F03)
- No agent prompt changes (that's F05)

## 5. TODO checklist

- [x] Edit decomposition.yaml template
- [x] Edit epic-config.yaml template
- [x] Edit meta.yaml template
- [x] Validate v0.10 decomposition still passes
- [x] Validate v0.9 archive still passes
- [x] Commit

## 6. Progress log (append-only, newest on top)

### 2026-05-18 12:00
- changes: decomposition.yaml, epic-config.yaml, meta.yaml templates
- why: implement F01 schema upgrade — all 4 deliverable fields + e2e block + strict_deliverables + deliverables_summary
- next: feature complete, ready for review

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Enforcement logic (F02)
- Worker/reviewer contract updates (F04/F05)
- pi-epic-complete gate (F06)
- Decomposer prompt (F03)
