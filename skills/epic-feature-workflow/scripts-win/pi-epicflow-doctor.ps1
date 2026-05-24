# pi-epicflow-doctor — PowerShell sibling of scripts/pi-epicflow-doctor.
#
# Read-only health report for the installed pi-epicflow runtime + active epic.
# Adds Windows-specific checks: PowerShell version, ExecutionPolicy,
# core.longpaths, core.symlinks, bash availability.
#
# Exits 0 always (diagnostic, not gate).

# Diagnostic; never gates. Use 'Continue' so native stderr (git, python
# --version on missing binaries, etc.) doesn't tear down the script.
$ErrorActionPreference = 'Continue'
$script:CallerDir = $PSScriptRoot
. "$PSScriptRoot\_common.ps1"

function Write-Pass { param([string]$M) Write-Host "  $([char]0x2713) $M" -ForegroundColor Green }
function Write-Warn { param([string]$M) Write-Host "  $([char]0x26a0) $M" -ForegroundColor Yellow }
function Write-Fail { param([string]$M) Write-Host "  $([char]0x2717) $M" -ForegroundColor Red }
function Write-Info { param([string]$M) Write-Host "    $M" }

Write-Host '=== pi-epicflow doctor ==='
Write-Host ''

# 1. Runtime / clone / version
Write-Host '-- runtime --'
$clone = Get-PiEpicflowClone
if ($clone -and (Test-Path -LiteralPath $clone)) {
    Write-Pass "pi-epicflow clone: $clone"
    $ver = Get-PiEpicflowVersion
    $age = Get-PiEpicflowAgeDays
    Write-Info "version: $ver"
    Write-Info "clone age: ${age}d"
    if ($age -is [int] -and $age -gt 7) {
        Write-Warn "clone is >7 days old. Run ``pi update pi-epicflow`` to refresh."
    }
    if (Test-Path -LiteralPath (Join-Path $clone '.git')) {
        $behind = & git -C $clone rev-list --count 'HEAD..origin/main' 2>$null
        if ($LASTEXITCODE -eq 0 -and $behind) {
            $behind = $behind.Trim()
            if ([int]::TryParse($behind, [ref]$null)) {
                if ([int]$behind -gt 0) {
                    Write-Warn "$behind commit(s) behind origin/main"
                } else {
                    Write-Pass 'in sync with origin/main'
                }
            }
        }
    }
} else {
    Write-Fail 'pi-epicflow clone not found (Get-SkillRoot resolution failed)'
}
Write-Host ''

# 2. Skills installed
Write-Host '-- skills --'
$sr = Get-SkillRoot
if ($sr -and (Test-Path -LiteralPath $sr)) {
    Write-Pass "epic-feature-workflow skill at: $sr"
    $required = @(
        'pi-epic-init', 'pi-feature-start', 'pi-feature-complete',
        'pi-epic-next-feature', 'pi-epic-complete', 'pi-epic-extend',
        'pi-epic-validate-decomposition'
    )
    # Note: pi-epic-status is a known v0.12.0 gap (read-only command,
    # 1100 lines of bash; deferred to v0.13). All write/lifecycle
    # commands are available on Windows.
    foreach ($s in $required) {
        $scriptPath = Join-Path $sr "scripts-win\$s.ps1"
        if (Test-Path -LiteralPath $scriptPath) {
            Write-Pass "$s (ps1) installed"
        } else {
            Write-Warn "$s.ps1 not yet ported (phase rollout — see PLAN-v0.12.0.md)"
        }
    }
} else {
    Write-Fail 'skill_root not found'
}
Write-Host ''

# 3. User lessons
Write-Host '-- user lessons --'
$ul = Get-UserLessonsPath
if (Test-Path -LiteralPath $ul) {
    $content = Get-Content -LiteralPath $ul
    $lines = ($content | Measure-Object -Line).Lines
    $epics = ($content | Where-Object { $_ -match '^## Source epic' } | Measure-Object).Count
    Write-Pass "$ul ($lines lines, $epics epic(s) contributed)"
} else {
    Write-Info "no user-lessons.md yet at $ul (created on first pi-epic-init / pi-epic-complete)"
}
Write-Host ''

# 4. Active epic
Write-Host '-- active epic --'
$epicDir = $null
try { $epicDir = Get-ActiveEpicDir } catch { $epicDir = $null }
if ($epicDir) {
    $epicId = Get-ActiveEpicId
    Write-Pass "active epic: $epicId"
    Write-Info "folder: $epicDir"
    $status = Get-YamlValue (Join-Path $epicDir 'meta.yaml') 'status'
    if (-not $status) { $status = '?' }
    Write-Info "status: $status"
    $testCmd = Get-YamlValue (Join-Path $epicDir 'epic-config.yaml') 'test_cmd'
    if ($testCmd) {
        if ($testCmd -match '^echo\s' -or $testCmd -match 'SKIP' -or $testCmd -match 'skip') {
            Write-Warn "test_cmd is a bypass: $testCmd"
            Write-Info 'Per-feature test gate disabled — regressions caught only at epic-review.'
        } else {
            Write-Pass "test_cmd: $testCmd"
        }
    } else {
        Write-Info 'no explicit test_cmd (autodetected at runtime)'
    }
} else {
    Write-Info 'no active epic'
}
Write-Host ''

# 5. Tooling
Write-Host '-- tools --'
foreach ($t in @('git')) {
    $cmd = Get-Command $t -ErrorAction SilentlyContinue
    if ($cmd) {
        $verLine = (& $t --version 2>$null | Select-Object -First 1)
        Write-Pass "${t}: $verLine"
    } else {
        Write-Fail "$t not on PATH"
    }
}
$py = Get-PythonExe
if ($py) {
    $verLine = (& $py --version 2>&1 | Select-Object -First 1)
    Write-Pass "python: $verLine ($py)"
} else {
    Write-Fail 'python not on PATH (needed for YAML helpers + validation)'
    Write-Info '  install: https://www.python.org/downloads/windows/  (>=3.8)'
}
Write-Host ''

# 6. Windows-specific environment checks
Write-Host '-- windows --'
$psVer = $PSVersionTable.PSVersion
if ($psVer.Major -ge 5) {
    Write-Pass "PowerShell $($psVer.Major).$($psVer.Minor) (>=5.1 required)"
} else {
    Write-Fail "PowerShell $($psVer.Major).$($psVer.Minor) — pi-epicflow requires 5.1+"
}

try {
    $policies = Get-ExecutionPolicy -List
    $effective = (Get-ExecutionPolicy)
    if ($effective -in @('Restricted','AllSigned')) {
        Write-Warn "ExecutionPolicy is '$effective'."
        Write-Info '  Scripts run via the .cmd shim use ``-ExecutionPolicy Bypass`` per-invocation,'
        Write-Info '  so this is informational only. If you invoke .ps1 directly you may need to adjust.'
    } else {
        Write-Pass "ExecutionPolicy (effective): $effective"
    }
} catch {
    Write-Warn 'could not read ExecutionPolicy'
}

# core.longpaths — important for nested per-feature worktrees on Windows.
$lp = (& git config --get core.longpaths 2>$null)
if ($LASTEXITCODE -eq 0 -and $lp -and $lp.Trim() -eq 'true') {
    Write-Pass 'git core.longpaths = true'
} else {
    Write-Warn 'git core.longpaths is not enabled.'
    Write-Info '  per-feature worktrees can blow past MAX_PATH (260 chars) on Windows.'
    Write-Info '  fix:  git config --global core.longpaths true'
    Write-Info '  also enable Windows long-path support: see https://learn.microsoft.com/windows/win32/fileio/maximum-file-path-limitation'
}

# core.symlinks — git worktrees themselves don't need this, but user's repo might.
$sl = (& git config --get core.symlinks 2>$null)
if ($LASTEXITCODE -eq 0 -and $sl -and $sl.Trim() -eq 'true') {
    Write-Pass 'git core.symlinks = true'
} else {
    Write-Info 'git core.symlinks not set or false (only matters if your repo tracks symlinks).'
}

# bash availability — informational only on Windows; not required.
$bash = Get-Command bash -ErrorAction SilentlyContinue
if ($bash) {
    Write-Info "bash detected at: $($bash.Source) (informational; not required)"
}

Write-Host ''
Write-Host 'Done.'
