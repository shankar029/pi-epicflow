# Common helpers for epic-feature-workflow PowerShell scripts.
# Dot-source from each script: . "$PSScriptRoot\_common.ps1"
#
# Parity contract: every public function in this module mirrors a helper
# in scripts/_common.sh. Behavior (inputs → outputs, side effects, exit
# codes) must match. See PLAN-v0.12.0.md §"Parity rules".
#
# Target: PowerShell 5.1 (ships on every Windows). No PS7-only syntax.

# Parity-with-bash error model:
#   bash `set -e` exits only on non-zero exit codes, NOT on stderr output.
#   PowerShell's `Stop` mode terminates on ANY native-command stderr (even
#   when the command succeeded), which breaks parity — e.g. `git symbolic-ref`
#   on a repo without origin/HEAD writes "fatal: ..." to stderr and returns
#   1, and the bash version falls through. We use `Continue` and rely on
#   explicit `$LASTEXITCODE -ne 0` checks everywhere a native command runs.
$ErrorActionPreference = 'Continue'

# Make console render the unicode glyphs (✓ ✗ ⚠ → —) correctly even on
# legacy code pages. Idempotent; no-op if already UTF-8.
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch { }

# Determine __SCRIPT_DIR equivalent: callers set $script:CallerDir before
# dot-sourcing, OR we fall back to $PSScriptRoot of this file (works for
# direct module use but loses caller-side resolution).
function Get-CallerScriptDir {
    if ($script:CallerDir) { return $script:CallerDir }
    return $PSScriptRoot
}

# Write a line to STDERR (bash `echo ... >&2` equivalent).
function Write-Stderr {
    param([Parameter(Mandatory)][string]$Message)
    [Console]::Error.WriteLine($Message)
}

# Resolve repo root (must be in a git repo).
function Get-RepoRoot {
    $r = & git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $r) {
        Write-Stderr "ERROR: not in a git repository"
        exit 1
    }
    return $r.Trim()
}

# Resolve skill root from caller's script dir (parallels skill_root()).
function Get-SkillRoot {
    $d = Get-CallerScriptDir
    if (-not $d) { return $null }
    return (Resolve-Path (Join-Path $d '..')).Path
}

# Active epic ID from STATE.md.
function Get-ActiveEpicId {
    $repo = Get-RepoRoot
    $state = Join-Path $repo '.pi\STATE.md'
    if (-not (Test-Path -LiteralPath $state)) {
        Write-Stderr "ERROR: no .pi/STATE.md at $repo. Are you in a feature worktree?"
        Write-Stderr "       cd to the main repo (the checkout that has .pi/STATE.md) and retry."
        return $null
    }
    $line = Select-String -Path $state -Pattern '\.pi/epics/([0-9]{4}-[a-z0-9-]+)' |
            Select-Object -First 1
    if (-not $line) { return $null }
    return $line.Matches[0].Groups[1].Value
}

# Active epic folder.
function Get-ActiveEpicDir {
    $repo = Get-RepoRoot
    $id = Get-ActiveEpicId
    if (-not $id) { return $null }
    return (Join-Path $repo ".pi\epics\$id")
}

# Active feature ID from STATE.md (or null).
function Get-ActiveFeatureId {
    $repo = Get-RepoRoot
    $state = Join-Path $repo '.pi\STATE.md'
    if (-not (Test-Path -LiteralPath $state)) { return $null }
    $line = Select-String -Path $state -Pattern 'F[0-9]{2}-[a-z0-9-]+' |
            Select-Object -First 1
    if (-not $line) { return $null }
    return $line.Matches[0].Value
}

# Default branch detection. Prefers epic meta's default_branch:, else
# falls back to origin/HEAD, else "main".
function Get-DefaultBranch {
    $repo = Get-RepoRoot
    Push-Location $repo
    try {
        $fromMeta = $null
        $state = Join-Path $repo '.pi\STATE.md'
        if (Test-Path -LiteralPath $state) {
            $eid = Get-ActiveEpicId
            if ($eid) {
                $meta = Join-Path $repo ".pi\epics\$eid\meta.yaml"
                if (Test-Path -LiteralPath $meta) {
                    $m = Select-String -Path $meta -Pattern '^default_branch:\s*(.+)$' |
                         Select-Object -First 1
                    if ($m) {
                        $fromMeta = $m.Matches[0].Groups[1].Value.Trim().Trim('"').Trim("'")
                    }
                }
            }
        }
        if ($fromMeta) { return $fromMeta }
        $sym = & git symbolic-ref --short refs/remotes/origin/HEAD 2>$null
        if ($LASTEXITCODE -eq 0 -and $sym) {
            return ($sym.Trim() -replace '^origin/', '')
        }
        return 'main'
    } finally {
        Pop-Location
    }
}

# Next epic ID (NNNN, zero-padded).
function Get-NextEpicId {
    $repo = Get-RepoRoot
    $max = 0
    $dirs = @()
    foreach ($base in @('.pi\epics', '.pi\epics\done')) {
        $full = Join-Path $repo $base
        if (Test-Path -LiteralPath $full) {
            $dirs += Get-ChildItem -LiteralPath $full -Directory -ErrorAction SilentlyContinue |
                     Where-Object { $_.Name -match '^([0-9]{4})-' }
        }
    }
    foreach ($d in $dirs) {
        $n = [int]($d.Name.Substring(0, 4))
        if ($n -gt $max) { $max = $n }
    }
    return ('{0:D4}' -f ($max + 1))
}

# Slugify: lowercase, non-alnum -> '-', trim leading/trailing '-'.
function ConvertTo-Slug {
    param([Parameter(Mandatory)][string]$Text)
    $s = $Text.ToLowerInvariant()
    $s = [Regex]::Replace($s, '[^a-z0-9]+', '-')
    $s = $s.Trim('-')
    return $s
}

# Tiny YAML reader for our flat schema. Mirrors yaml_get in _common.sh.
# Supports top-level scalars and dotted paths for one-level nested objects.
function Get-YamlValue {
    param(
        [Parameter(Mandatory)][string]$File,
        [Parameter(Mandatory)][string]$Key
    )
    if (-not (Test-Path -LiteralPath $File)) { return '' }
    $py = Get-PythonExe
    if (-not $py) { return '' }

    # Use the shared Python helper if available; otherwise fall back to
    # inline. The shared file is introduced in Phase 3a.
    $skill = Get-SkillRoot
    $sharedHelper = $null
    if ($skill) {
        $candidate = Join-Path $skill 'lib\yaml_helpers.py'
        if (Test-Path -LiteralPath $candidate) { $sharedHelper = $candidate }
    }

    if ($sharedHelper) {
        $out = & $py $sharedHelper 'get' $File $Key 2>$null
        if ($LASTEXITCODE -eq 0) { return ($out -join "`n").TrimEnd("`r","`n") }
        return ''
    }

    # Inline fallback — keep behavior identical to bash heredoc.
    $script = @'
import sys, re
path, key = sys.argv[1], sys.argv[2]
parts = key.split('.')
data = {}
stack = [(0, data)]
cur_key = None
with open(path, encoding='utf-8') as f:
    for raw in f:
        line = raw.rstrip('\n')
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        indent = len(line) - len(line.lstrip(' '))
        s = line.strip()
        while stack and indent < stack[-1][0]:
            stack.pop()
        ctx = stack[-1][1]
        if s.startswith('- '):
            continue
        m = re.match(r'^([A-Za-z0-9_]+)\s*:\s*(.*)$', s)
        if not m: continue
        k, v = m.group(1), m.group(2).strip()
        v = re.sub(r'\s+#.*$', '', v).strip()
        if v == '':
            ctx[k] = {}
            stack.append((indent + 2, ctx[k]))
            cur_key = None
        else:
            ctx[k] = v.strip('"').strip("'")
            cur_key = k
node = data
for p in parts:
    if isinstance(node, dict) and p in node:
        node = node[p]
    else:
        sys.exit(0)
print(node if not isinstance(node, dict) else '')
'@
    $tmp = [System.IO.Path]::GetTempFileName() + '.py'
    [System.IO.File]::WriteAllText($tmp, $script, [System.Text.UTF8Encoding]::new($false))
    try {
        $out = & $py $tmp $File $Key 2>$null
        if ($LASTEXITCODE -eq 0) { return ($out -join "`n").TrimEnd("`r","`n") }
        return ''
    } finally {
        Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
    }
}

# Bump 'updated:' field in a meta.yaml (in-place) to today (UTC).
function Update-YamlUpdated {
    param([Parameter(Mandatory)][string]$File)
    $today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
    $text  = Get-FileContentLF $File
    if ($text -match '(?m)^updated:.*$') {
        $text = [Regex]::Replace($text, '(?m)^updated:.*$', "updated: $today")
    } else {
        if ($text -and -not $text.EndsWith("`n")) { $text += "`n" }
        $text += "updated: $today`n"
    }
    Set-FileContentLF -Path $File -Content $text
}

# Set or update a top-level scalar key in a YAML file (string value, quoted).
function Set-YamlValue {
    param(
        [Parameter(Mandatory)][string]$File,
        [Parameter(Mandatory)][string]$Key,
        [Parameter(Mandatory)][string]$Value
    )
    $text = Get-FileContentLF $File
    $pattern = "(?m)^$([Regex]::Escape($Key)):.*$"
    if ($text -match $pattern) {
        $text = [Regex]::Replace($text, $pattern, "$($Key): `"$Value`"")
    } else {
        if ($text -and -not $text.EndsWith("`n")) { $text += "`n" }
        $text += "$($Key): `"$Value`"`n"
    }
    Set-FileContentLF -Path $File -Content $text
}

# Append a JSONL entry to run-log. $Payload is the inner JSON fragment
# (no surrounding braces, no leading ts).
function Add-RunLogEntry {
    param(
        [Parameter(Mandatory)][string]$EpicDir,
        [Parameter(Mandatory)][string]$Payload
    )
    $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    if (-not (Test-Path -LiteralPath $EpicDir)) {
        New-Item -ItemType Directory -Path $EpicDir -Force | Out-Null
    }
    $line = "{`"ts`":`"$ts`",$Payload}"
    $logPath = Join-Path $EpicDir 'run-log.jsonl'
    # Append with LF newline regardless of platform.
    [System.IO.File]::AppendAllText(
        $logPath,
        $line + "`n",
        [System.Text.UTF8Encoding]::new($false)
    )
}

# Refuse if we are on the default branch.
function Assert-NotDefaultBranch {
    $cur = (& git rev-parse --abbrev-ref HEAD).Trim()
    $def = Get-DefaultBranch
    if ($cur -eq $def) {
        Write-Stderr "ERROR: refusing to operate on default branch '$def'. Switch to the epic branch first."
        exit 1
    }
}

# Echo to stderr with [epic-workflow] prefix.
function Write-Log {
    param([Parameter(Mandatory)][string]$Message)
    Write-Stderr "[epic-workflow] $Message"
}

# Per-machine user lessons file path.
function Get-UserLessonsPath {
    # NB: $HOME is a read-only automatic variable in PowerShell; use a fresh name.
    $userHome = [Environment]::GetFolderPath('UserProfile')
    return (Join-Path $userHome '.pi\epicflow\user-lessons.md')
}

# Ensure the user-lessons file exists with the standard header.
function Initialize-UserLessons {
    $p = Get-UserLessonsPath
    if (Test-Path -LiteralPath $p) { return }
    $dir = Split-Path -Parent $p
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $header = @'
# User lessons (machine-private)

> Per-machine, per-user lessons distilled from your epics. Never auto-pushed.
> Agents read this file ALONGSIDE the framework's
> `skills/epic-feature-workflow/lessons.md`. On conflict, **user-lessons win**
> (more context-specific to your codebase / toolchain / environment).
>
> To contribute a generalizable lesson upstream to pi-epicflow itself, copy
> the entry into a PR against `skills/epic-feature-workflow/lessons.md` on
> https://github.com/shankar029/pi-epicflow — `pi-epic-complete
> --contribute-lesson L-XYZ` prints the copy-paste-friendly form.

## Lessons

'@
    Set-FileContentLF -Path $p -Content $header
}

# Append distilled lessons-candidate content for an epic. Idempotent on epic id.
function Add-UserLessonsFromCandidate {
    param(
        [Parameter(Mandatory)][string]$Candidate,
        [Parameter(Mandatory)][string]$EpicId
    )
    Initialize-UserLessons
    $p = Get-UserLessonsPath
    $existing = Get-FileContentLF $p
    if ($existing -match "## Source epic $([Regex]::Escape($EpicId))") {
        Write-Log "user-lessons.md already has entries for $EpicId; skipping append"
        return
    }
    $today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
    $cand = Get-FileContentLF $Candidate
    # Strip everything before the first `## ` and the `## Source deviations`
    # block — keep deviation entries verbatim, mirroring the bash sed pipeline.
    $i = $cand.IndexOf("`n## ")
    if ($i -ge 0) { $cand = $cand.Substring($i + 1) }
    $cand = [Regex]::Replace($cand, '(?m)^## Source deviations\s*\r?\n', '')

    $append = "`n## Source epic $EpicId`n`n_Appended $today by pi-epic-complete._`n`n$cand"
    if (-not $existing.EndsWith("`n")) { $existing += "`n" }
    Set-FileContentLF -Path $p -Content ($existing + $append)
    Write-Log "appended distilled lessons from $EpicId → $p"
}

# Resolve pi-epicflow clone path (skill_root's grandparent).
function Get-PiEpicflowClone {
    $sr = Get-SkillRoot
    if (-not $sr) { return $null }
    return (Resolve-Path (Join-Path $sr '..\..')).Path
}

# Days since the pi-epicflow clone's HEAD commit.
function Get-PiEpicflowAgeDays {
    $clone = Get-PiEpicflowClone
    if (-not $clone) { return '?' }
    if (-not (Test-Path -LiteralPath (Join-Path $clone '.git'))) { return '?' }
    $lastTs = & git -C $clone log -1 --format=%ct HEAD 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $lastTs) { return '?' }
    $nowTs = [int][double]::Parse((Get-Date -UFormat %s))
    return [int]((($nowTs - [int]$lastTs.Trim()) / 86400))
}

# Active pi-epicflow version from its package.json (best-effort).
function Get-PiEpicflowVersion {
    $clone = Get-PiEpicflowClone
    if (-not $clone) { return '?' }
    $pkg = Join-Path $clone 'package.json'
    if (-not (Test-Path -LiteralPath $pkg)) { return '?' }
    $m = Select-String -Path $pkg -Pattern '"version"\s*:\s*"([0-9.]+[^"]*)"' |
         Select-Object -First 1
    if (-not $m) { return '?' }
    return $m.Matches[0].Groups[1].Value
}

# Phase 3 stub — feature_declared_deliverables port. Phase 1 callers don't
# need it; expose a placeholder so a missing function isn't a runtime error
# if someone wires it early. Returns empty list.
function Get-FeatureDeclaredDeliverables {
    param(
        [Parameter(Mandatory)][string]$DecompPath,
        [Parameter(Mandatory)][string]$Fid
    )
    if (-not (Test-Path -LiteralPath $DecompPath)) { return @() }
    $py = Get-PythonExe
    if (-not $py) { return @() }
    $script = @'
import sys, re
p, want = sys.argv[1], sys.argv[2]
with open(p, encoding="utf-8") as f:
    cur=None; e2e=[]; mocks=[]; docs=[]; cl=False
    in_e2e=False; in_mocks=False; in_docs=False
    for raw in f:
        s = raw.rstrip("\n")
        if not s.strip() or s.lstrip().startswith("#"): continue
        if s.startswith("  - ") and "id:" in s:
            m=re.match(r"^\s*-\s*id:\s*(\S+)", s)
            cur=m.group(1).strip().strip("\"'") if m else None
            in_e2e=in_mocks=in_docs=False
            continue
        if cur!=want: continue
        m=re.match(r"^\s+(e2e_scenarios|mock_fixtures|docs_updates|changelog_entry)\s*:\s*(.*)$", s)
        if m:
            in_e2e=in_mocks=in_docs=False
            k=m.group(1); v=m.group(2).strip()
            if k=="changelog_entry":
                cl = v.lower() in ("true","yes","1")
            else:
                if v and v.startswith("[") and v.endswith("]"):
                    items=[x.strip().strip("\"'") for x in v[1:-1].split(",") if x.strip()]
                    if k=="e2e_scenarios": e2e=items
                    elif k=="mock_fixtures": mocks=items
                    elif k=="docs_updates": docs=items
                elif v=="":
                    if k=="e2e_scenarios": in_e2e=True
                    elif k=="mock_fixtures": in_mocks=True
                    elif k=="docs_updates": in_docs=True
            continue
        m=re.match(r"^\s+-\s*(.+)$", s)
        if m:
            val=m.group(1).strip().strip("\"'")
            if in_e2e: e2e.append(val)
            elif in_mocks: mocks.append(val)
            elif in_docs: docs.append(val)
            continue
        # back to top-level / new feature
        if not s.startswith(" "): in_e2e=in_mocks=in_docs=False
for p in e2e: print(f"e2e:{p}")
for p in mocks: print(f"mock:{p}")
for p in docs: print(f"doc:{p}")
if cl: print("changelog:CHANGELOG.md")
'@
    $tmp = [System.IO.Path]::GetTempFileName() + '.py'
    [System.IO.File]::WriteAllText($tmp, $script, [System.Text.UTF8Encoding]::new($false))
    try {
        $out = & $py $tmp $DecompPath $Fid 2>$null
        if ($LASTEXITCODE -ne 0) { return @() }
        if (-not $out) { return @() }
        return @($out)
    } finally {
        Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
    }
}

# ── Helpers (PowerShell-only; no bash analog) ────────────────────────────

# Locate a usable Python interpreter. Tries python3 first, then python.
function Get-PythonExe {
    foreach ($name in @('python3', 'python')) {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd) {
            # Skip the Windows Store stub that just opens the Store.
            if ($cmd.Source -and $cmd.Source -like '*\Microsoft\WindowsApps\python*.exe') {
                $sz = (Get-Item $cmd.Source -ErrorAction SilentlyContinue).Length
                if ($sz -lt 10240) { continue }
            }
            return $cmd.Source
        }
    }
    return $null
}

# Encode an arbitrary string as a JSON string value (without surrounding
# quotes). Escapes backslashes, double-quotes, and control characters per
# RFC 8259. Use this for any user-supplied value (paths, branches, titles)
# embedded into Add-RunLogEntry payloads on Windows — raw paths contain
# backslashes that produce invalid JSON otherwise. (Bash sibling has the
# same latent bug on Windows paths; tracked as v0.12.0 follow-up.)
function ConvertTo-JsonString {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Value)
    $sb = [System.Text.StringBuilder]::new()
    foreach ($ch in $Value.ToCharArray()) {
        $code = [int]$ch
        switch ($ch) {
            '"' { [void]$sb.Append('\"') }
            '\' { [void]$sb.Append('\\') }
            "`b" { [void]$sb.Append('\b') }
            "`f" { [void]$sb.Append('\f') }
            "`n" { [void]$sb.Append('\n') }
            "`r" { [void]$sb.Append('\r') }
            "`t" { [void]$sb.Append('\t') }
            default {
                if ($code -lt 0x20) {
                    [void]$sb.AppendFormat('\u{0:x4}', $code)
                } else {
                    [void]$sb.Append($ch)
                }
            }
        }
    }
    return $sb.ToString()
}

# Read a file as UTF-8 with LF-normalized content (CRLF → LF).
function Get-FileContentLF {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return '' }
    $raw = [System.IO.File]::ReadAllText($Path, [System.Text.UTF8Encoding]::new($false))
    return ($raw -replace "`r`n", "`n")
}

# Write a file as UTF-8 (no BOM) with LF line endings — parity rule #6.
function Set-FileContentLF {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][AllowEmptyString()][string]$Content
    )
    $normalized = $Content -replace "`r`n", "`n"
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText(
        $Path,
        $normalized,
        [System.Text.UTF8Encoding]::new($false)
    )
}

# Append a single LF-terminated line to a file.
function Add-FileLineLF {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Line
    )
    if (-not (Test-Path -LiteralPath $Path)) {
        Set-FileContentLF -Path $Path -Content ''
    }
    [System.IO.File]::AppendAllText(
        $Path,
        ($Line + "`n"),
        [System.Text.UTF8Encoding]::new($false)
    )
}

# Ensure a single literal line exists in $Path; append if missing. LF-safe.
function Ensure-FileLine {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Line
    )
    if (Test-Path -LiteralPath $Path) {
        $existing = Get-FileContentLF $Path
        $lines = $existing -split "`n"
        if ($lines -contains $Line) { return }
    }
    Add-FileLineLF -Path $Path -Line $Line
}
