# pi-feature-complete <feature-id> [--skip-tests] [--skip-evidence]
#
# - Verifies we're in the feature's worktree on the feature branch
# - Runs build/test (autodetected or from epic-config.yaml) unless --skip-tests
# - Verifies worker-report.md has "## Completion evidence" (non-spike, unless --skip-evidence)
# - Squash-merges feature branch into epic branch
# - Deletes feature branch and worktree, archives feature folder
# - Updates STATE.md, appends run-log entry
#
# Parity: PowerShell sibling of scripts/pi-feature-complete.

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

if ($args.Count -lt 1) {
    [Console]::Error.WriteLine('usage: pi-feature-complete <feature-id> [--skip-tests] [--skip-evidence]')
    exit 1
}
$fid = $args[0]
$skipTests = $false
$skipEvidence = $false
for ($i = 1; $i -lt $args.Count; $i++) {
    switch ($args[$i]) {
        '--skip-tests'    { $skipTests = $true }
        '--skip-evidence' { $skipEvidence = $true }
        default {
            [Console]::Error.WriteLine("unknown flag: $($args[$i])")
            exit 1
        }
    }
}

$script:CallerDir = $PSScriptRoot
. "$PSScriptRoot\_common.ps1"

$repo = Get-RepoRoot
Set-Location -LiteralPath $repo

$epicDir  = Get-ActiveEpicDir
$epicId   = Get-ActiveEpicId
$epicSlug = $epicId -replace '^[0-9]+-', ''

# Find feature folder.
$featDir = $null
$candidates = Get-ChildItem -Path (Join-Path $epicDir 'features') -Directory -Filter "$fid-*" -ErrorAction SilentlyContinue |
              Where-Object { $_.Name -ne 'done' }
if ($candidates) { $featDir = $candidates[0].FullName }
if (-not $featDir -or -not (Test-Path -LiteralPath $featDir)) {
    [Console]::Error.WriteLine("ERROR: feature folder for $fid not found")
    exit 1
}

$featMeta   = Join-Path $featDir 'meta.yaml'
$featBranch = Get-YamlValue $featMeta 'branch'
$worktree   = Get-YamlValue $featMeta 'worktree'

# Detect kind from decomposition.yaml.
$py = Get-PythonExe
$kind = 'feature'
if ($py) {
    $kindScript = @'
import sys, re
p, want = sys.argv[1], sys.argv[2]
cur = None
try:
    f = open(p, encoding="utf-8")
except Exception:
    print("feature"); sys.exit(0)
with f:
    for raw in f:
        s = raw.rstrip("\n").strip()
        if not s or s.startswith("#"): continue
        if s.startswith("- ") and "id:" in s:
            m = re.match(r"^id\s*:\s*(.*)$", s[2:])
            cur = (m.group(1).strip().strip("\"'") if m else None)
            continue
        if cur == want:
            m = re.match(r"^kind\s*:\s*(.*)$", s)
            if m:
                print(m.group(1).strip().strip("\"'")); sys.exit(0)
print("feature")
'@
    $tmp = [System.IO.Path]::GetTempFileName() + '.py'
    [System.IO.File]::WriteAllText($tmp, $kindScript, [System.Text.UTF8Encoding]::new($false))
    try {
        $k = & $py $tmp (Join-Path $epicDir 'decomposition.yaml') $fid 2>$null
        if ($LASTEXITCODE -eq 0 -and $k) { $kind = ($k -join '').Trim() }
    } finally {
        Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
    }
}
if (-not $kind) { $kind = 'feature' }

if (-not $featBranch) { [Console]::Error.WriteLine('ERROR: meta.yaml missing branch'); exit 1 }
if (-not $worktree -or -not (Test-Path -LiteralPath $worktree)) {
    [Console]::Error.WriteLine("ERROR: worktree $worktree not found"); exit 1
}

# Test-command detection.
function Get-DetectedTestCmd {
    param([string]$Repo)
    $pkgJson = Join-Path $Repo 'package.json'
    if (Test-Path -LiteralPath $pkgJson) {
        $node = Get-Command node -ErrorAction SilentlyContinue
        if ($node) {
            $exit = & $node.Source -e "process.exit(require('./package.json').scripts && require('./package.json').scripts.test ? 0 : 1)" 2>$null
            if ($LASTEXITCODE -eq 0) { return 'npm test' }
        }
        return ''
    }
    if (Get-ChildItem -Path $Repo -Filter '*.sln' -ErrorAction SilentlyContinue) { return 'dotnet test' }
    if (Get-ChildItem -Path $Repo -Recurse -Filter '*.csproj' -ErrorAction SilentlyContinue | Select-Object -First 1) { return 'dotnet test' }
    if ((Test-Path -LiteralPath (Join-Path $Repo 'pyproject.toml')) -or (Test-Path -LiteralPath (Join-Path $Repo 'setup.py'))) { return 'pytest' }
    if (Test-Path -LiteralPath (Join-Path $Repo 'go.mod'))    { return 'go test ./...' }
    if (Test-Path -LiteralPath (Join-Path $Repo 'Cargo.toml')) { return 'cargo test' }
    return ''
}

if (-not $skipTests -and $kind -ne 'spike') {
    $testCmd = Get-YamlValue (Join-Path $epicDir 'epic-config.yaml') 'test_cmd'
    if (-not $testCmd) { $testCmd = Get-DetectedTestCmd -Repo $repo }
    if (-not $testCmd) {
        Write-Log 'no test command detected; skipping (set test_cmd in epic-config.yaml)'
    } else {
        Write-Log "running tests in worktree: $testCmd"
        Push-Location $worktree
        try {
            # Invoke through cmd /c to handle pipelines, quoting, env vars.
            & cmd.exe /c $testCmd
            $rc = $LASTEXITCODE
        } finally {
            Pop-Location
        }
        if ($rc -ne 0) {
            [Console]::Error.WriteLine('ERROR: tests failed. Fix or pass --skip-tests to override.')
            Set-YamlValue -File $featMeta -Key 'state' -Value 'halted'
            exit 1
        }
    }
} elseif ($kind -eq 'spike') {
    Write-Log 'spike feature: skipping tests (deliverable is decision artifact)'
}

# Completion-evidence gate (v0.6 / L-???).
if (-not $skipEvidence -and $kind -ne 'spike') {
    $report = Join-Path $featDir 'worker-report.md'
    if (-not (Test-Path -LiteralPath $report)) {
        [Console]::Error.WriteLine("ERROR: worker-report.md missing at $report")
        [Console]::Error.WriteLine('  The worker must emit a report before pi-feature-complete runs.')
        [Console]::Error.WriteLine('  Pass --skip-evidence to merge anyway (NOT recommended).')
        Set-YamlValue -File $featMeta -Key 'state' -Value 'halted'
        exit 1
    }
    $hasEvidence = Select-String -Path $report -Pattern '^## Completion evidence' -Quiet
    if (-not $hasEvidence) {
        [Console]::Error.WriteLine("ERROR: worker-report.md is missing the '## Completion evidence' section.")
        [Console]::Error.WriteLine('  Required for non-spike features as of v0.6 (see agents/feature-worker.md §7).')
        [Console]::Error.WriteLine('  Re-spawn the worker with a hint to add per-AC evidence blocks,')
        [Console]::Error.WriteLine('  or pass --skip-evidence to merge anyway (NOT recommended).')
        Set-YamlValue -File $featMeta -Key 'state' -Value 'halted'
        exit 1
    }
    Write-Log 'completion-evidence section present in worker-report.md'
}

# v0.10 / L-056 — pre-merge deliverables check.
if ($kind -ne 'spike') {
    $decomp = Join-Path $epicDir 'decomposition.yaml'
    $declared = Get-FeatureDeclaredDeliverables -DecompPath $decomp -Fid $fid
    if (-not $declared -or $declared.Count -eq 0) {
        Write-Log 'deliverables check: no declared deliverables; skipping'
    } else {
        Write-Log 'deliverables check: verifying declared deliverable files'
        $epicBranch = "epic/$epicSlug"
        Push-Location $worktree
        try {
            $diffFiles = @(& git diff "$epicBranch..HEAD" --name-only 2>$null)
        } finally {
            Pop-Location
        }
        $fail = $false
        foreach ($line in $declared) {
            if (-not $line) { continue }
            $idx = $line.IndexOf(':')
            $category = $line.Substring(0, $idx)
            $path = $line.Substring($idx + 1)
            if ($category -eq 'changelog') {
                $clPath = Join-Path $worktree 'CHANGELOG.md'
                if (-not (Test-Path -LiteralPath $clPath)) {
                    Write-Log '[warn] changelog_entry is true but CHANGELOG.md does not exist in repo. Consider adding one.'
                } elseif ($diffFiles -notcontains 'CHANGELOG.md') {
                    [Console]::Error.WriteLine("Declared deliverable not produced: CHANGELOG.md (feature $fid). changelog_entry is true but CHANGELOG.md was not modified.")
                    $fail = $true
                } else {
                    if (-not (Select-String -Path $clPath -Pattern '\[Unreleased\]' -Quiet)) {
                        Write-Log '[warn] CHANGELOG.md was modified but has no [Unreleased] section.'
                    }
                }
            } else {
                $fullPath = Join-Path $worktree $path
                if (-not (Test-Path -LiteralPath $fullPath)) {
                    [Console]::Error.WriteLine("Declared deliverable not produced: $path (feature $fid). Worker may have skipped this output; re-dispatch or update decomposition.yaml.")
                    $fail = $true
                } elseif ($diffFiles -notcontains $path) {
                    [Console]::Error.WriteLine("Declared deliverable not produced: $path (feature $fid). Worker may have skipped this output; re-dispatch or update decomposition.yaml.")
                    $fail = $true
                }
            }
        }
        if ($fail) {
            Set-YamlValue -File $featMeta -Key 'state' -Value 'halted'
            exit 1
        }
        Write-Log 'deliverables check: all declared deliverables verified'
    }
}

# Commit any final pending changes in the worktree.
Push-Location $worktree
try {
    & git add -A
    & git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
        & git commit --quiet --no-verify -m "wip: $fid pre-complete"
    }
} finally {
    Pop-Location
}

# L-023: spike epic-branch journal commit (deliverable lives on MAIN_REPO).
if ($kind -eq 'spike') {
    $dirty = & git status --porcelain -- ".pi/epics/$epicId"
    if ($dirty) {
        & git add ".pi/epics/$epicId"
        & git reset --quiet HEAD -- ".pi/epics/$epicId/halt-*.md" 2>$null | Out-Null
        $cached = & git diff --cached --name-only
        if ($cached) {
            & git commit --quiet --no-verify -m "spike($fid): decision + journal"
            Write-Log 'spike: committed MAIN_REPO journal to epic branch'
        }
    }
}

# Switch to epic branch and squash-merge.
& git checkout "epic/$epicSlug" --quiet 2>&1 | ForEach-Object { Write-Stderr $_ }

# Build squash commit message.
$title = Get-YamlValue $featMeta 'title'
$msgPath = [System.IO.Path]::GetTempFileName()
$msgLines = @()
$msgLines += "feat($fid): $title"
$msgLines += ''
$msgLines += "Squash-merge of $featBranch into epic/$epicSlug."
$msgLines += ''
$msgLines += 'Original commits:'
$origCommits = & git log --oneline "epic/$epicSlug..$featBranch"
foreach ($l in $origCommits) { $msgLines += "  $l" }
Set-FileContentLF -Path $msgPath -Content (($msgLines -join "`n") + "`n")

# Try squash. Handle journal-only and parallel-merge conflicts.
& git merge --squash $featBranch --quiet
if ($LASTEXITCODE -ne 0) {
    $journalGlob = ".pi/epics/$epicId/features/$fid-"
    $unmerged = @(& git diff --name-only --diff-filter=U)
    $other = @($unmerged | Where-Object { -not $_.StartsWith($journalGlob) })
    if ($unmerged.Count -gt 0 -and $other.Count -eq 0) {
        Write-Log "auto-resolving journal-only conflicts under ${journalGlob}* (taking epic-branch version)"
        foreach ($p in $unmerged) {
            if (-not $p) { continue }
            & git checkout --ours -- $p
            & git add -- $p
        }
    } else {
        # H6: parallel-merge conflict — classify in-scope vs out-of-scope.
        $scopeDecl = @()
        if ($py) {
            $scopeScript = @'
import sys, re
p, fid = sys.argv[1], sys.argv[2]
in_block = False; cur=None; sf=[]
with open(p, encoding="utf-8") as f:
    for line in f:
        s=line.rstrip("\n")
        if not s.strip() or s.lstrip().startswith("#"): continue
        if s.startswith("  - ") and "id:" in s:
            m=re.match(r"^\s*-\s*id:\s*(\S+)", s)
            cur=m.group(1).strip().strip("\"'") if m else None
            in_block=False
            continue
        if cur==fid:
            m=re.match(r"^\s+scope_files\s*:\s*(.*)$", s)
            if m:
                rest=m.group(1).strip()
                if rest and rest.startswith("["):
                    inner=rest[1:-1].strip()
                    sf=[x.strip().strip("\"'") for x in inner.split(",") if x.strip()]
                    in_block=False
                else:
                    in_block=True
                continue
            if in_block:
                m=re.match(r"^\s+-\s*(.+)$", s)
                if m: sf.append(m.group(1).strip().strip("\"'"))
                else: in_block=False
print("\n".join(sf))
'@
            $tmp = [System.IO.Path]::GetTempFileName() + '.py'
            [System.IO.File]::WriteAllText($tmp, $scopeScript, [System.Text.UTF8Encoding]::new($false))
            try {
                $sout = & $py $tmp (Join-Path $epicDir 'decomposition.yaml') $fid 2>$null
                if ($LASTEXITCODE -eq 0 -and $sout) { $scopeDecl = @($sout | Where-Object { $_ }) }
            } finally {
                Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
            }
        }
        $inScope = @()
        $outScope = @()
        foreach ($cp in $other) {
            if (-not $cp) { continue }
            $matched = $false
            foreach ($decl in $scopeDecl) {
                if ($cp -eq $decl -or $cp.StartsWith("$decl/")) { $matched = $true; break }
            }
            if ($matched) { $inScope += $cp } else { $outScope += $cp }
        }
        Write-Stderr ''
        Write-Stderr "$([char]0x26d4) HALT: H6 - squash-merge conflict (parallel-merge collision)"
        Write-Stderr ''
        if ($inScope.Count -gt 0) {
            Write-Stderr "  In-scope conflicts (declared by $fid in decomposition.yaml):"
            foreach ($p in $inScope) { Write-Stderr "    $p" }
            Write-Stderr '    -> Decomposition predicted disjoint scopes and was wrong.'
            Write-Stderr '       Decomposition-feedback class. Resolve by hand, then either:'
            Write-Stderr '         - retry pi-feature-complete --skip-tests, or'
            Write-Stderr '         - amend decomposition.yaml so future runs serialize these.'
            Write-Stderr ''
        }
        if ($outScope.Count -gt 0) {
            Write-Stderr "  Out-of-scope conflicts (NOT in $fid's declared scope_files):"
            foreach ($p in $outScope) { Write-Stderr "    $p" }
            Write-Stderr '    -> Worker went out of scope and collided with an already-'
            Write-Stderr '       merged sibling feature. Worker-discipline failure; per-'
            Write-Stderr '       feature reviewer should have caught this. Log a deviation.'
            Write-Stderr ''
        }
        Write-Stderr '  Recovery: docs/recovery.md §R9 (parallel-merge conflict).'
        Write-Stderr '  After resolving, re-run pi-feature-complete --skip-tests.'
        # Append deviations entry.
        $devPath = Join-Path $epicDir 'deviations.md'
        $devText = if (Test-Path -LiteralPath $devPath) { Get-FileContentLF $devPath } else { '' }
        $now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $append = "`n### H6: parallel-merge conflict on $fid ($now)`n"
        if ($inScope.Count -gt 0) {
            $append += "`n**In-scope conflicts (decomposition-feedback):**`n"
            foreach ($p in $inScope) { $append += "- $p`n" }
        }
        if ($outScope.Count -gt 0) {
            $append += "`n**Out-of-scope conflicts (worker-discipline):**`n"
            foreach ($p in $outScope) { $append += "- $p`n" }
        }
        Set-FileContentLF -Path $devPath -Content ($devText + $append)
        Set-YamlValue -File $featMeta -Key 'state' -Value 'halted'
        Set-YamlValue -File $featMeta -Key 'halt_code' -Value 'H6'
        exit 1
    }
}

# L-023: spikes commit deliverable to epic branch above; squash may be empty.
& git diff --cached --quiet
$emptyDiff = ($LASTEXITCODE -eq 0)
if (-not $emptyDiff) {
    & git commit --quiet --no-verify -F $msgPath
} elseif ($kind -eq 'spike') {
    & git commit --quiet --no-verify --allow-empty -F $msgPath
    Write-Log 'spike: empty squash committed with --allow-empty (decision landed via journal commit above)'
} else {
    [Console]::Error.WriteLine("ERROR: squash produced empty diff for non-spike feature $fid")
    exit 1
}
Remove-Item -LiteralPath $msgPath -ErrorAction SilentlyContinue
$mergeSha = (& git rev-parse HEAD).Trim()

# Remove worktree + branch.
& git worktree remove $worktree --force
& git branch -D $featBranch | Out-Null

# Archive feature folder.
$doneDir = Join-Path $epicDir 'features\done'
New-Item -ItemType Directory -Path $doneDir -Force | Out-Null
$movedDir = Join-Path $doneDir (Split-Path $featDir -Leaf)
Move-Item -LiteralPath $featDir -Destination $movedDir

$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$movedMeta = Join-Path $movedDir 'meta.yaml'
if (-not (Test-Path -LiteralPath $movedMeta)) {
    Write-Log "WARNING: $movedMeta missing post-merge; reconstructing minimal record"
    $reconstructed = @"
id: $(Split-Path $movedDir -Leaf)
state: merged
branch: $featBranch
worktree: ""
started: ""
updated: $today
merged_at: $today
merge_commit_sha: $mergeSha
last_halt: ""
"@
    Set-FileContentLF -Path $movedMeta -Content $reconstructed
} else {
    $mt = Get-FileContentLF $movedMeta
    $mt = [Regex]::Replace($mt, '(?m)^state:.*$',           'state: merged')
    $mt = [Regex]::Replace($mt, '(?m)^updated:.*$',         "updated: $today")
    $mt = [Regex]::Replace($mt, '(?m)^merged_at:.*$',       "merged_at: $today")
    $mt = [Regex]::Replace($mt, '(?m)^merge_commit_sha:.*$', "merge_commit_sha: $mergeSha")
    Set-FileContentLF -Path $movedMeta -Content $mt
}

# L-023 / L-025: commit features/<fid> → features/done/<fid> rename + meta update.
$dirty = & git status --porcelain -- ".pi/epics/$epicId"
if ($dirty) {
    & git add -A ".pi/epics/$epicId"
    & git reset --quiet HEAD -- ".pi/epics/$epicId/halt-*.md" 2>$null | Out-Null
    $cached = & git diff --cached --name-only
    if ($cached) {
        & git commit --quiet --no-verify -m "chore(epic): archive $fid to features/done/"
        Write-Log 'committed feature archive rename (L-039 --no-verify)'
    }
}

# Reset STATE.md to epic-only.
$def = Get-YamlValue (Join-Path $epicDir 'meta.yaml') 'default_branch'
$statePath = Join-Path $repo '.pi\STATE.md'
$stateContent = @"
# Active epic

``.pi/epics/$epicId/``

Branch: ``epic/$epicSlug`` $([char]0x2192) PR target ``$def``

Last completed feature: ``$fid`` (squash-merge $mergeSha)

Run ``pi-epic-next-feature`` to pick up the next one.
"@
Set-FileContentLF -Path $statePath -Content $stateContent

Add-RunLogEntry -EpicDir $epicDir -Payload "`"event`":`"feature-complete`",`"feature`":`"$fid`",`"merge_sha`":`"$mergeSha`""

Write-Host ''
Write-Host "$([char]0x2713) Feature complete: $fid"
Write-Host "  Squash-merged into epic/$epicSlug as $mergeSha"
Write-Host '  Branch + worktree deleted'
Write-Host "  Folder archived: features/done/$(Split-Path $movedDir -Leaf)"
Write-Host ''
