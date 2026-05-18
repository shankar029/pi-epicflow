# v0.10 — Decomposition as the deliverables contract (E2E as first proof)

**Epic slug:** `deliverables-contract-v10`
**Target release:** v0.10.0
**Status:** design — pre-decomposition review

---

## 1. Goal

Extend `decomposition.yaml` so that **every deliverable surface the epic ships** is enumerated at decomposition time and assigned to a feature — not bolted on at gate time. Ship end-to-end testing as the first concrete proof of this pattern: features declare their E2E scenarios + mock fixtures alongside `scope_files`, workers produce them as part of READY, the per-feature reviewer audits them, and `pi-epic-complete` runs a thin shell-out test gate.

**This is L-044 generalized one level up:** "every public-facing surface in the release checklist" becomes "every deliverable surface in decomposition."

## 2. Motivation

### Symptom (user-observed)

> "Workers add unit and integration tests but I see a lot of bugs once I start testing. Instead of me finding these bugs I want pi-epicflow to do E2E tests."

The current workflow gates verify:
- **Per-feature reviewer (L-006):** scope honesty, code correctness in isolation.
- **`pi-feature-complete`:** smoke + test_cmd, integration shells (L-045) wired.
- **`pi-epic-complete` epic-review (L-043):** cross-feature lockfile drift, no-op stubs, design ↔ implementation traceability.

None of these exercise the running application against a user-observable contract. A test_cmd that passes proves "functions return X"; it does not prove "the login button is visible and clickable."

### Why this is L-043 one layer up

L-043 distilled the rule: *per-feature reviewers are blind to cross-feature bugs by design; the epic gate has to look across features.* The same shape applies one layer up: **per-feature reviewers are blind to user-observable bugs by design; an E2E gate has to look at the running app.** L-043 motivated `feature-epic-reviewer`; this motivates an E2E test gate.

### Why "build mocks at gate time" is wrong (the design pivot)

An initial design considered an `e2e-tester` agent at the gate that would generate scenarios + author mocks from inspection. That design fails because:

1. **Gate time is the worst time to write mocks.** The agent has never read the code; it must infer call shapes from types it has to discover. Hits H12 (unmockable dep) constantly.
2. **The worker who imported the SDK is the right entity to mock it.** It just wrote the calling code; it knows the actual call shape, response types, error paths. Mock authorship is a *feature deliverable*, not a gate-time chore.
3. **Late-binding work hides decomposition mistakes.** If a feature touches a dep that can't be mocked, decomposition should know that *before* the worker starts, not at the gate.

So mocks move into features. E2E scenarios move into features. The gate becomes a trivial shell-out: `npx playwright test`.

### Why this generalizes (L-056 candidate)

E2E is the most visible application of a deeper rule: **decomposition is the contract for everything the epic ships.** Today decomposition tracks code increments + scope; deliverables like docs, migrations, changelog entries, mocks, E2E scenarios, public examples are all "magically appear at the end" surfaces — which is exactly why they drift, lag, or get skipped.

Extending decomposition to list *all* deliverable surfaces per feature gives one validator one rule shape: *"if trigger T fires in feature F's AC or scope, deliverable D must be declared and produced."* E2E + mocks is the first instantiation. Docs, migrations, changelog, examples are subsequent applications under the same engine.

## 3. Lessons in scope

| Lesson | How it applies |
|---|---|
| L-006 (workers honest about scope) | Extended: workers honest about *all declared deliverables*, not just code files |
| L-035 (defer the orchestrator, ship the manual aid) | Gate is shell-out to operator-declared `e2e.run_cmd`; no clever orchestration in v0.10 |
| L-043 (per-feature blind to cross-cutting) | E2E gate is the user-observable equivalent of the epic-review gate |
| L-044 (every public surface enumerated in checklist) | Generalized to every deliverable surface enumerated in decomposition (L-056) |
| L-045 (integration shells in scope_files) | Same enforcement engine: trigger verbs in AC → required deliverable declared |
| L-046 (detect + suggest, don't auto-install) | Playwright is BYO; `epic-config.yaml e2e.install_hint` documents the install |
| L-047 (heuristics need real-app verification) | F07 is the mandatory real-app verification feature |
| L-053 (file-level scope-conflict pre-check) | Likely-serial epic; declare upfront, don't try to force parallel |

## 4. Core design — three additive changes

### 4.1 `decomposition.yaml` gains optional deliverable fields

Per-feature, new optional fields. All default to empty/absent for backward compat:

```yaml
- id: F03
  slug: stripe-checkout
  depends_on: [F01]
  scope_files:
    - src/billing/stripe.ts
    - src/billing/stripe.test.ts
  e2e_scenarios:
    - tests/e2e/billing/checkout.spec.ts
  mock_fixtures:
    - tests/e2e/_fixtures/stripe.ts
  docs_updates:
    - docs/billing.md
  changelog_entry: true
  acceptance_criteria:
    - "User can complete a Stripe checkout from /pricing → success page"
    - "tests/e2e/billing/checkout.spec.ts passes against the local dev server"
  estimated_hours: 4
```

The new fields become **first-class scope_files** semantically: same scope-discipline enforcement, same per-feature reviewer audit, same `pi-feature-complete` refusal if declared deliverables are missing.

### 4.2 `epic-config.yaml` gains an `e2e:` block

Operator declares how to bring up the app + run the suite. pi-epicflow shells out verbatim, never infers:

```yaml
e2e:
  enabled: true
  install_hint: "npm install -D @playwright/test && npx playwright install chromium"
  start_cmd: "npm run dev"
  start_url: "http://localhost:5173"
  ready_check: "curl -fs http://localhost:5173 >/dev/null"
  ready_timeout_sec: 60
  shutdown_cmd: "pkill -f 'vite'"
  run_cmd: "npx playwright test"
```

When `enabled: false` (default), nothing in this epic changes from v0.9.x behavior.

### 4.3 `pi-epic-validate-decomposition` enforces trigger → deliverable

A new validation pass, off by default in v0.10, on by default in v0.11:

```yaml
# in epic-config.yaml
strict_deliverables: false   # v0.10 default; v0.11 will flip
```

When strict mode is on, the validator hard-rejects:

| Trigger detected in feature | Required deliverable |
|---|---|
| AC contains user-facing verbs (`user`, `click`, `see`, `display`, `navigate`, `submit`, `GET /`, `POST /`) | `e2e_scenarios:` non-empty |
| `scope_files` imports a known external SDK (configurable list: `stripe`, `openai`, `twilio`, `aws-sdk`, etc.) | `mock_fixtures:` non-empty |
| Feature ships any user-observable behavior change | `changelog_entry: true` |
| AC mentions public API/contract | `docs_updates:` non-empty |

Same shape as the existing L-045 integration-shell check. Failures emit specific actionable errors:

```
F03 stripe-checkout: AC #1 contains user-facing verb 'click', but e2e_scenarios is empty.
  Add at minimum: tests/e2e/billing/checkout.spec.ts to e2e_scenarios.
  Or add e2e_skip_reason explaining why this AC has no E2E surface.
```

### 4.4 Halt codes H11

- **H11: E2E suite failed** at `pi-epic-complete` gate. Halt-report includes Playwright HTML report path, console errors, video artifacts. Recovery anchor `docs/recovery.md#r11-e2e-failure` documents the bisect recipe (most recent feature first).
- *No H12.* The "unmockable dep" failure mode is moved upstream to `pi-epic-validate-decomposition`, which rejects the decomposition. The gate never has to halt on missing mocks.

## 5. Worker contract changes

`agents/feature-worker.md` gains a new section: **Declared deliverables**.

Today the worker produces:
1. Code changes to `scope_files`.
2. Unit/integration tests (often discovered ad hoc).
3. `worker-report.md` with `## Completion evidence`.

Under v0.10:

1. Code changes to `scope_files`.
2. Unit/integration tests **plus** every file listed in `e2e_scenarios`, `mock_fixtures`, `docs_updates`.
3. `worker-report.md` with `## Completion evidence` covering **every declared deliverable**, not just the production ACs.

`pi-feature-complete` extends its pre-merge check: for every file in the feature's declared deliverable fields, the file must exist in the worktree AND have been modified in the feature's commits (`git diff main..HEAD --name-only`). Missing or unmodified declared deliverables = refuse merge, suggest re-spawn the worker.

## 6. Reviewer contract changes

### 6.1 Per-feature reviewer (`agents/feature-reviewer.md`)

New rubric items audited alongside code:

- **Mock honesty:** does each fixture in `mock_fixtures` match the actual SDK contract? Read the SDK's TypeScript types or OpenAPI definitions if available; verify the fixture's response shapes are real, not hallucinated. Hard finding if the mock returns a shape the real API never produces.
- **E2E selector quality:** are selectors stable (data-testid, role-based) or cargo-culted (random class names, xpath)? Soft finding for fragile selectors.
- **AC ↔ scenario coverage:** every user-facing AC maps to at least one scenario assertion. Soft finding if there's slippage (e.g. AC says "user sees X" but no scenario asserts X is visible).

### 6.2 Epic reviewer (`agents/feature-epic-reviewer.md`)

Reads `tests/e2e-report.json` (output of `e2e.run_cmd`) as evidence input alongside the diff. Existing rubric continues; new rubric item:

- **E2E coverage rate:** ratio of (passing scenarios) ÷ (declared scenarios across all features). Reports any features with declared `e2e_scenarios:` whose scenarios are missing from the run, skipped without `e2e_skip_reason`, or failing.

## 7. Gate / validator changes

### 7.1 `pi-epic-validate-decomposition`

New deliverables enforcement pass when `strict_deliverables: true`. Each rule is mechanical (string + glob matching against scope_files and AC text). Rules table is configurable in `epic-config.yaml` under `deliverable_rules:` so operators can tune their own triggers + required-deliverables map.

### 7.2 `pi-epic-complete` E2E gate

New step inserted **between** the per-feature merge phase and the L-043 epic-review gate:

```
1. (existing) Per-feature merges complete; epic branch at HEAD.
2. (NEW) If epic-config.yaml e2e.enabled = true:
     a. Run e2e.start_cmd in background.
     b. Poll e2e.ready_check until OK or e2e.ready_timeout_sec.
     c. Run e2e.run_cmd; capture output, exit code, HTML report path.
     d. Always run e2e.shutdown_cmd (trap).
     e. On non-zero exit: write halt-h11-e2e-<timestamp>.md at epic root; abort.
     f. Write tests/e2e-report.json (parsed Playwright/test-runner output) for epic-reviewer.
3. (existing) Run feature-epic-reviewer agent with e2e-report.json as additional input.
4. (existing) Archive, lessons distillation, push.
```

The gate is **opt-in** in v0.10 (off by default in `epic-config.yaml` template); flips to opt-in-per-epic in v0.11 once verified.

## 8. Rollout / backward compatibility

### 8.1 v0.10 (this epic)

- New fields are **optional** in `decomposition.yaml`.
- `strict_deliverables: false` is the default.
- `e2e.enabled: false` is the default.
- Existing epics (v0.7–v0.9) continue to validate + complete unchanged.

### 8.2 v0.11 (anticipated follow-up)

- Flip `strict_deliverables: true` as default in the `epic-config.yaml` template.
- Add F-style deliverable rules for other categories (migrations, examples).
- Add `e2e_skip_reason` audit to per-feature reviewer.

### 8.3 v0.12+ (speculative)

- Parallel E2E execution.
- Tag-based scenario selection (run `@smoke` per-feature; run full suite per-epic).
- Conformance harness for SDK mock fixtures (run real SDK against fixture, verify shapes match).

## 9. Real-app verification (L-047 mandate)

The v0.7.3 lesson is non-negotiable: heuristic-shaped features must be verified on a real app, not just smoke fixtures. F07 of this epic is the verification feature.

**Target app:** Vite + React + TypeScript single-page app with Stripe checkout. Either:
- Resurrect the v0.8.0 verification fixture (parallel-todo) and extend it with a Stripe-mock-driven checkout flow.
- Spin up a fresh fixture explicitly for E2E verification.

**Success criteria for F07:**
1. Decompose a 3–4 feature epic on the fixture (e.g. "add Stripe checkout").
2. Decomposer emits `e2e_scenarios` + `mock_fixtures` per feature.
3. `pi-epic-validate-decomposition --strict` passes with no manual edits.
4. Workers produce scenarios + fixtures; per-feature reviewers APPROVE.
5. `pi-epic-complete` runs `npx playwright test`; all scenarios pass.
6. **Inject a deliberate bug** in a worker's code that unit tests miss but E2E catches. Confirm halt H11 + bisect recipe leads operator to the introducing commit.
7. Report committed to repo as `docs/v0.10-real-app-verification.md`.

## 10. Decomposition sketch (for review before `pi-epic-init`)

7 features. Estimated 22–28 hours. Likely serial due to shared schema/prompt files (L-053 explicitly declared upfront, not fought).

| ID | Title | scope_files (high-level) | Est | Depends |
|---|---|---|---|---|
| F01 | Decomposition schema upgrade | `prompts/epic-decompose.md`, `skills/.../templates/decomposition.yaml`, `skills/.../templates/epic-config.yaml`, `prompts/epic-design.md` | 3h | — |
| F02 | Validator: trigger → deliverable engine | `skills/.../scripts/pi-epic-validate-decomposition` | 5h | F01 |
| F03 | Decomposer prompt teaches deliverables | `prompts/epic-decompose.md` | 3h | F01, F02 |
| F04 | Worker contract: declared deliverables | `agents/feature-worker.md`, `skills/.../scripts/pi-feature-complete` (pre-merge check), `skills/.../scripts/_common.sh` (helper to list declared deliverables for a feature) | 4h | F01 |
| F05 | Reviewer rubric: mock honesty + E2E quality | `agents/feature-reviewer.md`, `agents/feature-epic-reviewer.md` | 3h | F01 |
| F06 | `pi-epic-complete` E2E gate + H11 halt code | `skills/.../scripts/pi-epic-complete`, `skills/.../templates/epic-config.yaml`, `docs/recovery.md` | 4h | F01, F02 |
| F07 | Real-app verification (L-047) | `docs/v0.10-real-app-verification.md`, optional new fixture under `scratch/` or external | 5h | F01-F06 |

**Smoke phases to add (target: 29 → 35):**
- [30/35] L-056: validator detects user-facing AC verb → requires e2e_scenarios
- [31/35] L-056: validator detects known-SDK import → requires mock_fixtures
- [32/35] L-056: `strict_deliverables: false` → no enforcement (backward compat)
- [33/35] L-057: pi-feature-complete refuses merge when declared deliverable file missing
- [34/35] L-057: `epic-config.yaml e2e.enabled: false` → pi-epic-complete skips E2E gate
- [35/35] H11: synthetic E2E failure produces halt-h11-*.md + recovery anchor

## 11. Anticipated lessons (L-056 / L-057)

These will be distilled from the v0.10 epic, not pre-written. Likely shape:

- **L-056:** decomposition is the contract for everything the epic ships, not just code increments. When the epic's success depends on a deliverable (test scenario, mock, doc, migration), enumerate it at decomposition and assign it to a feature. The same enforcement engine (trigger → required deliverable) applies across categories.
- **L-057:** mocks are owned by the feature that imports the real dep, never authored at gate time. The worker who imported the SDK is the right entity to write its fixture — it knows the call shape, response types, and error paths. Gate-time mock construction is the worst possible time.

## 12. Out of scope (deliberately)

- **Generating E2E scenarios from ACs automatically.** v0.10 ships execution + audit only. Scenario authorship is the worker's job. Auto-generation is a v0.12+ heuristic-shaped feature that needs its own verification gate.
- **Database setup / migration runners.** Operator declares `start_cmd` that handles DB setup; pi-epicflow doesn't try to be a fixture manager.
- **Visual regression / screenshot diffing.** Out of scope; Playwright's snapshot machinery can be used by the operator if desired, but pi-epicflow doesn't wrap it.
- **CI integration.** Out of scope; `pi-epic-complete` runs locally as today.

## 13. Open questions (need user call before `pi-epic-init`)

1. **Should `strict_deliverables` default flip to `true` in v0.10 or wait until v0.11?**
   - v0.10 default `true`: forces the dogfood and any other in-flight epic to immediately produce deliverable fields. Maximum L-006 grain, maximum disruption.
   - v0.10 default `false`: opt-in only; v0.10 ships the *capability* without disrupting existing workflows. Recommended.

2. **Mock-honesty audit: hard finding or soft?**
   - Hard: reviewer rejects features whose mock returns a shape the real SDK never produces. Strongest correctness guarantee. Frustrating if SDK types are unavailable or wrong.
   - Soft: reviewer flags but doesn't block. Lets weak mocks slip through. Recommended for v0.10; tighten to hard in v0.11.

3. **Should F07 use the v0.8.0 fixture or a fresh one?**
   - Reuse: less setup, but the fixture is currently deleted (`/tmp` cleanup). Would need re-creation.
   - Fresh: more setup, but cleaner. Recommended.

4. **Sketch shows F07 as ~5h. Realistic, or should we budget 8–10h given heuristic-density?**
   - Recommended: budget 8h for F07 with explicit "halt if going over 12h" guidance to worker. Real-app verification is where heuristics meet reality; under-budgeting it is the v0.7.x mistake.

Awaiting user sign-off on §13 before `pi-epic-init deliverables-contract-v10 --from /tmp/v010-design.md`.
