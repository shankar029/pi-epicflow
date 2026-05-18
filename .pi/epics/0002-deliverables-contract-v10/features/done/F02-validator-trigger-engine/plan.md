# Plan — F02 validator-trigger-engine

> Produced by feature-planner on 2026-05-18T12:00:00Z. This is the worker's
> binding contract; deviations require a `deviations.md` entry.

## 1. Goal (one sentence)

Add a "deliverables" validation phase to `pi-epic-validate-decomposition` that
detects trigger patterns in feature ACs and scope_files and requires the
corresponding deliverable fields to be populated — emitting warnings or errors
depending on the `strict_deliverables` flag in `epic-config.yaml`.

## 2. Files I will touch

- `skills/epic-feature-workflow/scripts/pi-epic-validate-decomposition` — add
  the deliverables validation phase inside the existing Python heredoc (existing)
- `skills/epic-feature-workflow/scripts/_common.sh` — no changes expected (see
  §6 rationale); if a helper is needed, it goes here (existing)

## 3. Files to read for context (not edit)

- `skills/epic-feature-workflow/scripts/pi-epic-validate-decomposition:L1-L740`
  — the entire script; understand `parse()`, `_vals()`, existing phase patterns
  (L-045 shell check L555-L670, L-046 toolchain check L56-L120), error/warning
  emission pattern, final summary output
- `skills/epic-feature-workflow/scripts/_common.sh:L1-L50` — `yaml_get` helper
  (L119-L152) can read `strict_deliverables` from epic-config.yaml; however the
  Python heredoc already reads `epic_cfg` directly for toolchain check — same
  pattern preferred for consistency
- `.pi/epics/done/0001-observability-v09/decomposition.yaml` — v0.9 file
  lacking new fields; backward compat test target
- `skills/epic-feature-workflow/templates/epic-config.yaml` — F01 already added
  `strict_deliverables: false` at top level; confirms the field exists
- `skills/epic-feature-workflow/templates/decomposition.yaml` — F01 added
  `e2e_scenarios`, `mock_fixtures`, `docs_updates`, `changelog_entry`,
  `e2e_skip_reason` as optional fields per feature

## 4. AC interpretation (per criterion)

### AC 1: New 'deliverables' validation phase

> "pi-epic-validate-decomposition gains a new validation phase 'deliverables'
> that runs after existing phases."

**Literal expected:** The deliverables check runs inside the Python heredoc
(L128-L740) AFTER the existing checks (L-045 integration-shell at ~L555-L670,
reference_paths check at ~L720, and BEFORE the final warnings/errors output
block at ~L728). It uses the same `errors` / `warnings` lists and `_vals()`
helper. No new separate script or separate Python heredoc.

**Approach:** Insert a new section `# v0.10 / L-056 — deliverables trigger
engine` after the `# Unknown deps` / cycle-detection block (~L700) and before
the `reference_paths` check (~L715). The new code iterates `data['features']`,
applies trigger rules, and appends to `errors` or `warnings`.

**Reading `strict_deliverables`:** The Python heredoc already receives
`epic_cfg` path (bash variable, L57) for the toolchain check. Pass it as a
third argument to the main Python heredoc: `python3 - "$decomp" "$repo"
"$epic_cfg"`. Inside Python, read `strict_deliverables` from `sys.argv[3]`
using a simple grep/regex on the file (same micro-YAML approach as
`parse_toolchain`). Default to `false` if missing or file absent.

**Test:** Run `pi-epic-validate-decomposition` on the current epic's
decomposition.yaml. It should emit `[warn]` lines for any F02+ features with
trigger matches but empty deliverable fields (since `strict_deliverables:
false`).

### AC 2: Default rule set (trigger detection)

> "Default rule set (hardcoded for v0.10): (a) AC text matching regex
> `\b(user|click|see|display|navigate|submit|GET /|POST /|PUT /|DELETE /)\b`
> requires e2e_scenarios non-empty; (b) scope_files containing imports/references
> to known SDK names (stripe, openai, anthropic, twilio, sendgrid, @aws-sdk) —
> detected by string match in file paths or by listing scope_files content if
> file exists — requires mock_fixtures non-empty."

**Literal regex (Python):**
```python
_E2E_TRIGGER_RE = re.compile(
    r'\b(user|click|see|display|navigate|submit'
    r'|GET /|POST /|PUT /|DELETE /)\b',
    re.IGNORECASE)
```

**SDK detection strategy (two layers):**

1. **Path-based (fast, always runs):** Check each scope_file path string for
   substrings: `stripe`, `openai`, `anthropic`, `twilio`, `sendgrid`,
   `aws-sdk`, `@aws-sdk`. Case-insensitive. This catches paths like
   `src/billing/stripe.ts` or `node_modules/@aws-sdk/...`.

2. **Content-based (optional, runs if file exists in repo):** For each
   scope_file that exists on disk at `os.path.join(repo_root, path)`, read up
   to the first 100 lines and search for `import.*<sdk_name>` or
   `require.*<sdk_name>` or `from <sdk_name>`. This catches `import Stripe
   from 'stripe'` even if the file path is `src/billing/payment.ts`.

   **Performance guard:** Only read files that exist; cap at 100 lines per
   file; skip files > 50KB (binary/generated).

**Hardcoded SDK list:**
```python
_SDK_NAMES = ['stripe', 'openai', 'anthropic',
              'twilio', 'sendgrid', '@aws-sdk']
```

**Test:** A feature with AC "User can complete a Stripe checkout" +
`scope_files: [src/billing/stripe.ts]` but empty `e2e_scenarios` and empty
`mock_fixtures` should trigger BOTH rules.

### AC 3: Warn mode (strict_deliverables: false)

> "When epic-config.yaml has strict_deliverables: false (or missing), trigger
> violations emit `[warn]` lines but do not fail validation."

**Literal expected:** Violations append to `warnings` list (not `errors`).
Each message prefixed with `[warn]`. Script exits 0 if only warnings exist
(existing behavior — the script already prints warnings but only exits non-zero
on errors).

**Test:** Run against current epic (strict=false). Verify exit code 0 and
`[warn]` in output.

### AC 4: Error mode (strict_deliverables: true)

> "When epic-config.yaml has strict_deliverables: true, trigger violations
> emit `[error]` lines and validation exits non-zero."

**Literal expected:** Violations append to `errors` list. Each message prefixed
with `[error]`. Script exits non-zero (existing behavior — `sys.exit(1)` when
`errors` is non-empty).

**Test:** Temporarily set `strict_deliverables: true` in the test
epic-config.yaml, run validator, verify non-zero exit.

### AC 5: Actionable error messages

> "Error messages are actionable: include the feature id, the triggering AC
> text or scope file, the required deliverable field, and a one-line example
> fix."

**Message templates:**

For e2e_scenarios trigger (AC verb match):
```
{fid}: AC #{ac_idx} contains user-facing verb '{verb}', but e2e_scenarios is empty. Add e2e scenario files, e.g.: e2e_scenarios: [tests/e2e/{slug}.spec.ts]. Or add e2e_skip_reason explaining why this feature has no E2E surface.
```

For mock_fixtures trigger (SDK match):
```
{fid}: scope_file '{scope_path}' references SDK '{sdk_name}', but mock_fixtures is empty. Add mock fixture files, e.g.: mock_fixtures: [tests/e2e/_fixtures/{sdk_name}.ts].
```

The `[warn]` or `[error]` prefix is prepended based on strict mode:
```
[warn] F03: AC #1 contains user-facing verb 'click', but e2e_scenarios is empty. ...
[error] F03: AC #1 contains user-facing verb 'click', but e2e_scenarios is empty. ...
```

**Test:** Verify output matches these templates exactly (modulo placeholders).

### AC 6: e2e_skip_reason suppresses trigger

> "An e2e_skip_reason field at the feature level suppresses e2e_scenarios
> trigger; absence of e2e_skip_reason when scenarios are empty + trigger fired
> produces the violation."

**Approach:** The `parse()` function already captures arbitrary fields per
feature. After detecting an e2e_scenarios trigger, check:
```python
skip_reason = ft.get('e2e_skip_reason', '')
if isinstance(skip_reason, list):
    skip_reason = _vals(skip_reason)[0] if skip_reason else ''
elif isinstance(skip_reason, dict):
    skip_reason = skip_reason.get('value', '')
if skip_reason:
    continue  # suppressed
```

**Note:** `e2e_skip_reason` only suppresses `e2e_scenarios`, NOT
`mock_fixtures`. If a feature imports Stripe and has `e2e_skip_reason`, it
still needs `mock_fixtures` if the SDK trigger fires.

**Test:** Add a feature with `e2e_skip_reason: "pure backend, no UI surface"`
and verify no e2e_scenarios warning/error.

### AC 7: Backward compatibility with v0.9

> "Existing v0.9-era decomposition.yaml files (observability-v09 archived)
> validate without new errors under strict=false."

**Literal expected:** Running the updated validator against
`.pi/epics/done/0001-observability-v09/decomposition.yaml` produces the same
output as before (OK + same warning count). No new errors, no new warnings
from the deliverables phase.

**Why it works:** The v0.9 decomposition has no `e2e_scenarios`,
`mock_fixtures`, `docs_updates`, or `changelog_entry` fields. Features without
these fields have them parsed as absent/empty. The trigger rules check "if
trigger fires AND deliverable is empty" — but even if a trigger fires (e.g. a
v0.9 AC happens to say "user"), the deliverable fields are absent, which means
the feature predates v0.10. The engine must **skip features that have NONE of
the v0.10 fields** — this is the backward compat escape hatch.

**Implementation:** Before checking triggers for a feature, test whether the
feature has ANY of the four deliverable fields defined (even if empty `[]`).
If none are present, skip the deliverables check entirely for that feature.
This ensures old decompositions are untouched.

```python
_DELIVERABLE_FIELDS = ['e2e_scenarios', 'mock_fixtures',
                       'docs_updates', 'changelog_entry']
has_any_deliverable_field = any(k in ft for k in _DELIVERABLE_FIELDS)
if not has_any_deliverable_field:
    continue  # v0.9 era — no deliverable fields declared
```

**Test recipe:**
1. Copy the v0.9 decomposition to a temp epic dir with `strict_deliverables:
   false` in epic-config.yaml.
2. Run the updated validator. Verify identical output (diff against pre-change
   output).
3. Also test with `strict_deliverables: true` — v0.9 features should STILL
   not produce deliverables errors (the skip-if-no-fields guard handles this).

### AC 8: bash -n passes

> "bash -n on the updated script passes."

**Test:** `bash -n skills/epic-feature-workflow/scripts/pi-epic-validate-decomposition`
exits 0.

## 5. Anti-scope

- **Configurable `deliverable_rules:` in epic-config.yaml** — design §7.1
  mentions this for v0.11; hardcoded rules only in v0.10.
- **`changelog_entry` trigger** — design §4.3 mentions "feature ships any
  user-observable behavior change → changelog_entry: true" but the F02 AC #2
  only specifies e2e_scenarios and mock_fixtures triggers. The changelog +
  docs_updates triggers are NOT in F02's AC. Do not implement them.
- **Content of `_common.sh` helper `feature_declared_deliverables`** — that
  belongs to F04 (worker contract). F02 does NOT add this helper.
- **E2E gate in `pi-epic-complete`** — that's F06.
- **Prompt changes** — that's F03.
- **`--skip-deliverables-check` CLI flag** — not in the AC. Do not add unless
  the worker discovers it's needed (deviation required).

## 6. Ambiguities

- **`_common.sh` changes:** AC scope_files lists `_common.sh`, but after
  investigation, no helper is needed there for F02. The deliverables engine
  lives entirely inside the Python heredoc in `pi-epic-validate-decomposition`.
  `yaml_get` from `_common.sh` is NOT needed because the Python code can read
  `epic-config.yaml` directly (same pattern as toolchain check). **Resolution:
  touch `_common.sh` only if a bash-level helper is genuinely needed; otherwise
  scope_files listing is advisory.** Worker should note in deviations.md if
  `_common.sh` ends up untouched.

- **epic-config.yaml location:** The validator currently computes `epic_cfg`
  at bash level (L57: `epic_cfg="$epic_dir/epic-config.yaml"`). This is inside
  the `if [[ "${SKIP_TOOLCHAIN_CHECK:-0}" != "1" ]]` block. For the
  deliverables phase, `epic_cfg` must be available unconditionally. **Resolution:
  move `epic_cfg="$epic_dir/epic-config.yaml"` to before the
  SKIP_TOOLCHAIN_CHECK guard and pass it to the main Python heredoc as
  `sys.argv[3]`.**

- **SDK detection via file content read:** AC says "detected by string match
  in file paths or by listing scope_files content if file exists." The phrase
  "listing scope_files content" is ambiguous — does it mean `ls` the directory
  or read the file? **Resolution: read file content (first 100 lines) for
  import statements.** This matches design §4.3's intent (detect imports of
  known SDKs). Listing a directory would be meaningless for SDK detection.

## 7. Estimated effort vs decomposition

- decomposition.yaml estimate: 5h
- planner estimate: 4h (the Python heredoc insertion is well-patterned after
  L-045; the parse() function already captures the new fields generically;
  main complexity is the two-layer SDK detection and backward compat guard)

## 8. References

- design.md §4.3: trigger → deliverable enforcement table. Defines the two
  trigger rules (AC verbs → e2e_scenarios; SDK import → mock_fixtures) and the
  actionable error format.
- design.md §7.1: mentions configurable `deliverable_rules:` — explicitly v0.11,
  not v0.10. Confirms hardcoded rules are correct for F02.
- `pi-epic-validate-decomposition:L555-L670` (L-045 integration-shell check):
  **the closest pattern to mimic** — iterates features, checks AC text with
  regex, checks scope_files for matching entries, appends to `errors`.
- `pi-epic-validate-decomposition:L56-L120` (L-046 toolchain check): shows how
  `epic_cfg` is read and how a separate mini-YAML parser reads config.
- `pi-epic-validate-decomposition:L128-L195` (`parse()` function): generic
  feature field capture — already handles unknown fields as key-value or
  key-list, so `e2e_scenarios`, `mock_fixtures`, etc. are captured without
  parser changes.
- `_common.sh:L119-L152` (`yaml_get`): available but not needed — Python
  heredoc will read epic-config.yaml directly.
- `.pi/epics/done/0001-observability-v09/decomposition.yaml`: confirmed no
  v0.10 fields present (grep returned zero matches for all five field names).
  Backward compat test target.
- `.pi/epics/0002-deliverables-contract-v10/epic-config.yaml:L8`:
  `strict_deliverables: false` — confirms F01 already placed the field.

## 9. Implementation order

1. **AC 7 first (backward compat guard).** Write the v0.9 skip-if-no-fields
   logic first so it's impossible to accidentally break old decompositions
   during development.
2. **AC 1 (phase scaffolding).** Create the section, wire `epic_cfg` as
   `sys.argv[3]`, read `strict_deliverables`.
3. **AC 2 (trigger rules).** Implement e2e_scenarios trigger (regex), then
   mock_fixtures trigger (path + content SDK detection).
4. **AC 6 (e2e_skip_reason).** Add suppression logic inside the e2e trigger.
5. **AC 5 (message format).** Craft the actionable messages with all
   placeholders.
6. **AC 3-4 (warn vs error mode).** Route violations to `warnings` or `errors`
   based on `strict_deliverables`.
7. **AC 8 (bash -n).** Final syntax check.

**Rationale:** backward compat first (safety), then structure, then rules, then
polish. AC 3-4 late because they're a trivial conditional once the violations
list exists.

## 10. Risks

- **False-positive e2e triggers on prose.** The regex `\bsee\b` will match
  "see design.md" in an AC. Mitigation: this is warn-only by default
  (strict=false). The regex is the AC's literal requirement — do not try to be
  smarter in v0.10. False positives are visible and educate the decomposer.
- **False-positive SDK triggers on path substrings.** A path like
  `src/stripe-internal/utils.ts` triggers on "stripe" even if it's not the
  Stripe SDK. Mitigation: acceptable for v0.10's hardcoded rules; v0.11's
  configurable rules will allow tuning.
- **Performance on large decompositions with file reads.** Reading scope_files
  content could be slow if a feature has 20+ scope_files. Mitigation: cap at
  100 lines per file, skip files >50KB, only read when path-based detection
  didn't already fire.
- **`parse()` field capture for `e2e_skip_reason` (scalar, not list).** The
  parser stores scalars as strings and lists as lists-of-dicts. `e2e_skip_reason`
  is a scalar string — `ft.get('e2e_skip_reason')` will return a string
  directly. Worker must handle both cases defensively (string or tagged-list
  entry) since the parser's behavior depends on YAML formatting.
