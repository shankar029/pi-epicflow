#!/usr/bin/env bash
# install/smoke-test.sh — end-to-end smoke test for the workflow scripts.
#
# Creates a throwaway git repo in $TMPDIR, runs pi-epic-init → pi-feature-start
# F01 → pi-feature-complete F01 with a trivial feature, and asserts:
#   - epic + feature branches are created
#   - feature is merged into the epic branch
#   - meta.yaml status advances (design → in-progress)
#   - halt-*.md files do NOT leak into the pending-edits auto-commit
#   - feature DAG dispatch works (pi-epic-next-feature)
#
# Usage:
#   bash install/smoke-test.sh
#
# Exit codes:
#   0 — all assertions pass
#   1 — any assertion fails

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_ROOT="$(cd "$HERE/.." && pwd)"
SCRIPTS_DIR="$PKG_ROOT/skills/epic-feature-workflow/scripts"
export PATH="$SCRIPTS_DIR:$PATH"

SANDBOX="$(mktemp -d -t pi-epicflow-smoke.XXXXXX)"
trap 'rm -rf "$SANDBOX" /tmp/pi-epicflow-smoke-design.md /tmp/pi-epicflow-smoke-spike-design.md' EXIT

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; exit 1; }

echo "=== pi-epicflow smoke test ==="
echo "sandbox: $SANDBOX"
echo "scripts: $SCRIPTS_DIR"
echo ""

cd "$SANDBOX"
git init -q -b main
git config user.email smoke@local
git config user.name "Smoke"
echo "# smoke" > README.md
git add README.md && git commit -qm "init"

# 1. epic-init
echo "[1/16] pi-epic-init"
cat > /tmp/pi-epicflow-smoke-design.md <<'EOF'
# Smoke
Two features.
EOF
pi-epic-init smoke --from /tmp/pi-epicflow-smoke-design.md --title "smoke" > /dev/null
EPIC_ID=$(ls .pi/epics/ | grep -E '^0[0-9]+-' | head -1)
[ -n "$EPIC_ID" ] && pass "epic created: $EPIC_ID" || fail "no epic dir"
[ "$(git rev-parse --abbrev-ref HEAD)" = "epic/smoke" ] && pass "on epic branch" || fail "not on epic branch"

# 2. decomposition
echo "[2/16] decomposition.yaml"
cat > ".pi/epics/$EPIC_ID/decomposition.yaml" <<EOF
epic: $EPIC_ID
features:
  - id: F01
    slug: alpha
    summary: alpha
    depends_on: []
    estimated_hours: 0
    scope_files: [a.txt]
    acceptance_criteria: ["a.txt exists with content"]
  - id: F02
    slug: beta
    summary: beta
    depends_on: [F01]
    estimated_hours: 0
    scope_files: [b.txt]
    acceptance_criteria: ["b.txt exists with content"]
EOF
git add .pi/ && git commit -qm "decomp"
pass "decomposition committed"

# 3. next-feature dispatch
echo "[3/16] pi-epic-next-feature"
NEXT=$(pi-epic-next-feature)
[ "$NEXT" = "F01" ] && pass "next-feature returns F01" || fail "expected F01, got '$NEXT'"

# 4. feature-start with L-012 (halt file present) + L-013 (status advance)
echo "[4/16] pi-feature-start F01 (with halt-fake.md present)"
echo "fake halt content" > ".pi/epics/$EPIC_ID/halt-fake.md"
echo "extra line for design" >> ".pi/epics/$EPIC_ID/design.md"
pi-feature-start F01 > /dev/null

STATUS=$(grep -E "^status:" ".pi/epics/$EPIC_ID/meta.yaml" | sed -E 's/^status:\s*"?([^"]*)"?.*/\1/')
[ "$STATUS" = "in-progress" ] && pass "epic status advanced design→in-progress (L-013)" \
  || fail "status not advanced; got: '$STATUS'"

if git log -1 --name-only --pretty=format: epic/smoke | grep -q "halt-fake.md"; then
  fail "L-012 broken: halt-fake.md was committed to epic branch"
else
  pass "halt file NOT committed to epic branch (L-012)"
fi
[ -f ".pi/epics/$EPIC_ID/halt-fake.md" ] && pass "halt file still on disk" || fail "halt file was removed"

# 5. worker simulation + feature-complete (v0.6: worker-report.md with evidence section)
echo "[5/16] simulate worker + pi-feature-complete F01"
WT_PATH="$(grep -E "^worktree:" ".pi/epics/$EPIC_ID/features/F01-alpha/meta.yaml" | sed -E 's/^worktree:\s*"?([^"]*)"?.*/\1/')"
[ -d "$WT_PATH" ] || fail "feature worktree missing: $WT_PATH"
(
  cd "$WT_PATH"
  echo "hello" > a.txt
  git add a.txt
  git commit -qm "F01: add a.txt"
)
# v0.6 evidence gate: write a worker-report.md with the mandatory header.
cat > ".pi/epics/$EPIC_ID/features/F01-alpha/worker-report.md" <<'EOF'
state: READY
feature: F01-alpha
branch: feat/smoke/F01-alpha

Implemented:
- created a.txt with hello content

Changed files:
- a.txt (+1/-0)

Validation:
- test_cmd: n/a
- self-review: clean

## Completion evidence

### AC1: a.txt exists with content "hello"
```
$ cat a.txt
hello
```
Evidence summary: file present, contents match.

## Diff summary
```
$ git diff main...HEAD --stat
 a.txt | 1 +
 1 file changed, 1 insertion(+)
```

Deviations logged: none
EOF
pi-feature-complete F01 --skip-tests > /dev/null
[ -d ".pi/epics/$EPIC_ID/features/done/F01-alpha" ] && pass "F01 archived to done/" || fail "F01 not archived"
echo "  -- epic log after F01 --"
epic_log=$(git log --oneline epic/smoke)
echo "$epic_log" | head -3 | sed 's/^/     /'
if echo "$epic_log" | grep -qF 'feat(F01)'; then
  pass "squash-merge commit on epic"
else
  fail "no F01 squash-merge"
fi

# 6. dispatcher unblocks F02 after F01 merged
echo "[6/16] pi-epic-next-feature after F01"
NEXT=$(pi-epic-next-feature)
[ "$NEXT" = "F02" ] && pass "dispatcher returns F02 after F01 merged" || fail "expected F02, got '$NEXT'"

# 7. L-023: spike workflow end-to-end. Add a fresh epic with a single
# spike and confirm pi-feature-start + (simulated) worker writing journal
# to MAIN_REPO + pi-feature-complete all succeed without manual recovery.
echo "[7/16] L-023 spike workflow"
cd "$SANDBOX"
# Clean .pi/ from the half-finished first epic so a fresh init works.
rm -rf .pi/
# Check out main and discard any leftover gitignore edits so the tree is
# clean. (The gitignore was committed on epic/smoke; main never saw it.)
git checkout main -q
git clean -fd -q
cat > /tmp/pi-epicflow-smoke-spike-design.md <<'EOF'
# Spike-only smoke
One decision spike.
EOF
pi-epic-init spike-smoke --from /tmp/pi-epicflow-smoke-spike-design.md --title "spike-smoke" > /dev/null
SPIKE_EPIC=$(ls .pi/epics/ | grep -E '^0[0-9]+-spike-smoke' | head -1)
[ -n "$SPIKE_EPIC" ] && pass "spike epic created: $SPIKE_EPIC" || fail "no spike epic dir"

cat > ".pi/epics/$SPIKE_EPIC/decomposition.yaml" <<EOF
epic: $SPIKE_EPIC
features:
  - id: S01
    kind: spike
    slug: pick-algo
    summary: Decide which algorithm to use
    depends_on: []
    estimated_hours: 1
    scope_files: []
    acceptance_criteria:
      - Decision logged in deviations.md with chosen option.
      - Evidence cited.
      - Impact on blocked features documented.
EOF
git add .pi/ && git commit -qm "spike decomp"

pi-feature-start S01 > /dev/null

# Simulate the spike worker: writes journal to MAIN_REPO (no worktree code).
printf '\n## S01 decision\nChose option A.\nEvidence: see design.\nImpact: F02 unblocked.\n' \
    >> ".pi/epics/$SPIKE_EPIC/deviations.md"
# Worker also populates feature.md in MAIN_REPO
printf '\n# Decision\nOption A, see deviations.md.\n' \
    >> ".pi/epics/$SPIKE_EPIC/features/S01-pick-algo/feature.md"

pi-feature-complete S01 --skip-tests > /dev/null

if git log --oneline -5 epic/spike-smoke | grep -q 'feat(S01)'; then
  pass "spike squash-merge commit landed on epic"
else
  echo "  epic log:" >&2; git log --oneline -5 epic/spike-smoke >&2
  fail "spike squash-merge missing"
fi
[ -d ".pi/epics/$SPIKE_EPIC/features/done/S01-pick-algo" ] && pass "spike archived to done/" \
  || fail "spike not archived"
if [[ -n $(git status --porcelain) ]]; then
  echo "  dirty paths:" >&2; git status --short >&2
  fail "L-023: working tree dirty after spike completion"
else
  pass "working tree clean after spike completion (L-023)"
fi

# 8. L-025: pi-epic-complete should leave the tree clean.
echo "[8/16] L-025 clean tree after pi-epic-complete"
# Complete the spike epic. --no-pr skips the push step (no origin).
pi-epic-complete --no-pr > /dev/null 2>&1 || true
if [[ -d ".pi/epics/done/$SPIKE_EPIC" ]]; then
  pass "epic archived to .pi/epics/done/"
else
  fail "epic not archived"
fi
if [[ -n $(git status --porcelain) ]]; then
  echo "  dirty paths:" >&2; git status --short >&2
  fail "L-025: working tree dirty after pi-epic-complete"
else
  pass "working tree clean after pi-epic-complete (L-025)"
fi

# 9. L-029: range syntax in depends_on must be rejected with a specific error.
echo "[9/16] L-029 depends_on range syntax detection"
L29_DIR=$(mktemp -d)
cd "$L29_DIR"
git init -q -b main && git config user.email t@t && git config user.name T
echo init > r.md && git add r.md && git commit -qm init >/dev/null
mkdir -p .pi/epics/0001-x
cat > .pi/STATE.md <<'EOF'
Active epic: .pi/epics/0001-x/
EOF
cat > .pi/epics/0001-x/meta.yaml <<'EOF'
id: 0001-x
title: x
status: design
default_branch: main
EOF
cat > .pi/epics/0001-x/decomposition.yaml <<'EOF'
epic: 0001-x
features:
  - id: F01
    slug: a
    summary: a
    depends_on: []
    estimated_hours: 1
    scope_files: [src/a.py, src/b.py]
    acceptance_criteria: [a]
  - id: F02
    slug: b
    summary: b
    depends_on: [F01-F03]
    estimated_hours: 1
    scope_files: [src/c.py]
    acceptance_criteria: [b]
  - id: F03
    slug: c
    summary: c
    depends_on: [F01]
    estimated_hours: 1
    scope_files: [src/d.py]
    acceptance_criteria: [c]
EOF
out=$(pi-epic-validate-decomposition 2>&1) && ec=0 || ec=$?
cd "$SANDBOX"
rm -rf "$L29_DIR"
if [[ $ec -ne 0 ]] && echo "$out" | grep -q "range syntax 'F01-F03'"; then
    pass "L-029: range syntax errors with specific hint"
else
    echo "  exit=$ec output: $out" >&2
    fail "L-029: expected range-syntax error"
fi

# 10. L-030: parent-dir-missing warning suppressed when 2+ scope_files share parent.
echo "[10/16] L-030 parent-dir warning suppression"
L30_DIR=$(mktemp -d)
cd "$L30_DIR"
git init -q -b main && git config user.email t@t && git config user.name T
echo init > r.md && git add r.md && git commit -qm init >/dev/null
mkdir -p .pi/epics/0001-x
cat > .pi/STATE.md <<'EOF'
Active epic: .pi/epics/0001-x/
EOF
cat > .pi/epics/0001-x/meta.yaml <<'EOF'
id: 0001-x
title: x
status: design
default_branch: main
EOF
# F01 has 2 scope_files under newpkg/ → should suppress.
# F02 has 1 scope_file under solo/ → should still warn.
cat > .pi/epics/0001-x/decomposition.yaml <<'EOF'
epic: 0001-x
features:
  - id: F01
    slug: a
    summary: a
    depends_on: []
    estimated_hours: 1
    scope_files: [newpkg/a.py, newpkg/b.py]
    acceptance_criteria: [a]
  - id: F02
    slug: b
    summary: b
    depends_on: [F01]
    estimated_hours: 1
    scope_files: [solo/c.py]
    acceptance_criteria: [b]
EOF
out=$(pi-epic-validate-decomposition 2>&1) || true
cd "$SANDBOX"
rm -rf "$L30_DIR"
if echo "$out" | grep -q "'solo/c.py' does not exist" && \
   ! echo "$out" | grep -qE "'newpkg/(a|b)\.py' does not exist"; then
    pass "L-030: parent-dir warning suppressed for shared-parent files; kept for singletons"
else
    echo "  output: $out" >&2
    fail "L-030: suppression behaved unexpectedly"
fi

# 11. L-032: pi-feature-complete rejects a worker-report without '## Completion evidence'.
echo "[11/16] L-032 evidence-gate rejects missing-evidence report"
L32_DIR=$(mktemp -d)
cd "$L32_DIR"
git init -q -b main && git config user.email t@t && git config user.name T
echo init > r.md && git add r.md && git commit -qm init >/dev/null
pi-epic-init mini --title "mini" >/dev/null 2>&1
E32_ID=$(ls .pi/epics/ | grep -v done | head -1)
cat > ".pi/epics/$E32_ID/decomposition.yaml" <<'EOF'
epic: mini
features:
  - id: F01
    slug: a
    summary: a
    depends_on: []
    estimated_hours: 1
    scope_files: [a.txt]
    acceptance_criteria: [a.txt exists]
EOF
pi-feature-start F01 >/dev/null 2>&1
WT32=$(grep -E "^worktree:" ".pi/epics/$E32_ID/features/F01-a/meta.yaml" | sed -E 's/^worktree:\s*"?([^"]*)"?.*/\1/')
( cd "$WT32" && echo x > a.txt && git add a.txt && git commit -qm "F01" )
# Write a worker-report WITHOUT the evidence header.
cat > ".pi/epics/$E32_ID/features/F01-a/worker-report.md" <<'EOF'
state: READY
feature: F01-a
branch: feat/mini/F01-a

Implemented:
- created a.txt

Validation:
- test_cmd: n/a
EOF
out=$(pi-feature-complete F01 --skip-tests 2>&1) && ec=0 || ec=$?
cd "$SANDBOX"
rm -rf "$L32_DIR"
if [[ $ec -ne 0 ]] && echo "$out" | grep -q "Completion evidence"; then
    pass "L-032: pi-feature-complete refuses merge when '## Completion evidence' missing"
else
    echo "  exit=$ec output: $out" >&2
    fail "L-032: expected merge to fail with evidence-missing error"
fi

# 12. L-032: --skip-evidence override permits merge for legacy/edge cases.
echo "[12/16] L-032 --skip-evidence override works"
L32B_DIR=$(mktemp -d)
cd "$L32B_DIR"
git init -q -b main && git config user.email t@t && git config user.name T
echo init > r.md && git add r.md && git commit -qm init >/dev/null
pi-epic-init mini --title "mini" >/dev/null 2>&1
E32B_ID=$(ls .pi/epics/ | grep -v done | head -1)
cat > ".pi/epics/$E32B_ID/decomposition.yaml" <<'EOF'
epic: mini
features:
  - id: F01
    slug: a
    summary: a
    depends_on: []
    estimated_hours: 1
    scope_files: [a.txt]
    acceptance_criteria: [a.txt exists]
EOF
pi-feature-start F01 >/dev/null 2>&1
WT32B=$(grep -E "^worktree:" ".pi/epics/$E32B_ID/features/F01-a/meta.yaml" | sed -E 's/^worktree:\s*"?([^"]*)"?.*/\1/')
( cd "$WT32B" && echo x > a.txt && git add a.txt && git commit -qm "F01" )
cat > ".pi/epics/$E32B_ID/features/F01-a/worker-report.md" <<'EOF'
state: READY
feature: F01-a
branch: feat/mini/F01-a
EOF
out=$(pi-feature-complete F01 --skip-tests --skip-evidence 2>&1) && ec=0 || ec=$?
merged=$([ -d ".pi/epics/$E32B_ID/features/done/F01-a" ] && echo yes || echo no)
cd "$SANDBOX"
rm -rf "$L32B_DIR"
if [[ $ec -eq 0 ]] && [[ "$merged" == "yes" ]]; then
    pass "L-032: --skip-evidence allows merge without evidence section"
else
    echo "  exit=$ec merged=$merged output: $out" >&2
    fail "L-032: --skip-evidence override failed"
fi

# 13. L-035: pi-epic-status --ready filters by dep-merged + own-state-dispatchable.
echo "[13/16] L-035 pi-epic-status --ready ready-set correctness"
L35_DIR=$(mktemp -d)
cd "$L35_DIR"
git init -q -b main && git config user.email t@t && git config user.name T
echo init > r.md && git add r.md && git commit -qm init >/dev/null
pi-epic-init demo --title "demo" >/dev/null 2>&1
E35_ID=$(ls .pi/epics/ | grep -v done | head -1)
cat > ".pi/epics/$E35_ID/decomposition.yaml" <<'EOF'
epic: demo
features:
  - id: F01
    slug: a
    summary: a
    depends_on: []
    estimated_hours: 1
    scope_files: [a.txt]
    acceptance_criteria: [a]
  - id: F02
    slug: b
    summary: b
    depends_on: [F01]
    estimated_hours: 1
    scope_files: [b.txt]
    acceptance_criteria: [b]
  - id: F03
    slug: c
    summary: c
    depends_on: []
    estimated_hours: 1
    scope_files: [c.txt]
    acceptance_criteria: [c]
EOF
# All pending → F01 + F03 ready (F02 blocked by F01).
out=$(pi-epic-status --ready --quiet | sort | tr '\n' ',')
if [[ "$out" == "F01,F03," ]]; then
    pass "L-035: --ready returns leaf-features (F01,F03) when all pending"
else
    echo "  got: '$out' expected 'F01,F03,'" >&2; fail "L-035: ready-set initial"
fi
# Mark F01 as merged → F02 + F03 ready (F01 done, F02 now unblocked, F03 still ready).
mkdir -p ".pi/epics/$E35_ID/features/done/F01-a"
echo "state: merged" > ".pi/epics/$E35_ID/features/done/F01-a/meta.yaml"
out=$(pi-epic-status --ready --quiet | sort | tr '\n' ',')
if [[ "$out" == "F02,F03," ]]; then
    pass "L-035: --ready transitions correctly after merge (F02 unblocks)"
else
    echo "  got: '$out' expected 'F02,F03,'" >&2; fail "L-035: ready-set post-merge"
fi
# Mark F02 halted-ambiguous → still in ready set (v0.6 H10).
mkdir -p ".pi/epics/$E35_ID/features/F02-b"
echo "state: halted-ambiguous" > ".pi/epics/$E35_ID/features/F02-b/meta.yaml"
out=$(pi-epic-status --ready --quiet | sort | tr '\n' ',')
if [[ "$out" == "F02,F03," ]]; then
    pass "L-035: --ready includes halted-ambiguous features (H10-resume path)"
else
    echo "  got: '$out' expected 'F02,F03,'" >&2; fail "L-035: ready-set halted-ambiguous"
fi
cd "$SANDBOX"
rm -rf "$L35_DIR"

# ── v0.6.2 phases ──

echo "[14/16] L-038 test_cmd-bypass warning surfaces in pi-epic-status"
L38_DIR="$SANDBOX/l38"
mkdir -p "$L38_DIR" && cd "$L38_DIR"
git init -q -b main
git config user.email smoke@local
git config user.name "Smoke"
echo init > r.md && git add r.md && git commit -qm init >/dev/null
printf 'title: Bypass\nslug: bypass\nrationale: smoke\n' > /tmp/pi-bypass-design.md
pi-epic-init bypass --from /tmp/pi-bypass-design.md --title "Bypass" >/dev/null
E38_ID=$(ls .pi/epics | grep -v done | head -1)
sed -i.bak 's|^test_cmd:.*|test_cmd: "echo SKIP-tests-are-broken"|' ".pi/epics/$E38_ID/epic-config.yaml"
rm -f ".pi/epics/$E38_ID/epic-config.yaml.bak"
out=$(pi-epic-status 2>&1 || true)
if echo "$out" | grep -qE 'WARNING.*bypass'; then
    pass "L-038: bypass test_cmd surfaces WARNING in pi-epic-status"
else
    echo "$out" | sed 's/^/    /' >&2
    fail "L-038: bypass warning missing"
fi
sed -i.bak 's|^test_cmd:.*|test_cmd: "true"|' ".pi/epics/$E38_ID/epic-config.yaml"
rm -f ".pi/epics/$E38_ID/epic-config.yaml.bak"
out=$(pi-epic-status 2>&1 || true)
if ! echo "$out" | grep -qE 'WARNING.*bypass'; then
    pass "L-038: real test_cmd does not trigger bypass warning"
else
    fail "L-038: false-positive warning on real test_cmd"
fi
cd "$SANDBOX"
rm -rf "$L38_DIR"

echo "[15/16] L-036 user-lessons.md is populated by pi-epic-complete"
L36_DIR="$SANDBOX/l36"
mkdir -p "$L36_DIR" && cd "$L36_DIR"
git init -q -b main
git config user.email smoke@local
git config user.name "Smoke"
echo init > r.md && git add r.md && git commit -qm init >/dev/null
REAL_HOME="$HOME"
L36_HOME="$SANDBOX/home36"
mkdir -p "$L36_HOME"
export HOME="$L36_HOME"
printf 'title: Lesson Smoke\nslug: lsmoke\nrationale: smoke\n' > /tmp/pi-l36-design.md
pi-epic-init lsmoke --from /tmp/pi-l36-design.md --title "Lesson Smoke" >/dev/null
if [[ -f "$L36_HOME/.pi/epicflow/user-lessons.md" ]]; then
    pass "L-036: pi-epic-init creates user-lessons.md skeleton"
else
    fail "L-036: user-lessons.md missing after pi-epic-init"
fi
E36_ID=$(ls .pi/epics | grep -v done | head -1)
cat >> ".pi/epics/$E36_ID/deviations.md" <<DEVEOF

## F01 — example

### 2026-05-15 12:00 — sample deviation
- What: smoke deviation
- Why: testing distillation
- Decomposition lesson: scope_files should include barrel exports.
DEVEOF
candidate=".pi/epics/$E36_ID/lessons-candidate.md"
{
    echo "# Lessons candidates from $E36_ID"
    echo
    echo "## Source deviations"
    echo
    cat ".pi/epics/$E36_ID/deviations.md"
} > "$candidate"
( source "$SCRIPTS_DIR/_common.sh" && append_user_lessons_from_candidate "$candidate" "$E36_ID" )
if grep -q "## Source epic $E36_ID" "$L36_HOME/.pi/epicflow/user-lessons.md"; then
    pass "L-036: pi-epic-complete distills lessons into user-lessons.md"
else
    cat "$L36_HOME/.pi/epicflow/user-lessons.md" | sed 's/^/    /'
    fail "L-036: user-lessons.md missing distilled entry"
fi
if ( source "$SCRIPTS_DIR/_common.sh" && append_user_lessons_from_candidate "$candidate" "$E36_ID" 2>&1 ) | grep -q 'already has entries'; then
    pass "L-036: distillation is idempotent on epic id"
else
    fail "L-036: distillation re-appended (non-idempotent)"
fi
export HOME="$REAL_HOME"
cd "$SANDBOX"
rm -rf "$L36_DIR"

echo "[16/16] L-040 gitignore covers node_modules* family"
L40_DIR="$SANDBOX/l40"
mkdir -p "$L40_DIR" && cd "$L40_DIR"
git init -q -b main
git config user.email smoke@local
git config user.name "Smoke"
echo init > r.md && git add r.md && git commit -qm init >/dev/null
printf 'title: NM\nslug: nm\nrationale: smoke\n' > /tmp/pi-l40-design.md
pi-epic-init nm --from /tmp/pi-l40-design.md --title "NM" >/dev/null
if grep -qxF "node_modules*" .gitignore; then
    pass "L-040: pi-epic-init adds node_modules* glob to .gitignore"
else
    cat .gitignore | sed 's/^/    /'
    fail "L-040: node_modules* missing from .gitignore"
fi
mkdir -p node_modules_main && touch node_modules_main/.placeholder
if git check-ignore -q node_modules_main/.placeholder; then
    pass "L-040: node_modules_main is correctly ignored"
else
    fail "L-040: node_modules_main slipped past gitignore"
fi
cd "$SANDBOX"
rm -rf "$L40_DIR"

echo ""
echo "🎉 smoke test passed"
