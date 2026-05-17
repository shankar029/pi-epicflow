#!/usr/bin/env bash
# pi-epic-status-features.sh — preamble + meta + extensions + feature-table renderer
# Sourced by pi-epic-status dispatcher; do not execute directly.

# v0.6.2 / L-038: surface test_cmd bypass loudly.
render_test_cmd_warning() {
    local epic_dir="$1"
    local test_cmd
    test_cmd=$(yaml_get "$epic_dir/epic-config.yaml" test_cmd 2>/dev/null || echo "")
    if [[ -n "$test_cmd" ]]; then
        if [[ "$test_cmd" =~ ^echo[[:space:]] ]] || [[ "$test_cmd" == *SKIP* ]] || [[ "$test_cmd" == *skip* ]]; then
            if [[ -t 1 ]]; then
                printf '\033[31m⚠  WARNING: test_cmd is a bypass: %s\033[0m\n' "$test_cmd"
                printf '\033[31m   Per-feature test gate is DISABLED. Regressions only caught at epic-review.\033[0m\n'
            else
                echo "WARNING: test_cmd is a bypass: $test_cmd"
                echo "   Per-feature test gate is DISABLED. Regressions only caught at epic-review."
            fi
            echo "   Set a real test command in $epic_dir/epic-config.yaml, or run"
            echo "   \`pi-epic-init --accept-no-tests\` on creation to acknowledge."
            echo
        fi
    fi
}

# v0.6.2 / L-036: show the installed pi-epicflow version + age.
render_version_info() {
    local _pe_ver _pe_age
    _pe_ver=$(pi_epicflow_version 2>/dev/null || echo "?")
    _pe_age=$(pi_epicflow_age_days 2>/dev/null || echo "?")
    if [[ "$_pe_ver" != "?" ]]; then
        echo "pi-epicflow: $_pe_ver (clone age: ${_pe_age}d)"
        if [[ "$_pe_age" =~ ^[0-9]+$ ]] && (( _pe_age > 7 )); then
            echo "  ⚠  >7 days old. Consider \`pi update pi-epicflow\` before continuing."
        fi
        echo
    fi
}

render_meta() {
    local epic_dir="$1"

    echo "── meta ──"
    cat "$epic_dir/meta.yaml" | grep -vE '^\s*#'
    echo

    # v0.6.3 / L-042 — extensions summary.
    if grep -qE '^extensions:' "$epic_dir/meta.yaml"; then
        local ext_count
        ext_count=$(awk '
            /^extensions:/ { in_ext=1; next }
            in_ext && /^[a-zA-Z]/ { in_ext=0 }
            in_ext && /^  - / { n++ }
            END { print n+0 }
        ' "$epic_dir/meta.yaml")
        if [[ "$ext_count" -gt 0 ]]; then
            local orig_feats total_feats added pct
            orig_feats=$(grep -E '^original_feature_count:' "$epic_dir/meta.yaml" | head -1 | sed -E 's/.*:\s*//' | tr -d '"' || echo "")
            total_feats=$(grep -cE "^  - id:" "$epic_dir/decomposition.yaml" || echo 0)
            if [[ -n "$orig_feats" ]] && [[ "$orig_feats" =~ ^[0-9]+$ ]] && (( orig_feats > 0 )); then
                added=$(( total_feats - orig_feats ))
                (( added < 0 )) && added=0
                pct=$(( added * 100 / orig_feats ))
                printf '── extensions ──\n'
                printf 'count: %s\n' "$ext_count"
                printf 'feature growth: %s → %s (+%s%%; %s added)\n' "$orig_feats" "$total_feats" "$pct" "$added"
                if (( pct >= 30 )); then
                    printf '\033[33m⚠  growth ≥ 30%%: record a "Decomposition lesson: ..." in deviations.md before pi-epic-complete (L-042).\033[0m\n'
                fi
                echo
            else
                printf '── extensions ──\ncount: %s (set original_feature_count in meta.yaml to enable growth tracking)\n\n' "$ext_count"
            fi
        fi
    fi
}

render_features() {
    local epic_dir="$1"

    echo "── features ──"
    python3 - "$epic_dir/decomposition.yaml" "$epic_dir/features" "$epic_dir" <<'PY'
import sys, os, re, json
from datetime import datetime, timezone

decomp_path, feats_dir, epic_dir = sys.argv[1], sys.argv[2], sys.argv[3]
done_dir = os.path.join(feats_dir, 'done')

def parse(p):
    out=[]; cur=None; cur_list=None
    with open(p, encoding='utf-8') as f:
        for raw in f:
            s=raw.rstrip('\n').strip()
            if not s or s.startswith('#'): continue
            if s.startswith('- ') and 'id:' in s:
                cur={}
                m=re.match(r'^id\s*:\s*(.*)$', s[2:])
                if m: cur['id']=m.group(1).strip().strip('"').strip("'")
                out.append(cur); cur_list=None; continue
            if cur is None: continue
            if s.startswith('- '):
                if cur_list is not None: cur_list.append(s[2:].strip().strip('"').strip("'"))
                continue
            m=re.match(r'^([A-Za-z0-9_]+)\s*:\s*(.*)$', s)
            if not m: continue
            k=m.group(1); v=re.sub(r'\s+#.*$','',m.group(2).strip()).strip()
            if v=='': cur[k]=[]; cur_list=cur[k]
            elif v.startswith('[') and v.endswith(']'):
                inner=v[1:-1].strip()
                cur[k]=[x.strip().strip('"').strip("'") for x in inner.split(',')] if inner else []
                cur_list=None
            else: cur[k]=v.strip('"').strip("'"); cur_list=None
    return out

def state_of(fid):
    for d in (feats_dir, done_dir):
        if not os.path.isdir(d): continue
        for sub in os.listdir(d):
            if sub.startswith(fid):
                meta=os.path.join(d, sub, 'meta.yaml')
                if os.path.isfile(meta):
                    with open(meta) as f:
                        for line in f:
                            m=re.match(r'^state\s*:\s*(\S+)', line.strip())
                            if m: return m.group(1).strip().strip('"').strip("'")
    return 'pending'

def parse_runlog(epic_dir):
    """Parse run-log.jsonl and return per-feature start/complete timestamps."""
    starts = {}  # fid -> ISO timestamp string
    completes = {}  # fid -> ISO timestamp string
    runlog = os.path.join(epic_dir, 'run-log.jsonl')
    if not os.path.isfile(runlog):
        return starts, completes
    with open(runlog, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except (json.JSONDecodeError, ValueError):
                continue
            event = ev.get('event', '')
            feature = ev.get('feature', '')
            ts = ev.get('ts') or ev.get('timestamp', '')
            if not feature or not ts:
                continue
            # Extract bare feature id (e.g. "F01" from "F01-modularize-...")
            fid = feature.split('-')[0] if '-' in feature else feature
            if event == 'feature-start':
                starts[fid] = ts
            elif event == 'feature-complete':
                completes[fid] = ts
    return starts, completes

def parse_iso(ts_str):
    """Parse ISO 8601 timestamp to datetime (UTC)."""
    ts_str = ts_str.rstrip('Z') + '+00:00' if ts_str.endswith('Z') else ts_str
    try:
        return datetime.fromisoformat(ts_str)
    except (ValueError, TypeError):
        return None

def format_duration(secs):
    """Format duration: <60s as Xs, 60-3599 as MM:SS, >=3600 as H:MM:SS."""
    secs = int(secs)
    if secs < 60:
        return f"{secs}s"
    elif secs < 3600:
        return f"{secs // 60:02d}:{secs % 60:02d}"
    else:
        h = secs // 3600
        remainder = secs % 3600
        return f"{h}:{remainder // 60:02d}:{remainder % 60:02d}"

ICON = {'pending':'⏳','in-progress':'⚙️ ','tests-passing':'✅','merged':'✓ ','halted':'⛔','halted-ambiguous':'❔'}
features = parse(decomp_path)
starts, completes = parse_runlog(epic_dir)
now = datetime.now(timezone.utc)

for ft in features:
    fid = ft.get('id','?')
    st = state_of(fid)
    deps = ','.join(ft.get('depends_on') or []) or '-'
    hrs = ft.get('estimated_hours','?')

    # Timing columns
    started_str = '-'
    duration_str = '-'
    if fid in starts:
        start_dt = parse_iso(starts[fid])
        if start_dt:
            started_str = start_dt.strftime('%H:%M:%S')
            if fid in completes:
                end_dt = parse_iso(completes[fid])
                if end_dt:
                    dur = int((end_dt - start_dt).total_seconds())
                    if dur >= 0:
                        duration_str = format_duration(dur)
            else:
                # In-progress: elapsed since start
                dur = int((now - start_dt).total_seconds())
                if dur >= 0:
                    duration_str = format_duration(dur)

    print(f"  {ICON.get(st,'? ')} {fid}  [{st:14}]  deps:{deps:10}  ~{hrs}h  started:{started_str:>8}  duration:{duration_str:>8}  {ft.get('summary','')}")
PY
    echo
}
