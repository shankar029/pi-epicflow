# pi-epic-next-feature [--batch N]
#
# Prints the next ready feature ID for the active epic, or:
#   DONE                        all features merged
#   HALT:<reason>               something needs human attention
#
# A feature is ready iff state in {pending} and all depends_on are merged.
# Picks the lowest ID among ready features (deterministic).
#
# --batch N : print up to N ready features (one per line). Hard conflict
#             pre-check: two features whose declared scope_files overlap are
#             NEVER returned in the same batch (L-049).
#
# Parity: PowerShell sibling of scripts/pi-epic-next-feature.

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$script:CallerDir = $PSScriptRoot
. "$PSScriptRoot\_common.ps1"

# Manual flag parsing (--batch N).
$BatchN = 1
$i = 0
$argv = $args
while ($i -lt $argv.Count) {
    switch ($argv[$i]) {
        '--batch' {
            if ($i + 1 -ge $argv.Count) {
                [Console]::Error.WriteLine("ERROR: --batch requires a positive integer")
                exit 2
            }
            $val = $argv[$i+1]
            if (-not [int]::TryParse($val, [ref]$BatchN) -or $BatchN -lt 1) {
                [Console]::Error.WriteLine("ERROR: --batch requires a positive integer (got: '$val')")
                exit 2
            }
            $i += 2
        }
        { $_ -in '--help', '-h' } {
            Write-Host @"
Usage: pi-epic-next-feature [--batch N]

  --batch N   Print up to N ready feature IDs (one per line) instead of
              the single next one. Features whose declared scope_files
              overlap with another feature already in the batch are
              skipped — the pre-check ensures parallel dispatch never
              sends two workers at the same shared file (L-049).
"@
            exit 0
        }
        default {
            [Console]::Error.WriteLine("ERROR: unknown flag: $($argv[$i])")
            exit 2
        }
    }
}

$epicDir = Get-ActiveEpicDir
if (-not $epicDir) { exit 1 }
$decomp = Join-Path $epicDir 'decomposition.yaml'
$featsDir = Join-Path $epicDir 'features'
$doneDir  = Join-Path $featsDir 'done'

if (-not (Test-Path -LiteralPath $decomp)) {
    Write-Output 'HALT:no-decomposition'
    exit 0
}

New-Item -ItemType Directory -Path $featsDir -Force | Out-Null
New-Item -ItemType Directory -Path $doneDir  -Force | Out-Null

$py = Get-PythonExe
if (-not $py) {
    [Console]::Error.WriteLine("ERROR: python3 not on PATH")
    exit 1
}

# Inline Python — identical logic to bash sibling. Extract to lib/ in Phase 3.
$script = @'
import sys, os, re

decomp_path, feats_dir, done_dir = sys.argv[1], sys.argv[2], sys.argv[3]
batch_n = int(sys.argv[4])

def parse(p):
    out = {"features": []}
    cur = None; cur_list = None
    with open(p, encoding="utf-8") as f:
        for raw in f:
            line = raw.rstrip("\n")
            if not line.strip() or line.lstrip().startswith("#"): continue
            ind = len(line) - len(line.lstrip(" "))
            s = line.strip()
            if ind == 0 and re.match(r"^features\s*:", s):
                continue
            if s.startswith("- ") and "id:" in s:
                cur = {}
                out["features"].append(cur)
                m = re.match(r"^id\s*:\s*(.*)$", s[2:])
                if m: cur["id"] = m.group(1).strip().strip("\"'")
                cur_list = None
                continue
            if cur is None: continue
            if s.startswith("- "):
                if cur_list is not None:
                    cur_list.append(s[2:].strip().strip("\"'"))
                continue
            m = re.match(r"^([A-Za-z0-9_]+)\s*:\s*(.*)$", s)
            if not m: continue
            k, v = m.group(1), re.sub(r"\s+#.*$", "", m.group(2).strip()).strip()
            if v == "":
                cur[k] = []; cur_list = cur[k]
            elif v.startswith("[") and v.endswith("]"):
                inner = v[1:-1].strip()
                cur[k] = [x.strip().strip("\"'") for x in inner.split(",")] if inner else []
                cur_list = None
            else:
                cur[k] = v.strip("\"'"); cur_list = None
    return out

def state_of(fid):
    for d in (feats_dir, done_dir):
        if not os.path.isdir(d): continue
        for sub in os.listdir(d):
            if sub.startswith(fid):
                meta = os.path.join(d, sub, "meta.yaml")
                if os.path.isfile(meta):
                    with open(meta, encoding="utf-8") as f:
                        for line in f:
                            m = re.match(r"^state\s*:\s*(\S+)", line.strip())
                            if m: return m.group(1).strip().strip("\"'")
    return "pending"

data = parse(decomp_path)
features = data.get("features", [])
if not features:
    print("HALT:no-features-in-decomposition"); sys.exit(0)

states = {ft["id"]: state_of(ft["id"]) for ft in features}

halted = [fid for fid, st in states.items() if st == "halted"]
if halted:
    print(f"HALT:feature-halted:{halted[0]}"); sys.exit(0)

if all(st == "merged" for st in states.values()):
    print("DONE"); sys.exit(0)

in_progress = [fid for fid, st in states.items() if st == "in-progress"]
if in_progress:
    print(sorted(in_progress)[0]); sys.exit(0)

def is_ready(ft):
    if states[ft["id"]] != "pending": return False
    for d in ft.get("depends_on") or []:
        if states.get(d) != "merged": return False
    return True

ready = sorted([ft["id"] for ft in features if is_ready(ft)])
if not ready:
    print("HALT:no-ready-feature-and-none-in-progress"); sys.exit(0)

if batch_n == 1:
    print(ready[0]); sys.exit(0)

scope = {}
for ft in features:
    sf = ft.get("scope_files") or []
    scope[ft["id"]] = set(s for s in sf if s)

admitted = []
for fid in ready:
    if len(admitted) >= batch_n: break
    overlap = any(scope[fid] & scope[a] for a in admitted)
    if not overlap: admitted.append(fid)

for fid in admitted: print(fid)
'@

$tmp = [System.IO.Path]::GetTempFileName() + '.py'
[System.IO.File]::WriteAllText($tmp, $script, [System.Text.UTF8Encoding]::new($false))
try {
    & $py $tmp $decomp $featsDir $doneDir $BatchN
    exit $LASTEXITCODE
} finally {
    Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
}
