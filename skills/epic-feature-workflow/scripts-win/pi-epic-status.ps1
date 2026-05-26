# pi-epic-status.ps1 — PowerShell mirror of scripts/pi-epic-status
# (which is a thin dispatcher over scripts/lib/pi-epic-status-*.sh, BL-007).
#
# Usage: pi-epic-status [--ready [--quiet]] [--json]
#
# Read-only status report for the active epic:
#   * Default mode (full):
#     Epic meta + extensions + halts + batches + features table + recent run-log.
#   * --ready: list dispatchable features (own state pending|halted-ambiguous
#       AND every dep merged).
#   * --ready --quiet: scripting-friendly one-id-per-line.
#   * --json: machine-readable status object (schema_version: 1).

$ErrorActionPreference = 'Stop'

# Force UTF-8 output for emoji + box-drawing chars (Windows console defaults to cp1252).
try {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
} catch { }
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Resolve script dir and source _common.ps1
$__ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $__ScriptDir '_common.ps1')

# ---------- arg parsing ----------
$mode = 'full'
$quiet = $false
$i = 0
while ($i -lt $args.Count) {
    switch ($args[$i]) {
        '--ready'   { $mode = 'ready' }
        '--json'    { $mode = 'json'  }
        '--quiet'   { $quiet = $true  }
        '-q'        { $quiet = $true  }
        '-h'        { Get-Help -Detailed $MyInvocation.MyCommand.Path; exit 0 }
        '--help'    { Get-Help -Detailed $MyInvocation.MyCommand.Path; exit 0 }
        default     {
            Write-Stderr "unknown flag: $($args[$i])"
            exit 1
        }
    }
    $i++
}

# ---------- resolve epic context ----------
try {
    $epic_dir = Get-ActiveEpicDir
} catch {
    if ($mode -eq 'json') {
        Write-Stderr '{"error": "not in an epic working tree"}'
        exit 2
    }
    # Re-run without try/catch to surface the original error
    $epic_dir = Get-ActiveEpicDir
    exit 1
}
$epic_id = Get-ActiveEpicId

# ============================================================
# Helper: invoke a Python heredoc by writing it to a temp file.
# ============================================================
function Invoke-PythonScript {
    param(
        [Parameter(Mandatory)][string]$Script,
        [Parameter(Mandatory)][string[]]$Args
    )
    $py = Get-PythonExe
    if (-not $py) {
        Write-Stderr "ERROR: python3 not found on PATH; pi-epic-status requires Python."
        exit 1
    }
    $tmp = [System.IO.Path]::GetTempFileName() + '.py'
    try {
        [System.IO.File]::WriteAllText($tmp, $Script, [System.Text.UTF8Encoding]::new($false))
        # PYTHONIOENCODING ensures Python stdout is UTF-8 regardless of host locale
        # (Windows defaults to cp1252 which crashes on emoji / box-drawing chars).
        $prev = $env:PYTHONIOENCODING
        $env:PYTHONIOENCODING = 'utf-8'
        try {
            & $py $tmp @Args
        } finally {
            if ($null -eq $prev) { Remove-Item Env:PYTHONIOENCODING -ErrorAction SilentlyContinue }
            else { $env:PYTHONIOENCODING = $prev }
        }
    } finally {
        Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
    }
}

# ============================================================
# Renderer: ⚠ HALTS section (pure PS port of pi-epic-status-halts.sh).
# ============================================================
function Get-HaltDescription {
    param([string]$Code)
    switch ($Code) {
        'H1'  { 'build/tests broken before feature work started' }
        'H2'  { 'scope_files insufficient (worker discipline)' }
        'H3'  { 'design.md ambiguous' }
        'H4'  { 'external dependency unavailable' }
        'H5'  { 'reviewer raised an architecture concern' }
        'H6'  { 'out-of-scope worker drift' }
        'H7'  { 'AC not satisfiable as written' }
        'H8'  { 'review blocked the merge' }
        'H9'  { 'parallel-merge conflict' }
        'H10' { 'halt-during-parallel-batch' }
        default { 'unknown halt code' }
    }
}

function Show-Halts {
    param([string]$EpicDir)
    $features_dir = Join-Path $EpicDir 'features'
    if (-not (Test-Path -LiteralPath $features_dir -PathType Container)) { return }

    $rows = @()
    foreach ($fdir in Get-ChildItem -LiteralPath $features_dir -Directory) {
        $feature_id = $fdir.Name
        $fid = ($feature_id -split '-')[0]
        foreach ($hfile in Get-ChildItem -LiteralPath $fdir.FullName -File -Filter 'halt-*.md' -ErrorAction SilentlyContinue) {
            $base = $hfile.Name
            $resolved = Join-Path $fdir.FullName ("resolved-" + $base)
            if (Test-Path -LiteralPath $resolved) { continue }

            # halt-h6-out-of-scope.md → code_lower=h6, rest=out-of-scope
            $stem = $base -replace '\.md$',''
            $after_halt = $stem -replace '^halt-',''
            $parts = $after_halt -split '-', 2
            $code_lower = $parts[0]
            $rest = if ($parts.Count -gt 1) { $parts[1] } else { '' }
            $halt_code = $code_lower.ToUpper()

            $desc = Get-HaltDescription $halt_code
            $code_num = $code_lower -replace '^h',''
            $anchor = if ($rest) { "docs/recovery.md#r${code_num}-${rest}" } else { "docs/recovery.md#r${code_num}" }

            $rows += [PSCustomObject]@{
                FeatureId = $fid
                HaltCode  = $halt_code
                Desc      = $desc
                File      = $hfile.FullName
                Anchor    = $anchor
            }
        }
    }

    if ($rows.Count -eq 0) { return }

    Write-Output "!! HALTS"
    Write-Output ""
    foreach ($r in $rows) {
        $line = ('  {0,-6}  {1,-4}  {2,-50}' -f $r.FeatureId, $r.HaltCode, $r.Desc)
        Write-Output $line
        Write-Output ("         file: {0}" -f $r.File)
        Write-Output ("         recovery: {0}" -f $r.Anchor)
        Write-Output ""
    }
}

# ============================================================
# Renderer: test_cmd bypass warning + version info + meta + extensions.
# (Pure PS port of pi-epic-status-features.sh prelude.)
# ============================================================
function Show-TestCmdWarning {
    param([string]$EpicDir)
    $test_cmd = Get-YamlValue (Join-Path $EpicDir 'epic-config.yaml') 'test_cmd'
    if (-not $test_cmd) { return }
    $isBypass = ($test_cmd -match '^echo\s') -or ($test_cmd -match 'SKIP') -or ($test_cmd -match 'skip')
    if (-not $isBypass) { return }

    if ([Console]::IsOutputRedirected) {
        Write-Output "WARNING: test_cmd is a bypass: $test_cmd"
        Write-Output "   Per-feature test gate is DISABLED. Regressions only caught at epic-review."
    } else {
        Write-Output "`e[31m⚠  WARNING: test_cmd is a bypass: $test_cmd`e[0m"
        Write-Output "`e[31m   Per-feature test gate is DISABLED. Regressions only caught at epic-review.`e[0m"
    }
    Write-Output "   Set a real test command in $EpicDir/epic-config.yaml, or run"
    Write-Output "   ``pi-epic-init --accept-no-tests`` on creation to acknowledge."
    Write-Output ""
}

function Show-VersionInfo {
    $ver = try { Get-PiEpicflowVersion } catch { '?' }
    $age = try { Get-PiEpicflowAgeDays } catch { '?' }
    if ($ver -and $ver -ne '?') {
        Write-Output "pi-epicflow: $ver (clone age: ${age}d)"
        if ($age -match '^\d+$' -and [int]$age -gt 7) {
            Write-Output "  ⚠  >7 days old. Consider ``pi update pi-epicflow`` before continuing."
        }
        Write-Output ""
    }
}

function Show-Meta {
    param([string]$EpicDir)
    Write-Output "--- meta ---"
    $meta_file = Join-Path $EpicDir 'meta.yaml'
    if (Test-Path -LiteralPath $meta_file) {
        Get-Content -LiteralPath $meta_file | Where-Object { $_ -notmatch '^\s*#' }
    }
    Write-Output ""

    # Extensions summary (L-042)
    $meta_text = if (Test-Path -LiteralPath $meta_file) { Get-Content -LiteralPath $meta_file -Raw } else { '' }
    if ($meta_text -notmatch '(?m)^extensions:') { return }

    # Count entries under `extensions:` (lines starting with `  - ` until next top-level key).
    $ext_count = 0
    $in_ext = $false
    foreach ($line in (Get-Content -LiteralPath $meta_file)) {
        if ($line -match '^extensions:') { $in_ext = $true; continue }
        if ($in_ext -and $line -match '^[a-zA-Z]') { $in_ext = $false }
        if ($in_ext -and $line -match '^  - ') { $ext_count++ }
    }
    if ($ext_count -le 0) { return }

    $orig_feats = ''
    foreach ($line in (Get-Content -LiteralPath $meta_file)) {
        if ($line -match '^original_feature_count:\s*"?(\d+)"?\s*$') { $orig_feats = $Matches[1]; break }
    }
    $decomp_path = Join-Path $EpicDir 'decomposition.yaml'
    $total_feats = 0
    if (Test-Path -LiteralPath $decomp_path) {
        $total_feats = (Get-Content -LiteralPath $decomp_path | Where-Object { $_ -match '^  - id:' }).Count
    }

    if ($orig_feats -and $orig_feats -match '^\d+$' -and [int]$orig_feats -gt 0) {
        $added = [int]$total_feats - [int]$orig_feats
        if ($added -lt 0) { $added = 0 }
        $pct = [int]([Math]::Floor(($added * 100) / [int]$orig_feats))
        Write-Output "--- extensions ---"
        Write-Output "count: $ext_count"
        Write-Output "feature growth: $orig_feats -> $total_feats (+${pct}%; $added added)"
        if ($pct -ge 30) {
            if ([Console]::IsOutputRedirected) {
                Write-Output "⚠  growth ≥ 30%: record a `"Decomposition lesson: ...`" in deviations.md before pi-epic-complete (L-042)."
            } else {
                Write-Output "`e[33m⚠  growth ≥ 30%: record a `"Decomposition lesson: ...`" in deviations.md before pi-epic-complete (L-042).`e[0m"
            }
        }
        Write-Output ""
    } else {
        Write-Output "--- extensions ---"
        Write-Output "count: $ext_count (set original_feature_count in meta.yaml to enable growth tracking)"
        Write-Output ""
    }
}

# ============================================================
# Renderer: feature table (Python heredoc — same logic as bash).
# ============================================================
$Script:_PyDecompParse = @'
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
    starts = {}
    completes = {}
    runlog = os.path.join(epic_dir, 'run-log.jsonl')
    if not os.path.isfile(runlog):
        return starts, completes
    with open(runlog, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try: ev = json.loads(line)
            except (json.JSONDecodeError, ValueError): continue
            event = ev.get('event', '')
            feature = ev.get('feature', '')
            ts = ev.get('ts') or ev.get('timestamp', '')
            if not feature or not ts: continue
            fid = feature.split('-')[0] if '-' in feature else feature
            if event == 'feature-start': starts[fid] = ts
            elif event == 'feature-complete': completes[fid] = ts
    return starts, completes

def parse_iso(ts_str):
    ts_str = ts_str.rstrip('Z') + '+00:00' if ts_str.endswith('Z') else ts_str
    try: return datetime.fromisoformat(ts_str)
    except (ValueError, TypeError): return None

def format_duration(secs):
    secs = int(secs)
    if secs < 60: return f"{secs}s"
    elif secs < 3600: return f"{secs // 60:02d}:{secs % 60:02d}"
    else:
        h = secs // 3600
        r = secs % 3600
        return f"{h}:{r // 60:02d}:{r % 60:02d}"

ICON = {'pending':'⏳','in-progress':'⚙️ ','tests-passing':'✅','merged':'✓ ','halted':'⛔','halted-ambiguous':'❔'}
features = parse(decomp_path)
starts, completes = parse_runlog(epic_dir)
now = datetime.now(timezone.utc)

for ft in features:
    fid = ft.get('id','?')
    st = state_of(fid)
    deps = ','.join(ft.get('depends_on') or []) or '-'
    hrs = ft.get('estimated_hours','?')

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
                    if dur >= 0: duration_str = format_duration(dur)
            else:
                dur = int((now - start_dt).total_seconds())
                if dur >= 0: duration_str = format_duration(dur)

    print(f"  {ICON.get(st,'? ')} {fid}  [{st:14}]  deps:{deps:10}  ~{hrs}h  started:{started_str:>8}  duration:{duration_str:>8}  {ft.get('summary','')}")
'@

function Show-Features {
    param([string]$EpicDir)
    Write-Output "--- features ---"
    Invoke-PythonScript -Script $Script:_PyDecompParse -Args @(
        (Join-Path $EpicDir 'decomposition.yaml'),
        (Join-Path $EpicDir 'features'),
        $EpicDir
    )
    Write-Output ""
}

# ============================================================
# Renderer: recent run-log (pure PS — Get-Content tail).
# ============================================================
function Show-Runlog {
    param([string]$EpicDir)
    Write-Output "--- recent run-log ---"
    $rl = Join-Path $EpicDir 'run-log.jsonl'
    if (Test-Path -LiteralPath $rl) {
        Get-Content -LiteralPath $rl -Tail 10
    } else {
        Write-Output "  (empty)"
    }
    Write-Output ""
}

# ============================================================
# Renderer: parallel batches (Python heredoc).
# ============================================================
$Script:_PyBatches = @'
import sys, json
from datetime import datetime, timezone

runlog_path, max_workers = sys.argv[1], int(sys.argv[2])

events = []
with open(runlog_path, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line: continue
        try: ev = json.loads(line)
        except (json.JSONDecodeError, ValueError): continue
        events.append(ev)

def parse_iso(ts_str):
    ts_str = ts_str.rstrip('Z') + '+00:00' if ts_str.endswith('Z') else ts_str
    try: return datetime.fromisoformat(ts_str)
    except (ValueError, TypeError): return None

def fid_of(feature_str):
    return feature_str.split('-')[0] if '-' in feature_str else feature_str

starts = []
completes = {}

for ev in events:
    event = ev.get('event', '')
    feature = ev.get('feature', '')
    ts = ev.get('ts') or ev.get('timestamp', '')
    if not feature or not ts: continue
    fid = fid_of(feature)
    dt = parse_iso(ts)
    if dt is None: continue
    if event == 'feature-start': starts.append((dt, fid, ts))
    elif event == 'feature-complete': completes[fid] = (dt, ts)

if len(starts) < 2: sys.exit(0)

starts.sort(key=lambda x: x[0])

all_events = []
for ev in events:
    event = ev.get('event', '')
    ts = ev.get('ts') or ev.get('timestamp', '')
    if not ts: continue
    dt = parse_iso(ts)
    if dt is None: continue
    all_events.append((dt, event, ev.get('feature', '')))
all_events.sort(key=lambda x: x[0])

def has_complete_between(ts1, ts2):
    for dt, event, _ in all_events:
        if dt <= ts1: continue
        if dt >= ts2: break
        if event == 'feature-complete': return True
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
        if len(current_group) >= 2: groups.append(current_group)
        current_group = [starts[i]]
if len(current_group) >= 2: groups.append(current_group)
if not groups: sys.exit(0)

def format_duration(secs):
    secs = int(secs)
    if secs < 60: return f"{secs}s"
    elif secs < 3600: return f"{secs // 60:02d}:{secs % 60:02d}"
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
        if wall_clock > 0: speedup = serial_sum / wall_clock

    print(f"Batch {batch_id} (size={batch_size}, max_workers={theoretical_max})")
    for dt, fid, ts in group:
        offset = int((dt - batch_start_dt).total_seconds())
        print(f"  {fid}  (start +{offset}s)")

    if wall_clock is not None and speedup is not None:
        print(f"  wall_clock: {format_duration(wall_clock)}   serial_sum: {format_duration(serial_sum)}   speedup: {speedup:.2f}x / {theoretical_max:.2f}x theoretical")
    else:
        print("  (batch still in progress)")
    print()
'@

function Show-Batches {
    param([string]$EpicDir)
    $cfg = Join-Path $EpicDir 'epic-config.yaml'
    $max_workers = Get-YamlValue $cfg 'parallel.max_workers'
    if (-not $max_workers) { $max_workers = '1' }
    if ([int]$max_workers -le 1) { return }

    $runlog = Join-Path $EpicDir 'run-log.jsonl'
    if (-not (Test-Path -LiteralPath $runlog)) { return }

    Invoke-PythonScript -Script $Script:_PyBatches -Args @($runlog, $max_workers)
}

# ============================================================
# --ready mode (Python heredoc).
# ============================================================
$Script:_PyReady = @'
import sys, os, re
decomp_path, feats_dir, quiet_arg = sys.argv[1], sys.argv[2], sys.argv[3]
quiet = quiet_arg == "1"
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
    if os.path.isdir(done_dir):
        for sub in os.listdir(done_dir):
            if sub.startswith(fid): return 'merged'
    if os.path.isdir(feats_dir):
        for sub in os.listdir(feats_dir):
            if sub == 'done': continue
            if sub.startswith(fid):
                meta=os.path.join(feats_dir, sub, 'meta.yaml')
                if os.path.isfile(meta):
                    with open(meta) as f:
                        for line in f:
                            m=re.match(r'^state\s*:\s*(\S+)', line.strip())
                            if m: return m.group(1).strip().strip('"').strip("'")
    return 'pending'

features = parse(decomp_path)
state_map = {ft['id']: state_of(ft['id']) for ft in features if 'id' in ft}

DEP_OK = {'merged'}
DISPATCHABLE = {'pending', 'halted-ambiguous'}

ready = []
for ft in features:
    fid = ft.get('id')
    if not fid: continue
    st = state_map.get(fid, 'pending')
    if st not in DISPATCHABLE: continue
    deps = ft.get('depends_on') or []
    if all(state_map.get(d, 'pending') in DEP_OK for d in deps):
        ready.append(ft)

if quiet:
    for ft in ready: print(ft['id'])
else:
    if not ready:
        print("No features are currently ready to dispatch.")
        pending = [ft for ft in features if state_map.get(ft['id'],'pending') in DISPATCHABLE]
        if pending:
            blockers = {}
            for ft in pending:
                for d in (ft.get('depends_on') or []):
                    if state_map.get(d,'pending') not in DEP_OK:
                        blockers[d] = blockers.get(d,0) + 1
            if blockers:
                top = sorted(blockers.items(), key=lambda x:-x[1])[:3]
                print("Bottleneck deps (blocking the most pending features):")
                for d, n in top:
                    print(f"  {d}  [{state_map.get(d,'pending')}]  blocks {n} feature(s)")
    else:
        print(f"Ready to dispatch ({len(ready)} feature(s)):")
        print()
        print("  Pick any ONE id per pi session. Worktrees are already")
        print("  isolated; the merge order is decided at squash-merge time.")
        print("  If two ready features touch overlapping files, dispatch")
        print("  them serially — the dispatcher does not yet resolve")
        print("  cross-feature merge conflicts (see docs/sketch-parallel.md).")
        print()
        for ft in ready:
            fid = ft['id']
            st = state_map.get(fid,'pending')
            deps = ','.join(ft.get('depends_on') or []) or '-'
            hrs = ft.get('estimated_hours','?')
            tag = '' if st == 'pending' else f' (resuming from {st})'
            print(f"  {fid}  deps:{deps:10}  ~{hrs}h  {ft.get('summary','')}{tag}")
'@

function Show-Ready {
    param([string]$EpicDir, [bool]$Quiet)
    $q = if ($Quiet) { '1' } else { '0' }
    Invoke-PythonScript -Script $Script:_PyReady -Args @(
        (Join-Path $EpicDir 'decomposition.yaml'),
        (Join-Path $EpicDir 'features'),
        $q
    )
}

# ============================================================
# --json mode (composed of: epic, features, batches, halts, ready_now, blocked_on_deps).
# ============================================================
function _JsonEscape {
    param([string]$S)
    if ($null -eq $S) { return '' }
    $S = $S -replace '\\', '\\\\'
    $S = $S -replace '"', '\\"'
    $S = $S -replace "`n", '\\n'
    $S = $S -replace "`t", '\\t'
    return $S
}

function Get-EpicJson {
    param([string]$EpicDir)
    $meta = Join-Path $EpicDir 'meta.yaml'
    $id      = Get-YamlValue $meta 'id'
    $title   = Get-YamlValue $meta 'title'
    $slug    = Get-YamlValue $meta 'slug'
    $branch  = Get-YamlValue $meta 'branch'
    $status  = Get-YamlValue $meta 'status'
    $started = Get-YamlValue $meta 'started'
    $updated = Get-YamlValue $meta 'updated'
    if (-not $slug) { $slug = $id -replace '^\d{4}-','' }
    # Use Python json.dumps for byte-parity with the bash printf format
    # (which emits Python-style `", "` and `": "` separators).
    $epicScript = @'
import sys, json
print(json.dumps({
    "id":      sys.argv[1],
    "title":   sys.argv[2],
    "slug":    sys.argv[3],
    "branch":  sys.argv[4],
    "status":  sys.argv[5],
    "started": sys.argv[6],
    "updated": sys.argv[7],
}))
'@
    $out = Invoke-PythonScript -Script $epicScript -Args @($id, $title, $slug, $branch, $status, $started, $updated)
    return (($out -join '').Trim())
}

$Script:_PyFeaturesJson = @'
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
    starts = {}
    completes = {}
    runlog = os.path.join(epic_dir, 'run-log.jsonl')
    if not os.path.isfile(runlog): return starts, completes
    with open(runlog, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try: ev = json.loads(line)
            except (json.JSONDecodeError, ValueError): continue
            event = ev.get('event', '')
            feature = ev.get('feature', '')
            ts = ev.get('ts') or ev.get('timestamp', '')
            if not feature or not ts: continue
            fid = feature.split('-')[0] if '-' in feature else feature
            if event == 'feature-start': starts[fid] = ts
            elif event == 'feature-complete': completes[fid] = ts
    return starts, completes

def parse_iso(ts_str):
    ts_str = ts_str.rstrip('Z') + '+00:00' if ts_str.endswith('Z') else ts_str
    try: return datetime.fromisoformat(ts_str)
    except (ValueError, TypeError): return None

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
    started_at = None
    duration_sec = None
    if fid in starts:
        started_at = starts[fid]
        start_dt = parse_iso(starts[fid])
        if start_dt:
            if fid in completes:
                end_dt = parse_iso(completes[fid])
                if end_dt: duration_sec = int((end_dt - start_dt).total_seconds())
            else:
                duration_sec = int((now - start_dt).total_seconds())
    entry = {
        "id": fid, "slug": slug, "status": status, "branch": branch,
        "merge_sha": meta.get('merge_sha') or None,
        "started_at": started_at,
        "completed_at": completes.get(fid) if fid in completes else None,
        "duration_sec": duration_sec,
        "halts": []
    }
    result.append(entry)

print(json.dumps(result))
'@

$Script:_PyBatchesJson = @'
import sys, json
from datetime import datetime, timezone

runlog_path, max_workers = sys.argv[1], int(sys.argv[2])
events = []
with open(runlog_path, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line: continue
        try: ev = json.loads(line)
        except (json.JSONDecodeError, ValueError): continue
        events.append(ev)

def parse_iso(ts_str):
    ts_str = ts_str.rstrip('Z') + '+00:00' if ts_str.endswith('Z') else ts_str
    try: return datetime.fromisoformat(ts_str)
    except (ValueError, TypeError): return None

def fid_of(feature_str):
    return feature_str.split('-')[0] if '-' in feature_str else feature_str

starts = []
completes = {}
for ev in events:
    event = ev.get('event', '')
    feature = ev.get('feature', '')
    ts = ev.get('ts') or ev.get('timestamp', '')
    if not feature or not ts: continue
    fid = fid_of(feature)
    dt = parse_iso(ts)
    if dt is None: continue
    if event == 'feature-start': starts.append((dt, fid, ts))
    elif event == 'feature-complete': completes[fid] = (dt, ts)

if len(starts) < 2:
    print('[]'); sys.exit(0)

starts.sort(key=lambda x: x[0])
all_events = []
for ev in events:
    event = ev.get('event', '')
    ts = ev.get('ts') or ev.get('timestamp', '')
    if not ts: continue
    dt = parse_iso(ts)
    if dt is None: continue
    all_events.append((dt, event, ev.get('feature', '')))
all_events.sort(key=lambda x: x[0])

def has_complete_between(ts1, ts2):
    for dt, event, _ in all_events:
        if dt <= ts1: continue
        if dt >= ts2: break
        if event == 'feature-complete': return True
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
        if len(current_group) >= 2: groups.append(current_group)
        current_group = [starts[i]]
if len(current_group) >= 2: groups.append(current_group)

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
'@

$Script:_PyHaltsJson = @'
import sys, os, json
features_dir = sys.argv[1]
result = []
for fdir_name in sorted(os.listdir(features_dir)):
    fdir = os.path.join(features_dir, fdir_name)
    if not os.path.isdir(fdir): continue
    fid = fdir_name.split('-')[0] if '-' in fdir_name else fdir_name
    for fname in sorted(os.listdir(fdir)):
        if not fname.startswith('halt-') or not fname.endswith('.md'): continue
        resolved = 'resolved-' + fname
        if os.path.exists(os.path.join(fdir, resolved)): continue
        stem = fname[:-3]
        after_halt = stem[5:]
        parts = after_halt.split('-', 1)
        code_lower = parts[0]
        rest = parts[1] if len(parts) > 1 else ''
        halt_code = code_lower.upper()
        code_num = code_lower[1:]
        if rest:
            recovery_anchor = f'docs/recovery.md#r{code_num}-{rest}'
        else:
            recovery_anchor = f'docs/recovery.md#r{code_num}'
        halt_file = os.path.join(fdir, fname)
        result.append({
            'feature_id': fid,
            'halt_code': halt_code,
            'halt_file': halt_file,
            'recovery_anchor': recovery_anchor
        })
print(json.dumps(result))
'@

function Emit-Json {
    param([string]$EpicDir, [string]$EpicId)
    $epic_obj = Get-EpicJson $EpicDir
    $features_arr = Invoke-PythonScript -Script $Script:_PyFeaturesJson -Args @(
        (Join-Path $EpicDir 'decomposition.yaml'),
        (Join-Path $EpicDir 'features'),
        $EpicDir
    )
    $features_arr = ($features_arr -join '').Trim()

    # Batches
    $max_workers = Get-YamlValue (Join-Path $EpicDir 'epic-config.yaml') 'parallel.max_workers'
    if (-not $max_workers) { $max_workers = '1' }
    $runlog = Join-Path $EpicDir 'run-log.jsonl'
    if ([int]$max_workers -le 1 -or -not (Test-Path -LiteralPath $runlog)) {
        $batches_arr = '[]'
    } else {
        $batches_arr = Invoke-PythonScript -Script $Script:_PyBatchesJson -Args @($runlog, $max_workers)
        $batches_arr = ($batches_arr -join '').Trim()
        if (-not $batches_arr) { $batches_arr = '[]' }
    }

    # Halts
    $features_dir = Join-Path $EpicDir 'features'
    if (-not (Test-Path -LiteralPath $features_dir)) {
        $halts_arr = '[]'
    } else {
        $halts_arr = Invoke-PythonScript -Script $Script:_PyHaltsJson -Args @($features_dir)
        $halts_arr = ($halts_arr -join '').Trim()
        if (-not $halts_arr) { $halts_arr = '[]' }
    }

    # ready_now / blocked_on_deps stubs (empty arrays — match bash behavior)
    $ready_arr = '[]'
    $blocked_arr = '[]'

    $line = '{"schema_version": 1, "epic": ' + $epic_obj + ', "features": ' + $features_arr + ', "batches": ' + $batches_arr + ', "halts": ' + $halts_arr + ', "ready_now": ' + $ready_arr + ', "blocked_on_deps": ' + $blocked_arr + '}'
    Write-Output $line
}

# ============================================================
# Dispatch
# ============================================================
switch ($mode) {
    'ready' {
        Show-Ready -EpicDir $epic_dir -Quiet $quiet
        exit 0
    }
    'json' {
        Emit-Json -EpicDir $epic_dir -EpicId $epic_id
    }
    'full' {
        Write-Output "Epic: $epic_id"
        Write-Output "Folder: $epic_dir"
        Write-Output ""
        Show-TestCmdWarning -EpicDir $epic_dir
        Show-VersionInfo
        Show-Meta -EpicDir $epic_dir
        Show-Halts -EpicDir $epic_dir
        Show-Batches -EpicDir $epic_dir
        Show-Features -EpicDir $epic_dir
        Show-Runlog -EpicDir $epic_dir
    }
}
