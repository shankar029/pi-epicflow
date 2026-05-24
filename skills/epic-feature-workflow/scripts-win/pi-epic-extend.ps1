# pi-epic-extend <id> --rationale "<one-liner>" [--design <file>] [--title "<short>"]
#
# Extend an existing epic with new requirements that belong to its original
# scope. See the bash sibling (scripts/pi-epic-extend) for full behaviour
# and guardrail documentation.

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

function Show-Usage {
    Write-Host @"
usage: pi-epic-extend <id> --rationale "<text>" [--design <file>] [--title "<short>"]

  <id>            epic id, e.g. 0001-gen-ui
  --rationale     REQUIRED. 1-3 sentence reason this work belongs to the
                  original epic. Recorded verbatim.
  --design FILE   Optional markdown file appended as the requirements
                  section. If omitted, an editable stub is appended.
  --title TEXT    Optional short title for the extension section heading.
                  Defaults to "Extension".
"@
    exit 1
}

if ($args.Count -lt 1) { Show-Usage }
$epicId = $args[0]
$rationale = ''
$designFile = ''
$extTitle = 'Extension'
$i = 1
while ($i -lt $args.Count) {
    switch ($args[$i]) {
        '--rationale' { $rationale = $args[$i+1]; $i += 2 }
        '--design'    { $designFile = $args[$i+1]; $i += 2 }
        '--title'     { $extTitle = $args[$i+1]; $i += 2 }
        '-h'      { Show-Usage }
        '--help'  { Show-Usage }
        default {
            [Console]::Error.WriteLine("unknown arg: $($args[$i])")
            Show-Usage
        }
    }
}

if (-not $rationale) {
    [Console]::Error.WriteLine('ERROR: --rationale is required (no silent extensions - L-042).')
    Show-Usage
}

$script:CallerDir = $PSScriptRoot
. "$PSScriptRoot\_common.ps1"

$repo = Get-RepoRoot
Set-Location -LiteralPath $repo

# Locate the epic.
$activePath   = Join-Path $repo ".pi\epics\$epicId"
$archivedPath = Join-Path $repo ".pi\epics\done\$epicId"
$wasArchived = 0
if (Test-Path -LiteralPath $activePath -PathType Container) {
    $epicDir = $activePath
} elseif (Test-Path -LiteralPath $archivedPath -PathType Container) {
    $epicDir = $archivedPath
    $wasArchived = 1
} else {
    [Console]::Error.WriteLine("ERROR: epic '$epicId' not found.")
    [Console]::Error.WriteLine("  Looked in: $activePath")
    [Console]::Error.WriteLine("            $archivedPath")
    [Console]::Error.WriteLine('  Available epics:')
    foreach ($base in @('.pi\epics', '.pi\epics\done')) {
        $dir = Join-Path $repo $base
        if (Test-Path -LiteralPath $dir) {
            Get-ChildItem -Path $dir -Directory -Filter '[0-9][0-9][0-9][0-9]-*' -ErrorAction SilentlyContinue |
                ForEach-Object { [Console]::Error.WriteLine("    $($_.Name)") }
        }
    }
    exit 1
}

foreach ($req in @('meta.yaml','design.md','decomposition.yaml')) {
    if (-not (Test-Path -LiteralPath (Join-Path $epicDir $req))) {
        [Console]::Error.WriteLine("ERROR: $epicDir is missing $req - not a valid epic folder.")
        exit 1
    }
}

$epicSlug = $epicId -replace '^[0-9]+-', ''
$epicBranch = "epic/$epicSlug"
$def = Get-YamlValue (Join-Path $epicDir 'meta.yaml') 'default_branch'
if (-not $def) {
    [Console]::Error.WriteLine('ERROR: meta.yaml has no default_branch - cannot determine merge base.')
    exit 1
}

# Refuse if epic branch was already merged.
& git rev-parse --verify --quiet "refs/heads/$epicBranch" 2>$null | Out-Null
$localExists = ($LASTEXITCODE -eq 0)
if ($localExists) {
    & git merge-base --is-ancestor $epicBranch $def 2>$null
    if ($LASTEXITCODE -eq 0) {
        [Console]::Error.WriteLine("ERROR: $epicBranch is already merged into $def.")
        [Console]::Error.WriteLine('  Extending a merged epic would require un-merging. Either:')
        [Console]::Error.WriteLine("    - start a new epic with: pi-epic-init <new-slug> --base $def")
        [Console]::Error.WriteLine('    - or revert the merge first, then retry pi-epic-extend.')
        exit 1
    }
} else {
    & git rev-parse --verify --quiet "refs/remotes/origin/$epicBranch" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        & git fetch --quiet origin $epicBranch 2>$null | Out-Null
        & git branch --track $epicBranch "origin/$epicBranch" 2>$null | Out-Null
        & git rev-parse --verify --quiet "refs/heads/$epicBranch" 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            & git merge-base --is-ancestor $epicBranch $def 2>$null
            if ($LASTEXITCODE -eq 0) {
                [Console]::Error.WriteLine("ERROR: $epicBranch is already merged into $def (per origin).")
                exit 1
            }
        }
    } else {
        [Console]::Error.WriteLine("ERROR: epic branch '$epicBranch' not found locally or on origin.")
        [Console]::Error.WriteLine('  An extension requires the original epic branch to still exist.')
        exit 1
    }
}

if (& git status --porcelain) {
    [Console]::Error.WriteLine('ERROR: working tree is dirty. Commit or stash before extending.')
    & git status --short 2>&1 | ForEach-Object { [Console]::Error.WriteLine($_) }
    exit 1
}

Write-Log "switching to $epicBranch"
& git checkout --quiet $epicBranch

# Un-archive if needed.
if ($wasArchived) {
    Write-Log "un-archiving $epicId from .pi/epics/done/"
    $newDir = Join-Path $repo ".pi\epics\$epicId"
    & git mv $epicDir $newDir 2>$null
    if ($LASTEXITCODE -ne 0) {
        Move-Item -LiteralPath $epicDir -Destination $newDir
        & git add -A ".pi/epics/done/$epicId" 2>$null | Out-Null
        & git add -A ".pi/epics/$epicId" 2>$null | Out-Null
    }
    $epicDir = $newDir
}

$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$ts    = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Count existing extensions.
$metaPath = Join-Path $epicDir 'meta.yaml'
$extN = 0
$metaLines = (Get-FileContentLF $metaPath) -split "`n"
$inExt = $false
foreach ($l in $metaLines) {
    if ($l -match '^extensions:') { $inExt = $true; continue }
    if ($inExt -and $l -match '^[A-Za-z]') { $inExt = $false }
    if ($inExt -and $l -match '^  - ') { $extN++ }
}
$extIdx = $extN + 1

# Snapshot feature count before first extension.
if ($extN -eq 0) {
    $metaText = Get-FileContentLF $metaPath
    if ($metaText -notmatch '(?m)^original_feature_count:') {
        $decompPath = Join-Path $epicDir 'decomposition.yaml'
        $decompText = Get-FileContentLF $decompPath
        $curFeats = ([regex]::Matches($decompText, '(?m)^  - id:')).Count
        Add-FileLineLF -Path $metaPath -Line "original_feature_count: $curFeats"
        Write-Log "recorded original_feature_count=$curFeats (used for L-042 growth check)"
    }
}

# Edit meta.yaml: status -> in-progress, append extension entry. Use inline Python.
$py = Get-PythonExe
if (-not $py) {
    [Console]::Error.WriteLine('ERROR: python3 not on PATH')
    exit 1
}

$metaScript = @'
import sys, os, re
args = list(sys.argv[1:]) + [''] * 7  # pad: PowerShell may drop trailing empty args
path, today, ts, rationale, title, design_file = args[:6]
with open(path, encoding='utf-8') as f:
    lines = f.read().splitlines()

out = []
saw_status = saw_updated = False
for l in lines:
    if re.match(r'^status:', l):
        out.append('status: in-progress'); saw_status = True
    elif re.match(r'^updated:', l):
        out.append(f'updated: {today}'); saw_updated = True
    else:
        out.append(l)

if not saw_status: out.append('status: in-progress')
if not saw_updated: out.append(f'updated: {today}')

ext_line = None
for i, l in enumerate(out):
    if re.match(r'^extensions:', l):
        ext_line = i; break
if ext_line is None:
    out.append('extensions: []')
    ext_line = len(out) - 1

if re.match(r'^extensions:\s*\[\s*\]\s*$', out[ext_line]):
    out[ext_line] = 'extensions:'
    insert_at = ext_line + 1
else:
    insert_at = ext_line + 1
    while insert_at < len(out) and (out[insert_at].startswith('  ') or out[insert_at].strip() == ''):
        insert_at += 1

def q(s): return s.replace('"', '\\"')
entry = [
    f'  - date: {today}',
    f'    ts: {ts}',
    f'    title: "{q(title)}"',
    f'    rationale: "{q(rationale)}"',
]
if design_file:
    entry.append(f'    design_file: "{q(os.path.basename(design_file))}"')
out[insert_at:insert_at] = entry

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(out).rstrip() + '\n')
'@
$tmp = [System.IO.Path]::GetTempFileName() + '.py'
[System.IO.File]::WriteAllText($tmp, $metaScript, [System.Text.UTF8Encoding]::new($false))
try {
    & $py $tmp $metaPath $today $ts $rationale $extTitle $designFile
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine('ERROR: meta.yaml edit failed')
        exit 1
    }
} finally {
    Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
}

# Append extension section to design.md.
$designPath = Join-Path $epicDir 'design.md'
$existing = Get-FileContentLF $designPath
$append = "`n`n---`n`n## Extension - ${today}: $extTitle`n`n**Rationale:** $rationale`n`n"
if ($designFile) {
    if (-not (Test-Path -LiteralPath $designFile)) {
        [Console]::Error.WriteLine("WARNING: --design file $designFile not found at extend time.")
        $append += "<!-- design file $designFile was missing at extend time - add content here -->`n"
    } else {
        $append += "### Requirements`n`n"
        $append += (Get-FileContentLF $designFile)
        if (-not $append.EndsWith("`n")) { $append += "`n" }
    }
} else {
    $append += @"
### Requirements

<!--
Fill in the extension requirements here. Treat this as a mini-design:
- Goals (what success looks like for THIS extension).
- Non-goals (what's explicitly out of scope for this extension).
- Surfaces to touch (files / modules / new components).
- Acceptance criteria for the extension as a whole.

Once filled in, run `/epic-decompose` again. It will detect the new
extension entry in meta.yaml and APPEND new features (F<last+1>+) without
modifying the existing decomposition.
-->
"@
}
Set-FileContentLF -Path $designPath -Content ($existing + $append)

# STATE.md.
$piDir = Join-Path $repo '.pi'
New-Item -ItemType Directory -Path $piDir -Force | Out-Null
Set-FileContentLF -Path (Join-Path $piDir 'STATE.md') -Content @"
# Active feature: (none)

Active epic: ``.pi/epics/$epicId/`` (extended ${today})
"@

# Run-log entry (use ConvertTo-JsonString for safety).
$titleJson = ConvertTo-JsonString $extTitle
Add-RunLogEntry -EpicDir $epicDir -Payload "`"event`":`"epic-extended`",`"epic`":`"$epicId`",`"extension_index`":$extIdx,`"title`":`"$titleJson`""

# Commit.
& git add -A ".pi/epics/$epicId"
if ($wasArchived) {
    & git add -A ".pi/epics/done/$epicId" 2>$null | Out-Null
}
& git commit --quiet --no-verify -m "chore(epic): extend $epicId #$extIdx - $extTitle"
Write-Log "committed extension #$extIdx to $epicBranch"

Write-Host ''
Write-Host "$([char]0x2713) Epic extended: $epicId (#$extIdx)"
Write-Host "  Branch:    $epicBranch"
Write-Host "  Folder:    .pi/epics/$epicId/"
Write-Host "  Rationale: $rationale"
Write-Host ''
Write-Host 'Next:'
Write-Host "  1. Edit  .pi/epics/$epicId/design.md  if the extension section needs more"
Write-Host "     detail (or you didn't pass --design FILE)."
Write-Host '  2. Run  /epic-decompose  (or the prompt template in pi).'
Write-Host '  3. Then  pi-feature-start <new-id>  as usual.'
Write-Host ''
Write-Host "Guardrail reminder: pi-epic-complete will warn at >=2 extensions and"
Write-Host "hard-halt if the extension features grow the epic by >=30% without a"
Write-Host "recorded decomposition lesson. See L-042."
