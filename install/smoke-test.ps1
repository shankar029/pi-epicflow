# install/smoke-test.ps1 — Windows sibling of smoke-test.sh.
#
# Validates the native PowerShell port end-to-end. Mirrors the most
# important phases of the bash smoke test (init → decomp → next →
# start → complete → next-DONE → extend → epic-complete) so the two
# implementations stay in parity.
#
# The bash smoke test runs 29 phases on POSIX; this PS sibling runs 8
# core phases (the happy-path contract validated during Phase 2 & 3
# dogfood). Edge-case lessons (L-029, L-030, L-032, L-035, L-038,
# L-040, L-045, L-046, L-049, L-053) are exercised by the bash side
# only — the shared logic (validate_decomposition.py, meta.yaml
# format, run-log schema) is OS-independent and only needs one canary.
#
# Usage:
#   pwsh -NoProfile -ExecutionPolicy Bypass -File install\smoke-test.ps1
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File install\smoke-test.ps1
#
# Exit codes:
#   0 — all assertions pass
#   1 — any assertion fails

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$repoRoot   = (Resolve-Path "$PSScriptRoot\..").Path
$scriptsDir = Join-Path $repoRoot 'skills\epic-feature-workflow\scripts-win'
$env:Path = "$scriptsDir;$env:Path"

$sandbox = Join-Path $env:TEMP ("pi-epicflow-smoke-" + [Guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Path $sandbox | Out-Null
$cleanupPaths = @($sandbox, "$env:TEMP\pi-epicflow-smoke-design.md", "$env:TEMP\pi-epicflow-smoke-F01")

function Cleanup {
    foreach ($p in $cleanupPaths) {
        if (Test-Path -LiteralPath $p) {
            Remove-Item -Recurse -Force -LiteralPath $p -ErrorAction SilentlyContinue
        }
    }
    # Best-effort: remove any feature worktrees the test created
    Get-ChildItem -Path $env:TEMP -Directory -Filter 'pi-epicflow-smoke-*-F*' -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue }
}

$script:failed = 0
function Pass([string]$m) { Write-Host "  [PASS] $m" -ForegroundColor Green }
function Fail([string]$m) { Write-Host "  [FAIL] $m" -ForegroundColor Red; $script:failed++ }
function Heading([string]$m) { Write-Host ""; Write-Host $m -ForegroundColor Cyan }

# Each pi-* call: route .cmd shim output, ignore stderr noise.
function PiRun {
    param([string]$Cmd, [string[]]$ScriptArgs)
    $exe = Join-Path $scriptsDir "$Cmd.ps1"
    if ($null -eq $ScriptArgs) { $ScriptArgs = @() }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $exe @ScriptArgs 2>&1 | Out-Null
    return $LASTEXITCODE
}

function PiRunCapture {
    param([string]$Cmd, [string[]]$ScriptArgs)
    $exe = Join-Path $scriptsDir "$Cmd.ps1"
    if ($null -eq $ScriptArgs) { $ScriptArgs = @() }
    $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $exe @ScriptArgs 2>&1
    return @{ ExitCode = $LASTEXITCODE; Output = ($out -join "`n") }
}

Write-Host "=== pi-epicflow Windows smoke test ==="
Write-Host "sandbox: $sandbox"
Write-Host "scripts: $scriptsDir"

try {
    Set-Location $sandbox
    & git init -q -b main 2>&1 | Out-Null
    & git config user.email 'smoke@local' 2>&1 | Out-Null
    & git config user.name 'Smoke' 2>&1 | Out-Null
    & git config core.autocrlf false 2>&1 | Out-Null
    & git config commit.gpgsign false 2>&1 | Out-Null
    '# smoke' | Set-Content README.md
    & git add README.md 2>&1 | Out-Null
    & git commit -qm 'init' 2>&1 | Out-Null

    # ============== [0/8] C-003 parity check ==============
    Heading '[0/8] C-003 parity check: scripts/ <-> scripts-win/'
    $bashDir = Join-Path $repoRoot 'skills\epic-feature-workflow\scripts'
    $winDir  = Join-Path $repoRoot 'skills\epic-feature-workflow\scripts-win'
    $missing = 0
    Get-ChildItem -LiteralPath $bashDir -File | Where-Object { $_.Name -notlike '_*' } | ForEach-Object {
        $ps = Join-Path $winDir ($_.Name + '.ps1')
        if (-not (Test-Path -LiteralPath $ps)) {
            Fail "missing scripts-win/$($_.Name).ps1"
            $missing++
        }
    }
    if ($missing -eq 0) {
        Pass 'every bash script in scripts/ has a corresponding scripts-win/*.ps1'
    }

    # ============== [1/8] pi-epic-init ==============
    Heading '[1/8] pi-epic-init'
    @'
# Smoke
Two features.
'@ | Set-Content "$env:TEMP\pi-epicflow-smoke-design.md"

    $rc = PiRun 'pi-epic-init' @('smoke', '--from', "$env:TEMP\pi-epicflow-smoke-design.md", '--title', 'smoke')
    if ($rc -ne 0) { Fail "pi-epic-init exit $rc" } else {
        $epicId = (Get-ChildItem -Path .pi\epics -Directory -ErrorAction SilentlyContinue |
                   Where-Object { $_.Name -match '^0[0-9]+-' } | Select-Object -First 1).Name
        if ($epicId) { Pass "epic created: $epicId" } else { Fail 'no epic dir' }
        $br = (& git rev-parse --abbrev-ref HEAD).Trim()
        if ($br -eq 'epic/smoke') { Pass 'on epic branch' } else { Fail "wrong branch: $br" }
    }

    # ============== [2/8] decomposition.yaml ==============
    Heading '[2/8] decomposition.yaml'
    @'
features:
  - id: F01
    slug: hello
    summary: print hello
    kind: feature
    depends_on: []
    scope_files: [hello.txt]
    acceptance_criteria:
      - hello.txt exists
    estimated_hours: 1
  - id: F02
    slug: world
    summary: print world
    kind: feature
    depends_on: [F01]
    scope_files: [world.txt]
    acceptance_criteria:
      - world.txt exists
    estimated_hours: 1
'@ | Set-Content ".pi\epics\$epicId\decomposition.yaml"
    & git add ".pi/epics/$epicId/decomposition.yaml" 2>&1 | Out-Null
    & git commit -qm 'add decomposition' 2>&1 | Out-Null
    Pass 'decomposition.yaml written'

    # ============== [3/8] pi-epic-validate-decomposition ==============
    Heading '[3/8] pi-epic-validate-decomposition'
    $res = PiRunCapture 'pi-epic-validate-decomposition' @()
    if ($res.ExitCode -eq 0) { Pass 'validator exits 0 on valid decomp' } else { Fail "validator exit $($res.ExitCode); output: $($res.Output)" }

    # ============== [4/8] pi-epic-next-feature (initial) ==============
    Heading '[4/8] pi-epic-next-feature (initial)'
    $res = PiRunCapture 'pi-epic-next-feature' @()
    $next = $res.Output.Trim()
    if ($next -eq 'F01') { Pass 'F01 is next (no deps)' } else { Fail "expected F01, got: '$next'" }

    # ============== [5/8] pi-feature-start F01 ==============
    Heading '[5/8] pi-feature-start F01'
    $rc = PiRun 'pi-feature-start' @('F01')
    if ($rc -ne 0) { Fail "pi-feature-start exit $rc" } else {
        $wtPath = Join-Path (Split-Path $sandbox -Parent) ((Split-Path $sandbox -Leaf) + '-F01')
        if (Test-Path -LiteralPath $wtPath) {
            Pass "worktree created: $wtPath"
        } else {
            Fail "worktree missing: $wtPath"
        }
        # halt-*.md should NOT leak into pending-edits auto-commit (none exist anyway here, just confirm)
        $stagedHalt = & git -C $sandbox log --name-only --pretty=format: | Select-String -Pattern '^\.pi/.*halt-' -Quiet
        if (-not $stagedHalt) { Pass 'no halt-*.md leaked into commit history' } else { Fail 'halt-*.md leaked' }
    }

    # ============== [6/8] simulate worker + pi-feature-complete F01 ==============
    Heading '[6/8] worker work + pi-feature-complete F01'
    $wt = Join-Path (Split-Path $sandbox -Parent) ((Split-Path $sandbox -Leaf) + '-F01')
    Push-Location $wt
    'hello' | Set-Content hello.txt
    & git add hello.txt 2>&1 | Out-Null
    & git commit -qm 'feat: hello' 2>&1 | Out-Null
    Pop-Location

    $featDir = Join-Path $sandbox ".pi\epics\$epicId\features\F01-hello"
    @"
# F01 worker report

## Completion evidence
- hello.txt created and committed.
"@ | Set-Content (Join-Path $featDir 'worker-report.md')

    $rc = PiRun 'pi-feature-complete' @('F01')
    if ($rc -ne 0) { Fail "pi-feature-complete exit $rc" } else {
        # F01 should be archived
        $arch = Join-Path $sandbox ".pi\epics\$epicId\features\done"
        if ((Test-Path -LiteralPath $arch) -and (Get-ChildItem $arch -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'F01' })) {
            Pass 'F01 archived to features/done/'
        } else {
            Fail 'F01 not archived'
        }
        # hello.txt should be on epic branch
        if (Test-Path -LiteralPath (Join-Path $sandbox 'hello.txt')) {
            Pass 'hello.txt landed on epic branch'
        } else {
            Fail 'hello.txt missing from epic branch'
        }
    }

    # ============== [7/8] pi-epic-next-feature dispatches F02, then DONE ==============
    Heading '[7/8] DAG dispatch: F02 then DONE'
    $res = PiRunCapture 'pi-epic-next-feature' @()
    $next = $res.Output.Trim()
    if ($next -eq 'F02') { Pass 'F02 is next after F01' } else { Fail "expected F02, got: '$next'" }

    $rc = PiRun 'pi-feature-start' @('F02')
    if ($rc -ne 0) { Fail "pi-feature-start F02 exit $rc" }
    $wt2 = Join-Path (Split-Path $sandbox -Parent) ((Split-Path $sandbox -Leaf) + '-F02')
    Push-Location $wt2
    'world' | Set-Content world.txt
    & git add world.txt 2>&1 | Out-Null
    & git commit -qm 'feat: world' 2>&1 | Out-Null
    Pop-Location
    $featDir2 = Join-Path $sandbox ".pi\epics\$epicId\features\F02-world"
    "# F02`n## Completion evidence`nworld.txt created" | Set-Content (Join-Path $featDir2 'worker-report.md')
    $rc = PiRun 'pi-feature-complete' @('F02')
    if ($rc -ne 0) { Fail "pi-feature-complete F02 exit $rc" }
    $res = PiRunCapture 'pi-epic-next-feature' @()
    $next = $res.Output.Trim()
    if ($next -eq 'DONE') { Pass 'DONE after all features merged' } else { Fail "expected DONE, got: '$next'" }

    # ============== [8/8] pi-epic-complete + L-043 gate + pi-epic-extend ==============
    Heading '[8/8] pi-epic-complete --no-pr + pi-epic-extend round-trip'

    # L-043: missing epic-review.md must halt
    $res = PiRunCapture 'pi-epic-complete' @('--no-pr')
    if ($res.ExitCode -ne 0 -and ($res.Output -match 'L-043')) {
        Pass 'L-043 gate halts when epic-review.md missing'
    } else {
        Fail "L-043 gate did not halt (exit=$($res.ExitCode))"
    }

    # Write APPROVE_EPIC review and retry
    @'
# Epic review
All features clean.

Verdict: APPROVE_EPIC
'@ | Set-Content ".pi\epics\$epicId\epic-review.md"
    & git add ".pi/epics/$epicId/epic-review.md" 2>&1 | Out-Null
    & git commit -q --no-verify -m 'docs: epic review' 2>&1 | Out-Null

    $rc = PiRun 'pi-epic-complete' @('--no-pr')
    if ($rc -ne 0) { Fail "pi-epic-complete exit $rc" } else {
        if (Test-Path -LiteralPath ".pi\epics\done\$epicId") {
            Pass "epic archived to .pi/epics/done/$epicId"
        } else {
            Fail 'epic not archived'
        }
        if (-not (Test-Path -LiteralPath ".pi\epics\$epicId")) {
            Pass 'active epic dir cleared'
        } else {
            Fail 'active epic dir still present'
        }
    }

    # pi-epic-extend round-trip: un-archive, status flip
    $rc = PiRun 'pi-epic-extend' @($epicId, '--rationale', 'add F03 for verification', '--title', 'Verification phase')
    if ($rc -ne 0) { Fail "pi-epic-extend exit $rc" } else {
        if (Test-Path -LiteralPath ".pi\epics\$epicId") {
            Pass 'extend un-archived epic'
        } else {
            Fail 'epic not un-archived'
        }
        $metaText = Get-Content -Raw ".pi\epics\$epicId\meta.yaml"
        if ($metaText -match 'status: in-progress') {
            Pass 'status flipped to in-progress'
        } else {
            Fail 'status not flipped'
        }
        if ($metaText -match 'original_feature_count: 2') {
            Pass 'original_feature_count snapshot recorded (L-042)'
        } else {
            Fail 'original_feature_count not recorded'
        }
    }

    # ============== run-log.jsonl validity check ==============
    Heading '[+] run-log.jsonl strict JSON validation'
    $logPath = ".pi\epics\$epicId\run-log.jsonl"
    if (Test-Path -LiteralPath $logPath) {
        $lines = Get-Content -LiteralPath $logPath | Where-Object { $_.Trim() }
        $bad = 0
        foreach ($l in $lines) {
            try {
                $null = $l | ConvertFrom-Json -ErrorAction Stop
            } catch {
                Fail "invalid JSON line: $l"
                $bad++
            }
        }
        if ($bad -eq 0) { Pass "$($lines.Count) run-log lines all valid JSON" }
    } else {
        Fail 'run-log.jsonl missing'
    }

    Write-Host ''
    if ($script:failed -eq 0) {
        Write-Host '[OK] Windows smoke test passed' -ForegroundColor Green
        exit 0
    } else {
        Write-Host "[FAIL] $($script:failed) assertion(s) failed" -ForegroundColor Red
        exit 1
    }
}
finally {
    Set-Location $repoRoot
    Cleanup
}
