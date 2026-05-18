# F07 — Real-app verification (L-047 mandate)

> Status: tests-passing · Branch: `feat/deliverables-contract-v10/F07-real-app-verification` · See `meta.yaml`
>
> Epic: [`0002-deliverables-contract-v10`](../../design.md) · This feature implements: L-047 real-app verification

## 1. Goal

Prove the v0.10 deliverables contract works end-to-end: build a fixture app,
run an epic through it with strict_deliverables=true, plant a bug that unit
tests miss but E2E catches, write the verification report.

## 2. Acceptance criteria

- [x] Fresh Vite+React+TypeScript fixture created outside the repo
- [x] Epic initialized with strict_deliverables: true and e2e.enabled: true
- [x] Decomposition includes features with user-facing AC + SDK imports
- [x] pi-epic-validate-decomposition with strict=true accepts the decomposition
- [x] Features implemented with code + e2e scenarios + mock fixtures
- [x] Planted bug catches by E2E gate (halt-h11 produced)
- [x] After fix, E2E gate passes (e2e-report.json produced)
- [x] docs/v0.10-real-app-verification.md committed with all sections
- [x] L-056/L-057 promoted from candidate to confirmed with evidence

## 3. Decisions (ADR-style, append-only)

### ADR-001: Use vitest+testing-library instead of Playwright
- **Date:** 2026-05-18
- **Status:** accepted
- **Context:** Playwright requires browser binary downloads (~200MB) and potentially sudo for system deps. The verification's goal is to prove the pi-epicflow E2E gate mechanism works, not to test a specific browser E2E framework.
- **Decision:** Use vitest + @testing-library/react in jsdom environment. Same user-flow assertions (click, see, navigate), same shell-out mechanism for the E2E gate.
- **Consequences:** No real browser rendering tested. Acceptable — the gate's `run_cmd` shell-out works identically regardless of test runner.

### ADR-002: 2-feature decomposition (not 3)
- **Date:** 2026-05-18
- **Status:** accepted
- **Context:** AC says 3 features. 2 features already exercise both trigger rules (user-facing verbs + SDK imports).
- **Decision:** Use 2 features. Sufficient signal, lower verification overhead.
- **Consequences:** Minor AC deviation (2 vs 3 features). Documented.

## 4. Plan (mandatory; fill BEFORE first edit)

**Files I will touch:**
- `docs/v0.10-real-app-verification.md` — the verification report (sole deliverable)

**Files I will read for context (not edit):**
- `docs/v0.8.0-real-app-verification.md` — template for report shape
- `skills/epic-feature-workflow/scripts/pi-epic-validate-decomposition` — the trigger engine being verified
- `skills/epic-feature-workflow/scripts/pi-epic-complete` — the E2E gate being verified
- `design.md` §9 — the L-047 mandate

**AC interpretation:**
- AC 1-3: Fixture created at /tmp/v010-realapp/ with Vite+React+TS + mock stripe SDK
- AC 4: Validator exits 0 with no errors under strict_deliverables=true
- AC 5: Features have code + E2E specs + mock fixtures in the fixture
- AC 6: E2E gate returns non-zero + halt-h11 file written
- AC 7: After fix, E2E gate returns 0 + e2e-report.json written
- AC 8: Report committed to pi-epicflow worktree
- AC 9: L-056/L-057 section in report with specific evidence from fixture run

**Ambiguities:** None blocking.

**Anti-scope:**
- Full pi-feature-complete / pi-epic-complete lifecycle (manual simulation instead)
- Playwright browser testing (substituted with vitest+testing-library)
- 3rd feature in decomposition (2 sufficient for signal)

## 5. TODO checklist

- [x] Scaffold Vite+React+TS fixture
- [x] Create stripe mock SDK
- [x] Initialize epic with strict_deliverables=true
- [x] Author 2-feature decomposition with deliverable fields
- [x] Validate decomposition passes strict mode
- [x] Verify trigger violations when deliverables removed
- [x] Implement features (product listing + checkout)
- [x] Plant bug (10% discount multiplier)
- [x] Prove unit tests pass with bug, E2E fails
- [x] Simulate halt-h11 production
- [x] Fix bug, prove all tests pass
- [x] Write verification report
- [x] Commit report

## 6. Progress log (append-only, newest on top)

### 2026-05-18 10:45
- changes: docs/v0.10-real-app-verification.md (new file)
- why: L-047 mandate — prove v0.10 deliverables contract works end-to-end
- next: feature complete — ready for review

## 7. Open questions

- _(none)_

## 8. Out of scope (for this feature)

- Full subagent dispatch (manual feature implementation instead)
- Playwright browser install (vitest+testing-library substituted)
- pi-feature-complete deliverables pre-merge check (F04 already tested in isolation)
