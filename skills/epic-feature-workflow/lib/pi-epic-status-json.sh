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
    local epic_dir="$1"
    local max_workers
    max_workers=$(yaml_get "$epic_dir/epic-config.yaml" parallel.max_workers 2>/dev/null || echo "")
    [[ -z "$max_workers" ]] && max_workers=1
    if (( max_workers <= 1 )); then
        printf '[]'
        return 0
    fi

    local runlog="$epic_dir/run-log.jsonl"
    if [[ ! -f "$runlog" ]]; then
        printf '[]'
        return 0
    fi

    python3 - "$runlog" "$max_workers" <<'PY'
import sys, json
from datetime import datetime, timezone

runlog_path, max_workers = sys.argv[1], int(sys.argv[2])

events = []
with open(runlog_path, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            ev = json.loads(line)
        except (json.JSONDecodeError, ValueError):
            continue
        events.append(ev)

def parse_iso(ts_str):
    ts_str = ts_str.rstrip('Z') + '+00:00' if ts_str.endswith('Z') else ts_str
    try:
        return datetime.fromisoformat(ts_str)
    except (ValueError, TypeError):
        return None

def fid_of(feature_str):
    return feature_str.split('-')[0] if '-' in feature_str else feature_str

starts = []
completes = {}

for ev in events:
    event = ev.get('event', '')
    feature = ev.get('feature', '')
    ts = ev.get('ts') or ev.get('timestamp', '')
    if not feature or not ts:
        continue
    fid = fid_of(feature)
    dt = parse_iso(ts)
    if dt is None:
        continue
    if event == 'feature-start':
        starts.append((dt, fid, ts))
    elif event == 'feature-complete':
        completes[fid] = (dt, ts)

if len(starts) < 2:
    print('[]')
    sys.exit(0)

starts.sort(key=lambda x: x[0])

all_events = []
for ev in events:
    event = ev.get('event', '')
    ts = ev.get('ts') or ev.get('timestamp', '')
    if not ts:
        continue
    dt = parse_iso(ts)
    if dt is None:
        continue
    all_events.append((dt, event, ev.get('feature', '')))
all_events.sort(key=lambda x: x[0])

def has_complete_between(ts1, ts2):
    for dt, event, _ in all_events:
        if dt <= ts1:
            continue
        if dt >= ts2:
            break
        if event == 'feature-complete':
            return True
    return False

groups = []
current_group = [starts[0]]

for i in range(1, len(starts)):
    prev_dt = current_group[-1][0]
    curr_dt, curr_fid, curr_ts = starts[i]
    pair_delta = (curr_dt - prev_dt).total_seconds()
    if pair_delta <= 5 and not has_complete_between(prev_dt, curr_dt):
        current_group.append(starts[i])
    else:
        if len(current_group) >= 2:
            groups.append(current_group)
        current_group = [starts[i]]

if len(current_group) >= 2:
    groups.append(current_group)

result = []
for batch_idx, group in enumerate(groups):
    batch_id = batch_idx + 1
    batch_size = len(group)
    theoretical_max = min(max_workers, batch_size)
    batch_start_dt = group[0][0]
    batch_start_ts = group[0][2]

    feature_ids = [g[1] for g in group]
    all_complete = True
    batch_end_dt = None
    batch_end_ts = None
    serial_sum = 0

    for dt, fid, ts in group:
        if fid in completes:
            c_dt, c_ts = completes[fid]
            dur = (c_dt - dt).total_seconds()
            serial_sum += dur
            if batch_end_dt is None or c_dt > batch_end_dt:
                batch_end_dt = c_dt
                batch_end_ts = c_ts
        else:
            all_complete = False

    wall_clock = None
    speedup = None
    ended_at = None
    if all_complete and batch_end_dt:
        wall_clock = int((batch_end_dt - batch_start_dt).total_seconds())
        ended_at = batch_end_ts
        if wall_clock > 0:
            speedup = round(serial_sum / wall_clock, 2)

    entry = {
        "id": batch_id,
        "started_at": batch_start_ts,
        "ended_at": ended_at,
        "wall_clock_sec": wall_clock,
        "serial_sum_sec": int(serial_sum) if all_complete else None,
        "speedup_ratio": speedup,
        "theoretical_max": theoretical_max,
        "feature_ids": feature_ids
    }
    result.append(entry)

print(json.dumps(result))
PY
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
