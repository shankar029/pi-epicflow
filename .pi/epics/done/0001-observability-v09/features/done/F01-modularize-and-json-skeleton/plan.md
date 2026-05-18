# Plan — F01 modularize-and-json-skeleton

> Produced by feature-planner on 2026-05-17T12:00:00Z. This is the worker's
> binding contract; deviations require a `deviations.md` entry.

## 1. Goal (one sentence)

Extract `pi-epic-status` (299 lines, flat bash) into a thin dispatcher + five
`lib/*.sh` sub-files, preserving byte-for-byte human output, and add a
`--json` flag emitting the v1 schema from design.md §1.

## 2. Files I will touch

- `skills/epic-feature-workflow/scripts/pi-epic-status` — rewrite to ~80-line dispatcher (existing)
- `skills/epic-feature-workflow/lib/pi-epic-status-features.sh` — feature-table renderer (new)
- `skills/epic-feature-workflow/lib/pi-epic-status-runlog.sh` — recent run-log renderer (new)
- `skills/epic-feature-workflow/lib/pi-epic-status-halts.sh` — halt-reports renderer (new)
- `skills/epic-feature-workflow/lib/pi-epic-status-ready.sh` — --ready mode (new)
- `skills/epic-feature-workflow/lib/pi-epic-status-json.sh` — JSON emitter with per-concern functions (new)

## 3. Files to read for context (not edit)

- `skills/epic-feature-workflow/scripts/_common.sh:L1-L80` — helpers already available (yaml_get, active_epic_dir, active_epic_id, pi_epicflow_version, pi_epicflow_age_days)
- `/tmp/obs-v09-baseline/pe-v8-realapp-status.txt` — byte-for-byte target for diff test
- `skills/epic-feature-workflow/scripts/pi-epicflow-doctor` — verify no coupling with pi-epic-status internals that could break

## 4. AC interpretation (per criterion)

- **AC 1** "skills/epic-feature-workflow/lib/ directory created with sub-files..."
  - Literal expected: directory `lib/` exists; files `pi-epic-status-{features,runlog,halts,ready,json}.sh` exist, each with shebang/header.
  - Test: `ls skills/epic-feature-workflow/lib/pi-epic-status-*.sh | wc -l` = 5

- **AC 2** "pi-epic-status becomes a dispatcher: sources _common.sh, sources each lib/ sub-file, dispatches by flags. Total lines ~80."
  - Literal expected: pi-epic-status ≤ 90 lines; contains `source` lines for _common.sh and all 5 lib files; dispatches `--ready`, `--json`, default.
  - Test: `wc -l < pi-epic-status` ≤ 90

- **AC 3** "Existing output byte-for-byte identical to v0.8.1 baseline."
  - Literal expected: running `pi-epic-status` on the /tmp/pe-v8-realapp sample epic and diffing against `/tmp/obs-v09-baseline/pe-v8-realapp-status.txt` produces zero output.
  - Test: `diff <(pi-epic-status) /tmp/obs-v09-baseline/pe-v8-realapp-status.txt` exit 0, empty stdout.
  - **CRITICAL:** must pipe through `cat` or set `TERM=dumb` to suppress ANSI-if-tty logic, matching baseline capture conditions.

- **AC 4** "`--ready` and `--ready --quiet` outputs unchanged."
  - Literal expected: identical output to pre-refactor. (Capture baselines before refactoring to compare.)
  - Test: diff --ready and --ready --quiet outputs against pre-refactor captures.

- **AC 5** "`pi-epic-status --json` exits 0 inside an epic worktree and emits valid JSON parsable by `jq`."
  - Literal expected: exit code 0; stdout is valid JSON (`jq . >/dev/null` succeeds).
  - Test: `pi-epic-status --json | jq . >/dev/null; echo $?` → 0

- **AC 6** "`.schema_version` equals integer 1; top-level keys present."
  - Literal expected: `jq '.schema_version'` → `1` (integer, not string); `jq 'keys'` contains exactly: `batches`, `blocked_on_deps`, `epic`, `features`, `halts`, `ready_now`, `schema_version`.
  - Test: `pi-epic-status --json | jq -e '.schema_version == 1 and (.epic | type == "object") and (.features | type == "array")'`

- **AC 7** "`.epic` is an object with: id, title, slug, branch, status, started, updated."
  - Literal expected: all 7 keys present; values sourced from meta.yaml.
  - Test: `jq -e '.epic | has("id","title","slug","branch","status","started","updated")' `

- **AC 8** "`.features` array; each entry has id, slug, status, branch, plus optional merge_sha, started_at, completed_at, duration_sec, halts."
  - Literal expected: array of objects. Required keys always present; optional keys present when data available, null/absent otherwise.
  - Test: `jq -e '.features | length > 0 and all(has("id","slug","status","branch"))'`

- **AC 9** "`.batches`, `.halts`, `.ready_now`, `.blocked_on_deps` arrays present (empty if no data)."
  - Literal expected: all four are JSON arrays (possibly empty `[]`).
  - Test: `jq -e '(.batches | type == "array") and (.halts | type == "array") and (.ready_now | type == "array") and (.blocked_on_deps | type == "array")'`

- **AC 10** "`pi-epic-status --json` outside an epic exits 2 with stderr JSON."
  - Literal expected: exit code 2; stderr contains `{"error": "not in an epic working tree"}`.
  - Test: run from /tmp; check `$?` = 2; capture stderr and compare.

- **AC 11** "`bash -n` on pi-epic-status and every lib/*.sh passes."
  - Literal expected: `bash -n` exit 0 on all 6 files.
  - Test: `for f in scripts/pi-epic-status lib/pi-epic-status-*.sh; do bash -n "$f"; done`

- **AC 12** "All v0.8.1 smoke phases (24/24) still pass on a clean run."
  - Literal expected: `install/smoke-test.sh` reports 24/24 pass.
  - Test: run smoke-test.sh, verify no failures.

## 5. Anti-scope

- Do NOT add timing columns to the features table (F02's job).
- Do NOT implement batch detection/rendering (F03's job).
- Do NOT change the halt-reports rendering format (F04 replaces it with ⚠ HALTS).
- Do NOT add new smoke phases (F05's job — phases 25-29).
- Do NOT modify `pi-epicflow-doctor` (F05's scope).
- Do NOT populate `batches`, `halts`, `ready_now`, `blocked_on_deps` with real data — emit empty arrays for now. F02/F03/F04 fill them.
- Do NOT add `started_at`, `completed_at`, `duration_sec` to feature JSON entries beyond stub null values (F02 implements timing).

## 6. Ambiguities

- **Baseline capture conditions:** The baseline file was captured non-interactively (no TTY), so ANSI codes won't be present. The `--json` error path outside an epic must go through `active_epic_dir` which currently calls `exit 1`. Need to intercept and produce exit 2 + JSON error. Resolution: wrap the `active_epic_dir` call and handle failure explicitly in the dispatcher.
- **`halts` key in feature JSON entries (AC 8):** design §1 shows `"halts": []` per feature. For F01, emit empty array per feature; F04 populates it. This is consistent with AC 9's approach for top-level arrays.

## 7. Estimated effort vs decomposition

- decomposition.yaml estimate: 8h
- planner estimate: 6h (rationale: the extraction is mechanical cut-paste; the JSON emitter is straightforward string-building in bash reading already-computed variables. Slight complexity in the `--json` error-outside-epic path.)

## 8. References

- design.md §1: JSON schema v1 definition — the authoritative shape for --json output.
- design.md §8: Risk that F01 schema errors cascade to F02-F04.
- design.md §9: schema_version=1 additive-forever decision; --json opt-in.
- decomposition.yaml F01 notes: "DO NOT change human output. The diff against v0.8.1 baseline is the safety net."
- `_common.sh:L34-L80` — provides `active_epic_dir`, `active_epic_id`, `yaml_get`, `pi_epicflow_version`, `pi_epicflow_age_days`.

---

## 9. Implementation detail: extraction map

### Line-range mapping (current pi-epic-status → target files)

| Current lines | Content | Target |
|---|---|---|
| 1-20 | shebang, comments, help text | dispatcher (keep) |
| 21-36 | arg parsing loop (`mode`, `quiet`) | dispatcher (keep) |
| 37-48 | __SCRIPT_DIR resolution, `source _common.sh` | dispatcher (keep) |
| 49-52 | `epic_dir`, `epic_id` variables | dispatcher (keep) |
| 53-160 | `if [[ "$mode" == "ready" ]]` block (Python heredoc) | `lib/pi-epic-status-ready.sh` as function `render_ready()` |
| 161-163 | `echo "Epic: ..."`, `echo "Folder: ..."` | dispatcher (inline, before sourcing renderers) OR top of features renderer |
| 164-183 | test_cmd bypass warning | keep in dispatcher (preamble to full mode) |
| 184-197 | pi-epicflow version + age | keep in dispatcher (preamble) |
| 198-231 | meta + extensions block | `lib/pi-epic-status-features.sh` as function `render_meta()` |
| 232-283 | features table (Python heredoc) | `lib/pi-epic-status-features.sh` as function `render_features()` |
| 284-292 | recent run-log | `lib/pi-epic-status-runlog.sh` as function `render_runlog()` |
| 293-299 | halt-reports | `lib/pi-epic-status-halts.sh` as function `render_halts()` |

### New dispatcher structure (~80 lines)

```
#!/usr/bin/env bash
# [original help comments preserved]
set -euo pipefail

# Arg parsing (lines 21-36 preserved exactly)
# __SCRIPT_DIR resolution (lines 37-48 preserved exactly)
# Source _common.sh

__LIB_DIR="$__SCRIPT_DIR/../lib"
source "$__LIB_DIR/pi-epic-status-ready.sh"
source "$__LIB_DIR/pi-epic-status-features.sh"
source "$__LIB_DIR/pi-epic-status-runlog.sh"
source "$__LIB_DIR/pi-epic-status-halts.sh"
source "$__LIB_DIR/pi-epic-status-json.sh"

# Resolve epic context
epic_dir=$(active_epic_dir) || {
    if [[ "${mode:-}" == "json" ]]; then
        echo '{"error": "not in an epic working tree"}' >&2
        exit 2
    fi
    exit 1
}
epic_id=$(active_epic_id)

# Dispatch
case "$mode" in
    ready) render_ready "$epic_dir" "$quiet" ;;
    json)  emit_json "$epic_dir" "$epic_id" ;;
    full)
        echo "Epic: $epic_id"
        echo "Folder: $epic_dir"
        echo
        # test_cmd warning (lines 164-183)
        # version+age (lines 184-197)
        render_meta "$epic_dir"
        render_features "$epic_dir"
        render_runlog "$epic_dir"
        render_halts "$epic_dir"
        ;;
esac
```

**Note:** The preamble blocks (test_cmd warning, version+age) that appear before "── meta ──" must remain in the dispatcher's `full` branch to preserve exact output order.

### `--json` flag addition to arg parser

Add `--json) mode="json" ;;` to the case statement.

### `lib/pi-epic-status-json.sh` structure (~120 lines)

```
#!/usr/bin/env bash
# JSON emitter for pi-epic-status --json

emit_epic_json() { ... }       # reads meta.yaml → epic object
emit_features_json() { ... }   # reads decomposition.yaml + feature meta → features array
emit_batches_json() { ... }    # STUB: outputs "[]" (F03 fills in)
emit_halts_json() { ... }      # STUB: outputs "[]" (F04 fills in)
emit_ready_json() { ... }      # STUB: outputs "[]" for ready_now and blocked_on_deps

emit_json() {
    local epic_dir="$1" epic_id="$2"
    printf '{\n'
    printf '  "schema_version": 1,\n'
    printf '  "epic": %s,\n' "$(emit_epic_json "$epic_dir")"
    printf '  "features": %s,\n' "$(emit_features_json "$epic_dir")"
    printf '  "batches": %s,\n' "$(emit_batches_json "$epic_dir")"
    printf '  "halts": %s,\n' "$(emit_halts_json "$epic_dir")"
    printf '  "ready_now": %s,\n' "$(emit_ready_json "$epic_dir" ready)"
    printf '  "blocked_on_deps": %s\n' "$(emit_ready_json "$epic_dir" blocked)"
    printf '}\n'
}
```

Each `emit_*_json` function is self-contained, so F02/F03/F04 can each modify ONE function without line-level conflicts.

### Estimated lines per file

| File | Est. lines |
|---|---|
| `pi-epic-status` (dispatcher) | 75-85 |
| `lib/pi-epic-status-ready.sh` | ~110 (Python heredoc mostly unchanged) |
| `lib/pi-epic-status-features.sh` | ~90 (meta + extensions + features Python heredoc) |
| `lib/pi-epic-status-runlog.sh` | ~15 |
| `lib/pi-epic-status-halts.sh` | ~15 |
| `lib/pi-epic-status-json.sh` | ~120 |

Total: ~430 lines (vs 299 original + ~130 new JSON code).

## 10. Behavior preservation strategy

1. **Before any edits:** capture three baselines in /tmp:
   - `pi-epic-status` (full mode) on /tmp/pe-v8-realapp → compare to provided baseline file.
   - `pi-epic-status --ready` on same epic.
   - `pi-epic-status --ready --quiet` on same epic.

2. **After extraction:** diff each captured baseline against post-refactor output. Zero diff = pass.

3. **Key pitfalls to avoid:**
   - Global variables (`epic_dir`, `epic_id`) must be accessible in sourced functions. Pass as arguments OR declare before sourcing.
   - The Python heredocs use `$epic_dir` via `sys.argv` — the wrapper function must forward these correctly.
   - The `exit 0` at the end of --ready mode must happen in the dispatcher after `render_ready` returns, NOT inside the lib file (to keep sourcing safe).
   - ANSI TTY detection (`[[ -t 1 ]]`) must still work from within sourced functions (it will — `[[ -t 1 ]]` checks the calling shell's stdout).

4. **`bash -n` pass:** ensure no syntax errors in any extracted file. Each lib file must NOT have `set -euo pipefail` (inherited from dispatcher via source). Each lib file should have a header comment and function definitions only — no top-level executable statements.

## 11. Risks / edge cases

- **Global var leakage:** sourced files share the caller's namespace. Variables in one lib file could collide with another. Mitigation: use `local` inside every function; avoid top-level variable declarations in lib files.
- **shellcheck SC2034 (unused vars) in dispatcher:** variables set in dispatcher and used in lib functions will trigger warnings if shellcheck doesn't follow sources. Mitigation: add `# shellcheck source=...` directives in dispatcher.
- **Python heredoc indentation:** the heredocs MUST be copied exactly (including the `PY` terminator at column 0). Any indentation change breaks them.
- **`active_epic_dir` failure mode:** currently it prints to stderr and does `exit 1`. The dispatcher's `--json` error path wraps this: `epic_dir=$(active_epic_dir 2>/dev/null)` and checks `$?`. Must verify that `active_epic_dir`'s stderr doesn't leak to the user's terminal in json mode.
- **Sourcing order matters:** `pi-epic-status-json.sh` calls helper functions that may need `_common.sh` utilities. Since _common.sh is sourced first in the dispatcher, this is safe.
