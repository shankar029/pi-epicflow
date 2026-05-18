# Epic review: 0002-deliverables-contract-v10

**Reviewer:** feature-epic-reviewer (fresh context)
**Branch:** epic/deliverables-contract-v10 vs main
**Date:** 2026-05-18
**Feature count:** 7

## 1. Pre-flight
- cwd: /home/shbs/code/experiments/pi-epicflow
- branch: epic/deliverables-contract-v10 ✓
- diff stat: 35 files changed, 3165 insertions(+), 2 deletions(-)
- default branch tip (D): main
- epic branch tip (E): c27e18e

## 2. Cross-feature consistency

### Lockfile / manifest churn
- Files touched: none (no package-lock.json, pnpm-lock.yaml, yarn.lock, Cargo.lock, go.sum, etc. in diff)
- Findings: clean

### No-op stubs left behind
- Grepped for: NotImplementedException, TODO, FIXME, stub-shaped returns in scripts/
- Scripts (`_common.sh`, `pi-epic-validate-decomposition`, `pi-feature-complete`, `pi-epic-complete`): **no stubs found** — all four pass `bash -n` and contain no TODO/FIXME markers.
- F03 worker-report has `_(pending)_` under completion evidence — but this is a journal artifact in the done/ folder, not shipped code. The actual prompt file (`prompts/epic-decompose.md`) has the full Deliverables section implemented.
- The `deliverables_summary` section in `templates/meta.yaml` is commented-out by design (AC #5 says "optional; populated by pi-epic-init if decomposition.yaml has them"). This is intentional — not a stub.
- Findings: **clean** — no orphaned stubs in shipped scripts/prompts.

### Orphaned references
- `feature_declared_deliverables` helper in `_common.sh` → consumed by `pi-feature-complete` (line ~135). ✓
- `_check_sdk_in_content` in validator → called in the deliverables trigger phase. ✓
- `e2e_cleanup` trap in `pi-epic-complete` → used via `trap e2e_cleanup EXIT INT TERM`. ✓
- `_E2E_TRIGGER_RE` / `_SDK_NAMES` in validator → consumed in the deliverables phase loop. ✓
- Cross-feature coherence: F01 declares template fields → F02 validator reads them → F04 helper parses them → F06 gate consumes the e2e config. Chain is coherent.
- Findings: **clean**

### Resource lifecycle symmetry
- `pi-epic-complete` E2E gate: `eval "$e2e_start_cmd" &` (start) paired with `e2e_cleanup()` trap (shutdown). The trap fires on EXIT/INT/TERM and also has explicit call before non-zero exit paths. ✓
- `E2E_START_PID` tracked and killed in cleanup. ✓
- **Minor observation:** If `e2e_start_cmd` fails immediately (invalid command), `E2E_START_PID` is still set to the failed background job PID. The `kill` in cleanup handles this gracefully (`2>/dev/null || true`), so no real leak.
- Findings: **clean** — lifecycle is properly symmetric with trap-based safety net.

## 3. Design-trace table

| Design section | Features that covered it | Status |
|----------------|--------------------------|--------|
| §1 Goal | F01-F07 (the entire epic implements this) | covered |
| §2 Motivation / why E2E | F06, F07 | covered |
| §3 Lessons in scope (L-006, L-035, L-043, L-044, L-045, L-046, L-047, L-053) | F01-F07 (referenced throughout) | covered |
| §4.1 decomposition.yaml gains optional deliverable fields | F01 | covered |
| §4.2 epic-config.yaml gains e2e: block | F01, F06 | covered |
| §4.3 pi-epic-validate-decomposition enforces trigger→deliverable | F02 | covered |
| §4.4 Halt codes H11 | F06 | covered |
| §5 Worker contract changes | F04 | covered |
| §6.1 Per-feature reviewer rubric changes | F05 | covered |
| §6.2 Epic reviewer rubric (E2E coverage rate) | F05 | covered |
| §7.1 pi-epic-validate-decomposition validator changes | F02 | covered |
| §7.2 pi-epic-complete E2E gate | F06 | covered |
| §8 Rollout / backward compatibility | F01 (backward compat verified), F02 (skip guard) | covered |
| §9 Real-app verification (L-047 mandate) | F07 | covered |
| §10 Decomposition sketch | F01-F07 (implemented as sketched) | covered |
| §11 Anticipated lessons (L-056/L-057) | F07 (promoted to confirmed) | covered |
| §12 Out of scope | N/A — exclusions, not requirements | N/A (boilerplate) |
| §13 Open questions | N/A — pre-init decisions, resolved | N/A (boilerplate) |

Uncovered sections: 0 — all design sections have corresponding feature implementations.

## 4. Rubber-stamp detector
- total features merged: 7
- run-log format: uses `feature-start`/`feature-complete` events only — **no `worker_runs` or `review_cycles` fields recorded**.
- review-report.md files: **NONE exist** for any of the 7 features.
- F03 deviation explicitly states: "Skipped the per-feature reviewer for F03 (orchestrator self-reviewed against ACs)."
- **Assessment:** The run-log lacks the `feature-merged` event shape with `worker_runs`/`review_cycles` that the standard rubric parses. All 7 features were merged in a single session (~1 hour total, 01:43–02:44 UTC) with no review reports persisted.

**Soft finding: no per-feature review reports persisted.** Cannot verify whether per-feature reviewers ran for F01, F02, F04, F05, F06, F07 (F03 explicitly skipped). The worker reports are substantive and include per-AC evidence with commands and output. Without review-report.md files, the safety net of independent review is undocumented for this epic. This is acceptable for a self-dogfood epic on the framework's own prompt/script files (where the orchestrator is the domain expert), but falls below the standard the framework prescribes for external users.

- spot-checked features: F01, F04, F06 (worker-report quality as proxy)
- worker-report evidence quality:
  - F01: cites concrete commands (`pi-epic-validate-decomposition` on v0.9 archive), exit codes, and field-by-field evidence. Substantive.
  - F04: cites per-AC bash commands with output snippets, `bash -n` results. Substantive.
  - F06: cites `bash -n`, full smoke test output, synthetic E2E success/failure cases with exact terminal output. Substantive.
- Verdict: **acceptable** — worker reports are substantive with concrete evidence; absence of review-report.md is a documentation gap rather than a quality gap for this self-dogfood epic.

## 5. Toolchain & test-gate coverage
- epic-config test_cmd: `""` (empty — autodetected)
- per-feature gate was: **no test_cmd configured; autodetection finds no package.json/Cargo.toml/go.mod/pyproject.toml** in the pi-epicflow repo (it's a shell/markdown skill, not a compiled project). Gate skipped silently for all features per `pi-feature-complete`'s log: "no test command detected; skipping."
- Real test suite: `bash install/smoke-test.sh` → exit 0 (29/29 smoke phases pass) ✓
- `bash -n` on all 4 modified scripts → exit 0 ✓
- Findings: The repo's only automated test is `install/smoke-test.sh` (a shell-based integration test). The epic-config.yaml `test_cmd` is empty and autodetection correctly finds nothing (no npm/cargo/pytest entry point). The smoke test is the effective gate and it passes. **No bypass detected** — the test_cmd is legitimately empty because this is a shell skill repo, not a compiled application. The smoke test covers the new deliverables features (phases 30-35 in design.md §10 would need to be added for full coverage, but F02's worker report shows manual validation exercises equivalent to those scenarios).

**Soft finding:** The smoke test (`install/smoke-test.sh`) does not yet include dedicated phases for the v0.10 deliverables features (the design's §10 mentions smoke phases 30-35 but these weren't added to the test script in this epic). The deliverables engine, pre-merge check, and E2E gate are verified via worker report evidence (synthetic runs) and F07's real-app verification, but there's no regression-preventing smoke phase that would catch future breakage.

## 6. Extension growth (v0.6.3+)
- extensions recorded: 0 (meta.yaml `extensions: []`)
- feature growth: N/A — no extensions applied
- Decomposition lesson recorded: N/A
- Findings: N/A — no extensions

## 7. Findings summary

### Hard findings: 0

### Soft findings: 3

1. **No per-feature review-report.md files persisted (§4).** All 7 features lack review reports. F03 explicitly skipped review (orchestrator-completed). The others have no documented independent review. Acceptable for self-dogfood but below the framework's own standard.

2. **Smoke test doesn't cover v0.10 deliverables features (§5).** Design §10 specified smoke phases 30-35 for the new deliverables engine, but `install/smoke-test.sh` still ends at phase 29. Future refactors could silently break the deliverables trigger engine with no automated regression signal.

3. **F07 substitutions: jsdom instead of browser E2E, 2 features instead of 3 (§9 audit below).** Both are logged as deviations with rationale. The jsdom substitution is an acceptable trade-off because F07's goal is verifying the *pi-epicflow mechanism* (shell-out → halt → report), not testing a specific browser framework. The 2-feature substitution is acceptable because both trigger rules (user-facing verbs + SDK detection) are exercised. However, neither substitution exercises Playwright's real-world failure modes (port conflicts, browser download failures, `npx playwright install` races), which are the #1 user-reported friction point for E2E in real projects.

## 8. Dimension audit

### 8.1 Cross-feature regression risk
F01's template fields are consumed by F02 (validator), F04 (pre-merge helper), and F06 (e2e gate). The field names are consistent across all consumers: `e2e_scenarios`, `mock_fixtures`, `docs_updates`, `changelog_entry`. Confirmed by grep:
- `_common.sh`: parses all four field names
- `pi-epic-validate-decomposition`: reads `e2e_scenarios`, `mock_fixtures`, `e2e_skip_reason`
- `pi-feature-complete`: delegates to `feature_declared_deliverables` helper
- `pi-epic-complete`: reads `e2e.enabled`, `e2e.start_cmd`, etc. from epic-config

**No regression detected.** Later features correctly build on earlier ones.

### 8.2 No-op-stub detection (F01 → F02+ wiring)
The new template fields (`e2e_scenarios`, `mock_fixtures`, etc.) added by F01 are consumed by:
- F02's validator (lines 795-850 of `pi-epic-validate-decomposition`): reads and enforces them
- F04's `feature_declared_deliverables` helper: parses them
- F04's `pi-feature-complete`: enforces existence at pre-merge
- F06's `pi-epic-complete`: reads `e2e.enabled` to fire the gate

**Not decoration.** All four new fields have enforcement paths wired by downstream features.

### 8.3 Design ↔ implementation drift
- Design §4.3 specifies: "validator hard-rejects" under strict mode. Implemented: exit 1 with `[error]` prefix. ✓
- Design §4.4 specifies H11 halt code with "Playwright HTML report path, console errors, video artifacts." Implemented: halt file includes command, exit code, last 50 lines, recovery link. **Partial drift:** halt file doesn't mention "HTML report path" or "video artifacts" specifically — it includes generic output. Acceptable because the gate is test-runner-agnostic (not Playwright-specific).
- Design §7.2 specifies "Write tests/e2e-report.json (parsed Playwright/test-runner output)." Implemented: copies `tests/e2e-report.json` if present, else writes minimal JSON stub. ✓
- Design §5 specifies worker-report template gains `## Declared deliverables`. Implemented in `agents/feature-worker.md`. ✓

**Minor drift:** The design repeatedly mentions "Playwright" by name, but the implementation is correctly test-runner-agnostic (any `run_cmd` works). This is an improvement over the design, not a gap.

### 8.4 Backward-compat scratch test
- v0.9-era `decomposition.yaml` (0001-observability-v09): validates clean with exit 0, identical output.
- Validator's backward-compat guard: `has_any_deliverable_field` check skips features without v0.10 fields.
- `pi-feature-complete`'s deliverables check: `feature_declared_deliverables` returns empty → "no declared deliverables; skipping."
- `pi-epic-complete` E2E gate: `e2e.enabled != "true"` → skips with log message.

**v0.9-era epics continue to work unchanged.** ✓

### 8.5 Worker-report honesty
- **F01:** Claims backward compat via running validator on v0.9 archive. Verified: I ran the same command and got identical output. ✓
- **F02:** Claims `bash -n` pass. Verified: confirmed independently. ✓
- **F03:** Worker-report shows `state: IN_PROGRESS` with `_(pending)_` for completion evidence. The deviations log explains: orchestrator completed F03 inline after worker subagent died. The actual prompt content is correct and complete. **Honest about the incompleteness.**
- **F04:** Claims synthetic deliverables check output. Cannot independently verify (synthetic fixtures were in `/tmp`). Evidence is plausible and structurally consistent with the code.
- **F06:** Claims synthetic E2E pass/fail cases. Evidence matches the bash logic in `pi-epic-complete`.
- **F07:** Claims halt-h11 produced with specific assertion failure text. Fixture in `/tmp/v010-realapp` — not persisted in repo (by design; `/tmp` fixtures are transient). Evidence is detailed and internally consistent.

**Assessment:** Worker reports are honest. F03's incomplete state is transparently logged. No overclaiming detected.

### 8.6 L-053 serialization patterns
The decomposition explicitly declares serial execution: "Likely serial because F01/F03/F06 all touch templates+prompts (shared aggregator files — see L-053)." Run-log confirms fully serial execution (each feature-start immediately follows previous feature-complete). `parallel.max_workers: 1` in epic-config.yaml.

**Correct acceptance of serial execution.** ✓

### 8.7 F07 L-047 verification quality
**What was verified:**
- Validator trigger engine fires correctly (both path-based and content-based SDK detection)
- Strict mode blocks missing deliverables (exit 1 with actionable message)
- E2E gate mechanism works (shell-out, capture exit code, produce halt or report)
- Planted bug caught by E2E but not unit tests (the `*0.9` multiplier)

**What was NOT verified (explicitly acknowledged in docs/v0.10-real-app-verification.md):**
- `pi-feature-complete` deliverables pre-merge check (would need full worktree dispatch)
- Feature-reviewer mock-honesty rubric (requires reviewer subagent)
- Feature-epic-reviewer reading e2e-report.json
- `e2e_skip_reason` suppression (code-reviewed only, not end-to-end)
- Parallel mode interactions

**Substitution assessment:**
- **jsdom instead of Playwright:** Acceptable. The verification goal is proving the pi-epicflow mechanism (validator → gate → halt → recovery). The test runner is a black box to pi-epicflow — it only cares about exit code. jsdom exercises the same assertion patterns and produces the same exit code behavior. The gap: browser-specific failures (port conflicts, binary downloads, timeout races) are NOT exercised. This is a real limitation for v0.11's "flip to default on" plan — operators hitting Playwright install issues won't have been pre-validated.
- **2 features instead of 3:** Acceptable. Both trigger rules are exercised. A 3rd feature would add test coverage for the `e2e_skip_reason` suppression path — currently only code-reviewed, not exercised in the fixture.

### 8.8 Deviations.md completeness
Logged deviations:
1. F02: `_common.sh` listed in scope_files but untouched (advisory scope)
2. F03: worker subagent died, orchestrator completed inline, reviewer skipped
3. F03: word count +30.8% (marginally over AC's 30% limit) — NOTE: final measurement shows 25.1% (4018/3213), so this deviation entry is slightly inaccurate in the stated percentage. The decision to ship is correct regardless.
4. F07: 2 features instead of 3
5. F07: vitest+jsdom instead of Playwright

**Missing deviation not logged:** The absence of per-feature review for F01, F02, F04, F05, F06, F07 is not called out in deviations.md. The F03 deviation explicitly mentions "skipped the per-feature reviewer" but only for F03. If the other 6 features also had no per-feature reviewer (no review-report.md exists for any), that's a process deviation that should be logged.

**Soft concern:** Either the reviews ran but weren't persisted (a tooling gap), or they were skipped silently for all features (a process gap undocumented in deviations.md).

### 8.9 Lessons distillation quality
- **L-056 (decomposition is the contract for everything):** CONFIRMED with concrete evidence — validator caught scope assignment mistakes, missing deliverables, and content-based SDK detection worked. Evidence is specific and reproducible.
- **L-057 (mocks owned by the importing feature):** CONFIRMED with the F02 mock-fixture example — same "worker" wrote both the calling code and the mock because they're in the same feature scope. Evidence is structural and sound.
- **L-058 (content-based SDK detection catches transitive imports):** NEW candidate. Evidence is specific (App.tsx importing from stripe-named module detected by Layer 2). This is a genuine new finding — the content-based detection layer is a non-obvious capability that decomposers should know about. Promotable to confirmed after one more epic exercises it.

**Quality assessment:** Lessons are evidence-backed with specific scenarios, not generic platitudes. L-056/L-057 promotions are justified. L-058 is correctly positioned as a candidate (single data point).

## 9. Credibility clause

Concrete weakness named: **No per-feature review reports exist for this epic (0/7 features have review-report.md). The framework's own dogfood epic did not fully exercise the per-feature reviewer gate it prescribes to users.** While acceptable for a self-dogfood epic where the orchestrator is the domain expert, this creates a credibility gap: the v0.10 reviewer rubric additions (F05: mock honesty, selector quality) were never actually exercised by a reviewer on real code during this epic. Their first real exercise will be on a user's epic — with no prior empirical validation of the rubric's actionability.

Three epic-level checks confirmed clean:
- Backward compatibility: v0.9-era decomposition validates identically under v0.10 code (verified by running validator)
- All bash scripts pass `bash -n` syntax check (4/4)
- Cross-feature field-name consistency: all consumers use identical field names (`e2e_scenarios`, `mock_fixtures`, `docs_updates`, `changelog_entry`) — no spelling divergence that would cause silent parse failures

## 10. Recommended follow-up backlog for v0.11

1. **Add smoke phases 30-35** to `install/smoke-test.sh` covering: deliverables trigger detection, strict mode enforcement, pre-merge deliverable check, E2E gate skip/pass/fail paths.
2. **Run the reviewer rubric additions (F05) on a real epic** — the mock-honesty and selector-quality rubrics have never been exercised by an actual per-feature reviewer. Validate actionability before promoting to hard findings in v0.11.
3. **Playwright-specific real-app verification** — exercise browser binary download, port-conflict recovery, and `npx playwright install` races before flipping `e2e.enabled` to default-on.
4. **Persist review-report.md files** — ensure the orchestrator writes review reports alongside worker reports for audit trail completeness. Consider making `pi-feature-complete` warn (not block) when review-report.md is absent.
5. **Fix deviations.md word-count claim** — F03 deviation says "+30.8%" but actual final is +25.1%. Minor documentation inconsistency.

Verdict: APPROVE_EPIC
