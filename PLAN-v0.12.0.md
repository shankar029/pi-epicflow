# v0.12.0 — Windows cross-platform support (PowerShell port)

**Goal:** Ship native Windows support for pi-epicflow via PowerShell siblings
of every bash script. Postinstall detects OS and installs only the relevant
set. Single repo, two implementations, contract tests prevent silent drift.

**Status:** in progress

**Why:** v0.11 user has hard `.NET / NuGet / ADO artifact feeds` constraint
that rules out WSL (credential helpers / cert store / domain auth break
crossing the WSL boundary). Git-Bash-only support is brittle for a serious
Windows .NET shop; native PowerShell is the right answer.

## Decisions log

- 2026-05-20 — chose Option B (PowerShell ports) over Git Bash compat pass.
  User has the bandwidth to dogfood on Windows + commit to parity
  maintenance. Justified by the .NET/ADO constraint above.
- 2026-05-20 — parallel-directory layout (`scripts/` + `scripts-win/`)
  over filename suffixes. Cleanest separation; postinstall picks one.
- 2026-05-20 — PowerShell 5.1 minimum (ships on every Windows). PS7+
  niceties opt-in only where strictly needed; noted in script header.
- 2026-05-20 — `_common.sh` ↔ `_common.ps1` 1:1 module port. Node-helper
  refactor rejected: cold-start cost, dependency inflation, two-hop debug.
- 2026-05-20 — contract tests under `tests/contract/` are the parity
  guard. Capture observable outputs (file tree, gitignore content,
  meta.yaml fields, branch state) as JSON; both impls must match.
- 2026-05-20 — staged commits in priority order, single PR at the end
  for momentum. Each phase ends at a verifiable dogfood checkpoint.

## Architectural choices

- Windows shims: `BIN_DST\pi-<name>.cmd` files that exec
  `powershell -NoProfile -ExecutionPolicy Bypass -File <scripts-win>\pi-<name>.ps1 %*`.
  No `fs.symlinkSync` on Windows (requires admin / Developer Mode).
- `scripts/_common.sh` and `scripts-win/_common.ps1` are dot-sourced
  by their siblings. PowerShell uses `. $PSScriptRoot\_common.ps1`.
- Python heredocs in bash (used in `_common.sh::yaml_get`,
  `_common.sh::feature_declared_deliverables`, `pi-epic-validate-
  decomposition`, doctor) → extract to `skills/epic-feature-workflow/
  lib/*.py` files invoked by both implementations. Single source of
  truth for the parsing logic. (Phase 3 side-quest.)
- `flock` (parallel-safety lock in `pi-feature-start`): on Windows, use
  a PowerShell mutex via `[System.Threading.Mutex]` keyed off
  `<git-common-dir>\.pi-feature-start.lock`. Same semantics.

## Phases (commits in order; one PR at the end)

### Phase 1 — Install layer + foundation (this commit)

- [x] 1a. `install/postinstall.mjs` — OS switch: install `scripts/` +
       symlinks on POSIX, install `scripts-win/` + `.cmd` shims on
       win32. Same agent-copy step on both.
- [x] 1b. `skills/epic-feature-workflow/scripts-win/_common.ps1` —
       full PowerShell port of `_common.sh`. All helpers: `Get-RepoRoot`,
       `Get-SkillRoot`, `Get-DefaultBranch`, `Get-ActiveEpicId`,
       `Get-ActiveEpicDir`, `Get-ActiveFeatureId`, `Get-NextEpicId`,
       `ConvertTo-Slug`, `Get-YamlValue`, `Update-YamlUpdated`,
       `Set-YamlValue`, `Get-FeatureDeclaredDeliverables`,
       `Add-RunLogEntry`, `Assert-NotDefaultBranch`, `Write-Log`,
       `Get-UserLessonsPath`, `Initialize-UserLessons`,
       `Add-UserLessonsFromCandidate`, `Get-PiEpicflowClone`,
       `Get-PiEpicflowAgeDays`, `Get-PiEpicflowVersion`.
- [x] 1c. `skills/epic-feature-workflow/scripts-win/pi-epic-init.ps1` —
       full PowerShell port. Same flags, same outputs, same exit codes,
       same commit messages.
- [x] 1d. `skills/epic-feature-workflow/scripts-win/pi-epicflow-doctor.ps1`
       — full port plus Windows-specific checks: PowerShell version,
       ExecutionPolicy not Restricted, `core.longpaths` enabled,
       `git config core.symlinks` for worktree symlink readiness,
       bash availability (informational — not required).
- [x] 1e. README: add "Windows (native PowerShell)" section to
       quickstart with install/PATH/longpaths notes.
- [x] 1f. CHANGELOG: provisional `0.12.0-dev` entry.

**Dogfood checkpoint:** On Windows, after `pi install pi-epicflow`:
- `pi-epicflow-doctor` runs and reports green.
- `pi-epic-init my-epic` creates the epic, branch, scaffolds files,
  commits. Same observable result as on Linux.

### Phase 2 — Feature loop

- [x] 2a. `pi-feature-start.ps1` (with `[System.Threading.Mutex]` parallel
       safety replacing `flock`). ✅ Dogfooded.
- [x] 2b. `pi-feature-complete.ps1`. ✅ Dogfooded — squash-merge,
       evidence + deliverables checks, archive, parallel-merge H6 handler
       all ported with full Python parity.
- [x] 2c. `pi-epic-next-feature.ps1`. ✅ Dogfooded — ready-set + DONE +
       HALT detection match bash.
- [x] 2d. **Bug discovered + fixed during Phase 2 dogfood**: `Add-RunLogEntry`
       embedded Windows paths produced invalid JSON (`\U`, `\s` aren't
       valid escapes). Added `ConvertTo-JsonString` helper to `_common.ps1`
       and wired into `pi-feature-start.ps1`. **Bash sibling has the same
       latent bug on Windows paths** — tracked as Phase 4 follow-up
       ("bash port of `ConvertTo-JsonString` for cross-platform safety").

**Dogfood checkpoint:** ✅ End-to-end feature loop shipped on Windows. F01
(hello.txt) and F02 (README append, depending on F01) ran clean:
`pi-epic-init` → `pi-epic-next-feature` (F01) → `pi-feature-start` →
worker edits in worktree → `pi-feature-complete` (squash-merge + archive) →
next (F02) → start/complete → next = DONE. All 5 run-log.jsonl entries
valid JSON. Final epic log clean.

### Phase 3 — Epic lifecycle + Python extraction

- [x] 3a. **`feature_declared_deliverables`** — ported inline in
       `_common.ps1::Get-FeatureDeclaredDeliverables` (Phase 2). Output
       format matches bash. Extraction to shared `lib/yaml_helpers.py`
       deferred (no parity bugs observed in practice; not blocking).
- [x] 3b. **`pi-epic-validate-decomposition` extraction** — 685-line
       Python heredoc extracted to
       `skills/epic-feature-workflow/lib/validate_decomposition.py`.
       Bash sibling shrank from 880 → 199 lines and now calls the
       shared module. ✅ Linux smoke 29/29 green after extraction.
- [x] 3c. **`pi-epic-validate-decomposition.ps1`** — thin wrapper around
       the shared lib + inline L-046 toolchain-check gate. ✅ Dogfooded.
- [x] 3d. **`pi-epic-complete.ps1`** — full port. E2E gate (Start-Process
       for background app + polling ready_check), L-043 epic-review gate,
       L-042 extension guardrails, full test suite, deviations→lessons,
       push + PR (or skip on missing origin per L-052), archive to
       `.pi/epics/done/`. ✅ Dogfooded end-to-end.
- [x] 3e. **`pi-epic-extend.ps1`** — full port. Un-archive, status flip,
       extension entry, design.md append, original_feature_count snapshot.
       ✅ Dogfooded.
- [ ] 3f. **`pi-epic-status.ps1`** — **deferred to v0.13.** Bash sibling
       is 92 lines of dispatcher + 1016 lines of lib files (rendering,
       ANSI, parsing, JSON emission, DAG state machine). Better path:
       extract status rendering to shared Python module in v0.13 (same
       pattern as `validate_decomposition.py`). Read-only command —
       doesn't block any write/lifecycle workflow. Doctor flags it as a
       known gap; `pi-epic-next-feature` covers the minimum-viable status
       check (DONE / HALT / next ready id).

**Dogfood checkpoint:** ✅ Full epic lifecycle ships natively on Windows.
Validated end-to-end on Windows host (via WSL → powershell.exe): fresh
repo → `pi-epic-init` → `pi-epic-validate-decomposition` (with proper
`estimated_hours` field) → `pi-feature-start F01` → worker writes file +
worker-report.md → `pi-feature-complete F01` → `pi-epic-next-feature`
returns DONE → write APPROVE_EPIC `epic-review.md` → `pi-epic-complete
--no-pr` (archives to .pi/epics/done/, distills lessons, resets STATE.md)
→ `pi-epic-extend 0001-p3v2 --rationale ...` un-archives + flips status
back to in-progress + appends extension entry. All commits land cleanly
on `epic/p3v2`. PR-open step gracefully no-ops when no origin remote
(L-052).

**Phase 3 bugs found + fixed during dogfood:**
1. `Get-FileContentLF $f -split "\n"` parsed `-split` as a parameter to
   the function instead of as the operator. PowerShell parser-precedence
   gotcha. Fixed: wrap function call in parens. Caught in both
   `pi-epic-complete.ps1` and `pi-epic-extend.ps1`.
2. `Add-UserLessonsFromCandidate -CandidatePath ...` — the function in
   `_common.ps1` uses `-Candidate` (no `Path` suffix). Renamed call site
   to match.
3. Native command `git fetch --quiet origin $def 2>$null | Out-Null`
   didn't suppress stderr because PowerShell's `2>$null` only catches
   PowerShell errors, not native stderr. Switched to `2>&1 | Out-Null`.
4. PowerShell drops trailing empty-string arguments when invoking native
   commands. `pi-epic-extend`'s inline Python expected 6 args but got 5
   when `--design` was omitted. Fixed in Python: pad `sys.argv[1:]` with
   empty strings before unpacking. (Same pattern likely needed in any
   future PS → Python heredoc invocation with optional trailing args.)

### Phase 4 — Parity + CI

- [ ] 4a. `tests/contract/` directory: JSON fixtures for each pi-*
       script capturing observable outputs (file tree, gitignore lines
       added, meta.yaml fields populated, git branch state, exit code,
       stdout/stderr line patterns).
- [ ] 4b. `install/smoke-test.sh` — extend to also run contract checks
       (read expected JSON, run the command, diff observable state).
- [ ] 4c. `install/smoke-test.ps1` — PowerShell sibling of the smoke
       test. Same contract-check entrypoint. Runs the win32 set.
- [ ] 4d. `.github/workflows/smoke.yml` — add `windows-latest` runner
       matrix entry. Existing Ubuntu job stays.
- [ ] 4e. `pi-epicflow-doctor` Windows checks finalized (longpaths,
       execution policy, PS version, git config).
- [ ] 4f. Final README pass: cross-platform support matrix, gotchas,
       Windows dogfood checklist.
- [ ] 4g. CHANGELOG: finalize 0.12.0 entry.
- [ ] 4h. `package.json` — bump to `0.12.0`.

**Dogfood checkpoint:** CI green on both Ubuntu and Windows.

## Parity rules (apply to every port)

1. **Same flags.** Every CLI flag (`--from`, `--title`, `--base`,
   `--no-planner`, etc.) parses identically.
2. **Same exit codes.** 0 success, 1 error, specific codes preserved.
3. **Same commit messages** (`chore(epic): scaffold <id>`, etc.). The
   lessons.md system and run-log parsers depend on these.
4. **Same stdout/stderr conventions.** `[epic-workflow]` prefix on log
   lines goes to stderr. User-facing output goes to stdout.
5. **Same file outputs.** `meta.yaml`, `.gitignore`, `STATE.md`,
   `run-log.jsonl` rows must be byte-identical for the same inputs
   (modulo timestamps + platform-specific line endings).
6. **Line endings.** Write LF, not CRLF, for files under `.pi/` —
   they get committed and seeing CRLF noise in diffs is a parity
   regression. PowerShell `Out-File` defaults to UTF-16; use
   `[System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))`
   or `Set-Content -NoNewline -Encoding utf8` with explicit `"\n"`.
7. **Path quoting.** Repo paths can contain spaces on Windows; all
   external command args use single-quoted PS strings or `--%`
   stop-parsing where appropriate.
8. **Date format.** `Get-Date -Format "yyyy-MM-dd"` for `today`; UTC
   ISO for `runlog` timestamps (matches bash `date -u +...`).

## Risks & rollback

- **Two codebases drift over time.** Mitigated by contract tests (Phase 4)
  + CI on both OSes. The contract tests are non-negotiable; without
  them this PR shouldn't merge.
- **Python heredoc extraction (Phase 3a/b) touches bash behavior.**
  Run smoke test before AND after extraction; the bash side must stay
  green at every commit.
- **PowerShell ExecutionPolicy** can block scripts in locked-down corp
  environments. The `.cmd` shim uses `-ExecutionPolicy Bypass` per
  invocation, which is allowed even when the system policy is
  Restricted. Documented.
- **Worktree symlinks** on Windows need `git config --global
  core.symlinks true` + Developer Mode for `mklink`. `pi-feature-start`
  on Windows must check and warn (not fail) — git worktrees themselves
  don't strictly require symlinks unless the *user's* repo has symlinks.
- **Rollback:** revert the v0.12.0 commit; v0.11.0 POSIX-only behavior
  is unchanged.

## Files (Phase 1)

- [x] `install/postinstall.mjs` — OS switch ✅
- [x] `skills/epic-feature-workflow/scripts-win/_common.ps1` ✅
- [x] `skills/epic-feature-workflow/scripts-win/pi-epic-init.ps1` ✅
- [x] `skills/epic-feature-workflow/scripts-win/pi-epicflow-doctor.ps1` ✅
- [x] `README.md` — Windows section ✅
- [x] `CHANGELOG.md` — `0.12.0-dev` provisional entry ✅
- [x] `PLAN-v0.12.0.md` — this file ✅
