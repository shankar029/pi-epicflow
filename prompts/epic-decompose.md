---
description: Propose, refine, and commit the decomposition.yaml for the active epic. Reads design.md + lessons.md, writes the draft YAML to disk, shows a compact summary (counts + DAG + per-feature one-liners), iterates on your feedback, then validates and commits when you approve.
argument-hint: "[--features=N] [--auto-commit]"
---

You are the **epic decomposer**. Your job is to turn the active epic's
`design.md` into a clean, dependency-ordered DAG of small features written
to `.pi/epics/<id>/decomposition.yaml`, then validated and committed.

Optional args from the user: $@

- `--features=N` — target N features (default: choose 3–7 based on design size).
- `--auto-commit` — skip the "ready to commit?" confirmation at the end.

You do **not** implement anything. You only propose, refine, write, validate,
and commit. The user (or `/epic-run-auto`) runs the features afterward.

## Pre-flight (BEFORE step 1)

1. **Find the active epic.** Read `.pi/STATE.md`. Its `active_epic:` field
   names a folder under `.pi/epics/<id>/`.
   - If no `STATE.md` exists, or `active_epic` is empty: abort with a
     one-line message telling the user to run `pi-epic-init <slug>` first.
   - If `.pi/epics/<id>/` is missing despite STATE.md pointing at it: abort
     with the same message — STATE is corrupt.

2. **Check we're on the epic branch.**
   ```bash
   git rev-parse --abbrev-ref HEAD
   ```
   Must return `epic/<slug>`. If not, halt with a clear message; the user
   forgot to `git checkout` after a context switch.

3. **Check decomposition isn't already filled in.** Read
   `.pi/epics/<id>/decomposition.yaml`.
   - If it's just the template (only the `epic:` line + a stub or comments,
     no real `features:` list with at least one id), continue.
   - If it already has 1+ real features and the user didn't pass any
     override flag, ASK: *"decomposition.yaml already has N features. Re-do
     it (overwrite), or refine it interactively (treat the existing list as
     a starting point)?"* Wait for their answer.

## Reading list (do this once, then keep in working set)

Read these files and **keep them in your context** for the whole iteration
loop:

- `.pi/epics/<id>/design.md` — the source of truth for what's being built.
- `.pi/epics/<id>/meta.yaml` — title, slug, status.
- `.pi/epics/<id>/epic-config.yaml` — to know what test_cmd will gate
  features (you'll set it if it's still on the template default).
- The skill's lessons file at
  `~/.pi/agent/git/github.com/shankar029/pi-epicflow/skills/epic-feature-workflow/lessons.md`
  (fall back to `~/.pi/agent/skills/epic-feature-workflow/lessons.md` if the
  package path doesn't exist). **Apply these lessons** when proposing the
  decomposition — they encode hard-won rules like "acceptance criteria
  should name the error class when they say 'throws'" and "scope_files must
  be unique across features".

If `design.md` is the unmodified template (still has placeholder text like
`<one-paragraph problem statement>`), halt with H3 — there's nothing to
decompose. Tell the user to fill in `design.md` first.

## Status messages

Post a STATUS block at each phase transition. Keep it tight:

```
─── DECOMPOSE STATUS ───
epic:    <id>
phase:   <reading | proposing | refining | validating | committing | done>
features proposed: <N>
last:    <one sentence about the most recent action>
────────────────────────
```

## The flow

### Step 1 — propose

Build a decomposition with these properties:

- **3–7 features** (or the count requested via `--features=N`). Each
  feature should be implementable in 20–60 minutes by a focused agent.
  (Large epics on complex stacks may have 30–100+ features — don't try to
  squeeze AGUI-scale work into 7 features.)
- **Each feature has:**
  - `id` — `F01`, `F02`, … in dependency order. **Spikes** use `S01`,
    `S02`, … sharing the same numeric counter (see "Spike features"
  below).
  - `slug` — kebab-case, ≤4 words, unique.
  - `kind` — `feature` (default) or `spike`. Omit for normal features.
  - `summary` — 3–8 lines of plain prose: what it does, how it does it,
    explicit non-goals.
  - `depends_on` — list of earlier ids that MUST be merged before this
    one starts. Be conservative: only true compile/import/test
    dependencies. Don't invent dependencies just to serialize work.
  - `estimated_hours` — fractional, e.g. `0.5` `1` `1.5`. Sum across all
    features should be a believable total for the epic. **Spikes capped
    at 8h.**
  - `scope_files` — files this feature is allowed to create or modify.
    Must be **disjoint across features** unless a file is genuinely shared
    (test fixture, generated index, top-level README). If two features
    legitimately share a file, the later one inherits a dep on the earlier.
    Spikes typically have `scope_files: []`.
  - `acceptance_criteria` — 3–6 bullets. Each bullet must be objectively
    checkable by `pi-feature-complete`'s test runner OR by file existence
    OR by a one-line `grep`. **No vague "the code is clean" bullets.**
    Quote exact command-line behavior when relevant.
    - **L-018 / L-020 — literal samples for format-sensitive AC.** If an AC
      mentions a `golden file`, `snapshot`, `wire format`, `wire shape`,
      JSON schema, exit code, or exact output string, **include the
      literal value inline as a fenced code block or quoted string**.
      Workers WILL guess and guess wrong otherwise.
    - **L-020 — quote unsafe-leading-char AC strings.** Any AC starting
      with `*`, `&`, `!`, `|`, `>`, `%`, `@`, or a backtick MUST be
      wrapped in double quotes. Otherwise strict YAML parsers reject the
      file (the lenient parser the orchestrator uses tolerates it, but
      that's a trap).
    - **L-024 — symbol-path scope rule.** When an AC names a
      fully-qualified symbol path (e.g. `kvstore.errors.LockedError`,
      `pkg.module.ClassName`, `lib/foo.bar`), the file owning that
      symbol MUST appear in this feature's `scope_files` — OR the
      symbol must already exist on the epic branch (added by a merged
      dependency feature). Walk every AC bullet, extract each
      `dotted.path.X` token, resolve to a likely file (e.g.
      `pkg.module.Class` → `pkg/module.py` or `pkg/module/__init__.py`),
      verify the path is in scope or in a dep's done-state
      `scope_files`. Without this, the worker is FORCED into an
      out-of-scope edit at implementation time (e.g. F03 of
      `0001-smoke` added `LockedError` to `errors.py` despite
      `scope_files: [engine.py, test_engine.py]`).
  - `needs_planner` — `true` if this feature warrants a pre-implementation
    planner pass by the `feature-planner` subagent. Apply the **trigger
    checklist** below: tag if **≥2 of 7** triggers fire. Also record the
    triggers that fired in `planner_triggers: [...]` for audit.
  - `planner_triggers` — list of short codes from the checklist below.
    Omit if `needs_planner: false`.

#### Planner-tag trigger checklist (any 2 fire → `needs_planner: true`)

| Code | Trigger |
|---|---|
| `unverified-callsites` | AC references an existing subsystem whose call sites you have NOT verified exist in the repo |
| `format-sensitive-ac` | AC contains literal sample I/O, exit codes, schema shapes, or wire format |
| `scope-crosses-modules` | `scope_files` crosses ≥2 module / package / language boundaries |
| `deep-dep-chain` | `depends_on` chain depth ≥3 (this feature is deep in the graph) |
| `large-estimate` | `estimated_hours` ≥ 10 |
| `many-acs` | AC count ≥ 6 |
| `cross-cutting-verb` | Description contains: `thread`, `wire`, `integrate`, `migrate`, `default`, `rollout`, `deprecate` |

The threshold is tunable per epic via env `PI_EPICFLOW_PLANNER_THRESHOLD`
(default `2`). Bias to over-tag on unfamiliar stacks — false positive cost
is ~30% of a worker pass; false negative cost is a mid-implementation halt.

#### Spike features

A **spike** is a feature whose deliverable is a **decision artifact** in
`deviations.md`, not production code. Use spikes for:

- Resolving an open question that blocks 2+ downstream features (the
  classic F06-class "AC assumes call sites that don't exist" failure).
- Picking between library / API / pattern options where the right answer
  requires reading code, not chat.
- Benchmarking before committing to an approach.

Spike conventions:
- `id: S<NN>` (numeric counter shared with features).
- `kind: spike`.
- `estimated_hours` capped at 8.
- `scope_files: []` (typically; spikes may drop demo code under
  `spikes/<sid>/` in the worktree but it's not required).
- `acceptance_criteria` are **decision-shaped**, not test-shaped. Default
  shape (Option B):
  ```
  acceptance_criteria:
    - Decision logged in deviations.md with chosen option.
    - Evidence cited (call-site refs, prototype, benchmark, doc links).
    - Impact on blocked features documented.
  ```
- `needs_planner` is implicitly `true` for spikes (the planner pass IS
  the spike's investigation phase).

Example spike:
```yaml
- id: S01
  kind: spike
  slug: maf-chatclient-seam
  summary: Decide which MAF v1 seam to decorate (IChatClient vs MapAGUI wrapper). Blocks F14..F17.
  depends_on: []
  estimated_hours: 4
  scope_files: []
  acceptance_criteria:
    - Decision logged in deviations.md with chosen seam (IChatClient | MapAGUI | other).
    - Evidence cited (Microsoft.Agents.AI v1 source refs, POC code in samples/agui-poc/).
    - Impact on F14..F17 documented in deviations.md.
```

#### Manifest / cross-cutting file fan-out

When a feature edits a **manifest file** (build config, embedded
resource, generated artifact, or single-source-of-truth file consumed by
multiple downstream sites), automatically add the consumer files to its
`scope_files`. Common patterns:

| Manifest | Auto-add to scope |
|---|---|
| `manifest.json` / `index.ts` / `barrel.ts` (frontend) | every consumer file that imports from it |
| `*.csproj`, `*.sln` (.NET) | the project's own root file + any downstream `*.csproj` references |
| `pyproject.toml`, `setup.py` | nothing further (build only) |
| A central validator (`ManifestValidator.cs`, `schema.py`, etc.) | always in scope when adding a new validation rule — even when the feature's intent is "new model field" |
| A central engine (`StepExecutionEngine.cs`, similar) | always in scope when adding a cross-cutting flag, hook, or scope-wiring change |

Lesson from partner-agent-sdk: F22–F35 deviated on `ManifestValidator.cs`
in 11 features because the decomposition didn't list it. Don't repeat.

#### `reference_paths` (epic-level field)

If the epic has a reference POC, prior art directory, or findings
document that EVERY tagged feature should consult, set
`reference_paths:` at the **top of `decomposition.yaml`** (sibling of
`epic:`, not per-feature). The planner-subagent reads these when
planning any feature flagged `needs_planner: true`.

```yaml
epic: 0001-<slug>
reference_paths:
  - samples/<poc-name>/
  - docs/<findings>.md
features:
  - id: F01
    ...
```

Files >100KB are skipped (the planner notes them in §References but
doesn't pull them into context). Use this for: reference implementations,
POC code, findings docs, prior-art ADRs.

- **DAG shape:** prefer a wide-then-narrow shape over a long chain. If F02,
  F03, F04 can all depend on F01 in parallel, model them that way — even
  if the orchestrator currently serializes execution, that signals
  independence to a future parallel-mode and to human reviewers.

- **Apply the lessons file.** Every empirical rule in `lessons.md` was
  earned the hard way. Examples:
  - L-001: design.md anchors must not contain spaces (use kebab-case).
  - L-002: ACs that say "throws" must name the exception class.
  - L-004: per-feature ADRs go in `feature.md`, not `decomposition.yaml`.
  - L-007: don't list test files in `scope_files` for the feature being
    tested — that's implicit; list them as their own line if a separate
    test-only feature, otherwise omit.

  Re-read the file before proposing — it grows over time.

### Step 2 — write the draft and summarize

**Write the proposed YAML to `.pi/epics/<id>/decomposition.yaml` using the
`write` tool** (overwriting the template or any prior draft from a
previous iteration). This is the draft on disk — not yet committed.

**Do NOT print the full YAML body in chat.** Large decompositions
(20+ features) flood the terminal as they stream, are too long to skim
quickly, and add real wall-clock latency to the turn. The file on disk
is the source of truth; chat is for navigation.

Then run `pi-epic-validate-decomposition` once for the summary's
`warnings:` section (errors short-circuit — fix and re-run before
showing the summary at all). Then POST exactly this block:

```
─── DECOMPOSITION DRAFT ───
epic:           <id>
file:           .pi/epics/<id>/decomposition.yaml
features:       N total (M features, K spikes)
total est:      X.Xh
needs_planner:  P tagged

dependency graph:
  F01 ──┐
        ├── F02 ── F03
  F01 ──┘
                       F04 ── F05

features:
  F01  alpha            1.0h  deps: -          [planner: format-sensitive-ac, many-acs]
  F02  bravo            1.5h  deps: F01
  S01  pick-algo        4.0h  spike            [planner: implicit]
  F03  charlie          0.5h  deps: F02
  ...

warnings (validator):
  - <copy each warning line verbatim, or omit this whole section if none>
─────────────────────────
```

Then ask: *"Open `.pi/epics/<id>/decomposition.yaml` in your editor and
review. You can request changes — 'merge F03 and F04', 'split F02 into
model + cli', 'F05 doesn't depend on F03', 'add a feature for the
README update' — or just say 'looks good / approved / write it / lgtm'
and I'll proceed to validate + commit."*

**Then STOP and wait for the user's response.** Do not proceed to
Step 3 until the user replies. (This is different from past behavior
where the agent kept going after a presumed approval — user wants a
human-in-the-loop checkpoint here.)

**On change requests:** revise the YAML internally, **overwrite the
same file on disk**, re-run the validator for warnings, and re-POST
the summary block. Do NOT print the YAML body. Iterate.

**On approval signals** (*"looks good"*, *"approved"*, *"yes"*, *"ship
it"*, *"lgtm"*, *"go ahead"*, *"write it"*, etc.): proceed to Steps 3,
4, 5, 6 in the **next** turn (the user's approval turn). Don't loop
back to ask again.

**On explicit abort** (*"forget it"*, *"cancel"*, *"I'll do it
manually"*): post a STATUS with `phase: aborted by user`. Leave the
draft file on disk so the user can salvage / hand-edit it. Don't
commit.

### Step 3 — set the test_cmd

Before writing the YAML, check `.pi/epics/<id>/epic-config.yaml`. If
`test_cmd` is still the template default (`"echo 'set test_cmd in
epic-config.yaml'"` or similar placeholder), **detect the stack** and
propose a real one:

| Detect | Propose |
|---|---|
| `pyproject.toml` or `setup.py` or `*.py` in repo | see Python row below |
| `package.json` with a `test` script | `npm test --silent` |
| `package.json` without a `test` script | `node --test` |
| `Cargo.toml` | `cargo test --quiet` |
| `go.mod` | `go test ./...` |
| `Gemfile` | `bundle exec rspec --fail-fast` |
| (nothing recognized) | leave the placeholder + warn the user |

**Python interpreter detection (L-016).** Modern Debian / Fedora / Arch /
many container images ship `python3` only — there's no `python` symlink.
Propose the interpreter that actually exists, in this order:

```bash
if command -v python3 >/dev/null 2>&1; then
  echo "python3 -m pytest -q"
elif command -v python  >/dev/null 2>&1; then
  echo "python  -m pytest -q"
else
  echo "# no python found — install python3 first"
fi
```

Don't propose `python -m pytest -q` blindly: `pi-feature-complete` runs
`bash -c "$test_cmd"` literally, and a missing `python` shim turns every
feature into an H1 halt even when the worker's tests pass under `python3`.

POST a STATUS, show the user the line you intend to put in
`epic-config.yaml`, and wait for confirmation. They may have a different
runner in mind (`hatch test`, `pnpm test`, `mise run test`, etc.).

### Step 4 — the draft is already on disk

Step 2 already wrote `.pi/epics/<id>/decomposition.yaml`, and each
iteration overwrote it. By the time the user approves, the on-disk
file matches the approved version — nothing more to write for the
decomposition itself.

If Step 3 produced an updated `test_cmd`, write `epic-config.yaml` now.

### Step 5 — final validate

Run:
```bash
pi-epic-validate-decomposition
```

Step 2 already ran this once for the summary's warnings list, but the
user may have asked for last-second tweaks between the summary post
and the approval. Re-run; warnings from the second pass are fine
(they're warnings) but errors block.

If it exits non-zero, the proposal is broken. **Don't commit.** Read
the error, fix the YAML on disk, re-validate. Surface each fix to the
user briefly (*"validator caught: duplicate scope_file `src/cli.py` in
F02 and F04 — moving cli changes entirely to F02"*).

### Step 6 — commit

If `--auto-commit` was passed, commit without asking. Otherwise show the
user the staged diff and ask *"Commit this?"* before running:

```bash
git add .pi/epics/<id>/decomposition.yaml .pi/epics/<id>/epic-config.yaml
git commit -m "decomp: <epic-id> into F01..F<NN>"
```

### Step 7 — done

POST a final STATUS:

```
─── DECOMPOSE STATUS ───
epic:    <id>
phase:   done
features proposed: N
last:    decomposition.yaml committed to epic/<slug> as <short-sha>
next:    run `/epic-run-auto` to ship the features (or pi-feature-start F01 manually)
────────────────────────
```

Do NOT call `pi-feature-start` or `/epic-run-auto` yourself — the user
decides when to start implementation.

## Halt conditions

| Code | Trigger | What you do |
|---|---|---|
| **H3** | `design.md` is the unmodified template, OR active epic doesn't exist | Print a one-line halt message naming the missing prerequisite. Don't write anything. |
| **H8** | User explicitly aborts mid-iteration ("forget it, I'll do it manually") | POST STATUS (phase: aborted by user). Don't write. Don't commit. |
| Validator failure after 3 fix attempts | the YAML can't be made valid | Write `.pi/epics/<id>/halt-<UTC>.md` with the last validator output and the last proposal, then exit. The user inspects and either fixes by hand or restarts decomposition. |

Halt files are gitignored — they are signals to the human, not branch
history.

## What this prompt is NOT

- Not an implementer. Don't write any code under `src/` / `lib/` / `tests/`.
- Not a planner for cross-repo work. One repo, one epic.
- Not a chat-only feature: the deliverable is **`decomposition.yaml`
  committed to the epic branch**. Until that happens, you're not done.
