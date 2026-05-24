# pi-epic-init <slug> [--from <design-file>] [--title "<title>"] [--base <branch>] [--no-planner]
#
# Bootstraps an epic:
#   - .pi/epics/<NNNN>-<slug>/ from template
#   - epic/<slug> branch off the default branch (override with --base)
#   - Sets STATE.md
#
# Does NOT push the branch (push happens at pi-epic-complete).
#
# Parity: this is the PowerShell sibling of scripts/pi-epic-init.
# Behavior, flags, exit codes, commit messages, and stdout/stderr must
# match the bash version. See PLAN-v0.12.0.md §"Parity rules".

[CmdletBinding()]
param(
    [Parameter(Position=0)][string]$Slug,
    [string]$From,
    [string]$Title,
    [string]$Base,
    [switch]$NoPlanner,
    [Parameter(ValueFromRemainingArguments=$true)][string[]]$Rest
)

# See _common.ps1 for the error-model rationale. We keep 'Continue' so that
# git stderr (e.g. "fatal: ref refs/remotes/origin/HEAD is not a symbolic ref")
# doesn't tear down the script — we check $LASTEXITCODE explicitly instead.
$ErrorActionPreference = 'Continue'

# Render unicode glyphs (✓, em-dash, arrows) correctly even on legacy code
# pages. Idempotent. _common.ps1 sets the same; we re-set after dot-source
# because some hosts reset OutputEncoding on script entry.
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

# Manually parse the bash-style "--flag value" args (Rest) since the
# PS [Parameter] binder only accepts "-Flag value" / "-Flag:value". We
# want the exact same CLI surface as the bash script.
function Parse-RestArgs {
    param([string[]]$Args)
    $i = 0
    while ($i -lt $Args.Count) {
        switch ($Args[$i]) {
            '--from' {
                if ($i + 1 -ge $Args.Count) { throw "ERROR: --from requires a value" }
                $script:From = $Args[$i+1]; $i += 2; continue
            }
            '--title' {
                if ($i + 1 -ge $Args.Count) { throw "ERROR: --title requires a value" }
                $script:Title = $Args[$i+1]; $i += 2; continue
            }
            '--base' {
                if ($i + 1 -ge $Args.Count) { throw "ERROR: --base requires a value" }
                $script:Base = $Args[$i+1]; $i += 2; continue
            }
            '--no-planner' {
                $script:NoPlanner = $true; $i += 1; continue
            }
            default {
                if (-not $script:Slug) { $script:Slug = $Args[$i]; $i += 1; continue }
                [Console]::Error.WriteLine("unknown arg: $($Args[$i])")
                exit 1
            }
        }
    }
}

if ($Rest) { Parse-RestArgs -Args $Rest }

if (-not $Slug) {
    [Console]::Error.WriteLine('usage: pi-epic-init <slug> [--from <file>] [--title "<title>"] [--base <branch>] [--no-planner]')
    exit 1
}

# Make Get-SkillRoot resolve against this script's directory.
$script:CallerDir = $PSScriptRoot
. "$PSScriptRoot\_common.ps1"

$slug = ConvertTo-Slug $Slug
$repo = Get-RepoRoot
Set-Location -LiteralPath $repo

# Initialize per-machine user lessons file if missing (v0.6.2 / L-036).
Initialize-UserLessons

# Version-drift warning (v0.6.2 / L-038 sibling).
$age = Get-PiEpicflowAgeDays
$ver = Get-PiEpicflowVersion
if ($age -is [int] -and $age -gt 7) {
    Write-Log "WARNING  pi-epicflow $ver is ${age} days old. Consider ``pi update pi-epicflow`` before starting a long epic."
}

# Pre-add the well-known pi runtime + per-feature ephemeral patterns to
# .gitignore BEFORE the clean-tree check. Mirror the bash script's set.
function Ensure-Gitignore {
    param([Parameter(Mandatory)][string]$Pattern)
    $gi = Join-Path $repo '.gitignore'
    if (-not (Test-Path -LiteralPath $gi)) {
        Set-FileContentLF -Path $gi -Content ''
    }
    Ensure-FileLine -Path $gi -Line $Pattern
}

$ignorePatterns = @(
    '.pi/STATE.md',
    '.pi/npm/',
    '.pi/settings.json',
    '.pi/epics/*/run-log.jsonl',
    '.pi/epics/*/features/*/worker-report.md',
    '.pi/epics/*/features/*/review-report.md',
    '.pi/epics/*/features/*/progress.md',
    '.pi/epics/*/features/done/*/worker-report.md',
    '.pi/epics/*/features/done/*/review-report.md',
    '.pi/epics/*/features/done/*/progress.md',
    # L-012 belt.
    '.pi/epics/*/halt-*.md',
    '.pi/epics/done/*/halt-*.md',
    # L-026 (v0.5.1) — done/ deeper patterns.
    '.pi/epics/done/*/run-log.jsonl',
    '.pi/epics/done/*/features/done/*/worker-report.md',
    '.pi/epics/done/*/features/done/*/review-report.md',
    '.pi/epics/done/*/features/done/*/progress.md',
    # L-026 (v0.5.1) — bytecode caches.
    '__pycache__/',
    '*.pyc',
    # L-040 (v0.6.2) — node_modules family.
    'node_modules*'
)
foreach ($p in $ignorePatterns) { Ensure-Gitignore $p }

# Commit the .gitignore update if it changed (or is brand-new + untracked).
$gistatus = & git status --porcelain -- .gitignore
if ($gistatus) {
    & git add .gitignore
    & git commit --quiet --no-verify -m 'chore: ignore pi runtime state (epic-feature-workflow)' | Out-Null
}

# Refuse if STILL dirty after the gitignore pass.
$dirty = & git status --porcelain
if ($dirty) {
    [Console]::Error.WriteLine('ERROR: working tree not clean. Commit or stash first.')
    & git status --short 2>&1 | ForEach-Object { [Console]::Error.WriteLine($_) }
    exit 1
}

$def = Get-DefaultBranch
if ($Base) {
    $hasLocal  = $false; $hasOrigin = $false
    & git rev-parse --verify --quiet "refs/heads/$Base" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $hasLocal = $true }
    & git rev-parse --verify --quiet "refs/remotes/origin/$Base" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $hasOrigin = $true }

    if ($hasLocal) {
        # use as-is
    } elseif ($hasOrigin) {
        & git fetch --quiet origin $Base 2>$null
    } else {
        [Console]::Error.WriteLine("ERROR: --base branch '$Base' not found locally or on origin/.")
        [Console]::Error.WriteLine("  Checked: refs/heads/$Base and refs/remotes/origin/$Base")
        exit 1
    }
    $def = $Base
    Write-Log "base branch (--base override): $def"
} else {
    Write-Log "default branch: $def"
}

# Update default branch to latest — only if we're currently on it.
$currentBranch = (& git rev-parse --abbrev-ref HEAD 2>$null)
if ($currentBranch) { $currentBranch = $currentBranch.Trim() } else { $currentBranch = '' }

if ($currentBranch -eq $def) {
    & git fetch --quiet origin $def 2>$null
    & git pull --ff-only --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Log '(pull skipped — no upstream or offline)' }
} elseif ($currentBranch -eq "epic/$slug") {
    Write-Log "on dedicated epic worktree (epic/$slug); skipping default-branch refresh"
} else {
    & git checkout $def --quiet
    & git pull --ff-only --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Log '(pull skipped — no upstream or offline)' }
}

$epicId  = "$(Get-NextEpicId)-$slug"
$epicDir = Join-Path $repo ".pi\epics\$epicId"
if (Test-Path -LiteralPath $epicDir) {
    [Console]::Error.WriteLine("ERROR: $epicDir already exists")
    exit 1
}

$skill = Get-SkillRoot
New-Item -ItemType Directory -Path (Join-Path $epicDir 'features') -Force | Out-Null

# Copy template files. Use raw byte copy via .NET to preserve LF endings.
function Copy-Template {
    param([string]$RelSrc, [string]$DstAbs)
    $src = Join-Path $skill ('templates\' + $RelSrc)
    $bytes = [System.IO.File]::ReadAllBytes($src)
    $dir = Split-Path -Parent $DstAbs
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllBytes($DstAbs, $bytes)
}

Copy-Template 'design.md'          (Join-Path $epicDir 'design.md')
Copy-Template 'meta.yaml'          (Join-Path $epicDir 'meta.yaml')
Copy-Template 'epic-config.yaml'   (Join-Path $epicDir 'epic-config.yaml')
Copy-Template 'decomposition.yaml' (Join-Path $epicDir 'decomposition.yaml')
Copy-Template 'deviations.md'      (Join-Path $epicDir 'deviations.md')
[System.IO.File]::WriteAllText(
    (Join-Path $epicDir 'run-log.jsonl'),
    '',
    [System.Text.UTF8Encoding]::new($false)
)

# Seed design.md from --from file if given.
if ($From) {
    if (-not (Test-Path -LiteralPath $From)) {
        [Console]::Error.WriteLine("ERROR: --from file not found: $From")
        exit 1
    }
    $bytes = [System.IO.File]::ReadAllBytes($From)
    [System.IO.File]::WriteAllBytes((Join-Path $epicDir 'design.md'), $bytes)
    Write-Log "seeded design.md from $From"
}

# Fill meta.yaml — match the bash sed substitutions exactly.
$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$owner = (& git config user.name 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $owner) { $owner = 'unknown' } else { $owner = $owner.Trim() }
$titleUse = if ($Title) { $Title } else { $slug }

$metaPath = Join-Path $epicDir 'meta.yaml'
$meta = Get-FileContentLF $metaPath
$subs = @(
    @{ k='id';              v=$epicId },
    @{ k='title';           v=$titleUse },
    @{ k='status';          v='design' },
    @{ k='branch';          v="epic/$slug" },
    @{ k='default_branch';  v=$def },
    @{ k='owner';           v=$owner },
    @{ k='started';         v=$today },
    @{ k='updated';         v=$today }
)
foreach ($s in $subs) {
    $pattern = "(?m)^$([Regex]::Escape($s.k)):.*$"
    $repl    = "$($s.k): $($s.v)"
    $meta = [Regex]::Replace($meta, $pattern, $repl)
}
Set-FileContentLF -Path $metaPath -Content $meta

# --no-planner persistence.
if ($NoPlanner) {
    $meta = Get-FileContentLF $metaPath
    if ($meta -match '(?m)^disable_planner:') {
        $meta = [Regex]::Replace($meta, '(?m)^disable_planner:.*$', 'disable_planner: true')
    } else {
        if (-not $meta.EndsWith("`n")) { $meta += "`n" }
        $meta += "`ndisable_planner: true`n"
    }
    Set-FileContentLF -Path $metaPath -Content $meta
    Write-Log '--no-planner: disabled feature-planner subagent for this epic'
}

# Create epic branch (or reuse if already on it).
$currentBranch = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($currentBranch -eq "epic/$slug") {
    Write-Log "already on epic/$slug (dedicated worktree); reusing"
} else {
    & git rev-parse --verify --quiet "epic/$slug" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        [Console]::Error.WriteLine("ERROR: branch epic/$slug already exists in another worktree.")
        [Console]::Error.WriteLine('  cd into that worktree and re-run, OR delete the branch first.')
        exit 1
    }
    & git checkout -b "epic/$slug" --quiet
    Write-Log "created branch: epic/$slug"
}

# Update STATE.md — keep exact byte-for-byte parity with bash heredoc.
$statePath = Join-Path $repo '.pi\STATE.md'
$stateContent = @"
# Active epic

``.pi/epics/$epicId/``

Branch: ``epic/$slug``
Default (PR target): ``$def``

Design: [``design.md``](epics/$epicId/design.md)
Decomposition: [``decomposition.yaml``](epics/$epicId/decomposition.yaml)
Status: see [``meta.yaml``](epics/$epicId/meta.yaml)

No active feature yet. Run ``pi-epic-decompose`` next.
"@
Set-FileContentLF -Path $statePath -Content $stateContent

Add-RunLogEntry -EpicDir $epicDir -Payload "`"event`":`"epic-init`",`"epic`":`"$epicId`",`"branch`":`"epic/$slug`""

# Commit the scaffolding to the epic branch.
& git add ".pi/epics/$epicId"
& git commit --quiet --no-verify -m "chore(epic): scaffold $epicId" 2>$null | Out-Null

Write-Host ''
Write-Host "✓ Epic initialized: $epicId"
Write-Host "  Folder: $epicDir"
Write-Host "  Branch: epic/$slug (off $def)"
Write-Host ''
Write-Host 'Next steps (in pi):'
Write-Host "  1. /epic-design          → co-author $(Join-Path $epicDir 'design.md') with pi (or edit directly)"
Write-Host '  2. /epic-review-design   → (optional) unbiased critic pass before decomposition'
Write-Host "  3. /epic-decompose       → pi proposes $(Join-Path $epicDir 'decomposition.yaml')"
Write-Host '  4. /epic-run-auto        → ship every feature, open the PR'
Write-Host ''
