# install/lib/brain-audit.ps1
#
# PowerShell mirror of brain-audit.sh (per C-003 cross-shell parity).
# Shared helpers for fence-aware audits of .pi/project/ brain files.
#
# Dot-source this file to expose:
#   Get-BrainEntries -Path <file>
#   Get-BrainAnchorCount -Prefix <str> -Path <file>
#   Test-BrainStale -Path <file> -Days <int>
#
# All functions are pure (no external commands); awk-free.

# Print all real `## ` headings, ignoring those inside ```fenced``` blocks.
# Output: "<file>:<lineno>: <heading-line>"
function Get-BrainEntries {
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$Path
    )
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }
    $fence = $false
    $lineno = 0
    Get-Content -LiteralPath $Path | ForEach-Object {
        $lineno++
        $line = $_
        if ($line -match '^```') {
            $fence = -not $fence
            return
        }
        if (-not $fence -and $line -match '^## ') {
            "${Path}:${lineno}: $line"
        }
    }
}

# Count real anchor lines matching `^## <prefix>` outside fences.
# Returns [int].
function Get-BrainAnchorCount {
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$Prefix,
        [Parameter(Mandatory=$true, Position=1)]
        [string]$Path
    )
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return 0 }
    $fence = $false
    $count = 0
    $pattern = '^## ' + [regex]::Escape($Prefix)
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_
        if ($line -match '^```') {
            $fence = -not $fence
            return
        }
        if (-not $fence -and $line -match $pattern) {
            $count++
        }
    }
    return $count
}

# Return $true if file mtime is older than <Days>.
function Test-BrainStale {
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$Path,
        [Parameter(Mandatory=$true, Position=1)]
        [int]$Days
    )
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
    $item = Get-Item -LiteralPath $Path
    $threshold = (Get-Date).AddDays(-$Days)
    return ($item.LastWriteTime -lt $threshold)
}
