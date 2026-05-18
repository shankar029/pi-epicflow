# Plan — F04 worker-contract-deliverables

> Produced by feature-planner on 2026-05-18T15:30:00Z. This is the worker's
> binding contract; deviations require a `deviations.md` entry.

## 1. Goal (one sentence)

Extend the feature-worker prompt to treat declared deliverables as first-class
scope, add a `feature_declared_deliverables` helper to `_common.sh`, and wire a
pre-merge "deliverables" check into `pi-feature-complete` that refuses merge
when declared deliverable files are missing or unmodified.

## 2. Files I will touch

- `agents/feature-worker.md` — add "Declared deliverables" section (existing, ~247 lines)
- `skills/epic-feature-workflow/scripts/pi-feature-complete` — add pre-merge deliverables phase (existing, ~290 lines)
- `skills/epic-feature-workflow/scripts/_common.sh` — add `feature_declared_deliverables` helper (existing, ~240 lines)

## 3. Files to read for context (not edit)

- `skills/epic-feature-workflow/scripts/pi-epic-validate-decomposition:L729-L870` — F02's deliverables engine; reference for YAML parsing pattern and the `_DELIVERABLE_FIELDS` list; confirms field names are `e2e_scenarios`, `mock_fixtures`, `docs_updates`, `changelog_entry`
- `skills/epic-feature-workflow/templates/decomposition.yaml:L56-L70` — F01's template showing the field syntax
- `.pi/epics/done/0001-observability-v09/decomposition.yaml` — v0.9 file with no deliverable fields; backward compat target
- `skills/epic-feature-workflow/scripts/pi-feature-complete:L106-L140` — existing completion-evidence gate pattern (insert new check after this block)
- `skills/epic-feature-workflow/scripts/pi-feature-complete:L195-L290` — scope_files Python parser in the squash-merge conflict handler (reusable pattern for reading decomposition.yaml)

## 4. AC interpretation (per criterion)

### AC 1: Worker prompt gains "Declared deliverables" section

> "agents/feature-worker.md gains a 'Declared deliverables' section explaining
> that e2e_scenarios + mock_fixtures + docs_updates files are first-class
> scope_files; READY requires producing them."

**Literal expected:** A new `## Declared deliverables (v0.10+)` section inserted
in `agents/feature-worker.md` AFTER the "Your loop" section (after step 4
"Implement") and BEFORE "When to escalate (§6)". Content: ~15-25 lines
explaining that files listed in `e2e_scenarios`, `mock_fixtures`, `docs_updates`
in `decomposition.yaml` are treated identically to `scope_files` — the worker
MUST produce them for `state: READY`. Budget: ≤150 words.

**Insert after:** Line ~120 (after step 5 "Test" or step 6 "Self-review").
Actually: better as a subsection within step 4 ("Implement") since it's about
what to produce. Alternatively, insert as a new dedicated section between the
loop and the escalation section (~L160). Worker prompt already has
`## Inputs you can rely on`, `## Your loop`, `## Hard rules`, `## When to escalate`.
Insert between `## Hard rules` (L155) and `## When to escalate (§6)` (L160).

**Test:** `grep -c 'Declared deliverables' agents/feature-worker.md` → 1.

### AC 2: worker-report.md template gains deliverables subsection

> "worker-report.md template (referenced in feature-worker.md) gains a
> '## Declared deliverables' subsection listing each declared file with
> checked/unchecked status."

**Literal expected:** In the §7 report template (starts at L180 in
feature-worker.md), add a `## Declared deliverables` subsection between
`## Completion evidence` and `## Diff summary`. Format:

```
## Declared deliverables

- [x] tests/e2e/billing/checkout.spec.ts (e2e_scenarios)
- [x] tests/e2e/_fixtures/stripe.ts (mock_fixtures)
- [ ] docs/billing.md (docs_updates) — NOT YET PRODUCED
```

Each line: checkbox + path + category in parens. Worker fills this from
`decomposition.yaml` when deliverable fields are present. When no deliverable
fields exist, omit the section entirely.

**Test:** `grep -c 'Declared deliverables' agents/feature-worker.md` → ≥2 (section header + template example).

### AC 3: pi-feature-complete gains pre-merge check phase 'deliverables'

> "pi-feature-complete gains a new pre-merge check phase 'deliverables' after
> the existing scope_files check."

**Literal expected:** New block inserted in `pi-feature-complete` AFTER the
completion-evidence gate (L106-L135) and BEFORE the "Commit any final pending
changes" block (L138). The check is gated on `$kind != "spike"` and on the
feature having any deliverable fields. Phase name logged as
`[epic-workflow] deliverables check: ...`.

**Approach:** Call the `feature_declared_deliverables` helper (AC 8) to get the
list of declared files. If the list is empty, log "no declared deliverables;
skipping" and proceed. Otherwise, iterate each file and verify it exists +
was modified.

**Test:** Run `bash -n pi-feature-complete` → exit 0.

### AC 4: Each deliverable file must exist and appear in git diff

> "For each file in the feature's e2e_scenarios + mock_fixtures + docs_updates:
> file must exist in the feature's worktree; file must appear in
> `git diff <epic_base>..HEAD --name-only` for the feature's branch."

**Literal expected:** Inside the deliverables check block:
1. Compute `epic_base` from meta.yaml's branch info or from the epic branch
   name (`epic/$epic_slug`).
2. Run `git diff epic/$epic_slug..HEAD --name-only` in the worktree and capture
   output.
3. For each declared file path: (a) check `[[ -f "$worktree/$path" ]]`;
   (b) check if `$path` appears in the diff output.
4. Collect failures for the error message (AC 5).

**Approach:** Execute in a subshell `( cd "$worktree" && ... )` to get the diff.
The diff is relative paths from worktree root.

### AC 5: Error message format for missing/unmodified deliverables

> "When a declared deliverable file is missing or unmodified, pi-feature-complete
> exits non-zero with message: 'Declared deliverable not produced: <path>
> (feature F<id>). Worker may have skipped this output; re-dispatch or update
> decomposition.yaml.'"

**Literal expected:** For each failing file, emit to stderr:
```
Declared deliverable not produced: <path> (feature F<id>). Worker may have skipped this output; re-dispatch or update decomposition.yaml.
```
Then set `yaml_set "$feat_dir/meta.yaml" state "halted"` and `exit 1`.

**Test:** Structural — the exact string is in the script source.

### AC 6: changelog_entry handling

> "When changelog_entry is true: CHANGELOG.md must appear in the feature's diff
> under the [Unreleased] section. If CHANGELOG.md does not exist in the repo,
> emit a warning (not an error) suggesting addition."

**Literal expected:**
1. Read `changelog_entry` from decomposition.yaml for this feature (via the
   helper or inline Python).
2. If `changelog_entry` is `true` (string comparison after yaml parsing):
   - If `CHANGELOG.md` doesn't exist in the worktree: emit warning
     `"[warn] changelog_entry is true but CHANGELOG.md does not exist in repo. Consider adding one."` — do NOT fail.
   - If `CHANGELOG.md` exists but is NOT in the git diff: emit error
     `"Declared deliverable not produced: CHANGELOG.md (feature F<id>). changelog_entry is true but CHANGELOG.md was not modified."` and fail.
   - If `CHANGELOG.md` IS in the diff: verify `[Unreleased]` section contains
     changes. Approach: `grep -q '\[Unreleased\]' "$worktree/CHANGELOG.md"`.
     If the section doesn't exist, emit warning but don't fail (the file was
     modified, just maybe not in the expected format).

### AC 7: Backward compat — v0.9-era features bypass check

> "Existing features (v0.9 era, no deliverable fields) bypass this check
> entirely."

**Literal expected:** The `feature_declared_deliverables` helper returns empty
output when the feature has no `e2e_scenarios`, `mock_fixtures`, `docs_updates`,
or `changelog_entry` fields in decomposition.yaml. The pi-feature-complete check
sees empty output → logs `"no declared deliverables; skipping"` → proceeds
without error.

**Detection pattern:** Same as F02's validator (L787-L791): check if ANY of the
4 deliverable field keys are present in the feature's parsed data. If none
present → skip entirely.

### AC 8: _common.sh helper `feature_declared_deliverables`

> "_common.sh gains a helper `feature_declared_deliverables <feature_id>` that
> yaml-parses decomposition.yaml and emits the deliverable file list, one per
> line. Used by both pi-feature-complete and (future) pi-epic-complete."

**Signature:** `feature_declared_deliverables <decomposition_yaml_path> <feature_id>`

**Output format:** One file path per line, prefixed with category tag:
```
e2e:tests/e2e/billing/checkout.spec.ts
mock:tests/e2e/_fixtures/stripe.ts
docs:docs/billing.md
changelog:CHANGELOG.md
```

The `changelog:CHANGELOG.md` line is emitted when `changelog_entry: true`.

**Implementation:** Python heredoc (consistent with `yaml_get` and the existing
scope_files parser at pi-feature-complete:L218-L240). Parse
decomposition.yaml's features list, find the matching feature by `id`, extract
values from `e2e_scenarios`, `mock_fixtures`, `docs_updates` lists, and emit
`changelog_entry` boolean as a special `changelog:CHANGELOG.md` line.

**Insert location:** After the existing `yaml_set` function in `_common.sh`
(~L160, after the `yaml_set()` function ends and before `runlog_append()`).

**Test:** `bash -n _common.sh` → exit 0. Calling
`feature_declared_deliverables <path-to-decomp> F03` on a v0.10 decomposition
with deliverable fields emits the expected lines.

### AC 9: bash -n passes

> "bash -n on pi-feature-complete and _common.sh passes."

**Test:** `bash -n skills/epic-feature-workflow/scripts/pi-feature-complete && bash -n skills/epic-feature-workflow/scripts/_common.sh` → exit 0.

## 5. Anti-scope

- **Content validation of deliverable files** (e.g. checking E2E scenario structure, mock accuracy) — that's F05 reviewer rubric, not F04.
- **`strict_deliverables` flag interaction** — F04's check is unconditional (if declared, must be produced). The strict/warn mode only applies to F02's validator trigger engine.
- **`pi-epic-complete` integration** — F06 reuses the helper but wiring it into the epic gate is F06's scope.
- **`e2e_skip_reason` handling** — that suppresses the *validator trigger* (F02); it does NOT suppress the deliverable existence check. If `e2e_scenarios` is empty (even with skip_reason), there's nothing to check. If populated, files must exist regardless of skip_reason.
- **`--skip-deliverables` flag** — not in the AC. Don't add it proactively. If needed later, it's a future feature.

## 6. Ambiguities

- **None blocking.** All resolved by reading the codebase:
  - Helper takes `<decomp_path> <fid>` (not `<fid>` alone) because _common.sh helpers are stateless; the caller passes the decomposition path.
  - Output format uses category prefix (enables pi-epic-complete in F06 to filter by category without re-parsing).
  - Paths are relative to repo root (matching decomposition.yaml's convention and git diff output format).

## 7. Estimated effort vs decomposition

- decomposition.yaml estimate: 4h
- planner estimate: 4h (aligned; 3 files, well-defined patterns to follow, no novel parsing needed)

## 8. References

- design.md §5: "Worker contract changes" — declares deliverables become first-class scope_files; pi-feature-complete extends pre-merge check
- `pi-epic-validate-decomposition:L729-L870`: F02's deliverables engine; confirms field names, parsing pattern, backward-compat guard
- `pi-feature-complete:L106-L135`: completion-evidence gate — insertion point for new deliverables check (insert after this block)
- `pi-feature-complete:L218-L240`: scope_files Python parser in conflict handler — reusable decomposition.yaml parsing pattern
- `_common.sh:L119-L160`: `yaml_get` + `yaml_set` — neighboring location for new helper
- `templates/decomposition.yaml:L56-L70`: F01's template confirming field names and defaults

## 9. Implementation order

1. **AC 8 first** — `_common.sh` helper `feature_declared_deliverables`. This is the foundation; AC 3-7 depend on it.
2. **AC 3-5, AC 6, AC 7** — `pi-feature-complete` deliverables check phase. Uses the helper from step 1. Implement all together as one block.
3. **AC 1** — `feature-worker.md` "Declared deliverables" section.
4. **AC 2** — `feature-worker.md` worker-report template addition.
5. **AC 9** — `bash -n` verification (final sanity check).

This order minimizes rework: the helper is tested standalone, then integrated
into the script, then the prompt documentation is written to match the
actual implementation.
