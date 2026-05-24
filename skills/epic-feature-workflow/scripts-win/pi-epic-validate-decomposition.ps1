# pi-epic-validate-decomposition.ps1
#
# Validates the active epic's decomposition.yaml against the v0.10
# deliverables contract.
#
# v0.12.0+: validation logic lives in
# skills/epic-feature-workflow/lib/validate_decomposition.py — the bash
# sibling and this PowerShell sibling both call into the same module so
# behaviour is identical cross-platform.
#
# This script just resolves paths and forwards to the Python module.
# It mirrors the bash wrapper's --skip-toolchain-check flag and the
# toolchain-manager hint logic (inline below, since that piece is short).

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$skipToolchain = $false
foreach ($a in $args) {
    switch ($a) {
        '--skip-toolchain-check' { $skipToolchain = $true }
        '-h'      { Write-Host 'usage: pi-epic-validate-decomposition [--skip-toolchain-check]'; exit 0 }
        '--help'  { Write-Host 'usage: pi-epic-validate-decomposition [--skip-toolchain-check]'; exit 0 }
        default {
            [Console]::Error.WriteLine("unknown flag: $a")
            exit 1
        }
    }
}

$script:CallerDir = $PSScriptRoot
. "$PSScriptRoot\_common.ps1"

$repo    = Get-RepoRoot
$skill   = Get-SkillRoot
$epicDir = Get-ActiveEpicDir
$decomp  = Join-Path $epicDir 'decomposition.yaml'
$epicCfg = Join-Path $epicDir 'epic-config.yaml'

if (-not (Test-Path -LiteralPath $decomp)) {
    [Console]::Error.WriteLine("ERROR: $decomp not found")
    exit 1
}

$py = Get-PythonExe
if (-not $py) {
    [Console]::Error.WriteLine('ERROR: python3 not on PATH')
    exit 1
}

# Toolchain-check gate (kept inline since it's short and platform-shaped).
# Mirrors lines 28-86 of the bash sibling.
if (-not $skipToolchain) {
    $toolchainMgrHint = ''
    if (Test-Path -LiteralPath $epicCfg) {
        $toolchainMgrHint = Get-YamlValue $epicCfg 'toolchain_manager'
    }

    $tcScript = @'
import sys, re, os, shutil, subprocess

# args: epic_cfg, toolchain_manager_hint
epic_cfg = sys.argv[1]
mgr_hint = sys.argv[2] if len(sys.argv) > 2 else ""

required = []
in_block = False
if os.path.isfile(epic_cfg):
    with open(epic_cfg, encoding="utf-8") as f:
        for line in f:
            s = line.rstrip("\n")
            if not s.strip() or s.lstrip().startswith("#"):
                continue
            if re.match(r"^required_toolchains\s*:", s):
                rest = s.split(":", 1)[1].strip()
                if rest.startswith("["):
                    inner = rest[1:-1].strip()
                    if inner:
                        required = [x.strip().strip("\"'") for x in inner.split(",")]
                    in_block = False
                else:
                    in_block = True
                continue
            if in_block:
                m = re.match(r"^\s*-\s*(.+)$", s)
                if m:
                    required.append(m.group(1).strip().strip("\"'"))
                else:
                    in_block = False

if not required:
    sys.exit(0)

missing = []
for tool in required:
    name = tool.strip()
    if not name:
        continue
    # Allow "name@version" — only check name.
    n = name.split("@", 1)[0]
    if shutil.which(n) is None:
        missing.append(name)

if not missing:
    sys.exit(0)

print("\033[31m\u2716 L-046: required toolchains not on PATH:\033[0m", file=sys.stderr)
for m in missing:
    print(f"   - {m}", file=sys.stderr)
if mgr_hint:
    print(f"\nHint: this repo declares toolchain_manager: {mgr_hint}", file=sys.stderr)
    print("Activate it and re-run, or use --skip-toolchain-check to bypass.", file=sys.stderr)
else:
    print("\nInstall the missing toolchains and re-run, or use --skip-toolchain-check to bypass.", file=sys.stderr)
sys.exit(1)
'@
    $tmp = [System.IO.Path]::GetTempFileName() + '.py'
    [System.IO.File]::WriteAllText($tmp, $tcScript, [System.Text.UTF8Encoding]::new($false))
    try {
        & $py $tmp $epicCfg $toolchainMgrHint
        $tcExit = $LASTEXITCODE
    } finally {
        Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
    }
    if ($tcExit -ne 0) { exit $tcExit }
} else {
    [Console]::Error.WriteLine([char]0x26a0 + '  --skip-toolchain-check used: bypassing the L-046 required-toolchain gate.')
}

# Hand off to the shared validation module.
$validator = Join-Path $skill 'lib\validate_decomposition.py'
if (-not (Test-Path -LiteralPath $validator)) {
    [Console]::Error.WriteLine("ERROR: shared validator not found at $validator")
    [Console]::Error.WriteLine('  Did pi-epicflow install correctly?')
    exit 2
}

& $py $validator $decomp $repo $epicCfg
exit $LASTEXITCODE
