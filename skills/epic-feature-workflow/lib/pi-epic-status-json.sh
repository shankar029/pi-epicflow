#!/usr/bin/env bash
# pi-epic-status-json.sh — JSON emitter for pi-epic-status --json
# Sourced by pi-epic-status dispatcher; do not execute directly.

# Escape a string for safe JSON embedding (handles \, ", newlines, tabs)
_json_escape() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

emit_epic_json() {
    local epic_dir="$1"
    local id title slug branch status started updated
    id=$(yaml_get "$epic_dir/meta.yaml" id)
    title=$(yaml_get "$epic_dir/meta.yaml" title)
    slug=$(yaml_get "$epic_dir/meta.yaml" slug 2>/dev/null || echo "")
    branch=$(yaml_get "$epic_dir/meta.yaml" branch)
    status=$(yaml_get "$epic_dir/meta.yaml" status)
    started=$(yaml_get "$epic_dir/meta.yaml" started)
    updated=$(yaml_get "$epic_dir/meta.yaml" updated)
    # Derive slug from id if not in meta
    if [[ -z "$slug" ]]; then
        slug="${id#[0-9][0-9][0-9][0-9]-}"
    fi
    printf '{"id": "%s", "title": "%s", "slug": "%s", "branch": "%s", "status": "%s", "started": "%s", "updated": "%s"}' \
        "$(_json_escape "$id")" \
        "$(_json_escape "$title")" \
        "$(_json_escape "$slug")" \
        "$(_json_escape "$branch")" \
        "$(_json_escape "$status")" \
        "$(_json_escape "$started")" \
        "$(_json_escape "$updated")"
}

emit_features_json() {
    local epic_dir="$1"
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

def meta_of(fid):
    """Read feature meta.yaml, return dict of key-value pairs."""
    for d in (feats_dir, done_dir):
        if not os.path.isdir(d): continue
        for sub in os.listdir(d):
            if sub.startswith(fid):
                meta = os.path.join(d, sub, 'meta.yaml')
                if os.path.isfile(meta):
                    result = {}
                    with open(meta) as f:
                        for line in f:
                            m = re.match(r'^([A-Za-z0-9_]+)\s*:\s*(.+)$', line.strip())
                            if m:
                                result[m.group(1)] = m.group(2).strip().strip('"').strip("'")
                    return result
    return {}

def state_of(fid):
    m = meta_of(fid)
    return m.get('state', 'pending')

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

features = parse(decomp_path)
starts, completes = parse_runlog(epic_dir)
now = datetime.now(timezone.utc)
result = []
for ft in features:
    fid = ft.get('id', '')
    if not fid: continue
    meta = meta_of(fid)
    slug = ft.get('slug', '')
    status = state_of(fid)
    branch = meta.get('branch', '')

    # Compute started_at and duration_sec from run-log
    started_at = None
    duration_sec = None
    if fid in starts:
        started_at = starts[fid]
        start_dt = parse_iso(starts[fid])
        if start_dt:
            if fid in completes:
                end_dt = parse_iso(completes[fid])
                if end_dt:
                    duration_sec = int((end_dt - start_dt).total_seconds())
            else:
                # In-progress: elapsed since start
                duration_sec = int((now - start_dt).total_seconds())

    entry = {
        "id": fid,
        "slug": slug,
        "status": status,
        "branch": branch,
        "merge_sha": meta.get('merge_sha') or None,
        "started_at": started_at,
        "completed_at": completes.get(fid) if fid in completes else None,
        "duration_sec": duration_sec,
        "halts": []
    }
    result.append(entry)

print(json.dumps(result))
PY
}

emit_batches_json() {
    # Stub: F03 fills in batch detection
    printf '[]'
}

emit_halts_json() {
    # Stub: F04 fills in halt scanning
    printf '[]'
}

emit_ready_json() {
    # Stub: emit empty array for ready_now / blocked_on_deps
    printf '[]'
}

emit_json() {
    local epic_dir="$1" epic_id="$2"
    local epic_obj features_arr batches_arr halts_arr ready_arr blocked_arr
    epic_obj=$(emit_epic_json "$epic_dir")
    features_arr=$(emit_features_json "$epic_dir")
    batches_arr=$(emit_batches_json "$epic_dir")
    halts_arr=$(emit_halts_json "$epic_dir")
    ready_arr=$(emit_ready_json "$epic_dir")
    blocked_arr=$(emit_ready_json "$epic_dir")
    printf '{"schema_version": 1, "epic": %s, "features": %s, "batches": %s, "halts": %s, "ready_now": %s, "blocked_on_deps": %s}\n' \
        "$epic_obj" "$features_arr" "$batches_arr" "$halts_arr" "$ready_arr" "$blocked_arr"
}
