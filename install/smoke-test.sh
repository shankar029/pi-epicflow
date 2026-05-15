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
echo "[1/10] pi-epic-init"
cat > /tmp/pi-epicflow-smoke-design.md <<'EOF'
# Smoke
Two features.
EOF
pi-epic-init smoke --from /tmp/pi-epicflow-smoke-design.md --title "smoke" > /dev/null
EPIC_ID=$(ls .pi/epics/ | grep -E '^0[0-9]+-' | head -1)
[ -n "$EPIC_ID" ] && pass "epic created: $EPIC_ID" || fail "no epic dir"
[ "$(git rev-parse --abbrev-ref HEAD)" = "epic/smoke" ] && pass "on epic branch" || fail "not on epic branch"

# 2. decomposition
echo "[2/10] decomposition.yaml"
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
echo "[3/10] pi-epic-next-feature"
NEXT=$(pi-epic-next-feature)
[ "$NEXT" = "F01" ] && pass "next-feature returns F01" || fail "expected F01, got '$NEXT'"

# 4. feature-start with L-012 (halt file present) + L-013 (status advance)
echo "[4/10] pi-feature-start F01 (with halt-fake.md present)"
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

# 5. worker simulation + feature-complete
echo "[5/10] simulate worker + pi-feature-complete F01"
WT_PATH="$(grep -E "^worktree:" ".pi/epics/$EPIC_ID/features/F01-alpha/meta.yaml" | sed -E 's/^worktree:\s*"?([^"]*)"?.*/\1/')"
[ -d "$WT_PATH" ] || fail "feature worktree missing: $WT_PATH"
(
  cd "$WT_PATH"
  echo "hello" > a.txt
  git add a.txt
  git commit -qm "F01: add a.txt"
)
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
echo "[6/10] pi-epic-next-feature after F01"
NEXT=$(pi-epic-next-feature)
[ "$NEXT" = "F02" ] && pass "dispatcher returns F02 after F01 merged" || fail "expected F02, got '$NEXT'"

# 7. L-023: spike workflow end-to-end. Add a fresh epic with a single
# spike and confirm pi-feature-start + (simulated) worker writing journal
# to MAIN_REPO + pi-feature-complete all succeed without manual recovery.
echo "[7/10] L-023 spike workflow"
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
echo "[8/10] L-025 clean tree after pi-epic-complete"
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
echo "[9/10] L-029 depends_on range syntax detection"
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
echo "[10/10] L-030 parent-dir warning suppression"
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

echo ""
echo "🎉 smoke test passed"
