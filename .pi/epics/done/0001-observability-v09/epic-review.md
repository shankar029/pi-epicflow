# Epic review: 0001-observability-v09

**Reviewer:** feature-epic-reviewer (fresh context)
**Branch:** epic/observability-v09 vs main
**Date:** 2026-05-18
**Feature count:** 5

## 1. Pre-flight
- cwd: /home/shbs/code/experiments/pi-epicflow ✓ matches MAIN_REPO
- branch: epic/observability-v09 ✓ matches EPIC_BRANCH
- diff stat: 27 files changed, 2742 insertions(+), 275 deletions(-)
- commit history: 18 commits, linear (no merges), pattern: scaffold → feat → archive for each F01–F05
- default branch tip (D): main, epic branch tip (E): f907fbf

## 2. Cross-feature consistency

### Lockfile / manifest churn
- Files touched: none
- Findings: clean — this is a pure bash/shell project with no package manager lockfiles.

### No-op stubs left behind
- Grepped for: `TODO`, `FIXME`, `NotImplementedException`, `NotImplementedError`, stub-shaped returns (`return ""`, `return 0` guard patterns, `# stub`, `# placeholder`)
- Findings: clean. The `return 0` hits in lib files are all early-exit guards (e.g., `[[ -d "$features_dir" ]] || return 0` in halts.sh, `(( max_workers <= 1 )) && return 0` in batches.sh) — these are correct no-data-available guards, not unimplemented stubs. The F01 decomposition notes mentioned F03 would fill a batches.sh stub — confirmed filled: `render_batches()` is 160 lines of real implementation. All `emit_*_json()` stubs from F01 were filled by F02/F03/F04 respectively.

### Orphaned references
- Findings: clean. All 6 lib/*.sh files are sourced from the dispatcher (`pi-epic-status` lines 30–35). All render functions defined in lib files (`render_features`, `render_batches`, `render_halts`, `render_runlog`, `render_ready`, `emit_*_json`) are called from the dispatcher or from `emit_json()`. No dead exports or unreferenced functions found.

### Resource lifecycle symmetry
- Create/Destroy pairs verified: N/A — this epic adds bash functions and Python heredoc subprocesses; no resource allocation patterns (open/close, create/destroy) in the diff. All Python heredocs run as inline subprocesses (`python3 -c` or `python3 <<'PYEOF'`) that terminate naturally.
- Findings: clean

## 3. Design-trace table

| Design section | Features that covered it | Status |
|----------------|--------------------------|--------|
| §1 JSON output (`--json`) | F01 (schema skeleton + all 7 keys), F02 (timing fields), F03 (batches), F04 (halts) | **covered** |
| §2 Per-feature timing column | F02 (started/duration columns + formatting) | **covered** |
| §3 Batch visualization | F03 (batch detection, human render, JSON) | **covered** |
| §4 Halt visibility + recovery hints | F04 (⚠ HALTS section, recovery anchors) | **covered** |
| §5 Integration with `pi-epicflow-doctor` | F05 (Recent epic activity section) | **covered** |
| §6 Smoke coverage | F05 (phases 25–29, counter bump 24→29) | **covered** |
| §7 Out-of-scope (explicit) | N/A — exclusion list, not a requirement | **n/a** |
| §8 Risks | Addressed by F01 modularization (risk 1, 3) + run-log (risk 2) | **covered** |
| §9 Decisions log | N/A — meta-section, not a requirement | **n/a** |
| §10 Success criteria | All 5 criteria verified (see §5 below) | **covered** |

Uncovered sections: 0 — none

## 4. Rubber-stamp detector
- total features merged: 5
- single-pass approvals: 5 (100%) — all features had 1 worker run and 1 review cycle with APPROVE verdict
- Note: `total < 5` threshold not met (exactly 5, not `>= 5` with margin), but since rate is 100%, I applied the spot-check anyway.
- spot-checked features: F01, F03, F05
- review-report evidence quality:
  - F01: **file:line cited** — 12 ACs each with specific evidence (python3 assertions, `wc -l` output, `diff` exit codes, `bash -n` results). Substantive findings section with 6 items. Credible review.
  - F03: **file:line cited** — 6 ACs each with concrete evidence (human output quotes, JSON key assertions, code line references like `batches.sh:13`, `json.sh:180-181`). Notes on DRY concern. Credible review.
  - F05: **file:line cited** — 9 ACs each with line references (`smoke-test.sh:1375-1405`, `1461-1537`, etc.) and live-run evidence. Notes on worker-report.md reconstruction. Credible review.
- Verdict: **acceptable** — despite 100% single-pass rate, each review report demonstrates genuine verification with concrete evidence. The 5-feature sample is small enough that single-pass across all features is plausible for a well-decomposed epic by an experienced operator/worker.

## 5. Toolchain & test-gate coverage
- epic-config test_cmd: `""` (empty — autodetected at runtime)
- per-feature gate was: **effective via smoke-test.sh** — no bypass pattern (`echo SKIP`). The empty `test_cmd` means per-feature reviewers used `bash install/smoke-test.sh` as the validation suite, which is the project's actual test harness.
- real test suite run here: `bash install/smoke-test.sh` → exit 0, 29/29 phases pass, 54+ ✅ assertions, 0 ❌ failures
- `bash -n` on all lib/*.sh and dispatcher: all pass (syntax valid)
- `pi-epicflow-doctor` run: exits 0, shows "Recent epic activity" section ✓
- `pi-epic-status --json` run: exits 0, valid JSON, all 7 top-level keys present, `schema_version: 1` ✓
- Findings: **tests green** — no hard finding. Note: `test_cmd: ""` is not a bypass; it defers to auto-detection, and this project's auto-detected test is the smoke suite. All 5 per-feature reviewers ran the smoke test.

## 6. Extension growth (v0.6.3+)
- extensions recorded: 0 (empty `extensions: []` in meta.yaml)
- feature growth: 5 → 5 (+0%)
- Decomposition lesson recorded: n/a
- Findings: n/a — no extensions

## 7. Findings summary

### Hard findings: 0

### Soft findings: 3

1. **F03 and F04 both made out-of-scope edits to `scripts/pi-epic-status` (the dispatcher).** F03 added 2 lines (source + render_batches call), F04 reordered 1 line (render_halts before features). Both are justified — F01 should have wired the dispatcher for all render functions as part of its modularization AC. The decomposition lesson is correctly documented in `deviations.md`. Not a hard finding because the edits are minimal, non-conflicting, and the root cause (F01 AC gap) is identified. **Recommendation for future epics:** when a root feature creates stub files, its AC should include "dispatcher sources and calls each stub function in the correct order."

2. **F05 worker-report.md was reconstructed by the orchestrator, not written by the worker.** The 0-byte file scenario (L-054 candidate) was caught and handled, but it represents a gap in the worker→reviewer pipeline. The reconstructed report is accurate (verified independently), so no data-quality concern for this specific epic. **Recommendation:** implement the L-054 mitigations (incremental report writing, 0-byte = hard failure + re-spawn) before the next epic.

3. **L-049 serialization defeated the intended parallel batch.** F02/F03/F04 were designed for parallel dispatch but ran serially because all three declared `pi-epic-status-json.sh` in `scope_files`. This is the pre-check working correctly (file-level granularity is the safety property), but the dogfood demonstrates that real-world decompositions will frequently hit this pattern. **Recommendation:** the operator's decomposition lesson is well-stated — either split the shared file into per-concern files at decomposition time, or accept serialization. The system behaved safely; the throughput cost was 3x wall-clock vs theoretical.

## 8. Credibility clause

Three epic-level checks confirmed clean:
- **Cross-feature stub completion:** All 4 `emit_*_json()` stubs created by F01 were filled by their respective downstream features (F02→features, F03→batches, F04→halts, F05→ready_now/blocked_on_deps integration). No orphaned stubs remain. Verified by grep across all lib/*.sh files.
- **Design coverage:** All 7 substantive design sections (§1–§6, §10) are traceable to at least one feature's acceptance criteria with concrete implementation evidence. Zero uncovered requirements.
- **Smoke test regression:** The full 29-phase smoke suite passes end-to-end from the epic branch, including all 5 new observability phases AND all 24 pre-existing phases. No regression.

Concrete weakness named: F01's acceptance criteria were under-specified for the dispatcher wiring, causing F03 and F04 to both require out-of-scope edits to the same file. In a true parallel dispatch scenario, these edits could have conflicted textually (both touching the dispatcher's function-call sequence). The serial execution masked this — had the pre-check allowed parallel dispatch, F03 and F04 merging into the dispatcher simultaneously could have produced a broken call order.

---

## Appendix A: Linear history check
- `git log --oneline epic/observability-v09 ^main`: 18 commits, linear, no merge commits
- Pattern: `scaffold → feat → archive` for each F01–F05, plus 1 epic-init, 1 decomposition commit, 1 pending-edits commit
- ✓ Clean linear history

## Appendix B: Per-feature artifact completeness

| Feature | plan.md | worker-report.md | review-report.md | meta.yaml | Review verdict | Worker state |
|---------|---------|-------------------|-------------------|-----------|----------------|--------------|
| F01 | ✓ | ✓ | ✓ APPROVE | ✓ merged | APPROVE | READY |
| F02 | — (not required) | ✓ | ✓ APPROVE | ✓ merged | APPROVE | READY |
| F03 | — (not required) | ✓ | ✓ APPROVE | ✓ merged | APPROVE | READY |
| F04 | — (not required) | ✓ | ✓ APPROVE | ✓ merged | APPROVE | READY |
| F05 | — (not required) | ✓ (reconstructed) | ✓ APPROVE | ✓ merged | APPROVE | READY |

All 5 features: review verdict = APPROVE, worker state = READY, all required artifacts present.

## Appendix C: Design ↔ implementation traceability (sampled)

**Sample 1 — Design §1 AC: "`schema_version` equals integer 1; top-level keys present"**
→ F01 worker-report: "Extracted pi-epic-status into dispatcher + 5 lib sub-files ... `pi-epic-status-json.sh` (new JSON emitter)"
→ F01 review-report AC 6: "schema_version=1, all 7 top-level keys — evidence: python3 assertion confirms keys = {schema_version, epic, features, batches, halts, ready_now, blocked_on_deps}"
→ Independent verification: `pi-epic-status --json | python3` confirms keys and schema_version=1 ✓

**Sample 2 — Design §3 AC: "Batch block shows wall_clock, serial_sum, speedup_ratio, theoretical_max"**
→ F03 worker-report: "Created lib/pi-epic-status-batches.sh with render_batches() ... renders per-feature offsets, wall_clock, serial_sum, speedup_ratio, and theoretical_max"
→ F03 review-report AC 2: "wall_clock: 02:37 serial_sum: 07:50 speedup: 2.99x / 3.00x theoretical rendered in human output"
→ F03 review-report AC 6: "speedup_ratio=2.99 (within 2.7–3.0)" on /tmp/pe-v8-realapp ✓

## Appendix D: Lessons capture quality

**L-049 reinforcement (dogfood):** Thoroughly documented in `deviations.md` under "Orchestrator finding — L-049 pre-check serialized the intended parallel batch." Includes root cause, impact, mitigation options (a/b/c), and v0.9.1 backlog suggestion. Quality: excellent.

**L-054 candidate (0-byte worker-report):** Documented in F05 worker-report.md "Lessons candidate (L-054)" section with clear observation, root cause, and 3 mitigation options. Quality: good — actionable mitigations specified.

**L-055 candidate (worktree .git file):** Documented in F01 `deviations.md` under "out-of-scope file edit" and in the epic-level `deviations.md` F01 section. The 1-char fix (`-d` → `-e`) is committed. Quality: adequate — the fix is small but the lesson (worktree-aware file checks) generalizes.

**Suggested final lesson entries for `skills/epic-feature-workflow/lessons.md`:**

- **L-053: Observability — `pi-epic-status --json` schema v1 contract.** The v0.9 epic established a machine-readable JSON schema for epic status. The schema is additive-only (v1 forever). All future tooling (CI, dashboards, doctor) should consume `--json` rather than parsing human output.

- **L-054: Worker subagent can silently truncate output artifacts.** Observed: F05 worker completed all implementation but session ended before writing worker-report.md (0-byte file). The L-043 "missing Completion evidence section" check caught it, but a 0-byte file should be treated as a hard failure requiring re-spawn, not a partial artifact. Mitigation: write report incrementally (state: IN_PROGRESS header first, then fill sections).

- **L-055: Git worktrees use `.git` as a file, not a directory.** `[[ -d .git ]]` fails in worktrees; use `[[ -e .git ]]` or `git rev-parse --git-dir`. Any script that checks for `.git` directory presence will break when run from a worktree. Audit all such checks when adding worktree support.

## Appendix E: Honest dogfood verdict

**Did this epic prove pi-epicflow can ship features on its own codebase?** Yes, with caveats.

**What worked:**
- The full lifecycle (init → decompose → dispatch → worker → review → merge → archive) completed for all 5 features without manual intervention beyond the F05 worker-report reconstruction.
- The decomposition was well-structured: F01 as root/modularization, F02–F04 as parallel-eligible siblings, F05 as integrator.
- Per-feature reviewers produced substantive, evidence-backed review reports.
- The smoke suite grew from 24→29 phases with no regressions.
- Deviations were logged consistently and with genuine decomposition lessons.

**What the dogfood exposed:**
1. L-049 file-level pre-check serialized the intended 3-feature parallel batch — the safety property works but throughput suffers when features share files. Real signal for operators.
2. Worker subagent output artifact can be lost (L-054) — the pipeline has a partial safety net but needs hardening.
3. Root feature AC under-specification (F01 didn't wire dispatcher calls) caused downstream out-of-scope edits — decomposition quality matters.
4. Worktree `.git` file assumption (L-055) — pre-existing bug exposed by the workflow.

**Net assessment:** The epic shipped real, working functionality on the project's own codebase. The findings are genuine operational lessons, not blockers. The system's safety properties (L-049 pre-check, L-043 report validation) worked correctly — they prevented worse outcomes at the cost of throughput and manual recovery. This is the right tradeoff for a v0.9 release.

Verdict: APPROVE_EPIC
