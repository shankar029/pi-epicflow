#!/usr/bin/env bash
# pi-epic-status-batches.sh — Batch detection + human renderer for parallel batches
# Sourced by pi-epic-status dispatcher; do not execute directly.
#
# F03: batch-visualization. Detects parallel feature batches from run-log.jsonl
# and renders them in the human status output.

render_batches() {
    local epic_dir="$1"
    local max_workers
    max_workers=$(yaml_get "$epic_dir/epic-config.yaml" parallel.max_workers 2>/dev/null || echo "")
    [[ -z "$max_workers" ]] && max_workers=1
    (( max_workers <= 1 )) && return 0

    local runlog="$epic_dir/run-log.jsonl"
    [[ -f "$runlog" ]] || return 0

    python3 - "$runlog" "$max_workers" <<'PY'
import sys, json
from datetime import datetime, timezone

runlog_path, max_workers = sys.argv[1], int(sys.argv[2])

# Parse all events from run-log.jsonl
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
    """Extract bare feature id (F02 from F02-format-helper)."""
    return feature_str.split('-')[0] if '-' in feature_str else feature_str

# Collect feature-start events in order, plus all feature-complete timestamps
starts = []  # [(ts_dt, fid, ts_str)]
completes = {}  # fid -> (ts_dt, ts_str)

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
    sys.exit(0)

# Sort starts by timestamp
starts.sort(key=lambda x: x[0])

# Build ordered list of all events for "no feature-complete between" check
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
    """Check if any feature-complete event occurs strictly between ts1 and ts2."""
    for dt, event, _ in all_events:
        if dt <= ts1:
            continue
        if dt >= ts2:
            break
        if event == 'feature-complete':
            return True
    return False

# Group consecutive feature-starts within 5s window, no intervening complete
groups = []
current_group = [starts[0]]

for i in range(1, len(starts)):
    prev_dt = current_group[-1][0]
    curr_dt, curr_fid, curr_ts = starts[i]
    delta = (curr_dt - current_group[0][0]).total_seconds()
    pair_delta = (curr_dt - prev_dt).total_seconds()

    # Within 5s of group start AND no feature-complete between prev and curr
    if pair_delta <= 5 and not has_complete_between(prev_dt, curr_dt):
        current_group.append(starts[i])
    else:
        if len(current_group) >= 2:
            groups.append(current_group)
        current_group = [starts[i]]

if len(current_group) >= 2:
    groups.append(current_group)

if not groups:
    sys.exit(0)

def format_duration(secs):
    secs = int(secs)
    if secs < 60:
        return f"{secs}s"
    elif secs < 3600:
        return f"{secs // 60:02d}:{secs % 60:02d}"
    else:
        h = secs // 3600
        r = secs % 3600
        return f"{h}:{r // 60:02d}:{r % 60:02d}"

print("── Recent batches ──")
for batch_idx, group in enumerate(groups):
    batch_id = batch_idx + 1
    batch_size = len(group)
    theoretical_max = min(max_workers, batch_size)
    batch_start_dt = group[0][0]

    # Compute metrics
    feature_ids = [g[1] for g in group]
    all_complete = True
    batch_end_dt = None
    serial_sum = 0

    for dt, fid, ts in group:
        if fid in completes:
            c_dt, c_ts = completes[fid]
            dur = (c_dt - dt).total_seconds()
            serial_sum += dur
            if batch_end_dt is None or c_dt > batch_end_dt:
                batch_end_dt = c_dt
        else:
            all_complete = False

    wall_clock = None
    speedup = None
    if all_complete and batch_end_dt:
        wall_clock = (batch_end_dt - batch_start_dt).total_seconds()
        if wall_clock > 0:
            speedup = serial_sum / wall_clock

    print(f"Batch {batch_id} (size={batch_size}, max_workers={theoretical_max})")
    for dt, fid, ts in group:
        offset = int((dt - batch_start_dt).total_seconds())
        print(f"  {fid}  (start +{offset}s)")

    if wall_clock is not None and speedup is not None:
        print(f"  wall_clock: {format_duration(wall_clock)}   serial_sum: {format_duration(serial_sum)}   speedup: {speedup:.2f}x / {theoretical_max:.2f}x theoretical")
    else:
        print("  (batch still in progress)")
    print()
PY
}
