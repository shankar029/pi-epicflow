#!/usr/bin/env bash
# Common helpers for epic-feature-workflow scripts.
# Source this from each script: source "$(dirname "$0")/_common.sh"

set -euo pipefail

# Resolve repo root (must be in a git repo)
repo_root() {
    git rev-parse --show-toplevel 2>/dev/null || {
        echo "ERROR: not in a git repository" >&2; exit 1
    }
}

# Resolve skill root from the real script dir set by the caller (__SCRIPT_DIR).
# Falls back to symlink-resolution of BASH_SOURCE[1] if not set.
skill_root() {
    if [[ -n "${__SCRIPT_DIR:-}" ]]; then
        ( cd "$__SCRIPT_DIR/.." && pwd )
        return
    fi
    local src="${BASH_SOURCE[1]}"
    while [ -L "$src" ]; do
        local d; d="$(cd -P "$(dirname "$src")" && pwd)"
        src="$(readlink "$src")"
        [[ $src != /* ]] && src="$d/$src"
    done
    ( cd -P "$(dirname "$src")/.." && pwd )
}

# Default branch detection (main, master, develop, ...)
default_branch() {
    local repo
    repo=$(repo_root)
    cd "$repo"
    # Prefer the value from epic meta if set; fallback to git's HEAD on origin
    local from_meta=""
    if [[ -f "$repo/.pi/STATE.md" ]]; then
        local epic_id
        epic_id=$(active_epic_id || true)
        if [[ -n "$epic_id" && -f "$repo/.pi/epics/$epic_id/meta.yaml" ]]; then
            from_meta=$(grep -E '^default_branch:' "$repo/.pi/epics/$epic_id/meta.yaml" | sed 's/.*:\s*//' | tr -d '"' || true)
        fi
    fi
    if [[ -n "$from_meta" ]]; then
        echo "$from_meta"; return
    fi
    git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@' || echo "main"
}

# Active epic ID from STATE.md (folder name under .pi/epics/)
active_epic_id() {
    local repo
    repo=$(repo_root)
    if [[ ! -f "$repo/.pi/STATE.md" ]]; then
        # Common cause: caller is inside a git worktree (which doesn't have its
        # own STATE.md) instead of the main checkout. Surface the cause loudly
        # so the orchestrator doesn't silently no-op.
        echo "ERROR: no .pi/STATE.md at $repo. Are you in a feature worktree?" >&2
        echo "       cd to the main repo (the checkout that has .pi/STATE.md) and retry." >&2
        return 1
    fi
    grep -oE '\.pi/epics/[0-9]{4}-[a-z0-9-]+' "$repo/.pi/STATE.md" | head -1 | sed 's@.pi/epics/@@'
}

# Active epic folder
active_epic_dir() {
    local repo id
    repo=$(repo_root)
    id=$(active_epic_id) || return 1
    echo "$repo/.pi/epics/$id"
}

# Active feature ID from STATE.md (or empty)
active_feature_id() {
    local repo
    repo=$(repo_root)
    [[ -f "$repo/.pi/STATE.md" ]] || return 1
    grep -oE 'F[0-9]{2}-[a-z0-9-]+' "$repo/.pi/STATE.md" | head -1 || true
}

# Next epic ID (NNNN, zero-padded)
next_epic_id() {
    local repo
    repo=$(repo_root)
    local max=0
    for d in "$repo/.pi/epics"/[0-9][0-9][0-9][0-9]-* "$repo/.pi/epics/done"/[0-9][0-9][0-9][0-9]-*; do
        [[ -d "$d" ]] || continue
        local n
        n=$(basename "$d" | grep -oE '^[0-9]{4}' || echo "0")
        n=$((10#$n))
        (( n > max )) && max=$n
    done
    printf "%04d" $((max + 1))
}

# Slugify
slugify() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
}

# Tiny YAML reader for our flat schema. Usage: yaml_get <file> <key>
# Supports: top-level scalars, dotted paths for one-level nested objects.
yaml_get() {
    local file=$1 key=$2
    python3 - "$file" "$key" <<'PY'
import sys, re
path, key = sys.argv[1], sys.argv[2]
parts = key.split('.')
data = {}
stack = [(0, data)]
cur_key = None
with open(path, encoding='utf-8') as f:
    for raw in f:
        line = raw.rstrip('\n')
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        indent = len(line) - len(line.lstrip(' '))
        s = line.strip()
        while stack and indent < stack[-1][0]:
            stack.pop()
        ctx = stack[-1][1]
        if s.startswith('- '):
            continue
        m = re.match(r'^([A-Za-z0-9_]+)\s*:\s*(.*)$', s)
        if not m: continue
        k, v = m.group(1), m.group(2).strip()
        v = re.sub(r'\s+#.*$', '', v).strip()
        if v == '':
            ctx[k] = {}
            stack.append((indent + 2, ctx[k]))
            cur_key = None
        else:
            ctx[k] = v.strip('"').strip("'")
            cur_key = k
node = data
for p in parts:
    if isinstance(node, dict) and p in node:
        node = node[p]
    else:
        sys.exit(0)
print(node if not isinstance(node, dict) else '')
PY
}

# Bump 'updated:' field in a meta.yaml (in-place) to today
yaml_bump_updated() {
    local file=$1 today
    today=$(date -u +%Y-%m-%d)
    if grep -qE '^updated:' "$file"; then
        sed -i.bak -E "s/^updated:.*$/updated: $today/" "$file"
        rm -f "$file.bak"
    else
        echo "updated: $today" >> "$file"
    fi
}

# Set or update a top-level key in a YAML file (string value)
yaml_set() {
    local file=$1 key=$2 value=$3
    if grep -qE "^${key}:" "$file"; then
        # Use a different delimiter for sed since value may contain /
        sed -i.bak -E "s|^${key}:.*$|${key}: \"${value}\"|" "$file"
        rm -f "$file.bak"
    else
        echo "${key}: \"${value}\"" >> "$file"
    fi
}

# Append a JSONL entry to run-log
runlog_append() {
    local epic_dir=$1; shift
    local payload=$1
    local ts
    ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    mkdir -p "$epic_dir"
    echo "{\"ts\":\"$ts\",${payload}}" >> "$epic_dir/run-log.jsonl"
}

# Confirm we are NOT on the default branch (refuse to mutate it)
refuse_default_branch() {
    local cur def
    cur=$(git rev-parse --abbrev-ref HEAD)
    def=$(default_branch)
    if [[ "$cur" == "$def" ]]; then
        echo "ERROR: refusing to operate on default branch '$def'. Switch to the epic branch first." >&2
        exit 1
    fi
}

# Echo to stderr
log() { echo "[epic-workflow] $*" >&2; }

# Per-machine user lessons file (privacy fix — v0.6.2 / L-036).
# Distilled lessons from each user's epics accumulate here, NEVER in the
# framework's skills/.../lessons.md. The framework file ships with pi-epicflow
# and is shared by all users; this file is machine-private and is read by
# agents alongside the framework lessons (user lessons win on conflict).
user_lessons_path() {
    echo "${HOME}/.pi/epicflow/user-lessons.md"
}

# Ensure the user-lessons file exists with a header.
ensure_user_lessons() {
    local p; p=$(user_lessons_path)
    [[ -f "$p" ]] && return 0
    mkdir -p "$(dirname "$p")"
    cat > "$p" <<'EOF'
# User lessons (machine-private)

> Per-machine, per-user lessons distilled from your epics. Never auto-pushed.
> Agents read this file ALONGSIDE the framework's
> `skills/epic-feature-workflow/lessons.md`. On conflict, **user-lessons win**
> (more context-specific to your codebase / toolchain / environment).
>
> To contribute a generalizable lesson upstream to pi-epicflow itself, copy
> the entry into a PR against `skills/epic-feature-workflow/lessons.md` on
> https://github.com/shankar029/pi-epicflow — `pi-epic-complete
> --contribute-lesson L-XYZ` prints the copy-paste-friendly form.

## Lessons

EOF
}

# Append distilled lessons-candidate content (per-epic) to user-lessons.md.
# Idempotent on epic id: if a section for this epic already exists, skip.
append_user_lessons_from_candidate() {
    local candidate=$1 epic_id=$2
    ensure_user_lessons
    local p; p=$(user_lessons_path)
    if grep -qF "## Source epic ${epic_id}" "$p" 2>/dev/null; then
        log "user-lessons.md already has entries for ${epic_id}; skipping append"
        return 0
    fi
    {
        echo
        echo "## Source epic ${epic_id}"
        echo
        echo "_Appended $(date -u +%Y-%m-%d) by pi-epic-complete._"
        echo
        # Strip the candidate's own header and source-deviations header;
        # carry the deviation entries through verbatim.
        sed -n '/^## /,$p' "$candidate" | sed '/^## Source deviations$/d'
    } >> "$p"
    log "appended distilled lessons from ${epic_id} → $p"
}

# Resolve the pi-epicflow clone path (used by pi-epicflow-doctor + version checks).
# Falls back to the skill root's grandparent which works for both the standard
# `~/.pi/agent/git/.../pi-epicflow` layout and a developer-checkout install.
pi_epicflow_clone() {
    local sr; sr=$(skill_root 2>/dev/null) || sr=""
    [[ -z "$sr" ]] && return 1
    # skill_root is .../skills/epic-feature-workflow; clone root is two levels up.
    ( cd "$sr/../.." && pwd )
}

# Days since the pi-epicflow clone's HEAD commit. Used by version-drift warning.
pi_epicflow_age_days() {
    local clone; clone=$(pi_epicflow_clone 2>/dev/null) || { echo "?"; return; }
    [[ -e "$clone/.git" ]] || { echo "?"; return; }
    local last_ts now_ts
    last_ts=$(git -C "$clone" log -1 --format=%ct HEAD 2>/dev/null || echo "")
    [[ -z "$last_ts" ]] && { echo "?"; return; }
    now_ts=$(date -u +%s)
    echo $(( (now_ts - last_ts) / 86400 ))
}

# Echo the active pi-epicflow version (from its package.json) — best effort.
pi_epicflow_version() {
    local clone; clone=$(pi_epicflow_clone 2>/dev/null) || { echo "?"; return; }
    [[ -f "$clone/package.json" ]] || { echo "?"; return; }
    grep -E '"version"' "$clone/package.json" | head -1 | sed -E 's/.*"([0-9.]+[^"]*)".*/\1/'
}
