# pi-epic-complete [--no-pr] [--draft] [--contribute-lesson L-XYZ]
#                  [--skip-extension-check] [--skip-epic-review]
#
# Final epic shipping ritual. See scripts/pi-epic-complete for full
# behaviour. This PowerShell sibling preserves all gates: E2E, L-043
# epic-review, L-042 extension check, full test suite, deviations
# distillation, push + PR creation, archive to .pi/epics/done/.

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$noPr = $false
$draft = $false
$contributeLesson = ''
$skipExtCheck = $false
$skipEpicReview = $false
$i = 0
while ($i -lt $args.Count) {
    switch ($args[$i]) {
        '--no-pr'                 { $noPr = $true; $i++ }
        '--draft'                 { $draft = $true; $i++ }
        '--contribute-lesson'     { $contributeLesson = $args[$i+1]; $i += 2 }
        '--skip-extension-check'  { $skipExtCheck = $true; $i++ }
        '--skip-epic-review'      { $skipEpicReview = $true; $i++ }
        default {
            [Console]::Error.WriteLine("unknown arg: $($args[$i])")
            exit 1
        }
    }
}

$script:CallerDir = $PSScriptRoot
. "$PSScriptRoot\_common.ps1"

# --contribute-lesson L-XYZ: extract and print copy-paste-friendly upstream
# lesson text. Does not modify framework lessons.md.
if ($contributeLesson) {
    $p = Get-UserLessonsPath
    if (-not (Test-Path -LiteralPath $p)) {
        [Console]::Error.WriteLine("ERROR: no user-lessons.md at $p - nothing to contribute.")
        exit 1
    }
    $text = Get-FileContentLF $p
    $lines = $text -split "`n"
    $block = @()
    $found = $false
    foreach ($l in $lines) {
        if ($l -match "^### $([Regex]::Escape($contributeLesson))(:| |$)") {
            $found = $true
            $block += $l
            continue
        }
        if ($found) {
            if ($l -match '^###|^## ') { break }
            $block += $l
        }
    }
    if (-not $found) {
        [Console]::Error.WriteLine("ERROR: lesson $contributeLesson not found in $p")
        exit 1
    }
    Write-Host '# Contribute upstream'
    Write-Host ''
    Write-Host 'Copy the block below into a PR against:'
    Write-Host '  skills/epic-feature-workflow/lessons.md'
    Write-Host 'on https://github.com/shankar029/pi-epicflow'
    Write-Host ''
    Write-Host 'Review it first - strip ANY project-specific names, paths, or internal details.'
    Write-Host ''
    Write-Host "----- BEGIN $contributeLesson -----"
    foreach ($l in $block) { Write-Host $l }
    Write-Host "----- END $contributeLesson -----"
    exit 0
}

$repo = Get-RepoRoot
Set-Location -LiteralPath $repo
$epicDir = Get-ActiveEpicDir
$epicId  = Get-ActiveEpicId
$epicSlug = $epicId -replace '^[0-9]+-', ''
$def = Get-YamlValue (Join-Path $epicDir 'meta.yaml') 'default_branch'

# Check all features merged via pi-epic-next-feature.
$nextShim = Get-Command pi-epic-next-feature -ErrorAction SilentlyContinue
if ($nextShim) {
    $remaining = (& $nextShim.Source 2>$null) -join ''
} else {
    $remaining = (& "$PSScriptRoot\pi-epic-next-feature.ps1" 2>$null) -join ''
}
$remaining = $remaining.Trim()
if ($remaining -ne 'DONE') {
    [Console]::Error.WriteLine("ERROR: epic not done - pi-epic-next-feature returned: $remaining")
    exit 1
}

& git checkout "epic/$epicSlug" --quiet
if (& git status --porcelain) {
    [Console]::Error.WriteLine('ERROR: working tree dirty on epic branch')
    exit 1
}

# v0.10.0 E2E gate (opt-in via epic-config.yaml e2e.enabled: true).
$epicCfg = Join-Path $epicDir 'epic-config.yaml'
$e2eEnabled = Get-YamlValue $epicCfg 'e2e.enabled'
if ($e2eEnabled -ne 'true') {
    Write-Log '[e2e-gate] skipped (e2e.enabled: false)'
} else {
    Write-Log '[e2e-gate] starting...'
    $startCmd    = Get-YamlValue $epicCfg 'e2e.start_cmd'
    $readyCheck  = Get-YamlValue $epicCfg 'e2e.ready_check'
    $readyTimeout = Get-YamlValue $epicCfg 'e2e.ready_timeout_sec'
    $shutdownCmd = Get-YamlValue $epicCfg 'e2e.shutdown_cmd'
    $runCmd      = Get-YamlValue $epicCfg 'e2e.run_cmd'
    if (-not $readyTimeout) { $readyTimeout = 60 } else { $readyTimeout = [int]$readyTimeout }

    # Start app in background via Start-Process (cmd /c).
    $startProc = $null
    $cleanedUp = $false
    function Invoke-E2ECleanup {
        if ($script:cleanedUp) { return }
        $script:cleanedUp = $true
        if ($shutdownCmd) {
            try { & cmd.exe /c $shutdownCmd 2>$null } catch { }
        }
        if ($script:startProc -and -not $script:startProc.HasExited) {
            try { Stop-Process -Id $script:startProc.Id -Force -ErrorAction SilentlyContinue } catch { }
        }
    }

    $logPath = Join-Path $epicDir 'e2e-output.log'
    try {
        $startProc = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', $startCmd) -PassThru -NoNewWindow -RedirectStandardOutput $logPath -RedirectStandardError "$logPath.err"
        $script:startProc = $startProc

        # Poll ready_check.
        $elapsed = 0
        $ready = $false
        while ($elapsed -lt $readyTimeout) {
            & cmd.exe /c $readyCheck 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) { $ready = $true; break }
            Start-Sleep -Seconds 2
            $elapsed += 2
        }
        if (-not $ready) {
            Write-Log "[e2e-gate] ready_check timed out after ${readyTimeout}s"
            Invoke-E2ECleanup
            $haltStamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
            $haltFile = Join-Path $epicDir "halt-h11-e2e-$haltStamp.md"
            $nowIso = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            Set-FileContentLF -Path $haltFile -Content @"
# Halt H11 - E2E gate failure

**Command:** $readyCheck (ready_check timeout)
**Exit code:** 1 (timeout after ${readyTimeout}s)
**Timestamp:** $nowIso
**Output log:** .pi/epics/$epicId/e2e-output.log

## Last 50 lines of output

``````
(ready_check never succeeded within ${readyTimeout}s)
``````

## Recovery

See [docs/recovery.md#r11-e2e-failure](../../docs/recovery.md#r11-e2e-failure)
"@
            exit 1
        }
        Write-Log "[e2e-gate] app ready after ${elapsed}s"

        # Run test command, capture exit code.
        & cmd.exe /c $runCmd 2>&1 | Tee-Object -FilePath $logPath -Append | Out-Null
        $runExit = $LASTEXITCODE

        Invoke-E2ECleanup

        if ($runExit -ne 0) {
            $haltStamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
            $haltFile = Join-Path $epicDir "halt-h11-e2e-$haltStamp.md"
            $nowIso = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            $tail = ''
            if (Test-Path -LiteralPath $logPath) {
                $tail = (Get-Content -LiteralPath $logPath -Tail 50) -join "`n"
            }
            if (-not $tail) { $tail = '(no output)' }
            Set-FileContentLF -Path $haltFile -Content @"
# Halt H11 - E2E gate failure

**Command:** $runCmd
**Exit code:** $runExit
**Timestamp:** $nowIso
**Output log:** .pi/epics/$epicId/e2e-output.log

## Last 50 lines of output

``````
$tail
``````

## Recovery

See [docs/recovery.md#r11-e2e-failure](../../docs/recovery.md#r11-e2e-failure)
"@
            Write-Log "[e2e-gate] FAILED (exit $runExit). Halt file: $haltFile"
            exit 1
        } else {
            $reportSrc = Join-Path $repo 'tests\e2e-report.json'
            $reportDst = Join-Path $epicDir 'e2e-report.json'
            if (Test-Path -LiteralPath $reportSrc) {
                Copy-Item -LiteralPath $reportSrc -Destination $reportDst -Force
            } else {
                $nowIso = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
                $runCmdJson = ConvertTo-JsonString $runCmd
                Set-FileContentLF -Path $reportDst -Content "{`"schema_version`":1,`"exit_code`":0,`"run_cmd`":`"$runCmdJson`",`"completed_at`":`"$nowIso`"}"
            }
            Write-Log "[e2e-gate] passed. Report: $reportDst"
        }
    } finally {
        Invoke-E2ECleanup
    }
}

# v0.7.0 / L-043 epic-review gate.
if (-not $skipEpicReview) {
    $epicReviewFile = Join-Path $epicDir 'epic-review.md'
    if (-not (Test-Path -LiteralPath $epicReviewFile)) {
        [Console]::Error.WriteLine("$([char]0x2716) HALT (L-043): no epic-review.md at $epicReviewFile.")
        [Console]::Error.WriteLine('   pi-epic-complete refuses to archive an epic without an end-to-end review.')
        [Console]::Error.WriteLine('   Run the orchestrator''s epic-review step, or invoke the agent directly.')
        [Console]::Error.WriteLine('   Escape hatch (logs a warning, NOT the default path):')
        [Console]::Error.WriteLine('     pi-epic-complete --skip-epic-review')
        exit 1
    }
    # Last non-empty line should contain "Verdict: APPROVE_EPIC".
    $verdictLine = ''
    $lines = (Get-FileContentLF $epicReviewFile) -split "`n"
    foreach ($l in $lines) { if ($l.Trim()) { $verdictLine = $l } }
    if ($verdictLine -match 'Verdict:.*APPROVE_EPIC') {
        Write-Log 'epic-review verdict: APPROVE_EPIC - gate passed.'
    } elseif ($verdictLine -match 'Verdict:.*(REQUEST_CHANGES_EPIC|BLOCK_EPIC)') {
        [Console]::Error.WriteLine("$([char]0x2716) HALT (L-043): epic-review verdict is not APPROVE_EPIC.")
        [Console]::Error.WriteLine("   Last line of $($epicReviewFile):")
        [Console]::Error.WriteLine("     $verdictLine")
        [Console]::Error.WriteLine('   Address the findings, then re-run the reviewer. Do NOT bypass unless you understand why.')
        exit 1
    } else {
        [Console]::Error.WriteLine("$([char]0x2716) HALT (L-043): epic-review.md exists but has no parseable Verdict: line.")
        [Console]::Error.WriteLine("   Last line read: $verdictLine")
        [Console]::Error.WriteLine('   The feature-epic-reviewer contract requires the LAST non-empty line to be:')
        [Console]::Error.WriteLine('     Verdict: APPROVE_EPIC | REQUEST_CHANGES_EPIC | BLOCK_EPIC')
        exit 1
    }
} else {
    [Console]::Error.WriteLine("$([char]0x26a0)  --skip-epic-review used: bypassing the L-043 epic-review gate.")
    [Console]::Error.WriteLine('   This is a documented escape hatch (spike epics, smoke tests, emergencies)')
    [Console]::Error.WriteLine('   but means no cross-feature consistency check ran. Logged to run-log.jsonl.')
    Add-RunLogEntry -EpicDir $epicDir -Payload "`"event`":`"epic-review-skipped`",`"epic`":`"$epicId`""
}

# v0.6.3 / L-042 extension guardrails.
$metaPath = Join-Path $epicDir 'meta.yaml'
$metaText = Get-FileContentLF $metaPath
if ($metaText -match '(?m)^extensions:') {
    $extCount = 0
    $inExt = $false
    foreach ($l in ($metaText -split "`n")) {
        if ($l -match '^extensions:') { $inExt = $true; continue }
        if ($inExt -and $l -match '^[A-Za-z]') { $inExt = $false }
        if ($inExt -and $l -match '^  - ') { $extCount++ }
    }
    if ($extCount -gt 0) {
        $decompText = Get-FileContentLF (Join-Path $epicDir 'decomposition.yaml')
        $totalFeats = ([regex]::Matches($decompText, '(?m)^  - id:')).Count
        $origFeats = Get-YamlValue $metaPath 'original_feature_count'
        $added = '?'
        $pct = '?'
        if ($origFeats -and ($origFeats -match '^\d+$') -and ([int]$origFeats -gt 0)) {
            $origFeats = [int]$origFeats
            $added = $totalFeats - $origFeats
            if ($added -lt 0) { $added = 0 }
            $pct = [int](($added * 100) / $origFeats)
        }
        [Console]::Error.WriteLine("$([char]0x26a0)  This epic has been extended $extCount time(s).")
        if ($pct -ne '?') {
            [Console]::Error.WriteLine("   Feature growth: $origFeats -> $totalFeats (+$pct%; $added added).")
        } else {
            [Console]::Error.WriteLine("   Feature count now: $totalFeats (original count not recorded).")
        }
        if (($pct -ne '?') -and ($pct -ge 30)) {
            $recorded = 0
            $devPath = Join-Path $epicDir 'deviations.md'
            if ((Test-Path -LiteralPath $devPath) -and (Select-String -Path $devPath -Pattern 'Decomposition lesson:' -Quiet)) {
                $recorded = 1
            }
            if (-not $recorded) {
                [Console]::Error.WriteLine("$([char]0x2716) HALT (L-042): extension growth >= 30% but no decomposition lesson recorded.")
                [Console]::Error.WriteLine('   Either add a "Decomposition lesson: ..." line to deviations.md explaining why')
                [Console]::Error.WriteLine('   the original scope under-shot, or re-run with --skip-extension-check.')
                if (-not $skipExtCheck) { exit 1 }
            }
        }
    }
}

Write-Log "fetching latest $def..."
& git fetch --quiet origin $def 2>&1 | Out-Null
& git rebase "origin/$def" --quiet
if ($LASTEXITCODE -ne 0) {
    & git rebase $def --quiet
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine("ERROR: rebase onto $def failed; resolve conflicts and retry")
        exit 1
    }
}

# Detect and run full test suite.
function Get-DetectedTestCmd2 {
    param([string]$Repo)
    $pkgJson = Join-Path $Repo 'package.json'
    if (Test-Path -LiteralPath $pkgJson) {
        $node = Get-Command node -ErrorAction SilentlyContinue
        if ($node) {
            & $node.Source -e "process.exit(require('./package.json').scripts && require('./package.json').scripts.test ? 0 : 1)" 2>$null
            if ($LASTEXITCODE -eq 0) { return 'npm test' }
        }
        return ''
    }
    if (Get-ChildItem -Path $Repo -Filter '*.sln' -ErrorAction SilentlyContinue) { return 'dotnet test' }
    if ((Test-Path -LiteralPath (Join-Path $Repo 'pyproject.toml'))) { return 'pytest' }
    if (Test-Path -LiteralPath (Join-Path $Repo 'go.mod'))    { return 'go test ./...' }
    if (Test-Path -LiteralPath (Join-Path $Repo 'Cargo.toml')) { return 'cargo test' }
    return ''
}
$testCmd = Get-YamlValue $epicCfg 'test_cmd'
if (-not $testCmd) { $testCmd = Get-DetectedTestCmd2 -Repo $repo }
if ($testCmd) {
    Write-Log "running full test suite: $testCmd"
    & cmd.exe /c $testCmd
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine('ERROR: tests failed on epic branch')
        exit 1
    }
}

# Distill deviations into lessons-candidate.md.
$candidate = Join-Path $epicDir 'lessons-candidate.md'
$devPath = Join-Path $epicDir 'deviations.md'
if (Test-Path -LiteralPath $devPath) {
    $devText = Get-FileContentLF $devPath
    $body = @"
# Lessons candidates from $epicId

> Pi reviews this file, removes epic-specific noise, and appends the
> generalizable rules to ~/.pi/agent/skills/epic-feature-workflow/lessons.md

## Source deviations

$devText
"@
    Set-FileContentLF -Path $candidate -Content $body
    Write-Log "distilled deviations -> $candidate (review and append to global lessons.md)"
}

# v0.6.2 / L-036: append distilled lessons to per-machine user-lessons.md.
if (Test-Path -LiteralPath $candidate) {
    Add-UserLessonsFromCandidate -Candidate $candidate -EpicId $epicId
}

# Build PR body.
$prBody = [System.IO.Path]::GetTempFileName()
$bodyLines = @()
$title = Get-YamlValue $metaPath 'title'
$bodyLines += "## Epic: $title"
$bodyLines += ''
$bodyLines += "Implements [``design.md``](.pi/epics/$epicId/design.md)."
$bodyLines += ''
$bodyLines += '### Features merged'
$bodyLines += ''
$doneRoot = Join-Path $epicDir 'features\done'
if (Test-Path -LiteralPath $doneRoot) {
    foreach ($sub in (Get-ChildItem -Path $doneRoot -Directory -ErrorAction SilentlyContinue)) {
        $t = Get-YamlValue (Join-Path $sub.FullName 'meta.yaml') 'title'
        $sha = Get-YamlValue (Join-Path $sub.FullName 'meta.yaml') 'merge_commit_sha'
        $shortSha = if ($sha -and $sha.Length -ge 8) { $sha.Substring(0,8) } else { $sha }
        $bodyLines += "- **$($sub.Name)** - $t (``$shortSha``)"
    }
}
$bodyLines += ''
if ((Test-Path -LiteralPath $devPath) -and ((Get-Item $devPath).Length -gt 0)) {
    if (Select-String -Path $devPath -Pattern '^### ' -Quiet) {
        $bodyLines += '### Deviations from plan'
        $bodyLines += ''
        $bodyLines += "See ``.pi/epics/$epicId/deviations.md`` for the full log; lessons distilled to ``lessons-candidate.md``."
        $bodyLines += ''
    }
}
$bodyLines += '### Design decisions'
$bodyLines += ''
$designPath = Join-Path $epicDir 'design.md'
$designText = Get-FileContentLF $designPath
$m = [Regex]::Match($designText, '(?ms)^## 4\. Decisions log\s*\n(.*?)(?=^## )')
if ($m.Success) {
    $bodyLines += $m.Groups[1].Value.TrimEnd()
}
Set-FileContentLF -Path $prBody -Content ($bodyLines -join "`n")

# Push + PR.
if (-not $noPr) {
    & git remote get-url origin 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Log "no 'origin' remote configured - skipping push + PR."
        Write-Log "epic/$epicSlug archived locally. To publish later:"
        Write-Log "  git remote add origin <url> && git push -u origin epic/$epicSlug"
        Write-Log "  (PR body draft: $prBody)"
    } else {
        Write-Log "pushing epic/$epicSlug..."
        & git push --set-upstream origin "epic/$epicSlug" --quiet
        $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
        if ($ghCmd) {
            Write-Log 'opening PR with gh...'
            $ghArgs = @('pr','create','--base',$def,'--head',"epic/$epicSlug",'--title',$title,'--body-file',$prBody)
            if ($draft) { $ghArgs += '--draft' }
            & $ghCmd.Source @ghArgs
            if ($LASTEXITCODE -ne 0) {
                Write-Log "gh pr create failed; you can run it manually with the body in $prBody"
            }
        } else {
            Write-Log 'gh CLI not available. Push complete; create PR manually:'
            Write-Host ''
            Write-Host "  Base: $def"
            Write-Host "  Head: epic/$epicSlug"
            Write-Host "  Body: $prBody"
            Write-Host ''
        }
    }
}

# Archive epic folder. Prefer `git mv` (preserves history). L-025.
$doneRoot = Join-Path $repo '.pi\epics\done'
New-Item -ItemType Directory -Path $doneRoot -Force | Out-Null
Set-YamlValue -File $metaPath -Key 'status' -Value 'done'
Update-YamlUpdated -File $metaPath

if (& git status --porcelain -- ".pi/epics/$epicId/meta.yaml") {
    & git add ".pi/epics/$epicId/meta.yaml"
}

$destDir = Join-Path $doneRoot $epicId
& git mv $epicDir $destDir 2>$null
if ($LASTEXITCODE -ne 0) {
    Move-Item -LiteralPath $epicDir -Destination $destDir
    & git add -A ".pi/epics/$epicId" 2>$null | Out-Null
}
& git add -A ".pi/epics/done/$epicId" 2>$null | Out-Null
& git reset --quiet HEAD -- ".pi/epics/done/$epicId/halt-*.md" 2>$null | Out-Null

if (& git diff --cached --name-only) {
    & git commit --quiet --no-verify -m "chore(epic): archive $epicId to .pi/epics/done/"
    Write-Log 'committed epic archive rename (L-025, L-039 --no-verify)'
}

# Reset STATE.md.
Set-FileContentLF -Path (Join-Path $repo '.pi\STATE.md') -Content @"
# Active feature: (none)

Last shipped epic: ``.pi/epics/done/$epicId/``
"@

$userLessons = Get-UserLessonsPath
Write-Host ''
Write-Host "$([char]0x2713) Epic complete: $epicId"
Write-Host "  Branch: epic/$epicSlug pushed; PR opened (if gh available)."
Write-Host "  Folder archived: .pi/epics/done/$epicId/"
Write-Host "  Lessons candidate: .pi/epics/done/$epicId/lessons-candidate.md"
Write-Host "  User lessons:      $userLessons (machine-private, agents read this)"
Write-Host ''
Write-Host 'Manually review lessons-candidate.md. To CONTRIBUTE a specific lesson upstream'
Write-Host 'to pi-epicflow (after stripping project-specific names), run:'
Write-Host ''
Write-Host '  pi-epic-complete --contribute-lesson L-XYZ'
Write-Host ''
Write-Host 'Project-specific lessons stay in your user-lessons.md and are read by agents'
Write-Host 'automatically.'
Write-Host ''
