# pi-feature-start <feature-id>
#
# - Verifies feature deps are merged
# - Creates feat/<epic-slug>/<feature-id>-<slug> branch off the epic branch
# - Creates a git worktree at ../<repo>-<feature-id>/
# - Creates .pi/epics/<epic>/features/<feature-id>-<slug>/{feature.md,meta.yaml}
# - Updates STATE.md
# - Echoes the worktree path so the caller can `cd` into it.
#
# Parity: PowerShell sibling of scripts/pi-feature-start.

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

# Help / arg check.
if ($args.Count -ge 1 -and ($args[0] -in '--help','-h')) {
    Write-Host @"
usage: pi-feature-start <feature-id>

Creates a feature worktree off the active epic branch:
  - Verifies depends_on are merged
  - Scaffolds .pi/epics/<epic>/features/<id>-<slug>/{feature.md,meta.yaml}
  - Creates feat/<epic-slug>/<id>-<slug> branch + ../<repo>-<id>/ worktree

Not parallel-safe: invoke serially (one feature at a time). For parallel
work, parallelize the worker dispatch into the resulting worktrees, not
the pi-feature-start invocations themselves. (v0.10.1)
"@
    exit 0
}
if ($args.Count -ne 1) {
    [Console]::Error.WriteLine('usage: pi-feature-start <feature-id> (use --help)')
    exit 1
}
$fid = $args[0]

$script:CallerDir = $PSScriptRoot
. "$PSScriptRoot\_common.ps1"

# Concurrency safety (mirrors bash flock).
# Use [System.Threading.Mutex] keyed off the repo's git-common-dir. If
# another invocation is holding it, wait up to 60s.
$repoForLock = & git rev-parse --show-toplevel 2>$null
if (-not $repoForLock) { $repoForLock = (Get-Location).Path } else { $repoForLock = $repoForLock.Trim() }
$gitCommon = & git rev-parse --git-common-dir 2>$null
if (-not $gitCommon) { $gitCommon = Join-Path $repoForLock '.git' } else { $gitCommon = $gitCommon.Trim() }
# Mutex name must be filesystem-safe; use a hash of the common dir.
$mutexName = 'Global\pi-feature-start-' + ([BitConverter]::ToString(
    [System.Security.Cryptography.SHA1]::Create().ComputeHash(
        [System.Text.Encoding]::UTF8.GetBytes($gitCommon)
    )
).Replace('-','').Substring(0,16))
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($false, $mutexName, [ref]$createdNew)
try {
    if (-not $mutex.WaitOne([TimeSpan]::FromSeconds(60))) {
        [Console]::Error.WriteLine('ERROR: another pi-feature-start is holding the repo lock (waited 60s).')
        [Console]::Error.WriteLine('  Concurrent pi-feature-start is not supported - invoke serially.')
        exit 1
    }
} catch [System.Threading.AbandonedMutexException] {
    # Previous holder crashed; we still acquired ownership. Safe to proceed.
}

try {

$repo = Get-RepoRoot
Set-Location -LiteralPath $repo

$epicDir  = Get-ActiveEpicDir
$epicId   = Get-ActiveEpicId
$epicSlug = $epicId -replace '^[0-9]+-', ''
$decomp   = Join-Path $epicDir 'decomposition.yaml'
if (-not (Test-Path -LiteralPath $decomp)) {
    [Console]::Error.WriteLine("ERROR: $decomp not found")
    exit 1
}
$skill = Get-SkillRoot

# Pull feature spec from decomposition.yaml via Python (parity with bash).
$py = Get-PythonExe
if (-not $py) {
    [Console]::Error.WriteLine('ERROR: python3 not on PATH')
    exit 1
}
$parseScript = @'
import sys, re, json
path, want = sys.argv[1], sys.argv[2]
out = {}
cur = None; cur_list = None
with open(path, encoding="utf-8") as f:
    for raw in f:
        line = raw.rstrip("\n")
        if not line.strip() or line.lstrip().startswith("#"): continue
        s = line.strip()
        if s.startswith("- ") and "id:" in s:
            cur = {}
            m = re.match(r"^id\s*:\s*(.*)$", s[2:])
            if m: cur["id"] = m.group(1).strip().strip("\"'")
            if cur.get("id") == want: out = cur
            cur_list = None
            continue
        if cur is None or cur is not out: continue
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
print(json.dumps(out))
'@
$tmp = [System.IO.Path]::GetTempFileName() + '.py'
[System.IO.File]::WriteAllText($tmp, $parseScript, [System.Text.UTF8Encoding]::new($false))
try {
    $specJson = & $py $tmp $decomp $fid
} finally {
    Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
}
if (-not $specJson) { $specJson = '{}' }
$spec = $specJson | ConvertFrom-Json
if (-not $spec.id) {
    [Console]::Error.WriteLine("ERROR: feature $fid not found in $decomp")
    exit 1
}

$slug = if ($spec.PSObject.Properties.Name -contains 'slug') { [string]$spec.slug } else { '' }
$summary = if ($spec.PSObject.Properties.Name -contains 'summary') { [string]$spec.summary } else { '' }
$deps = @()
if ($spec.PSObject.Properties.Name -contains 'depends_on' -and $spec.depends_on) {
    $deps = @($spec.depends_on)
}
$kind = 'feature'
if ($spec.PSObject.Properties.Name -contains 'kind' -and $spec.kind) {
    $kind = ([string]$spec.kind).Trim()
}

# Verify deps are merged.
foreach ($d in $deps) {
    if (-not $d) { continue }
    $foundMerged = $false
    $candidates = Get-ChildItem -Path (Join-Path $epicDir 'features\done') -Directory -Filter "$d-*" -ErrorAction SilentlyContinue
    foreach ($c in $candidates) {
        $metaPath = Join-Path $c.FullName 'meta.yaml'
        if (Test-Path -LiteralPath $metaPath) {
            if (Select-String -Path $metaPath -Pattern '^state:\s*merged' -Quiet) {
                $foundMerged = $true; break
            }
        }
    }
    if (-not $foundMerged) {
        [Console]::Error.WriteLine("ERROR: dependency $d is not merged; cannot start $fid")
        exit 1
    }
}

# Pending-edits auto-commit (mirrors bash logic precisely).
$dirty = & git status --porcelain
if ($dirty) {
    & git add ".pi/epics/$epicId" .pi/STATE.md 2>$null | Out-Null
    & git reset --quiet HEAD -- ".pi/epics/$epicId/halt-*.md" 2>$null | Out-Null
    $cached = & git diff --cached --name-only
    if ($cached) {
        # Anything dirty outside .pi/epics/<id> or .pi/STATE.md?
        $outside = & git status --porcelain |
                   Where-Object { $_ -notmatch "^[ A-Z?]+ \.pi/(epics/$([Regex]::Escape($epicId))|STATE\.md)" }
        if (-not $outside) {
            & git commit --quiet --no-verify -m "chore(epic): pending edits before $fid"
            Write-Log 'auto-committed pending epic-folder edits to epic branch'
        } else {
            & git reset --quiet HEAD .pi/ 2>$null | Out-Null
            [Console]::Error.WriteLine("ERROR: working tree has changes outside .pi/epics/$epicId/")
            & git status --short 2>&1 | ForEach-Object { [Console]::Error.WriteLine($_) }
            exit 1
        }
    }
}

# Switch to epic branch.
& git checkout "epic/$epicSlug" --quiet 2>&1 | ForEach-Object { Write-Stderr $_ }

$featBranch  = "feat/$epicSlug/$fid-$slug"
$repoBase    = Split-Path $repo -Leaf
$repoParent  = (Resolve-Path (Join-Path $repo '..')).Path
$worktree    = Join-Path $repoParent "$repoBase-$fid"

# L-023: SCAFFOLD FIRST, BRANCH SECOND. Create + populate the feature folder
# on the epic branch, commit it, THEN branch feat from the post-scaffold tip.
$featDir = Join-Path $epicDir "features\$fid-$slug"
New-Item -ItemType Directory -Path $featDir -Force | Out-Null

# Select template by kind.
$featureTemplate = Join-Path $skill 'templates\feature.md'
if ($kind -eq 'spike' -and (Test-Path -LiteralPath (Join-Path $skill 'templates\feature-spike.md'))) {
    $featureTemplate = Join-Path $skill 'templates\feature-spike.md'
}
function Copy-RawBytes {
    param([string]$Src, [string]$Dst)
    $bytes = [System.IO.File]::ReadAllBytes($Src)
    [System.IO.File]::WriteAllBytes($Dst, $bytes)
}
if (-not (Test-Path -LiteralPath (Join-Path $featDir 'feature.md'))) {
    Copy-RawBytes -Src $featureTemplate -Dst (Join-Path $featDir 'feature.md')
}
if (-not (Test-Path -LiteralPath (Join-Path $featDir 'meta.yaml'))) {
    Copy-RawBytes -Src (Join-Path $skill 'templates\feature-meta.yaml') -Dst (Join-Path $featDir 'meta.yaml')
}

$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')

# In-place YAML edits — keep value containing special chars (|, /, &) intact.
$metaPath = Join-Path $featDir 'meta.yaml'
$updates = @{
    id       = "$fid-$slug"
    title    = $summary
    state    = 'in-progress'
    branch   = $featBranch
    worktree = "`"$worktree`""
    started  = $today
    updated  = $today
}
$text = Get-FileContentLF $metaPath
$lines = $text -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
    $m = [Regex]::Match($lines[$i], '^([A-Za-z0-9_]+)\s*:')
    if (-not $m.Success) { continue }
    $k = $m.Groups[1].Value
    if ($updates.ContainsKey($k)) {
        $lines[$i] = "$($k): $($updates[$k])"
    }
}
Set-FileContentLF -Path $metaPath -Content ($lines -join "`n")

# depends_on.
if ($deps.Count -gt 0) {
    $depsYaml = '[' + (($deps | ForEach-Object { $_ }) -join ',') + ']'
    $text = Get-FileContentLF $metaPath
    $text = [Regex]::Replace($text, '(?m)^depends_on:.*$', "depends_on: $depsYaml")
    Set-FileContentLF -Path $metaPath -Content $text
}

# Advance epic status: design → in-progress on first feature start.
$epicMeta = Join-Path $epicDir 'meta.yaml'
$epicStatus = Get-YamlValue $epicMeta 'status'
if (-not $epicStatus -or $epicStatus -eq 'design') {
    Set-YamlValue -File $epicMeta -Key 'status' -Value 'in-progress'
    Update-YamlUpdated -File $epicMeta
}

# Update STATE.md.
$def = Get-YamlValue $epicMeta 'default_branch'
$statePath = Join-Path $repo '.pi\STATE.md'
$stateContent = @"
# Active epic + feature

Epic: ``.pi/epics/$epicId/``
Branch: ``epic/$epicSlug`` $([char]0x2192) PR target ``$def``

Active feature: ``$fid-$slug``
Feature branch: ``$featBranch``
Worktree: ``$worktree``

Feature journal: [``feature.md``](epics/$epicId/features/$fid-$slug/feature.md)
"@
Set-FileContentLF -Path $statePath -Content $stateContent

$wtJson = ConvertTo-JsonString $worktree
Add-RunLogEntry -EpicDir $epicDir -Payload "`"event`":`"feature-start`",`"feature`":`"$fid-$slug`",`"branch`":`"$featBranch`",`"worktree`":`"$wtJson`""

# L-019: commit scaffolded feature folder + STATE.md to epic BEFORE creating feat branch.
$dirty = & git status --porcelain -- ".pi/epics/$epicId/features/$fid-$slug" .pi/STATE.md ".pi/epics/$epicId/meta.yaml" 2>$null
if ($dirty) {
    & git add ".pi/epics/$epicId/features/$fid-$slug" .pi/STATE.md ".pi/epics/$epicId/meta.yaml" 2>$null | Out-Null
    & git reset --quiet HEAD -- ".pi/epics/$epicId/halt-*.md" 2>$null | Out-Null
    $cached = & git diff --cached --name-only
    if ($cached) {
        & git commit --quiet --no-verify -m "chore(epic): scaffold $fid feature folder"
        Write-Log 'committed scaffolded feature folder to epic branch (L-019)'
    }
}

# Create feat branch from post-scaffold epic tip + worktree.
& git rev-parse --verify --quiet $featBranch 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Log "branch $featBranch already exists; reusing"
} else {
    & git branch $featBranch "epic/$epicSlug" --quiet
}

if (Test-Path -LiteralPath $worktree) {
    Write-Log "worktree $worktree already exists; reusing"
} else {
    & git worktree add $worktree $featBranch --quiet
}

Write-Host ''
Write-Host "$([char]0x2713) Feature started: $fid-$slug"
Write-Host "  Branch:   $featBranch"
Write-Host "  Worktree: $worktree"
Write-Host "  Folder:   $featDir"
Write-Host ''
Write-Host "Next: cd `"$worktree`" and implement against acceptance criteria."
Write-Host ''

# Echo worktree path on its own line for capture by callers.
Write-Output $worktree

} finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
