# Plan — F06 pi-epic-complete-e2e-gate

> Produced by feature-planner on 2026-05-18T12:00:00Z. This is the worker's
> binding contract; deviations require a `deviations.md` entry.

## 1. Goal (one sentence)

Insert an opt-in E2E test gate into `pi-epic-complete` that starts the app, polls readiness, runs a test command, captures output, always tears down, and halts with H11 on failure — between the feature-merge verification and the L-043 epic-review gate.

## 2. Files I will touch

- `skills/epic-feature-workflow/scripts/pi-epic-complete` — add `e2e-gate` phase (~60 lines) (existing)
- `skills/epic-feature-workflow/scripts/_common.sh` — no new helpers needed; reuse `yaml_get` with dotted paths (existing, read-only unless a helper is needed)
- `docs/recovery.md` — add §R11 section at end (existing)
- `skills/epic-feature-workflow/templates/epic-config.yaml` — add inline comment to existing `e2e:` block (existing)

## 3. Files to read for context (not edit)

- `skills/epic-feature-workflow/scripts/pi-epic-complete:L81-L95` — feature-merge check + epic-review gate boundary (insertion point)
- `skills/epic-feature-workflow/scripts/_common.sh:L56-L100` — `yaml_get` implementation (supports dotted paths like `e2e.enabled`)
- `skills/epic-feature-workflow/templates/epic-config.yaml:L77-L93` — existing `e2e:` block structure from F01
- `docs/recovery.md:L1-L30` — existing structure; R9 is the last section; R11 goes after R9
- `.pi/epics/done/0001-observability-v09/decomposition.yaml` — v0.9 file has no `e2e:` block; backward compat test target

## 4. AC interpretation (per criterion)

- **AC 1**: "pi-epic-complete inserts a new phase 'e2e-gate' between the existing feature-merge phase and the epic-review phase."
  - Literal expected: New code block inserted between line 89 (`[[ -z $(git status --porcelain) ]]...`) and line 91 (`# v0.7.0 / L-043 — epic-review gate.`) of `pi-epic-complete`.
  - Phase announced with: `log "e2e-gate: ..."`
  - Test: Run `pi-epic-complete` on a test epic with `e2e.enabled: true` + valid commands; observe the e2e-gate log lines appear before the epic-review gate log line.

- **AC 2**: "When epic-config.yaml e2e.enabled is false or absent, the phase logs '[e2e-gate] skipped (e2e.enabled: false)' and proceeds."
  - Literal expected: `log "[e2e-gate] skipped (e2e.enabled: false)"` — exact string.
  - Implementation: `e2e_enabled=$(yaml_get "$epic_dir/epic-config.yaml" e2e.enabled)` — if empty or "false", skip.
  - Test: Run pi-epic-complete on a v0.9-era epic (no e2e block at all); must complete successfully with the skip message. Also test with `e2e.enabled: false` explicitly set.

- **AC 3**: "When e2e.enabled is true: (1) run e2e.start_cmd as background job; (2) poll e2e.ready_check every 2s up to e2e.ready_timeout_sec (default 60); (3) run e2e.run_cmd, capture stdout+stderr to .pi/epics/<id>/e2e-output.log + exit code; (4) ALWAYS run e2e.shutdown_cmd in a bash trap."
  - Literal expected behavior:
    - `start_cmd` launched with `eval "$start_cmd" &` — PID captured: `start_pid=$!`
    - Poll loop: `while ! eval "$ready_check"; do sleep 2; elapsed+=2; if (( elapsed >= timeout )); then <fail>; fi; done`
    - `ready_timeout_sec` read via `yaml_get "$epic_dir/epic-config.yaml" e2e.ready_timeout_sec`; default to 60 if empty.
    - `run_cmd` output: `eval "$run_cmd" > "$epic_dir/e2e-output.log" 2>&1; run_exit=$?`
    - Trap recipe (see §Approach below).
  - Test: bash -n + manual invocation with `start_cmd: "python3 -m http.server 8199"`, `ready_check: "curl -fs http://localhost:8199"`, `run_cmd: "curl http://localhost:8199"`, `shutdown_cmd: "kill $E2E_START_PID"`.

- **AC 4**: "On non-zero exit code from run_cmd: write .pi/epics/<id>/halt-h11-e2e-<UTC-timestamp>.md containing the failing command, exit code, last 50 lines of stdout/stderr, and a link to docs/recovery.md#r11-e2e-failure. Exit pi-epic-complete with non-zero status."
  - Halt file name: `halt-h11-e2e-$(date -u +%Y%m%dT%H%M%SZ).md`
  - Content template:
    ```
    # Halt H11 — E2E gate failure

    **Command:** <run_cmd>
    **Exit code:** <N>
    **Timestamp:** <ISO>
    **Output log:** .pi/epics/<id>/e2e-output.log

    ## Last 50 lines of output

    ```
    <tail -50 e2e-output.log>
    ```

    ## Recovery

    See [docs/recovery.md#r11-e2e-failure](../../docs/recovery.md#r11-e2e-failure)
    ```
  - Test: Provide a `run_cmd` that exits non-zero; verify halt file is created with correct format.

- **AC 5**: "On zero exit: write tests/e2e-report.json (or .pi/epics/<id>/e2e-report.json) if e2e.run_cmd produced one; otherwise write a minimal JSON {schema_version: 1, exit_code: 0, run_cmd: '...', completed_at: '...'}."
  - Location: `$epic_dir/e2e-report.json` (inside the epic dir, per design §7.2 "parsed… output for epic-reviewer").
  - If run_cmd produces `tests/e2e-report.json` in repo root: copy it to `$epic_dir/e2e-report.json`.
  - If not present: write minimal JSON stub:
    ```json
    {"schema_version":1,"exit_code":0,"run_cmd":"<cmd>","completed_at":"<ISO>"}
    ```
  - Test: Verify file exists after successful run; validate JSON with `python3 -c "import json; json.load(open(...))"`.

- **AC 6**: "docs/recovery.md gains a new section #r11-e2e-failure with: bisect recipe (most recent feature first), how to inspect e2e-output.log, how to resume after fixing."
  - Anchor: `## R11 — E2E gate failure (H11, v0.10+)` with HTML anchor `{#r11-e2e-failure}` or just relying on GitHub's auto-anchor from the heading text.
  - Content: ~40 lines following existing R1-R9 structure (Symptom → Root cause → Recovery → Verification → Prevention).
  - Test: `grep -c "r11-e2e-failure\|R11" docs/recovery.md` returns ≥1.

- **AC 7**: "epic-config.yaml template's e2e: block (from F01) gains a brief inline comment block: 'pi-epic-complete will shell out to start_cmd / ready_check / run_cmd / shutdown_cmd verbatim. Operator owns lifecycle.'"
  - Literal: Add a 2-3 line comment inside the existing `e2e:` block in `skills/epic-feature-workflow/templates/epic-config.yaml`.
  - The F01-added block already has explanatory comments; augment with the operator-lifecycle note.
  - Test: `grep "Operator owns" skills/epic-feature-workflow/templates/epic-config.yaml`.

- **AC 8**: "bash -n on pi-epic-complete passes."
  - Literal: `bash -n skills/epic-feature-workflow/scripts/pi-epic-complete` exits 0.
  - Test: Run it.

## 5. Anti-scope

- NOT implementing `--skip-e2e` flag on `pi-epic-complete` (could be added later; not in AC).
- NOT parsing Playwright HTML report or video artifacts (design mentions them as future; AC only requires exit code + stdout/stderr capture).
- NOT adding `e2e_skip_reason` logic to this script (that's F02's validator concern).
- NOT adding new helpers to `_common.sh` — `yaml_get` with dotted path `e2e.enabled` already works per the existing Python heredoc implementation (line 56-100 of `_common.sh`).
- NOT implementing parallel E2E or tag-based scenario selection (design §8.3 — v0.12+).
- NOT touching `pi-epic-validate-decomposition` (F02's scope).

## 6. Ambiguities

- **ready_timeout_sec default source:** AC says "default 60". Plan: hardcode `60` as fallback when `yaml_get` returns empty. This matches the template's commented example. No ambiguity — resolved by AC text + template.
- **shutdown_cmd + kill PID:** Should we kill `start_pid` as backup after `shutdown_cmd` runs? **Resolution:** Yes — trap runs `shutdown_cmd` first, then `kill $start_pid 2>/dev/null || true` as belt-and-suspenders. Design says "always tear down"; killing the PID ensures no leak even if `shutdown_cmd` is incomplete.
- **e2e-report.json location:** AC says "tests/e2e-report.json (or .pi/epics/<id>/e2e-report.json)". Plan: use `$epic_dir/e2e-report.json` as canonical location. If `tests/e2e-report.json` exists in repo root after run_cmd, copy it there. This keeps epic artifacts self-contained.

## 7. Estimated effort vs decomposition

- decomposition.yaml estimate: 4h
- planner estimate: 4h (appropriate — core logic is ~60 lines of bash; recovery.md section is templated; trap pattern is well-understood)

## 8. References

- design.md §7.2: E2E gate is between feature-merge and epic-review; shell out verbatim; trap on EXIT; halt H11.
- design.md §4.4: H11 halt code; halt-report includes report path + console errors.
- `pi-epic-complete:L81-L89` — feature-merge check boundary (insertion after L89).
- `pi-epic-complete:L91-L133` — epic-review gate (insertion before this).
- `_common.sh:L56-L100` — `yaml_get` supports dotted paths (verified: `parts = key.split('.')` on line ~60).
- `epic-config.yaml:L77-L93` — existing `e2e:` block with commented fields.
- `docs/recovery.md` — R9 is the last section (line ~300); R11 appends after cross-links section at end.
- `.pi/epics/done/0001-observability-v09/decomposition.yaml` — no `e2e:` block, no `epic-config.yaml` e2e section → backward compat verified (skip path fires).

## 9. Implementation approach (binding)

### Phase order

1. **AC 2 first** — skip-when-disabled. Simplest, ensures backward compat immediately.
2. **AC 3** — core lifecycle (start → poll → run → trap shutdown). The main logic.
3. **AC 4** — halt file on failure.
4. **AC 5** — e2e-report.json on success.
5. **AC 1** — verified by placement (between L89 and L91 of current file).
6. **AC 7** — template comment (trivial).
7. **AC 6** — recovery.md section.
8. **AC 8** — bash -n verification.

### Bash trap recipe (AC 3, detail)

```bash
# ---- E2E gate ----
e2e_enabled=$(yaml_get "$epic_dir/epic-config.yaml" e2e.enabled)
if [[ "$e2e_enabled" != "true" ]]; then
    log "[e2e-gate] skipped (e2e.enabled: false)"
else
    log "[e2e-gate] starting..."
    e2e_start_cmd=$(yaml_get "$epic_dir/epic-config.yaml" e2e.start_cmd)
    e2e_ready_check=$(yaml_get "$epic_dir/epic-config.yaml" e2e.ready_check)
    e2e_ready_timeout=$(yaml_get "$epic_dir/epic-config.yaml" e2e.ready_timeout_sec)
    e2e_shutdown_cmd=$(yaml_get "$epic_dir/epic-config.yaml" e2e.shutdown_cmd)
    e2e_run_cmd=$(yaml_get "$epic_dir/epic-config.yaml" e2e.run_cmd)
    [[ -z "$e2e_ready_timeout" ]] && e2e_ready_timeout=60

    # Start app in background
    E2E_START_PID=""
    e2e_cleanup() {
        if [[ -n "$e2e_shutdown_cmd" ]]; then
            eval "$e2e_shutdown_cmd" 2>/dev/null || true
        fi
        if [[ -n "$E2E_START_PID" ]]; then
            kill "$E2E_START_PID" 2>/dev/null || true
            wait "$E2E_START_PID" 2>/dev/null || true
        fi
    }
    trap e2e_cleanup EXIT INT TERM

    eval "$e2e_start_cmd" &
    E2E_START_PID=$!

    # Poll ready_check
    elapsed=0
    while ! eval "$e2e_ready_check" >/dev/null 2>&1; do
        sleep 2
        elapsed=$((elapsed + 2))
        if (( elapsed >= e2e_ready_timeout )); then
            log "[e2e-gate] ready_check timed out after ${e2e_ready_timeout}s"
            e2e_cleanup
            trap - EXIT INT TERM
            # Write halt file for timeout (treat as H11)
            ...write halt...
            exit 1
        fi
    done
    log "[e2e-gate] app ready after ${elapsed}s"

    # Run test command
    set +e
    eval "$e2e_run_cmd" > "$epic_dir/e2e-output.log" 2>&1
    run_exit=$?
    set -e

    # Cleanup (also runs via trap, but explicit call ensures it runs before halt logic)
    e2e_cleanup
    trap - EXIT INT TERM

    if (( run_exit != 0 )); then
        # AC 4: write halt file
        ...
        exit 1
    else
        # AC 5: write e2e-report.json
        ...
    fi
fi
# ---- End E2E gate ----
```

**Key trap reliability notes:**
- `trap e2e_cleanup EXIT INT TERM` covers: normal exit, Ctrl-C, kill -TERM.
- `kill -9` (SIGKILL) cannot be trapped — documented limitation; operator's `shutdown_cmd` should be resilient (e.g. `pkill -f` rather than relying on PID).
- Trap is cleared (`trap - EXIT INT TERM`) after explicit cleanup to avoid double-run on normal exit path.
- `set +e` around `eval "$e2e_run_cmd"` prevents `set -euo pipefail` from exiting before we capture the exit code.
- `wait "$E2E_START_PID"` in cleanup prevents zombie processes.

### Halt file template (AC 4)

Written to: `$epic_dir/halt-h11-e2e-$(date -u +%Y%m%dT%H%M%SZ).md`

### e2e-report.json (AC 5)

Written to: `$epic_dir/e2e-report.json`
- If `$repo/tests/e2e-report.json` exists after run_cmd: `cp` it to `$epic_dir/e2e-report.json`.
- Otherwise: write minimal JSON stub via heredoc.

### recovery.md §R11 (AC 6)

Structure follows existing R1-R9 pattern:
- **Symptom:** `pi-epic-complete` exited non-zero with `halt-h11-e2e-*.md` in the epic dir.
- **Root cause:** E2E test suite failed after all features merged; likely a cross-feature integration bug or environment issue.
- **Recovery:** Bisect recipe — check `e2e-output.log`, identify failing test, correlate with most-recently-merged feature (features merge in DAG order; most recent is most suspect). Fix in a patch commit on epic branch, re-run `pi-epic-complete`.
- **Verification:** `pi-epic-complete` succeeds; `e2e-report.json` shows all passing.
- **Prevention:** Ensure per-feature E2E scenarios pass individually before merge (future v0.11 per-feature E2E gate).

## 10. Risks

- **Trap reliability on SIGKILL:** Cannot trap SIGKILL; document this. `shutdown_cmd` should be idempotent and kill by pattern, not just stored PID.
- **Port conflict:** If `start_cmd` binds a port already in use, `ready_check` will never succeed → timeout → H11 halt. The halt file will say "timed out" which is actionable enough.
- **Log file size:** If `run_cmd` is verbose, `e2e-output.log` could be large. We only embed last 50 lines in halt file; full log stays on disk. No truncation of the log file itself (operator's responsibility).
- **`set -e` interaction:** Must use `set +e` / `set -e` around eval of `run_cmd` to capture exit code without triggering pipefail abort.
